import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rfc8785 } from "../src/canonical.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { isSmallOrderKey } from "../src/ed25519.js";
import {
  ESTATE_CHALLENGE_TYPE,
  estateRecordRules,
  MAX_VALIDITY_SECONDS,
  estateChallenge,
  estateChallengeInput,
  estateRecordDigest,
  placementTrust,
  verifyEstateRecord
} from "../src/estate-record-rules.js";
import { verifyPackage } from "../src/package-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { ASSERTION_ALGORITHMS, credentialKey, verifyAssertion } from "../src/webauthn.js";

// DEC-0055: estate-record/1 — revisions chained by digest, machines with device keys and hub-key certificates,
// packages per machine, secret placements by reference, share grants and revocations, and a passkey assertion.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const load = (relative: string) => read(`fixtures/${relative}`);
const validator = await createValidator();
const valid = (value: unknown, schema = "estate-record") => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const vectors = load("vectors/estate-record.json");
const first = load("positive/estate-record-first.json");
const second = load("positive/estate-record-second.json");
const agentPkg = load("positive/fabric-package-agent.json");
const schema = read("schemas/estate-record.schema.json");
const spec = readFileSync(path.join(root, "docs/specification/estate-record.md"), "utf8");
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest();
const AT = new Date("2026-10-13T00:00:00Z");
const pinned = [vectors.keys.passkeyEs256.authority];
const credential = vectors.keys.passkeyEs256.authority;

describe("the schema (DEC-0055)", () => {
  it("accepts the first revision and the second, and both pass every rule", () => {
    for (const record of [first, second]) {
      expect(valid(record)).toBe(true);
      expect(codes("estate-record", record)).toEqual([]);
    }
  });

  it("types every item of v4 §12's estate-record row", () => {
    for (const field of ["machines", "shareGrants", "revocations", "revision", "parent", "signature", "authorities", "publisherKeys"]) expect(schema.properties, field).toHaveProperty(field);
    const machine = schema.$defs.machine.properties;
    for (const field of ["deviceKeys", "hubKey", "packages", "secrets"]) expect(machine, field).toHaveProperty(field);
    expect(machine.deviceKeys.items.$ref).toBe("device-enrollment.schema.json#/$defs/deviceKey");
    expect(machine.packages.items.properties.agentRef.$ref).toBe("fabric-package.schema.json#/$defs/agentRef");
    expect(schema.properties.shareGrants.items.allOf[0].$ref).toBe("governance.schema.json#/$defs/grant");
  });

  it("gives a secret placement no member that could hold a value (DEC-0013)", () => {
    const secret = schema.$defs.machine.properties.secrets.items;
    expect(Object.keys(secret.properties).sort()).toEqual(["agentRef", "from", "slot"]);
    expect(secret.additionalProperties).toBe(false);
    expect(valid(load("negative/estate-record-secret-value.json"))).toBe(false);
  });

  it("records no user handle and no machine name", () => {
    expect(Object.keys(schema.$defs.assertion.properties)).not.toContain("userHandle");
    expect(valid(load("negative/estate-record-assertion-user-handle.json"))).toBe(false);
    expect(valid(load("negative/estate-record-machine-name.json"))).toBe(false);
  });

  it("certifies a hub key in the shape the estate's key set publishes it (DEC-0039)", () => {
    expect(valid({ keys: [first.machines[0].hubKey] }, "delegation-jwks")).toBe(true);
    expect(valid(load("negative/estate-record-hub-without-alg.json"))).toBe(false);
  });

  it("numbers revisions as the device check-in reports them (DEC-0053)", () => {
    const checkIn = read("schemas/device-check-in.schema.json");
    const text = JSON.stringify(checkIn);
    expect(text).toContain('"estateRecord"');
    const revision = /"estateRecord":\{[^}]*"revision":(\{[^}]*\})/.exec(text)?.[1];
    expect(JSON.parse(revision as string)).toEqual({ type: "integer", minimum: 1, maximum: 9007199254740991 });
    expect(schema.properties.revision).toMatchObject({ type: "integer", minimum: 1, maximum: 9007199254740991 });
  });
});

describe("estate-record semantic fixtures (FAC-SEM-072…076)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("estate-"));
  const schemaInvalid = ["estate-grant-not-external.json", "estate-hub-small-order.json", "estate-machine-small-order-key.json"];

  it("has a passing and a failing input for each rule", () => {
    const expected = new Set(files.flatMap((name) => load(`semantic/${name}`).expect as string[]));
    expect([...expected].sort()).toEqual(["FAC-SEM-072", "FAC-SEM-073", "FAC-SEM-074", "FAC-SEM-075", "FAC-SEM-076"]);
    expect(files.filter((name) => (load(`semantic/${name}`).expect as string[]).length === 0).length).toBeGreaterThanOrEqual(3);
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = load(`semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
    if (fixture.kind === "estate-record") expect(valid(fixture.input), name).toBe(!schemaInvalid.includes(name));
  });

  it("never repeats the credential it refuses", () => {
    const text = JSON.stringify(evaluateSemanticRules("estate-record", load("semantic/estate-secret-value-as-slot.json").input));
    expect(text).toContain("FAC-SEM-075");
    expect(text).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });

  it("names the digest it computed, and refuses a record that has no RFC 8785 form", () => {
    const changed = load("semantic/estate-record-digest-mismatch.json").input;
    expect(evaluateSemanticRules("estate-record", changed)[0]?.message).toContain(estateRecordDigest(changed));
    expect(evaluateSemanticRules("estate-record", { ...first, revision: Number.NaN })[0]?.message).toMatch(/no RFC 8785 form/);
    const parent = { ...first, revision: Number.NaN };
    expect(codes("estate-record-revision", { parent, next: second })).toEqual(["FAC-SEM-072"]);
    expect(codes("estate-placement", { record: first, machine: "m-4c1e", package: { ...agentPkg, listingChars: Number.NaN } })).toEqual(["FAC-SEM-074"]);
  });

  it("keeps a revocation across revisions, and refuses a machine with two key-agreement keys", () => {
    const third = { ...second, revision: 3, parent: second.digest, issuedAt: "2026-10-21T09:00:00Z", validUntil: "2026-11-20T09:00:00Z" };
    expect(codes("estate-record-revision", { parent: second, next: { ...third, digest: estateRecordDigest(third) } })).toEqual([]);
    const machine = first.machines[0];
    const twoKem = { ...first, machines: [{ ...machine, deviceKeys: [...machine.deviceKeys, { ...machine.deviceKeys[1], publicKey: first.machines[1].deviceKeys[1].publicKey }] }] };
    const findings = evaluateSemanticRules("estate-record", { ...twoKem, digest: estateRecordDigest(twoKem) });
    expect(findings.map((finding) => `${finding.code} ${finding.instancePath}`)).toEqual(["FAC-SEM-073 /machines/0/deviceKeys"]);
    expect(findings[0]?.message).toMatch(/at most one key-agreement/);
  });

  it("reads only its own three kinds", () => {
    expect(estateRecordRules("package", first)).toBeUndefined();
  });

  it("answers every malformed shape with findings or none, never by throwing", () => {
    const wrong: unknown[] = [null, 7, "x", true, [], [null, 3, "y"], { a: null }];
    const members = ["machines", "authorities", "publisherKeys", "shareGrants", "revocations", "parent", "next", "record", "package", "machine", "deviceKeys", "packages", "secrets", "hubKey", "meta", "issuedAt", "validUntil", "digest"];
    for (const kind of ["estate-record", "estate-record-revision", "estate-placement"]) {
      for (const value of wrong) expect(() => evaluateSemanticRules(kind, Object.fromEntries(members.map((name) => [name, value])))).not.toThrow();
      expect(() => evaluateSemanticRules(kind, {})).not.toThrow();
    }
    const nested = { machines: [1, { deviceKeys: [1, { use: "sig" }], packages: [1, {}], secrets: [1, {}], hubKey: { x: 3 } }, { id: "m", hubKey: {} }], authorities: [1, { publicKey: 2 }], shareGrants: [1, { meta: 2 }], revocations: [1, {}], publisherKeys: [1, {}] };
    expect(() => evaluateSemanticRules("estate-record", nested)).not.toThrow();
    expect(() => evaluateSemanticRules("estate-placement", { record: nested, machine: undefined, package: { secrets: [1] } })).not.toThrow();
  });
});

describe("the digest and the challenge (DEC-0055, DEC-0043)", () => {
  it("is SHA-256 over RFC 8785 of the record without digest and signature, as the vector says", () => {
    const { digest: _digest, signature: _signature, ...covered } = vectors.digest.record;
    expect(rfc8785(covered)).toBe(vectors.digest.canonical);
    expect(`sha256:${sha(Buffer.from(vectors.digest.canonical, "utf8")).toString("hex")}`).toBe(vectors.digest.expected);
    expect(estateRecordDigest(first)).toBe(first.digest);
    expect(vectors.digest.record).toEqual(first);
  });

  it("does not move when the signature changes, and moves with any other change", () => {
    expect(estateRecordDigest({ ...first, signature: undefined })).toBe(first.digest);
    for (const change of [{ revision: 2 }, { machines: [] }, { validUntil: "2026-11-10T09:00:00Z" }]) expect(estateRecordDigest({ ...first, ...change })).not.toBe(first.digest);
  });

  it("derives the challenge from a typed statement, so an estate revision's assertion is no other signature", () => {
    expect(ESTATE_CHALLENGE_TYPE).toBe("estate-revision/1");
    expect(estateChallengeInput(first.digest).toString("utf8")).toBe(vectors.challenge.input);
    expect(vectors.challenge.input).toBe(`{"digest":"${first.digest}","type":"estate-revision/1"}`);
    expect(estateChallenge(first.digest).toString("base64url")).toBe(vectors.challenge.challenge);
    expect(estateChallenge(first.digest).equals(sha(estateChallengeInput(first.digest)))).toBe(true);
    const client = JSON.parse(Buffer.from(first.signature.clientDataJSON, "base64url").toString("utf8"));
    expect(client.challenge).toBe(vectors.challenge.challenge);
  });
});

describe("the verifier (DEC-0055, WebAuthn Level 3 §7.2)", () => {
  it.each(vectors.cases as Json[])("$name", (entry) => {
    expect(verifyEstateRecord(entry.record, { ...entry.trust, at: new Date(entry.trust.at) })).toEqual(entry.expected);
  });

  it("holds a vector case per problem in estate-record.md's ER table, and the table names every problem it answers", () => {
    const table = [...spec.matchAll(/^\| ER-\d+ \| ([^|]+) \|/gm)].flatMap((match) => [...(match[1] ?? "").matchAll(/`([a-z-]+)`/g)].map((m) => m[1]));
    const answered = new Set((vectors.cases as Json[]).filter((entry) => !entry.expected.ok).map((entry) => entry.expected.problem));
    expect([...answered].sort()).toEqual([...new Set(table)].sort());
  });

  it("reproduces the EdDSA passkey's signature from its seed", () => {
    const key = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(vectors.keys.passkeyEdDSA.seed, "hex")]), format: "der", type: "pkcs8" });
    const data = Buffer.concat([Buffer.from(second.signature.authenticatorData, "base64url"), sha(Buffer.from(second.signature.clientDataJSON, "base64url"))]);
    expect(sign(null, data, key).toString("base64url")).toBe(second.signature.sig);
  });

  it("refuses the small-order passkey key before verifying, whatever this Node's crypto.verify answers", () => {
    const forged = (vectors.cases as Json[]).find((entry) => entry.expected.problem === "small-order-key") as Json;
    expect(isSmallOrderKey(Buffer.from(vectors.keys.smallOrder.authority.publicKey.x, "base64url"))).toBe(true);
    expect(forged.record.signature.sig).toBe(Buffer.concat([Buffer.from("5866666666666666666666666666666666666666666666666666666666666666", "hex"), Buffer.from([1]), Buffer.alloc(31)]).toString("base64url"));
  });

  it("admits ES256 and EdDSA, in the schema and the verifier alike", () => {
    expect(ASSERTION_ALGORITHMS).toEqual(["ES256", "EdDSA"]);
    expect(schema.$defs.assertion.properties.alg.enum).toEqual([...ASSERTION_ALGORITHMS]);
    expect(schema.$defs.authority.properties.alg.enum).toEqual([...ASSERTION_ALGORITHMS]);
    expect(valid(load("negative/estate-record-assertion-rs256.json"))).toBe(false);
  });

  it("holds the estate record to 30 days", () => {
    expect(MAX_VALIDITY_SECONDS).toBe(2592000);
    expect(Date.parse(first.validUntil) - Date.parse(first.issuedAt)).toBe(MAX_VALIDITY_SECONDS * 1000);
  });

  it("refuses rather than throws on input of the wrong shape", () => {
    const trust = { authorities: pinned, at: AT };
    const malformed = { ok: false, problem: "malformed" };
    expect(verifyEstateRecord(null, trust)).toEqual(malformed);
    expect(verifyEstateRecord({ ...first, digest: 1 }, trust)).toEqual(malformed);
    expect(verifyEstateRecord({ ...first, revision: 1.5 }, trust)).toEqual(malformed);
    expect(verifyEstateRecord({ ...first, signature: "x" }, trust)).toEqual(malformed);
    expect(verifyEstateRecord({ ...first, signature: { ...first.signature, credentialId: 1 } }, trust)).toEqual(malformed);
    expect(verifyEstateRecord({ ...first, issuedAt: Number.NaN }, trust)).toEqual(malformed);
    const brokenChain = { ok: false, problem: "broken-chain" };
    expect(verifyEstateRecord(second, { parent: "x", at: AT })).toEqual(brokenChain);
    expect(verifyEstateRecord(second, { parent: { ...first, revision: Number.NaN }, at: AT })).toEqual(brokenChain);
    expect(verifyEstateRecord(second, { parent: { ...first, estate: "other" }, at: AT })).toEqual(brokenChain);
    // Revision 1 that names a parent starts no chain.
    const withParent = { ...first, parent: second.digest };
    expect(verifyEstateRecord({ ...withParent, digest: estateRecordDigest(withParent) }, trust)).toEqual(brokenChain);
    expect(verifyEstateRecord(first, { at: AT })).toEqual({ ok: false, problem: "no-trusted-authority" });
    // Entries of the wrong shape are skipped when the signing passkey is looked up.
    expect(verifyEstateRecord(first, { authorities: [null, 3, ...pinned], at: AT }).ok).toBe(true);
    expect(verifyEstateRecord(first, { authorities: [{ ...credential, publicKey: 1 }], at: AT })).toEqual({ ok: false, problem: "unusable-key" });
    expect(verifyEstateRecord(first, { authorities: [{ ...credential, origins: "x" }], at: AT })).toEqual({ ok: false, problem: "wrong-origin" });
  });
});

describe("the passkey assertion (WebAuthn Level 3 §7.2, §6.5.5)", () => {
  const challenge = estateChallenge(first.digest);
  const assertion = first.signature;

  it("verifies the first revision's assertion and reads its counter", () => {
    expect(verifyAssertion(assertion, credential, challenge)).toEqual({ ok: true, flags: 0x1d, signCount: 0 });
  });

  it("refuses an assertion of the wrong shape", () => {
    const malformed = { ok: false, problem: "malformed" };
    expect(verifyAssertion(null, credential, challenge)).toEqual(malformed);
    for (const field of ["credentialId", "alg", "authenticatorData", "clientDataJSON", "sig"]) expect(verifyAssertion({ ...assertion, [field]: 1 }, credential, challenge), field).toEqual(malformed);
    expect(verifyAssertion({ ...assertion, sig: "not base64url!" }, credential, challenge)).toEqual(malformed);
    expect(verifyAssertion({ ...assertion, credentialId: "b3RoZXI" }, credential, challenge)).toEqual(malformed);
    expect(verifyAssertion({ ...assertion, clientDataJSON: Buffer.from("1").toString("base64url") }, credential, challenge)).toEqual(malformed);
    expect(verifyAssertion({ ...assertion, clientDataJSON: Buffer.from([0xff, 0xfe]).toString("base64url") }, credential, challenge)).toEqual(malformed);
    expect(verifyAssertion({ ...assertion, authenticatorData: Buffer.alloc(36).toString("base64url") }, credential, challenge)).toEqual(malformed);
  });

  it("reads the client data after a byte order mark, and refuses a non-string origin and a top origin", () => {
    const client = JSON.parse(Buffer.from(assertion.clientDataJSON, "base64url").toString("utf8"));
    const withClient = (value: Json, bom = false) => ({ ...assertion, clientDataJSON: Buffer.concat([Buffer.from(bom ? [0xef, 0xbb, 0xbf] : []), Buffer.from(JSON.stringify(value))]).toString("base64url") });
    // Valid client data under another hash: it reaches the signature, which then fails.
    expect(verifyAssertion(withClient(client, true), credential, challenge)).toEqual({ ok: false, problem: "bad-signature" });
    expect(verifyAssertion(withClient({ ...client, origin: 1 }), credential, challenge)).toEqual({ ok: false, problem: "wrong-origin" });
    expect(verifyAssertion(withClient({ ...client, topOrigin: "https://sign.example.org" }), credential, challenge)).toEqual({ ok: false, problem: "cross-origin" });
  });

  it("refuses a credential key that is not a public P-256 or Ed25519 signing key", () => {
    const es = credential.publicKey;
    for (const key of [null, { ...es, d: "x" }, { ...es, x: 1 }, { ...es, x: "!" }, { ...es, kty: "OKP" }, { ...es, crv: "P-384" }, { ...es, y: undefined }, { ...es, y: "!" }, { ...es, x: Buffer.alloc(31, 1).toString("base64url") }]) {
      expect(credentialKey(key, "ES256"), JSON.stringify(key)).toEqual({ problem: "unusable-key" });
    }
    const ed = vectors.keys.passkeyEdDSA.authority.publicKey;
    for (const key of [{ ...ed, kty: "EC" }, { ...ed, crv: "Ed448" }, { ...ed, x: Buffer.alloc(31, 1).toString("base64url") }]) {
      expect(credentialKey(key, "EdDSA"), JSON.stringify(key)).toEqual({ problem: "unusable-key" });
    }
    expect("key" in credentialKey(ed, "EdDSA")).toBe(true);
  });

  it("refuses a signature that is not DER for ES256 or not 64 bytes for EdDSA", () => {
    expect(verifyAssertion({ ...assertion, sig: Buffer.alloc(64, 1).toString("base64url") }, credential, challenge)).toEqual({ ok: false, problem: "bad-signature" });
    const ed = second.signature;
    const edCredential = vectors.keys.passkeyEdDSA.authority;
    const edChallenge = estateChallenge(second.digest);
    expect(verifyAssertion(ed, edCredential, edChallenge).ok).toBe(true);
    expect(verifyAssertion({ ...ed, sig: Buffer.from(ed.sig, "base64url").subarray(0, 63).toString("base64url") }, edCredential, edChallenge)).toEqual({ ok: false, problem: "bad-signature" });
  });
});

describe("placements and packages (DEC-0050, DEC-0051)", () => {
  it("gives verifyPackage the publisher key a placement names, and nothing for an agent not placed", () => {
    const trust = placementTrust(first, "m-4c1e", agentPkg.agentRef);
    expect(trust?.publisher).toEqual([first.publisherKeys[0]]);
    expect(verifyPackage(agentPkg, trust as NonNullable<typeof trust>)).toMatchObject({ ok: true, digest: first.machines[0].packages[0].digest });
    expect(placementTrust(first, "m-4c1e", "urn:fabric:agent:example:other")).toBeUndefined();
    expect(placementTrust(first, "m-0000", agentPkg.agentRef)).toBeUndefined();
  });

  it("places the positive package by its digest on both machines of the first revision", () => {
    for (const machine of first.machines) expect(machine.packages[0]).toEqual({ agentRef: agentPkg.agentRef, digest: agentPkg.digest, publisherKid: agentPkg.signatures[0].kid });
    expect(codes("estate-placement", { record: first, machine: "m-4c1e", package: agentPkg })).toEqual([]);
  });
});

describe("the estate record in the repository's checks", () => {
  it("keeps the second revision chained to the first, signed by the recovery passkey", () => {
    expect(second.parent).toBe(first.digest);
    expect(second.revocations).toEqual([{ kind: "machine", ref: "m-9a07", revokedAt: "2026-10-20T09:00:00Z" }]);
    expect(codes("estate-record-revision", { parent: first, next: second })).toEqual([]);
    expect(second.signature.credentialId).toBe(first.authorities[1].credentialId);
  });

});
