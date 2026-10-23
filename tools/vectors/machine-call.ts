/**
 * The generator of the machine-call vectors (DEC-0106): `fixtures/vectors/machine-call.json`, shared by every node that
 * takes a call from another machine of its estate over the relay, and every node that sends one.
 *
 *   tsx tools/vectors/machine-call.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/machine-call.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/machine-call.test.ts` runs the check.
 * Each expected answer is written below by hand from DEC-0106's items. The sealed calls are computed: HPKE base mode
 * (`hpkeSealBase`, itself checked against RFC 9180 §A.3.1 by `secret-envelope.json`) with an ephemeral scalar derived
 * from a published label, and the additional data written out here from the decision, so a port reproduces each byte.
 * Nothing here imports `src/machine-call.ts`, so the gate checks that the reference returns what this file expects.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";
import { hpkeSealBase } from "../../src/secret-envelope.js";
import { testKey, type TestKey } from "./relay-crypto.js";

type Json = Record<string, unknown>;
export const VECTOR_FILE = "fixtures/vectors/machine-call.json";

const TYPE = "fabric-agent-call/1";
const LABEL = "fabric-agent-contract/vectors/machine-call/";
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();
const scalar = (key: TestKey) => Buffer.from(key.d.toString(16).padStart(64, "0"), "hex").toString("base64");
const ref = (kid: string, key: TestKey) => `${kid}@sha256:${sha256(Buffer.from(key.octets, "base64")).toString("hex")}`;

const K = {
  aSig: testKey("machine-call m-a sig"), aKem: testKey("machine-call m-a kem"),
  bSig: testKey("machine-call m-b sig"), bKem: testKey("machine-call m-b kem"),
  cSig: testKey("machine-call m-c sig"), cKem: testKey("machine-call m-c kem"),
  dSig: testKey("machine-call m-d sig"), eSig: testKey("machine-call m-e sig"),
  fSig: testKey("machine-call m-f sig"), gSig: testKey("machine-call m-g sig"), gKem: testKey("machine-call m-g kem")
};
// A 65-byte uncompressed encoding whose last byte is changed: no point of the curve (as relay.json's m-bad).
const offCurve = (key: TestKey) => {
  const octets = Buffer.from(key.octets, "base64");
  octets[64] = (octets[64] ?? 0) ^ 0x01;
  return octets.toString("base64");
};
const sig = (id: string, key: TestKey) => ({ kid: `${id}#sig`, use: "sig", alg: "es256", publicKey: key.octets });
const kem = (id: string, key: TestKey | string) => ({ kid: `${id}#kem`, use: "kem", alg: "ecdh-p256", publicKey: typeof key === "string" ? key : key.octets });

const AT = "2026-10-13T00:00:00Z";
const REVOKED_AT = "2026-10-12T10:00:00Z";
const record = (): Json => ({
  schema: "estate-record/1",
  estate: "urn:fabric:estate:example",
  revision: 4,
  issuedAt: "2026-10-12T09:00:00Z",
  validUntil: "2026-11-11T09:00:00Z",
  machines: [
    { id: "m-a", deviceKeys: [sig("m-a", K.aSig), kem("m-a", K.aKem)] },
    { id: "m-b", profile: "view", deviceKeys: [sig("m-b", K.bSig), kem("m-b", K.bKem)] },
    { id: "m-c", profile: "member", deviceKeys: [sig("m-c", K.cSig), kem("m-c", K.cKem)] },
    { id: "m-d", profile: "member", deviceKeys: [sig("m-d", K.dSig)] },
    { id: "m-e", profile: "owner", deviceKeys: [sig("m-e", K.eSig)] },
    { id: "m-f", deviceKeys: [sig("m-f", K.fSig), kem("m-f", offCurve(K.fSig))] },
    { id: "m-g", profile: "full", deviceKeys: [sig("m-g", K.gSig), kem("m-g", K.gKem)] }
  ],
  revocations: [{ kind: "device-key", ref: "m-c#kem", revokedAt: REVOKED_AT }]
});

/** A case that names no record of its own reads the file's `record`. */
const SHARED = Symbol("the shared record");

// ---- profile: machineProfile(record, machineId) -------------------------------------------------------------------

function profileCases(): Json[] {
  const twice = { ...record(), machines: [...(record().machines as Json[]), { id: "m-a", deviceKeys: [sig("m-a", K.gSig)] }] };
  const cases: Array<[string, unknown, unknown, unknown]> = [
    ["a machine with no profile is full", SHARED, "m-a", "full"],
    ["a view machine", SHARED, "m-b", "view"],
    ["a member machine", SHARED, "m-c", "member"],
    ["full written out", SHARED, "m-g", "full"],
    ["an unknown value reads as none", SHARED, "m-e", null],
    ["a machine the record does not list", SHARED, "m-z", null],
    ["a machine listed twice reads as none", twice, "m-a", null],
    ["no record", null, "m-a", null],
    ["no machine id", SHARED, 7, null]
  ];
  return cases.map(([name, rec, machineId, expect]) => (rec === SHARED ? { name, machineId, expect } : { name, record: rec, machineId, expect }));
}

// ---- caller: relayCallerTier({applied, self, from, at, freshness, revocations?}) ----------------------------------

function callerCases(): Json[] {
  const base = { self: "m-a", at: AT, freshness: "current" };
  const t1 = (machine: string, profile: unknown, kemKid?: string): Json => ({ ok: true, tier: "T1", machine, profile, ...(kemKid ? { kem: kemKid } : {}) });
  const unknown = (detail: string): Json => ({ ok: false, code: "unknown-state", detail });
  const notT1: Json = { ok: false, code: "unauthenticated", detail: "not-t1" };
  const cases: Array<[string, Json, Json]> = [
    ["a full machine with its #kem", { from: "m-a#sig" }, t1("m-a", "full", "m-a#kem")],
    ["a view machine with its #kem", { from: "m-b#sig" }, t1("m-b", "view", "m-b#kem")],
    ["a member machine whose #kem the record revokes: no kem", { from: "m-c#sig" }, t1("m-c", "member")],
    ["a machine with no #kem", { from: "m-d#sig" }, t1("m-d", "member")],
    ["an unreadable profile reads as null, the sender still T1", { from: "m-e#sig" }, t1("m-e", null)],
    ["a #kem that is no point of the curve: no kem", { from: "m-f#sig" }, t1("m-f", "full")],
    ["full written out", { from: "m-g#sig" }, t1("m-g", "full", "m-g#kem")],
    ["a #kem kid listed twice names no kem", { from: "m-a#sig", applied: twiceKem() }, t1("m-a", "full")],
    ["a #kem not in canonical base64 names no kem", { from: "m-a#sig", applied: looseKem() }, t1("m-a", "full")],
    ["a #kem a delta revokes by its key reference: no kem", { from: "m-g#sig", revocations: [{ kind: "device-key", ref: ref("m-g#kem", K.gKem), revokedAt: REVOKED_AT }] }, t1("m-g", "full")],
    ["a #sig a delta revokes: not T1", { from: "m-d#sig", revocations: [{ kind: "device-key", ref: "m-d#sig", revokedAt: REVOKED_AT }] }, notT1],
    ["a machine a delta revokes: not T1", { from: "m-b#sig", revocations: [{ kind: "machine", ref: "m-b", revokedAt: REVOKED_AT }] }, notT1],
    ["a kid the record does not list: not T1", { from: "m-z#sig" }, notT1],
    ["a #kem kid is no sender: not T1", { from: "m-a#kem" }, notT1],
    ["no sender", { from: 7 }, notT1],
    ["a delta that is not current", { from: "m-b#sig", freshness: "stale" }, unknown("not-current")],
    ["no freshness", { from: "m-b#sig", freshness: undefined }, unknown("not-current")],
    ["a clock that does not read", { from: "m-b#sig", at: "2026-10-13 00:00:00" }, unknown("no-clock")],
    ["the record's window ended", { from: "m-b#sig", at: "2026-11-12T00:00:00Z" }, unknown("no-estate")],
    ["no record applied", { from: "m-b#sig", applied: null }, unknown("no-estate")],
    ["the node's own #sig is not admitted", { from: "m-b#sig", self: "m-z" }, unknown("self-not-admitted")],
    ["the node's own #sig revoked by a delta", { from: "m-b#sig", revocations: [{ kind: "device-key", ref: "m-a#sig", revokedAt: REVOKED_AT }] }, unknown("self-not-admitted")]
  ];
  return cases.map(([name, over, expect]) => {
    const input: Json = { ...base, ...over };
    for (const key of Object.keys(input)) if (input[key] === undefined) delete input[key];
    return { name, input, expect };
  });
}

/** The shared record with `m-a`'s `#kem` listed a second time, under another key. */
function twiceKem(): Json {
  const rec = record();
  ((rec.machines as Json[])[0]!.deviceKeys as Json[]).push(kem("m-a", K.gKem));
  return rec;
}

/** The shared record with `m-a`'s `#kem` written with a character base64 ignores. */
function looseKem(): Json {
  const rec = record();
  const key = ((rec.machines as Json[])[0]!.deviceKeys as Json[])[1]!;
  key.publicKey = `!${String(key.publicKey)}`;
  return rec;
}

// ---- verdict: machineCallVerdict({caller, target, capability, effect}) --------------------------------------------

function verdictCases(): Json[] {
  const ok: Json = { ok: true };
  const no = (detail: string): Json => ({ ok: false, code: "profile-forbids", detail });
  const cases: Array<[string, unknown, unknown, unknown, unknown, Json]> = [
    ["full to full, an effect", "full", "full", "files.write", "draft", ok],
    ["member to full, an effect", "member", "full", "files.write", "send", ok],
    ["full to member, an effect", "full", "member", "files.write", "draft", ok],
    ["member to member, an effect", "member", "member", "files.write", "draft", ok],
    ["full to view, a read", "full", "view", "status.read", "none", ok],
    ["full to view, an effect", "full", "view", "files.write", "draft", no("target-view")],
    ["full to view, no effect named", "full", "view", "files.write", undefined, no("target-view")],
    ["full to view, an unknown effect", "full", "view", "files.write", "maybe", no("target-view")],
    ["view to full, a read", "view", "full", "status.read", "none", ok],
    ["view to full, an effect", "view", "full", "files.write", "draft", no("caller-view")],
    ["view to view, an effect: the target first", "view", "view", "files.write", "draft", no("target-view")],
    ["view to view, a read", "view", "view", "status.read", "none", ok],
    ["the job tools in every profile: get", "view", "view", "fabric.job.get", "draft", ok],
    ["the job tools in every profile: cancel", "full", "view", "fabric.job.cancel", "draft", ok],
    ["the job tools in every profile: list", "view", "member", "fabric.job.list", undefined, ok],
    ["a caller's profile unread", null, "full", "status.read", "none", no("profile-unreadable")],
    ["a target's profile unread", "full", "owner", "fabric.job.get", "none", no("profile-unreadable")]
  ];
  return cases.map(([name, caller, target, capability, effect, expect]) => {
    const input: Json = { caller, target, capability };
    if (effect !== undefined) input.effect = effect;
    return { name, input, expect };
  });
}

// ---- call: sealAgentCall and openAgentCall ------------------------------------------------------------------------

const FROM = "m-a#sig", TO = "m-b#sig", MSG = "msg-7f3a", B_KEM = "m-b#kem";
const callMessage = (over: Json = {}): Json => ({
  type: TYPE, kind: "call", call: { agentId: "inbox-digest", capability: "digest.summarise", input: { days: 7 }, idempotencyKey: "call-1" }, ...over
});
const answerMessage = (): Json => ({ type: TYPE, kind: "answer", replyTo: MSG, answer: { isError: false, structuredContent: { items: 3 }, content: [{ type: "text", text: "three items" }] } });
const ephemeral = (label: string) => sha256(`${LABEL}ephemeral/${label}`);
const aad = (kind: string, from: unknown, to: unknown, msgId: unknown, kemKid: string) => Buffer.from(rfc8785({ type: TYPE, kind, from, to, msgId, kem: kemKid }), "utf8");

/** A sealed call over `plaintext`, to `key` under `kemKid`, its additional data from `fields`. */
function seal(plaintext: string, label: string, fields: { kind?: string; sealedKind?: string; from?: unknown; to?: unknown; msgId?: unknown; kemKid?: string; key?: TestKey } = {}): Json {
  const kemKid = fields.kemKid ?? B_KEM;
  const kind = fields.kind ?? "call";
  const { enc, ct } = hpkeSealBase(Buffer.from((fields.key ?? K.bKem).octets, "base64"), Buffer.from(TYPE, "ascii"), aad(kind, fields.from ?? FROM, fields.to ?? TO, fields.msgId ?? MSG, kemKid), Buffer.from(plaintext, "utf8"), ephemeral(label));
  return { type: TYPE, kind: fields.sealedKind ?? kind, kem: kemKid, enc: enc.toString("base64url"), ct: ct.toString("base64url") };
}
const sealed = (message: Json, label: string, fields: Parameters<typeof seal>[2] = {}) => seal(rfc8785(message), label, { kind: String(message.kind), ...fields });

function openCases(): Json[] {
  const own = { kid: B_KEM, privateKey: scalar(K.bKem) };
  const ctx = (over: Json = {}): Json => ({ from: FROM, to: TO, msgId: MSG, own, ...over });
  const okCall = sealed(callMessage(), "call");
  const withToken = callMessage({ delegation: "eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJleGFtcGxlIn0.c2ln", traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" });
  const tampered = { ...okCall, ct: `${String(okCall.ct).slice(0, 10)}${String(okCall.ct)[10] === "A" ? "B" : "A"}${String(okCall.ct).slice(11)}` };
  const notPoint = { ...okCall, enc: Buffer.from(offCurve(K.aSig), "base64").toString("base64url") };
  const opens = (message: Json): Json => ({ ok: true, message });
  const refused = (refusal: string): Json => ({ ok: false, refusal });
  const cases: Array<[string, unknown, Json, Json]> = [
    ["a call opens", okCall, ctx(), opens(callMessage())],
    ["an answer opens", sealed(answerMessage(), "answer"), ctx(), opens(answerMessage())],
    ["a call with the hub's token and a traceparent opens", sealed(withToken, "token"), ctx(), opens(withToken)],
    ["another recipient's kem", okCall, ctx({ own: { kid: "m-c#kem", privateKey: scalar(K.cKem) } }), refused("wrong-recipient")],
    ["the right kid, another key: it does not open", okCall, ctx({ own: { kid: B_KEM, privateKey: scalar(K.cKem) } }), refused("cannot-open")],
    ["another msgId than the body's", okCall, ctx({ msgId: "msg-other" }), refused("cannot-open")],
    ["another from than the body's", okCall, ctx({ from: "m-c#sig" }), refused("cannot-open")],
    ["another to than the body's", okCall, ctx({ to: "m-c#sig" }), refused("cannot-open")],
    ["the sealed kind changed", { ...okCall, kind: "answer" }, ctx(), refused("cannot-open")],
    ["one character of the ciphertext changed", tampered, ctx(), refused("cannot-open")],
    ["an enc that is no point of the curve", notPoint, ctx(), refused("malformed")],
    ["a member more", { ...okCall, note: "x" }, ctx(), refused("malformed")],
    ["a member less", { type: TYPE, kind: "call", kem: B_KEM, enc: okCall.enc }, ctx(), refused("malformed")],
    ["another type", { ...okCall, type: "fabric-agent-call/2" }, ctx(), refused("malformed")],
    ["a kem that is no #kem kid", { ...okCall, kem: "m-b#sig" }, ctx(), refused("malformed")],
    ["a ciphertext with padding", { ...okCall, ct: `${String(okCall.ct)}=` }, ctx(), refused("malformed")],
    ["no sealed object", "sealed", ctx(), refused("malformed")],
    ["a plaintext not in its RFC 8785 form", seal(JSON.stringify(callMessage(), null, 1), "spaced"), ctx(), refused("malformed")],
    ["a plaintext whose kind is not the sealed one", seal(rfc8785(callMessage()), "kind", { kind: "answer" }), ctx(), refused("malformed")],
    ["a plaintext the schema refuses: a member the call does not know", sealed(callMessage({ call: { agentId: "inbox-digest", capability: "digest.summarise", input: {}, token: "x" } }), "schema"), ctx(), refused("malformed")],
    ["a plaintext that is not JSON", seal("not json", "text"), ctx(), refused("malformed")],
    ["a plaintext with a byte-order mark before its RFC 8785 form", seal(`\ufeff${rfc8785(callMessage())}`, "bom"), ctx(), refused("malformed")]
  ];
  return cases.map(([name, sealedCall, context, expect]) => ({ name, sealed: sealedCall, context, expect }));
}

function sealCases(): Json[] {
  const recipient = { kid: B_KEM, publicKey: K.bKem.octets };
  const ctx = (over: Json = {}): Json => ({ from: FROM, to: TO, msgId: MSG, recipient, ephemeral: ephemeral("seal").toString("hex"), ...over });
  const cases: Array<[string, unknown, Json, Json]> = [
    ["a call", callMessage(), ctx(), { ok: true, sealed: sealed(callMessage(), "seal") }],
    ["an answer", answerMessage(), ctx(), { ok: true, sealed: sealed(answerMessage(), "seal") }],
    ["another type", { ...callMessage(), type: "fabric-agent-call/2" }, ctx(), { ok: false, refusal: "malformed" }],
    ["another kind", { ...callMessage(), kind: "event" }, ctx(), { ok: false, refusal: "malformed" }],
    ["a recipient kid that is no #kem", callMessage(), ctx({ recipient: { kid: "m-b#sig", publicKey: K.bKem.octets } }), { ok: false, refusal: "bad-key" }],
    ["a recipient key that is no point of the curve", callMessage(), ctx({ recipient: { kid: B_KEM, publicKey: offCurve(K.bKem) } }), { ok: false, refusal: "bad-key" }],
    ["a recipient key with a character base64 ignores", callMessage(), ctx({ recipient: { kid: B_KEM, publicKey: `!${K.bKem.octets}` } }), { ok: false, refusal: "bad-key" }],
    ["no msgId", callMessage(), ctx({ msgId: undefined }), { ok: false, refusal: "malformed" }]
  ];
  return cases.map(([name, message, context, expect]) => ({ name, message, context, expect }));
}

export function machineCallVectors(): Json {
  return {
    about:
      "Vectors for calls between machines of one estate over the relay (DEC-0106), written by tools/vectors/machine-call.ts, never by hand. Absent values are absent members; null is a JSON null. profile: machineProfile(record, machineId), null for none; a case without record reads the file's record. caller: relayCallerTier(input), input.applied the file's record unless the case names its own, every revocation in input.revocations a delta's. verdict: machineCallVerdict(input). open: openAgentCall(sealed, context) with schemaValid the agent-call-message schema; context.own.privateKey is the base64 P-256 scalar. seal: sealAgentCall(message, context), context.ephemeral the hex ephemeral scalar. A sealed call is HPKE base mode, suite [16, 1, 1], info the ASCII fabric-agent-call/1, the additional data the RFC 8785 UTF-8 bytes of {type, kind, from, to, msgId, kem}, the plaintext the RFC 8785 form of the message; enc and ct are unpadded base64url. Every case holds in every time zone.",
    record: record(),
    profile: profileCases(),
    caller: callerCases(),
    verdict: verdictCases(),
    open: openCases(),
    seal: sealCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildMachineCallVectors(): string {
  return `${JSON.stringify(machineCallVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildMachineCallVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}
