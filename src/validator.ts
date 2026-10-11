import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";
import { loadSchemas, loadSchemasSync, type ContractSchema } from "./contract.js";

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

function withSchemas(schemas: ContractSchema[]): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const addFormats = addFormatsImport as unknown as (instance: Ajv2020) => Ajv2020;
  addFormats(ajv);
  for (const schema of schemas) ajv.addSchema(schema);
  return ajv;
}

export async function createValidator(): Promise<Ajv2020> {
  return withSchemas(await loadSchemas());
}

/** The same validator, built synchronously. */
export function createValidatorSync(): Ajv2020 {
  return withSchemas(loadSchemasSync());
}

export function validateDocument(validator: Ajv2020, schemaId: string, value: unknown): ValidationResult {
  const validate = validator.getSchema(schemaId) as ValidateFunction | undefined;
  if (!validate) throw new Error(`Unknown schema: ${schemaId}`);
  const valid = validate(value);
  return { valid: valid === true, errors: [...(validate.errors ?? [])] };
}
