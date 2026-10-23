import { createECDH } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { machineProfile } from "../src/estate-record-rules.js";
import {
  AGENT_CALL_TYPE, JOB_TOOLS, MAX_AGENT_CALL_BYTES, PROFILE_FORBIDS, agentCallAad, machineCallRules, machineCallVerdict, openAgentCall, relayCallerCredential, relayCallerTier,
  sealAgentCall
} from "../src/machine-call.js";
import { hpkeSealBase } from "../src/secret-envelope.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildMachineCallVectors } from "../tools/vectors/machine-call.js";

type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;
const validator = await createValidator();
const valid = (schema: string) => (doc: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, doc).valid;
const messageValid = valid("agent-call-message.schema.json");
const sealedValid = valid("agent-call-sealed.schema.json");
const json = (value: unknown) => JSON.parse(JSON.stringify(value ?? null));

describe("the machine-call vectors (DEC-0106)", () => {
  it("are the generator's output", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildMachineCallVectors());
  });

  it.each(vectors.profile as Json[])("profile: $name", (c) => {
    expect(machineProfile("record" in c ? c.record : vectors.record, c.machineId) ?? null).toEqual(c.expect);
  });

  it.each(vectors.caller as Json[])("caller: $name", (c) => {
    const input = { applied: vectors.record, ...c.input };
    expect(json(relayCallerTier(input))).toEqual(c.expect);
  });

  it.each(vectors.verdict as Json[])("verdict: $name", (c) => {
    expect(machineCallVerdict(c.input)).toEqual(c.expect);
  });

  it.each(vectors.open as Json[])("open: $name", (c) => {
    expect(openAgentCall(c.sealed, { ...c.context, schemaValid: messageValid })).toEqual(c.expect);
  });

  it.each(vectors.seal as Json[])("seal: $name", (c) => {
    const { ephemeral, ...context } = c.context;
    expect(sealAgentCall(c.message, { ...context, ephemeral: Buffer.from(ephemeral, "hex") })).toEqual(c.expect);
  });

  it("the machines of the record they share are the schema's, and every sealed call too", () => {
    // The record is a held one, unsigned as relay.json's; its machines are checked. `m-e`'s profile is unknown on purpose.
    for (const machine of vectors.record.machines as Json[]) {
      const errors = validateDocument(validator, `${SCHEMA_PREFIX}schemas/estate-record.schema.json#/$defs/machine`, machine).errors;
      expect(errors.map((e) => e.instancePath), machine.id).toEqual(machine.id === "m-e" ? ["/profile"] : []);
    }
    for (const c of vectors.open as Json[]) if (c.expect.ok) expect(sealedValid(c.sealed), c.name).toBe(true);
    for (const c of vectors.seal as Json[]) if (c.expect.ok) expect(sealedValid(c.expect.sealed), c.name).toBe(true);
    for (const c of vectors.open as Json[]) if (c.expect.ok) expect(messageValid(c.expect.message), c.name).toBe(true);
  });
});

describe("sealAgentCall and openAgentCall beyond the vectors", () => {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  const recipient = { kid: "m-b#kem", publicKey: ecdh.getPublicKey().toString("base64") };
  const own = { kid: "m-b#kem", privateKey: ecdh.getPrivateKey().toString("base64") };
  const fields = { from: "m-a#sig", to: "m-b#sig", msgId: "msg-1" };
  const call = { type: AGENT_CALL_TYPE, kind: "call", call: { agentId: "inbox-digest", capability: "digest.run", input: {} } };

  it("round-trips a call with a random ephemeral key", () => {
    const sealed = sealAgentCall(call, { ...fields, recipient });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) return;
    expect(openAgentCall(sealed.sealed, { ...fields, own, schemaValid: messageValid })).toEqual({ ok: true, message: call });
  });

  it("refuses a plaintext over the limit, and one at it seals", () => {
    const pad = (n: number) => ({ ...call, call: { ...call.call, input: { blob: "x".repeat(n) } } });
    const base = Buffer.byteLength(JSON.stringify(pad(0)), "utf8");
    expect(sealAgentCall(pad(MAX_AGENT_CALL_BYTES - base), { ...fields, recipient }).ok).toBe(true);
    expect(sealAgentCall(pad(MAX_AGENT_CALL_BYTES - base + 1), { ...fields, recipient })).toEqual({ ok: false, refusal: "too-large" });
  });

  it("refuses what it cannot seal, and never throws", () => {
    expect(sealAgentCall(null, { ...fields, recipient })).toEqual({ ok: false, refusal: "malformed" });
    expect(sealAgentCall({ ...call, n: 1n }, { ...fields, recipient })).toEqual({ ok: false, refusal: "malformed" });
    expect(sealAgentCall(call, { ...fields, recipient: { kid: "m-b#kem", publicKey: 7 } })).toEqual({ ok: false, refusal: "bad-key" });
    expect(sealAgentCall(call, { ...fields, recipient: undefined as never })).toEqual({ ok: false, refusal: "bad-key" });
    // An ephemeral scalar that is no scalar of the group: HPKE refuses it, and the call names the key.
    expect(sealAgentCall(call, { ...fields, recipient, ephemeral: Buffer.alloc(32) })).toEqual({ ok: false, refusal: "bad-key" });
  });

  it("refuses an over-long ciphertext, an unreadable own key and a schema check that throws", () => {
    const sealed = sealAgentCall(call, { ...fields, recipient });
    if (!sealed.ok) throw new Error("seal");
    const long = { ...sealed.sealed, ct: Buffer.alloc(MAX_AGENT_CALL_BYTES + 17).toString("base64url") };
    expect(openAgentCall(long, { ...fields, own, schemaValid: messageValid })).toEqual({ ok: false, refusal: "malformed" });
    const short = { ...sealed.sealed, ct: Buffer.alloc(15).toString("base64url") };
    expect(openAgentCall(short, { ...fields, own, schemaValid: messageValid })).toEqual({ ok: false, refusal: "malformed" });
    // 65 bytes take 87 characters and two spare bits: setting them is no canonical encoding.
    const enc = String(sealed.sealed.enc);
    const loose = `${enc.slice(0, -1)}${"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(enc.slice(-1)) | 1]}`;
    expect(openAgentCall({ ...sealed.sealed, enc: loose }, { ...fields, own, schemaValid: messageValid })).toEqual({ ok: false, refusal: "malformed" });
    expect(openAgentCall({ ...sealed.sealed, enc: 7 }, { ...fields, own, schemaValid: messageValid })).toEqual({ ok: false, refusal: "malformed" });
    expect(openAgentCall({ ...sealed.sealed, kind: "event" }, { ...fields, own, schemaValid: messageValid })).toEqual({ ok: false, refusal: "malformed" });
    expect(openAgentCall(sealed.sealed, { ...fields, own: { kid: own.kid, privateKey: 7 }, schemaValid: messageValid })).toEqual({ ok: false, refusal: "cannot-open" });
    expect(openAgentCall(sealed.sealed, { ...fields, own: undefined as never, schemaValid: messageValid })).toEqual({ ok: false, refusal: "wrong-recipient" });
    expect(openAgentCall(sealed.sealed, { ...fields, own, schemaValid: () => { throw new Error("x"); } })).toEqual({ ok: false, refusal: "malformed" });
    expect(openAgentCall(sealed.sealed, { ...fields, own, schemaValid: () => "yes" as never })).toEqual({ ok: false, refusal: "malformed" });
  });

  it("refuses a plaintext that is valid JSON but not an object, or not of this protocol", () => {
    for (const plaintext of ["[1]", "\"call\"", `{"kind":"call","type":"fabric-agent-call/2"}`, "\xff"]) {
      const aad = agentCallAad({ kind: "call", ...fields, kem: own.kid });
      const { enc, ct } = hpke(Buffer.from(recipient.publicKey, "base64"), aad, Buffer.from(plaintext, "latin1"));
      const sealed = { type: AGENT_CALL_TYPE, kind: "call", kem: own.kid, enc: enc.toString("base64url"), ct: ct.toString("base64url") };
      expect(openAgentCall(sealed, { ...fields, own, schemaValid: () => true }), plaintext).toEqual({ ok: false, refusal: "malformed" });
    }
  });
});

function hpke(pk: Buffer, aad: Buffer, pt: Buffer) {
  return hpkeSealBase(pk, Buffer.from(AGENT_CALL_TYPE, "ascii"), aad, pt);
}

describe("the call rule and the credential", () => {
  it("names the job tools and the refusal's code", () => {
    expect(JOB_TOOLS).toEqual(["fabric.job.get", "fabric.job.cancel", "fabric.job.list"]);
    expect(PROFILE_FORBIDS).toBe("profile-forbids");
  });

  it("keys a tokenless relay call by its sender's #sig", () => {
    expect(relayCallerCredential("m-a#sig")).toBe("relay:m-a#sig");
    for (const from of ["#sig", "m-a#kem", 7, undefined]) expect(relayCallerCredential(from), String(from)).toBeUndefined();
  });

  it("relayCallerTier reads a record whose #kem is not a string as having none", () => {
    const record = json(vectors.record);
    record.machines[0].deviceKeys[1].publicKey = 7;
    expect(relayCallerTier({ applied: record, self: "m-a", from: "m-a#sig", at: "2026-10-13T00:00:00Z", freshness: "current" })).toEqual({ ok: true, tier: "T1", machine: "m-a", profile: "full" });
    expect(relayCallerTier({ applied: { ...record, revision: { toString: 1 } }, self: "m-a", from: "m-a#sig", at: "2026-10-13T00:00:00Z", freshness: "current" })).toEqual({ ok: false, code: "unknown-state", detail: "no-estate" });
    expect(relayCallerTier({ applied: record, self: "m-a", from: "m-a#sig", at: 7, freshness: "current" })).toEqual({ ok: false, code: "unknown-state", detail: "no-clock" });
    expect(relayCallerTier({ applied: record, self: 7, from: "m-a#sig", at: "2026-10-13T00:00:00Z", freshness: "current" })).toEqual({ ok: false, code: "unknown-state", detail: "self-not-admitted" });
    expect(relayCallerTier({ applied: record, self: "m-a", from: "m-a#sig", at: "2026-10-13T00:00:00Z", freshness: "current", revocations: "none" })).toMatchObject({ ok: true });
  });
});

describe("machine-call semantic fixtures (FAC-SEM-135, FAC-SEM-136)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("machine-call"));
  const load = (name: string) => JSON.parse(readFileSync(path.join(root, "fixtures/semantic", name), "utf8")) as Json;

  it("has a passing and a failing input for each rule", () => {
    for (const [kind, code] of [["relay-caller", "FAC-SEM-135"], ["machine-call", "FAC-SEM-136"]]) {
      const own = files.map(load).filter((fixture) => fixture.kind === kind);
      expect(own.some((fixture) => fixture.expect.length === 0), kind).toBe(true);
      expect(own.some((fixture) => fixture.expect.includes(code)), kind).toBe(true);
    }
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = load(name);
    expect([...new Set(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => f.code))]).toEqual(fixture.expect);
  });
});

describe("FAC-SEM-135 and FAC-SEM-136 (DEC-0106)", () => {
  const callerInput = { applied: vectors.record, self: "m-a", from: "m-b#sig", at: "2026-10-13T00:00:00Z", freshness: "current" };
  it("accept the reference's answer and refuse another", () => {
    const answer = relayCallerTier(callerInput);
    expect(evaluateSemanticRules("relay-caller", { ...callerInput, answer })).toEqual([]);
    expect(evaluateSemanticRules("relay-caller", { ...callerInput, answer: { ...answer, profile: "full" } }).map((f) => f.code)).toEqual(["FAC-SEM-135"]);
    const verdict = { caller: "full", target: "view", capability: "files.write", effect: "draft" };
    expect(evaluateSemanticRules("machine-call", { ...verdict, answer: machineCallVerdict(verdict) })).toEqual([]);
    expect(evaluateSemanticRules("machine-call", { ...verdict, answer: { ok: true } }).map((f) => [f.code, f.instancePath])).toEqual([["FAC-SEM-136", "/answer"]]);
    expect(evaluateSemanticRules("machine-call", verdict).map((f) => f.code)).toEqual(["FAC-SEM-136"]);
    expect(machineCallRules("another-kind", {})).toBeUndefined();
  });
});
