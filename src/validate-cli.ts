// #region validate-cli (docs: docs/specification/conformance.md#the-checker)
/**
 * REQ-01 (contract review 2026-10-21): `pnpm validate <file|dir> [--schema <name>] [--kind <kind>] [--json]`, an
 * author's first check. For each JSON file it infers the schema (or takes `--schema`), validates the document, runs
 * the semantic kinds that read it whole (or the `--kind` named), and adds hints the rules do not give (a near-miss
 * extension key, a profile version member on the wrong profile). A folder is also checked as pairs: a service
 * descriptor with its well-known document, the descriptors together, a descriptor with the manifest it names, a
 * provider entry with its manifest, and the entries with the services.
 *
 * Each problem is one line, `file  path  rule  message  help`. Exit 0: no problem; 1: a problem; 2: a usage error
 * (an unreadable file, an unknown `--schema` or `--kind`, a schema that cannot be inferred).
 */
import { type Dirent, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Ajv2020, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX, loadSchemasSync, projectRoot, type ContractSchema } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject, withHelp } from "./findings.js";
import { ruleHelp } from "./rule-codes.js";
import { documentKindsOf, isSemanticKind } from "./semantic-kinds.js";
import { evaluateSemanticRules } from "./semantic-rules.js";
import { createValidatorSync, formatSchemaErrors } from "./validator.js";

export interface Problem { file: string; path: string; rule: string; message: string; help?: string }
export interface CliResult { code: 0 | 1 | 2; out: string }

const USAGE = [
  "usage: pnpm validate <file|dir> [--schema <name>] [--kind <kind>] [--json]",
  "  --schema <name>  validate against schemas/<name>.schema.json instead of the inferred schema",
  "  --kind <kind>    run this semantic kind (src/semantic-kinds.ts) instead of the inferred ones; add --schema to validate too",
  "  --json           print one JSON document: files, problems, notes, usage",
  "exit 0: no problem; 1: a problem; 2: a usage error"
].join("\n");
const root = projectRoot();

interface Discriminated { file: string; required: string[]; consts: Array<[string, unknown]> }
let cache: { validator: Ajv2020; schemas: ContractSchema[]; help: Map<string, string>; discriminated: Discriminated[] } | undefined;
function contract() {
  if (cache === undefined) {
    const schemas = loadSchemasSync();
    cache = {
      validator: createValidatorSync({ verbose: true }),
      schemas,
      help: ruleHelp(readFileSync(path.join(root, "docs/specification/conformance.md"), "utf8")),
      discriminated: schemas.map((schema) => discriminated(schema, schemas))
    };
  }
  return cache;
}

const fileOf = (schema: ContractSchema) => schema.$id.slice(`${SCHEMA_PREFIX}schemas/`.length);

// #region schema-inference
/** A schema's top-level discriminators: a `const` on format, schema, type, protocol or contractVersion. */
const DISCRIMINATORS = ["format", "schema", "type", "protocol", "contractVersion"] as const;
const SERVICE_KEY = /^[a-z][a-z0-9-]{1,62}\.[a-z][a-z0-9-]{0,31}$/;

/**
 * A schema's required members and the constants its discriminators hold, directly or through one `$ref` to another
 * schema's definition (`service-common.schema.json#/$defs/protocol`); the schemas compile, so every reference resolves.
 */
function discriminated(schema: ContractSchema, schemas: readonly ContractSchema[]): Discriminated {
  const properties = isObject(schema.properties) ? schema.properties : {};
  const resolved = (rule: unknown): unknown => {
    if (!isObject(rule) || typeof rule.$ref !== "string") return rule;
    const [file, pointer = ""] = rule.$ref.split("#");
    const target = schemas.find((candidate) => fileOf(candidate) === file);
    return pointer.split("/").filter(Boolean).reduce<unknown>((node, key) => (node as JsonObject)[key], target);
  };
  const consts = DISCRIMINATORS.flatMap((member): Array<[string, unknown]> => {
    const rule = resolved(properties[member]);
    return isObject(rule) && Object.hasOwn(rule, "const") ? [[member, rule.const]] : [];
  });
  return { file: fileOf(schema), required: Array.isArray(schema.required) ? (schema.required as string[]) : [], consts };
}

/**
 * The schema `value` follows, by its content, then by its file name. By content: a schema whose top-level
 * discriminator constant the document carries and whose required members are all present; several such
 * (`fabric-service/0.1` is a descriptor, a well-known document or a usage report) are told apart by the one with the
 * most required members. By name: `fabric-agent.json`, `providers/<id>.json`, `<id>.<instance>.json`.
 * Undefined when neither tells.
 */
export function inferSchema(value: unknown, file: string): string | undefined {
  if (isObject(value)) {
    const complete = contract().discriminated.filter((schema) =>
      schema.consts.some(([member, constant]) => value[member] === constant) && schema.required.every((member) => Object.hasOwn(value, member)));
    const best = Math.max(0, ...complete.map((schema) => schema.required.length));
    const chosen = complete.filter((schema) => schema.required.length === best);
    if (chosen.length === 1) return (chosen[0] as Discriminated).file;
  }
  const name = path.basename(file);
  if (name === "fabric-agent.json") return "manifest.schema.json";
  if (name === "fabric-contract.lock.json") return "contract-pin.schema.json";
  // A JSON Schema (a `*.schema.json` file, a top-level `$schema`) is no contract document, whatever its name looks like.
  // A `$schema` that names a JSON Schema dialect marks a schema; one that names a contract schema is an editor's hint
  // on a contract document, which the name rules below still read.
  if (name.endsWith(".schema.json") || isJsonSchema(value)) return undefined;
  // A name alone is weak evidence (`tsconfig.build.json`, `reports.query.json` look like a service key), so the two
  // weaker name rules take a document only when it carries a member that document kind has.
  if (path.basename(path.dirname(file)) === "providers" && carries(value, PROVIDER_MEMBERS)) return "provider.schema.json";
  if (SERVICE_KEY.test(name.replace(/\.json$/, "")) && carries(value, DESCRIPTOR_MEMBERS)) return "service-descriptor.schema.json";
  return undefined;
}
/** Members only a provider entry or a service descriptor has; one is enough for the name rule to take the file. */
const PROVIDER_MEMBERS = ["protocol", "providerId", "run", "manifest"] as const;
const DESCRIPTOR_MEMBERS = ["protocol", "origin", "lifecycle", "fabricManifest"] as const;
const carries = (value: unknown, members: readonly string[]) => isObject(value) && members.some((member) => Object.hasOwn(value, member));

/**
 * A JSON Schema rather than a document: a `$schema` naming a JSON Schema dialect (a contract schema's URL in `$schema`
 * is an editor's hint on a contract document), or a `$id` beside `type` or `properties`.
 */
function isJsonSchema(value: unknown): boolean {
  if (!isObject(value)) return false;
  if (typeof value.$schema === "string" && /^https?:\/\/json-schema\.org\//.test(value.$schema)) return true;
  return typeof value.$id === "string" && (Object.hasOwn(value, "type") || Object.hasOwn(value, "properties"));
}

/** A discriminator member the document carries with a value no schema of this checkout holds, with the values it knows. */
function unknownDiscriminator(value: unknown): { member: string; value: unknown; known: unknown[] } | undefined {
  if (!isObject(value)) return undefined;
  for (const member of ["contractVersion", "protocol"] as const) {
    // Only a string can be a revision or a version: an object under `protocol` (an MCP handshake in a probe receipt) is
    // some other document's member.
    if (typeof value[member] !== "string") continue;
    const known = [...new Set(contract().discriminated.flatMap((schema) => schema.consts.filter(([name]) => name === member).map(([, constant]) => constant)))];
    if (known.length > 0 && !known.includes(value[member])) return { member, value: value[member], known };
  }
  return undefined;
}
// #endregion schema-inference

// #region hints
const KNOWN_KEYS: readonly string[] = Object.values(EXTENSION_KEYS);
const tail = (key: string) => key.split("/").slice(-2).join("/");
/** Edit distance (Levenshtein), for the nearest contract key to a misspelt one. */
function distance(a: string, b: string): number {
  // Only distances up to three matter: a longer gap in length is never near, and costs a full table to say so.
  if (Math.abs(a.length - b.length) > 3) return Math.abs(a.length - b.length);
  let row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];
    for (let j = 1; j <= b.length; j += 1) next.push(Math.min((row[j] as number) + 1, (next[j - 1] as number) + 1, (row[j - 1] as number) + (a[i - 1] === b[j - 1] ? 0 : 1)));
    row = next;
  }
  return row[b.length] as number;
}
/**
 * The contract key a misspelt key most likely meant: the same name and version, else the one key within three edits;
 * two keys equally near name neither. Exported with its key list for the tie's test.
 */
export function nearestKey(key: string, known: readonly string[] = KNOWN_KEYS): string | undefined {
  const same = known.find((candidate) => tail(candidate) === tail(key));
  if (same !== undefined) return same;
  const ranked = known.map((candidate) => [candidate, distance(candidate, key)] as const).sort((x, y) => x[1] - y[1]);
  const best = ranked[0];
  return best !== undefined && best[1] <= 3 && ranked[1]?.[1] !== best[1] ? best[0] : undefined;
}
const PROFILE_VERSION: Readonly<Record<string, string>> = { mcp: "protocolRevision", a2a: "protocolVersion", "local-runner": "profileVersion" };

/** A key under an `extensions` member that looks like one of the contract's keys and is not one. */
function extensionHints(value: unknown, at: string, out: Hint[]): void {
  // An explicit stack, not recursion: a valid document may nest vendor data deeper than the call stack.
  const stack: Array<[unknown, string]> = [[value, at]];
  while (stack.length > 0) {
    const [node, where] = stack.pop() as [unknown, string];
    if (Array.isArray(node)) {
      for (let index = node.length - 1; index >= 0; index -= 1) stack.push([node[index], `${where}/${index}`]);
      continue;
    }
    if (!isObject(node)) continue;
    const children: Array<[unknown, string]> = [];
    for (const [member, child] of Object.entries(node)) {
      const here = `${where}/${member}`;
      if (member === "extensions" && isObject(child)) {
        for (const key of Object.keys(child)) {
          if (KNOWN_KEYS.includes(key)) continue;
          const near = nearestKey(key);
          let host = "";
          try { host = new URL(key).hostname; } catch { /* not a URL: a vendor key the schema judges */ }
          if (near !== undefined) out.push([here, "hint/extension-key", `${key} is not an extension key the contract defines; did you mean ${near}?`]);
          else if (/(^|\.)passioncode\.ai$/.test(host) && key.includes("/extensions/")) out.push([here, "hint/extension-key", `${key} is not an extension key the contract defines; the contract's keys are listed in src/extensions.ts and docs/specification/interop.md#extension-key`]);
        }
      }
      children.push([child, here]);
    }
    for (let index = children.length - 1; index >= 0; index -= 1) stack.push(children[index] as [unknown, string]);
  }
}

/** A manifest profile that carries another profile's version member. */
function profileHints(schema: string | undefined, value: unknown, out: Hint[]): void {
  if (schema !== "manifest.schema.json" || !isObject(value) || !Array.isArray(value.capabilities)) return;
  value.capabilities.forEach((capability, index) => {
    const profile = isObject(capability) && isObject(capability.profile) ? capability.profile : {};
    const kind = profile.kind;
    if (typeof kind !== "string" || !Object.hasOwn(PROFILE_VERSION, kind)) return;
    const own = PROFILE_VERSION[kind] as string;
    for (const [other, member] of Object.entries(PROFILE_VERSION)) {
      if (member !== own && Object.hasOwn(profile, member)) {
        out.push([`/capabilities/${index}/profile/${member}`, "hint/profile-version", `${member} is the ${other} profile's version member; the ${kind} profile's is ${own}`]);
      }
    }
  });
}
const HINT_HELP = {
  "hint/extension-key": "docs/specification/interop.md#extension-key",
  "hint/profile-version": "docs/specification/profiles.md",
  "hint/reader-pending": "docs/specification/provider.md",
} as const;
/** A hint: where it is, which hint, what it says. */
type Hint = [string, keyof typeof HINT_HELP, string];

/** A member the schema allows but a reader the contract names does not accept yet (CT-27 for `run.mcp.stdio.scope`). */
function readerHints(schema: string | undefined, value: unknown, out: Hint[]): void {
  if (schema !== "provider.schema.json" || !isObject(value) || !isObject(value.run) || !isObject(value.run.mcp) || !isObject(value.run.mcp.stdio)) return;
  if (Object.hasOwn(value.run.mcp.stdio, "scope")) out.push(["/run/mcp/stdio/scope", "hint/reader-pending", "Fabric's registry does not accept run.mcp.stdio.scope yet (CT-27); leave it out and readers take on-demand"]);
}
// #endregion hints

interface Checked { file: string; relative: string; value: unknown; schema: string | undefined }
interface Run { problems: Problem[]; notes: Problem[]; usage: string[]; files: Array<{ file: string; schema: string | null; kinds: string[] }> }

/** Every code a rule emits is allocated in the register (G-13), so every finding has its help link. */
function addFindings(run: Run, file: string, findings: Finding[]): void {
  for (const finding of withHelp(findings, contract().help)) {
    const problem: Problem = { file, path: finding.instancePath || "/", rule: finding.code, message: finding.message, help: finding.help as string };
    if (finding.severity === "accepted") run.notes.push(problem);
    else run.problems.push(problem);
  }
}

function checkFile(run: Run, file: string, relative: string, schemaArg: string | undefined, kindArg: string | undefined, inFolder = false): Checked | undefined {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    run.usage.push(`cannot read ${file}: ${String((error as NodeJS.ErrnoException).code)}`);
    return undefined;
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    run.problems.push({ file, path: "/", rule: "json", message: `the file is not JSON: ${(error as Error).message}`, help: "docs/specification/conformance.md" });
    return undefined;
  }
  // `--kind` runs that rule instead of the inferred ones, and validates only with `--schema`: a rule's input is often
  // a wrapper or part of a document, which no schema describes whole.
  const schema = schemaArg ?? (kindArg === undefined ? inferSchema(value, relative) : undefined);
  if (schema === undefined && kindArg === undefined) {
    // A discriminator this checkout does not know (an older or newer contractVersion, an unknown protocol) is the
    // author's problem to fix, named by its member, not a question about which schema to pass.
    const unknown = unknownDiscriminator(value);
    if (unknown !== undefined) {
      run.problems.push({ file, path: `/${unknown.member}`, rule: "schema/const", message: `${unknown.member} ${JSON.stringify(unknown.value)} is not one this checkout reads; it reads ${unknown.known.map((known) => JSON.stringify(known)).join(", ")}`, help: "docs/specification/versioning.md" });
      return undefined;
    }
    // A document missing a required member still names what it may be: of the schemas its discriminators match, the
    // ones it misses the fewest required members of, with those members.
    const matching = isObject(value) ? contract().discriminated.filter((candidate) => candidate.consts.length > 0 && candidate.consts.every(([member, constant]) => value[member] === constant)) : [];
    const missing = (candidate: Discriminated) => candidate.required.filter((member) => !Object.hasOwn(value as JsonObject, member));
    const fewest = Math.min(...matching.map((candidate) => missing(candidate).length));
    const near = matching.filter((candidate) => missing(candidate).length === fewest).map((candidate) => `${candidate.file} (missing ${missing(candidate).join(", ")})`);
    const text = `cannot tell which schema ${file} follows${near.length > 0 ? `: its members match ${near.join(" or ")}` : ""}; pass --schema <name> (a file under schemas/) or --kind <kind>`;
    // In a folder, a file the checker cannot tell (a test fixture, a JSON Schema, a probe receipt that shares a
    // discriminator) is noted, with the schema it is near if any, and not checked; the author passes --schema to check
    // it. A file named on its own is a usage error.
    if (inFolder) run.notes.push({ file, path: "/", rule: "note/skipped", message: `${text.replace(/; pass --schema.*$/, "")}; not checked (pass --schema to check it)` });
    else run.usage.push(text);
    return undefined;
  }
  const kinds = kindArg !== undefined ? [kindArg] : documentKindsOf(schema as string);
  run.files.push({ file, schema: schema ?? null, kinds });
  if (schema !== undefined) {
    const validate = contract().validator.getSchema(`${SCHEMA_PREFIX}schemas/${schema}`) as ValidateFunction;
    validate(value);
    for (const line of formatSchemaErrors(validate.errors ?? [])) {
      const problem = { file, path: line.instancePath || "/", rule: `schema/${line.keyword}`, message: line.message, help: `schemas/${schema.replace(/#.*$/, "")}` };
      // A lock member the pin schema does not define is a note, as `pnpm pin:check` reads it (kit-written locks carry
      // `adapter` and `kit`).
      if (schema === "contract-pin.schema.json" && line.keyword === "additionalProperties") run.notes.push({ ...problem, rule: "note/lock-member" });
      else run.problems.push(problem);
    }
  }
  for (const kind of kinds) addFindings(run, file, evaluateSemanticRules(kind, value));
  const hints: Hint[] = [];
  extensionHints(value, "", hints);
  profileHints(schema, value, hints);
  // A hint is advice, never a failure: a vendor key the contract does not know is legal, so a near miss is reported
  // beside the result and the exit code ignores it.
  readerHints(schema, value, hints);
  for (const [at, rule, message] of hints) run.notes.push({ file, path: at, rule, message, help: HINT_HELP[rule] });
  return { file, relative, value, schema };
}

const expand = (local: string) => (local.startsWith("~/") ? path.join(homedir(), local.slice(2)) : local);
/** A document value as text, never a throw: a member may be any JSON, an object whose `toString` is data included. */
const show = (value: unknown) => (typeof value === "string" ? value : value === undefined ? "(none)" : JSON.stringify(value));
const serviceKey = (value: JsonObject) => `${show(value.id)}.${show(value.instance ?? "default")}`;
const stem = (file: string) => path.basename(file).replace(/\.json$/, "");

function readJson(file: string): unknown {
  try { return JSON.parse(readFileSync(file, "utf8")) as unknown; } catch { return undefined; }
}

/** The folder's pairs: services with their well-known documents and manifests, providers with theirs. */
function checkPairs(run: Run, checked: Checked[]): void {
  const of = (schema: string) => checked.filter((item) => item.schema === schema && isObject(item.value));
  const descriptors = of("service-descriptor.schema.json");
  const manifests = of("manifest.schema.json");
  for (const known of of("service-well-known.schema.json")) {
    const answered = isObject((known.value as JsonObject).service) ? ((known.value as JsonObject).service as JsonObject) : {};
    const byName = descriptors.find((item) => stem(item.file) === stem(known.file).replace(/\.well-known$/, ""));
    // A folder with one descriptor and one well-known document is that pair whatever the files are called, so a
    // document that answers as another service is caught (FAC-SEM-009) rather than left unpaired.
    const only = descriptors.length === 1 && of("service-well-known.schema.json").length === 1 ? descriptors[0] : undefined;
    const pair = byName ?? descriptors.find((item) => serviceKey(item.value as JsonObject) === serviceKey(answered)) ?? only;
    if (pair) addFindings(run, known.file, evaluateSemanticRules("service-observation", { descriptor: pair.value, wellKnown: known.value }));
    else if (descriptors.length > 0) run.notes.push({ file: known.file, path: "/service", rule: "note/pair", message: `no descriptor in the folder is ${serviceKey(answered)} or named ${stem(known.file).replace(/\.well-known$/, "")}.json, so this document is not checked against one (FAC-SEM-009); name it <id>.<instance>.well-known.json` });
  }
  if (descriptors.length > 1) addFindings(run, path.dirname(descriptors[0]?.file as string), evaluateSemanticRules("service-directory", { descriptors: descriptors.map((item) => item.value) }));
  for (const item of descriptors) {
    const named = (item.value as JsonObject).fabricManifest;
    if (typeof named !== "string") continue;
    let manifest = existsSync(expand(named)) ? readJson(expand(named)) : undefined;
    // Checked before it is installed, the manifest sits in the folder rather than at the install path it names.
    if (manifest === undefined && manifests.length === 1) {
      manifest = (manifests[0] as Checked).value;
      run.notes.push({ file: item.file, path: "/fabricManifest", rule: "note/pair", message: `${named} was not found, so the folder's ${(manifests[0] as Checked).relative} is read as the manifest it names (FAC-SEM-020)` });
    }
    addFindings(run, item.file, evaluateSemanticRules("service-manifest", { descriptor: item.value, manifest }));
  }
  const entries = of("provider.schema.json");
  for (const item of entries) {
    const entry = item.value as JsonObject;
    const named = typeof entry.manifest === "string" ? expand(entry.manifest) : "";
    let manifest: unknown;
    if (named !== "" && existsSync(named)) manifest = readJson(named);
    else {
      // The manifest of provider <id> sits in a folder named <id>: the whole segment, so `notes` is not `my-notes`.
      const inFolder = manifests.find((candidate) => path.basename(candidate.relative) === "fabric-agent.json" && path.basename(path.dirname(candidate.relative)) === entry.id) ?? (manifests.length === 1 ? manifests[0] : undefined);
      if (inFolder === undefined) {
        run.notes.push({ file: item.file, path: "/manifest", rule: "note/pair", message: `the manifest ${show(entry.manifest)} was not found, so the entry is not checked against it (FAC-SEM-014)` });
        continue;
      }
      manifest = inFolder.value;
      run.notes.push({ file: item.file, path: "/manifest", rule: "note/pair", message: `${entry.manifest === undefined ? "the entry names no manifest" : `${show(entry.manifest)} was not found`}, so the folder's ${inFolder.relative} is read as the manifest it names (FAC-SEM-014)` });
    }
    addFindings(run, item.file, evaluateSemanticRules("provider-observation", { file: item.relative, entry, manifest }));
  }
  if (entries.length > 0) addFindings(run, path.dirname(entries[0]?.file as string), evaluateSemanticRules("provider-directory", { services: descriptors.map((item) => item.value), providers: entries.map((item) => item.value) }));
}

/** The folder's `.json` files, dot-folders and `node_modules` left out; a folder it cannot read is a usage error. */
function jsonFiles(dir: string, run: Run): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    run.usage.push(`cannot read ${dir}: ${String((error as NodeJS.ErrnoException).code)}`);
    return [];
  }
  return entries
    .filter((entry) => !entry.name.startsWith(".") && entry.name !== "node_modules")
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return jsonFiles(full, run);
      return entry.name.endsWith(".json") ? [full] : [];
    });
}

function schemaName(raw: string): string | undefined {
  const name = raw.endsWith(".schema.json") ? raw : `${raw}.schema.json`;
  return contract().schemas.some((schema) => fileOf(schema) === name) ? name : undefined;
}

function render(run: Run, asJson: boolean): string {
  if (asJson) return `${JSON.stringify({ files: run.files, problems: run.problems, notes: run.notes, usage: run.usage }, null, 2)}\n`;
  // One line per problem: a message that quotes a newline from the file (a JSON parse error) is folded onto it.
  const line = (problem: Problem, accepted = false) => [problem.file, problem.path, accepted ? `${problem.rule} (accepted)` : problem.rule, problem.message.replace(/\s+/g, " "), ...(problem.help === undefined ? [] : [problem.help])].join("  ");
  const lines = [...run.usage.map((text) => `usage error: ${text}`), ...run.problems.map((problem) => line(problem)), ...run.notes.map((note) => line(note, note.rule.startsWith("FAC-SEM-")))];
  return lines.length === 0 ? "" : `${lines.join("\n")}\n`;
}

/** The command, as a function: the arguments after `pnpm validate`, and what it prints and exits with. */
export function main(args: readonly string[]): CliResult {
  const targets: string[] = [];
  let schemaArg: string | undefined;
  let kindArg: string | undefined;
  let asJson = false;
  const asJsonArg = args.includes("--json");
  const usage = (text: string): CliResult => ({ code: 2, out: asJsonArg ? `${JSON.stringify({ files: [], problems: [], notes: [], usage: [text] }, null, 2)}\n` : `usage error: ${text}\n${USAGE}\n` });
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] as string;
    if (arg === "--help" || arg === "-h") return usage("help requested");
    if (arg === "--json") asJson = true;
    else if (arg === "--schema" || arg === "--kind") {
      const value = args[index + 1];
      if (value === undefined || value.startsWith("--")) return usage(`${arg} needs a value`);
      index += 1;
      if (arg === "--schema") {
        schemaArg = schemaName(value);
        if (schemaArg === undefined) return usage(`unknown schema ${value}: name a file under schemas/, with or without .schema.json`);
      } else {
        if (!isSemanticKind(value)) return usage(`unknown kind ${value}: no semantic rule owns it (the kinds are SEMANTIC_KINDS in src/semantic-kinds.ts)`);
        kindArg = value;
      }
    } else if (arg.startsWith("--")) return usage(`unknown option ${arg}`);
    else targets.push(arg);
  }
  if (targets.length === 0) return usage("name a file or a folder");

  const run: Run = { problems: [], notes: [], usage: [], files: [] };
  // `pnpm --dir <checkout> validate ./x` runs in the checkout; a relative path is the author's, from where pnpm was
  // run (INIT_CWD), not the checkout's. Only when this script is the entry: another script that pnpm started may run
  // the command from a folder of its own.
  const base = process.env.npm_lifecycle_event === "validate" && process.env.INIT_CWD !== undefined ? process.env.INIT_CWD : process.cwd();
  for (const named of targets) {
    const target = path.resolve(base, named);
    let folder = false;
    try { folder = statSync(target).isDirectory(); } catch { /* a missing file is reported when it is read */ }
    if (!folder) { checkFile(run, target, target, schemaArg, kindArg); continue; }
    const before = run.usage.length;
    const problemsBefore = run.problems.length;
    const files = jsonFiles(target, run);
    if (files.length === 0 && run.usage.length === before) run.usage.push(`${target} holds no .json file`);
    const checked = files.flatMap((file) => checkFile(run, file, path.relative(target, file), schemaArg, kindArg, true) ?? []);
    // A folder in which no file was a document it could check checked nothing: that is not a clean run.
    if (files.length > 0 && checked.length === 0 && run.usage.length === before && run.problems.length === problemsBefore) run.usage.push(`${target} holds no document this checkout can tell; the files it skipped are noted`);
    checkPairs(run, checked);
  }
  return { code: run.usage.length > 0 ? 2 : run.problems.length > 0 ? 1 : 0, out: render(run, asJson) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = main(process.argv.slice(2));
  process.stdout.write(result.out);
  process.exitCode = result.code;
}
// #endregion validate-cli
