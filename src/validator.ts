import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";
import { loadSchemas, loadSchemasSync, type ContractSchema } from "./contract.js";

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

/** `verbose` makes each error carry the schema object it failed in (`parentSchema`), which the formatter reads. */
export interface ValidatorOptions { verbose?: boolean }

function withSchemas(schemas: ContractSchema[], options: ValidatorOptions = {}): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: true, ...(options.verbose === true ? { verbose: true } : {}) });
  const addFormats = addFormatsImport as unknown as (instance: Ajv2020) => Ajv2020;
  addFormats(ajv);
  for (const schema of schemas) ajv.addSchema(schema);
  return ajv;
}

export async function createValidator(options?: ValidatorOptions): Promise<Ajv2020> {
  return withSchemas(await loadSchemas(), options);
}

/** The same validator, built synchronously. */
export function createValidatorSync(options?: ValidatorOptions): Ajv2020 {
  return withSchemas(loadSchemasSync(), options);
}

export function validateDocument(validator: Ajv2020, schemaId: string, value: unknown): ValidationResult {
  const validate = validator.getSchema(schemaId) as ValidateFunction | undefined;
  if (!validate) throw new Error(`Unknown schema: ${schemaId}`);
  const valid = validate(value);
  return { valid: valid === true, errors: [...(validate.errors ?? [])] };
}

// #region schema-errors (docs: docs/specification/conformance.md#the-checker)
/** One schema problem as an author reads it: where, which keyword, and what to change. */
export interface SchemaProblem { instancePath: string; keyword: string; message: string }

const WRAPPERS = new Set(["anyOf", "oneOf", "if"]);
const quoted = (value: unknown) => JSON.stringify(value) ?? String(value);
const under = (path: string, parent: string) => path === parent || path.startsWith(`${parent}/`);
/** True for a oneOf that failed because more than one branch matched: a problem of its own, never collapsed. */
const ambiguous = (error: ErrorObject) => error.keyword === "oneOf" && Array.isArray(error.params.passingSchemas);

function message(error: ErrorObject): string {
  const params = error.params as Record<string, unknown>;
  switch (error.keyword) {
    case "enum": return `must be one of ${(params.allowedValues as unknown[]).map(quoted).join(", ")}`;
    case "const": return `must be ${quoted(params.allowedValue)}`;
    case "required": return `is missing the required member ${quoted(params.missingProperty)}`;
    case "oneOf":
      if (ambiguous(error)) return `matches more than one branch (branches ${(params.passingSchemas as number[]).join(" and ")}); it must match exactly one`;
      break;
    case "additionalProperties": {
      const parent = error.parentSchema as { properties?: Record<string, unknown> } | undefined;
      const text = `has the member ${quoted(params.additionalProperty)}, which the schema does not define`;
      return parent?.properties !== undefined && Object.hasOwn(parent.properties, "extensions") ? `${text}; vendor data goes under "extensions", keyed by an absolute URI` : text;
    }
  }
  return error.message ?? `is not valid (${error.keyword})`;
}

/**
 * REQ-04 (contract review 2026-10-21): Ajv's errors as an author reads them. An `anyOf`, `oneOf` or `if` wrapper is
 * dropped when a leaf error sits at or under its instance path (the leaf says what to change; the wrapper only says
 * that some branch failed), except a `oneOf` that matched more than one branch. `enum` and `const` name their allowed
 * values, `required` the missing member, `additionalProperties` the extra member and, where the object's schema has
 * an `extensions` member (errors from a validator built with `verbose`), where vendor data goes. A bad member name is
 * one line at that member's path. Order is kept.
 */
export function formatSchemaErrors(errors: readonly ErrorObject[]): SchemaProblem[] {
  const leaves = errors.filter((error) => !WRAPPERS.has(error.keyword));
  // A bad member name is one problem: Ajv reports the inner keyword (it carries `propertyName`) and then the
  // `propertyNames` wrapper, both at the object. Keep the inner one, at the member's own path, naming the member.
  const named = new Set(errors.flatMap((error) => (typeof error.propertyName === "string" ? [`${error.instancePath}\u0000${error.propertyName}`] : [])));
  return errors
    .filter((error) => !(error.keyword === "propertyNames" && named.has(`${error.instancePath}\u0000${String(error.params.propertyName)}`)))
    .filter((error) => !WRAPPERS.has(error.keyword) || ambiguous(error) || !leaves.some((leaf) => under(leaf.instancePath, error.instancePath)))
    .map((error) => typeof error.propertyName === "string"
      ? { instancePath: `${error.instancePath}/${error.propertyName.replace(/~/g, "~0").replace(/\//g, "~1")}`, keyword: error.keyword, message: `the member name ${quoted(error.propertyName)} ${message(error)}` }
      : { instancePath: error.instancePath, keyword: error.keyword, message: message(error) });
}
// #endregion schema-errors
