// #region validate-cli (docs: docs/specification/conformance.md#the-checker)
/**
 * REQ-01 (contract review 2026-10-21): `pnpm validate <file|dir> [--schema <name>] [--kind <kind>] [--json]`, an
 * author's first check. For each JSON file it infers the schema (or takes `--schema`), validates the document, runs
 * the semantic kinds that read it whole (or the `--kind` named), and adds hints the rules do not give (a near-miss
 * extension key, a profile version member on the wrong profile). A folder is also checked as pairs: a service
 * descriptor with its well-known document, the descriptors together, a descriptor with the manifest it names, a
 * provider entry with its manifest, the entries with the services, and a source manifest with the package beside it
 * (DEC-0149). `--kind source-tree` on a folder reads its `fabric.source.json` and checks the source files under it.
 *
 * Each problem is one line, `file  path  rule  message  help`. Exit 0 when there is no blocking problem (accepted lines
 * may print); 1: a problem; 2: a usage error
 * (an unreadable file, an unknown `--schema` or `--kind`, a schema that cannot be inferred).
 */
import { spawnSync } from "node:child_process";
import { type Dirent, accessSync, closeSync, constants as fsConstants, existsSync, lstatSync, openSync, readFileSync, readSync, readdirSync, readlinkSync, statSync } from "node:fs";
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
import { PACKAGE_FILE } from "./package-rules.js";
import { type IncludeIndex, PATH_READ_LIMIT, SOURCE_FILE, atManifestPath, excludedFolderTest, foldOnlyExcludeTest, foldPath, foldSegment, inGrammar, isManifestGrammarFinding, isDotGitSegment, sourceFolderTest, findingAt, longRunAt, includeIndex, labelledByIndex, masked, messageLead, nestedTest, pathHoldsFinding, sourcePathTest, uncheckedTest, wordHoldsFinding } from "./source-rules.js";
import { createValidatorSync, formatSchemaErrors } from "./validator.js";

export interface Problem { file: string; path: string; rule: string; message: string; help?: string }
export interface CliResult { code: 0 | 1 | 2; out: string }

const USAGE = [
  "usage: pnpm validate <file|dir> [--schema <name>] [--kind <kind>] [--json]",
  "  --schema <name>  validate against schemas/<name>.schema.json instead of the inferred schema",
  "  --kind <kind>    run this semantic kind (src/semantic-kinds.ts) instead of the inferred ones; add --schema to validate too",
  "  --kind source-tree <dir, fabric.source.json or a source-tree document>",
  "                   check an agent's source (DEC-0149): a folder holding fabric.source.json, the folder of a",
  "                   fabric.source.json named, or a source-tree document. In a Git work tree that lists the source it",
  "                   reads what Git would commit, otherwise the folder's files; it prints paths relative to the folder.",
  "                   No list of installation strings is read from a file or configuration here: a source-tree document",
  "                   is checked with the instanceStrings it carries, and the operator's own list is checked in the",
  "                   operator's tool. One target per run.",
  "  --kind source-package <dir or a {source, package} document>",
  "                   check a source manifest against its package (FAC-SEM-160): on a folder, fabric.source.json with",
  "                   the fabric.package.json beside it, and a note, exit 0, when the folder holds no fabric.package.json",
  "                   there; a document that holds no {source, package} prints a note. A folder is the only target",
  "                   of its run; documents may be several.",
  "  --json           print one JSON document: files, problems, notes, usage",
  "exit 0: no blocking problem (accepted lines may print); 1: a problem; 2: a usage error"
].join("\n");
const root = projectRoot();

interface Discriminated { file: string; required: string[]; consts: Array<[string, unknown]> }
let cache: { validator: Ajv2020; schemas: ContractSchema[]; help: Map<string, string>; discriminated: Discriminated[]; blindProtocols: Map<string, string[]> } | undefined;
function contract() {
  if (cache === undefined) {
    const schemas = loadSchemasSync();
    cache = {
      validator: createValidatorSync({ verbose: true }),
      schemas,
      help: ruleHelp(readFileSync(path.join(root, "docs/specification/conformance.md"), "utf8")),
      discriminated: schemas.map((schema) => discriminated(schema, schemas)),
      blindProtocols: blindProtocols(schemas)
    };
  }
  return cache;
}

const fileOf = (schema: ContractSchema) => schema.$id.slice(`${SCHEMA_PREFIX}schemas/`.length);

// #region schema-inference
/**
 * The protocols a schema without top-level `properties` uses (a `oneOf` of shapes: `device-check-in`, `activity-notice`):
 * its discriminators are out of the checker's sight, so a document of that protocol is never given to a sibling schema
 * by the protocol signal alone.
 */
export function blindProtocols(schemas: readonly ContractSchema[]): Map<string, string[]> {
  const commonProtocol = new Map(schemas.flatMap((schema) => {
    const defs = isObject(schema.$defs) ? schema.$defs : {};
    const protocol = isObject(defs.protocol) ? defs.protocol.const : undefined;
    return typeof protocol === "string" ? [[fileOf(schema), protocol] as const] : [];
  }));
  const out = new Map<string, string[]>();
  const add = (protocol: string, file: string) => out.set(protocol, [...new Set([...(out.get(protocol) ?? []), file])]);
  for (const schema of schemas) {
    // A common schema (`service-common`) defines its protocol in `$defs` and describes no document of its own.
    if (isObject(schema.properties) || commonProtocol.has(fileOf(schema))) continue;
    const text = JSON.stringify(schema);
    for (const match of text.matchAll(/"const":"(fabric-[a-z0-9-]+\/[0-9.]+)"/g)) add(match[1] as string, fileOf(schema));
    for (const match of text.matchAll(/"\$ref":"([a-z0-9-]+\.schema\.json)#\/\$defs\/protocol"/g)) add(commonProtocol.get(match[1] as string) as string, fileOf(schema));
  }
  return out;
}

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
  if (name === SOURCE_FILE) return "fabric-source.schema.json";
  // A file by the lock's name is a pin, damaged or not, unless it carries no pin member (`contract`, `commit`) and the
  // members another tool's lock has (the observatory engine's profile lock: `schemas`, `releases`, `schemaRelease`).
  if (name === "fabric-contract.lock.json" && !(isObject(value) && !carries(value, ["contract", "commit"]) && (Object.hasOwn(value, "schemas") || Object.hasOwn(value, "releases") || Object.hasOwn(value, "schemaRelease")))) return "contract-pin.schema.json";
  // A JSON Schema (a `*.schema.json` file, a top-level `$schema`) is no contract document, whatever its name looks like.
  // A `$schema` that names a JSON Schema dialect marks a schema; one that names a contract schema is an editor's hint
  // on a contract document, which the name rules below still read.
  if (name.endsWith(".schema.json") || isJsonSchema(value)) return undefined;
  // A provider entry is told by its own members wherever it is saved (the guide saves it as <id>.json): its provider id,
  // and the manifest path it names or the run it declares.
  if (isObject(value) && typeof value.providerId === "string" && (typeof value.manifest === "string" || isObject(value.run))) return "provider.schema.json";
  // A name alone is weak evidence (`tsconfig.build.json`, `reports.query.json` look like a service key), so the two
  // weaker name rules take a document only when it carries a member that document kind has.
  if (path.basename(path.dirname(file)) === "providers" && carries(value, PROVIDER_MEMBERS)) return "provider.schema.json";
  if (SERVICE_KEY.test(name.replace(/\.json$/, "")) && carries(value, DESCRIPTOR_MEMBERS)) return "service-descriptor.schema.json";
  return undefined;
}
/** Members only a provider entry or a service descriptor has; one is enough for the name rule to take the file. */
const PROVIDER_MEMBERS = ["protocol", "providerId", "run", "manifest"] as const;
const DESCRIPTOR_MEMBERS = ["protocol", "origin", "lifecycle", "fabricManifest"] as const;
/** `protocol` counts only as a contract protocol (`fabric-…`): `{protocol: "https"}` is any server's config. */
const carries = (value: unknown, members: readonly string[]) => isObject(value) && members.some((member) =>
  Object.hasOwn(value, member) && (member !== "protocol" || (typeof value.protocol === "string" && value.protocol.startsWith("fabric-"))));

/**
 * A JSON Schema rather than a document: a `$schema` naming a JSON Schema dialect (a contract schema's URL in `$schema`
 * is an editor's hint on a contract document), or a `$id` beside `type` or `properties`.
 */
function isJsonSchema(value: unknown): boolean {
  if (!isObject(value)) return false;
  if (typeof value.$schema === "string" && /^https?:\/\/json-schema\.org\//.test(value.$schema)) return true;
  return typeof value.$id === "string" && (Object.hasOwn(value, "type") || Object.hasOwn(value, "properties"));
}

const CONTRACT_SHAPE = { protocol: /^fabric-[a-z0-9-]+\/[0-9]+(\.[0-9]+)*$/, contractVersion: /^[0-9]+\.[0-9]+\.[0-9]+$/ } as const;

/** A discriminator member the document carries with a value no schema of this checkout holds, with the values it knows. */
function unknownDiscriminator(value: unknown): { member: string; value: unknown; known: unknown[] } | undefined {
  if (!isObject(value)) return undefined;
  for (const member of ["contractVersion", "protocol"] as const) {
    // A value shaped like the contract's (`<name>/<revision>`, a semantic version) that this checkout does not hold is
    // the author's to fix, and so is a number, an array or a boolean; an object (an MCP handshake in a probe receipt) or
    // a string of another shape (an MCP date revision in a test fixture) is some other document's member.
    if (!Object.hasOwn(value, member) || isObject(value[member])) continue;
    if (typeof value[member] === "string" && !CONTRACT_SHAPE[member].test(value[member] as string)) continue;
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

/**
 * `checkFileAs`, and for a source check (DEC-0149) whatever it added made instance-free whatever schema or rule spoke:
 * every path through `shownPointer`, every message through `masked`, and, outside a folder run, the file named by its
 * basename (or its place when that holds a finding) in files, problems, notes and usage errors alike.
 */
function checkFile(run: Run, file: string, relative: string, schemaArg: string | undefined, kindArg: string | undefined, inFolder = false): Checked | undefined {
  const before = { problems: run.problems.length, notes: run.notes.length, usage: run.usage.length, files: run.files.length };
  let checked: Checked | undefined;
  // The schema checkFileAs settles on, inferred from the content too: a fault after it is a source check's by that.
  const settled: { schema?: string } = {};
  try {
    checked = checkFileAs(run, file, relative, schemaArg, kindArg, inFolder, settled);
  } catch (error) {
    // A source check never ends without its report: what threw is a usage error naming the file by its shown name and
    // the error by its name only, never its message, which may quote the input.
    if (!sourceCheck(file, settled.schema ?? schemaArg, kindArg)) throw error;
    // Nothing half-written stays: it names the file by its path before the source check made it instance-free.
    run.problems.length = before.problems;
    run.notes.length = before.notes;
    run.usage.length = before.usage;
    run.files.length = before.files;
    run.usage.push(`cannot check ${inFolder ? relative : shownPath(path.basename(file))}: ${errorName(error)}`);
    return undefined;
  }
  if (!sourceCheck(file, checked?.schema ?? schemaArg, kindArg)) return checked;
  const own = (text: string) => (inFolder ? text : text.split(file).join(shownPath(path.basename(file))));
  // The tree check's document form names a file by its path when that path holds nothing: that lead is not masked
  // again, as in a folder run (a path of ordinary names is no run, read per segment).
  const treeFiles = isObject(checked?.value) && Array.isArray((checked?.value as JsonObject).files) ? ((checked?.value as JsonObject).files as unknown[]) : [];
  const leadOf = (item: Problem): string => {
    const at = /^\/files\/(\d+)/.exec(item.path);
    const entry = at === null ? undefined : treeFiles[Number(at[1])];
    return messageLead(item.message, isObject(entry) ? entry.path : undefined);
  };
  for (const item of [...run.problems.slice(before.problems), ...run.notes.slice(before.notes)]) {
    const lead = leadOf(item);
    item.file = own(item.file);
    item.path = shownPointer(item.path);
    item.message = `${lead}${masked(own(item.message.slice(lead.length)), item.path)}`;
  }
  for (const item of run.files.slice(before.files)) item.file = own(item.file);
  for (let index = before.usage; index < run.usage.length; index += 1) run.usage[index] = masked(own(run.usage[index] as string), "/");
  return checked;
}

function checkFileAs(run: Run, file: string, relative: string, schemaArg: string | undefined, kindArg: string | undefined, inFolder = false, settled: { schema?: string } = {}): Checked | undefined {
  // A source check states a file before it reads it (DEC-0149): a source document named on its own, a folder's manifest,
  // the document form of `--kind source-tree`. Any other file is read as before (a piped `/dev/stdin` is read).
  if (sourceCheck(file, schemaArg, kindArg) && !sourceRegularFile(file)) {
    run.usage.push(`cannot read ${inFolder ? relative : file}: not a file`);
    return undefined;
  }
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    // A source document in a folder run is named by its path in the folder, never by an absolute path the masks would hide.
    run.usage.push(`cannot read ${inFolder && sourceCheck(file, schemaArg, kindArg) ? relative : file}: ${String((error as NodeJS.ErrnoException).code)}`);
    return undefined;
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    // A file that does not parse is a problem even in a folder: by its name alone a broken descriptor
    // (`example-agent.default.json`) and a JSONC config (`tsconfig.base.json`) cannot be told apart.
    // A source check (DEC-0149) prints the position only: the parser's own message may quote the input.
    run.problems.push({ file, path: "/", rule: "json", message: sourceCheck(file, schemaArg, kindArg) ? parsePosition(text) : `the file is not JSON: ${(error as Error).message}`, help: "docs/specification/conformance.md" });
    return undefined;
  }
  // `--kind` runs that rule instead of the inferred ones, and validates only with `--schema`: a rule's input is often
  // a wrapper or part of a document, which no schema describes whole.
  // The name rules read the file's own path, so a `providers/` folder named as the target is still `providers/`.
  let schema = schemaArg ?? (kindArg === undefined ? inferSchema(value, file) : undefined);
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
    const closest = matching.filter((candidate) => missing(candidate).length === fewest);
    // A `protocol` string a contract schema pins (`fabric-service/0.1`) says the file is a contract document: the one
    // schema it misses the fewest members of checks it, and its missing members are problems (exit 1). A shared
    // `contractVersion` says less: a probe receipt or a report carries it too, so it only names the near schemas.
    // Only where every schema of that protocol is in sight. A `.well-known.json` file is the well-known document
    // whatever it misses, so a half-written one is not checked as a usage report that shares its protocol.
    // A protocol a `oneOf` schema shares is settled by validation: the first of its schemas, the `oneOf` ones included,
    // that accepts the document checks it; when none does, no schema is picked (a problem in a folder).
    // The protocol sits in `protocol` (`fabric-device/0.1`) or, for a sealed call and its plaintext, in `type`
    // (`fabric-agent-call/1`, DEC-0106).
    const blindMember = isObject(value) ? (["protocol", "type"] as const).find((member) => contract().blindProtocols.has(value[member] as string)) : undefined;
    const blindFiles = blindMember !== undefined ? contract().blindProtocols.get((value as JsonObject)[blindMember] as string) : undefined;
    const blind = blindFiles !== undefined;
    if (blind) {
      const family = [...(blindFiles as string[]), ...matching.filter((candidate) => candidate.consts.some(([member]) => member === blindMember)).map((candidate) => candidate.file)];
      const accepting = family.find((candidate) => (contract().validator.getSchema(`${SCHEMA_PREFIX}schemas/${candidate}`) as ValidateFunction)(value));
      if (accepting !== undefined) schema = accepting;
    }
    const protocolMatches = blind ? [] : matching.filter((candidate) => candidate.consts.some(([member]) => member === "protocol"));
    const wellKnown = file.endsWith(".well-known.json") ? protocolMatches.filter((candidate) => candidate.file === "service-well-known.schema.json") : [];
    const byProtocol = wellKnown.length === 1 ? wellKnown : protocolMatches.filter((candidate) => closest.includes(candidate));
    if (schema !== undefined) { /* settled by validation above */ }
    else if (byProtocol.length === 1) schema = (byProtocol[0] as Discriminated).file;
    else {
      const near = closest.map((candidate) => `${candidate.file} (missing ${missing(candidate).join(", ")})`);
      // A document whose closest schema is the source manifest's is a source check for naming (DEC-0149): named on
      // its own, it is named by its basename (or its place), never by its path.
      const sourceNear = !inFolder && closest.some((candidate) => candidate.file === "fabric-source.schema.json");
      const text = `cannot tell which schema ${sourceNear ? shownPath(path.basename(file)) : file} follows${near.length > 0 ? `: its members match ${near.join(" or ")}` : ""}; pass --schema <name> (a file under schemas/) or --kind <kind>`;
      // In a folder, a file that names a contract protocol shared by several schemas is the author's to fix; any other
      // file the checker cannot tell (a test fixture, a JSON Schema, a probe receipt) is noted and not checked. A file
      // named on its own is a usage error.
      if (inFolder && (byProtocol.length > 1 || (blind && closest.length > 0))) run.problems.push({ file, path: "/", rule: "schema/required", message: text.replace(/; pass --schema.*$/, "; pass --schema to say which"), help: `schemas/${((byProtocol[0] ?? closest[0]) as Discriminated).file}` });
      else if (inFolder) run.notes.push({ file, path: "/", rule: "note/skipped", message: `${text.replace(/; pass --schema.*$/, "")}; not checked (pass --schema to check it)` });
      else run.usage.push(text);
      return undefined;
    }
  }
  if (schema !== undefined) settled.schema = schema;
  const kinds = kindArg !== undefined ? [kindArg] : documentKindsOf(schema as string);
  run.files.push({ file, schema: schema ?? null, kinds });
  let schemaFailed = false;
  if (schema !== undefined) {
    const validate = contract().validator.getSchema(`${SCHEMA_PREFIX}schemas/${schema}`) as ValidateFunction;
    schemaFailed = validate(value) !== true;
    for (const line of formatSchemaErrors(validate.errors ?? [], { instanceFree: sourceCheck(file, schema, kindArg) })) {
      const problem = { file, path: line.instancePath || "/", rule: `schema/${line.keyword}`, message: line.message, help: `schemas/${schema.replace(/#.*$/, "")}` };
      // A lock member the pin schema does not define is a note, as `pnpm pin:check` reads it (kit-written locks carry
      // `adapter` and `kit`).
      if (schema === "contract-pin.schema.json" && line.keyword === "additionalProperties") run.notes.push({ ...problem, rule: "note/lock-member" });
      else run.problems.push(problem);
    }
  }
  // A source manifest that fails its schema is reported alone: its rules run once it validates (DEC-0149).
  const sourceFailed = schemaFailed && schema === "fabric-source.schema.json";
  for (const kind of kinds) if (!sourceFailed) addFindings(run, file, evaluateSemanticRules(kind, value));
  // The pair rule reads `{source, package}`; a document without both is not a pair, and saying nothing would read as one
  // that passed.
  if (kinds.includes("source-package") && !(isObject(value) && isObject(value.source) && isObject(value.package))) {
    run.notes.push({ file, path: "/", rule: "note/pair", message: "the document holds no {source, package} pair, so no pair was checked (FAC-SEM-160)" });
  }
  // A source check prints no hint of any kind: a hint quotes the document's own keys and values.
  if (sourceCheck(file, schema, kindArg)) return { file, relative, value, schema };
  const hints: Hint[] = [];
  extensionHints(value, "", hints);
  profileHints(schema, value, hints);
  // A hint is advice, never a failure: a vendor key the contract does not know is legal, so a near miss is reported
  // beside the result and the exit code ignores it.
  readerHints(schema, value, hints);
  for (const [at, rule, message] of hints) run.notes.push({ file, path: at, rule, message, help: HINT_HELP[rule] });
  return { file, relative, value, schema };
}

/** `~/` and `~\\` (a Windows local path, DEC-0032) are the home folder. */
const expand = (local: string) => (/^~[\\/]/.test(local) ? path.join(homedir(), local.slice(2)) : local);
/** A document value as text, never a throw: a member may be any JSON, an object whose `toString` is data included. */
const show = (value: unknown) => (typeof value === "string" ? value : value === undefined ? "(none)" : JSON.stringify(value));
const serviceKey = (value: JsonObject) => `${show(value.id)}.${show(value.instance ?? "default")}`;
const stem = (file: string) => path.basename(file).replace(/\.json$/, "");

function readJson(file: string): unknown {
  try { return JSON.parse(readFileSync(file, "utf8")) as unknown; } catch { return undefined; }
}

/**
 * The manifest a descriptor or an entry names. A file at the named path is read: installed, or the folder's own copy
 * at that path. With nothing there (checked before it is installed), the folder's copy stands in: a manifest with the
 * named file name in a folder named after this owner (`<id>/`, `<id>.<instance>/`), else at the folder's top, else the
 * folder's only manifest, never one in a folder named after another owner. A note names the file read when a folder
 * copy stands in, when an installed file is read over a folder copy that could have stood in, and (through `quiet`)
 * when the pair rule fails on an installed file. `located` is false when no file stands for the manifest.
 */
function pairedManifest(run: Run, item: Checked, named: string, manifests: readonly Checked[], owners: readonly string[], others: ReadonlySet<string>, at: string, rule: string): { located: boolean; value: unknown; quiet?: string } {
  const installed = expand(named);
  const atPath = manifests.find((candidate) => path.resolve(candidate.file) === path.resolve(installed));
  if (atPath !== undefined) return { located: true, value: atPath.value };
  const base = installed.split(/[\\/]/).pop() as string;
  const folderOf = (candidate: Checked) => path.basename(path.dirname(candidate.relative));
  const named_ = (where: (candidate: Checked) => boolean) => manifests.find((candidate) => path.basename(candidate.relative) === base && where(candidate));
  // The folder copy that would stand in for this owner's manifest: never one in a folder named after another owner.
  const standIn = named_((candidate) => owners.includes(folderOf(candidate)))
    ?? named_((candidate) => path.dirname(candidate.relative) === "." )
    ?? (manifests.length === 1 && !others.has(folderOf(manifests[0] as Checked)) ? manifests[0] : undefined);
  if (existsSync(installed)) {
    if (statSync(installed).isDirectory()) {
      run.notes.push({ file: item.file, path: at, rule: "note/pair", message: `${installed} is a folder, not a manifest file (${rule})` });
      return { located: true, value: undefined };
    }
    // A FIFO, a socket or a device is never read: reading a FIFO waits for a writer forever.
    if (!regularFile(installed)) {
      run.notes.push({ file: item.file, path: at, rule: "note/pair", message: `${installed} is not a file, so no manifest was read (${rule})` });
      return { located: true, value: undefined };
    }
    const value = readJson(installed);
    if (value === undefined) run.notes.push({ file: item.file, path: at, rule: "note/pair", message: `the installed ${installed} does not parse as JSON (${rule})` });
    // The folder's own copy is not paired once a manifest is installed: say so, and how to check the copy.
    else if (standIn !== undefined) run.notes.push({ file: item.file, path: at, rule: "note/pair", message: `the installed ${installed} is read as the manifest, not the folder's ${standIn.relative} (reinstall it, or check the folder's copy in a folder without the installed path) (${rule})` });
    // Otherwise the read is the ordinary one and stays quiet, unless the pair rule then fails (`quiet`, said by the caller).
    return { located: true, value, ...(value !== undefined && standIn === undefined ? { quiet: installed } : {}) };
  }
  if (standIn === undefined) return { located: false, value: undefined };
  run.notes.push({ file: item.file, path: at, rule: "note/pair", message: `${named} is not installed yet, so the folder's ${standIn.relative} is read as the manifest it names (${rule})` });
  return { located: true, value: standIn.value };
}

/** A pair rule's findings; when they fail against an installed manifest read quietly, a note names that file. */
function pairFindings(run: Run, item: Checked, quiet: string | undefined, at: string, findings: Finding[]): void {
  addFindings(run, item.file, findings);
  if (quiet !== undefined && findings.some((finding) => finding.severity !== "accepted")) {
    run.notes.push({ file: item.file, path: at, rule: "note/pair", message: `the manifest read is the installed ${quiet}; if it is stale, reinstall it` });
  }
}

/** The folder's pairs: services with their well-known documents and manifests, providers with theirs. */
function checkPairs(run: Run, checked: Checked[], kindArg?: string): void {
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
  // Every owner the folder holds, so a manifest in another owner's folder never stands in for this one's.
  const entriesHere = of("provider.schema.json");
  const allOwners = new Set([...descriptors.flatMap((item) => { const value = item.value as JsonObject; return [show(value.id), `${show(value.id)}.${show(value.instance ?? "default")}`]; }), ...entriesHere.map((item) => show((item.value as JsonObject).id))]);
  for (const item of descriptors) {
    const value = item.value as JsonObject;
    const named = value.fabricManifest;
    if (typeof named !== "string") continue;
    const owners = [show(value.id), `${show(value.id)}.${show(value.instance ?? "default")}`];
    const others = new Set([...allOwners].filter((owner) => !owners.includes(owner)));
    const { value: manifest, quiet } = pairedManifest(run, item, named, manifests, owners, others, "/fabricManifest", "the descriptor's pair rule, FAC-SEM-020 in the register");
    pairFindings(run, item, quiet, "/fabricManifest", evaluateSemanticRules("service-manifest", { descriptor: item.value, manifest }));
  }
  const entries = entriesHere;
  for (const item of entries) {
    const entry = item.value as JsonObject;
    // A manifest member that is not a string is the schema's error; there is nothing to pair.
    if (entry.manifest !== undefined && typeof entry.manifest !== "string") continue;
    const owners = [show(entry.id)];
    const others = new Set([...allOwners].filter((owner) => !owners.includes(owner)));
    if (entry.manifest === undefined) {
      // With no manifest named, the manifest in a folder named after the entry, or the folder's only one, is its pair.
      const own = manifests.find((candidate) => path.basename(candidate.relative) === "fabric-agent.json" && path.basename(path.dirname(candidate.relative)) === entry.id)
        ?? (manifests.length === 1 && !others.has(path.basename(path.dirname((manifests[0] as Checked).relative))) ? manifests[0] : undefined);
      if (own === undefined) {
        run.notes.push({ file: item.file, path: "/manifest", rule: "note/pair", message: "the entry names no manifest, so the entry is not checked against it (FAC-SEM-014)" });
        continue;
      }
      run.notes.push({ file: item.file, path: "/manifest", rule: "note/pair", message: `the entry names no manifest, so the folder's ${own.relative} is read as the manifest it names (FAC-SEM-014)` });
      addFindings(run, item.file, evaluateSemanticRules("provider-observation", { file: item.relative, entry, manifest: own.value }));
      continue;
    }
    const { located, value: manifest, quiet } = pairedManifest(run, item, entry.manifest, manifests, owners, others, "/manifest", "the entry's pair rule, FAC-SEM-014 in the register");
    if (!located) {
      run.notes.push({ file: item.file, path: "/manifest", rule: "note/pair", message: `the manifest ${entry.manifest} was not found, so the entry is not checked against it (FAC-SEM-014)` });
      continue;
    }
    // A located manifest that does not parse goes to the rule as it is: it does not resolve to a provider manifest.
    pairFindings(run, item, quiet, "/manifest", evaluateSemanticRules("provider-observation", { file: item.relative, entry, manifest }));
  }
  if (entries.length > 0) addFindings(run, path.dirname(entries[0]?.file as string), evaluateSemanticRules("provider-directory", { services: descriptors.map((item) => item.value), providers: entries.map((item) => item.value) }));
  // DEC-0149: a source manifest and the package beside it, by their file names (FAC-SEM-160); with `--kind
  // source-package` too, which checks each file without a schema, so the pair is the one that kind names.
  const pairOf = (schema: string, name: string) => checked.filter((item) => path.basename(item.relative) === name && isObject(item.value) && (item.schema === schema || (kindArg === "source-package" && item.schema === undefined)));
  for (const source of pairOf("fabric-source.schema.json", SOURCE_FILE)) {
    const beside = pairOf("fabric-package.schema.json", PACKAGE_FILE).find((item) => path.dirname(item.relative) === path.dirname(source.relative));
    if (beside === undefined) {
      // The entry beside the manifest by lstat: any entry there (skipped, unreadable, a link, a dangling link, not a
      // regular file) that was not read as a package is said so, never passed silently; "holds no" only when there is
      // no entry at all.
      let entry = true;
      try { lstatSync(path.join(path.dirname(source.file), PACKAGE_FILE)); } catch (error) { entry = (error as NodeJS.ErrnoException).code !== "ENOENT"; }
      if (kindArg === "source-package") run.notes = run.notes.filter((note) => note.rule !== "note/pair" || note.file !== source.file);
      if (entry) run.notes.push({ file: source.file, path: "/", rule: "note/pair", message: `the ${PACKAGE_FILE} beside ${SOURCE_FILE} was not read as a package, so no pair was checked (FAC-SEM-160)` });
      else if (kindArg === "source-package") run.notes.push({ file: source.file, path: "/", rule: "note/pair", message: `the folder holds no ${PACKAGE_FILE} beside ${SOURCE_FILE}, so no pair was checked (FAC-SEM-160)` });
      continue;
    }
    // The pair was checked, so neither file keeps the note that it holds none.
    run.notes = run.notes.filter((note) => note.rule !== "note/pair" || (note.file !== source.file && note.file !== beside.file));
    // The pair is a source check too: a fault in it adds nothing but one usage error naming the error only.
    let findings: Finding[];
    try {
      findings = evaluateSemanticRules("source-package", { source: source.value, package: beside.value });
    } catch (error) {
      // Named by its path in the folder run, so two pairs are told apart.
      run.usage.push(`cannot check ${shownPath(source.relative)}: ${errorName(error)}`);
      continue;
    }
    addFindings(run, source.file, findings);
  }
}

/** Whether a file's first BINARY_PROBE bytes hold a NUL, reading only those bytes. */
function probeHoldsNul(file: string): boolean {
  const descriptor = openSync(file, "r");
  try {
    const probe = Buffer.alloc(BINARY_PROBE);
    const read = readSync(descriptor, probe, 0, BINARY_PROBE, 0);
    return probe.subarray(0, read).includes(0);
  } finally {
    closeSync(descriptor);
  }
}

/** A file is binary when its first 8 KiB hold a NUL byte (DEC-0149), as Git and the adapter's check read it. */
const BINARY_PROBE = 8192;

/**
 * The variables that point Git at another repository, index or configuration than the folder's own (every hook in a
 * linked worktree gets `GIT_DIR` and `GIT_INDEX_FILE`); Git runs without them, as the adapter's `_git_files` does, and
 * also without `GIT_CONFIG*`. `GIT_CEILING_DIRECTORIES` is kept: it is the caller's fence, which the adapter keeps too.
 */
const GIT_LOCATION = /^(?:GIT_DIR|GIT_WORK_TREE|GIT_INDEX_FILE|GIT_OBJECT_DIRECTORY|GIT_COMMON_DIR|GIT_ALTERNATE_OBJECT_DIRECTORIES|GIT_NAMESPACE|GIT_PREFIX|GIT_CONFIG.*)$/i;

/**
 * `git` from PATH's absolute folders only (the adapter's `_git()`): an empty or relative PATH element is the current
 * folder, and on Windows the process launcher looks in the current folder first, so a checked tree could run its own
 * `git`. With PATH unset, POSIX's default folders `/bin` and `/usr/bin`; on Windows none, so no git and a walk. Never a
 * `.cmd` or `.bat`.
 */
export function gitExecutable(environment: NodeJS.ProcessEnv = process.env, platform: NodeJS.Platform = process.platform): string | undefined {
  const name = platform === "win32" ? "git.exe" : "git";
  const raw = environment.PATH ?? environment.Path;
  const folders = raw === undefined ? (platform === "win32" ? [] : ["/bin", "/usr/bin"]) : raw.split(platform === "win32" ? ";" : ":");
  for (const folder of folders) {
    if (folder === "" || !(platform === "win32" ? path.win32.isAbsolute(folder) : path.posix.isAbsolute(folder))) continue;
    const candidate = path.join(folder, name);
    try {
      if (!statSync(candidate).isFile()) continue;
      if (platform !== "win32") accessSync(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
}

/** Git in the folder, its own configuration's file-system monitor off (`--others` would run a command it names). */
/** How long `--kind source-tree` waits for one Git command before it walks the folder instead; a test may shorten it. */
export const gitLimits = { timeoutMs: 60_000, maxBuffer: 256 * 1024 * 1024 };
const git = (executable: string, folder: string, args: readonly string[]) => spawnSync(executable, ["-c", "core.fsmonitor=", ...args], {
  cwd: folder,
  maxBuffer: gitLimits.maxBuffer,
  timeout: gitLimits.timeoutMs,
  env: Object.fromEntries(Object.entries(process.env).filter(([name]) => !GIT_LOCATION.test(name)))
});

interface Candidate { path: string; nested?: true }

/**
 * A path in the folder as a message may print it: as written, or, when it holds a finding (a home folder, a credential,
 * a credential file by its name), as its longest leading folder that holds none.
 */
export function shownPath(relative: string): string {
  if (relative === "") return ".";
  // A name longer than any source path (`PATH_READ_LIMIT` UTF-16 units) is never printed nor read whole.
  if (relative.length > PATH_READ_LIMIT) return "<a path that may hold a finding, under .>";
  // A path is placed when it holds a finding or an e-mail address: an address in a path is no finding, never printed.
  // A long run across segments (`/` included) places a name too, so a value split at `/` never shows a part of it.
  const placed = (text: string) => pathHoldsFinding(text) || labelledByIndex(text) || longRunAt(text) >= 0;
  if (!placed(relative)) return relative;
  const parts = relative.split("/");
  // The clean prefix stops before the segment where a finding, an address or a long run of the whole path starts, so a
  // value that runs across a `/` never shows its first part, and before the first prefix that holds one of its own.
  const starts = [findingAt(relative, true), longRunAt(relative)].filter((index) => index >= 0);
  const at = starts.length === 0 ? -1 : Math.min(...starts);
  const touched = at < 0 ? parts.length - 1 : relative.slice(0, at).split("/").length - 1;
  let clean = 0;
  while (clean < Math.min(parts.length - 1, touched) && !placed(parts.slice(0, clean + 1).join("/"))) clean += 1;
  // A finding is "may hold": a long run across segments is read conservatively, never confirmed.
  const what = labelledByIndex(relative) && !pathHoldsFinding(relative) && longRunAt(relative) < 0 ? "whose name holds an e-mail address" : "that may hold a finding";
  return `<a path ${what}, under ${clean === 0 ? "." : `${parts.slice(0, clean).join("/")}/`}>`;
}

/**
 * Git's NUL-separated names as bytes. A name that does not round-trip as UTF-8 is named by its position in Git's list,
 * never by its bytes.
 */
/** A name as UTF-8 when it round-trips, else undefined: a name that does not is never decoded into another. */
const decodedName = (raw: Buffer): string | undefined => {
  const text = raw.toString("utf8");
  return Buffer.from(text, "utf8").equals(raw) ? text : undefined;
};

/**
 * The names the index records as gitlinks (mode 160000), from `git ls-files -z --stage` (cached entries only, each
 * `<mode> <object> <stage>` and a tab before its name): a submodule, whatever the work tree holds there.
 */
export function gitlinkNames(stdout: Buffer): string[] {
  const links: string[] = [];
  for (let start = 0, end = stdout.indexOf(0); start < stdout.length; start = end + 1, end = stdout.indexOf(0, start)) {
    const record = stdout.subarray(start, end < 0 ? stdout.length : end);
    if (end < 0) end = stdout.length;
    const tab = record.indexOf(9);
    if (tab < 0 || !record.subarray(0, tab).toString("latin1").startsWith("160000 ")) continue;
    const name = decodedName(record.subarray(tab + 1));
    if (name !== undefined) links.push(name);
  }
  return links;
}

export function gitNames(stdout: Buffer): { names: string[]; unreadable: number[]; folders: string[] } {
  const names: string[] = [];
  const unreadable: number[] = [];
  // For each unreadable name, its leading folders that decode (`src` for `src/<bytes>.txt`), "" when none does.
  const folders: string[] = [];
  const decoded = decodedName;
  let start = 0;
  let position = 0;
  for (let end = stdout.indexOf(0); end >= 0 || start < stdout.length; end = stdout.indexOf(0, start)) {
    const stop = end < 0 ? stdout.length : end;
    const raw = stdout.subarray(start, stop);
    start = stop + 1;
    if (raw.length === 0) continue;
    const name = decoded(raw);
    if (name !== undefined) names.push(name);
    else {
      unreadable.push(position);
      const parts: string[] = [];
      for (let from = 0, slash = raw.indexOf(0x2f); slash >= 0; from = slash + 1, slash = raw.indexOf(0x2f, from)) {
        const part = decoded(raw.subarray(from, slash));
        if (part === undefined) break;
        parts.push(part);
      }
      folders.push(parts.join("/"));
    }
    position += 1;
  }
  return { names, unreadable, folders };
}

/** Two paths in UTF-16 code-unit order of their NFC forms, the stored names breaking a tie; no branch, one sign. */
const pathOrder = (a: string, b: string): number => {
  const x = a.normalize("NFC");
  const y = b.normalize("NFC");
  return 2 * (Number(x > y) - Number(x < y)) + Number(a > b) - Number(a < b);
};
/**
 * The files `--kind source-tree` reads, relative to the folder. In a Git work tree that does not ignore the folder:
 * what Git would commit (tracked files and untracked ones not ignored, `git ls-files -z --cached --others
 * --exclude-standard`, gitlinks from `git ls-files -z --stage`), as they are in the work tree, a path under a symbolic link left unread and a folder
 * on disk a nested repository only when Git listed it with a trailing `/`, the index records a gitlink there or it
 * holds its own `.git`. Otherwise every file under the folder, entering a folder only when an
 * include path reaches into it or covers it and never `.git`, a folder holding its own `.git` a nested repository; a
 * note says why the folder was walked when Git was there and did not list it. No note names the folder. Either way
 * the list is in UTF-16 code-unit order of the paths: `files[<index>]` counts from 0 in that order over the files the
 * check reads; a path left out only under the fold is indexed after all of them. Which such paths there are depends on
 * the mode: a walk lists a fold-only file but never enters a folder the fold leaves out, while Git mode lists the
 * fold-only paths under such a folder too; a read file's index is the same in both.
 */
function sourceCandidates(run: Run, folder: string, manifest: unknown, includes: readonly string[], gitlinks: Set<string> = new Set()): Candidate[] {
  const executable = gitExecutable();
  // The manifest's lists are indexed once: each path is looked up, never compared with every entry.
  const index = includeIndex(includes);
  const isSource = sourcePathTest(manifest);
  const isNested = nestedTest(manifest);
  const skipped = excludedFolderTest(manifest);
  // Every mode lists by path in UTF-16 code-unit order of the path's NFC form, the stored name only breaking a tie, so
  // files[<index>] is the same on every machine and in both modes (Git on macOS lists NFC, a walk reads names as stored).
  const byPath = (candidates: Candidate[]) => candidates.sort((a, b) => pathOrder(a.path, b.path));
  const walked = (why: string): Candidate[] => {
    run.notes.push({ file: ".", path: "/", rule: "note/walk", message: `${why}, so the folder's files were walked` });
    return byPath(walk(folder, "", index, run, skipped, sourceFolderTest(manifest)));
  };
  // No git found: a walk with no note, as when there is no Git at all.
  if (executable === undefined) return byPath(walk(folder, "", index, run, skipped, sourceFolderTest(manifest)));
  const late = `git did not answer within ${gitLimits.timeoutMs / 1000} s`;
  const timedOut = (answer: { error?: Error }) => (answer.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT";
  const listed = git(executable, folder, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
  if (timedOut(listed)) return walked(late);
  // A git that could not run or answer in full (by its error code only) is told from one that refused the folder.
  if (listed.error !== undefined) return walked(`git ls-files could not run (${String((listed.error as NodeJS.ErrnoException).code)})`);
  if (listed.status !== 0) return walked(`git ls-files refused the folder (exit ${String(listed.status)})`);
  const ignored = git(executable, folder, ["check-ignore", "-q", "."]);
  if (timedOut(ignored)) return walked(late);
  if (ignored.status === 0) return walked("Git ignores this folder");
  // An untracked repository is listed with a trailing `/`: it is named without it, a nested repository.
  const { names, unreadable, folders } = gitNames(listed.stdout);
  // A name that is not UTF-8 is a usage error only where its leading folders that decode lie in the source as a whole
  // (an include folder holds them, no exclude folder does); any other is outside the source, never reached.
  // They are collected here and said only once Git mode is kept: a walk that follows reads the folder instead.
  const inSourceFolder = sourceFolderTest(manifest);
  const unreadableLines = unreadable.flatMap((position, at) => (inSourceFolder(folders[at] as string) ? [`cannot read the name Git listed at position ${position}: it is not UTF-8`] : []));
  // The gitlinks the index records, in a call of their own: an untracked name never reads as an index entry.
  const staged = git(executable, folder, ["ls-files", "-z", "--stage"]);
  if (timedOut(staged)) return walked(late);
  // The second call fails as the first does: a walk with a note, never an empty set of gitlinks.
  if (staged.error !== undefined) return walked(`git ls-files --stage could not run (${String((staged.error as NodeJS.ErrnoException).code)})`);
  if (staged.status !== 0) return walked(`git ls-files --stage refused the folder (exit ${String(staged.status)})`);
  const linked = new Set(gitlinkNames(staged.stdout));
  for (const name of linked) gitlinks.add(name);
  const listedAsFolder = new Set(names.filter((name) => name.endsWith("/")).map((name) => name.slice(0, -1)));
  const paths = [...new Set(names.map((name) => (name.endsWith("/") ? name.slice(0, -1) : name)))].sort(pathOrder);
  // Walked only when Git lists nothing under any include path: a listed path under one (a file, a symbolic link or a
  // nested repository), even one an exclude entry removes (index.covers, with no exception for the manifest: an include
  // entry naming fabric.source.json covers it); a nested repository in the source; or a listed path an include entry
  // lies beneath that no exclude entry removes (isNested is true for any such path, a plain file included: a tracked
  // file docs under include docs/guide.md keeps Git mode and leaves that entry missing; with exclude docs it does not
  // count, and the run walks). In these two isNested listings the manifest's own path counts only as a gitlink.
  if (!paths.some((name) => (isNested(name) && (name.normalize("NFC") !== SOURCE_FILE || linked.has(name))) || index.covers(name))) {
    return walked("Git lists no file under an include path here");
  }
  run.usage.push(...unreadableLines);
  // The manifest is source whatever include says, and read whatever .gitignore says: a regular file Git leaves out is
  // added (DEC-0149).
  if (!paths.includes(SOURCE_FILE) && sourceRegularFile(path.join(folder, SOURCE_FILE)) && existsSync(path.join(folder, SOURCE_FILE))) paths.push(SOURCE_FILE);
  paths.sort(pathOrder);
  // Only a source path, or a nested repository in the source, is looked at: a path outside it is never reached, and
  // one that is no source path is stated only when it may be nested.
  // A path left out only because exclude is read folded is kept by its path, never read, so the check can say so.
  const foldOnly = foldOnlyExcludeTest(manifest);
  return paths.filter((name) => isSource(name) || isNested(name) || foldOnly(name) >= 0).flatMap((name): Candidate[] => {
    // The index decides a gitlink, and nothing is read: it is a nested repository whatever sits at it or above it now
    // (a folder, a file, a link, or nothing).
    if (linked.has(name)) return [{ path: name, nested: true }];
    const parts = name.split("/");
    const full = path.join(folder, ...parts);
    try {
      // Never read through a link: a path under a symbolic link is not in the tree as it is. The ancestors are checked
      // before anything at the path is.
      for (let depth = 1; depth < parts.length; depth += 1) if (lstatSync(path.join(folder, ...parts.slice(0, depth))).isSymbolicLink()) return [];
      // A path that is no source path is stated only when it may be nested, and a link there is never followed.
      if (!isSource(name) && foldOnly(name) < 0) {
        // The link is caught before anything under it is asked: `<path>/.git` is never stated through a link.
        if (lstatSync(full).isSymbolicLink()) return [];
        if (!listedAsFolder.has(name) && !existsSync(path.join(full, ".git"))) return [];
      }
      if (!lstatSync(full).isDirectory()) return [{ path: name }];
      // A folder is a nested repository when Git listed it with a trailing `/` or it holds its own `.git`; otherwise it
      // is a tracked path no longer in the work tree, and Git lists the untracked files under it on their own.
      return listedAsFolder.has(name) || existsSync(path.join(full, ".git")) ? [{ path: name, nested: true }] : [];
    } catch (error) {
      // A tracked file deleted from the work tree, or under a path that is now a file, is not in the tree as it is.
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT" && code !== "ENOTDIR") run.usage.push(`cannot read ${shownPath(name)}: ${String(code)}`);
      return [];
    }
  });
}

/** The walk without Git: a folder holding its own `.git` is a nested repository, never entered. */
function walk(dir: string, prefix: string, includes: IncludeIndex, run: Run, skipped: (folder: string) => boolean, inSourceFolder: (folder: string) => boolean): Candidate[] {
  let raw: Array<Dirent<Buffer>>;
  try {
    // Names are read as bytes: one that does not round-trip as UTF-8 is never decoded into another name.
    raw = readdirSync(dir, { withFileTypes: true, encoding: "buffer" });
  } catch (error) {
    // The folder by its path with a trailing slash, the root as ".", one whose name holds a finding by its place.
    const relative = prefix.replace(/\/$/, "");
    const shown = shownPath(relative);
    run.usage.push(`cannot read ${shown}${shown === relative && relative !== "" ? "/" : ""}: ${String((error as NodeJS.ErrnoException).code)}`);
    return [];
  }
  const found: Candidate[] = [];
  const folderOf = prefix.replace(/\/$/, "");
  // A name that is not UTF-8 gets Git mode's rule: a usage error naming its folder and no part of the name when that
  // folder lies in the source, otherwise skipped as outside it.
  let unreadable = false;
  const entries = raw.flatMap((entry) => {
    const name = decodedName(entry.name);
    if (name === undefined) { unreadable = true; return []; }
    return [{ name, isDirectory: () => entry.isDirectory() }];
  });
  if (unreadable && inSourceFolder(folderOf)) run.usage.push(`cannot read a name in ${shownPath(folderOf)}/: it is not UTF-8`);
  // Names in one folder differ, so the order by code unit is total and the same on every machine.
  for (const entry of entries.sort((a, b) => Number(a.name > b.name) - Number(a.name < b.name))) {
    const relative = `${prefix}${entry.name}`;
    if (!entry.isDirectory()) { found.push({ path: relative }); continue; }
    // An excluded folder holds no source and is never entered, unless an include path lies under it.
    // A folder a case-insensitive or Windows file system resolves to `.git` is never entered either.
    if (isDotGitSegment(entry.name) || !includes.reaches(`${relative}/`) || skipped(relative)) continue;
    const full = path.join(dir, entry.name);
    if (existsSync(path.join(full, ".git"))) found.push({ path: relative, nested: true });
    else found.push(...walk(full, `${relative}/`, includes, run, skipped, inSourceFolder));
  }
  return found;
}

/**
 * A JSON pointer as a message may print it: as written, or, when a member name in it holds what the tree check reports,
 * its longest leading part that holds none and a mark in place of the rest.
 */
export function shownPointer(pointer: string): string {
  const segments = pointer.split("/").slice(1);
  const decoded = segments.map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
  const at = findingAt(decoded.join("/"));
  const across = at < 0 ? decoded.length : decoded.join("/").slice(0, at).split("/").length - 1;
  // Each member is read as a message's word is (its quotes and trailing punctuation stripped as well) and as a path
  // value is (an address before a `:` is still one).
  const own = decoded.findIndex((segment) => wordHoldsFinding(segment) || findingAt(segment, true) >= 0);
  const first = Math.min(across, own < 0 ? decoded.length : own);
  if (first >= decoded.length) return pointer;
  return `${segments.slice(0, first).map((segment) => `/${segment}`).join("")}/<a member whose name holds a finding>`;
}

/**
 * A source check (DEC-0149), whose messages carry nothing of the document: a `source-` kind, the source manifest's
 * schema (named or inferred), or a file named `fabric.source.json` whatever schema reads it. One predicate for the parse
 * error, the schema messages and the hints.
 */
export const sourceCheck = (file: string, schema: string | undefined, kindArg: string | undefined): boolean =>
  (kindArg !== undefined && SOURCE_KINDS.includes(kindArg)) || schema === "fabric-source.schema.json" || path.basename(file) === SOURCE_FILE;
/** The three source kinds (DEC-0149), named one by one. */
const SOURCE_KINDS: readonly string[] = ["source-manifest", "source-tree", "source-package"];

/**
 * A JSON parse error by its line and column only: the position is found by reading the text again, never taken from the
 * parser's message, which names it only for some inputs and may quote them.
 */
function parsePosition(text: string): string {
  const at = jsonErrorAt(text);
  if (at === undefined) return "the file is not JSON";
  const before = text.slice(0, at).split("\n");
  return `the file is not JSON: it stops reading at line ${before.length}, column ${(before.at(-1) as string).length + 1}`;
}

/**
 * The UTF-16 index where strict JSON (RFC 8259) stops reading a text, the text's length when it ends too soon, or
 * undefined when the text is JSON or nests too deep to read.
 */
export function jsonErrorAt(text: string): number | undefined {
  let at = 0;
  const space = () => { while (at < text.length && " \t\n\r".includes(text[at] as string)) at += 1; };
  const fail = (): never => { throw new JsonStop(at); };
  const word = (literal: string) => { for (const char of literal) { if (text[at] !== char) fail(); at += 1; } };
  const string = () => {
    at += 1;
    for (;;) {
      if (at >= text.length) fail();
      const code = text.charCodeAt(at);
      if (code === 0x22) { at += 1; return; }
      if (code < 0x20) fail();
      if (code === 0x5c) {
        at += 1;
        const escape = text[at];
        if (escape === "u") { for (let digit = 1; digit <= 4; digit += 1) if (!/[0-9A-Fa-f]/.test(text[at + digit] ?? "")) { at += digit; fail(); } at += 5; }
        else if (escape !== undefined && "\"\\/bfnrt".includes(escape)) at += 1;
        else fail();
      } else at += 1;
    }
  };
  const number = () => {
    const match = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
    match.lastIndex = at;
    const found = match.exec(text);
    if (found === null) fail();
    at += (found as RegExpExecArray)[0].length;
  };
  const value = (): void => {
    space();
    const char = text[at];
    if (char === "{") {
      at += 1; space();
      if (text[at] === "}") { at += 1; return; }
      for (;;) {
        space();
        if (text[at] !== "\"") fail();
        string(); space();
        if (text[at] !== ":") fail();
        at += 1; value(); space();
        if (text[at] === ",") { at += 1; continue; }
        if (text[at] === "}") { at += 1; return; }
        fail();
      }
    }
    if (char === "[") {
      at += 1; space();
      if (text[at] === "]") { at += 1; return; }
      for (;;) {
        value(); space();
        if (text[at] === ",") { at += 1; continue; }
        if (text[at] === "]") { at += 1; return; }
        fail();
      }
    }
    if (char === "\"") return string();
    if (char === "t") return word("true");
    if (char === "f") return word("false");
    if (char === "n") return word("null");
    if (char === "-" || (char !== undefined && char >= "0" && char <= "9")) return number();
    fail();
  };
  try {
    value(); space();
    return at < text.length ? at : undefined;
  } catch (error) {
    if (error instanceof JsonStop) return Math.min(error.at, text.length);
    return undefined;
  }
}
class JsonStop { constructor(readonly at: number) {} }

/**
 * `--kind source-tree` on a folder (DEC-0149): the folder's `fabric.source.json` is validated and checked, and every
 * source file `sourceCandidates` lists goes to the tree check; an `unchecked` file by its path only, a symbolic link as
 * the path it names, never followed, a nested repository by its path. No list of installation strings is read: that
 * part runs in the operator's tool. Nothing the checker prints names the folder or repeats a value found: a file is
 * named by its path in the folder, or as `files[<index>]` when a finding is in that path.
 */
function checkSourceFolder(run: Run, folder: string): void {
  const before = { problems: run.problems.length, notes: run.notes.length, usage: run.usage.length, files: run.files.length };
  try {
    checkSourceFolderAs(run, folder);
  } catch (error) {
    // Nothing half-written stays (it could name the folder before its paths were made relative): the run says the
    // folder could not be checked, naming the error only, so `--json` still prints one document.
    run.problems.length = before.problems;
    run.notes.length = before.notes;
    run.usage.length = before.usage;
    run.files.length = before.files;
    run.usage.push(`cannot check .: ${errorName(error)}`);
  }
}

function checkSourceFolderAs(run: Run, folder: string): void {
  const manifestFile = path.join(folder, SOURCE_FILE);
  const before = { problems: run.problems.length, notes: run.notes.length, usage: run.usage.length, files: run.files.length };
  // What checkFile reports names the folder's own path; it is rewritten relative to the folder: the manifest's own
  // path and a path under the folder, never another text that happens to hold the folder's name.
  const relativeTo = (text: string) => text.split(manifestFile).join(SOURCE_FILE).split(`${folder}${path.sep}`).join("");
  const finish = () => {
    for (const item of [...run.problems.slice(before.problems), ...run.notes.slice(before.notes)]) {
      item.file = relativeTo(item.file);
      item.message = relativeTo(item.message);
    }
    for (const item of run.files.slice(before.files)) item.file = relativeTo(item.file);
    for (let index = before.usage; index < run.usage.length; index += 1) run.usage[index] = relativeTo(run.usage[index] as string);
  };
  try {
    // A manifest that is not a regular file (a FIFO, a socket, a device, a folder) is never opened: reading a FIFO waits.
    // lstat first: any entry that is not a regular file (a link, a dangling link included, a FIFO) is "not a file";
    // only an absent entry is "the folder holds none".
    lstatSync(manifestFile);
    if (!sourceRegularFile(manifestFile)) {
      run.usage.push(`cannot read ${SOURCE_FILE}: not a file`);
      return;
    }
  } catch (error) {
    // No manifest is one usage error; a folder or a manifest it cannot reach is another, named by its place.
    const code = String((error as NodeJS.ErrnoException).code);
    // A folder that resolves to a directory, links followed, can hold no manifest; an absent one or a dangling link
    // is named as "." (a file already failed with ENOTDIR).
    if (code === "ENOENT" && !statIsDirectory(folder)) run.usage.push("cannot read .: ENOENT");
    else if (code === "ENOENT") run.usage.push(`--kind source-tree reads a folder's ${SOURCE_FILE}; the folder holds none`);
    // lstat needs no permission on the file itself, so any other failure is the folder's: it is named as ".".
    else run.usage.push(`cannot read .: ${code}`);
    return;
  }
  const checked = checkFile(run, manifestFile, SOURCE_FILE, "fabric-source.schema.json", undefined);
  // What checkFile says of the manifest never quotes it: a parse error by its position only, a schema error with each
  // word that holds a finding (a credential, a home folder, an address) named by its place. A schema error's path
  // names members the closed schema defines and indexes, so only its message can quote one.
  for (const problem of [...run.problems.slice(before.problems), ...run.notes.slice(before.notes)]) {
    // checkFile already gives a parse error by its position only and a schema error from the schema's side; the
    // masks are the second line of defence.
    problem.path = shownPointer(problem.path);
    problem.message = masked(problem.message, problem.path);
  }
  // A manifest that fails its schema is reported alone: the tree runs once it validates.
  if (checked === undefined || run.problems.slice(before.problems).some((problem) => problem.rule.startsWith("schema/"))) { finish(); return; }
  const manifest = checked.value;
  // The manifest validated, so `include` is a list of paths.
  const includes = (manifest as JsonObject).include as string[];
  const files: Array<{ path: string; text?: string; binary?: true; nestedRepository?: true; link?: true }> = [];
  const isSource = sourcePathTest(manifest);
  const isNested = nestedTest(manifest);
  const isUnchecked = uncheckedTest(manifest);
  const foldOnly = foldOnlyExcludeTest(manifest);
  const foldedOut: Array<{ path: string }> = [];
  // The gitlinks Git's index records (Git mode), so an exclude entry naming one is never called unused.
  const gitlinks = new Set<string>();
  for (const candidate of sourceCandidates(run, folder, manifest, includes, gitlinks)) {
    const relative = candidate.path;
    // A nested repository in the source goes by its path; one outside it is not counted, in either mode.
    if (candidate.nested) { if (isNested(relative)) files.push({ path: relative, nestedRepository: true }); continue; }
    // Left out only under the fold: by its path, never opened, and indexed after every file read, so a read file's
    // files[<index>] is the same in Git mode and in a walk (a walk lists fold-only files, never those under a folder the
    // fold leaves out, which Git mode lists too).
    if (foldOnly(relative) >= 0) { foldedOut.push({ path: relative }); continue; }
    if (!isSource(relative)) continue;
    const full = path.join(folder, ...relative.split("/"));
    try {
      const stat = lstatSync(full);
      // What is neither a file nor a link (a FIFO, a socket, a device) is no source file, unchecked or not.
      if (!stat.isFile() && !stat.isSymbolicLink()) continue;
      // A link is said to be one before anything else: an unchecked link keeps no text but is still no licence.
      if (stat.isSymbolicLink()) { files.push(isUnchecked(relative) ? { path: relative, link: true } : { path: relative, text: readlinkSync(full), link: true }); continue; }
      // An unchecked path is read by its path only, never opened.
      if (isUnchecked(relative)) { files.push({ path: relative }); continue; }
      // The first BINARY_PROBE bytes decide: a binary file (a large asset, a sparse image) is never read whole.
      if (probeHoldsNul(full)) files.push({ path: relative, binary: true });
      else files.push({ path: relative, text: readFileSync(full).toString("utf8") });
    } catch (error) {
      run.usage.push(`cannot read ${shownPath(relative)}: ${String((error as NodeJS.ErrnoException).code)}`);
    }
  }
  files.push(...foldedOut);
  run.files.push({ file: ".", schema: null, kinds: ["source-tree"] });
  // Each exclude entry the folder holds, found by reading each folder's names and matching each segment under the fold,
  // an intermediate folder never a symbolic link, is listed, so an entry that names nothing is said (unused-exclude, accepted); nothing is read and no name is printed.
  // An entry excluding a gitlink as nestedTest reads it is used: a bare entry naming it or a folder it lies in, an entry
  // ending in `/` naming a folder it lies in or is. A gitlink at the manifest's own path is excepted: exclude cannot
  // remove the manifest, so no entry is used by it.
  const foldedGitlinks = [...gitlinks].filter((name) => inGrammar(name) && !atManifestPath(name)).map((name) => foldPath(name.normalize("NFC")));
  const excludesGitlink = (entry: string): boolean => {
    const folded = foldPath(entry.normalize("NFC"));
    return foldedGitlinks.some((link) => (folded.endsWith("/") ? `${link}/`.startsWith(folded) : link === folded || link.startsWith(`${folded}/`)));
  };
  const listed = (((manifest as JsonObject).exclude as string[] | undefined) ?? []).filter((entry) => inGrammar(entry, true) && (excludesGitlink(entry) || presentWithoutLink(folder, entry)));
  // The manifest's own check already said its entries outside the grammar: the tree run does not say them twice.
  const findings = evaluateSemanticRules("source-tree", { manifest, files, listed }).filter((finding) => !isManifestGrammarFinding(finding));
  const inPath = new Set(findings.flatMap((finding) => {
    const at = /^\/files\/(\d+)\/path$/.exec(finding.instancePath);
    return at === null ? [] : [Number(at[1])];
  }));
  for (const finding of findings) {
    // A finding in a file names that file, as files[<index>] when its path holds one; one about the manifest names it.
    const at = /^\/files\/(\d+)/.exec(finding.instancePath);
    const index = at === null ? undefined : Number(at[1]);
    const filePath = index === undefined ? SOURCE_FILE : (files[index] as { path: string }).path;
    // One path policy, as checkSourceTree's: a path that holds a finding (a long run read per segment) or an address is
    // labelled by its index. A path printed whole leads its message and is not masked again: the second defence reads
    // what follows it.
    const file = index === undefined ? SOURCE_FILE : inPath.has(index) || labelledByIndex(filePath) || pathHoldsFinding(filePath) ? `files[${index}]` : filePath;
    const lead = file === filePath && index !== undefined ? messageLead(finding.message, filePath) : "";
    addFindings(run, file, [{ ...finding, message: `${lead}${masked(finding.message.slice(lead.length), finding.instancePath)}` }]);
  }
  finish();
}

/** Whether a relative path (a folder with a trailing `/`) is in the folder, each segment by lstat, never through a link. */
function presentWithoutLink(folder: string, relative: string, depth = 0): boolean {
  // An entry that ends in `/` names a folder: its last segment must be a folder, never a file or a symbolic link (such an
  // entry excludes only what is under a folder, so a link there stays a source file; written without `/` it leaves the
  // link out).
  // An entry without `/` names a file and everything beneath that name: its last segment may be a file, a link or a
  // folder (whose files it leaves out too).
  // Each segment is matched under the fold against the names its folder holds (so `src/secrets./`, a zero-width
  // character or a case difference on a case-sensitive volume still finds what the entry leaves out); an intermediate
  // folder must be a real folder, never a link; a link is never followed.
  const segments = relative.split("/").filter((segment) => segment !== "");
  const wanted = foldSegment(segments[depth] as string);
  let entries: Dirent[];
  try { entries = readdirSync(folder, { withFileTypes: true }); } catch { return false; }
  const last = depth === segments.length - 1;
  const folderEntry = relative.endsWith("/");
  const lastCounts = (entry: Dirent): boolean => !folderEntry || entry.isDirectory();
  return entries.some((entry) => foldSegment(entry.name) === wanted && (last ? lastCounts(entry) : entry.isDirectory() && presentWithoutLink(path.join(folder, entry.name), relative, depth + 1)));
}

/** An error's name (`RangeError`), never its message. */
export const errorName = (error: unknown): string => (error instanceof Error ? error.name : "Error");

/** The folder's `.json` files, dot-folders and `node_modules` left out; a folder it cannot read is a usage error. */
function jsonFiles(dir: string, run: Run, sourceKind = false): string[] {
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
      if (entry.isDirectory()) return jsonFiles(full, run, sourceKind);
      if (!entry.name.endsWith(".json")) return [];
      // A source manifest that is no regular file (a symbolic link, a FIFO, a socket, a device): a source kind's run
      // refuses it (the read refuses, exit 2); a plain run, which may walk many agents, skips it with a note.
      if (entry.name === SOURCE_FILE && !sourceRegularFile(full)) {
        if (sourceKind) return [full];
        run.notes.push({ file: full, path: "/", rule: "note/skipped", message: "not a file: a source manifest that is a symbolic link, a FIFO, a socket or a device is never read" });
        return [];
      }
      // A FIFO, a socket or a device is skipped with a note: reading a FIFO waits for a writer forever (a hang before
      // DEC-0149). Anything else (a link to a folder included) is read as before, and its error reported.
      if (special(full)) {
        run.notes.push({ file: full, path: "/", rule: "note/skipped", message: "not a file: a FIFO, a socket or a device is never read" });
        return [];
      }
      return [full];
    });
}

/** Whether a path names a FIFO, a socket or a device, a link to one included; a path that cannot be stated is not. */
function special(file: string): boolean {
  try {
    const stat = statSync(file);
    return stat.isFIFO() || stat.isSocket() || stat.isCharacterDevice() || stat.isBlockDevice();
  } catch {
    return false;
  }
}

/**
 * Whether a path names a regular file, a link to one included. A source check (DEC-0149) never opens anything else (a
 * FIFO, a socket, a device, a folder): reading a FIFO waits for a writer. A path that cannot be stated is left to the
 * read that reports it.
 */
export function regularFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return true;
  }
}

/**
 * Whether a regular file holds a JSON object that is no source-tree document, by the discriminator: neither a
 * `manifest` nor a `files` member (a source manifest under another name, `format: "fabric-source/1"`, valid or not, or
 * any other such object). Schema validity is not asked.
 */
function notTreeDocument(file: string): boolean {
  if (!sourceRegularFile(file)) return false;
  let value: unknown;
  try { value = JSON.parse(readFileSync(file, "utf8")); } catch { return false; }
  return isObject(value) && !("manifest" in value) && !("files" in value);
}

/** Whether lstat finds an entry at a path (a dangling link included). */
const lstatExists = (file: string): boolean => { try { lstatSync(file); return true; } catch { return false; } };
/** Whether a path resolves to a folder, links followed. */
const statIsDirectory = (file: string): boolean => { try { return statSync(file).isDirectory(); } catch { return false; } };
/** Whether lstat finds a real folder at a path (never a link to one). */
const lstatIsDirectory = (file: string): boolean => { try { return lstatSync(file).isDirectory(); } catch { return false; } };

/**
 * Whether a source check may read a path as its document: a regular file itself, never a link to one, a FIFO, a
 * socket, a device or a folder (DEC-0149). A path that cannot be stated is left to the read that reports it.
 */
export function sourceRegularFile(file: string): boolean {
  try {
    return lstatSync(file).isFile();
  } catch {
    return true;
  }
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
  // A source tree is one folder's, and a folder's pair is that folder's: a second target would mix two sources in one
  // report, so it is refused rather than read (DEC-0149).
  const resolvedBase = process.env.npm_lifecycle_event === "validate" && process.env.INIT_CWD !== undefined ? process.env.INIT_CWD : process.cwd();
  const isFolder = (named: string) => { try { return statSync(path.resolve(resolvedBase, named)).isDirectory(); } catch { return false; } };
  if (targets.length > 1 && (kindArg === "source-tree" || (kindArg === "source-package" && targets.some(isFolder)))) return usage(`--kind ${kindArg} takes one target${kindArg === "source-package" ? " when a target is a folder" : ""}; run it once for each`);

  const run: Run = { problems: [], notes: [], usage: [], files: [] };
  // `pnpm --dir <checkout> validate ./x` runs in the checkout; a relative path is the author's, from where pnpm was
  // run (INIT_CWD), not the checkout's. Only when this script is the entry: another script that pnpm started may run
  // the command from a folder of its own.
  const base = resolvedBase;
  for (const named of targets) {
    const target = path.resolve(base, named);
    let folder = false;
    try { folder = statSync(target).isDirectory(); } catch { /* a missing file is reported when it is read */ }
    // A manifest named under --kind source-tree checks its folder, as the folder route does, before anything else is
    // asked of it, unless lstat says it is a real folder: a link (to a folder too) or a dangling link reads "not a
    // file", an unenterable folder "cannot read .".
    if (kindArg === "source-tree" && path.basename(target) === SOURCE_FILE && !lstatIsDirectory(target)) { checkSourceFolder(run, path.dirname(target)); continue; }
    // A source check asks lstat whether its target is there, so a dangling link reaches "not a file".
    if (!folder && !(sourceCheck(target, schemaArg, kindArg) ? lstatExists(target) : existsSync(target)) && sourceCheck(target, schemaArg, kindArg)) {
      // A source check's target that is not there is named by its basename (or its place), never by its path; any
      // other missing target is read below and named by its path, as before DEC-0149.
      let code = "ENOENT";
      try { statSync(target); } catch (error) { code = String((error as NodeJS.ErrnoException).code); }
      run.usage.push(`cannot read ${shownPath(path.basename(target))}: ${code}`);
      continue;
    }
    if (!folder && kindArg === "source-tree") {
      // A source manifest under another name is not a tree document: it is refused, naming the fix, never checked as one.
      if (notTreeDocument(target)) { run.usage.push(`cannot check ${shownPath(path.basename(target))} as a tree: it holds neither manifest nor files; a source manifest is named ${SOURCE_FILE}, or pass its folder`); continue; }
      // Any other file is the document form, named by its basename, never by its path.
      // checkFile makes a source check instance-free and names the document by its basename.
      checkFile(run, target, target, schemaArg, kindArg);
      continue;
    }
    if (!folder) { checkFile(run, target, target, schemaArg, kindArg); continue; }
    if (kindArg === "source-tree") { checkSourceFolder(run, target); continue; }
    const before = run.usage.length;
    const problemsBefore = run.problems.length;
    const files = jsonFiles(target, run, kindArg !== undefined && SOURCE_KINDS.includes(kindArg));
    if (files.length === 0 && run.usage.length === before) run.usage.push(`${target} holds no readable .json file`);
    // The relative path with `/` on every platform: the rules read it as a stored path (FAC-SEM-014) and pair by it.
    const checked = files.flatMap((file) => checkFile(run, file, path.relative(target, file).split(path.sep).join("/"), schemaArg, kindArg, true) ?? []);
    // A folder in which no file was a document it could check checked nothing: that is not a clean run.
    if (files.length > 0 && checked.length === 0 && run.usage.length === before && run.problems.length === problemsBefore) run.usage.push(`${target} holds no document this checkout can tell; the files it skipped are noted`);
    checkPairs(run, checked, kindArg);
  }
  return { code: run.usage.length > 0 ? 2 : run.problems.length > 0 ? 1 : 0, out: render(run, asJson) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = main(process.argv.slice(2));
  process.stdout.write(result.out);
  process.exitCode = result.code;
}
// #endregion validate-cli
