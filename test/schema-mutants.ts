import { readFile } from "node:fs/promises";
import path from "node:path";
import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";
import { type ContractSchema, loadSchemas, projectRoot } from "../src/contract.js";

// A planted defect, run as a test: each mutant removes or weakens one constraint of a schema, and the catalogue's
// negative fixtures for that schema must then contain one that the mutant accepts — the fixture that kills it. A
// mutant that survives every fixture is a constraint no fixture proves (wave 3's standard, board run 2026-10-11).

interface Entry { name: string; schema: string; path: string; valid: boolean }
const root = projectRoot();

/** One mutant: a name and the change it makes to a deep copy of the schema. */
export interface Mutant { name: string; mutate: (schema: Record<string, any>) => void }

/**
 * The negative fixtures of `fixturesOf` (by default `schemaFile` itself) that `mutant` of `schemaFile` accepts, by
 * catalogue name. A shared definition (`comms-common`) is mutated in place and proven by the fixtures of the schema that
 * refers to it.
 */
export async function killers(schemaFile: string, mutant: Mutant, fixturesOf: string = schemaFile): Promise<string[]> {
  const schemas = await loadSchemas();
  const target = schemas.find((schema) => schema.$id.endsWith(`/schemas/${schemaFile}`));
  if (!target) throw new Error(`unknown schema ${schemaFile}`);
  const mutated = structuredClone(target) as ContractSchema & Record<string, any>;
  mutant.mutate(mutated);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  (addFormatsImport as unknown as (instance: Ajv2020) => Ajv2020)(ajv);
  for (const schema of schemas) ajv.addSchema(schema === target ? mutated : schema);
  const validated = schemas.find((schema) => schema.$id.endsWith(`/schemas/${fixturesOf}`));
  if (!validated) throw new Error(`unknown schema ${fixturesOf}`);
  const validate = ajv.getSchema(validated.$id) as ValidateFunction;
  const catalogue = JSON.parse(await readFile(path.join(root, "fixtures/catalogue.json"), "utf8")) as Entry[];
  const negatives = catalogue.filter((entry) => entry.schema === fixturesOf && !entry.valid);
  const accepted: string[] = [];
  for (const entry of negatives) {
    const value = JSON.parse(await readFile(path.join(root, "fixtures", entry.path), "utf8")) as unknown;
    if (validate(value) === true) accepted.push(entry.name);
  }
  return accepted;
}
