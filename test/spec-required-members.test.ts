import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";

// REQ-11 of the contract review of 2026-10-21: a table an author reads to learn which members a document needs says
// exactly what its schema requires. A table is marked by `<!-- required-members: <schema file> -->` on a line before
// it; its "Required" column says `yes` (the schema's top-level `required`), `local placement` (required by an `else`
// branch of the schema's top-level `allOf`, which is a local placement's) or `no`. The schema is read at test time.

const root = projectRoot();

interface Row { member: string; required: string }
interface Table { file: string; schema: string; rows: Row[] }

function tablesIn(text: string, file: string): Table[] {
  const tables: Table[] = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const marker = /^<!-- required-members: (\S+\.schema\.json) -->$/.exec(lines[index] ?? "");
    if (!marker) continue;
    let header = index + 1;
    while ((lines[header] ?? "").trim() === "") header += 1;
    const cells = (line: string) => line.split("|").slice(1, -1).map((cell) => cell.trim());
    const columns = cells(lines[header] ?? "");
    const at = columns.indexOf("Required");
    if (!(lines[header] ?? "").startsWith("|") || at < 0) throw new Error(`${file}:${index + 1}: the marker is not followed by a table with a Required column`);
    const rows: Row[] = [];
    for (let row = header + 2; (lines[row] ?? "").startsWith("|"); row += 1) {
      const values = cells(lines[row] as string);
      const member = /`([A-Za-z][A-Za-z0-9]*)`/.exec(values[0] ?? "")?.[1];
      if (!member) throw new Error(`${file}:${row + 1}: a row names no member`);
      rows.push({ member, required: values[at] ?? "" });
    }
    tables.push({ file, schema: marker[1] as string, rows });
  }
  return tables;
}

interface Schema { required?: string[]; properties?: Record<string, unknown>; allOf?: Array<{ else?: { required?: string[] } }> }
const schemaOf = (name: string) => JSON.parse(readFileSync(path.join(root, "schemas", name), "utf8")) as Schema;
const sorted = (values: Iterable<string>) => [...new Set(values)].sort();

const files = ["docs/specification/provider.md", "docs/specification/service.md"];
const tables = files.flatMap((file) => tablesIn(readFileSync(path.join(root, file), "utf8"), file));

describe("required-member tables equal their schemas (REQ-11)", () => {
  it("finds the provider entry's, the descriptor's and the well-known document's", () => {
    expect(tables.map((table) => table.schema).sort()).toEqual(["provider.schema.json", "service-descriptor.schema.json", "service-well-known.schema.json"]);
  });

  it.each(tables.map((table) => [`${table.file} ${table.schema}`, table] as const))("%s", (_name, table) => {
    const schema = schemaOf(table.schema);
    expect(table.rows.every((row) => ["yes", "no", "local placement"].includes(row.required)), JSON.stringify(table.rows)).toBe(true);
    expect(sorted(table.rows.filter((row) => row.required === "yes").map((row) => row.member))).toEqual(sorted(schema.required ?? []));
    const local = (schema.allOf ?? []).flatMap((branch) => branch.else?.required ?? []);
    expect(sorted(table.rows.filter((row) => row.required === "local placement").map((row) => row.member))).toEqual(sorted(local));
    for (const row of table.rows) expect(Object.keys(schema.properties ?? {}), `${row.member} is not a member of ${table.schema}`).toContain(row.member);
  });

  it("catches a table that drops or adds a required member", () => {
    const text = "<!-- required-members: provider.schema.json -->\n\n| Field | Required |\n|---|---|\n| `protocol` | yes |\n| `summary` | yes |\n";
    const [table] = tablesIn(text, "x.md");
    expect(table?.rows).toEqual([{ member: "protocol", required: "yes" }, { member: "summary", required: "yes" }]);
    expect(sorted((table?.rows ?? []).map((row) => row.member))).not.toEqual(sorted(schemaOf("provider.schema.json").required ?? []));
    expect(() => tablesIn("<!-- required-members: provider.schema.json -->\n\ntext\n", "x.md")).toThrow(/Required column/);
  });
});
