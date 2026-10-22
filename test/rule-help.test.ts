import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { withHelp } from "../src/findings.js";
import { registerRows, ruleCodeFindings, ruleHelp } from "../src/rule-codes.js";

// REQ-05 (contract review 2026-10-21): a finding can carry a `help` link to the row that defines its rule. The link
// is built from the register; this test holds every code a rule emits to a link whose page has that anchor.
const root = projectRoot();
const specDir = path.join(root, "docs/specification");
const read = (file: string) => readFileSync(file, "utf8");
const register = read(path.join(specDir, "conformance.md"));

describe("rule help links (REQ-05)", () => {
  const help = ruleHelp(register);

  it("every code a source in src/ names resolves to an anchor on the page that defines it", () => {
    const emitted = new Set(readdirSync(path.join(root, "src")).filter((name) => name.endsWith(".ts"))
      .flatMap((name) => [...read(path.join(root, "src", name)).matchAll(/["'`](FAC-SEM-\d{3})["'`]/g)].map((match) => match[1] as string)));
    expect(emitted.size).toBeGreaterThan(100);
    const unresolved: string[] = [];
    for (const code of emitted) {
      const link = help.get(code);
      const match = /^docs\/specification\/([a-z-]+\.md)#(fac-sem-\d{3})$/.exec(link ?? "");
      if (!match) { unresolved.push(`${code}: ${String(link)}`); continue; }
      const page = read(path.join(specDir, match[1] as string));
      const row = new RegExp(`^\\| <a id="${match[2]}"></a>\`${code}\` \\|`, "m");
      if (!row.test(page)) unresolved.push(`${code}: ${link as string} has no anchored definition row`);
    }
    expect(unresolved).toEqual([]);
  });

  it("links a code defined in the register to the register and a later code to its specification", () => {
    expect(help.get("FAC-SEM-001")).toBe("docs/specification/conformance.md#fac-sem-001");
    expect(help.get("FAC-SEM-057")).toBe("docs/specification/profiles.md#fac-sem-057");
    expect(help.get("FAC-SEM-015")).toBe("docs/specification/provider.md#fac-sem-015");
    expect(help.size).toBe(registerRows(register).length);
  });

  it("withHelp adds the link to a finding with a known code and leaves any other finding as it was", () => {
    const findings = withHelp([
      { code: "FAC-SEM-057", instancePath: "/a", message: "m" },
      { code: "FAC-SEM-999", instancePath: "/b", message: "n", severity: "accepted" }
    ], help);
    expect(findings).toEqual([
      { code: "FAC-SEM-057", instancePath: "/a", message: "m", help: "docs/specification/profiles.md#fac-sem-057" },
      { code: "FAC-SEM-999", instancePath: "/b", message: "n", severity: "accepted" }
    ]);
  });

  it("G-13 refuses a definition row without its anchor, or with another code's", () => {
    const registerText = "## Semantic rule codes\n\n**Next free rule code:** `FAC-SEM-002`\n\n| Code | Kind | Defined in |\n|---|---|---|\n| <a id=\"fac-sem-000\"></a>`FAC-SEM-000` | any | here |\n| `FAC-SEM-001` | `x` | [runners](runners.md#semantic-rules) |\n";
    const source = { path: "src/rules.ts", text: '"FAC-SEM-000" "FAC-SEM-001"' };
    const spec = (row: string) => ({ path: "docs/specification/runners.md", text: `## Semantic rules\n\n| Code | Kind | Rule |\n|---|---|---|\n${row}\n` });
    expect(ruleCodeFindings({ path: "conformance.md", text: registerText }, [spec('| <a id="fac-sem-001"></a>`FAC-SEM-001` | `x` | a rule |')], [source])).toEqual([]);
    expect(ruleCodeFindings({ path: "conformance.md", text: registerText }, [spec("| `FAC-SEM-001` | `x` | a rule |")], [source])).toEqual([
      'docs/specification/runners.md: FAC-SEM-001 is defined without its anchor <a id="fac-sem-001"></a> (REQ-05)'
    ]);
    expect(ruleCodeFindings({ path: "conformance.md", text: registerText }, [spec('| <a id="fac-sem-007"></a>`FAC-SEM-001` | `x` | a rule |')], [source])).toEqual([
      'docs/specification/runners.md: FAC-SEM-001 is defined without its anchor <a id="fac-sem-001"></a> (REQ-05)'
    ]);
    const unanchoredRegister = registerText.replace('<a id="fac-sem-000"></a>', "");
    expect(ruleCodeFindings({ path: "conformance.md", text: unanchoredRegister }, [spec('| <a id="fac-sem-001"></a>`FAC-SEM-001` | `x` | a rule |')], [source])).toEqual([
      'conformance.md: FAC-SEM-000 is defined without its anchor <a id="fac-sem-000"></a> (REQ-05)'
    ]);
  });
});
