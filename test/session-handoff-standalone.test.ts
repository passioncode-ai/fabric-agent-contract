import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { snapshotFromFixture } from "../src/session-handoff.js";

// REQ-08 (contract review 2026-10-21): the header of src/session-handoff.ts promises that a consumer copies the file
// byte for byte and runs it under `node --experimental-strip-types`. These tests hold the file to that promise.
const root = projectRoot();
const source = path.join(root, "src/session-handoff.ts");
const scratch = mkdtempSync(path.join(tmpdir(), "session-handoff-standalone-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** Every static import whose specifier is not a `node:` built-in and that brings in at least one value, not only types. */
function valueImportsOutsideNode(text: string): string[] {
  const offenders: string[] = [];
  const statement = /^\s*import\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["'];?/gm;
  for (const match of text.matchAll(statement)) {
    const [whole, typeOnly, clause = "", specifier = ""] = match;
    if (specifier.startsWith("node:") || typeOnly) continue;
    const named = /^\{([\s\S]*)\}$/.exec(clause.trim());
    const members = named ? (named[1] ?? "").split(",").map((member) => member.trim()).filter(Boolean) : [clause.trim()];
    if (members.some((member) => !member.startsWith("type "))) offenders.push(whole.trim());
  }
  for (const match of text.matchAll(/^\s*import\s+["']([^"']+)["'];?/gm)) if (!(match[1] ?? "").startsWith("node:")) offenders.push(match[0].trim());
  return offenders;
}

describe("src/session-handoff.ts loads on its own", () => {
  it("imports no value from outside Node's built-ins", () => {
    expect(valueImportsOutsideNode(readFileSync(source, "utf8"))).toEqual([]);
  });

  it("recognises the import forms it refuses and the ones it allows", () => {
    expect(valueImportsOutsideNode('import { show } from "./findings.js";')).toHaveLength(1);
    expect(valueImportsOutsideNode('import { type Finding, show } from "./findings.js";')).toHaveLength(1);
    expect(valueImportsOutsideNode('import kit from "./kit.js";')).toHaveLength(1);
    expect(valueImportsOutsideNode('import "./side-effect.js";')).toHaveLength(1);
    expect(valueImportsOutsideNode('import type { Finding } from "./findings.js";')).toEqual([]);
    expect(valueImportsOutsideNode('import { type Finding } from "./findings.js";')).toEqual([]);
    expect(valueImportsOutsideNode('import path from "node:path";\nimport { readFileSync } from "node:fs";')).toEqual([]);
  });

  it("carries a copy of findings.ts's show that agrees with the original", () => {
    const body = (text: string) => /function show\(value: unknown\): string \{[\s\S]*?\n\}/.exec(text)?.[0];
    const original = body(readFileSync(path.join(root, "src/findings.ts"), "utf8"));
    expect(original).toBeDefined();
    expect(body(readFileSync(source, "utf8"))).toBe(original?.replace("export ", ""));
  });

  it("shows a value its own String() cannot, as the original does", () => {
    const unprintable = Object.assign(() => undefined, { toString: 1 });
    const snapshot = snapshotFromFixture({ mode: 700, path: { toString: 1 }, entries: { "context.md": { mode: unprintable, text: "c" } } });
    expect([snapshot.mode, snapshot.path, snapshot.entries["context.md"]?.mode]).toEqual(["700", '{"toString":1}', "function"]);
  });

  it("is imported by plain Node with type stripping from a folder that holds nothing else", { timeout: 30000 }, () => {
    const copy = path.join(scratch, "session-handoff.ts");
    copyFileSync(source, copy);
    const script = `const h = await import(${JSON.stringify(copy)}); process.stdout.write(JSON.stringify({ format: h.HANDOFF_FORMAT, read: typeof h.readSessionHandoff, findings: h.sessionHandoffManifestFindings({}).length >= 0 }));`;
    const out = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", script], { cwd: scratch, timeout: 20000, encoding: "utf8" });
    expect(JSON.parse(out)).toEqual({ format: "session-handoff/1", read: "function", findings: true });
  });
});
