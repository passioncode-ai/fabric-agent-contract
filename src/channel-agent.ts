import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, indexed, isObject } from "./findings.js";
import { JWT_SHAPE, SECRET_VALUE, rawValues, secretArgument, secretUrl, secretValue } from "./secret-shape.js";
import { createValidatorSync } from "./validator.js";

// #region channel-agent (docs: docs/specification/channel-agent.md)
// DEC-0150: an agent that answers people on a channel (mail, Telegram, store reviews, comments) declares what
// channel-agent-standard/1 section 13.6 lists under extensions/channel-agent/0.1: in its manifest's provider.extensions,
// or, for a service with no manifest, in its well-known answer's extensions. These are the checks section 11 makes of
// the declaration statically. No finding's message carries a declared value: the instancePath places it (CA-5).

/** One project entry of the declaration (`service-channel-agent-extension.schema.json#/$defs/project`), as read. */
export type ChannelAgentProject = JsonObject;

/** Where a declaration is read: a manifest's `provider.extensions`, or a well-known answer's `extensions` (CA-1). */
export type ChannelAgentSite = "manifest" | "well-known";

/** What a reader takes from a declaration: the value, or the keywords it fails and their places (never a declared value). */
export type ChannelAgentView =
  | { declared: false; reported: false; errors: [] }
  | { declared: false; reported: true; errors: string[] }
  | { declared: true; reported: false; errors: []; standard: string; projects: ChannelAgentProject[]; obligations: string[] };

let shape: ValidateFunction | undefined;
const KEY = EXTENSION_KEYS.channelAgent;
const pointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");
const KEY_TOKEN = pointerToken(KEY);
/** The instance path of the declaration at each site. */
export const CHANNEL_AGENT_PATHS: Readonly<Record<ChannelAgentSite, string>> = Object.freeze({ manifest: `/provider/extensions/${KEY_TOKEN}`, "well-known": `/extensions/${KEY_TOKEN}` });
/** The token slot's grammar, `<project>/<env>/<NAME>`: the schema's `tickets.token_slot`, held equal by a test. */
export const TOKEN_SLOT = /^[a-z0-9][a-z0-9._-]{0,127}\/[a-z][a-z0-9-]{0,31}\/[A-Z][A-Z0-9_]{0,63}$/;
/** A member name's characters; a plain name also holds no run of 7 or more digits, `-` and `_` left out (CA-5). */
const NAME_CHARACTERS = /^[A-Za-z0-9_-]{1,64}$/;
/** FAC-SEM-165 names at most this many places; one more finding counts the rest. */
export const SECRET_FINDINGS = 64;
/** A member deeper than this below the declaration is placed at its ancestor at this depth. */
export const PATH_DEPTH = 64;
/** The detector reads at most this many code points of a string. */
const DETECTOR_CODE_POINTS = 4097;
/** A string value or a member name longer than this, in code points, is refused before the schema runs (CA-2). */
export const LONGEST_STRING = 4096;
/** FAC-SEM-162's one answer when the schema itself cannot run on a value. */
export const TOO_LARGE = "the value is too large to check";
/** The arrays the schema declares: a numeric token after one of them is an index a path may carry. */
const ARRAYS = new Set(["projects", "codes", "tiers", "channels", "sources", "declined_sources", "handoff_queues", "recorded_decisions"]);
const EM_DASH = String.fromCodePoint(0x2014);
/** What a text that is blank is made of: white space, format and control characters, separators and the fillers. */
const BLANK = /[\s\p{Cf}\p{Cc}\p{Z}\p{Default_Ignorable_Code_Point}\u{115F}\u{1160}\u{3164}\u{FFA0}\u{2800}\u{FFFC}]/gu;
/** At most this many failed keywords are named in FAC-SEM-162's message; the rest are counted. */
export const MESSAGE_ERRORS = 10;

function extensionsAt(doc: JsonObject, site: ChannelAgentSite): JsonObject | undefined {
  const holder = site === "manifest" ? doc.provider : doc;
  return isObject(holder) && isObject(holder.extensions) ? holder.extensions : undefined;
}

const schemaShape = (): ValidateFunction => {
  // Verbose: each error carries `error.schema`, which the nullable detection, `not` and `propertyNames` read; a
  // nullable member fails in one line, its value branch's, ending ", or null".
  shape ??= createValidatorSync({ verbose: true }).getSchema(`${SCHEMA_PREFIX}schemas/service-channel-agent-extension.schema.json`) as ValidateFunction;
  return shape;
};

let known: Set<string> | undefined;
/** Every member name the schema declares: a path token that is not one (a text's language, an unknown member) is `*`. */
function schemaNames(): Set<string> {
  if (known !== undefined) return known;
  const names = new Set<string>();
  const stack: unknown[] = [schemaShape().schema];
  while (stack.length > 0) {
    const node = stack.pop();
    if (Array.isArray(node)) stack.push(...node);
    else if (isObject(node)) {
      if (isObject(node.properties)) for (const name of Object.keys(node.properties)) names.add(name);
      stack.push(...Object.values(node));
    }
  }
  known = names;
  return names;
}

/** A container the walk is reading: its members, the next one, its place, its depth, its own name and its holder's. */
interface Frame { container: unknown[] | JsonObject; keys: string[] | undefined; next: number; at: string; depth: number; name: string | undefined; parent: string | undefined; collapsed: boolean; role: Role }
/** The place a container holds in the declaration, from the root down, or none: the narrow readings are keyed on it. */
type Role = "root" | "projects" | "project" | "evals" | "tickets" | "queues" | "queue" | "channels" | "channel" | "texts" | undefined;
const ROLES: Readonly<Record<string, Readonly<Record<string, Role>>>> = { root: { projects: "projects" }, project: { evals: "evals", tickets: "tickets", handoff_queues: "queues", channels: "channels" }, channel: { texts: "texts" } };
const roleOf = (holder: Role, key: string, index: boolean): Role => {
  // A channel's texts and everything below them (its maps, and anything put inside a text's place) keep the role.
  if (holder === "texts") return "texts";
  if (index) return holder === "projects" ? "project" : holder === "queues" ? "queue" : holder === "channels" ? "channel" : undefined;
  if (holder === undefined || !Object.hasOwn(ROLES, holder)) return undefined;
  const roles = ROLES[holder] as Readonly<Record<string, Role>>;
  return Object.hasOwn(roles, key) ? roles[key] : undefined;
};
/** Where a name or a string the walk shows sits: its holder's frame (none for the walked value itself) and its key. */
interface Spot { frame: Frame | undefined; key: string; isName: boolean }
/** What the walk shows each name and string: the text, where it sits, and the function that places it (called only when needed). */
type Visit = (text: string, spot: Spot, place: (spot: Spot) => string) => void;

/** Whether an object has no own member, without building its key list. */
const emptyObject = (object: JsonObject): boolean => {
  // A parsed JSON object has no inherited enumerable member, so any key the loop meets is its own.
  for (const key in object) return key === undefined;
  return true;
};
/**
 * Every member name and string value under `value`, read with an explicit stack of cursor frames (one per non-empty
 * container, not one per member; an empty one is charged and skipped), so neither depth nor size throws. `tokenOf` gives
 * a member's path token, or undefined to place it at its holder; below PATH_DEPTH every member is placed at its ancestor
 * at that depth. A member's path is built only when the visit asks for it (a container's, when it is entered). `visit`
 * is called for each name and string; `onEnter` once for every other value the walk reaches, the root included: each
 * array or object, empty or not, and each number, boolean or null.
 */
function walk(value: unknown, root: string, tokenOf: (frame: Frame, key: string, index: boolean) => string | undefined, visit: Visit, stop: () => boolean = () => false, onEnter: () => void = () => undefined): void {
  // A name is placed at its holder. A member is placed at its own token, or, when its key is not written (no token, or
  // past PATH_DEPTH), its frame is collapsed: it and every descendant are placed at its holder's place.
  const token = (frame: Frame, key: string): string | undefined => (frame.collapsed || frame.depth >= PATH_DEPTH ? undefined : tokenOf(frame, key, frame.keys === undefined));
  const place = (spot: Spot): string => {
    const frame = spot.frame;
    if (frame === undefined) return root;
    const written = spot.isName ? undefined : token(frame, spot.key);
    return written === undefined ? frame.at : `${frame.at}/${written}`;
  };
  if (typeof value === "string" && !stop()) visit(value, { frame: undefined, key: "", isName: false }, place);
  if (!Array.isArray(value) && !isObject(value)) {
    // A number, a boolean or a null at the root is reached too; a string was visited above.
    if (typeof value !== "string") onEnter();
    return;
  }
  const enter = (container: unknown[] | JsonObject, at: string, depth: number, name: string | undefined, parent: string | undefined, collapsed: boolean, role: Role): Frame => ({ container, keys: Array.isArray(container) ? undefined : Object.keys(container), next: 0, at, depth, name, parent, collapsed, role });
  onEnter();
  const stack: Frame[] = [enter(value, root, 0, undefined, undefined, false, "root")];
  while (stack.length > 0 && !stop()) {
    const frame = stack[stack.length - 1] as Frame;
    const length = frame.keys === undefined ? (frame.container as unknown[]).length : frame.keys.length;
    if (frame.next >= length) {
      stack.pop();
      continue;
    }
    const i = frame.next;
    frame.next += 1;
    const index = frame.keys === undefined;
    const key = index ? String(i) : (frame.keys?.[i] as string);
    const child = index ? (frame.container as unknown[])[i] : (frame.container as JsonObject)[key];
    if (!index) visit(key, { frame, key, isName: true }, place);
    if (typeof child === "string") visit(child, { frame, key, isName: false }, place);
    else if (Array.isArray(child) || isObject(child)) {
      onEnter();
      // An empty container has nothing to visit: no frame is built for it, so a document of empty arrays or objects is
      // walked at the cost of its members, not of a frame and a path each.
      if (Array.isArray(child) ? child.length === 0 : emptyObject(child)) continue;
      const written = token(frame, key);
      stack.push(enter(child, written === undefined ? frame.at : `${frame.at}/${written}`, frame.depth + 1, key, frame.name, written === undefined, roleOf(frame.role, key, index)));
    } else onEnter();
  }
}

/** Whether a string is longer than LONGEST_STRING code points, without counting a long one whole or building an array. */
const tooLong = (text: string): boolean => text.length > LONGEST_STRING && (text.length > 2 * LONGEST_STRING || PAST_LONGEST.test(text));
/** LONGEST_STRING + 1 code points from the start (with the `u` flag a surrogate pair is one): matched by the engine. */
const PAST_LONGEST = new RegExp(`^[\\s\\S]{${LONGEST_STRING + 1}}`, "u");

/**
 * A member's token in a FAC-SEM-162 place: a declared name, or an index of a declared array, else `*`. A text's language
 * is always `*`, and so is a numeric key of an object: a number is kept only as a real array index (`index`).
 */
function placedToken(previous: string | undefined, before: string | undefined, token: string, index: boolean, names: Set<string>, noneForm = false): string {
  // A final text in the none form is no language map: its `none` and `until` are the schema's names.
  if (noneForm && before === "texts" && previous === "final" && (token === "none" || token === "until")) return token;
  if (before === "texts" && (previous === "holding" || previous === "final")) return "*";
  if (index) return previous !== undefined && ARRAYS.has(previous) && /^(0|[1-9][0-9]{0,8})$/.test(token) ? token : "*";
  return names.has(token) ? token : "*";
}

/**
 * A schema node with its `$ref` followed, within the schema's own `$defs` (every node of this schema is an object), and
 * a member that also takes the none form (`if` an object with `none`, `then` the form, `else` the member) resolved to
 * the branch the value takes.
 */
function resolved(node: unknown, defs: JsonObject, value?: unknown): JsonObject {
  let at = node;
  for (;;) {
    if (isObject(at) && typeof at.$ref === "string") at = defs[at.$ref.slice("#/$defs/".length)];
    else if (isObject(at) && at.if !== undefined && at.then !== undefined && at.else !== undefined && at.properties === undefined) at = isNone(value) ? at.then : at.else;
    else return at as JsonObject;
  }
}

/** The standard's form for a required member a project does not have: an object with a `none` member (CA-2). */
export const isNone = (value: unknown): boolean => isObject(value) && Object.hasOwn(value, "none");

/**
 * The places, from the schema itself, of every array longer than its `maxItems`, every map wider than its
 * `maxProperties`, and every closed object (one with `additionalProperties: false`) with more members than it declares,
 * read before the schema runs so it never makes one error per member (CA-2). Only declared members are entered, so a
 * place holds declared names and indexes only.
 */
function widths(value: unknown): string[] {
  const schema = schemaShape().schema as JsonObject;
  const defs = schema.$defs as JsonObject;
  const found: string[] = [];
  const stack: Array<{ value: unknown; node: unknown; at: string }> = [{ value, node: schema, at: "" }];
  while (stack.length > 0) {
    const { value: item, node, at } = stack.pop() as { value: unknown; node: unknown; at: string };
    const rule = resolved(node, defs, item);
    if (Array.isArray(item)) {
      if (typeof rule.maxItems === "number" && item.length > rule.maxItems) found.push(`maxItems at ${at} (at most ${rule.maxItems} items)`);
      else if (rule.items !== undefined) for (let i = item.length - 1; i >= 0; i -= 1) stack.push({ value: item[i], node: rule.items, at: `${at}/${i}` });
    } else if (isObject(item)) {
      const count = Object.keys(item).length;
      const declared = isObject(rule.properties) ? rule.properties : undefined;
      if (declared !== undefined && rule.additionalProperties === false && count > Object.keys(declared).length) found.push(`maxProperties at ${at || "/"} (more members than the schema declares${/\/channels\/[0-9]+\/texts$/.test(at) && Object.hasOwn(item, "none") ? "; only texts.final takes the none form (Narrowings)" : ""})`);
      else if (typeof rule.maxProperties === "number" && count > rule.maxProperties) found.push(`maxProperties at ${at} (at most ${rule.maxProperties} members)`);
      else if (declared !== undefined) {
        const names = Object.keys(declared).filter((name) => Object.hasOwn(item, name));
        for (let i = names.length - 1; i >= 0; i -= 1) stack.push({ value: item[names[i] as string], node: declared[names[i] as string], at: `${at}/${names[i] as string}` });
      }
    }
  }
  return found;
}

/**
 * What is refused before the schema runs (CA-2): what `widths` finds, and a string value or a member name longer than
 * LONGEST_STRING code points, whose patterns could not run.
 */
function oversize(value: unknown): string[] {
  const names = schemaNames();
  const long = new Set<string>();
  walk(value, "", (frame, key, index) => placedToken(frame.name, frame.parent, key, index, names, isNone(frame.container)), (text, spot, place) => {
    if (tooLong(text)) long.add(`maxLength at ${place(spot) || "/"} (at most ${LONGEST_STRING} code points)`);
  });
  return [...widths(value), ...long];
}

/**
 * What the schema allows at a failed place, from the schema alone, never the instance: the missing member's name for
 * `required` (when the schema declares it), the values for `enum` and `const`, the pattern for `pattern`.
 */
function allowed(error: { keyword: string; schema?: unknown; params?: Record<string, unknown> }, names: Set<string>, at = ""): string {
  const params = error.params ?? {};
  // The none form written at a channel's texts or its holding text: the pointer says the one member that takes it.
  const texts = /(^|\/)channels\/[0-9]+\/texts(\/holding)?$/.test(at);
  const elsewhere = texts && (params.additionalProperty === "none" || params.propertyName === "none") ? "; only texts.final takes the none form (Narrowings)" : "";
  if (error.keyword === "required" && typeof params.missingProperty === "string" && names.has(params.missingProperty)) return ` (${params.missingProperty})`;
  if (error.keyword === "additionalProperties") return ` (only declared members are taken${elsewhere})`;
  if (error.keyword === "propertyNames" && isObject(error.schema)) return ` (${nameRule(error.schema)}${elsewhere})`;
  if (error.keyword === "enum" && Array.isArray(params.allowedValues)) {
    const values = params.allowedValues.map(String);
    const rest = values.length > ENUM_VALUES ? ` and ${values.length - ENUM_VALUES} more` : "";
    return ` (one of ${values.slice(0, ENUM_VALUES).join(", ")}${rest})`;
  }
  if (error.keyword === "const" && params.allowedValue !== undefined) return ` (${String(params.allowedValue)})`;
  if (error.keyword === "pattern" && typeof params.pattern === "string") return ` (pattern ${params.pattern.length > PATTERN_CHARACTERS ? `${params.pattern.slice(0, PATTERN_CHARACTERS)}\u2026` : params.pattern})`;
  const limit = typeof params.limit === "number" ? params.limit : undefined;
  if (limit !== undefined) {
    const count = (word: string) => `${limit} ${word}${limit === 1 ? "" : "s"}`;
    if (error.keyword === "maxLength") return ` (at most ${count("code point")})`;
    if (error.keyword === "minLength") return ` (at least ${count("code point")})`;
    if (error.keyword === "maxItems") return ` (at most ${count("item")})`;
    if (error.keyword === "minItems") return ` (at least ${count("item")})`;
    if (error.keyword === "maxProperties") return ` (at most ${count("member")})`;
    if (error.keyword === "minProperties") return ` (at least ${count("member")})`;
    if (error.keyword === "minimum" || error.keyword === "maximum") return ` (${String(params.comparison)} ${limit})`;
  }
  if (error.keyword === "format" && typeof params.format === "string") return ` (format ${params.format})`;
  // `not` says what the member takes: the none form's `until` only with `not_yet`, a language other than `none`.
  if (error.keyword === "not" && isObject(error.schema) && Array.isArray(error.schema.required)) return ` (${error.schema.required.join(", ")} only with not_yet)`;
  if (error.keyword === "not" && isObject(error.schema) && error.schema.const !== undefined) return ` (a value other than ${String(error.schema.const)})`;
  // A failed type names the type the schema wants; a nullable member fails in one line ending ", or null".
  if (error.keyword === "type" && (typeof params.type === "string" || Array.isArray(params.type))) {
    // At the four members that take the none form, a value of the wrong type (a null included) is told of it.
    const form = NONE_FORM_AT.test(at) ? ", or the none form {none: not_yet, until} / {none: not_used}" : "";
    return ` (${[params.type].flat().join(" or ")}${form})`;
  }
  // A guard for a future non-nullable `oneOf`: schemaErrors drops a nullable member's `oneOf` line, so no line from it
  // reaches this branch today; the nullable sub-branch serves direct `placed()` callers.
  if (error.keyword === "oneOf") {
    const branches = error.schema;
    if (Array.isArray(branches)) {
      const types = branches.map((branch) => typeOf(branch)).filter((type) => type !== undefined && type !== "null");
      const nullable = branches.some((branch) => typeOf(branch) === "null");
      if (nullable && types.length > 0) return ` (${article(types[0] as string)} ${types.join(" or ")} or null)`;
    }
    return " (exactly one of its forms)";
  }
  return "";
}

/** The four members that take the standard's none form, as a place writes them (CA-2). */
const NONE_FORM_AT = /(^|\/)projects\/[0-9]+\/(question_route|gap_registry|tickets\/pd_check|channels\/[0-9]+\/texts\/final)$/;

/** What a `propertyNames` schema takes, from the schema alone: its pattern, its length, the name it refuses. */
function nameRule(rule: JsonObject): string {
  const parts: string[] = [];
  if (typeof rule.pattern === "string") parts.push(`matching ${rule.pattern}`);
  if (typeof rule.maxLength === "number") parts.push(`at most ${rule.maxLength} code points`);
  if (isObject(rule.not) && rule.not.const !== undefined) parts.push(`other than ${String(rule.not.const)}`);
  return parts.length === 0 ? "a member name the schema takes" : `a member name ${parts.join(", ")}`;
}

/** A branch's type, through its `$ref`s into the schema's own `$defs` (the only references this schema makes). */
function typeOf(branch: unknown): string | undefined {
  if (!isObject(branch)) return undefined;
  if (typeof branch.type === "string") return branch.type;
  const defs = (schemaShape().schema as JsonObject).$defs as JsonObject;
  return typeof branch.$ref === "string" ? typeOf(defs[branch.$ref.slice("#/$defs/".length)]) : undefined;
}

const article = (word: string): string => (/^[aeiou]/.test(word) ? "an" : "a");

/** At most this many enum values are named beside a place, and a pattern is cut to this many characters. */
const ENUM_VALUES = 8;
const PATTERN_CHARACTERS = 80;

/**
 * The places a message names, each distinct pattern spelled once: a later place failing the same pattern is named
 * with `(pattern as above)`.
 */
export function messagePlaces(places: readonly string[]): string[] {
  const seen = new Set<string>();
  return places.map((written) => {
    // A nullable member's ", or null" is kept apart, so its pattern reads as any other place's.
    const orNull = written.endsWith(", or null") ? ", or null" : "";
    const place = written.slice(0, written.length - orNull.length);
    const at = place.indexOf(" (pattern ");
    if (at < 0) return written;
    const pattern = place.slice(at);
    if (seen.has(pattern)) return `${place.slice(0, at)} (pattern as above)${orNull}`;
    seen.add(pattern);
    return written;
  });
}

/** An Ajv error as its keyword and its place, every free member name replaced by `*`, never a declared value. */
export function placed(error: { keyword: string; instancePath: string; schemaPath?: string; schema?: unknown; params?: Record<string, unknown> }, orNull = false): string {
  const names = schemaNames();
  const tokens = error.instancePath.split("/").slice(1).map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
  // The schema enters arrays only where it declares them, so a number after a declared array's name is an index.
  // An error from the none form (any schema but the language map's) writes `none` and `until` under a final text.
  const noneForm = typeof error.schemaPath === "string" && !error.schemaPath.startsWith("#/$defs/texts");
  const at = tokens.map((token, i) => placedToken(tokens[i - 1], tokens[i - 2], token, /^(0|[1-9][0-9]{0,8})$/.test(token), names, noneForm)).join("/");
  return `${error.keyword} at /${at}${allowed(error, names, at)}${orNull ? ", or null" : ""}`;
}

/** The schema's errors on a value, as places; a schema that cannot run on it (a RangeError) is TOO_LARGE. */
export function schemaErrors(value: unknown, validate: ValidateFunction): string[] {
  try {
    if (validate(value) === true) return [];
    // A nullable member's null branch fails `type` (null) for every non-null value; that line and the `oneOf` line are dropped.
    // An `if` line only says which branch of a member that takes the none form failed; that branch's own lines say how.
    // A nullable member (a `oneOf` with a null branch) fails as its value branch does: that branch's line says
    // ", or null", and the `oneOf` line is dropped, so no line repeats another.
    const all = validate.errors as ErrorObject[];
    const nullable = new Set(all.filter((error) => error.keyword === "oneOf" && Array.isArray(error.schema) && error.schema.some((branch) => typeOf(branch) === "null")).map((error) => error.instancePath));
    // A member name's own failures (pattern, length, not) are stated by its `propertyNames` line.
    const errors = all.filter((error) => error.keyword !== "if" && !(error.keyword !== "propertyNames" && error.propertyName !== undefined) && !(error.keyword === "type" && error.params.type === "null") && !(error.keyword === "oneOf" && nullable.has(error.instancePath)));
    return [...new Set(errors.map((error) => placed(error, nullable.has(error.instancePath))))];
  } catch (error) {
    if (error instanceof RangeError) return [TOO_LARGE];
    throw error;
  }
}

/** The schema's verdict on the declaration at one site (DEC-0150 CA-1, CA-2), before the reader's rules. */
function schemaView(doc: unknown, site: ChannelAgentSite): { declared: false } | { declared: true; valid: false; errors: string[] } | { declared: true; valid: true; standard: string; projects: ChannelAgentProject[] } {
  const extensions = isObject(doc) ? extensionsAt(doc, site) : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, KEY)) return { declared: false };
  const value = extensions[KEY];
  const refused = oversize(value);
  const errors = refused.length > 0 ? refused : schemaErrors(value, schemaShape());
  if (errors.length > 0) return { declared: true, valid: false, errors };
  const declared = value as { standard: string; projects: ChannelAgentProject[] };
  return { declared: true, valid: true, standard: declared.standard, projects: declared.projects };
}

/**
 * The reader of extensions/channel-agent/0.1 at one site (DEC-0150 CA-1, CA-2, CA-5), with the same declared, reported
 * and errors as `connectionsView`: no
 * key is `declared: false, reported: false`; an invalid declaration (FAC-SEM-162), one with a credential-shaped name or
 * value or a part left unread for credentials (FAC-SEM-165), or one with a repeated id or an unnamed decision
 * (FAC-SEM-163) is `declared: false, reported: true`, its errors naming the rule and the place, never the value; a read
 * and valid one is `declared: true`, with FAC-SEM-164's findings as `obligations`, which the reader shows to its author.
 */
export function channelAgentView(doc: unknown, site: ChannelAgentSite = "manifest"): ChannelAgentView {
  const view = schemaView(doc, site);
  const budget = newBudget();
  const named = viewLine;
  if (!view.declared) {
    // Only misplaced copies: each is reported where it stands in the document, with what it holds.
    const copies = site === "manifest" && isObject(doc) ? [...misplaced(doc, budget), ...summary(budget)] : [];
    return copies.length > 0 ? { declared: false, reported: true, errors: once(copies.map(named)) } : { declared: false, reported: false, errors: [] };
  }
  // The read declaration alone, walked first and with the whole budget, as `channelAgentRules` walks it: its answer
  // rests only on the findings under its own path.
  const value = (extensionsAt(doc as JsonObject, site) as JsonObject)[KEY];
  const credentials = [...secrets(value, "", budget), ...summary(budget)].map(named);
  if (!view.valid) {
    const lines = view.errors.slice(0, SECRET_FINDINGS).map(schemaLine);
    if (view.errors.length > SECRET_FINDINGS) lines.push(`FAC-SEM-162 at /: and ${view.errors.length - SECRET_FINDINGS} more`);
    return { declared: false, reported: true, errors: once([...lines, ...credentials]) };
  }
  const repeated = newCap();
  const owing = newCap();
  const blocking: Finding[] = [];
  const owed: Finding[] = [];
  const projects = new Set<unknown>();
  view.projects.forEach((project, i) => {
    const at = `/projects/${i}`;
    if (projects.has(project.project)) blocking.push(...repeat(at, repeated));
    projects.add(project.project);
    blocking.push(...references(project, at, repeated));
    owed.push(...obligations(project, at, owing));
  });
  blocking.push(...closing("FAC-SEM-163", repeated, ""));
  const errors = [...credentials, ...blocking.map(named)];
  if (errors.length > 0) return { declared: false, reported: true, errors: once(errors) };
  return { declared: true, reported: false, errors: [], standard: view.standard, projects: view.projects, obligations: once([...owed, ...closing("FAC-SEM-164", owing, "")].map(named)) };
}

/** A view's line: the rule, the place and the finding's reason, its message without the decision it cites. */
export function viewLine(finding: Finding): string {
  return `${finding.code} at ${finding.instancePath || "/"}: ${finding.message.replace(/ \(DEC-0150 CA-[0-9]\)$/, "")}`;
}

/** Identical lines (one code, place and reason) once, in their order. */
const once = (lines: string[]): string[] => [...new Set(lines)];

/** FAC-SEM-163 at a project that repeats an earlier entry's, within the cap. */
function repeat(at: string, cap: Cap): Finding[] {
  if (cap.named >= SECRET_FINDINGS) {
    cap.more += 1;
    return [];
  }
  cap.named += 1;
  return [{ code: "FAC-SEM-163", instancePath: `${at}/project`, message: "this project repeats an earlier entry's (DEC-0150 CA-3)" }];
}

/** A schema place as a reader's error line: the rule, the place, then the failed keyword and the schema's limit. */
export function schemaLine(error: string): string {
  const parts = /^(\S+) at (\/\S*)(.*)$/.exec(error);
  return parts === null ? `FAC-SEM-162 at /: ${error}` : `FAC-SEM-162 at ${parts[2]}: ${parts[1]}${parts[3]}`;
}

/** The places FAC-SEM-163 or FAC-SEM-164 named for one declaration, and those counted past SECRET_FINDINGS. */
interface Cap { named: number; more: number }
const newCap = (): Cap => ({ named: 0, more: 0 });

/** The closing count of FAC-SEM-163 or FAC-SEM-164 past SECRET_FINDINGS places, at the declaration, as FAC-SEM-165 has. */
function closing(code: "FAC-SEM-163" | "FAC-SEM-164", cap: Cap, root: string): Finding[] {
  if (cap.more === 0) return [];
  const what = code === "FAC-SEM-163" ? "repeated ids or decisions not named (DEC-0150 CA-3)" : "places that owe a text, a recommendation or a spend record, or carry a blank or refused text (DEC-0150 CA-4)";
  return [{ code, instancePath: root, message: `and ${cap.more} more ${what}` }];
}

/** FAC-SEM-162 on a manifest: the key where a reader does not read it (the manifest's own extensions, a capability's). */
function misplaced(doc: JsonObject, budget: Budget): Finding[] {
  const findings: Finding[] = [];
  const flag = (extensions: JsonObject, at: string) => {
    const root = `${at}/${KEY_TOKEN}`;
    findings.push({ code: "FAC-SEM-162", instancePath: root, message: "a reader reads a manifest's channel-agent declaration under provider.extensions only, so it is not read here (DEC-0150 CA-1)" });
    // Not read, still published: a credential in it is found where it stands.
    budget.copies.add(root);
    findings.push(...secrets(extensions[KEY], root, budget));
  };
  if (isObject(doc.extensions) && Object.hasOwn(doc.extensions, KEY)) flag(doc.extensions, "/extensions");
  for (const [capability, i] of indexed(doc.capabilities)) {
    if (isObject(capability.extensions) && Object.hasOwn(capability.extensions, KEY)) flag(capability.extensions, `/capabilities/${i}/extensions`);
  }
  return findings;
}

/**
 * The first DETECTOR_CODE_POINTS code points of a string, which is all the detector reads: a scan over UTF-16 units that
 * slices without an array and never splits a surrogate pair. The walk computes it once per string and passes it on.
 */
function head(text: string): string {
  if (text.length <= DETECTOR_CODE_POINTS) return text;
  // The regular expression engine takes the first DETECTOR_CODE_POINTS code points, a pair as one, in one pass.
  return (HEAD.exec(text) as RegExpExecArray)[0];
}
// With the `u` flag a surrogate pair is one character, so no pair is ever split; a lone surrogate is one too.
const HEAD = new RegExp(`^[\\s\\S]{0,${DETECTOR_CODE_POINTS}}`, "u");
/**
 * Whether a string is shaped like a credential, by FAC-SEM-101's detector (by shape: today an ordinary name of `sk-` and
 * 16 or more letters, digits, `_` or `-`, in any case, is one too; DEC-0151, in progress, narrows that rule).
 */
const shaped = (text: string): boolean => shapedRead(head(text));
/** shaped() on a string already cut to its head (the walk cuts each string once). */
const shapedRead = (read: string): boolean => secretValue(read) || urlReadingRead(read);

/** A scheme at the start of a string: what a string must open with to be read as a URL. */
const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;
/** A percent-escape of a byte at or above 0x80, which a URL parse decodes and may hand to host processing. */
const HIGH_ESCAPE = /%[89A-Fa-f][0-9A-Fa-f]/;
/**
 * Whether a string is read as a URL (CA-5): its head (the first code points the detector reads), once ASCII tab, line
 * feed and carriage return are removed, is ASCII only, holds no percent-escape of a byte at or above 0x80, and opens
 * with a scheme. Anything outside ASCII, written or escaped, could reach the URL parser's host processing (a special
 * scheme takes a host even without `//`), whose cost grows with the square of a long label; such a string is read by
 * the detector's value and argument shapes only, so a password or a credential-named parameter in it is not found.
 */
export function readAsUrl(text: string): boolean {
  return readAsUrlRead(head(text));
}
/** readAsUrl() on a string already cut to its head. */
function readAsUrlRead(head: string): boolean {
  // As the URL parser does: leading C0 controls and spaces stripped, then tab, line feed and carriage return removed.
  const read = head.replace(/^[\u0000-\u0020]+/, "").replace(/[\t\n\r]/g, "");
  return /^[\x00-\x7f]*$/.test(read) && !HIGH_ESCAPE.test(read) && SCHEME.test(read);
}

/** The detector's URL reading where `readAsUrl` admits the string, its argument reading otherwise (no URL parse), on a
 * string already cut to its head. */
const urlReadingRead = (read: string): boolean => (readAsUrlRead(read) ? secretUrl(read) : secretArgument(read));
/** Only a provider key's or a JWT's shape: a board thread's id is a long mixed run by design. */
const keyShaped = (text: string): boolean => {
  const read = head(text);
  return JWT_SHAPE.test(read) || SECRET_VALUE.test(read);
};
/** Whether a member name may stand in a path as written (CA-5). */
const plainName = (name: string): boolean => NAME_CHARACTERS.test(name) && !/[0-9]{7}/.test(name.replace(/[-_]/g, "")) && !shaped(name);

/** The grammars a narrow reading needs the value to match first (the schema's `relativeRef`, the board's `opaqueId`). */
const RELATIVE_REF = /^(?![/~])(?![A-Za-z][A-Za-z0-9+.-]*:)(?!(?:[^/]*\/)*\.\.(?:\/|$))[A-Za-z0-9._:/-]+$/;
const OPAQUE_ID = /^[A-Za-z0-9_-]{8,128}$/;
const relativeRef = (text: string): boolean => text.length >= 1 && text.length <= 256 && RELATIVE_REF.test(text);
/** FAC-SEM-165 reads at most this many UTF-16 units in all (an astral character is two); a declaration past it is not read further. */
export const SECRET_BUDGET = 1_000_000;

const BASE64URL = /[A-Za-z0-9_-]/;
/** What is left of FAC-SEM-165's reading for one document, shared by every copy of its declaration. */
interface Budget {
  /** UTF-16 units left to read (an astral character is two). */
  left: number;
  /** Whether a name or a string was left unread because the budget was spent. */
  unread: boolean;
  /** Places named so far in the document (SECRET_FINDINGS at most), and those counted past it, in all copies. */
  named: number;
  more: number;
  /** Where the closing finding that the rest was not read stands: the copy where the budget ran out. */
  unreadAt: string | undefined;
  /** The misplaced copies' places: a copy the budget ran out in is one no reader reads. */
  copies: Set<string>;
}

/** A fresh budget for one document. */
const newBudget = (): Budget => ({ left: SECRET_BUDGET, unread: false, named: 0, more: 0, unreadAt: undefined, copies: new Set() });

/** What each name or string costs beyond its UTF-16 units: the call itself. */
export const VISIT_COST = 16;
/**
 * What each query or fragment piece costs: the detector decodes and splits every piece, which, measured under the
 * gate's coverage run, costs about as much as reading 100 UTF-16 units of prose.
 */
export const PIECE_COST = 8 * VISIT_COST;
/**
 * What the argument reading (secretArgument) costs per piece it makes, beside the UTF-16 units: it splits a string at
 * each white space and `=`, and a path-like piece again at each `/` and `\`, then reads every piece; a string of
 * separators only is all pieces. Charged per separator, `/` and `\` included wherever they stand (a bound).
 */
export const ARG_PIECE_COST = 4;
const SEPARATOR = /[\s=/\\]/g;
/** ARG_PIECE_COST for each separator the argument reading may split at. */
export function argumentPieces(text: string): number {
  return ARG_PIECE_COST * (text.match(SEPARATOR)?.length ?? 0);
}

/** The end of the base64url run that starts at `from`. */
function runFrom(text: string, from: number): number {
  let end = from;
  while (end < text.length && BASE64URL.test(text[end] as string)) end += 1;
  return end;
}

/**
 * The cost of the JWT shape's reading of a text: from each `eyJ`, its base64url run, `eyJ` included, and, when
 * that run ends at a `.`, the dot and the base64url run after it (the shape's second segment).
 */
function jwtRereads(text: string): number {
  let cost = 0;
  let reach = 0;
  let runEnd = 0;
  for (let at = text.indexOf("eyJ"); at >= 0; at = text.indexOf("eyJ", at + 1)) {
    if (runEnd <= at) {
      runEnd = runFrom(text, at);
      reach = text[runEnd] === "." ? runFrom(text, runEnd + 1) : runEnd;
    }
    cost += reach - at;
  }
  return cost;
}

/** The number of code points in a text (a surrogate pair is one). */
export function codePoints(text: string, limit = Number.POSITIVE_INFINITY, from = 0): number {
  let count = 0;
  for (let at = from; at < text.length && count < limit; at += 1) {
    const unit = text.charCodeAt(at);
    if (unit >= 0xd800 && unit <= 0xdbff && at + 1 < text.length) {
      const next = text.charCodeAt(at + 1);
      if (next >= 0xdc00 && next <= 0xdfff) at += 1;
    }
    count += 1;
  }
  return count;
}

/**
 * An escape that ends right before an `sk-` and so stands as a boundary for it, read on the few characters before it:
 * `%XX`, `%25XX`, `\xHH`, `\uHHHH`, a two- or three-digit octal escape or a backslash escape of one character. A colour
 * sequence is read by `colourBefore`.
 */
const ESCAPE_BEFORE = /(?:%25[0-9A-Fa-f]{2}|%[0-9A-Fa-f]{2}|\\x[0-9A-Fa-f]{2}|\\u[0-9A-Fa-f]{4}|\\[0-7]{2,3}|\\.)$/;
/** An ESC, raw or escaped: `\x1b`, `\033`, `\33`, `\u001b` (either case of the hex digits) or `\e`. */
const ESC_BEFORE = /(?:\u001b|\\x1[bB]|\\0?33|\\u001[bB]|\\e)$/;

/** Whether a colour sequence `ESC[...m`, with any number of parameter characters (digits, `;` and `:`), ends right before `at`. */
function colourBefore(text: string, at: number): boolean {
  if (text[at - 1] !== "m") return false;
  let start = at - 2;
  while (start >= 0 && /[0-9;:]/.test(text[start] as string)) start -= 1;
  return text[start] === "[" && ESC_BEFORE.test(text.slice(Math.max(0, start - 6), start));
}

/** UTF-16 units from `from`, at most `limit`: what a reading charges (an astral character is two). */
const units = (text: string, limit: number, from: number): number => Math.max(0, Math.min(limit, text.length - from));
/** What a provider-key reading may reread from each `sk-`, in any case, that follows a boundary, its three characters included: up to 255 UTF-16 units. */
function keyRereads(text: string): number {
  let cost = 0;
  const pattern = /sk-/gi;
  for (let match = pattern.exec(text); match !== null; match = pattern.exec(text)) {
    const at = match.index;
    pattern.lastIndex = at + 1;
    const boundary = at === 0 || !/[A-Za-z0-9]/.test(text[at - 1] as string) || ESCAPE_BEFORE.test(text.slice(Math.max(0, at - 6), at)) || colourBefore(text, at);
    // At a boundary the shape may read a long key; anywhere else the detector's `sk-` run is still tried, up to its floor.
    cost += boundary ? units(text, KEY_REREAD, at) : units(text, SK_FLOOR, at + 3);
  }
  // Every other provider prefix, anywhere and in any case: a bound any detector may need, whatever boundary or case its
  // own shapes take, for a near miss reread up to the run its shape needs (its floor) before it fails.
  for (const [prefix, floor] of PREFIX_FLOORS) {
    prefix.lastIndex = 0;
    for (let match = prefix.exec(text); match !== null; match = prefix.exec(text)) {
      cost += units(text, floor, match.index + match[0].length);
      prefix.lastIndex = match.index + 1;
    }
  }
  return cost;
}
const KEY_REREAD = 255;
/** The shared detector's long-run floor (LONG_RUN in `secret-shape.ts`): a run of base64 characters this long or longer. */
export const LONG_RUN_FLOOR = 40;
/**
 * The shared detector's near-miss reread of a long run, over the three partitions its readings split a string into: the
 * base64 class `[A-Za-z0-9+/=_-]` (secretValue), that class without `=` (secretArgument splits at `=`), and that class
 * without `=` and `/` (secretArgument then splits a path at `/`). In each partition, for each maximal run shorter than
 * LONG_RUN_FLOOR, a regular expression that needs 40 may start at each of its characters and read to the run's end, so
 * each character is charged min(length, 39); a run of 40 or more matches at once and is charged nothing more here.
 */
export function runRereads(text: string): number {
  let cost = 0;
  let whole = 0;
  let noEquals = 0;
  let noSlash = 0;
  const charge = (run: number) => (run < LONG_RUN_FLOOR ? run * Math.min(run, LONG_RUN_FLOOR - 1) : 0);
  // One pass past the end closes the last runs: the character there reads as NaN, which no range takes.
  for (let i = 0; i <= text.length; i += 1) {
    const c = text.charCodeAt(i);
    // A-Z, a-z, 0-9, +, _ and -: in every partition. ASCII, so a run's UTF-16 units are its code points.
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 43 || c === 95 || c === 45) {
      whole += 1;
      noEquals += 1;
      noSlash += 1;
    } else if (c === 47) {
      // `/` ends a run only in the third partition.
      whole += 1;
      noEquals += 1;
      cost += charge(noSlash);
      noSlash = 0;
    } else if (c === 61) {
      // `=` ends a run in the second and the third.
      whole += 1;
      cost += charge(noEquals) + charge(noSlash);
      noEquals = 0;
      noSlash = 0;
    } else {
      cost += charge(whole) + charge(noEquals) + charge(noSlash);
      whole = 0;
      noEquals = 0;
      noSlash = 0;
      // A surrogate pair is one character outside every run: its low half is stepped over, never read alone.
      if (c >= 0xd800 && c <= 0xdbff && (text.charCodeAt(i + 1) & 0xfc00) === 0xdc00) i += 1;
    }
  }
  return cost;
}
/** A bound for an `sk-` away from a boundary, which a detector may still try: up to the 16 UTF-16 units its run needs. */
export const SK_FLOOR = 16;
/** The shared detector's other provider prefixes, each with the run its shape needs after it (SECRET_VALUE). */
export const PREFIX_FLOORS: ReadonlyArray<readonly [RegExp, number]> = [[/gh[pousr]_/gi, 20], [/xox[abposr]-/gi, 10], [/akia/gi, 16], [/glpat-/gi, 20]];

/**
 * The UTF-16 units the detector reads in a string's head (an astral character is two), counted in one pass, a bound any
 * port's detector may need (the walk adds VISIT_COST per name or string beside it, and VISIT_COST for every other
 * value it reaches: each array or object and each number, boolean or null): the string's UTF-16 units; the JWT shape's rereading, from each `eyJ`,
 * of its base64url run, `eyJ` included (and of the dot and the run after it); from each `sk-`, in any case, that follows a boundary (the start, a character other than a letter or
 * a digit, an escape ESCAPE_BEFORE names or a colour sequence), its three characters included, up to 255 UTF-16 units to
 * the end of the string; after an `sk-` away from a boundary, up to SK_FLOOR; after another provider prefix, its floor;
 * for each maximal run of base64 characters shorter than LONG_RUN_FLOOR (40), min(length, 39) per character. For a
 * string `readAsUrl` admits and that parses as a URL, on the names and values a WHATWG URL parse yields (tab, line feed and carriage return
 * removed, percent-decoded, as `rawValues` hands them over), for every query or fragment piece: PIECE_COST, its name's
 * and value's UTF-16 units, the value's JWT and `sk-` terms, provider-prefix floors and long-run term, and, when the value is not empty and the name holds an
 * upper-case letter, the triangular number n(n+1)/2 of the name's length (splitting a name into words may backtrack over it).
 * For every string, ARG_PIECE_COST for each white space, `=`, `/` and `\\` (the argument reading's pieces). For every
 * string `readAsUrl` admits, PIECE_COST once for its URL parses, whether it parses or not. Only the head is counted.
 */
export function detectorCost(whole: string, isHead = false): number {
  // The detector reads only a string's head: a caller that has not cut it yet gets it cut here.
  const text = isHead ? whole : head(whole);
  // Every string is read as an argument too (secretArgument, which secretUrl also runs first): each separator a piece.
  // Counted in UTF-16 units, what every pass reads (an astral character is two).
  let cost = text.length + jwtRereads(text) + keyRereads(text) + runRereads(text) + argumentPieces(text);
  if (!readAsUrlRead(text)) return cost;
  // A string read as a URL is parsed twice (here and by secretUrl), whether it parses or throws: PIECE_COST for that.
  cost += PIECE_COST;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return cost;
  }
  for (const part of [url.search, url.hash]) {
    // Each `&` makes a piece, an empty one included, which rawValues still reads.
    cost += ARG_PIECE_COST * (part.split("&").length - 1);
    for (const [name, values] of rawValues(part.slice(1))) {
      const length = name.length;
      const upper = /[A-Z]/.test(name);
      for (const value of values) {
        cost += PIECE_COST + length + value.length + jwtRereads(value) + keyRereads(value) + runRereads(value);
        if (value !== "" && upper) cost += (length * (length + 1)) / 2;
      }
    }
  }
  return cost;
}

/**
 * FAC-SEM-165: no member name and no string of the declaration is shaped like a credential, by FAC-SEM-101's detector
 * (by shape). Three places read narrower, and only when the value matches its own grammar: a project's token slot
 * segment by segment, its eval suite and outbox (relative paths) by the detector's path-aware reading, and a queue's
 * recommendation (a board opaque id) by a provider key's and a JWT's shapes only; anything else is read whole. A place
 * writes a declared name, an index of a declared array, else `*`, as FAC-SEM-162 does; a member whose name is not plain
 * collapses its place, so it and its descendants are placed at its nearest plain ancestor, and so does a member past
 * PATH_DEPTH. The budget is the document's: at most SECRET_FINDINGS places are named in all, and once SECRET_BUDGET is
 * spent nothing more is read and every further member collapses; `summary` adds the document's two closing findings.
 */
function secrets(value: unknown, root: string, budget: Budget = newBudget()): Finding[] {
  const findings: Finding[] = [];
  const names = schemaNames();
  // This copy's places past the document's SECRET_FINDINGS: counted here, closed at this copy, so the read declaration's
  // count never holds another copy's places.
  let more = 0;
  // `id`: a member name, or a value whose member takes an id's grammar; a text or a label gets no advice to rename.
  const flag = (at: string, what: string, text: string, id: boolean) => {
    if (budget.named < SECRET_FINDINGS) {
      budget.named += 1;
      const rename = id && /^sk-/i.test(text) ? "; an id that starts with sk- is read as a key; rename it" : "";
      findings.push({ code: "FAC-SEM-165", instancePath: at, message: `${what} is shaped like a credential: a token is named by its vault slot, never written${rename} (DEC-0150 CA-5)` });
    } else {
      budget.more += 1;
      more += 1;
    }
  };
  // The walk stops once the budget is spent, so nothing is read after it.
  // `read` is the string's head, cut once by the walk's callback.
  const afford = (read: string): boolean => {
    if (budget.unread) return false;
    const cost = (read === "" ? 0 : detectorCost(read, true)) + VISIT_COST;
    if (cost > budget.left) {
      budget.unread = true;
      budget.unreadAt = root;
      return false;
    }
    budget.left -= cost;
    return true;
  };
  // A member's name is read once, by its visit, which the walk makes before it enters or reads the member; the visit
  // keeps whether the name is plain for that frame and key, so placing the member reads nothing again. A name left
  // unread (the budget spent) is not plain: the member collapses.
  let last: { frame: Frame | undefined; key: string; plain: boolean } = { frame: undefined, key: "", plain: false };
  const tokenOf = (frame: Frame, key: string, index: boolean) => {
    if (index) return placedToken(frame.name, frame.parent, key, index, names);
    const plain = last.frame === frame && last.key === key && last.plain;
    return plain ? placedToken(frame.name, frame.parent, key, index, names, isNone(frame.container)) : undefined;
  };
  walk(value, root, tokenOf, (text, spot, place) => {
    const read = head(text);
    if (spot.isName) {
      last = { frame: spot.frame, key: text, plain: false };
      if (!afford(read)) return;
      const isShaped = shapedRead(read);
      last.plain = !isShaped && NAME_CHARACTERS.test(text) && !/[0-9]{7}/.test(text.replace(/[-_]/g, ""));
      if (isShaped) flag(place(spot), "a member's name", text, !inTexts(spot.frame));
      return;
    }
    if (!afford(read)) return;
    const role = spot.frame?.role;
    const key = spot.key;
    let found: boolean;
    if (role === "tickets" && key === "token_slot" && TOKEN_SLOT.test(text)) found = text.split("/").some((segment) => secretValue(segment));
    else if (((role === "evals" && key === "suite") || (role === "tickets" && key === "outbox")) && relativeRef(text)) found = urlReadingRead(read);
    else if (role === "queue" && key === "recommendation" && OPAQUE_ID.test(text)) found = keyShaped(text);
    else found = shapedRead(read);
    if (found) flag(place(spot), "a value", text, ID_MEMBERS.has(key) && !inTexts(spot.frame));
  }, () => budget.unread, () => {
    // Every value the reading reaches costs VISIT_COST: each array or object (the declaration itself and empty ones
    // included) and each number, boolean or null here, each name and string through afford.
    if (budget.unread) return;
    if (VISIT_COST > budget.left) {
      budget.unread = true;
      budget.unreadAt = root;
      return;
    }
    budget.left -= VISIT_COST;
  });
  if (more > 0) findings.push({ code: "FAC-SEM-165", instancePath: root, message: `and ${more} more names or values shaped like a credential (DEC-0150 CA-5)` });
  return findings;
}

/** Whether a frame is a channel's `texts` or any frame below them, where no member takes an id's grammar. */
const inTexts = (frame: Frame | undefined): boolean => frame?.role === "texts";

/** The members whose value takes an id's grammar: a value there that starts with `sk-` is told to be renamed. */
const ID_MEMBERS = new Set(["id", "code", "lead_agent", "owner", "decision", "answered_signal", "target", "spend_record", "project", "side"]);

/** The document's closing FAC-SEM-165 findings, once: the count past SECRET_FINDINGS, and that the rest was not read. */
function summary(budget: Budget): Finding[] {
  const findings: Finding[] = [];
  if (budget.unread) {
    const at = budget.unreadAt as string;
    // At a misplaced copy, which no reader reads, the fix is to remove it; at the read declaration, to shorten it.
    const fix = budget.copies.has(at) ? "this copy is not read by a reader and should be removed" : "a reader treats the declaration as not declared; declare fewer or shorter texts or names";
    findings.push({ code: "FAC-SEM-165", instancePath: at, message: `reading the declarations for credentials takes more than ${SECRET_BUDGET} UTF-16 units of reading; ${fix} (DEC-0150 CA-5)` });
  }
  return findings;
}

/** The indexes of the items whose `member` repeats an earlier item's (the second and later occurrences). */
function repeats(items: Array<[JsonObject, number]>, member: string): number[] {
  const seen = new Set<unknown>();
  const found: number[] = [];
  for (const [item, i] of items) {
    if (seen.has(item[member])) found.push(i);
    seen.add(item[member]);
  }
  return found;
}

/** FAC-SEM-163: ids once, and every channel held by a decision names a recorded one (DEC-0150 CA-3). */
function references(project: JsonObject, at: string, cap: Cap = newCap()): Finding[] {
  const findings: Finding[] = [];
  const flag = (path: string, message: string) => {
    if (cap.named < SECRET_FINDINGS) {
      cap.named += 1;
      findings.push({ code: "FAC-SEM-163", instancePath: `${at}${path}`, message: `${message} (DEC-0150 CA-3)` });
    } else cap.more += 1;
  };
  for (const i of repeats(indexed((project.taxonomy as JsonObject).codes), "code")) flag(`/taxonomy/codes/${i}/code`, "this category code repeats an earlier one");
  for (const i of repeats(indexed(project.tiers), "code")) flag(`/tiers/${i}/code`, "this tier code repeats an earlier one");
  const channels = indexed(project.channels);
  for (const i of repeats(channels, "id")) flag(`/channels/${i}/id`, "this channel id repeats an earlier channel's");
  const sourceIds = new Set<unknown>();
  const groups = [["sources", "this source id repeats an earlier source's"], ["declined_sources", "this declined source's id repeats a source read or declined before it"]] as const;
  for (const [member, message] of groups) {
    for (const [source, i] of indexed(project[member])) {
      if (sourceIds.has(source.id)) flag(`/${member}/${i}/id`, message);
      sourceIds.add(source.id);
    }
  }
  for (const i of repeats(indexed(project.handoff_queues), "id")) flag(`/handoff_queues/${i}/id`, "this hand-off queue id repeats an earlier queue's");
  const decisions = indexed(project.recorded_decisions);
  for (const i of repeats(decisions, "id")) flag(`/recorded_decisions/${i}/id`, "this decision id repeats an earlier recorded decision's");
  const recorded = new Set(decisions.map(([decision]) => decision.id));
  for (const [channel, i] of channels) {
    if (channel.decision === null) {
      if (channel.replies_enabled === false) flag(`/channels/${i}/decision`, "a channel with replies off names the recorded decision that holds it");
    } else if (!recorded.has(channel.decision)) {
      flag(`/channels/${i}/decision`, "this channel's decision is not one recorded_decisions lists");
    }
  }
  return findings;
}

/** FAC-SEM-164: what a channel, a queue and the budgets owe (DEC-0150 CA-4). */
function obligations(project: JsonObject, at: string, cap: Cap = newCap()): Finding[] {
  const findings: Finding[] = [];
  // Past SECRET_FINDINGS a place is counted, never built.
  const flag = (path: string | (() => string), message: string) => {
    if (cap.named < SECRET_FINDINGS) {
      cap.named += 1;
      findings.push({ code: "FAC-SEM-164", instancePath: `${at}${typeof path === "string" ? path : path()}`, message: `${message} (DEC-0150 CA-4)` });
    } else cap.more += 1;
  };
  for (const [channel, i] of indexed(project.channels)) {
    const texts = channel.texts as JsonObject;
    // A channel that does not reply owes no texts: the holding text follows replies_enabled as the final one does.
    if (channel.replies_enabled === true && channel.holding_reply === true && texts.holding === undefined) flag(`/channels/${i}/texts/holding`, "a channel that sends a holding reply declares the holding text");
    // A final text in the none form owes nothing; only an absent one does.
    if (channel.replies_enabled === true && texts.final === undefined) flag(`/channels/${i}/texts/final`, "a channel that replies declares the final text");
    // A holding reply obliges a final reply (the standard's section 6): a final text that is not used cannot follow it.
    if (channel.replies_enabled === true && channel.holding_reply === true && isObject(texts.final) && texts.final.none === "not_used") flag(`/channels/${i}/texts/final`, "a channel that sends a holding reply owes a final reply, so its final text is not one it does not use");
    if (channel.kind === "store_review" && channel.clarifying_question === true) flag(`/channels/${i}/clarifying_question`, "a store review gets one public reply and no clarifying question");
    for (const which of ["holding", "final"] as const) {
      if (which === "final" && isNone(texts.final)) continue;
      for (const [language, text] of Object.entries((texts[which] ?? {}) as Record<string, string>)) {
        // A plain language is written `*`, as FAC-SEM-162 and FAC-SEM-165 write it; one that is not plain, or is shaped
        // like a credential, is placed at its map: no place echoes the declaration's own words.
        const place = () => `/channels/${i}/texts/${which}${plainName(language) ? "/*" : ""}`;
        if (text.replace(BLANK, "") === "") flag(place, "a declared text is blank, and nothing empty is sent");
        else if (text.includes(EM_DASH)) flag(place, "a declared text carries U+2014, which a send's checks refuse");
      }
    }
  }
  for (const [tier, i] of indexed(project.tiers)) {
    const label = tier.label as string;
    if (label.replace(BLANK, "") === "") flag(`/tiers/${i}/label`, "a tier's label is blank, and nothing empty is shown");
    else if (label.includes(EM_DASH)) flag(`/tiers/${i}/label`, "a tier's label carries U+2014, which a send's checks refuse");
  }
  for (const [queue, i] of indexed(project.handoff_queues)) {
    if (queue.answered_signal === "none" && queue.recommendation === undefined) flag(`/handoff_queues/${i}/recommendation`, "a hand-off queue with no answered signal names the recommendation to its owner");
    if (queue.answered_signal !== "none" && queue.recommendation !== undefined) flag(`/handoff_queues/${i}/recommendation`, "a hand-off queue with an answered signal needs no recommendation, and a reader does not read this one");
  }
  const evals = project.evals as JsonObject;
  if (((evals.judge_budget_usd as number) > 0 || (evals.replay_budget_usd as number) > 0) && (evals.spend_record === undefined || evals.spend_record === null)) {
    flag("/evals/spend_record", "a budget above 0 names the usage report's limit it is spent under; without one it reads 0");
  }
  return findings;
}

/**
 * The checks of DEC-0150 on a manifest (`site` manifest, kind `manifest`) or a well-known answer (`site` well-known,
 * kind `service-well-known`): FAC-SEM-162 a misplaced (manifest only) or invalid declaration; FAC-SEM-165 a
 * credential-shaped name or value, in a valid or an invalid one; FAC-SEM-163 and FAC-SEM-164 per project of a valid one.
 */
export function channelAgentRules(doc: unknown, site: ChannelAgentSite = "manifest"): Finding[] {
  if (!isObject(doc)) return [];
  // One budget for the whole document: every copy of the declaration, read or misplaced, draws on it.
  // The read declaration is walked first, so the rules and `channelAgentView` read it with the same budget; the
  // misplaced copies draw on what is left. The findings keep their order: the misplaced copies' first.
  const budget = newBudget();
  const view = schemaView(doc, site);
  const root = CHANNEL_AGENT_PATHS[site];
  const read = view.declared ? secrets((extensionsAt(doc, site) as JsonObject)[KEY], root, budget) : [];
  const findings = site === "manifest" ? misplaced(doc, budget) : [];
  if (!view.declared) return [...findings, ...summary(budget)];
  findings.push(...read, ...summary(budget));
  if (!view.valid) {
    const named = messagePlaces(view.errors.slice(0, MESSAGE_ERRORS)).join(", ");
    const more = view.errors.length > MESSAGE_ERRORS ? ` and ${view.errors.length - MESSAGE_ERRORS} more` : "";
    findings.push({ code: "FAC-SEM-162", instancePath: root, message: `the channel-agent declaration fails its schema: ${named}${more}; a reader treats it as not declared and reports it (DEC-0150 CA-2). The grammars are in docs/specification/channel-agent.md#the-declaration` });
    return findings;
  }
  const projects = new Set<unknown>();
  const repeated = newCap();
  const owing = newCap();
  const owed: Finding[] = [];
  view.projects.forEach((project, i) => {
    const at = `${root}/projects/${i}`;
    if (projects.has(project.project)) findings.push(...repeat(at, repeated));
    projects.add(project.project);
    findings.push(...references(project, at, repeated));
    owed.push(...obligations(project, at, owing));
  });
  return [...findings, ...closing("FAC-SEM-163", repeated, root), ...owed, ...closing("FAC-SEM-164", owing, root)];
}
// #endregion channel-agent
