import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { canonicalJson, settingsBackupDigest } from "../src/settings-backup.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0025: fabric-settings-backup/1 — a snapshot of operator decisions kept outside the data
// directory, refused by a reader when its checksum does not match.
type Backup = { sha256: string; counts: Record<string, number>; tables: Record<string, { columns: string[]; rows: unknown[][] }> };
const load = (relative: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", relative), "utf8")) as Backup;
const validator = await createValidator();
const schemaValid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/settings-backup.schema.json`, value);
const findings = (value: unknown) => evaluateSemanticRules("settings-backup", value);
const codes = (value: unknown) => findings(value).map((finding) => finding.code);

describe("fabric-settings-backup/1 (DEC-0025, FAC-SEM-028)", () => {
  it("accepts the positive fixture by schema and by FAC-SEM-028", () => {
    const backup = load("positive/settings-backup.json");
    expect(schemaValid(backup).valid).toBe(true);
    expect(codes(backup)).toEqual([]);
  });

  it("computes the checksum the fixture carries, which Python's json.dumps(sort_keys=True, ensure_ascii=False) produced", () => {
    const backup = load("positive/settings-backup.json");
    expect(settingsBackupDigest(backup.tables)).toBe(backup.sha256);
    expect(backup.sha256).toBe("2f062da02074e28a717955e1a6b3283bb6385265c56f2093f192667b24e7c937");
  });

  it("writes the canonical form: sorted keys, comma-space and colon-space, literal non-ASCII", () => {
    expect(canonicalJson({ b: [1, "é\n\"x\"", true], a: null, c: {} })).toBe('{"a": null, "b": [1, "é\\n\\"x\\"", true], "c": {}}');
    expect(canonicalJson({ "\u{1F600}": 1, "￿": 2 })).toBe('{"￿": 2, "\u{1F600}": 1}');
  });

  it("refuses a file whose rows changed after the checksum was written", () => {
    const damaged = load("semantic/settings-backup-bad-checksum.json");
    expect(schemaValid(damaged).valid).toBe(true);
    expect(findings(damaged)).toContainEqual(expect.objectContaining({ code: "FAC-SEM-028", instancePath: "/sha256" }));
  });

  it("refuses counts that do not match the rows or name a table that is not there", () => {
    const backup = load("positive/settings-backup.json");
    backup.counts.projects = 3;
    backup.counts.archive = 0;
    const paths = findings(backup).map((finding) => finding.instancePath);
    expect(paths).toContain("/counts/projects");
    expect(paths).toContain("/counts/archive");
  });

  it("refuses a row narrower or wider than its columns", () => {
    const backup = load("positive/settings-backup.json");
    backup.tables.secret_bindings!.rows[0]!.pop();
    backup.sha256 = settingsBackupDigest(backup.tables);
    expect(findings(backup).map((finding) => finding.instancePath)).toEqual(["/tables/secret_bindings/rows/0"]);
  });

  it("refuses a value without a canonical form: a fraction or a lone surrogate", () => {
    const fraction = load("negative/settings-backup-fraction.json");
    expect(schemaValid(fraction).valid).toBe(false);
    expect(codes(fraction)).toContain("FAC-SEM-028");
    expect(() => canonicalJson(0.2)).toThrow(TypeError);
    const surrogate = load("positive/settings-backup.json");
    surrogate.tables.projects!.rows[0]![1] = "half \uD800 a pair";
    expect(findings(surrogate)).toContainEqual(expect.objectContaining({ instancePath: "/tables/projects/rows/0/1" }));
  });

  it("refuses tables that hold connections, sessions, login codes or credentials, and keeps bindings by name", () => {
    const backup = load("positive/settings-backup.json");
    const withTable = (name: string) => ({ ...backup, counts: { ...backup.counts, [name]: 0 }, tables: { ...backup.tables, [name]: { columns: ["id"], rows: [] } } });
    for (const name of ["account_connections", "account_connection_drafts", "operator_sessions", "sessions", "login_codes", "api_tokens", "store_credentials", "secrets"]) {
      expect(schemaValid(withTable(name)).valid, name).toBe(false);
    }
    for (const name of ["project_secret_bindings", "work_sessions", "token_slots", "connection_rules"]) {
      expect(schemaValid(withTable(name)).valid, name).toBe(true);
    }
  });

  it("refuses columns named for a credential value, and allows a secret's name", () => {
    const backup = load("positive/settings-backup.json");
    const withColumn = (column: string) => ({ ...backup, tables: { ...backup.tables, secret_bindings: { columns: ["project_id", column], rows: [] } }, counts: { ...backup.counts, secret_bindings: 0 } });
    for (const column of ["access_token", "token", "refresh_tokens", "apiKey", "api_key", "password", "client_secret", "session_cookie", "login_code", "private_key"]) {
      expect(schemaValid(withColumn(column)).valid, column).toBe(false);
    }
    for (const column of ["secret_name", "token_slot", "token_count", "api_key_name", "cookie_consent"]) {
      expect(schemaValid(withColumn(column)).valid, column).toBe(true);
    }
  });
});
