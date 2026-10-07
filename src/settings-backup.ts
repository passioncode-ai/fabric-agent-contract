import { createHash } from "node:crypto";
import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region settings-backup — docs: docs/specification/service.md#settings-backup
/** The one format string of a settings backup file (DEC-0025). */
export const SETTINGS_BACKUP_FORMAT = "fabric-settings-backup/1" as const;

/** Unicode code-point order, which is how the canonical form sorts keys. JavaScript's default
 *  string order compares UTF-16 code units and differs above U+FFFF. */
function byCodePoint(a: string, b: string): number {
  const x = Array.from(a), y = Array.from(b);
  for (let i = 0; i < Math.min(x.length, y.length); i += 1) {
    const d = (x[i]!.codePointAt(0) ?? 0) - (y[i]!.codePointAt(0) ?? 0);
    if (d !== 0) return d;
  }
  return x.length - y.length;
}

/**
 * The canonical JSON text of a value, as `docs/specification/service.md#settings-backup` defines
 * it: object keys sorted by code point at every level, `", "` between members and elements,
 * `": "` after a key, strings escaped as JSON requires and nothing else escaped, integers in
 * decimal. It equals Python's `json.dumps(value, sort_keys=True, ensure_ascii=False)`, which is
 * how a service in either language computes the same checksum.
 */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${value} has no canonical form: a settings backup stores a fraction as a string`);
    return String(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(", ")}]`;
  if (isObject(value)) {
    const keys = Object.keys(value).sort(byCodePoint);
    return `{${keys.map((key) => `${JSON.stringify(key)}: ${canonicalJson(value[key])}`).join(", ")}}`;
  }
  throw new TypeError(`${typeof value} is not a JSON value`);
}

/** The `sha256` a settings backup carries: SHA-256 of the UTF-8 canonical JSON of `tables`. */
export function settingsBackupDigest(tables: unknown): string {
  return createHash("sha256").update(canonicalJson(tables), "utf8").digest("hex");
}

/** A string a JSON writer can encode to UTF-8: no lone surrogate. */
const wellFormed = (text: string) => !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text);

/**
 * FAC-SEM-035 (DEC-0025): a settings backup is intact — its checksum is the digest of its tables,
 * its counts name exactly its tables and their row counts, every row is as wide as its columns,
 * and every value has a canonical form. A reader MUST refuse a file this rule flags.
 */
export function settingsBackupRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const tables = isObject(value.tables) ? value.tables : {};
  const counts = isObject(value.counts) ? value.counts : {};
  let canonical = true;
  for (const [name, table] of Object.entries(tables)) {
    if (!isObject(table)) continue;
    const width = Array.isArray(table.columns) ? table.columns.length : 0;
    const rows = Array.isArray(table.rows) ? table.rows : [];
    rows.forEach((row, i) => {
      const at = `/tables/${name}/rows/${i}`;
      if (!Array.isArray(row)) return;
      if (row.length !== width) findings.push({ code: "FAC-SEM-035", instancePath: at, message: `row has ${row.length} values for ${width} columns` });
      row.forEach((cell, j) => {
        if (typeof cell === "number" && !Number.isSafeInteger(cell)) {
          canonical = false;
          findings.push({ code: "FAC-SEM-035", instancePath: `${at}/${j}`, message: "a fraction or an unsafe integer has no canonical form; store it as a string" });
        }
        if (typeof cell === "string" && !wellFormed(cell)) {
          canonical = false;
          findings.push({ code: "FAC-SEM-035", instancePath: `${at}/${j}`, message: "a string with a lone surrogate cannot be encoded as UTF-8" });
        }
      });
    });
    if (counts[name] !== rows.length) findings.push({ code: "FAC-SEM-035", instancePath: `/counts/${name}`, message: `counts says ${String(counts[name] ?? "nothing")} for ${rows.length} rows` });
  }
  for (const name of Object.keys(counts)) {
    if (!Object.hasOwn(tables, name)) findings.push({ code: "FAC-SEM-035", instancePath: `/counts/${name}`, message: `counts names ${name}, which the backup does not carry` });
  }
  if (canonical && value.sha256 !== settingsBackupDigest(tables)) {
    findings.push({ code: "FAC-SEM-035", instancePath: "/sha256", message: "the checksum does not match the tables: the file is damaged and a reader refuses it" });
  }
  return findings;
}
// #endregion settings-backup
