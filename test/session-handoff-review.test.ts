import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import * as links from "../src/fabric-links.js";
import {
  MAX_HANDOFF_FILE,
  credentialName,
  readSessionHandoff,
  secretValue,
  sessionHandoffFolderFindings,
  sessionHandoffManifestFindings,
  snapshotFromFixture
} from "../src/session-handoff.js";

// The review of PR #31 (DEC-0042): the reader, the credential matcher, and one test for every message the rules emit.
type Json = Record<string, any>;
const root = projectRoot();
const load = (relative: string): Json => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8"));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const scratch = mkdtempSync(path.join(tmpdir(), "session-handoff-review-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

const manifest = (name: string) => clone(load(`positive/session-handoff-${name}.json`));
const folder = (name: string) => clone(load(`semantic/session-handoff-${name}.json`));
const messagesOf = (findings: Array<{ message: string }>) => findings.map((finding) => finding.message);
const onManifest = (base: string, edit: (m: Json) => void) => {
  const m = manifest(base);
  edit(m);
  return messagesOf(sessionHandoffManifestFindings(m));
};
const onFolder = (base: string, edit: (f: Json, m: Json) => void) => {
  const f = folder(base);
  edit(f, f.entries["handoff.json"]?.json ?? {});
  return messagesOf(sessionHandoffFolderFindings(snapshotFromFixture(f)));
};
/** A token with a delegation token's shape (DEC-0039 header and an `exp`); the signature is never checked by the kit. */
const shapedToken = (typ = "fabric-delegation+jwt", payload: Json = { sub: "operator", exp: 1_800_000_000 }) =>
  [{ alg: "EdDSA", typ, kid: "k1" }, payload].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".") + ".c2lnbmF0dXJl";
const withoutFlag = (args: string[], flag: string) => {
  const at = args.indexOf(flag);
  return at < 0 ? args.filter((arg) => !arg.startsWith(`${flag}=`)) : [...args.slice(0, at), ...args.slice(at + 2)];
};

// Each case: a label, the messages a mutation produces, and the text one of them must hold.
const cases: Array<[string, () => string[], string]> = [
  ["SH-5 bearer per agent key", () => onManifest("fabric-claude", (m) => { m.lifetime = { kind: "agent-key", agentKey: "copylot.default" }; }), "a bearer is minted for one session"],
  ["SH-7 another agent's console", () => onManifest("dashboards-codex", (m) => { m.firstCall.arguments.key = "other.default"; }), "opens that agent's console"],
  ["SH-6 long preamble", () => onManifest("fabric-claude", (m) => { m.preamble = `Call fabric_whoami. ${"a".repeat(600)}`; }), "the preamble is at most 600"],
  ["SH-6 two lines", () => onManifest("fabric-claude", (m) => { m.preamble += "\nsecond"; }), "the preamble is one line"],
  ["SH-6 no first call", () => onManifest("fabric-claude", (m) => { m.preamble = "Read the rules."; }), "the preamble names the first call"],
  ["SH-6 another tool", () => onManifest("fabric-claude", (m) => { m.preamble += " Then call service_context."; }), "the preamble names one tool"],
  ["SH-8 long inline brief", () => onManifest("fabric-claude", (m) => { m.brief.text = `${"x".repeat(1001)}${m.preamble}`; }), "an inline brief is at most 1000"],
  ["SH-8 multi-line inline brief", () => onManifest("fabric-claude", (m) => { m.brief.text = `a\nb ${m.preamble}`; }), "an inline brief holds no control character"],
  ["SH-8 brief not ending with the preamble", () => onManifest("fabric-claude", (m) => { m.brief.text = "hello"; }), "the brief ends with the preamble"],
  ["SH-8 inline plus brief.md", () => onManifest("fabric-claude", (m) => { m.files.push("brief.md"); }), "an inline brief has no brief.md"],
  ["SH-8 file without brief.md", () => onManifest("fabric-claude-brief-file", (m) => { m.files = m.files.filter((name: string) => name !== "brief.md"); }), "a brief delivered as a file lists brief.md"],
  ["SH-10 control character in an argument", () => onManifest("fabric-claude", (m) => { m.launch.args.push("a\nb"); }), "a launch argument holds no control character"],
  ["SH-10 credential in an argument", () => onManifest("fabric-claude", (m) => { m.launch.args.push("--header=Authorization: Bearer tok-0f9b6d1e3c2a4b8e"); }), "a launch argument never carries a credential"],
  ["SH-10 multi-line environment value", () => onManifest("fabric-claude", (m) => { m.launch.env.NOTE = "a\nb"; }), "an environment value is recorded only when it is one plain line"],
  ["SH-10 credential in the environment", () => onManifest("fabric-claude", (m) => { m.launch.env.API_TOKEN = "value"; }), "a value that carries a credential is withheld as null"],
  ["SH-11 claude spaced --mcp-config", () => onManifest("fabric-claude", (m) => { const value = m.launch.args[0].slice("--mcp-config=".length); m.launch.args.splice(0, 1, "--mcp-config", value); }), "Claude Code takes the joined --mcp-config"],
  ["SH-11 claude no config", () => onManifest("fabric-claude", (m) => { m.launch.args.splice(0, 1); }), "Claude Code is given exactly one --mcp-config"],
  ["SH-11 claude relative config", () => onManifest("fabric-claude", (m) => { m.launch.args[0] = "--mcp-config=mcp.json"; }), "--mcp-config names the handoff's mcp.json by its absolute path"],
  ["SH-11 claude strict without the flag", () => onManifest("fabric-claude", (m) => { m.launch.args = m.launch.args.filter((arg: string) => arg !== "--strict-mcp-config"); }), "mcp.strict is true, so Claude Code is given --strict-mcp-config"],
  ["SH-11 claude flag without strict", () => onManifest("fabric-claude", (m) => { m.mcp.strict = false; }), "mcp.strict is false, so Claude Code is not given --strict-mcp-config"],
  ["SH-11 claude inline brief not passed", () => onManifest("fabric-claude", (m) => { m.launch.args = withoutFlag(m.launch.args, "--append-system-prompt"); }), "an inline brief is the one value of --append-system-prompt"],
  ["SH-11 claude brief file not passed", () => onManifest("fabric-claude-brief-file", (m) => { m.launch.args = withoutFlag(m.launch.args, "--append-system-prompt-file"); }), "a brief file is the one value of --append-system-prompt-file"],
  ["SH-11 claude relative brief file", () => onManifest("fabric-claude-brief-file", (m) => { m.launch.args = [...withoutFlag(m.launch.args, "--append-system-prompt-file"), "--append-system-prompt-file=brief.md"]; }), "--append-system-prompt-file names the handoff's brief.md by its absolute path"],
  ["SH-11 codex stdio without command", () => onManifest("dashboards-codex", (m) => { m.launch.args = []; }), "Codex is given the stdio server"],
  ["SH-11 codex bearer without url", () => onManifest("dashboards-codex", (m) => { m.mcp.auth = "bearer"; }), "Codex is given the HTTP server"],
  ["SH-11 codex bearer without its variable", () => onManifest("dashboards-codex", (m) => { m.mcp.auth = "bearer"; }), "Codex reads the bearer from the variable bearer_token_env_var names"],
  ["SH-11 codex strict", () => onManifest("dashboards-codex", (m) => { m.mcp.strict = true; }), "Codex offers no switch"],
  ["SH-11 kilo config recorded", () => onManifest("fabric-kilo", (m) => { m.launch.env = {}; }), "Kilo is given its session config in KILO_CONFIG_CONTENT"],
  ["SH-11 kilo inline brief", () => onManifest("fabric-kilo", (m) => { m.brief = { delivery: "inline", text: m.preamble }; }), "Kilo reads instructions from files"],
  ["SH-11 kilo strict", () => onManifest("fabric-kilo", (m) => { m.mcp.strict = true; }), "Kilo offers no switch"],
  ["SH-11 kilo arguments", () => onManifest("fabric-kilo", (m) => { m.launch.args = ["--x"]; }), "Kilo's handoff travels in KILO_CONFIG_CONTENT, not in arguments"],
  ["SH-11 hermes strict without the variable", () => onManifest("fabric-hermes", (m) => { m.mcp.strict = true; m.launch.env = {}; }), "mcp.strict is true, so Hermes is started with HERMES_ACP_SKIP_CONFIGURED_MCP=1"],
  ["SH-11 hermes variable without strict", () => onManifest("fabric-hermes", (m) => { m.mcp.strict = false; m.launch.env = { HERMES_ACP_SKIP_CONFIGURED_MCP: "1" }; }), "mcp.strict is false, so HERMES_ACP_SKIP_CONFIGURED_MCP is not set"],
  ["SH-11 kimi-code strict", () => onManifest("fabric-hermes", (m) => { m.launch.runtime = "kimi-code"; m.mcp.strict = true; }), "kimi-code offers no measured switch"],
  ["SH-11 cline strict", () => onManifest("fabric-hermes", (m) => { m.launch.runtime = "cline"; m.mcp.strict = true; }), "cline offers no measured switch"],
  ["SH-1 a link", () => onFolder("folder-ok", (f) => { f.kind = "symlink"; }), "the handoff is a folder, not a link to one"],
  ["SH-1 in a repository", () => onFolder("folder-ok", (f) => { f.repository = "/work/repo"; }), "never in a repository"],
  ["SH-2 folder mode", () => onFolder("folder-ok", (f) => { f.mode = "755"; }), "the folder is 0700"],
  ["SH-2 no handoff.json", () => onFolder("folder-ok", (f) => { delete f.entries["handoff.json"]; }), "the folder holds handoff.json"],
  ["SH-2 handoff.json not JSON", () => onFolder("folder-ok", (f) => { f.entries["handoff.json"] = { mode: "600", text: "nope" }; }), "handoff.json is a regular file holding a JSON object"],
  ["SH-2 another format", () => onFolder("folder-ok", (_f, m) => { m.format = "session-handoff/2"; }), "handoff.json declares session-handoff/1"],
  ["SH-3 listed and missing", () => onFolder("folder-ok", (f) => { delete f.entries["context.md"]; }), "context.md is listed and missing"],
  ["SH-3 a FIFO", () => onFolder("folder-ok", (f) => { f.entries["context.md"] = { mode: "600", kind: "other" }; }), "context.md is a regular file, not a FIFO, socket or device"],
  ["SH-3 too large", () => onFolder("folder-ok", (f) => { f.entries["context.md"] = { mode: "600", tooLarge: true }; }), `context.md is at most ${MAX_HANDOFF_FILE} bytes`],
  ["SH-3 file mode", () => onFolder("folder-ok", (f) => { f.entries["context.md"].mode = "644"; }), "context.md is 0600"],
  ["SH-3 empty file", () => onFolder("folder-ok", (f) => { f.entries["context.md"].text = "  \n"; }), "context.md is not empty"],
  ["SH-3 stray", () => onFolder("folder-ok", (f) => { f.entries["notes.txt"] = { mode: "600", text: "x" }; }), "notes.txt is not a file of the handoff"],
  ["SH-12 digest of an absent file", () => onFolder("folder-ok", (_f, m) => { m.integrity = { parts: { "task.md": "sha256:00" } }; }), "task.md has a digest and is not in the folder"],
  ["SH-12 digest mismatch", () => onFolder("folder-ok", (_f, m) => { m.integrity = { parts: { "context.md": "sha256:00" } }; }), "context.md does not match its execution-packet digest"],
  ["SH-4 another folder's mcp.json", () => onFolder("folder-ok", (_f, m) => { m.launch.args[0] = "--mcp-config=/elsewhere/mcp.json"; }), "--mcp-config names this folder's mcp.json"],
  ["SH-4 another folder's brief.md", () => onFolder("folder-brief-file-ok", (_f, m) => { m.launch.args = [...withoutFlag(m.launch.args, "--append-system-prompt-file"), "--append-system-prompt-file", "/elsewhere/brief.md"]; }), "--append-system-prompt-file names this folder's brief.md"],
  ["SH-8 brief.md not ending with the preamble", () => onFolder("folder-brief-file-ok", (f) => { f.entries["brief.md"].text = "Do the task.\n"; }), "the brief ends with the preamble"],
  ["SH-9 mcp.json not JSON", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"] = { mode: "600", text: "{" }; }), "mcp.json is JSON"],
  ["SH-9 no mcpServers", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json = {}; }), "mcp.json holds an mcpServers object"],
  ["SH-9 first server missing", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json = { mcpServers: {} }; }), "mcp.json names the first call's server"],
  ["SH-9 bearer server not http", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.fabric.type = "stdio"; }), "a bearer server is reached over HTTP"],
  ["SH-9 bad Authorization", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.fabric.headers.Authorization = "Basic abc"; }), "a bearer server carries Authorization: Bearer"],
  ["SH-9 auth-none server not stdio", () => onFolder("folder-stdio-ok", (f) => { const servers = f.entries["mcp.json"].json.mcpServers; servers[Object.keys(servers)[0] as string].type = "http"; }), "a server with no secret is a stdio command"],
  ["SH-9 header in a no-secret folder", () => onFolder("folder-stdio-ok", (f) => { const servers = f.entries["mcp.json"].json.mcpServers; servers[Object.keys(servers)[0] as string].headers = { Accept: "application/json" }; }), "a handoff with no secret carries no header"],
  ["SH-9 a standing key on another server", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.gateway = { type: "http", url: "http://127.0.0.1:9/mcp", headers: { Authorization: "Bearer standing-key-0123456789" } }; }), "a server other than the first call's carries only a delegation token"],
  ["SH-9 Fabric's gateway role key", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.gateway = { type: "http", url: "http://127.0.0.1:9/mcp", headers: { "x-agw-key": "role-key-5b8e2f1a" } }; }), "a server other than the first call's carries only a delegation token"],
  ["SH-9 a JWT-looking standing key", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.gateway = { type: "http", url: "http://127.0.0.1:9/mcp", headers: { Authorization: `Bearer ${shapedToken("JWT")}` } }; }), "a server other than the first call's carries only a delegation token"],
  ["SH-9 another credential on the first server", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.fabric.headers["X-Api-Key"] = "standing-0123"; }), "the first call's server carries the session bearer in Authorization and no other credential"],
  ["SH-9 credential env in a no-secret folder", () => onFolder("folder-stdio-ok", (f) => { const servers = f.entries["mcp.json"].json.mcpServers; servers[Object.keys(servers)[0] as string].env = { API_TOKEN: "abc" }; }), "a handoff with no secret carries no credential in a server's environment"],
  ["SH-9 standing key in a server's environment", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.fabric.env = { API_TOKEN: "abc" }; }), "a credential in a server's environment is a delegation token"],
  ["SH-9 credential in a URL", () => onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.fabric.url = "http://127.0.0.1:47070/mcp?t=eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ4In0.c2ln"; }), "a server's url never carries a credential"],
  ["SH-9 credential in a server's arguments", () => onFolder("folder-stdio-ok", (f) => { const servers = f.entries["mcp.json"].json.mcpServers; servers[Object.keys(servers)[0] as string].args = ["--key", "sk-abcdefghijklmnopqrstuvwx"]; }), "a server's arguments never carry a credential"],
  ["SH-13 credential repeated", () => onFolder("folder-ok", (f) => { f.entries["context.md"].text += "\nToken: tok-0f9b6d1e3c2a4b8e\n"; }), "context.md repeats a credential from mcp.json"]
];

describe("FAC-SEM-053…055: every message the rules emit has a test that produces it", () => {
  for (const [label, run, expected] of cases) {
    it(label, () => {
      expect(run().some((message) => message.includes(expected)), `${label}: ${JSON.stringify(run())}`).toBe(true);
    });
  }

  it("leaves no message of src/session-handoff.ts without a case", () => {
    const source = readFileSync(path.join(root, "src/session-handoff.ts"), "utf8");
    const produced = cases.flatMap(([, run]) => run());
    const fragments: string[] = [];
    for (const call of source.matchAll(/sem05[345]\(\s*(?:"[^"]*"|`[^`]*`|\w+)\s*,\s*([^\n]*)/g)) {
      for (const literal of (call[1] ?? "").matchAll(/"([^"]*)"|`([^`]*)`/g)) {
        const text = literal[1] ?? literal[2] ?? "";
        const longest = text.split(/\$\{[^}]*\}/).sort((a, b) => b.length - a.length)[0] ?? "";
        if (longest.trim().length >= 8) fragments.push(longest.trim());
      }
    }
    // Every call is read: a call the pattern skipped (wrapped over lines, a message in a variable) fails here.
    expect([...source.matchAll(/sem05[345]\(\s*(?:"[^"]*"|`[^`]*`|\w+)\s*,/g)].length).toBe([...source.matchAll(/\bsem05[345]\(/g)].length);
    expect(fragments.length).toBeGreaterThan(55);
    const missing = fragments.filter((fragment) => !produced.some((message) => message.includes(fragment)));
    expect(missing).toEqual([]);
  });
});

describe("the review's fixes", () => {
  it("passes a brief about bearer tokens, and an Accept header named in context.md", () => {
    const prose = onManifest("fabric-claude", (m) => {
      m.brief.text = `Fix the Bearer token refresh bug. ${m.preamble}`;
      m.launch.args[m.launch.args.length - 1] = m.brief.text;
    });
    expect(prose.filter((message) => message.includes("credential"))).toEqual([]);
    const scheme = onManifest("fabric-claude", (m) => {
      m.brief.text = `Add the Bearer authentication scheme to the API. ${m.preamble}`;
      m.launch.args[m.launch.args.length - 1] = m.brief.text;
    });
    expect(scheme.filter((message) => message.includes("credential"))).toEqual([]);
    const accept = onFolder("folder-ok", (f) => {
      f.entries["mcp.json"].json.mcpServers.fabric.headers.Accept = "application/json, text/event-stream";
      f.entries["context.md"].text += "\nThe server answers application/json, text/event-stream.\n";
    });
    expect(accept.filter((message) => message.includes("repeats a credential"))).toEqual([]);
  });

  it("accepts a delegation token on another server of a bearer folder", () => {
    const jwt = shapedToken();
    const found = onFolder("folder-ok", (f) => { f.entries["mcp.json"].json.mcpServers.gateway = { type: "http", url: "http://127.0.0.1:9/mcp", headers: { Authorization: `Bearer ${jwt}` } }; });
    expect(found.filter((message) => message.includes("delegation token"))).toEqual([]);
  });

  it("finds a standard-base64 secret in an argument, and splits only a path or a URL at its separators", () => {
    const run = (arg: string) => onManifest("fabric-claude", (m) => { m.launch.args.push(arg); }).filter((message) => message.includes("never carries a credential"));
    expect(run("--aws-secret=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY")).toHaveLength(1);
    expect(run("/Users/example/Library/Application/ai.passioncode.fabric/sessions/01JA7Y5Q3C2K9M8N4P6R0S1T2V/brief.md")).toEqual([]);
  });

  it("holds the runtime list of runners.md, the one place a runner takes its name", () => {
    const runners = readFileSync(path.join(root, "docs/specification/runners.md"), "utf8");
    const shared = runners.slice(runners.indexOf("**Kind names are shared.**"), runners.indexOf("A runner that is not listed"));
    const listed = [...shared.matchAll(/`([a-z][a-z0-9-]+)`/g)].map((match) => match[1]).sort();
    const raw = JSON.parse(readFileSync(path.join(root, "schemas/session-handoff.schema.json"), "utf8"));
    expect([...raw.properties.launch.properties.runtime.enum].sort()).toEqual(listed);
  });

  it("does not throw on a tool name that is not a regular expression", () => {
    expect(() => onManifest("fabric-claude", (m) => { m.firstCall.tool = "a(b"; })).not.toThrow();
  });

  it("matches credentials exactly as DEC-0041's fabric:// rule does", () => {
    const names = ["token", "apiKeys", "authKey", "sessionId", "X-Amz-Signature", "pass", "themeCode", "sortKey", "tokenizer", "authorName", "sessionLength", "passage", "Accept", "Content-Type", "accesstoken", "clientsecret", "constructor", "__proto__"];
    for (const name of names) expect(credentialName(name), name).toBe(links.credentialName(name));
    const values = ["Bearer abc.def", "sk-abcdefghijklmnopqrstuv", "ghp_abcdefghijklmnopqrstuvwx", "eyJhbGciOi.eyJzdWIi.sig", "QrStUvWxYz0123456789abcdefGHIJKLmnopQRSTuv-x", "0123456789abcdef0123456789abcdef0123456789abcdef", "01JA7Y5Q3C2K9M8N4P6R0S1T2V", "plain words"];
    for (const value of values) expect(secretValue(value), value).toBe(links.secretValue(value));
  });

  it("finds the folder's repository along its real path", () => {
    if (process.platform === "win32") return;
    const repo = path.join(scratch, "repo");
    mkdirSync(path.join(repo, ".git"), { recursive: true });
    mkdirSync(path.join(repo, "deep"), { recursive: true });
    const linked = path.join(scratch, "linked");
    symlinkSync(path.join(repo, "deep"), linked);
    const inside = path.join(linked, "handoff");
    mkdirSync(inside, { mode: 0o700 });
    expect(readSessionHandoff(inside).repository).not.toBeNull();
  });

  it("names a __proto__ or constructor file as a stray instead of breaking the folder", () => {
    for (const name of ["__proto__", "constructor"]) {
      const found = onFolder("folder-ok", (f) => { Object.defineProperty(f.entries, name, { value: { mode: "600", text: "x" }, enumerable: true }); });
      expect(found, name).toContain(`${name} is not a file of the handoff; a folder holds handoff.json and the files it lists, nothing else`);
    }
    if (process.platform === "win32") return;
    const dir = path.join(scratch, "proto");
    mkdirSync(dir, { mode: 0o700 });
    writeFileSync(path.join(dir, "__proto__"), "x", { mode: 0o600 });
    expect(Object.keys(readSessionHandoff(dir).entries)).toEqual(["__proto__"]);
  });

  it("digests a file's bytes, not their UTF-8 reading", () => {
    if (process.platform === "win32") return;
    const dir = path.join(scratch, "bytes");
    mkdirSync(dir, { mode: 0o700 });
    writeFileSync(path.join(dir, "context.md"), Buffer.from([0x63, 0xff, 0xfe, 0x0a]), { mode: 0o600 });
    const entry = readSessionHandoff(dir).entries["context.md"];
    expect(entry?.sha256).toBe("sha256:" + execFileSync("shasum", ["-a", "256", path.join(dir, "context.md")], { encoding: "utf8" }).split(" ")[0]);
  });

  it("compares an integrity digest with the bytes read, so a file that is not UTF-8 still matches", () => {
    const f = folder("folder-ok");
    const digest = "sha256:" + "ab".repeat(32);
    const snapshot = snapshotFromFixture(f);
    snapshot.entries["context.md"] = { mode: "600", kind: "file", text: "c\ufffd\ufffd\n", sha256: digest };
    const m = JSON.parse(snapshot.entries["handoff.json"]?.text ?? "{}") as Json;
    m.integrity = { parts: { "context.md": digest } };
    snapshot.entries["handoff.json"] = { mode: "600", kind: "file", text: JSON.stringify(m) };
    expect(messagesOf(sessionHandoffFolderFindings(snapshot)).filter((message) => message.includes("digest"))).toEqual([]);
  });

  it.skipIf(process.platform === "win32")("reports a FIFO or an oversized file without blocking on it or reading it", { timeout: 5000 }, () => {
    const dir = path.join(scratch, "fifo");
    mkdirSync(dir, { mode: 0o700 });
    execFileSync("mkfifo", ["-m", "600", path.join(dir, "context.md")]);
    writeFileSync(path.join(dir, "task.md"), Buffer.alloc(MAX_HANDOFF_FILE + 1, 0x61), { mode: 0o600 });
    // A blocking open would hang this worker past any test timeout, so the read runs in a child killed at 2 s.
    const script = `const h = await import(${JSON.stringify(path.join(root, "src/session-handoff.ts"))}); const s = h.readSessionHandoff(${JSON.stringify(dir)}); process.stdout.write(JSON.stringify({ c: s.entries["context.md"], t: s.entries["task.md"] }));`;
    const out = JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], { cwd: root, timeout: 2000, encoding: "utf8" }));
    expect(out.c).toEqual({ mode: "600", kind: "other" });
    expect(out.t).toEqual({ mode: "600", kind: "file", tooLarge: true });
  });
});
