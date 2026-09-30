import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";
import { loadSchemas } from "./contract.js";

export interface ValidationResult {
  valid: boolean;
  errors: ErrorObject[];
}

export async function createValidator(): Promise<Ajv2020> {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const addFormats = addFormatsImport as unknown as (instance: Ajv2020) => Ajv2020;
  addFormats(ajv);
  for (const schema of await loadSchemas()) ajv.addSchema(schema);
  return ajv;
}

export function validateDocument(validator: Ajv2020, schemaId: string, value: unknown): ValidationResult {
  const validate = validator.getSchema(schemaId) as ValidateFunction | undefined;
  if (!validate) throw new Error(`Unknown schema: ${schemaId}`);
  const valid = validate(value);
  return { valid: valid === true, errors: [...(validate.errors ?? [])] };
}
