import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { MAX_AUTHORITY_SECONDS, ORG_AUTHORITY_TYPE, memberKeyOctets, orgAuthorityDigest, orgAuthorityFindings, orgAuthorityRules, verifyOrgAuthority } from "../src/org-authority.js";
import { orgKeySetWellFormed } from "../src/org-membership.js";
import { orgRelayAdmissionSet } from "../src/relay.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { SIGNING_STATEMENTS, signingChallenge } from "../src/signing-challenges.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0129: org-authority/1, an organization's member list, signed by an administrator's passkey the organization's
// root certifies in org-key-set/1, and the relay admission source it gives an organization's relay (DEC-0047, CT-37).
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const validator = await createValidator();
const valid = (value: unknown, schema: string) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const BASE = read("fixtures/positive/org-authority.json");
const KEY_SET = read("fixtures/positive/org-key-set.json");
const ADMIN = KEY_SET.administrators[0];
const AT = new Date("2026-10-27T00:00:00Z");
const ORG = "org:org-a";
const sha = (data: string | Buffer) => createHash("sha256").update(data).digest();
// The administrator's test passkey: its seed is published in tools/vectors/org-membership.ts, so anyone can sign with it.
const adminKey = createPrivateKey({
  key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), sha("fabric-agent-contract/vectors/org-membership/administrator-passkey")]),
  format: "der",
  type: "pkcs8"
});

/** `doc` signed afresh by the administrator's passkey over its own digest, so only the fields under test differ. */
function resign(doc: Json, options: { origin?: string; rpId?: string; credentialId?: string } = {}): Json {
  const { digest: _digest, signature: _signature, ...body } = doc;
  const digest = orgAuthorityDigest(body);
  const challenge = signingChallenge(ORG_AUTHORITY_TYPE, { digest }) as Buffer;
  const clientData = Buffer.from(JSON.stringify({ type: "webauthn.get", challenge: challenge.toString("base64url"), origin: options.origin ?? ADMIN.origins[0] }));
  const authData = Buffer.concat([sha(options.rpId ?? ADMIN.rpId), Buffer.from([0x05]), Buffer.alloc(4)]);
  const sig = sign(null, Buffer.concat([authData, sha(clientData)]), adminKey);
  return {
    ...body,
    digest,
    signature: { format: "webauthn-assertion", credentialId: options.credentialId ?? ADMIN.credentialId, alg: "EdDSA", authenticatorData: authData.toString("base64url"), clientDataJSON: clientData.toString("base64url"), sig: sig.toString("base64url") }
  };
}
const trust = (change: Json = {}) => ({ now: AT, org: ORG, keySet: KEY_SET, ...change });
const problem = (value: unknown, change: Json = {}) => {
  const verdict = verifyOrgAuthority(value, trust(change) as never);
  return verdict.ok ? "ok" : verdict.problem;
};

describe("the document (DEC-0129)", () => {
  it("is valid, passes every rule, and its fixture verifies under the key set's administrator", () => {
    expect(valid(BASE, "org-authority")).toBe(true);
    expect(codes("org-authority", BASE)).toEqual([]);
    expect(valid(KEY_SET, "org-key-set")).toBe(true);
    expect(codes("org-key-set", KEY_SET)).toEqual([]);
    const verdict = verifyOrgAuthority(BASE, trust());
    expect(verdict.ok && { revision: verdict.revision, signedBy: verdict.signedBy, unchanged: verdict.unchanged, members: verdict.members.length }).toEqual({ revision: 3, signedBy: ADMIN.credentialId, unchanged: false, members: 2 });
  });

  it("is signed by a passkey over the register's org-authority/1 challenge, derived from the digest", () => {
    expect(SIGNING_STATEMENTS.get(ORG_AUTHORITY_TYPE)).toMatchObject({ signer: "passkey", fields: ["digest"], decision: "DEC-0129" });
    expect(signingChallenge(ORG_AUTHORITY_TYPE, { digest: "sha256:zz" })).toBeUndefined();
    expect(orgAuthorityDigest(BASE)).toBe(BASE.digest);
  });

  it("names no person: a pairwise subject, an opaque iss, and keys", () => {
    const schema = read("schemas/org-authority.schema.json");
    expect(Object.keys(schema.$defs.member.properties)).toEqual(["subject", "role", "iss", "keys"]);
    expect(valid({ ...BASE, members: [{ ...BASE.members[0], email: "a@b.example" }] }, "org-authority")).toBe(false);
    expect(valid({ ...BASE, members: [{ ...BASE.members[0], keys: [{ kid: "en-1#kem", publicKey: BASE.members[0].keys[0].publicKey }] }] }, "org-authority")).toBe(false);
  });
});

describe("FAC-SEM-150", () => {
  const two = BASE.members as Json[];
  const cases: [string, Json, string[]][] = [
    ["an unreadable issuedAt", { issuedAt: "2026-10-26 00:00:00" }, ["/issuedAt"]],
    ["an unreadable expiresAt", { expiresAt: "2026-02-30T00:00:00Z" }, ["/expiresAt"]],
    ["an expiry before the issue", { expiresAt: "2026-10-25T00:00:00Z" }, ["/expiresAt"]],
    ["an expiry at the issue", { expiresAt: "2026-10-26T00:00:00Z" }, ["/expiresAt"]],
    ["a life over 7 days", { expiresAt: "2026-11-02T00:00:01Z" }, ["/expiresAt"]],
    ["a subject twice", { members: [two[0], { ...two[1], subject: two[0]?.subject }] }, ["/members/1/subject"]],
    ["an iss twice", { members: [two[0], { ...two[1], iss: two[0]?.iss }] }, ["/members/1/iss"]],
    ["a kid twice across members", { members: [two[0], { ...two[1], keys: [{ ...two[1]?.keys[0], kid: two[0]?.keys[0].kid }] }] }, ["/members/1/keys/0/kid"]],
    ["a key off the curve", { members: [{ ...two[0], keys: [{ kid: "en-1#sig", publicKey: `B${"A".repeat(85)}A=` }] }] }, ["/members/0/keys/0/publicKey"]]
  ];
  it.each(cases)("refuses %s", (_name, change, paths) => {
    const findings = orgAuthorityFindings({ ...BASE, ...change });
    expect(findings.map((finding) => finding.instancePath)).toEqual(paths);
    expect(findings.every((finding) => finding.code === "FAC-SEM-150")).toBe(true);
  });

  it("reads the window only when both ends are readable, and a key only when it is a string", () => {
    expect(orgAuthorityFindings({ ...BASE, issuedAt: 1, expiresAt: "2030-01-01T00:00:00Z" }).map((f) => f.instancePath)).toEqual(["/issuedAt"]);
    expect(orgAuthorityFindings({ ...BASE, members: [{ subject: "s", iss: "i", keys: [{ kid: "k#sig", publicKey: 1 }] }] })).toEqual([]);
    expect(orgAuthorityFindings({ ...BASE, members: "none" })).toEqual([]);
    expect(orgAuthorityRules("org-key-set", BASE)).toBeUndefined();
  });

  it("admits exactly the P-256 points SEC 1 accepts, in base64", () => {
    expect(memberKeyOctets(BASE.members[0].keys[0].publicKey)?.length).toBe(65);
    expect(memberKeyOctets(1)).toBeUndefined();
    expect(memberKeyOctets(Buffer.alloc(32).toString("base64"))).toBeUndefined();
    expect(memberKeyOctets(`B${"A".repeat(85)}A=`)).toBeUndefined();
  });
});

describe("org-key-set/1's administrators (DEC-0129, FAC-SEM-146)", () => {
  it("lists each credential once, under a signing RP with its origins within it", () => {
    const flagged = (administrators: unknown[]) => evaluateSemanticRules("org-key-set", { ...KEY_SET, administrators }).map((f) => [f.code, f.instancePath]);
    expect(flagged([ADMIN, ADMIN])).toEqual([["FAC-SEM-146", "/administrators/1/credentialId"]]);
    expect(flagged([{ ...ADMIN, rpId: "orgs.example" }])).toEqual([["FAC-SEM-146", "/administrators/0/rpId"]]);
    expect(flagged([{ ...ADMIN, origins: ["https://evil.example"] }])).toEqual([["FAC-SEM-146", "/administrators/0/origins/0"]]);
    expect(flagged([{ ...ADMIN, origins: "x" }])).toEqual([]);
  });

  it("is required, at most 16, each a credential in shape, or the set is malformed", () => {
    const { administrators: _a, ...without } = KEY_SET;
    expect(valid(without, "org-key-set")).toBe(false);
    expect(orgKeySetWellFormed(without)).toBe(false);
    expect(orgKeySetWellFormed({ ...KEY_SET, administrators: [] })).toBe(true);
    expect(orgKeySetWellFormed({ ...KEY_SET, administrators: Array.from({ length: 17 }, (_v, i) => ({ ...ADMIN, credentialId: `c${i}` })) })).toBe(false);
    for (const change of [{ credentialId: 1 }, { credentialId: "a".repeat(1367) }, { credentialId: "a+b" }, { alg: "RS256" }, { publicKey: "k" }, { rpId: 1 }, { origins: [1] }, { origins: "x" }, { extra: 1 }]) {
      expect(orgKeySetWellFormed({ ...KEY_SET, administrators: [{ ...ADMIN, ...change }] }), JSON.stringify(change)).toBe(false);
    }
    expect(orgKeySetWellFormed({ ...KEY_SET, administrators: [ADMIN, ADMIN] })).toBe(false);
    expect(orgKeySetWellFormed({ ...KEY_SET, administrators: "none" })).toBe(false);
  });
});

describe("verifyOrgAuthority (DEC-0129)", () => {
  it("refuses an unusable context and an unreadable clock", () => {
    expect(verifyOrgAuthority(BASE, null as never)).toEqual({ ok: false, problem: "context-invalid" });
    expect(problem(BASE, { now: "2026-10-27" })).toBe("no-clock");
    expect(problem(BASE, { now: new Date(Number.NaN) })).toBe("no-clock");
    for (const change of [{ org: 1 }, { org: "org-a" }, { keySet: null }, { keySet: { ...KEY_SET, administrators: "x" } }, { keySet: { ...KEY_SET, org: "org:org-b" } }, { held: 1 }, { held: { revision: 0, digest: BASE.digest } }, { held: { revision: 1.5, digest: BASE.digest } }, { held: { revision: 1, digest: 1 } }, { held: { revision: 1, digest: "sha256:x" } }]) {
      expect(problem(BASE, change), JSON.stringify(change)).toBe("context-invalid");
    }
  });

  it("refuses a malformed document before any key is used", () => {
    for (const value of [null, { ...BASE, type: "org-authority/2" }, { ...BASE, digest: 1 }, { ...BASE, revision: "3" }, { ...BASE, revision: 0 }, { ...BASE, members: {} }, { ...BASE, signature: "s" }, { ...BASE, signature: { ...BASE.signature, format: "jws" } }, { ...BASE, signature: { ...BASE.signature, credentialId: 1 } }, { ...BASE, extra: Number.NaN }]) {
      expect(problem(value), JSON.stringify(value)?.slice(0, 60)).toBe("malformed");
    }
  });

  it("refuses a changed document, another issuer or organization, and a signer the root does not certify", () => {
    expect(problem({ ...BASE, revision: 4 })).toBe("digest-mismatch");
    expect(problem(resign({ ...BASE, issuer: "https://other.example" }))).toBe("wrong-issuer");
    expect(problem(resign({ ...BASE, org: "org:org-b" }))).toBe("wrong-org");
    expect(problem(resign(BASE, { credentialId: "AAAA" }))).toBe("unknown-administrator");
    expect(problem(BASE, { keySet: { ...KEY_SET, administrators: [] } })).toBe("unknown-administrator");
  });

  it("verifies the assertion as a signing ceremony: the RP, the origin, the signature", () => {
    expect(problem(resign(BASE, { origin: "https://orgs.example" }))).toBe("wrong-origin");
    expect(problem(resign(BASE, { rpId: "orgs.example" }))).toBe("wrong-rp");
    expect(problem(BASE, { keySet: { ...KEY_SET, administrators: [{ ...ADMIN, rpId: "orgs.example", origins: ["https://orgs.example"] }] } })).toBe("wrong-rp");
    expect(problem({ ...BASE, signature: { ...BASE.signature, sig: Buffer.alloc(64).toString("base64url") } })).toBe("bad-signature");
  });

  it("holds the list to its window, with the clock skew before it and no grace after it", () => {
    expect(problem(resign({ ...BASE, issuedAt: "x" }))).toBe("too-long-lived");
    expect(problem(resign({ ...BASE, expiresAt: "x" }))).toBe("too-long-lived");
    expect(problem(resign({ ...BASE, expiresAt: BASE.issuedAt }))).toBe("too-long-lived");
    expect(problem(resign({ ...BASE, expiresAt: new Date(Date.parse(BASE.issuedAt) + MAX_AUTHORITY_SECONDS * 1000 + 1000).toISOString() }))).toBe("too-long-lived");
    expect(problem(BASE, { now: new Date("2026-10-25T23:58:59Z") })).toBe("not-yet-valid");
    expect(problem(BASE, { now: new Date("2026-10-25T23:59:00Z") })).toBe("ok");
    expect(problem(BASE, { now: new Date("2026-11-02T00:00:00Z") })).toBe("expired");
  });

  it("refuses a list that breaks FAC-SEM-150, naming the code", () => {
    const twice = resign({ ...BASE, members: [BASE.members[0], { ...BASE.members[1], subject: BASE.members[0].subject }] });
    expect(verifyOrgAuthority(twice, trust())).toEqual({ ok: false, problem: "rule-violation", codes: ["FAC-SEM-150"] });
  });

  it("refuses a lower revision and the same revision with other bytes, and reports the same list unchanged", () => {
    expect(problem(BASE, { held: { revision: 4, digest: BASE.digest } })).toBe("stale-revision");
    expect(problem(BASE, { held: { revision: 3, digest: `sha256:${"0".repeat(64)}` } })).toBe("revision-conflict");
    const same = verifyOrgAuthority(BASE, trust({ held: { revision: 3, digest: BASE.digest } }));
    expect(same.ok && same.unchanged).toBe(true);
    const newer = verifyOrgAuthority(BASE, trust({ held: { revision: 2, digest: `sha256:${"0".repeat(64)}` } }));
    expect(newer.ok && newer.held).toEqual({ revision: 3, digest: BASE.digest });
  });
});

describe("orgRelayAdmissionSet: an organization's relay admits from its member list (DEC-0129, DEC-0047)", () => {
  const schemaValid = (doc: unknown) => valid(doc, "org-authority");
  const admit = (change: Json) => orgRelayAdmissionSet({ org: ORG, keySet: KEY_SET, at: AT, schemaValid, ...change } as never);

  it("admits every listed #sig key from a verified list, and keeps it as held", () => {
    const result = admit({ candidate: BASE });
    expect(result.ok && [...result.set.keys()]).toEqual(["en-71c4e2a9#sig", "en-0d93fb16#sig", "en-3b8e5c21#sig"]);
    expect(result.ok && result.held).toBe(BASE);
    expect(result.ok && result.revision).toBe(3);
    const again = admit({ held: BASE });
    expect(again.ok && again.set.size).toBe(3);
  });

  it("drops a member the next revision leaves out, against the list held", () => {
    const next = resign({ ...BASE, revision: 4, members: [BASE.members[1]] });
    const result = admit({ held: BASE, candidate: next });
    expect(result.ok && [...result.set.keys()]).toEqual(["en-3b8e5c21#sig"]);
    expect(admit({ held: next, candidate: BASE })).toEqual({ ok: false, refusal: "unverified", problem: "stale-revision" });
  });

  it("fails closed: no list, an invalid or unverified candidate, a list out of its window, a signer no longer certified", () => {
    expect(admit({})).toEqual({ ok: false, refusal: "no-record" });
    expect(admit({ candidate: { ...BASE, members: undefined } })).toEqual({ ok: false, refusal: "invalid" });
    expect(admit({ candidate: { ...BASE, revision: 9 } })).toEqual({ ok: false, refusal: "unverified", problem: "digest-mismatch" });
    expect(admit({ held: BASE, at: new Date("2026-11-03T00:00:00Z") })).toEqual({ ok: false, refusal: "expired" });
    expect(admit({ held: BASE, at: new Date("2026-10-20T00:00:00Z") })).toEqual({ ok: false, refusal: "not-yet-valid" });
    expect(admit({ held: BASE, keySet: { ...KEY_SET, administrators: [] } })).toEqual({ ok: false, refusal: "unverified", problem: "unknown-administrator" });
  });

  it("reads a held list that was never schema-checked without throwing, and admits only usable keys", () => {
    expect(admit({ held: { ...BASE, revision: Number.NaN }, candidate: BASE }).ok).toBe(true);
    expect(admit({ held: "x", candidate: BASE }).ok).toBe(true);
    const odd = resign({ ...BASE, members: [{ ...BASE.members[0], keys: [{ kid: "en-x#sig", publicKey: 1 }, "k", { kid: 1, publicKey: BASE.members[0].keys[0].publicKey }] }, { ...BASE.members[1], keys: "none" }] });
    const result = admit({ held: odd });
    expect(result.ok && result.set.size).toBe(0);
  });
});
