import type { ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";
import { secretArgument } from "./secret-shape.js";
import { createValidatorSync } from "./validator.js";

// extensions/instance-facts/0.1 (DEC-0173): who an instance serves, how it keeps data apart and the space it runs in,
// declared by the service and never verified. Whose instance it is stays the estate placement's context (DEC-0082).
// docs: docs/specification/service.md#instance-facts

// #region instance-facts
export type Audience = "operator" | "organization" | "public";
export type Entry = "host-signin" | "own-signin" | "none";
export type TenancyMode = "single" | "per-organization" | "shared";
export type SpaceKind = "user" | "container" | "vm" | "system";
/** The five facts a host reads, each one on its own (IF-5); an absent one is not declared. */
export interface InstanceFacts { audience?: Audience; entry?: Entry; mode?: TenancyMode; kind?: SpaceKind; account?: string }
export type FactsDocument = "descriptor" | "wellKnown";
export type FactField = keyof InstanceFacts;
/** A declared value a clause of IF-6 refuses: never read; the field is read from the other document, the other fields stand. */
export interface RefusedFact { document: FactsDocument; field: FactField; reason: string }
export interface InstanceFactsView {
  /** At least one fact is read; a dashboard's login alone never makes one (IF-5). */
  declared: boolean;
  facts: InstanceFacts;
  refused: RefusedFact[];
  /** A document whose extension value fails the schema: none of its facts is read (as ED-9 reads a dashboard extension). */
  invalid: FactsDocument[];
}

const FIELDS: ReadonlyArray<[FactField, "access" | "tenancy" | "space", string]> = [
  ["audience", "access", "audience"],
  ["entry", "access", "entry"],
  ["mode", "tenancy", "mode"],
  ["kind", "space", "kind"],
  ["account", "space", "account"]
];

let instanceFactsShape: ValidateFunction | undefined;
function shape(): ValidateFunction {
  instanceFactsShape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-instance-facts-extension.schema.json`) as ValidateFunction;
  return instanceFactsShape;
}

/** A document's extension value: absent, invalid against the schema, or its declared fields. */
function declaredIn(document: unknown): { present: boolean; valid: boolean; values: Partial<Record<FactField, unknown>> } {
  const extensions = isObject(document) && isObject(document.extensions) ? document.extensions : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.instanceFacts)) return { present: false, valid: true, values: {} };
  const value = extensions[EXTENSION_KEYS.instanceFacts];
  if (shape()(value) !== true) return { present: true, valid: false, values: {} };
  const values: Partial<Record<FactField, unknown>> = {};
  for (const [field, member, name] of FIELDS) {
    const object = (value as JsonObject)[member];
    if (isObject(object) && Object.hasOwn(object, name)) values[field] = object[name];
  }
  return { present: true, valid: true, values };
}

/** What the descriptor says of the instance's reach, as the clauses read it; unknown when no descriptor is given. */
interface Setting { peer?: boolean; local?: boolean; subscription?: boolean; login?: boolean }
function settingOf(descriptor: unknown, wellKnown: unknown): Setting {
  const setting: Setting = {};
  if (isObject(descriptor)) {
    setting.peer = isObject(descriptor.peer);
    // The descriptor's own default: an absent placement is local (DEC-0019).
    setting.local = descriptor.placement !== "remote";
    setting.subscription = isObject(descriptor.runner) && descriptor.runner.credentialKind === "subscription";
  }
  if (isObject(wellKnown) && isObject(wellKnown.surfaces) && isObject(wellKnown.surfaces.dashboard) && typeof wellKnown.surfaces.dashboard.login === "boolean") {
    setting.login = wellKnown.surfaces.dashboard.login;
  }
  return setting;
}

/** The reason a clause of IF-6 refuses a declared value in a document, or undefined when it stands. */
function refusal(field: FactField, value: unknown, document: FactsDocument, setting: Setting): string | undefined {
  if (field === "audience") {
    if (value === "operator" && setting.peer === true) return "operator beside peer: a service offered to others serves more than its operator";
    if (value === "organization" && setting.peer === false && setting.local === true) return "organization on a local placement needs peer: a host routes others only to a service that declares it (DEC-0061)";
    if (value === "public" && setting.local === true) return "public is a remote placement's: a local origin is reached by no one outside the computer";
    if (value === "public" && setting.subscription === true) return "public beside a subscription runner: a service others reach never runs on the operator's subscription (DEC-0046, DEC-0061 item 3)";
  }
  if (field === "entry" && setting.login !== undefined && (value === "host-signin") !== setting.login) {
    return setting.login ? "the dashboard requires a host's login code (surfaces.dashboard.login)" : "the dashboard takes no host's login code (surfaces.dashboard.login is false)";
  }
  if (field === "mode" && value === "shared" && setting.local === true) return "shared is a remote service's: a local placement names one context and at most one grant (DEC-0082 item 4)";
  if (field === "kind" && value === "system" && setting.local === true) return "system is a remote placement's: a local service runs under a counted OS account (DEC-0154)";
  if (field === "account") {
    if (typeof value === "string" && secretArgument(value)) return "the label is shaped like a credential; it names a space, never a credential";
    if (document === "wellKnown" && setting.local === true) return "a local service's well-known document is read by every counted OS account on the computer; the label stays in its descriptor (IF-5)";
  }
  return undefined;
}

/**
 * The reference reading of an instance's facts (DEC-0173 IF-5): each field from the well-known document where it
 * declares a value no clause refuses, else from the descriptor's; a refused value is reported and never read, and `entry`
 * reads `host-signin` whenever the well-known document's dashboard requires a host's login code and either document
 * declares a fact (refused or not), whatever is declared for `entry`; a service that declares none reads none. Either
 * document may be absent. It never throws.
 * Ports run `fixtures/vectors/instance-facts.json`.
 */
export function instanceFacts(descriptor: unknown, wellKnown: unknown): InstanceFactsView {
  const setting = settingOf(descriptor, wellKnown);
  const sources: Array<[FactsDocument, ReturnType<typeof declaredIn>]> = [["wellKnown", declaredIn(wellKnown)], ["descriptor", declaredIn(descriptor)]];
  const view: InstanceFactsView = { declared: false, facts: {}, refused: [], invalid: sources.filter(([, read]) => !read.valid).map(([document]) => document) };
  // A dashboard's login names the entry only for a service that declares instance facts: one that declares none shows none.
  const declaresAny = sources.some(([, read]) => Object.keys(read.values).length > 0);
  for (const [field] of FIELDS) {
    let decided = false;
    for (const [document, read] of sources) {
      if (!Object.hasOwn(read.values, field)) continue;
      const value = read.values[field];
      const reason = refusal(field, value, document, setting);
      if (reason !== undefined) { view.refused.push({ document, field, reason }); continue; }
      if (!decided) (view.facts as Record<string, unknown>)[field] = value;
      decided = true;
    }
  }
  if (setting.login === true && declaresAny) view.facts.entry = "host-signin";
  view.declared = Object.keys(view.facts).length > 0;
  return view;
}

const pointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");
const MEMBER_OF: Readonly<Record<FactField, string>> = { audience: "access/audience", entry: "access/entry", mode: "tenancy/mode", kind: "space/kind", account: "space/account" };

/**
 * FAC-SEM-180 (DEC-0173 IF-6). Kind `service-descriptor`: the descriptor's schema, its own facts against its peer,
 * placement and runner, and its label's shape. Kind `service-well-known`: a value that fails the schema, `entry` against the same
 * document's dashboard, and its label's shape. Kind `service-observation` (`{descriptor, wellKnown}`, the identity
 * pair): only what neither document alone shows (a well-known value against the descriptor, a descriptor's `entry`
 * against the dashboard), so each problem is reported once.
 * A finding never changes the service's state; the fact it names reads not declared.
 */
export function instanceFactsRules(kind: string, value: JsonObject): Finding[] {
  const at = (document: FactsDocument | undefined, field?: FactField) =>
    `${document === undefined ? "" : `/${document}`}/extensions/${pointerToken(EXTENSION_KEYS.instanceFacts)}${field === undefined ? "" : `/${MEMBER_OF[field]}`}`;
  let view: InstanceFactsView;
  let prefix: (document: FactsDocument) => FactsDocument | undefined;
  if (kind === "service-descriptor") { view = instanceFacts(value, undefined); prefix = () => undefined; }
  else if (kind === "service-well-known") { view = instanceFacts(undefined, value); prefix = () => undefined; }
  else if (kind === "service-observation") {
    // The pair reports only what neither document read alone shows, so `pnpm validate` prints each problem once.
    const pair = instanceFacts(value.descriptor, value.wellKnown);
    const alone = [...instanceFacts(value.descriptor, undefined).refused, ...instanceFacts(undefined, value.wellKnown).refused];
    const seen = (refused: RefusedFact) => alone.some((other) => other.document === refused.document && other.field === refused.field);
    view = { ...pair, invalid: [], refused: pair.refused.filter((refused) => !seen(refused)) };
    prefix = (document) => document;
  }
  else return [];
  return [
    ...view.invalid.map((document) => ({ code: "FAC-SEM-180", instancePath: at(prefix(document)), message: "the instance facts fail their schema; a host reads none of them from this document (DEC-0173)" })),
    ...view.refused.map((refused) => ({ code: "FAC-SEM-180", instancePath: at(prefix(refused.document), refused.field), message: `${refused.reason}; a host reads this fact as not declared (DEC-0173 IF-6)` }))
  ];
}
// #endregion instance-facts
