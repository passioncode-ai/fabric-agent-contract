import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";

// A protocol claim is not current unless its revision and retrieval date are recorded (docs/evidence/retro.md):
// every external page a specification links, and every RFC it names, has a row in the source ledger.
const root = projectRoot();
const ledger = readFileSync(path.join(root, "docs/evidence/sources.md"), "utf8");
const specDir = path.join(root, "docs/specification");
const specs = readdirSync(specDir).filter((name) => name.endsWith(".md")).map((name) => [name, readFileSync(path.join(specDir, name), "utf8")] as const);
const normalise = (url: string) => url.split("#")[0]!.replace(/\/$/, "");

describe("the source ledger", () => {
  it("has a row for every external page a specification links", () => {
    const missing: string[] = [];
    for (const [name, text] of specs) {
      for (const match of text.matchAll(/\((https?:\/\/[^)\s]+)\)|<(https?:\/\/[^>\s]+)>/g)) {
        const url = normalise(match[1] ?? match[2] ?? "");
        if (url.includes("github.com/passioncode-ai/")) continue;
        if (!ledger.includes(url)) missing.push(`${name}: ${url}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("has a row for every RFC a specification or decision names", () => {
    const decisions = readFileSync(path.join(root, "docs/DECISIONS.md"), "utf8");
    const named = new Set<string>();
    for (const text of [decisions, ...specs.map(([, text]) => text)]) for (const match of text.matchAll(/RFC ?(\d{3,5})\b/g)) named.add(match[1]!);
    const missing = [...named].filter((rfc) => !new RegExp(`RFC ?${rfc}\\b`).test(ledger)).sort();
    expect(missing).toEqual([]);
  });

  it("pins every row: no row says only that it was not re-fetched", () => {
    expect(ledger).not.toMatch(/not re-fetched in this run/);
  });
});
