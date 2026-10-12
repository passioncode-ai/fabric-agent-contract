import { type Finding, type JsonObject, isObject } from "./findings.js";
import { negotiateRevision, parseRevision } from "./protocol-revisions.js";

// #region local-channel — docs: docs/specification/local-channel.md
/**
 * The local channel to the node (DEC-0075, CON-OE-10 in its v4 edition): JSON-RPC 2.0 over a Unix socket or named pipe
 * whose peer is the same OS user. A peer of another user is refused before anything is read; the first call is
 * `channel.hello`, which negotiates the protocol revision (DEC-0067). The node serves `health` and `enroll.status`; it
 * calls `consent.prompt` on a client that declared `consent.ui`; other methods belong to their owners' decisions. There
 * is no `policy.decide`.
 */

export const LOCAL_CHANNEL_PROTOCOL = "fabric-local-channel/0.1";
/** Methods a client calls on the node. */
export const NODE_METHODS: ReadonlySet<string> = new Set(["channel.hello", "health", "enroll.status"]);
/** Methods the node calls on a client, each needing the capability named. */
export const CLIENT_METHODS: ReadonlyMap<string, string> = new Map([["consent.prompt", "consent.ui"]]);
/** JSON-RPC error codes for the contract's codes (DEC-0075). */
export const ERROR_CODES: ReadonlyMap<string, number> = new Map([
  ["invalid-request", -32600],
  ["unknown-method", -32601],
  ["invalid-params", -32602],
  ["unauthenticated", -32001],
  ["forbidden", -32003],
  ["schema-unsupported", -32004],
  ["hello-first", -32005],
]);
/** The longest a consent prompt may wait for an answer. */
export const MAX_CONSENT_DEADLINE_MS = 10 * 60 * 1000;

export type PeerVerdict = { ok: true } | { ok: false; code: "unauthenticated" };

/** Whether the node admits a peer: the same OS user (POSIX uid from SO_PEERCRED or getpeereid; a Windows SID), nothing else. */
export function admitPeer(peer: unknown, own: unknown): PeerVerdict {
  const same = (typeof peer === "number" && Number.isSafeInteger(peer) && peer === own) || (typeof peer === "string" && peer.length > 0 && peer === own);
  return same ? { ok: true } : { ok: false, code: "unauthenticated" };
}

export type ChannelState = { hello: boolean; accepted: readonly string[]; capabilities?: readonly string[] };

/** Limits of a session (DEC-0075): hello within 5 s, one line at most 1 MiB. */
export const HELLO_DEADLINE_MS = 5000;
export const MAX_LINE_BYTES = 1024 * 1024;
export type ChannelAnswer =
  | { ok: true; state: ChannelState }
  | { ok: false; code: "hello-first" | "schema-unsupported" | "invalid-params" | "invalid-request" | "unknown-method"; state: ChannelState }
  | { ok: false; code: null; state: ChannelState };

const CLIENT_NAME = /^[a-z][a-z0-9-]{0,63}$/;
/** Length as JSON Schema counts it: code points, not UTF-16 units. */
const isText = (value: unknown, max: number, min = 1) => typeof value === "string" && [...value].length >= min && [...value].length <= max;

/** Whether `channel.hello` params are what `local-channel.schema.json#/$defs/hello` accepts. */
function helloParamsValid(params: Record<string, unknown>): boolean {
  const allowed = new Set(["protocols", "client", "capabilities", "token"]);
  if (Object.keys(params).some((key) => !allowed.has(key))) return false;
  const { protocols, client, capabilities, token } = params;
  if (!Array.isArray(protocols) || protocols.length === 0 || protocols.length > 64 || !protocols.every((entry) => parseRevision(entry) !== undefined) || new Set(protocols).size !== protocols.length) return false;
  if (!isObject(client) || Object.keys(client).some((key) => key !== "name" && key !== "version") || typeof client.name !== "string" || !CLIENT_NAME.test(client.name) || !isText(client.version, 64)) return false;
  if (capabilities !== undefined && (!Array.isArray(capabilities) || capabilities.length > 16 || !capabilities.every((entry) => entry === "consent.ui") || new Set(capabilities).size !== capabilities.length)) return false;
  if (token !== undefined && !isText(token, 512, 16)) return false;
  return true;
}

/** Whether a received line is within the session's limit; a longer one is `invalid-request` and the node closes. */
export function lineWithinLimit(line: string): boolean {
  return Buffer.byteLength(line, "utf8") <= MAX_LINE_BYTES;
}

const REQUEST_MEMBERS: ReadonlySet<string> = new Set(["jsonrpc", "id", "method", "params"]);
const METHOD_NAME = /^[a-z][a-z0-9_]{0,31}(\.[a-z][a-z0-9_]{0,31}){0,4}$/;

/**
 * Whether a message has the envelope `local-channel.schema.json#/$defs/request` accepts: an object (not an array) with
 * `jsonrpc: "2.0"`, a method name, an `id` that is a 1–128 code-point string or an integer (as JSON Schema counts one:
 * `1.0` is), params an object when present, and no other member. Without an `id` the same envelope is a notification,
 * whatever its method — wider than `$defs/notification`, because a notification is never answered (JSON-RPC 2.0 §4.1).
 */
function envelopeValid(request: unknown): request is JsonObject {
  if (!isObject(request)) return false;
  if (Object.keys(request).some((key) => !REQUEST_MEMBERS.has(key))) return false;
  if (request.jsonrpc !== "2.0" || typeof request.method !== "string" || !METHOD_NAME.test(request.method)) return false;
  if (request.params !== undefined && !isObject(request.params)) return false;
  return request.id === undefined || isText(request.id, 128) || Number.isInteger(request.id);
}

/**
 * One request against the session: a message whose envelope the schema refuses is `invalid-request` (JSON-RPC 2.0 §5,
 * answered with `id: null` when its id cannot be read); a well-formed notification (no `id`) is never answered; before
 * `channel.hello` nothing else is answered (`hello-first`); a hello whose protocols name no revision the node accepts is
 * `schema-unsupported`; a hello without valid params is `invalid-params`. Method dispatch after hello is the node's.
 */
export function channelStep(state: ChannelState, request: unknown): ChannelAnswer {
  if (!envelopeValid(request)) return { ok: false, code: "invalid-request", state };
  // A notification (no id) is never answered, whatever its method.
  if (request.id === undefined) return { ok: false, code: null, state };
  const method = request.method as string;
  if (CLIENT_METHODS.has(method)) return { ok: false, code: state.hello ? "unknown-method" : "hello-first", state };
  if (method !== "channel.hello") return state.hello ? { ok: true, state } : { ok: false, code: "hello-first", state };
  // One hello per session: a second never changes what the first agreed.
  if (state.hello) return { ok: false, code: "invalid-request", state };
  const params = isObject(request.params) ? request.params : {};
  if (!helloParamsValid(params)) return { ok: false, code: "invalid-params", state };
  const offered = params.protocols as unknown[];
  const answers = offered.map((entry) => negotiateRevision(entry, state.accepted));
  if (!answers.some((answer) => "ok" in answer)) return { ok: false, code: "schema-unsupported", state };
  const capabilities = Array.isArray(params.capabilities) ? (params.capabilities as string[]) : [];
  return { ok: true, state: { ...state, hello: true, capabilities } };
}

/** Whether the node may send `consent.prompt` on this session: only to a client that declared `consent.ui` in its hello. */
export function mayPrompt(state: ChannelState): boolean {
  return state.hello && (state.capabilities ?? []).includes("consent.ui");
}

/**
 * A consent prompt's outcome (DEC-0075): the first `given` or `denied` the node received between the prompt and the
 * deadline wins; no answer by then, a deadline not after the prompt or more than 10 minutes after it is `denied`; a late
 * answer is ignored. `at` here is the node's receipt time, never the client's own `consentResult.at`, so a client cannot
 * backdate an answer. Times in ms.
 */
export function consentOutcome(promptedAt: number, deadline: number, answers: ReadonlyArray<{ at: number; state: string }>): "given" | "denied" {
  if (!Number.isFinite(promptedAt) || !Number.isFinite(deadline) || deadline <= promptedAt || deadline - promptedAt > MAX_CONSENT_DEADLINE_MS) return "denied";
  const first = answers.filter((answer) => Number.isFinite(answer.at) && answer.at >= promptedAt && answer.at <= deadline && (answer.state === "given" || answer.state === "denied")).sort((a, b) => a.at - b.at)[0];
  return first?.state === "given" ? "given" : "denied";
}

/** FAC-SEM-106 (kind `local-channel-session`, `{requests}`): the first request is `channel.hello`, and no other method precedes it. */
export function sessionFindings(value: JsonObject): Finding[] {
  const requests = Array.isArray(value.requests) ? value.requests : [];
  const first = requests.findIndex((request) => isObject(request) && typeof request.method === "string");
  if (first === -1) return [];
  const request = requests[first] as JsonObject;
  return request.method === "channel.hello" ? [] : [{ code: "FAC-SEM-106", instancePath: `/requests/${first}/method`, message: "the first call on the local channel is channel.hello" }];
}

export function localChannelRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "local-channel-session" ? sessionFindings(value) : undefined;
}
// #endregion local-channel
