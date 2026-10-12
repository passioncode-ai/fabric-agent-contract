// #region relay-vectors — docs: docs/specification/relay.md#shared-vectors
/**
 * The runner of the relay family's shared vectors (`fixtures/vectors/relay.json`, `fixtures/vectors/secret-envelope.json`).
 * Every case is data: one complete context, the input, and exactly what the reference returns. This module turns the
 * data into the functional contexts the reference takes and returns `{group, name, actual, expected}` for every case,
 * with no test framework, so a port vendors it and runs the same cases the contract runs (DEC-0066).
 *
 * A key in a case is a JWK object or a string of base64 SEC 1 octets; a time is RFC 3339.
 */
import { admit, instant, verifyBlobRequest, verifyMessageBody, type AuthFrame } from "./relay.js";
import { openEnvelope, type OpenContext } from "./secret-envelope.js";
import type { P256Key } from "./p256.js";

export interface VectorResult { group: string; name: string; actual: unknown; expected: unknown }

type Json = Record<string, unknown>;
type KeyData = string | Json;
const cases = (group: unknown): Json[] => ((group as { cases?: Json[] } | undefined)?.cases ?? []);

/** A case's key: base64 SEC 1 octets as bytes, a JWK object as it is. */
export function vectorKey(key: KeyData): P256Key {
  return typeof key === "string" ? new Uint8Array(Buffer.from(key, "base64")) : (key as P256Key);
}
const keyring = (keys: unknown) => (kid: string): P256Key | undefined => {
  const map = (keys ?? {}) as Record<string, KeyData>;
  return Object.hasOwn(map, kid) ? vectorKey(map[kid] as KeyData) : undefined;
};
/** A refusal or a result as plain JSON, so a result with bytes compares by value. */
const plain = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

/** Every case of `relay.json`'s case groups, run through the reference. */
export function relayVectorResults(vectors: Json): VectorResult[] {
  const out: VectorResult[] = [];
  for (const c of cases(vectors.admit)) {
    const ctx = c.context as Json;
    const actual = admit(c.frame as AuthFrame, {
      relay: ctx.relay as string, nonce: ctx.nonce as string, nonceUsed: ctx.nonceUsed as boolean,
      admittedKey: keyring(ctx.admitted), now: new Date(ctx.now as string)
    });
    out.push({ group: "admit", name: c.name as string, actual, expected: c.expect });
  }
  for (const c of cases(vectors.messageBody)) {
    const frame = c.frame as { from: string; to: string; msgId: string };
    const actual = verifyMessageBody(c.body as string, frame, keyring(c.senders), new Date(c.now as string));
    out.push({ group: "messageBody", name: c.name as string, actual: plain(actual), expected: c.expect });
  }
  const blob = (vectors.blobRequest ?? {}) as Json;
  for (const c of cases(blob)) {
    const actual = verifyBlobRequest(c.header as string | null, {
      relay: blob.relay as string, method: c.method as "PUT" | "GET", digest: blob.digest as string, now: new Date(blob.now as string),
      admittedKey: keyring(c.admitted), ...(c.stored ? { stored: c.stored as { recipients: string[] } } : {})
    });
    out.push({ group: "blobRequest", name: c.name as string, actual, expected: c.expect });
  }
  return out;
}

/** Every case of `secret-envelope.json`'s `cases`, run through `openEnvelope`. A secret is compared as UTF-8 text. */
export function envelopeVectorResults(vectors: Json): VectorResult[] {
  return cases(vectors).map((c) => {
    const ctx = c.context as Json;
    const holders = (ctx.holders ?? []) as Array<{ sender: string; agentRef: string; slot: string }>;
    const placements = (ctx.placements ?? []) as Array<{ agentRef: string; slot: string; since: number }>;
    const applied = ctx.appliedRevision as number | null;
    const context: OpenContext = {
      ownKemKid: ctx.ownKemKid as string,
      ownKemPrivateKey: Buffer.from(ctx.ownKemPrivateKey as string, "hex"),
      senderKey: keyring(ctx.senders),
      mayHold: (sender, agentRef, slot) => holders.some((h) => h.sender === sender && h.agentRef === agentRef && h.slot === slot),
      currentPlacement: (agentRef, slot) => placements.find((p) => p.agentRef === agentRef && p.slot === slot)?.since,
      appliedRevision: () => (applied === null ? undefined : applied),
      now: new Date(ctx.now as string)
    };
    const result = openEnvelope(c.envelope, context);
    const actual = result.ok ? { ...result, secret: result.secret.toString("utf8") } : result;
    return { group: "envelope", name: c.name as string, actual, expected: c.expect };
  });
}

/** The `instant` of a value as the vectors write it: an ISO string with milliseconds, or null. */
export function instantResult(value: unknown): string | null {
  const t = instant(value);
  return t === undefined ? null : new Date(t).toISOString();
}
// #endregion relay-vectors
