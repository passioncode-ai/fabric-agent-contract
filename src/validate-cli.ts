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
  if (path.basename(path.dirname(file)) === "providers") return "provider.schema.json";
  if (SERVICE_KEY.test(name.replace(/\.json$/, ""))) return "service-descriptor.schema.json";
  return undefined;
}
/** A discriminator member the document carries with a value no schema of this checkout holds, with the values it knows. */
function unknownDiscriminator(value: unknown): { member: string; value: unknown; known: unknown[] } | undefined {
  if (!isObject(value)) return undefined;
  for (const member of ["contractVersion", "protocol"] as const) {
    if (!Object.hasOwn(value, member)) continue;
    const known = [...new Set(contract().discriminated.flatMap((schema) => schema.consts.filter(([name]) => name === member).map(([, constant]) => constant)))];
    if (known.length > 0 && !known.includes(value[member])) return { member, value: value[member], known };
  }
  return undefined;
}
// #endregion schema-inference

// #region hints
const KNOWN_KEYS: readonly string[] = Object.values(EXTENSION_KEYS);
const tail = (key: string) => key.split("/").slice(-2).join("/");
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
          const near = KNOWN_KEYS.find((known) => tail(known) === tail(key));
          let host = "";
          try { host = new URL(key).hostname; } catch { /* not a URL: a vendor key the schema judges */ }
          if (near !== undefined) out.push([here, "hint/extension-key", `${key} is not an extension key the contract defines; did you mean ${near}?`]);
          else if (/(^|\.)passioncode\.ai$/.test(host) && key.includes("/extensions/")) out.push([here, "hint/extension-key", `${key} is not an extension key the contract defines; the contract's keys are listed in src/extensions.ts`]);
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
    const kind = String(profile.kind);
    if (!Object.hasOwn(PROFILE_VERSION, kind)) return;
    const own = PROFILE_VERSION[kind] as string;
    for (const [other, member] of Object.entries(PROFILE_VERSION)) {
      if (member !== own && Object.hasOwn(profile, member)) {
        out.push([`/capabilities/${index}/profile/${member}`, "hint/profile-version", `${member} is the ${other} profile's version member; the ${kind} profile's is ${own}`]);
      }
    }
  });
}
const HINT_HELP = {
  "hint/extension-key": "src/extensions.ts",
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

function checkFile(run: Run, file: string, relative: string, schemaArg: string | undefined, kindArg: string | undefined): Checked | undefined {
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
    run.problems.push({ file, path: "/", rule: "json", message: `the file is not JSON: ${(error as Error).message}` });
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
      run.problems.push({ file, path: `/${unknown.member}`, rule: "schema/const", message: `${unknown.member} ${JSON.stringify(unknown.value)} is not one this checkout reads; it reads ${unknown.known.map((known) => JSON.stringify(known)).join(", ")}` });
      return undefined;
    }
    // A document missing a required member still names what it may be: of the schemas its discriminators match, the
    // ones it misses the fewest required members of, with those members.
    const matching = isObject(value) ? contract().discriminated.filter((candidate) => candidate.consts.length > 0 && candidate.consts.every(([member, constant]) => value[member] === constant)) : [];
    const missing = (candidate: Discriminated) => candidate.required.filter((member) => !Object.hasOwn(value as JsonObject, member));
    const fewest = Math.min(...matching.map((candidate) => missing(candidate).length));
    const near = matching.filter((candidate) => missing(candidate).length === fewest).map((candidate) => `${candidate.file} (missing ${missing(candidate).join(", ")})`);
    run.usage.push(`cannot tell which schema ${file} follows${near.length > 0 ? `: its members match ${near.join(" or ")}` : ""}; pass --schema <name> (a file under schemas/) or --kind <kind>`);
    return undefined;
  }
  const kinds = kindArg !== undefined ? [kindArg] : documentKindsOf(schema as string);
  run.files.push({ file, schema: schema ?? null, kinds });
  if (schema !== undefined) {
    const validate = contract().validator.getSchema(`${SCHEMA_PREFIX}schemas/${schema}`) as ValidateFunction;
    validate(value);
    for (const line of formatSchemaErrors(validate.errors ?? [])) run.problems.push({ file, path: line.instancePath || "/", rule: `schema/${line.keyword}`, message: line.message, help: `schemas/${schema.replace(/#.*$/, "")}` });
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
const serviceKey = (value: JsonObject) => `${String(value.id)}.${String(value.instance ?? "default")}`;
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
      const inFolder = manifests.find((candidate) => candidate.relative.endsWith(`${String(entry.id)}/fabric-agent.json`)) ?? (manifests.length === 1 ? manifests[0] : undefined);
      if (inFolder === undefined) {
        run.notes.push({ file: item.file, path: "/manifest", rule: "note/pair", message: `the manifest ${String(entry.manifest)} was not found, so the entry is not checked against it (FAC-SEM-014)` });
        continue;
      }
      manifest = inFolder.value;
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
  // run (INIT_CWD), not the checkout's.
  const base = process.env.INIT_CWD ?? process.cwd();
  for (const named of targets) {
    const target = path.resolve(base, named);
    let folder = false;
    try { folder = statSync(target).isDirectory(); } catch { /* a missing file is reported when it is read */ }
    if (!folder) { checkFile(run, target, target, schemaArg, kindArg); continue; }
    const files = jsonFiles(target, run);
    if (files.length === 0 && run.usage.length === 0) run.usage.push(`${target} holds no .json file`);
    const checked = files.flatMap((file) => checkFile(run, file, path.relative(target, file), schemaArg, kindArg) ?? []);
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
