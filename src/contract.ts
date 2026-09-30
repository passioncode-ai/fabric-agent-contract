import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const CONTRACT_VERSION = "0.1.0" as const;
export const SCHEMA_PREFIX = `https://fabric.passioncode.ai/agent-contract/${CONTRACT_VERSION}/` as const;

export interface ContractSchema {
  $schema: string;
  $id: string;
  title?: string;
  [key: string]: unknown;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function projectRoot(): string {
  return root;
}

export async function loadSchemas(): Promise<ContractSchema[]> {
  const directory = path.join(root, "schemas");
  const names = (await readdir(directory)).filter((name) => name.endsWith(".schema.json")).sort();
  return Promise.all(names.map(async (name) => JSON.parse(await readFile(path.join(directory, name), "utf8")) as ContractSchema));
}
