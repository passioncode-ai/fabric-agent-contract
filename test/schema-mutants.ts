import { readFile } from "node:fs/promises";
import path from "node:path";
import { Ajv2020, type ValidateFunction } from "ajv/dist/2020.js";
import addFormatsImport from "ajv-formats";
import { type ContractSchema, loadSchemas, projectRoot } from "../src/contract.js";

// A planted defect, run as a test: each mutant removes or weakens one constraint of a schema, and the catalogue's
// negative fixtures for that schema must then contain one that the mutant accepts: the fixture that kills it. A
// mutant that survives every fixture is a constraint no fixture proves (wave 3's standard, board run 2026-10-11).

interface Entry { name: string; schema: string; path: string; valid: boolean }
interface Negative { name: string; value: unknown }
const root = projectRoot();

/** One mutant: a name and the change it makes to a deep copy of the schema. */
export interface Mutant { name: string; mutate: (schema: Record<string, any>) => void }

// Read once per test file (module scope), never per mutant: the schemas, the catalogue and each schema's parsed
// negative fixtures do not change during a run. Only the mutated schema is cloned, and every mutant gets its own Ajv
// instance, because Ajv caches what it compiled under the schema's $id.
let schemasOnce: Promise<ContractSchema[]> | undefined;
let catalogueOnce: Promise<Entry[]> | undefined;
const negativesOnce = new Map<string, Promise<Negative[]>>();

function schemas(): Promise<ContractSchema[]> {
  schemasOnce ??= loadSchemas();
  return schemasOnce;
}

function negatives(fixturesOf: string): Promise<Negative[]> {
  let found = negativesOnce.get(fixturesOf);
  if (!found) {
    catalogueOnce ??= readFile(path.join(root, "fixtures/catalogue.json"), "utf8").then((text) => JSON.parse(text) as Entry[]);
    found = catalogueOnce.then((catalogue) =>
      Promise.all(
        catalogue
          .filter((entry) => entry.schema === fixturesOf && !entry.valid)
          .map(async (entry) => ({ name: entry.name, value: JSON.parse(await readFile(path.join(root, "fixtures", entry.path), "utf8")) as unknown }))
      )
    );
    negativesOnce.set(fixturesOf, found);
  }
  return found;
}

/**
 * The negative fixtures of `fixturesOf` (by default `schemaFile` itself) that `mutant` of `schemaFile` accepts, by
 * catalogue name. A shared definition (`comms-common`) is mutated in place and proven by the fixtures of the schema that
 * refers to it.
 */
export async function killers(schemaFile: string, mutant: Mutant, fixturesOf: string = schemaFile): Promise<string[]> {
  const all = await schemas();
  const target = all.find((schema) => schema.$id.endsWith(`/schemas/${schemaFile}`));
  if (!target) throw new Error(`unknown schema ${schemaFile}`);
  const mutated = structuredClone(target) as ContractSchema & Record<string, any>;
  mutant.mutate(mutated);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  (addFormatsImport as unknown as (instance: Ajv2020) => Ajv2020)(ajv);
  for (const schema of all) ajv.addSchema(schema === target ? mutated : schema);
  const validated = all.find((schema) => schema.$id.endsWith(`/schemas/${fixturesOf}`));
  if (!validated) throw new Error(`unknown schema ${fixturesOf}`);
  const validate = ajv.getSchema(validated.$id) as ValidateFunction;
  const accepted: string[] = [];
  for (const entry of await negatives(fixturesOf)) {
    if (validate(entry.value) === true) accepted.push(entry.name);
  }
  return accepted;
}
