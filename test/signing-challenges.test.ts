import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { estateChallenge, estateChallengeInput } from "../src/estate-record-rules.js";
import { packageSigningInput } from "../src/package-rules.js";
import { relayAuthSigningInput, relayBlobSigningInput } from "../src/relay.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import {
  SIGNING_STATEMENTS,
  WINDOW_LEASE_FIELDS,
  isSigningRpId,
  originWithin,
  signingChallenge,
  signingCredentialFindings,
  signingStatement,
  verifySigningAssertion
} from "../src/signing-challenges.js";
import { windowLeaseSigningInput } from "../src/window-lease.js";

// DEC-0063: one register of signed statements, each the RFC 8785 form of {type, ...fields}; a passkey signs its
// SHA-256 as the WebAuthn challenge, under a dedicated signing RP.
const root = projectRoot();
type Json = Record<string, any>;
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const vectors = load("vectors/signing-challenges.json");
const estateVectors = load("vectors/estate-record.json");
const conformance = readFileSync(path.join(root, "docs/specification/conformance.md"), "utf8");
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const statement = (type: string) => (vectors.statements as Json[]).find((entry) => entry.type === type) as Json;

describe("the register (DEC-0063)", () => {
  it("names v4 §7's four challenge types, the package statement and every typed statement a key signs", () => {
    expect([...SIGNING_STATEMENTS.keys()]).toEqual([
      "estate-revision/1", "org-countersign/1", "share-grant/1", "limits/1", "fabric-package-signature/1", "window-lease/1", "relay-auth/1", "relay-blob/1"
    ]);
    const passkey = [...SIGNING_STATEMENTS].filter(([, spec]) => spec.signer === "passkey").map(([type]) => type);
    expect(passkey).toEqual(["estate-revision/1", "org-countersign/1", "share-grant/1", "limits/1"]);
  });

  it("is the table in conformance.md: each type, its fields, its signer and its decision", () => {
    const section = conformance.slice(conformance.indexOf("## Signing challenges"), conformance.indexOf("## Semantic rule codes"));
    const rows = [...section.matchAll(/^\| `([a-z-]+\/\d+)` \| ([^|]+) \| ([^|]+) \|[^|]*\|[^|]*\| (DEC-\d{4})/gm)];
    expect(rows.map((row) => row[1])).toEqual([...SIGNING_STATEMENTS.keys()]);
    for (const row of rows) {
      const spec = SIGNING_STATEMENTS.get(row[1] as string);
      const fields = [...(row[2] ?? "").matchAll(/`([a-zA-Z]+)`/g)].map((match) => match[1]);
      expect(fields, row[1]).toEqual(spec?.fields[0] === "leaseId" ? ["type", "sig"] : [...(spec?.fields ?? [])]);
      expect(row[3]?.trim().startsWith(spec?.signer === "passkey" ? "a passkey" : "a key"), row[1]).toBe(true);
      expect(row[4], row[1]).toBe(spec?.decision);
    }
  });

  it("gives the bytes each defining module signs: the estate challenge, the package statement, the lease, the relay's two", () => {
    expect(statement("estate-revision/1").statement).toBe(estateVectors.challenge.input);
    expect(statement("estate-revision/1").challenge).toBe(estateVectors.challenge.challenge);
    const digest = statement("estate-revision/1").fields.digest as string;
    expect(signingStatement("estate-revision/1", { digest })?.equals(estateChallengeInput(digest))).toBe(true);
    expect(signingChallenge("estate-revision/1", { digest })?.equals(estateChallenge(digest))).toBe(true);
    const pkg = statement("fabric-package-signature/1").fields;
    expect(statement("fabric-package-signature/1").statement).toBe(packageSigningInput(pkg.digest, pkg.role).toString("utf8"));
    const lease = load("positive/window-lease.json");
    expect(statement("window-lease/1").statement).toBe(windowLeaseSigningInput(lease)?.toString("utf8"));
    expect([...WINDOW_LEASE_FIELDS, "type", "sig"].sort()).toEqual(Object.keys(lease).sort());
    const auth = statement("relay-auth/1").fields;
    expect(statement("relay-auth/1").statement).toBe(relayAuthSigningInput(auth as never));
    const blob = statement("relay-blob/1").fields;
    expect(statement("relay-blob/1").statement).toBe(relayBlobSigningInput(blob as never));
  });

  it.each(vectors.statements as Json[])("statement: $type", (entry) => {
    expect(signingStatement(entry.type, entry.fields)?.toString("utf8")).toBe(entry.statement);
    expect(JSON.parse(entry.statement).type).toBe(entry.type);
    const challenge = signingChallenge(entry.type, entry.fields);
    expect(challenge?.toString("base64url") ?? null).toBe(entry.challenge);
    if (challenge) expect(challenge.equals(createHash("sha256").update(entry.statement, "utf8").digest())).toBe(true);
  });

  it.each(vectors.refusals as Json[])("no statement: $why", (entry) => {
    expect(signingStatement(entry.type, entry.fields)).toBeUndefined();
    expect(signingChallenge(entry.type, entry.fields)).toBeUndefined();
  });

  it.each(vectors.noChallenge as Json[])("no challenge: $why ($type)", (entry) => {
    expect(signingChallenge(entry.type, entry.fields)).toBeUndefined();
  });

  it("has no statement for fields that are not an object or a value RFC 8785 has no form for", () => {
    expect(signingStatement("estate-revision/1", null)).toBeUndefined();
    expect(signingStatement("estate-revision/1", ["digest"])).toBeUndefined();
    expect(signingStatement("relay-auth/1", { ...statement("relay-auth/1").fields, iat: Number.NaN })).toBeUndefined();
    expect(signingStatement("constructor", {})).toBeUndefined();
  });

  it("keeps one type per statement: a challenge never equals another type's over the same fields", () => {
    const fields = statement("estate-revision/1").fields;
    const asLimits = signingChallenge("limits/1", { scope: "estate:estate-5d0f1a", digest: fields.digest });
    expect(asLimits?.equals(signingChallenge("estate-revision/1", fields) as Buffer)).toBe(false);
  });
});

describe("the signing RP (DEC-0063)", () => {
  it.each(vectors.rpIds as Json[])("RP ID $rpId is a signing RP: $signing", (entry) => {
    expect(isSigningRpId(entry.rpId)).toBe(entry.signing);
  });

  it.each(vectors.origins as Json[])("origin $origin is within $rpId: $within", (entry) => {
    expect(originWithin(entry.origin, entry.rpId)).toBe(entry.within);
  });

  it("refuses a non-string RP ID or origin, and an RP ID over 253 characters", () => {
    expect(isSigningRpId(7)).toBe(false);
    expect(originWithin(7, "sign.example.org")).toBe(false);
    const long = `sign.${"a".repeat(61)}.${"b".repeat(61)}.${"c".repeat(61)}.${"d".repeat(61)}.org`;
    expect(long.length).toBe(256);
    expect(isSigningRpId(long)).toBe(false);
    const at253 = `sign.${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(52)}.org`;
    expect(at253.length).toBe(253);
    expect(isSigningRpId(at253)).toBe(true);
    expect(isSigningRpId(at253.replace(".org", "e.org"))).toBe(false);
  });

  it.each(vectors.assertions as Json[])("assertion: $name", (entry) => {
    expect(verifySigningAssertion(entry.assertion, entry.credential, entry.type, entry.fields)).toEqual(entry.expected);
  });

  it("reproduces the share grant's assertion from the EdDSA passkey's seed", () => {
    const key = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(estateVectors.keys.passkeyEdDSA.seed, "hex")]), format: "der", type: "pkcs8" });
    const entry = (vectors.assertions as Json[])[0] as Json;
    const data = Buffer.concat([Buffer.from(entry.assertion.authenticatorData, "base64url"), createHash("sha256").update(Buffer.from(entry.assertion.clientDataJSON, "base64url")).digest()]);
    expect(sign(null, data, key).toString("base64url")).toBe(entry.assertion.sig);
  });

  it("is checked by the estate record's verifier: a sign-in credential is wrong-rp, an origin outside is wrong-origin", () => {
    const problems = (estateVectors.cases as Json[]).filter((entry) => /sign-in credential \(RP ID example\.org\)|outside the signing RP ID/.test(entry.name)).map((entry) => entry.expected.problem);
    expect(problems).toEqual(["wrong-rp", "wrong-origin"]);
  });
});

describe("signing-credential semantic fixtures (FAC-SEM-092)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("signing-credential-"));

  it("has passing and failing inputs", () => {
    const expected = files.map((name) => load(`semantic/${name}`).expect as string[]);
    expect(expected.filter((codesOf) => codesOf.length === 0).length).toBeGreaterThanOrEqual(2);
    expect(expected.filter((codesOf) => codesOf.includes("FAC-SEM-092")).length).toBeGreaterThanOrEqual(5);
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = load(`semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
  });

  it("names where the credential fails, and stops at an RP ID that is not a signing RP", () => {
    expect(signingCredentialFindings({ rpId: "example.org", origins: ["https://evil.example"] }, "/authorities/0").map((finding) => finding.instancePath)).toEqual(["/authorities/0/rpId"]);
    expect(signingCredentialFindings({ rpId: "sign.example.org", origins: ["https://sign.example.org", "https://app.example.org"] }, "").map((finding) => finding.instancePath)).toEqual(["/origins/1"]);
    expect(signingCredentialFindings(null, "")).toHaveLength(1);
    expect(signingCredentialFindings({ rpId: "sign.example.org", origins: "https://sign.example.org" }, "")).toEqual([]);
  });
});

describe("statement fields at their exact limits (owed readings of #65)", () => {
  it("refuses a renamed field even when the count is right", () => {
    const auth = statement("relay-auth/1").fields as Record<string, unknown>;
    const { iat, ...rest } = auth;
    expect(signingStatement("relay-auth/1", { ...rest, issuedAt: iat })).toBeUndefined();
  });
  it("refuses a jkt whose last character cannot end 32 bytes, and a grant at revision 0", () => {
    const grant = statement("share-grant/1").fields as Record<string, string>;
    expect(signingStatement("share-grant/1", grant)).toBeDefined();
    expect(signingStatement("share-grant/1", { ...grant, jkt: `${String(grant.jkt).slice(0, -1)}B` })).toBeUndefined();
    expect(signingStatement("share-grant/1", { ...grant, grant: String(grant.grant).replace(/#\d+$/, "#0") })).toBeUndefined();
  });
});
