import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, indexed, isObject } from "./findings.js";
import { JWT_SHAPE, SECRET_VALUE, secretArgument, secretUrl, secretValue } from "./secret-shape.js";
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
  | { declared: false }
  | { declared: true; valid: false; errors: string[] }
  | { declared: true; valid: true; standard: string; projects: ChannelAgentProject[] };

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
  shape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-channel-agent-extension.schema.json`) as ValidateFunction;
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
type Role = "root" | "projects" | "project" | "evals" | "tickets" | "queues" | "queue" | undefined;
const ROLES: Readonly<Record<string, Readonly<Record<string, Role>>>> = { root: { projects: "projects" }, project: { evals: "evals", tickets: "tickets", handoff_queues: "queues" } };
const roleOf = (holder: Role, key: string, index: boolean): Role => {
  if (index) return holder === "projects" ? "project" : holder === "queues" ? "queue" : undefined;
  return holder === undefined ? undefined : ROLES[holder]?.[key];
};
/** Where a name or a string the walk shows sits: its holder's frame (none for the walked value itself) and its key. */
interface Spot { frame: Frame | undefined; key: string; isName: boolean }
/** What the walk shows each name and string: the text, where it sits, and the function that places it (called only when needed). */
type Visit = (text: string, spot: Spot, place: (spot: Spot) => string) => void;

/**
 * Every member name and string value under `value`, read with an explicit stack of cursor frames (one per container, not
 * one per member), so neither depth nor size throws. `tokenOf` gives a member's path token, or undefined to place it at
 * its holder; below PATH_DEPTH every member is placed at its ancestor at that depth. A member's path is built only when
 * the visit asks for it (a container's, when it is entered).
 */
function walk(value: unknown, root: string, tokenOf: (frame: Frame, key: string, index: boolean) => string | undefined, visit: Visit): void {
  // A name is placed at its holder. A member is placed at its own token, or, when its key is not written (no token, or
  // past PATH_DEPTH), its frame is collapsed: it and every descendant are placed at its holder's place.
  const token = (frame: Frame, key: string): string | undefined => (frame.collapsed || frame.depth >= PATH_DEPTH ? undefined : tokenOf(frame, key, frame.keys === undefined));
  const place = (spot: Spot): string => {
    const frame = spot.frame;
    if (frame === undefined) return root;
    const written = spot.isName ? undefined : token(frame, spot.key);
    return written === undefined ? frame.at : `${frame.at}/${written}`;
  };
  if (typeof value === "string") visit(value, { frame: undefined, key: "", isName: false }, place);
  if (!Array.isArray(value) && !isObject(value)) return;
  const enter = (container: unknown[] | JsonObject, at: string, depth: number, name: string | undefined, parent: string | undefined, collapsed: boolean, role: Role): Frame => ({ container, keys: Array.isArray(container) ? undefined : Object.keys(container), next: 0, at, depth, name, parent, collapsed, role });
  const stack: Frame[] = [enter(value, root, 0, undefined, undefined, false, "root")];
  while (stack.length > 0) {
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
      const written = token(frame, key);
      stack.push(enter(child, written === undefined ? frame.at : `${frame.at}/${written}`, frame.depth + 1, key, frame.name, written === undefined, roleOf(frame.role, key, index)));
    }
  }
}

/** Whether a string is longer than LONGEST_STRING code points, without counting a long one whole. */
const tooLong = (text: string): boolean => text.length > LONGEST_STRING && (text.length > 2 * LONGEST_STRING || Array.from(text).length > LONGEST_STRING);

/**
 * A member's token in a FAC-SEM-162 place: a declared name, or an index of a declared array, else `*`. A text's language
 * is always `*`, and so is a numeric key of an object: a number is kept only as a real array index (`index`).
 */
function placedToken(previous: string | undefined, before: string | undefined, token: string, index: boolean, names: Set<string>): string {
  if (before === "texts" && (previous === "holding" || previous === "final")) return "*";
  if (index) return previous !== undefined && ARRAYS.has(previous) && /^(0|[1-9][0-9]{0,8})$/.test(token) ? token : "*";
  return names.has(token) ? token : "*";
}

/** A schema node with its `$ref` followed, within the schema's own `$defs` (every node of this schema is an object). */
function resolved(node: unknown, defs: JsonObject): JsonObject {
  let at = node;
  while (isObject(at) && typeof at.$ref === "string") at = defs[at.$ref.slice("#/$defs/".length)];
  return at as JsonObject;
}

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
    const rule = resolved(node, defs);
    if (Array.isArray(item)) {
      if (typeof rule.maxItems === "number" && item.length > rule.maxItems) found.push(`maxItems at ${at}`);
      else if (rule.items !== undefined) for (let i = item.length - 1; i >= 0; i -= 1) stack.push({ value: item[i], node: rule.items, at: `${at}/${i}` });
    } else if (isObject(item)) {
      const count = Object.keys(item).length;
      const declared = isObject(rule.properties) ? rule.properties : undefined;
      if (declared !== undefined && rule.additionalProperties === false && count > Object.keys(declared).length) found.push(`maxProperties at ${at || "/"}`);
      else if (typeof rule.maxProperties === "number" && count > rule.maxProperties) found.push(`maxProperties at ${at}`);
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
  walk(value, "", (frame, key, index) => placedToken(frame.name, frame.parent, key, index, names), (text, spot, place) => {
    if (tooLong(text)) long.add(`maxLength at ${place(spot) || "/"}`);
  });
  return [...widths(value), ...long];
}

/** An Ajv error as its keyword and its place, every free member name replaced by `*`, never a declared value. */
export function placed(error: { keyword: string; instancePath: string; params?: Record<string, unknown> }): string {
  const names = schemaNames();
  const tokens = error.instancePath.split("/").slice(1).map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~"));
  // The schema enters arrays only where it declares them, so a number after a declared array's name is an index.
  const at = tokens.map((token, i) => placedToken(tokens[i - 1], tokens[i - 2], token, /^(0|[1-9][0-9]{0,8})$/.test(token), names)).join("/");
  const missing = error.keyword === "required" && typeof error.params?.missingProperty === "string" && names.has(error.params.missingProperty) ? ` (${error.params.missingProperty})` : "";
  return `${error.keyword} at /${at}${missing}`;
}

/** The schema's errors on a value, as places; a schema that cannot run on it (a RangeError) is TOO_LARGE. */
export function schemaErrors(value: unknown, validate: ValidateFunction): string[] {
  try {
    return validate(value) === true ? [] : [...new Set((validate.errors as ErrorObject[]).map(placed))];
  } catch (error) {
    if (error instanceof RangeError) return [TOO_LARGE];
    throw error;
  }
}

/** The reader of extensions/channel-agent/0.1 at one site (DEC-0150 CA-1, CA-2). */
export function channelAgentView(doc: unknown, site: ChannelAgentSite = "manifest"): ChannelAgentView {
  const extensions = isObject(doc) ? extensionsAt(doc, site) : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, KEY)) return { declared: false };
  const value = extensions[KEY];
  const refused = oversize(value);
  const errors = refused.length > 0 ? refused : schemaErrors(value, schemaShape());
  if (errors.length > 0) return { declared: true, valid: false, errors };
  const declared = value as { standard: string; projects: ChannelAgentProject[] };
  return { declared: true, valid: true, standard: declared.standard, projects: declared.projects };
}

/** FAC-SEM-162 on a manifest: the key where a reader does not read it (the manifest's own extensions, a capability's). */
function misplaced(doc: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (extensions: JsonObject, at: string) => {
    const root = `${at}/${KEY_TOKEN}`;
    findings.push({ code: "FAC-SEM-162", instancePath: root, message: "a reader reads a manifest's channel-agent declaration under provider.extensions only, so it is not read here (DEC-0150 CA-1)" });
    // Not read, still published: a credential in it is found where it stands.
    findings.push(...secrets(extensions[KEY], root));
  };
  if (isObject(doc.extensions) && Object.hasOwn(doc.extensions, KEY)) flag(doc.extensions, "/extensions");
  for (const [capability, i] of indexed(doc.capabilities)) {
    if (isObject(capability.extensions) && Object.hasOwn(capability.extensions, KEY)) flag(capability.extensions, `/capabilities/${i}/extensions`);
  }
  return findings;
}

/** The first DETECTOR_CODE_POINTS code points of a string, which is all the detector reads. */
function head(text: string): string {
  if (text.length <= DETECTOR_CODE_POINTS) return text;
  return Array.from(text.slice(0, 2 * DETECTOR_CODE_POINTS)).slice(0, DETECTOR_CODE_POINTS).join("");
}
/** Whether a string is shaped like a credential, by FAC-SEM-101's detector (by shape: an ordinary name such as `sk-` and 16 more letters is one too). */
const shaped = (text: string): boolean => {
  const read = head(text);
  return secretValue(read) || secretUrl(read);
};
/** Only a provider key's or a JWT's shape: a board thread's id is a long mixed run by design. */
const keyShaped = (text: string): boolean => {
  const read = head(text);
  return JWT_SHAPE.test(read) || SECRET_VALUE.test(read);
};
/** Whether a member name may stand in a path as written (CA-5). */
const plainName = (name: string): boolean => NAME_CHARACTERS.test(name) && !/[0-9]{7}/.test(name.replace(/[-_]/g, "")) && !shaped(name);

/** The grammars a narrow reading needs the value to match first (the schema's `relativeRef`, the board's `opaqueId`). */
const RELATIVE_REF = /^(?![/~])(?![A-Za-z]:)(?!(?:[^/]*\/)*\.\.(?:\/|$))[A-Za-z0-9._:/-]+$/;
const OPAQUE_ID = /^[A-Za-z0-9_-]{8,128}$/;
const relativeRef = (text: string): boolean => text.length >= 1 && text.length <= 256 && RELATIVE_REF.test(text);
/** FAC-SEM-165 reads at most this many code points in all; a declaration past it is not read further. */
export const SECRET_BUDGET = 1_000_000;

const BASE64URL = /[A-Za-z0-9_-]/;
/**
 * The code points the detector reads in a string: the string once, and, after each `eyJ`, again up to the end of the
 * base64url run it starts, which `JWT_SHAPE` reads back from every `eyJ` before it fails. Counted in one pass.
 */
export function detectorCost(text: string): number {
  let cost = text.length;
  let runEnd = 0;
  for (let at = text.indexOf("eyJ"); at >= 0; at = text.indexOf("eyJ", at + 1)) {
    if (runEnd <= at) {
      runEnd = at;
      while (runEnd < text.length && BASE64URL.test(text[runEnd] as string)) runEnd += 1;
    }
    cost += runEnd - at;
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
 * PATH_DEPTH. At most SECRET_FINDINGS places are named; one more finding counts the rest, and one more says when
 * SECRET_BUDGET code points were read and the rest was not.
 */
function secrets(value: unknown, root: string): Finding[] {
  const findings: Finding[] = [];
  const names = schemaNames();
  let more = 0;
  let budget = SECRET_BUDGET;
  let unread = false;
  const flag = (at: string, what: string) => {
    if (findings.length < SECRET_FINDINGS) findings.push({ code: "FAC-SEM-165", instancePath: at, message: `${what} is shaped like a credential: a token is named by its vault slot, never written (DEC-0150 CA-5)` });
    else more += 1;
  };
  const afford = (text: string): boolean => {
    const cost = detectorCost(head(text));
    if (cost > budget) {
      unread = true;
      return false;
    }
    budget -= cost;
    return true;
  };
  const tokenOf = (frame: Frame, key: string, index: boolean) => (index || plainName(key) ? placedToken(frame.name, frame.parent, key, index, names) : undefined);
  walk(value, root, tokenOf, (text, spot, place) => {
    if (unread || !afford(text)) return;
    if (spot.isName) {
      if (shaped(text)) flag(place(spot), "a member's name");
      return;
    }
    const role = spot.frame?.role;
    const key = spot.key;
    let found: boolean;
    if (role === "tickets" && key === "token_slot" && TOKEN_SLOT.test(text)) found = text.split("/").some((segment) => secretValue(segment));
    else if (((role === "evals" && key === "suite") || (role === "tickets" && key === "outbox")) && relativeRef(text)) found = secretArgument(text) || secretUrl(text);
    else if (role === "queue" && key === "recommendation" && OPAQUE_ID.test(text)) found = keyShaped(text);
    else found = shaped(text);
    if (found) flag(place(spot), "a value");
  });
  if (more > 0) findings.push({ code: "FAC-SEM-165", instancePath: root, message: `and ${more} more names or values shaped like a credential (DEC-0150 CA-5)` });
  if (unread) findings.push({ code: "FAC-SEM-165", instancePath: root, message: `the declaration holds more than ${SECRET_BUDGET} code points of names and values; the rest was not read for credentials (DEC-0150 CA-5)` });
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
function references(project: JsonObject, at: string): Finding[] {
  const findings: Finding[] = [];
  const flag = (path: string, message: string) => findings.push({ code: "FAC-SEM-163", instancePath: `${at}${path}`, message: `${message} (DEC-0150 CA-3)` });
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
function obligations(project: JsonObject, at: string): Finding[] {
  const findings: Finding[] = [];
  const flag = (path: string, message: string) => findings.push({ code: "FAC-SEM-164", instancePath: `${at}${path}`, message: `${message} (DEC-0150 CA-4)` });
  for (const [channel, i] of indexed(project.channels)) {
    const texts = channel.texts as JsonObject;
    if (channel.holding_reply === true && texts.holding === undefined) flag(`/channels/${i}/texts/holding`, "a channel that sends a holding reply declares the holding text");
    if (channel.replies_enabled === true && texts.final === undefined) flag(`/channels/${i}/texts/final`, "a channel that replies declares the final text");
    if (channel.kind === "store_review" && channel.clarifying_question === true) flag(`/channels/${i}/clarifying_question`, "a store review gets one public reply and no clarifying question");
    for (const which of ["holding", "final"] as const) {
      for (const [language, text] of Object.entries((texts[which] ?? {}) as Record<string, string>)) {
        // A plain language is written `*`, as FAC-SEM-162 and FAC-SEM-165 write it; one that is not plain, or is shaped
        // like a credential, is placed at its map: no place echoes the declaration's own words.
        const place = `/channels/${i}/texts/${which}${plainName(language) ? "/*" : ""}`;
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
  const findings = site === "manifest" ? misplaced(doc) : [];
  const view = channelAgentView(doc, site);
  if (!view.declared) return findings;
  const root = CHANNEL_AGENT_PATHS[site];
  findings.push(...secrets((extensionsAt(doc, site) as JsonObject)[KEY], root));
  if (!view.valid) {
    const named = view.errors.slice(0, MESSAGE_ERRORS).join(", ");
    const more = view.errors.length > MESSAGE_ERRORS ? ` and ${view.errors.length - MESSAGE_ERRORS} more` : "";
    findings.push({ code: "FAC-SEM-162", instancePath: root, message: `the channel-agent declaration fails its schema: ${named}${more}; a reader treats it as not declared and reports it (DEC-0150 CA-2). The grammars are in docs/specification/channel-agent.md#the-declaration; pnpm validate --schema service-channel-agent-extension.schema.json on the value alone lists the allowed values` });
    return findings;
  }
  const projects = new Set<unknown>();
  view.projects.forEach((project, i) => {
    const at = `${root}/projects/${i}`;
    if (projects.has(project.project)) findings.push({ code: "FAC-SEM-163", instancePath: `${at}/project`, message: "this project repeats an earlier entry's (DEC-0150 CA-3)" });
    projects.add(project.project);
    findings.push(...references(project, at), ...obligations(project, at));
  });
  return findings;
}
// #endregion channel-agent
