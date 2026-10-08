import { generateKeyPairSync, sign } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { type DeviceState, mergeDeviceState, policySigningInput, resolvePolicy, tamperEvidence, verifyPolicySignature } from "../src/device-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0031: fabric-device/0.1 — enrollment, signed policy, check-in, health and attribution.
type Json = Record<string, any>;
const fixtures = path.join(projectRoot(), "fixtures");
const load = (relative: string) => JSON.parse(readFileSync(path.join(fixtures, relative), "utf8")) as Json;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => `${finding.code} ${finding.instancePath}`);

describe("device semantic fixtures (FAC-SEM-041…045)", () => {
  const files = readdirSync(path.join(fixtures, "semantic")).filter((name) => name.startsWith("device-"));

  it("has a passing and a failing input for each rule", () => {
    const expected = new Set(files.flatMap((name) => load(`semantic/${name}`).expect as string[]));
    expect([...expected].sort()).toEqual(["FAC-SEM-041", "FAC-SEM-042", "FAC-SEM-043", "FAC-SEM-044", "FAC-SEM-045"]);
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = load(`semantic/${name}`);
    expect([...new Set(codes(fixture.kind, fixture.input))]).toEqual(fixture.expect);
  });
});

describe("FAC-SEM-041: a delivered policy verifies and moves forward", () => {
  const update = () => load("semantic/device-policy-update-ok.json").input;

  it("verifies the fixture's signature under its public key, and only that key", () => {
    const { next, trustedKeys } = update();
    expect(verifyPolicySignature(next, trustedKeys[0].publicKey)).toBe(true);
    const other = generateKeyPairSync("ed25519").publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("base64");
    expect(verifyPolicySignature(next, other)).toBe(false);
  });

  it("signs the canonical document without its signature, so key order does not matter", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    const policy: Json = { revision: 2, source: "server", keys: { "retention.raw_days": { value: 7 } } };
    policy.signature = { alg: "ed25519", keyId: "k", value: sign(null, policySigningInput(policy), privateKey).toString("base64") };
    const reordered = { signature: policy.signature, keys: policy.keys, source: "server", revision: 2 };
    const raw = publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("base64");
    expect(verifyPolicySignature(reordered, raw)).toBe(true);
  });

  it("refuses an unknown key id, a server policy without a signature and a change of organization", () => {
    const a = update();
    a.next.signature.keyId = "someone-else";
    expect(paths("device-policy-update", a)).toContain("FAC-SEM-041 /next/signature/keyId");
    const b = update();
    delete b.next.signature;
    expect(paths("device-policy-update", b)).toContain("FAC-SEM-041 /next/signature");
    const c = update();
    c.current.org.id = "org-other";
    expect(paths("device-policy-update", c)).toContain("FAC-SEM-041 /next/org/id");
  });
});

describe("FAC-SEM-042: precedence and locks", () => {
  const layers = () => load("semantic/device-policy-resolution-ok.json").input.layers as Json[];

  it("resolves lock first, then the user's own value, then the highest default", () => {
    const effective = resolvePolicy(layers());
    expect(effective["retention.raw_days"]).toEqual({ value: 14, from: "mdm" });
    expect(effective["build_channel.allowed"]).toEqual({ value: "official", from: "server" });
    expect(effective["x-example.banner"]).toEqual({ value: "quiet", from: "user" });
    expect(effective["telemetry.endpoint"]).toEqual({ value: "https://telemetry.example.org/mdm", from: "mdm" });
  });

  it("lets a higher lock win over a lower lock", () => {
    const [mdm, server, user] = layers();
    server!.keys["retention.raw_days"] = { value: 60, locked: true };
    expect(resolvePolicy([user!, server!, mdm!])["retention.raw_days"]).toEqual({ value: 14, from: "mdm" });
  });

  it("refuses a lock in the user layer, two layers of one source and a setting no layer made", () => {
    const fixture = load("semantic/device-policy-resolution-ok.json").input;
    fixture.layers[2].keys["retention.raw_days"].locked = true;
    fixture.layers.push(structuredClone(fixture.layers[1]));
    fixture.effective["x-example.extra"] = { value: 1, from: "user" };
    expect(paths("device-policy-resolution", fixture)).toEqual(expect.arrayContaining([
      "FAC-SEM-042 /layers/2/keys/retention.raw_days/locked", "FAC-SEM-042 /layers/3/source", "FAC-SEM-042 /effective/x-example.extra"
    ]));
  });
});

describe("FAC-SEM-043: health does not hide tampering", () => {
  const observation = () => load("semantic/device-health-ok.json").input as { known: DeviceState; batch: Json; checkIn: Json };

  it("keeps held and accounted ranges across batches", () => {
    const o = observation();
    const state = mergeDeviceState(o.known, o.batch, null);
    const cc = state.streams.find((s) => s.collector.id === "cc-otel");
    expect(cc?.held).toEqual([[1, 37], [41, 44]]);
    expect(cc?.accounted).toEqual([[38, 40]]);
  });

  it("judges a gap between batches only once a check-in says the buffer moved past it", () => {
    const pending = load("semantic/device-health-overflow-pending.json").input;
    expect(tamperEvidence(pending.known, pending.batch, null)).toEqual([]);
    const later = load("semantic/device-health-overflow-later-batch.json").input;
    expect(tamperEvidence(later.known, null, null)).toEqual([]);
    const where = tamperEvidence(later.known, null, later.checkIn).map((e) => e.message);
    expect(where.some((m) => m.includes("38…40"))).toBe(true);
  });

  it("finds a hole inside one batch, a counter that went back and a policy revision below the baseline", () => {
    const o = observation();
    o.batch.events.splice(1, 1);
    o.checkIn.collectors[0].lastSeq = 12;
    o.checkIn.policy.layers[1].revision = 11;
    const where = tamperEvidence(o.known, o.batch, o.checkIn).map((e) => e.instancePath);
    expect(where).toEqual(expect.arrayContaining(["/batch/events/1/seq", "/checkIn/collectors/0/lastSeq", "/checkIn/policy/layers/1/revision"]));
  });

  it("accepts tampered as the state when the evidence is there", () => {
    const fixture = load("semantic/device-health-gap-hidden.json").input;
    fixture.health.state = "tampered";
    expect(codes("device-health-observation", fixture)).toEqual([]);
  });

  it("answers for an overflow of 2^53 seqs without walking them", () => {
    const o = observation();
    o.batch.events[3].data.dropped = { events: Number.MAX_SAFE_INTEGER - 1, ranges: [{ fromSeq: 1, toSeq: Number.MAX_SAFE_INTEGER - 1 }] };
    o.batch.events[3].seq = Number.MAX_SAFE_INTEGER;
    const started = Date.now();
    tamperEvidence(o.known, o.batch, o.checkIn);
    expect(Date.now() - started).toBeLessThan(200);
  });
});

describe("FAC-SEM-044: the certificate is what was enrolled", () => {
  it("refuses another device, and an SSO enrollment that binds no user", () => {
    const fixture = load("semantic/device-enrollment-ok.json").input;
    fixture.response.certificate.binding.device.id = "dev-other";
    delete fixture.response.certificate.binding.user;
    expect(paths("device-enrollment", fixture)).toEqual(expect.arrayContaining([
      "FAC-SEM-044 /response/certificate/binding/device/id", "FAC-SEM-044 /response/certificate/binding/user"
    ]));
  });

  it("does not accept a token issued for another device as proof", () => {
    const fixture = load("semantic/device-enrollment-mdm-token-for-device.json").input;
    fixture.token.deviceId = "dev-other";
    expect(paths("device-enrollment", fixture)).toContain("FAC-SEM-044 /request/device/id");
  });

  it("lets an unattended enrollment token leave the user unbound", () => {
    const fixture = load("semantic/device-enrollment-ok.json").input;
    fixture.request.auth = { method: "enrollment-token", tokenId: "tok-mdm-01" };
    delete fixture.response.certificate.binding.user;
    expect(codes("device-enrollment", fixture)).toEqual([]);
  });
});

describe("FAC-SEM-045: attribution comes from the client certificate", () => {
  it("refuses a check-in under another device, and an event of an epoch with no recorded binding", () => {
    const fixture = load("semantic/device-attribution-ok.json").input;
    fixture.checkIn.device.id = "dev-other";
    fixture.epochs = [];
    expect(paths("device-attribution", fixture)).toEqual(expect.arrayContaining(["FAC-SEM-045 /checkIn/device/id", "FAC-SEM-045 /batch/events/0/collector/epoch"]));
  });

  it("ignores an epoch binding recorded for another device", () => {
    const fixture = load("semantic/device-attribution-ok.json").input;
    fixture.epochs[0].binding.device.id = "dev-other";
    expect(paths("device-attribution", fixture)).toContain("FAC-SEM-045 /batch/events/0/collector/epoch");
  });
});
