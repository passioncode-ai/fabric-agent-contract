import { type Finding, type JsonObject, isObject } from "./findings.js";
import { negotiateRevision } from "./protocol-revisions.js";

// #region local-channel — docs: docs/specification/local-channel.md
/**
 * The local channel to the node (DEC-0075, CON-OE-10 in its v4 edition): JSON-RPC 2.0 over a Unix socket or named pipe
 * whose peer is the same OS user. A peer of another user is refused before anything is read; the first call is
 * `channel.hello`, which negotiates the protocol revision (DEC-0067); the base methods are `health`, `enroll.status` and
 * `consent.prompt`, and other methods belong to their owners' decisions. There is no `policy.decide`.
 */

export const LOCAL_CHANNEL_PROTOCOL = "fabric-local-channel/0.1";
export const BASE_METHODS: ReadonlySet<string> = new Set(["channel.hello", "health", "enroll.status", "consent.prompt"]);

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
export type ChannelAnswer = { ok: true; state: ChannelState } | { ok: false; code: "hello-first" | "schema-unsupported" | "invalid-params"; state: ChannelState };

/**
 * One request against the session: before `channel.hello` nothing else is answered (`hello-first`); a hello whose
 * protocols name no revision the node accepts is `schema-unsupported`; a hello without a protocols list is
 * `invalid-params`. Method dispatch after hello is the node's.
 */
export function channelStep(state: ChannelState, request: unknown): ChannelAnswer {
  const method = isObject(request) ? request.method : undefined;
  if (method !== "channel.hello") return state.hello ? { ok: true, state } : { ok: false, code: "hello-first", state };
  const params = isObject(request) && isObject(request.params) ? request.params : {};
  const offered = Array.isArray(params.protocols) ? params.protocols : undefined;
  if (!offered) return { ok: false, code: "invalid-params", state };
  const answers = offered.map((entry) => negotiateRevision(entry, state.accepted));
  if (!answers.some((answer) => "ok" in answer)) return { ok: false, code: "schema-unsupported", state };
  const capabilities = Array.isArray(params.capabilities) ? params.capabilities.filter((entry): entry is string => typeof entry === "string") : [];
  return { ok: true, state: { ...state, hello: true, capabilities } };
}

/** Whether the node may send `consent.prompt` on this session: only to a client that declared `consent.ui` in its hello. */
export function mayPrompt(state: ChannelState): boolean {
  return state.hello && (state.capabilities ?? []).includes("consent.ui");
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
