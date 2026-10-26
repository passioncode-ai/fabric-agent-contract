import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rfc8785 } from "../src/canonical.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  MAX_ATTESTATION_SECONDS,
  MAX_EXTENSIONS,
  MEMBERSHIP_STATUSES,
  ORG_KEY_SET_TYPE,
  ORG_MEMBERSHIP_TYPE,
  ORG_ROLES,
  REFRESH_SECONDS,
  orgKeySetSigningInput,
  orgKeySetWellFormed,
  orgMembershipSigningInput,
  orgMembershipWellFormed,
  verifyOrgKeySet,
  verifyOrgMembership
} from "../src/org-membership.js";
import { strictTime } from "../src/rfc3339.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { ORG_KEY_SET_FIELDS, ORG_MEMBERSHIP_FIELDS, SIGNING_STATEMENTS } from "../src/signing-challenges.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildOrgMembershipVectors } from "../tools/vectors/org-membership.js";

// DEC-0127: org-membership/1 and org-key-set/1, what an organization server states about one membership for one
// reader, the organization's key set under the root the person's estate pins, and the two verifiers.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const validator = await createValidator();
const valid = (value: unknown, schema: string) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const vectors = read(VECTOR_FILE);
const schema = read("schemas/org-membership.schema.json");
const keySetSchema = read("schemas/org-key-set.schema.json");
const BASE = read("fixtures/positive/org-membership.json");
const KEY_SET = read("fixtures/positive/org-key-set.json");
const SETS: Json = { ...vectors.keySets, ...vectors.handedKeySets };
const clock = (text: unknown) => new Date(strictTime(text));
const trustOf = (trust: Json | null) => (trust === null ? null : { ...trust, now: clock(trust.now), keySet: SETS[trust.keySet] });
const keyFrom = (seed: string) => createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed, "hex")]), format: "der", type: "pkcs8" });
const K2 = keyFrom(vectors.keys.k2.seed);
/** A document re-signed over its RFC 8785 form without `sig`: the test's signer, not the reference's. */
const resign = (doc: Json) => {
  const { sig: _sig, ...fields } = doc;
  return { ...doc, sig: sign(null, Buffer.from(rfc8785(fields), "utf8"), K2).toString("base64url") };
};
const TRUST = { now: new Date("2026-10-25T11:30:00Z"), org: "org:org-a", audience: "fabric-estate-5d0f1a", keySet: KEY_SET };

describe("the vectors (DEC-0127)", () => {
  it("are the generator's output", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildOrgMembershipVectors());
  });

  it.each(vectors.verify as Json[])("verify: $name", (vector) => {
    expect(verifyOrgMembership(vector.attestation, trustOf(vector.trust) as never)).toEqual(vector.expected);
  });

  it.each(vectors.keySetCases as Json[])("key set: $name", (vector) => {
    const set = typeof vector.keySet === "string" ? vectors.keySets[vector.keySet] : vector.keySet;
    expect(verifyOrgKeySet(set, vector.trust)).toEqual(vector.expected);
  });

  it("carries each signing input as the register states it", () => {
    expect(orgMembershipSigningInput(vectors.signingInput.attestation.document)?.toString("utf8")).toBe(vectors.signingInput.attestation.input);
    expect(orgKeySetSigningInput(vectors.signingInput.keySet.document)?.toString("utf8")).toBe(vectors.signingInput.keySet.input);
    expect(orgMembershipSigningInput({ ...BASE, type: "entitlement/1" })).toBeUndefined();
    expect(orgKeySetSigningInput(BASE)).toBeUndefined();
    expect(orgMembershipSigningInput("org-membership/1")).toBeUndefined();
  });
});

describe("the documents", () => {
  it("accepts the positive fixtures, and the rules pass them", () => {
    expect(valid(BASE, "org-membership")).toBe(true);
    expect(valid(KEY_SET, "org-key-set")).toBe(true);
    expect(codes("org-membership", BASE)).toEqual([]);
    expect(codes("org-key-set", KEY_SET)).toEqual([]);
  });

  it("keeps the register's field lists equal to each schema's members", () => {
    expect([...ORG_MEMBERSHIP_FIELDS, "type", "sig"].sort()).toEqual([...schema.required].sort());
    expect(Object.keys(schema.properties).sort()).toEqual([...schema.required].sort());
    expect([...ORG_KEY_SET_FIELDS, "type", "sig"].sort()).toEqual([...keySetSchema.required].sort());
    expect(SIGNING_STATEMENTS.get(ORG_MEMBERSHIP_TYPE)?.decision).toBe("DEC-0127");
    expect(SIGNING_STATEMENTS.get(ORG_KEY_SET_TYPE)?.decision).toBe("DEC-0127");
  });

  it("keeps the constants the schema states", () => {
    expect(schema.properties.role.enum).toEqual(ORG_ROLES);
    expect(schema.properties.status.enum).toEqual(MEMBERSHIP_STATUSES);
    expect(schema.properties.extensions.maxProperties).toBe(MAX_EXTENSIONS);
    expect(MAX_ATTESTATION_SECONDS).toBe(86_400);
    expect(REFRESH_SECONDS).toBe(900);
  });

  it("agrees with the schema on what is well formed", () => {
    const cases: Json[] = [
      BASE,
      { ...BASE, membershipEndsAt: "2026-12-31T00:00:00Z" },
      { ...BASE, extensions: { "orgs.example/seat": 3, "orgs.example/guest": false } },
      { ...BASE, role: "guest" },
      { ...BASE, status: "paused" },
      { ...BASE, external: "no" },
      { ...BASE, revision: 0 },
      { ...BASE, subject: "" },
      { ...BASE, org: "org:" },
      { ...BASE, membershipEndsAt: "soon" },
      { ...BASE, extensions: [] },
      { ...BASE, extensions: { "orgs.example/x": "a".repeat(257) } },
      { ...BASE, extensions: Object.fromEntries(Array.from({ length: 17 }, (_, index) => [`orgs.example/k${index}`, index])) },
      { ...BASE, issuer: "https://Orgs.example" }
    ];
    for (const doc of cases) expect(orgMembershipWellFormed(doc), JSON.stringify(doc).slice(0, 120)).toBe(valid(doc, "org-membership"));
  });

  it("refuses a key set whose structure FAC-SEM-146 refuses", () => {
    const keys = KEY_SET.keys as Json[];
    expect(orgKeySetWellFormed(KEY_SET)).toBe(true);
    expect(orgKeySetWellFormed({ ...KEY_SET, revoked: [keys[0]?.kid] })).toBe(false);
    expect(orgKeySetWellFormed({ ...KEY_SET, keys: [{ ...keys[0], notAfter: keys[0]?.notBefore }] })).toBe(false);
    expect(orgKeySetWellFormed({ ...KEY_SET, keys: [{ ...keys[0], extra: 1 }] })).toBe(false);
    expect(orgKeySetWellFormed({ ...KEY_SET, revoked: ["a", "a"] })).toBe(false);
    expect(codes("org-key-set", { ...KEY_SET, keys: [...keys, keys[0]] })).toEqual(["FAC-SEM-146"]);
    expect(codes("org-key-set", { ...KEY_SET, revoked: [keys[0]?.kid] })).toEqual(["FAC-SEM-146"]);
    expect(codes("org-key-set", { ...KEY_SET, keys: [{ ...keys[1], notAfter: keys[1]?.notBefore }] })).toEqual(["FAC-SEM-146"]);
    expect(codes("org-key-set", { ...KEY_SET, keys: [{ ...keys[1], notBefore: "late" }] })).toEqual(["FAC-SEM-146"]);
    expect(codes("org-key-set", { ...KEY_SET, keys: [{ ...keys[1], notAfter: "late" }] })).toEqual(["FAC-SEM-146"]);
    expect(codes("org-key-set", { ...KEY_SET, keys: [...keys, { ...keys[1], kid: "zero", x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }] })).toEqual(["FAC-SEM-146"]);
    expect(codes("org-key-set", { ...KEY_SET, issuedAt: "2027-06-01T00:00:00Z" })).toEqual(["FAC-SEM-146"]);
    // A revoked list that is not a list reads as empty: the schema refuses it, the rule adds nothing of its own.
    expect(codes("org-key-set", { ...KEY_SET, revoked: "none" })).toEqual([]);
  });

  it("flags an attestation's times FAC-SEM-145", () => {
    expect(codes("org-membership", { ...BASE, notBefore: "2026-10-25T10:00:00Z" })).toEqual(["FAC-SEM-145"]);
    expect(codes("org-membership", { ...BASE, expiresAt: BASE.notBefore })).toEqual(["FAC-SEM-145"]);
    expect(codes("org-membership", { ...BASE, issuedAt: "yesterday" })).toEqual(["FAC-SEM-145"]);
    expect(codes("org-membership", { ...BASE, membershipEndsAt: "later" })).toEqual(["FAC-SEM-145"]);
    expect(codes("org-membership", { ...BASE, membershipEndsAt: "2026-12-31T00:00:00Z" })).toEqual([]);
  });
});

describe("the verifiers' edges", () => {
  it("re-signed attestations: the test's signer agrees with the reference", () => {
    const owner = resign({ ...BASE, role: "owner", revision: 9 });
    expect(verifyOrgMembership(owner, TRUST)).toMatchObject({ ok: true, role: "owner", status: "active" });
  });

  it("refuses an unusable context before anything else", () => {
    expect(verifyOrgMembership(BASE, { ...TRUST, now: "2026-10-25T11:30:00Z" as never })).toEqual({ ok: false, problem: "no-clock" });
    expect(verifyOrgMembership(BASE, { ...TRUST, keySet: "r2" as never })).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyOrgMembership(BASE, { ...TRUST, held: { subject: "m-1", revision: 1, digest: "sha256:x" } })).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyOrgKeySet(KEY_SET, { root: { ...vectors.root, kid: "" } })).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyOrgKeySet(KEY_SET, { root: { ...vectors.root, x: 7 as never } })).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyOrgKeySet(KEY_SET, { root: vectors.root, held: { revision: 1, digest: "x" } })).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyOrgKeySet(KEY_SET, null as never)).toEqual({ ok: false, problem: "context-invalid" });
  });
});
