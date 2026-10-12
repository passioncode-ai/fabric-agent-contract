import { type Finding, type JsonObject, isObject } from "./findings.js";
import { secretArgument } from "./secret-shape.js";

// #region service-peer — docs: docs/specification/service.md#offered-to-others
/**
 * A service offered to others (DEC-0061): the descriptor's `peer` says where others reach it, who controls the machine
 * or account it runs on, where it runs, and the most sensitive data class it may receive; `runner` says how its model
 * calls are signed in, as a kind and never a credential; `installedBy` says who installed it, by role and never by name.
 */

/**
 * The organization edition's data classes, least sensitive first (v4 V2-19; device policy's `dataClasses`, DEC-0053).
 * The contract's own `dataClass` vocabulary (`project-internal`, `personal`, …) is another list and is not admitted
 * here: a host maps its request into these four before it asks.
 */
export const PEER_DATA_CLASSES: readonly string[] = ["public", "internal", "confidential", "restricted"];
/** The kind of a runner's sign-in (DEC-0061): never a credential's value. */
export const CREDENTIAL_KINDS: readonly string[] = ["subscription", "key", "platform-metered", "none"];
/** A subscription is a vendor's login and runs only in that vendor's runner (DEC-0046, the runner profile's rule): runner kind → login. */
export const SUBSCRIPTION_RUNNERS: ReadonlyMap<string, string> = new Map([
  ["claude-code", "claude"],
  ["kimi-code", "kimi"],
  ["codex", "chatgpt"]
]);
/**
 * Names that never reach the open internet (DEC-0019). A remote origin (DEC-0019) or a peer endpoint
 * (`FAC-SEM-085`) on one of them is a local service wearing a public address.
 */
export const RESERVED_HOST = /(^|\.)(localhost|local|internal|home\.arpa|lan|localdomain)$/;

const RANK: ReadonlyMap<string, number> = new Map(PEER_DATA_CLASSES.map((name, index) => [name, index]));
const RUNNER_KIND = /^[a-z][a-z0-9-]{1,62}$/;

/** Why a host does not send a request of `dataClass` to the service `descriptor` describes, or `null` when it may. */
export type PeerRefusal = "not-offered" | "peer-invalid" | "data-class-unknown" | "above-max-data-class";

/**
 * The host's check before it routes a request from anyone but the service's own operator (DEC-0061, `FAC-SEM-088`):
 *
 * - `not-offered`: the descriptor declares no `peer` — the service is its operator's only;
 * - `peer-invalid`: `peer.maxDataClass` is not one of the four classes, so nothing is compared;
 * - `data-class-unknown`: the request's class is not one of the four, exactly as written (`Confidential`,
 *   `project-internal`, `personal` and `2` are unknown), so nothing is compared;
 * - `above-max-data-class`: the request's class ranks above the peer's maximum.
 *
 * Equal classes pass. Residency is shown, not compared here (DEC-0061, *Not decided*).
 */
export function peerRefusal(descriptor: unknown, dataClass: unknown): PeerRefusal | null {
  if (!isObject(descriptor) || !isObject(descriptor.peer)) return "not-offered";
  const max = typeof descriptor.peer.maxDataClass === "string" ? RANK.get(descriptor.peer.maxDataClass) : undefined;
  if (max === undefined) return "peer-invalid";
  const asked = typeof dataClass === "string" ? RANK.get(dataClass) : undefined;
  if (asked === undefined) return "data-class-unknown";
  return asked > max ? "above-max-data-class" : null;
}

/** A JSON Pointer token (RFC 6901 §4): `~` and `/` escaped. */
const pointer = (name: string) => name.replace(/~/g, "~0").replace(/\//g, "~1");

/** FAC-SEM-085: a peer is reached at a public DNS name. The schema holds the shape (https, no IP literal, no query). */
function peerEndpoint(value: JsonObject): Finding[] {
  if (!isObject(value.peer) || typeof value.peer.endpoint !== "string") return [];
  let host = "";
  try {
    host = new URL(value.peer.endpoint).hostname;
  } catch {
    return [];
  }
  if (!RESERVED_HOST.test(host)) return [];
  return [{ code: "FAC-SEM-085", instancePath: "/peer/endpoint", message: `a service offered to others cannot be reached at the reserved name ${host}` }];
}

/**
 * FAC-SEM-086: `runner` and `installedBy` name a kind, a role and an installer — never a credential. The shared detector
 * (`secretArgument`, DEC-0044) reads each string member; a finding names the place and never the value.
 */
function credentialValues(value: JsonObject): Finding[] {
  const places: Array<[string, unknown]> = [];
  if (isObject(value.runner)) for (const [name, member] of Object.entries(value.runner)) places.push([`/runner/${pointer(name)}`, member]);
  if (typeof value.installedBy === "string") places.push(["/installedBy", value.installedBy]);
  else if (isObject(value.installedBy)) for (const [name, member] of Object.entries(value.installedBy)) places.push([`/installedBy/${pointer(name)}`, member]);
  return places
    .filter(([, member]) => typeof member === "string" && secretArgument(member))
    .map(([at]) => ({ code: "FAC-SEM-086", instancePath: at, message: `${at} holds a value shaped like a credential; it names a kind, a role or an installer, never a credential` }));
}

/** The descriptor's own rules of DEC-0061: `FAC-SEM-085` and `FAC-SEM-086`. */
export function descriptorPeerRules(value: JsonObject): Finding[] {
  return [...peerEndpoint(value), ...credentialValues(value)];
}

const shownKind = (kind: unknown): string => (typeof kind === "string" && CREDENTIAL_KINDS.includes(kind) ? kind : "an unreadable kind");

/**
 * FAC-SEM-087 (`service-runner`): what a node placing a service checks of its `runner` — `{descriptor, catalogue,
 * derived?, usage?}`, where `catalogue` is the node's runner catalogue (`runners.schema.json`), `derived` the credential
 * kind the node derived from where the slot's credential came from (v4 §8) and `usage` the service's usage report. The
 * runner kind is a catalogue entry; a subscription runs only in its vendor's runner; the declared kind is one of the four
 * and equals the derived one; and a service offered to others never runs on a subscription — declared, derived, or as a
 * row of its usage report.
 */
function runnerCheck(value: JsonObject): Finding[] {
  const descriptor = isObject(value.descriptor) ? value.descriptor : {};
  const runner = isObject(descriptor.runner) ? descriptor.runner : {};
  const findings: Finding[] = [];
  const add = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-087", instancePath, message });
  const catalogue = new Set(
    (Array.isArray(value.catalogue) ? value.catalogue : [])
      .filter(isObject)
      .map((entry) => entry.kind)
      .filter((kind): kind is string => typeof kind === "string")
  );
  const kind = runner.kind;
  if (kind !== undefined) {
    if (typeof kind !== "string" || !RUNNER_KIND.test(kind)) add("/descriptor/runner/kind", "the runner kind is not a runner kind's name");
    // The value is never echoed: a provider key can match the kind pattern (lower case, digits, dashes), and FAC-SEM-086
    // names only the place of a credential-shaped value.
    else if (!catalogue.has(kind)) add("/descriptor/runner/kind", "the runner kind is not in the runner catalogue");
  }
  const declared = runner.credentialKind;
  if (typeof declared !== "string" || !CREDENTIAL_KINDS.includes(declared)) {
    add("/descriptor/runner/credentialKind", "the descriptor declares no credential kind it may: subscription, key, platform-metered or none");
  } else if (declared === "subscription" && !(typeof kind === "string" && SUBSCRIPTION_RUNNERS.has(kind))) {
    add("/descriptor/runner/kind", "a subscription runs only in its vendor's runner: claude-code, kimi-code or codex");
  }
  const offered = isObject(descriptor.peer);
  if (offered && declared === "subscription") add("/descriptor/runner/credentialKind", "a service offered to others never runs on a subscription");
  if (value.derived !== undefined) {
    const derived = value.derived;
    if (typeof derived !== "string" || !CREDENTIAL_KINDS.includes(derived)) add("/derived", "the derived credential kind is not one of subscription, key, platform-metered or none");
    else if (derived !== declared) add("/derived", `the node derived ${derived}; the descriptor declares ${shownKind(declared)}`);
    else if (offered && derived === "subscription") add("/derived", "a service offered to others never runs on a subscription");
  }
  if (offered && isObject(value.usage) && Array.isArray(value.usage.days)) {
    value.usage.days.forEach((day, at) => {
      if (!isObject(day) || !Array.isArray(day.byModel)) return;
      day.byModel.forEach((row, index) => {
        if (isObject(row) && row.route === "subscription") add(`/usage/days/${at}/byModel/${index}/route`, "a service offered to others reports no call on the subscription route");
      });
    });
  }
  return findings;
}

/**
 * FAC-SEM-088 (`service-peer-request`): `{descriptor, dataClass, sent}` — a host sent a request to a service only when
 * `peerRefusal` allows it.
 */
function peerRequest(value: JsonObject): Finding[] {
  if (typeof value.sent !== "boolean") return [{ code: "FAC-SEM-088", instancePath: "/sent", message: "the record does not say whether the host sent the request" }];
  const refusal = peerRefusal(value.descriptor, value.dataClass);
  if (!value.sent || refusal === null) return [];
  return [{ code: "FAC-SEM-088", instancePath: "/sent", message: `the host sent a request the service refuses: ${refusal}` }];
}

/** The bundle kinds of DEC-0061, or `undefined` for any other kind. */
export function descriptorBundleRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "service-runner") return runnerCheck(value);
  if (kind === "service-peer-request") return peerRequest(value);
  return undefined;
}
// #endregion service-peer
