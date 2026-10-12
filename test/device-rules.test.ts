import { generateKeyPairSync, sign } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { type DeviceState, mergeDeviceState, policySigningInput, resolvePolicy, tamperEvidence, verifyPolicySignature } from "../src/device-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { mergeRanges, uncovered } from "../src/seq-ranges.js";

// DEC-0031: fabric-device/0.1 — enrollment, signed policy, check-in, health and attribution.
type Json = Record<string, any>;
const fixtures = path.join(projectRoot(), "fixtures");
const load = (relative: string) => JSON.parse(readFileSync(path.join(fixtures, relative), "utf8")) as Json;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => `${finding.code} ${finding.instancePath}`);

describe("device semantic fixtures (FAC-SEM-041…046)", () => {
  const files = readdirSync(path.join(fixtures, "semantic")).filter((name) => name.startsWith("device-"));

  it("has a passing and a failing input for each rule", () => {
    const expected = new Set(files.flatMap((name) => load(`semantic/${name}`).expect as string[]));
    expect([...expected].sort()).toEqual(["FAC-SEM-041", "FAC-SEM-042", "FAC-SEM-043", "FAC-SEM-044", "FAC-SEM-045", "FAC-SEM-046"]);
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
    // A walk over every value would take years; 2 s leaves room for a loaded machine and still proves it.
    expect(Date.now() - started).toBeLessThan(2000);
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

describe("FAC-SEM-046: policy key sets", () => {
  it("refuses a key named twice, a key set with no key valid at its issuedAt, and a revision that does not move", () => {
    const fixture = load("semantic/device-key-set-ok.json").input;
    fixture.next.keys.push(structuredClone(fixture.next.keys[0]));
    for (const key of fixture.next.keys) key.notBefore = "2027-06-01T00:00:00Z";
    fixture.next.revision = 1;
    const found = paths("device-key-set", fixture);
    expect(found).toEqual(expect.arrayContaining(["FAC-SEM-046 /next/keys/2/keyId", "FAC-SEM-046 /next/keys", "FAC-SEM-046 /next/revision", "FAC-SEM-046 /next/signature/value"]));
  });

  it("refuses a policy signed by a key outside its window", () => {
    const fixture = load("semantic/device-policy-update-ok.json").input;
    fixture.trustedKeys[0].notAfter = "2026-10-01T00:00:00Z";
    expect(paths("device-policy-update", fixture)).toContain("FAC-SEM-041 /next/signature/keyId");
  });
});

/** A fresh Ed25519 pair: the raw public key in base64 and a signer of the settings form without `signature`. */
function ed25519Signer(keyId: string) {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const raw = publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("base64");
  const signDoc = (doc: Json) => {
    delete doc.signature;
    doc.signature = { alg: "ed25519", keyId, value: sign(null, policySigningInput(doc), privateKey).toString("base64") };
    return doc;
  };
  return { keyId, publicKey: raw, signDoc };
}

// F-B-101: each FAC-SEM-041/043/044/045/046 branch the audit's mutation probe found unkilled, with an input on which that
// branch alone fires, so removing it fails the test.
describe("F-B-101: every device branch has a test that fails without it", () => {
  const exactly = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath} ${f.message}`);
  const observation = () => load("semantic/device-health-ok.json").input as { known: DeviceState; batch: Json; checkIn: Json };

  it("FAC-SEM-041 refuses a user layer delivered as an update, with no current layer to compare", () => {
    const fixture = load("semantic/device-policy-update-ok.json").input;
    delete fixture.current;
    fixture.next = { ...fixture.next, source: "user" };
    delete fixture.next.signature;
    expect(paths("device-policy-update", fixture)).toEqual(["FAC-SEM-041 /next/source"]);
  });

  it("FAC-SEM-041 refuses an update that replaces another layer than the one it names", () => {
    const fixture = load("semantic/device-policy-update-ok.json").input;
    fixture.current.source = "mdm";
    expect(paths("device-policy-update", fixture)).toEqual(["FAC-SEM-041 /next/source"]);
  });

  const keySet = () => {
    const root = ed25519Signer("org-7f3a.root");
    const fixture = load("semantic/device-key-set-ok.json").input;
    fixture.root = { keyId: root.keyId, publicKey: root.publicKey };
    root.signDoc(fixture.current);
    return { fixture, root };
  };

  it("FAC-SEM-046 refuses the root key listed as a policy signing key", () => {
    const { fixture, root } = keySet();
    fixture.next.keys.push({ ...fixture.next.keys[1], keyId: root.keyId });
    root.signDoc(fixture.next);
    expect(exactly("device-key-set", fixture)).toEqual(["FAC-SEM-046 /next/keys/2/keyId the root key is never a policy signing key"]);
  });

  it("FAC-SEM-046 refuses a key whose window ends before it starts", () => {
    const { fixture, root } = keySet();
    fixture.next.keys[1].notAfter = fixture.next.keys[1].notBefore;
    root.signDoc(fixture.next);
    expect(paths("device-key-set", fixture)).toEqual(["FAC-SEM-046 /next/keys/1/notAfter"]);
  });

  it("FAC-SEM-046 refuses a key set that moves to another organization", () => {
    const { fixture, root } = keySet();
    fixture.next.org.id = "org-other";
    root.signDoc(fixture.next);
    expect(paths("device-key-set", fixture)).toEqual(["FAC-SEM-046 /next/org/id"]);
  });

  it("FAC-SEM-044 refuses a certificate bound to another organization", () => {
    const fixture = load("semantic/device-enrollment-ok.json").input;
    fixture.response.certificate.binding.org.id = "org-other";
    expect(paths("device-enrollment", fixture)).toEqual(["FAC-SEM-044 /response/certificate/binding/org/id"]);
  });

  it("FAC-SEM-044 refuses a certificate that ends before it starts", () => {
    const fixture = load("semantic/device-enrollment-ok.json").input;
    fixture.response.certificate.notAfter = "2026-10-07T08:30:00Z";
    expect(exactly("device-enrollment", fixture)).toEqual(["FAC-SEM-044 /response/certificate/notAfter a certificate ends after it starts"]);
  });

  it("FAC-SEM-043 finds a check-in whose buffer starts after its last seq", () => {
    const o = observation();
    o.checkIn.collectors[0].bufferedFrom = 46;
    const found = tamperEvidence(o.known, o.batch, o.checkIn).map((e) => e.message);
    expect(found).toEqual(["cc-otel#2 reports a buffer that starts after its last seq"]);
  });

  it("FAC-SEM-043 finds a check-in under an epoch the server never issued", () => {
    const o = observation();
    o.known.epochs = [1];
    const where = tamperEvidence(o.known, null, o.checkIn).map((e) => e.instancePath);
    expect(where).toContain("/checkIn/collectors/0/collector/epoch");
  });

  it("FAC-SEM-045 refuses a user on an event of an epoch issued with no user bound", () => {
    const fixture = load("semantic/device-attribution-ok.json").input;
    delete fixture.epochs[0].binding.user;
    expect(new Set(paths("device-attribution", fixture))).toEqual(new Set(fixture.batch.events.flatMap((event: Json, i: number) => (event.user ? [`FAC-SEM-045 /batch/events/${i}/user`] : []))));
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

// F-B-103…F-B-108 (DEC-0053, DEC-0052): each fix with a test that fails without it.
describe("F-B-103…F-B-108: the audit's device fixes", () => {
  const exactly = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath} ${f.message}`);

  it("F-B-103: devices.md names the keyed hmac-sha256: branch the schema requires, never a bare sha256:", () => {
    const spec = readFileSync(path.join(projectRoot(), "docs/specification/devices.md"), "utf8");
    const row = spec.split("\n").find((line) => line.startsWith("| `telemetry.git_branch`"));
    expect(row).toContain("`hmac-sha256:`");
    expect(row).not.toMatch(/[^-]`?sha256:/);
    const branch = JSON.parse(readFileSync(path.join(projectRoot(), "schemas/activity-common.schema.json"), "utf8")).$defs.branch.pattern as string;
    expect(branch).toContain("hmac-sha256:");
  });

  /** A server policy pair under one fresh key whose window is the first half of 2026. */
  const backdated = () => {
    const signer = ed25519Signer("org-7f3a.policy-h1");
    const fixture = load("semantic/device-policy-update-ok.json").input;
    fixture.trustedKeys = [{ keyId: signer.keyId, publicKey: signer.publicKey, notBefore: "2026-01-01T00:00:00Z", notAfter: "2026-06-30T23:59:59Z" }];
    fixture.current.issuedAt = "2026-03-01T08:00:00Z";
    fixture.next.issuedAt = "2026-05-01T08:00:00Z";
    signer.signDoc(fixture.current);
    signer.signDoc(fixture.next);
    return { fixture, signer };
  };

  it("F-B-106: a key is judged when the device verifies, so a backdated policy under an expired key is refused", () => {
    const { fixture } = backdated();
    fixture.at = "2026-05-02T08:00:00Z";
    expect(paths("device-policy-update", fixture)).toEqual([]);
    fixture.at = "2026-10-07T09:00:00Z";
    expect(exactly("device-policy-update", fixture)).toEqual(["FAC-SEM-041 /next/signature/keyId key org-7f3a.policy-h1 is outside its validity window when the device verifies"]);
  });

  it("F-B-106: a policy issued before the one the device holds is refused, and the rule needs the verification time", () => {
    const { fixture, signer } = backdated();
    fixture.at = "2026-05-02T08:00:00Z";
    fixture.next.issuedAt = "2026-02-01T08:00:00Z";
    signer.signDoc(fixture.next);
    expect(paths("device-policy-update", fixture)).toEqual(["FAC-SEM-041 /next/issuedAt"]);
    const timeless = backdated().fixture;
    delete timeless.at;
    expect(paths("device-policy-update", timeless)).toEqual(["FAC-SEM-041 /at"]);
  });

  it("F-B-105: an SSO certificate binds the user the proof names; a token one only the user the token names", () => {
    const sso = load("semantic/device-enrollment-ok.json").input;
    sso.proof.userId = "m-0007";
    expect(exactly("device-enrollment", sso)).toEqual(["FAC-SEM-044 /response/certificate/binding/user/id an SSO enrollment binds the user its sign-in proves, never another"]);
    const token = load("semantic/device-enrollment-token-names-user.json").input;
    expect(paths("device-enrollment", token)).toEqual([]);
    token.token.userId = "m-0007";
    expect(paths("device-enrollment", token)).toEqual(["FAC-SEM-044 /response/certificate/binding/user/id"]);
    token.token = { ...token.token, tokenId: "tok-other", userId: "m-4821" };
    expect(paths("device-enrollment", token)).toEqual(["FAC-SEM-044 /response/certificate/binding/user/id", "FAC-SEM-044 /request/device/id"]);
  });

  it("F-B-108: a check-in's dropped ranges are pending: tamper evidence counts them, an ack never does", () => {
    const o = load("semantic/device-health-overflow-pending.json").input as { known: DeviceState; batch: Json; checkIn: Json };
    expect(tamperEvidence(o.known, o.batch, o.checkIn)).toEqual([]);
    const state = mergeDeviceState(o.known, o.batch, o.checkIn);
    const stream = state.streams.find((s) => s.collector.id === o.checkIn.collectors[0].collector.id)!;
    expect(stream.pending).toEqual(mergeRanges(o.checkIn.collectors[0].dropped.map((r: Json) => [r.fromSeq, r.toSeq])));
    expect(uncovered([...stream.held, ...stream.accounted], ...stream.pending![0]!)).toEqual([stream.pending![0]]);
  });
});

describe("F-B-109: the reader row of a device applying policy names its key-set duty", () => {
  it("lists FAC-SEM-046 and the key-set fixtures beside FAC-SEM-041 and FAC-SEM-042", () => {
    const conformance = readFileSync(path.join(projectRoot(), "docs/specification/conformance.md"), "utf8");
    const row = conformance.split("\n").find((line) => line.startsWith("| a device applying policy |"));
    expect(row).toContain("`FAC-SEM-046`");
    expect(row).toContain("fixtures/semantic/device-key-set-*");
  });
});
