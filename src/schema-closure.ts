import { readFileSync } from "node:fs";
import path from "node:path";

// #region schema-closure — docs: docs/specification/adoption.md#vendoring-schemas
/**
 * The schema files a consumer must copy to validate one schema: the schema itself and every file its `$ref`s reach,
 * transitively. A consumer that copies schemas by a name prefix misses the ones a later decision adds (a device check-in
 * now refers to `heartbeat`, `revocation-delta` and `window-lease`), and its validator then fails on every document.
 */
export function schemaClosure(schemasDir: string, schema: string): string[] {
  const seen = new Set<string>();
  const queue = [schema];
  while (queue.length) {
    const file = queue.shift() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    const text = readFileSync(path.join(schemasDir, file), "utf8");
    for (const match of text.matchAll(/"\$ref":\s*"([^"#]+\.schema\.json)(?:#[^"]*)?"/g)) queue.push(path.basename(match[1] as string));
  }
  return [...seen].sort();
}

/**
 * The source files a consumer must copy to run one of this repository's modules: the file and every relative module it
 * imports, transitively (`./x.js` resolved to `x.ts`). A consumer that vendors `device-rules.ts` without the files it
 * imports — `protocol-revisions.ts` since DEC-0067 — fails to load it.
 */
export function sourceClosure(srcDir: string, file: string): string[] {
  const seen = new Set<string>();
  const queue = [file];
  while (queue.length) {
    const next = queue.shift() as string;
    if (seen.has(next)) continue;
    seen.add(next);
    const text = readFileSync(path.join(srcDir, next), "utf8");
    for (const match of text.matchAll(/from\s+"\.\/([^"]+)\.js"/g)) queue.push(`${match[1] as string}.ts`);
  }
  return [...seen].sort();
}
// #endregion schema-closure
