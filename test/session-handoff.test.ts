import { chmodSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { MAX_INLINE_BRIEF, MAX_LAUNCH_ARG, MAX_LAUNCH_ARGS, readSessionHandoff, validateSessionHandoff } from "../src/session-handoff.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0042 (Fabric ADR-0140, 0.4.0 REQ-06): session-handoff/1, the folder a host hands a coding-agent session.
const root = projectRoot();
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Record<string, unknown>;
const spec = readFileSync(path.join(root, "docs/specification/session-handoff.md"), "utf8");
const validator = await createValidator();
const schema = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/session-handoff.schema.json`, value);
const codes = (kind: string, name: string) => evaluateSemanticRules(kind, load(`semantic/${name}.json`)).map((finding) => finding.code);

// A real folder, written the way a host writes one: 0700, each file 0600, in a temporary folder outside any repository.
const scratch = mkdtempSync(path.join(tmpdir(), "session-handoff-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));
let serial = 0;
function writeFolder(fixture: string, edit: (dir: string, manifest: Record<string, unknown>) => void = () => {}): string {
  const folder = load(`semantic/${fixture}.json`);
  const dir = path.join(scratch, `s${++serial}`);
  mkdirSync(dir, { mode: 0o700 });
  const entries = folder.entries as Record<string, { text?: string; json?: unknown }>;
  const manifest = JSON.parse(JSON.stringify(entries["handoff.json"]?.json)) as Record<string, unknown>;
  // The fixture's absolute paths name the fixture's folder; a real folder names itself.
  const retarget = (value: unknown): unknown => (typeof value === "string" ? value.split(String(folder.path)).join(dir) : Array.isArray(value) ? value.map(retarget) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, retarget(v)])) : value);
  const written = retarget(manifest) as Record<string, unknown>;
  edit(dir, written);
  for (const [name, entry] of Object.entries(entries)) {
    const text = name === "handoff.json" ? `${JSON.stringify(written, null, 2)}\n` : entry.text ?? `${JSON.stringify(entry.json, null, 2)}\n`;
    writeFileSync(path.join(dir, name), text, { mode: 0o600 });
  }
  return dir;
}
const check = (dir: string) => validateSessionHandoff(dir, { schema });

describe("session-handoff/1: the manifest's schema (DEC-0042)", () => {
  it("accepts Fabric's three connected runtimes and Dashboards' console pack", () => {
    for (const name of ["fabric-claude", "fabric-claude-brief-file", "fabric-kilo", "fabric-hermes", "dashboards-claude", "dashboards-codex"]) {
      expect(schema(load(`positive/session-handoff-${name}.json`)).errors, name).toEqual([]);
    }
  });

  it("states its limits as the schema and the kit both hold them", () => {
    const raw = JSON.parse(readFileSync(path.join(root, "schemas/session-handoff.schema.json"), "utf8"));
    expect(raw.properties.brief.oneOf[0].properties.text.maxLength).toBe(MAX_INLINE_BRIEF);
    expect(raw.properties.launch.properties.args.maxItems).toBe(MAX_LAUNCH_ARGS);
    expect(raw.properties.launch.properties.args.items.maxLength).toBe(MAX_LAUNCH_ARG);
  });
});

describe("FAC-SEM-053: the manifest's declarations agree", () => {
  it("passes Fabric's Claude Code manifest and every positive manifest", () => {
    expect(codes("session-handoff", "session-handoff-ok")).toEqual([]);
    for (const name of ["fabric-claude", "fabric-claude-brief-file", "fabric-kilo", "fabric-hermes", "dashboards-claude", "dashboards-codex"]) {
      expect(evaluateSemanticRules("session-handoff", load(`positive/session-handoff-${name}.json`)), name).toEqual([]);
    }
  });

  it.each([
    ["session-handoff-bearer-per-agent-key", /a bearer is minted for one session/],
    ["session-handoff-spaced-mcp-config", /joined --mcp-config=<path>/],
    ["session-handoff-preamble-states-a-rule", /names one tool, the first call; it also names fabric_task_close/],
    ["session-handoff-multiline-inline-brief", /no control character \(a newline included\)/],
    ["session-handoff-strict-without-flag", /given --strict-mcp-config/],
    ["session-handoff-kilo-content-recorded", /Kilo is given its session config in KILO_CONFIG_CONTENT, withheld as null/],
    ["session-handoff-env-credential-recorded", /a value that carries a credential is withheld as null/],
    ["session-handoff-bearer-in-args", /a launch argument never carries a credential/]
  ])("%s is refused", (name, message) => {
    const findings = evaluateSemanticRules("session-handoff", load(`semantic/${name}.json`));
    expect(findings.map((finding) => finding.code)).toContain("FAC-SEM-053");
    expect(findings.every((finding) => finding.code === "FAC-SEM-053")).toBe(true);
    expect(findings.some((finding) => message.test(finding.message)), JSON.stringify(findings)).toBe(true);
  });
});

describe("FAC-SEM-054 and FAC-SEM-055: the folder", () => {
  it("passes the folders Fabric and Dashboards write", () => {
    for (const name of ["session-handoff-folder-ok", "session-handoff-folder-brief-file-ok", "session-handoff-folder-stdio-ok"]) {
      expect(evaluateSemanticRules("session-handoff-folder", load(`semantic/${name}.json`)), name).toEqual([]);
    }
  });

  it.each([
    ["session-handoff-folder-in-repository", "FAC-SEM-054"],
    ["session-handoff-folder-loose-modes", "FAC-SEM-054"],
    ["session-handoff-folder-stray-file", "FAC-SEM-054"],
    ["session-handoff-folder-digest-mismatch", "FAC-SEM-054"],
    ["session-handoff-folder-foreign-config", "FAC-SEM-054"],
    ["session-handoff-folder-secret-in-context", "FAC-SEM-055"],
    ["session-handoff-folder-stdio-with-token", "FAC-SEM-055"]
  ])("%s is refused with %s", (name, code) => {
    expect([...new Set(codes("session-handoff-folder", name))]).toEqual([code]);
  });
});

describe("validateSessionHandoff(dir): a folder on disk", () => {
  it("passes a folder written 0700/0600 outside any repository, for a bearer and for a stdio pack", async () => {
    for (const fixture of ["session-handoff-folder-ok", "session-handoff-folder-brief-file-ok", "session-handoff-folder-stdio-ok"]) {
      const verdict = await check(writeFolder(fixture));
      expect(verdict, fixture).toEqual({ valid: true, schemaErrors: [], findings: [] });
    }
  });

  it("defaults to the contract's own schema check", async () => {
    expect((await validateSessionHandoff(writeFolder("session-handoff-folder-ok"))).valid).toBe(true);
  });

  it("refuses a folder or a file readable by others, and a link in place of a file", async () => {
    const loose = writeFolder("session-handoff-folder-ok");
    chmodSync(loose, 0o755);
    chmodSync(path.join(loose, "mcp.json"), 0o644);
    const findings = (await check(loose)).findings.map((finding) => finding.message);
    expect(findings).toContain("the folder is 0700; this one 755");
    expect(findings).toContain("mcp.json is 0600; this one 644");
    const linked = writeFolder("session-handoff-folder-ok");
    rmSync(path.join(linked, "context.md"));
    writeFileSync(path.join(scratch, "elsewhere.md"), "# elsewhere\n", { mode: 0o600 });
    symlinkSync(path.join(scratch, "elsewhere.md"), path.join(linked, "context.md"));
    expect((await check(linked)).findings.map((finding) => finding.message)).toContain("context.md is a regular file, not a symlink");
    const target = writeFolder("session-handoff-folder-ok");
    const alias = path.join(scratch, `alias-${serial}`);
    symlinkSync(target, alias);
    expect((await check(alias)).findings.map((finding) => finding.message)).toEqual(["the handoff is a folder, not a link to one"]);
  });

  it("refuses a folder inside a repository, a stray file and a missing listed file", async () => {
    const repository = path.join(scratch, "repo");
    mkdirSync(path.join(repository, ".git"), { recursive: true });
    const inside = path.join(repository, ".fabric", "session");
    mkdirSync(inside, { recursive: true, mode: 0o700 });
    const source = writeFolder("session-handoff-folder-ok");
    for (const name of ["handoff.json", "context.md", "mcp.json"]) writeFileSync(path.join(inside, name), readFileSync(path.join(source, name)), { mode: 0o600 });
    // Found along the real path, so a temp folder reached through /var → /private/var is still found inside it.
    expect(readSessionHandoff(inside).repository).toBe(realpathSync(repository));
    expect((await check(inside)).findings.some((finding) => finding.code === "FAC-SEM-054" && /never in a repository/.test(finding.message))).toBe(true);

    const stray = writeFolder("session-handoff-folder-ok");
    writeFileSync(path.join(stray, "mcp.json.4242.tmp"), "{}", { mode: 0o600 });
    expect((await check(stray)).findings.map((finding) => finding.message)).toContain("mcp.json.4242.tmp is not a file of the handoff; a folder holds handoff.json and the files it lists, nothing else");

    const missing = writeFolder("session-handoff-folder-brief-file-ok");
    rmSync(path.join(missing, "brief.md"));
    expect((await check(missing)).findings.map((finding) => finding.message)).toContain("brief.md is listed and missing");
  });

  it("reports the schema's errors beside the rules, and an unreadable manifest", async () => {
    const wrong = writeFolder("session-handoff-folder-ok", (_dir, manifest) => { (manifest.mcp as Record<string, unknown>).auth = "oauth"; });
    const verdict = await check(wrong);
    expect(verdict.valid).toBe(false);
    expect(verdict.schemaErrors.some((error) => error.keyword === "enum")).toBe(true);
    const broken = writeFolder("session-handoff-folder-ok");
    writeFileSync(path.join(broken, "handoff.json"), "{ not json", { mode: 0o600 });
    expect((await check(broken)).findings.map((finding) => finding.message)).toContain("handoff.json is a regular file holding a JSON object");
  });

  it("refuses a Claude Code launch that names another folder's mcp.json, or a credential repeated outside mcp.json", async () => {
    const foreign = writeFolder("session-handoff-folder-ok", (_dir, manifest) => {
      (manifest.launch as { args: string[] }).args[0] = "--mcp-config=/tmp/other/mcp.json";
    });
    expect((await check(foreign)).findings.some((finding) => finding.code === "FAC-SEM-054" && /names this folder's mcp.json/.test(finding.message))).toBe(true);
    const leaked = writeFolder("session-handoff-folder-ok", (_dir, manifest) => { manifest.preamble = `${String(manifest.preamble)}`; });
    writeFileSync(path.join(leaked, "context.md"), "# context\n\nthe key: tok-0f9b6d1e3c2a4b8e\n", { mode: 0o600 });
    expect((await check(leaked)).findings.map((finding) => finding.message)).toContain("context.md repeats a credential from mcp.json; a secret lives in mcp.json only");
  });
});

describe("the specification", () => {
  it("defines SH-1…SH-13 once each and the three codes in its semantic-rules table", () => {
    for (let n = 1; n <= 13; n++) expect(spec.match(new RegExp(`\\*\\*SH-${n} — `, "g")), `SH-${n}`).toHaveLength(1);
    for (const code of ["FAC-SEM-053", "FAC-SEM-054", "FAC-SEM-055"]) expect(spec).toMatch(new RegExp(`^\\| \`${code}\` \\|`, "m"));
  });

  it("names the per-runtime rows the kit checks", () => {
    for (const runtime of ["claude-code", "codex", "kilo", "hermes", "kimi-code", "cline"]) expect(spec).toMatch(new RegExp(`^\\| \`${runtime}\` \\|`, "m"));
    expect(spec).toContain("`--mcp-config=<folder>/mcp.json`");
  });
});
