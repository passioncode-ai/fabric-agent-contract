import { type Finding, type JsonObject, isObject } from "./findings.js";
import { negotiateRevision } from "./protocol-revisions.js";

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
export type ChannelAnswer = { ok: true; state: ChannelState } | { ok: false; code: "hello-first" | "schema-unsupported" | "invalid-params" | "invalid-request"; state: ChannelState };

/**
 * One request against the session: before `channel.hello` nothing else is answered (`hello-first`); a hello whose
 * protocols name no revision the node accepts is `schema-unsupported`; a hello without a protocols list is
 * `invalid-params`. Method dispatch after hello is the node's.
 */
export function channelStep(state: ChannelState, request: unknown): ChannelAnswer {
  const method = isObject(request) ? request.method : undefined;
  if (method !== "channel.hello") return state.hello ? { ok: true, state } : { ok: false, code: "hello-first", state };
  // One hello per session: a second never changes what the first agreed.
  if (state.hello) return { ok: false, code: "invalid-request", state };
  const params = isObject(request) && isObject(request.params) ? request.params : {};
  const offered = Array.isArray(params.protocols) ? params.protocols : undefined;
  const client = isObject(params.client) ? params.client : undefined;
  const named = client !== undefined && typeof client.name === "string" && client.name.length > 0 && typeof client.version === "string" && client.version.length > 0;
  const capabilitiesOk = params.capabilities === undefined || (Array.isArray(params.capabilities) && params.capabilities.every((entry) => entry === "consent.ui"));
  if (!offered || !named || !capabilitiesOk) return { ok: false, code: "invalid-params", state };
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
 * A consent prompt's outcome (DEC-0075): the first `given` or `denied` answered before the deadline wins; no answer by
 * the deadline, or a deadline beyond 10 minutes from the prompt, is `denied`; a late answer is ignored. Times in ms.
 */
export function consentOutcome(promptedAt: number, deadline: number, answers: ReadonlyArray<{ at: number; state: string }>): "given" | "denied" {
  if (!Number.isFinite(promptedAt) || !Number.isFinite(deadline) || deadline - promptedAt > MAX_CONSENT_DEADLINE_MS) return "denied";
  const first = answers.filter((answer) => Number.isFinite(answer.at) && answer.at <= deadline && (answer.state === "given" || answer.state === "denied")).sort((a, b) => a.at - b.at)[0];
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
