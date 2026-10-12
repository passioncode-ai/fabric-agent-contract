import { createPrivateKey, createPublicKey, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { createMemoryJtiStore, verifyApproval, verifyDelegation, verifyMeterToken, type Jwks } from "../src/delegation.js";
import { estateRecordDigest, verifyEstateRecord } from "../src/estate-record-rules.js";
import { hubKeyCertified, type AppliedRevision } from "../src/hub-key-rules.js";
import { strictTime } from "../src/rfc3339.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0060 (DL-14, DL-HUBKEY): a delegation verifier that reads the estate record trusts a token's kid only while the
// revision it reads certifies it, refuses a revision lower than the one its machine applied, and names whose fault it is.
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const vectors = read("fixtures/vectors/hub-key.json");
const second = read("fixtures/positive/estate-record-second.json");
const first = read("fixtures/positive/estate-record-first.json");
const third = vectors.revisions["3"] as Json;
const K1 = "hub-m-4c1e-1";
const X1 = vectors.hubKeys[K1].x as string;
const X2 = vectors.hubKeys["hub-m-4c1e-2"].x as string;
const AT = Date.parse("2026-10-25T09:00:00Z") / 1000;
const AT3 = Date.parse("2026-10-28T09:00:00Z") / 1000;
const jwks = vectors.jwks as Jwks;
const ISSUER = vectors.issuer as string;
const PKCS8 = Buffer.from("302e020100300506032b657004220420", "hex");
const privateKey = (seed: string) => createPrivateKey({ key: Buffer.concat([PKCS8, Buffer.from(seed, "hex")]), format: "der", type: "pkcs8" });
const verdict = (record: unknown, at: Date | number = AT, kid: unknown = K1, x: unknown = X1, applied?: AppliedRevision) => {
  const answer = hubKeyCertified(record, kid, x, at, applied);
  return answer.certified ? `certified ${answer.machine} ${answer.revision}` : `${answer.fault}/${answer.detail}`;
};
const variant = (patch: (record: Json) => void): Json => {
  const record = JSON.parse(JSON.stringify(second)) as Json;
  patch(record);
  return record;
};
const refusal = (result: { ok: boolean; code?: string; detail?: string }) => (result.ok ? "ok" : `${result.code}/${result.detail}`);
const delegation = (token: string, extra: Json = {}, now: unknown = AT + 30) =>
  refusal(verifyDelegation(token, { audience: "example-media", jwks, now: now as number, capability: "media.render", effect: "draft", issuer: ISSUER, ...extra }));
const approval = (document: string, extra: Json = {}, now: unknown = AT + 30) =>
  refusal(verifyApproval(document, { audience: "example-media", jwks, now: now as number, actionDigest: vectors.actionDigest, issuer: ISSUER, jtiStore: createMemoryJtiStore(), ...extra }));
const token = vectors.verifier[0].token as string;
const approvalDocument = (vectors.verifier as Json[]).find((entry) => entry.document === "approval")?.token as string;

describe("the revocation delta on top of the revision (DEC-0054, extraRevocations)", () => {
  it("revokes the hub key or its machine as the revision's own revocations do, and refuses a non-array as unreadable", () => {
    const extra = (revocations: unknown) => {
      const answer = hubKeyCertified(second, K1, X1, AT, undefined, { extraRevocations: revocations as unknown[] });
      return answer.certified ? "certified" : `${answer.fault}/${answer.detail}`;
    };
    expect(extra([])).toBe("certified");
    expect(extra([{ kind: "hub-key", ref: K1, revokedAt: "2026-10-21T09:00:00Z" }])).toBe("token/kid-not-certified");
    expect(extra([{ kind: "machine", ref: "m-4c1e", revokedAt: "2026-10-21T09:00:00Z" }])).toBe("token/kid-not-certified");
    expect(extra([{ kind: "machine", ref: "m-other", revokedAt: "2026-10-21T09:00:00Z" }, null, 7])).toBe("certified");
    expect(extra("hub-key")).toBe("estate/estate-unreadable");
    expect(extra({ length: 1 })).toBe("estate/estate-unreadable");
  });

  it("reaches the verifiers through estateRevocations, a list or a function", () => {
    const revoked = [{ kind: "hub-key", ref: K1, revokedAt: "2026-10-21T09:00:00Z" }];
    expect(delegation(token, { estate: second })).toBe("ok");
    expect(delegation(token, { estate: second, estateRevocations: revoked })).toBe("unauthenticated/kid-not-certified");
    expect(delegation(token, { estate: second, estateRevocations: () => revoked })).toBe("unauthenticated/kid-not-certified");
    expect(delegation(token, { estate: second, estateRevocations: () => { throw new Error("unreadable"); } })).toBe("issuer-unavailable/estate-unreadable");
    expect(approval(approvalDocument, { estate: second, estateRevocations: revoked })).toBe("approval-invalid/kid-not-certified");
  });
});

describe("the vectors (fixtures/vectors/hub-key.json)", () => {
  it.each(vectors.cases as Json[])("$name", (entry) => {
    const options = entry.extraRevocations === undefined ? undefined : { extraRevocations: entry.extraRevocations };
    expect(hubKeyCertified(entry.record, entry.kid, entry.x, entry.at, entry.applied, options)).toEqual(entry.expected);
  });

  it.each(vectors.verifier as Json[])("verifier: $name", (entry) => {
    const estate = entry.estate === undefined ? {} : { estate: "throws" in entry.estate ? () => { throw new Error("unreadable"); } : entry.estate.record };
    const applied = entry.estateApplied === undefined ? {} : { estateApplied: entry.estateApplied };
    const got = entry.document === "delegation" ? delegation(entry.token, { ...estate, ...applied }, entry.now) : approval(entry.token, { ...estate, ...applied }, entry.now);
    expect(got).toBe(entry.expected.ok ? "ok" : `${entry.expected.code}/${entry.expected.detail}`);
  });

  it("holds every detail, each fault and the cases a lax port gets wrong", () => {
    const details = new Set((vectors.cases as Json[]).map((entry) => (entry.expected.certified ? "certified" : entry.expected.detail)));
    expect([...details].sort()).toEqual(["certified", "estate-forked", "estate-outside-window", "estate-rolled-back", "estate-unreadable", "kid-not-certified", "no-clock"]);
    const names = (vectors.cases as Json[]).map((entry) => entry.name as string).join("\n");
    for (const lax of ["2^53", "another case", "without x", "x null", "numeric kid", "two machines", "not an array", "space", "does not exist", "leap second", "lower-case", "+02:00", "30 days and one second"]) expect(names).toContain(lax);
    const codes = new Set((vectors.verifier as Json[]).map((entry) => (entry.expected.ok ? "ok" : entry.expected.code)));
    expect([...codes].sort()).toEqual(["approval-invalid", "issuer-unavailable", "ok", "unauthenticated", "unknown-state"]);
  });

  it("reproduces every token from the hub seeds (Ed25519 is deterministic), and the second hub key from its label", () => {
    for (const entry of vectors.verifier as Json[]) {
      const [header, payload, signature] = (entry.token as string).split(".") as [string, string, string];
      const kid = JSON.parse(Buffer.from(header, "base64url").toString("utf8")).kid as string;
      const fresh = sign(null, Buffer.from(`${header}.${payload}`), privateKey(vectors.hubKeys[kid].seed)).toString("base64url");
      if (entry.expected.detail === "bad-signature") expect(fresh).not.toBe(signature);
      else expect(fresh).toBe(signature);
    }
    for (const [kid, key] of Object.entries(vectors.hubKeys as Record<string, Json>)) {
      expect((createPublicKey(privateKey(key.seed)).export({ format: "jwk" }) as Json).x, kid).toBe(key.x);
    }
  });

  it("revision 3 is a real successor: verifyEstateRecord accepts it against revision 2, which it accepts against revision 1", () => {
    const at = new Date("2026-10-28T09:00:00Z");
    expect(verifyEstateRecord(second, { parent: first, at })).toMatchObject({ ok: true, revision: 2 });
    expect(verifyEstateRecord(third, { parent: second, at })).toMatchObject({ ok: true, revision: 3 });
    expect(third.digest).toBe(estateRecordDigest(third));
    expect(read("fixtures/vectors/estate-record.json").keys.hub.x).toBe(X1);
  });
});

describe("hubKeyCertified (DL-14)", () => {
  it("takes the clock as a Date or as seconds, and refuses one that is neither before reading the record", () => {
    expect(verdict(second, new Date(AT * 1000))).toBe("certified m-4c1e 2");
    expect(verdict(second, AT)).toBe("certified m-4c1e 2");
    for (const clock of [Number.NaN, Number.POSITIVE_INFINITY, new Date(Number.NaN), "2026-10-25T09:00:00Z", null]) {
      expect(verdict(null, clock as number)).toBe("clock/no-clock");
    }
  });

  it("reads the window to the millisecond: an offset and a fraction are instants", () => {
    const record = variant((r) => { r.validUntil = "2026-11-19T09:59:59.5+01:00"; });
    const until = Date.parse("2026-11-19T08:59:59.5Z");
    expect(verdict(record, new Date(until))).toBe("certified m-4c1e 2");
    expect(verdict(record, new Date(until + 1))).toBe("estate/estate-outside-window");
  });

  it("checks the trust source before the token: an unreadable or stale revision blames neither the kid nor the key", () => {
    const stale = variant((r) => { r.revocations.push({ kind: "hub-key", ref: K1, revokedAt: "2026-10-20T09:00:00Z" }); });
    expect(verdict(stale, Date.parse(second.validUntil) / 1000 + 1)).toBe("estate/estate-outside-window");
    expect(verdict(stale, AT, K1, X1, { revision: 3 })).toBe("estate/estate-rolled-back");
    expect(verdict(stale)).toBe("token/kid-not-certified");
  });

  it("ignores revocation entries that are not objects, and machines that are not objects or carry no hubKey", () => {
    const record = variant((r) => {
      r.revocations.push(null, "hub-key hub-m-4c1e-1", ["hub-key", K1]);
      r.machines.unshift(null, 7, { id: "m-0000", deviceKeys: [] }, { id: "m-0001", hubKey: "hub-m-4c1e-1" });
    });
    expect(verdict(record)).toBe("certified m-4c1e 2");
  });

  it("refuses a kid or key that matches only by type coercion", () => {
    expect(verdict(variant((r) => { r.machines[0].hubKey.kid = 1; }), AT, "1")).toBe("token/kid-not-certified");
    expect(verdict(second, AT, K1, { toString: () => X1 })).toBe("token/kid-not-certified");
    expect(verdict(variant((r) => { r.machines[0].id = 7; r.revocations.push({ kind: "machine", ref: "7", revokedAt: "2026-10-20T09:00:00Z" }); }))).toBe("certified 7 2");
  });

  it("answers the applied mark's boundaries: the same revision passes, one lower is a rollback, one higher passes", () => {
    expect(verdict(second, AT, K1, X1, { revision: 2 })).toBe("certified m-4c1e 2");
    expect(verdict(second, AT, K1, X1, { revision: 3 })).toBe("estate/estate-rolled-back");
    expect(verdict(second, AT, K1, X1, { revision: 1 })).toBe("certified m-4c1e 2");
    for (const mark of [null, 2, { revision: 0 }, { revision: 2.5 }, { revision: 2, digest: null }]) expect(verdict(second, AT, K1, X1, mark as unknown as AppliedRevision)).toBe("estate/estate-unreadable");
  });
});

describe("the verifiers' estate option (DL-13 row 4a)", () => {
  it("reads a function's revision on each call, and treats a function that answers nothing as unreadable", () => {
    let current: unknown = second;
    const source = () => current;
    expect(delegation(token, { estate: source })).toBe("ok");
    current = variant((r) => { r.machines[0].hubKey.x = X2; });
    expect(delegation(token, { estate: source })).toBe("unauthenticated/kid-not-certified");
    current = undefined;
    expect(delegation(token, { estate: source })).toBe("issuer-unavailable/estate-unreadable");
  });

  it("an approval maps each fault: the token's to approval-invalid, the trust source's to issuer-unavailable", () => {
    expect(approval(approvalDocument, { estate: second })).toBe("ok");
    // At revision 3's time the approval has expired, but the estate row comes before the time rows.
    expect(approval(approvalDocument, { estate: third }, AT3)).toBe("approval-invalid/kid-not-certified");
    expect(approval(approvalDocument, { estate: () => { throw new Error("gone"); } })).toBe("issuer-unavailable/estate-unreadable");
    expect(approval(approvalDocument, { estate: second, estateApplied: { revision: 2, digest: third.digest } })).toBe("issuer-unavailable/estate-forked");
  });

  it("the meter maps an uncertified kid to principal-unproven, naming the verifier's code and detail", () => {
    const meterToken = (() => {
      const claims = { iss: ISSUER, sub: "urn:person:operator", act: { sub: "example-media", act: { sub: "example-agent" } }, aud: "example-meter", scope: "grant.check", effect: ["none"], grant: ["grant-example-media#1"], project: "urn:project:example", iat: AT, exp: AT + 600, jti: "hub-key-test-meter-0001" };
      const input = `${Buffer.from(JSON.stringify({ alg: "EdDSA", typ: "fabric-delegation+jwt", kid: K1 })).toString("base64url")}.${Buffer.from(JSON.stringify(claims)).toString("base64url")}`;
      return `${input}.${sign(null, Buffer.from(input), privateKey(vectors.hubKeys[K1].seed)).toString("base64url")}`;
    })();
    const meter = { meter: "example-meter", capability: "grant.check", jwks, now: AT + 30, issuer: ISSUER };
    expect(verifyMeterToken(meterToken, { ...meter, estate: second }).ok).toBe(true);
    expect(verifyMeterToken(meterToken, meter).ok).toBe(true);
    const refused = verifyMeterToken(meterToken, { ...meter, estate: second, estateApplied: { revision: 3 } });
    expect(refused.ok ? "ok" : refused.denial.reason).toBe("the meter's token was refused: issuer-unavailable (estate-rolled-back)");
    const uncertified = verifyMeterToken(meterToken, { ...meter, now: AT3, estate: third });
    expect(uncertified.ok ? "ok" : uncertified.denial.reason).toBe("the meter's token was refused: unauthenticated (kid-not-certified)");
    const deltaRevoked = verifyMeterToken(meterToken, { ...meter, estate: second, estateRevocations: [{ kind: "machine", ref: "m-4c1e", revokedAt: "2026-10-21T09:00:00Z" }] });
    expect(deltaRevoked.ok ? "ok" : deltaRevoked.denial.reason).toBe("the meter's token was refused: unauthenticated (kid-not-certified)");
  });
});

describe("an unreadable clock is refused before row 1 (DEC-0060 item 6)", () => {
  it("a delegation token: NaN, infinity, text and a NumericDate outside a Date's range", () => {
    for (const now of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, "1792573230", null, 8.64e12 + 1, -8.64e12 - 1]) expect(delegation(token, {}, now), String(now)).toBe("unknown-state/no-clock");
    // The range's edges are clocks; the token is long expired by then.
    expect(delegation(token, {}, 8.64e12)).toBe("token-expired/expired");
    expect(delegation(token, {}, -8.64e12)).toBe("unauthenticated/issued-in-future");
  });

  it("an approval: after a missing approval and a missing store, before the issuer", () => {
    expect(approval(approvalDocument, {}, Number.NaN)).toBe("unknown-state/no-clock");
    expect(refusal(verifyApproval(undefined, { audience: "example-media", jwks, now: Number.NaN, actionDigest: vectors.actionDigest, issuer: ISSUER, jtiStore: createMemoryJtiStore() }))).toBe("approval-required/no-approval");
    expect(refusal(verifyApproval(approvalDocument, { audience: "example-media", jwks, now: Number.NaN, actionDigest: vectors.actionDigest, issuer: ISSUER, jtiStore: undefined as never }))).toBe("unknown-state/no-jti-store");
    expect(refusal(verifyApproval(approvalDocument, { audience: "example-media", jwks, now: Number.NaN, actionDigest: vectors.actionDigest, issuer: undefined as never, jtiStore: createMemoryJtiStore() }))).toBe("unknown-state/no-clock");
  });

  it("the meter answers a denial with a readable checkedAt even when its clock is not", () => {
    const refused = verifyMeterToken(token, { meter: "example-meter", capability: "grant.check", jwks, now: Number.NaN, issuer: ISSUER });
    expect(refused.ok).toBe(false);
    if (!refused.ok) {
      expect(refused.denial.reason).toBe("the meter's token was refused: unknown-state (no-clock)");
      expect(Number.isNaN(strictTime(refused.denial.checkedAt))).toBe(false);
    }
  });
});

describe("FAC-SEM-081 fixtures (delegation-hub-key)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("delegation-hub-key-"));
  const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];

  it("has passing and failing inputs", () => {
    const expects = files.map((name) => read(`fixtures/semantic/${name}`).expect as string[]);
    expect(expects.filter((codesOf) => codesOf.length === 0).length).toBeGreaterThanOrEqual(3);
    expect(expects.filter((codesOf) => codesOf.includes("FAC-SEM-081")).length).toBeGreaterThanOrEqual(4);
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = read(`fixtures/semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
  });

  it("reads extraRevocations in the rule's input (the revocation delta, DEC-0054)", () => {
    const base = { record: second, kid: K1, x: X1, at: "2026-10-22T09:00:00Z" };
    expect(codes("delegation-hub-key", { ...base, answer: "certified" })).toEqual([]);
    expect(codes("delegation-hub-key", { ...base, extraRevocations: [{ kind: "hub-key", ref: K1, revokedAt: "2026-10-21T09:00:00Z" }], answer: "kid-not-certified" })).toEqual([]);
    expect(codes("delegation-hub-key", { ...base, extraRevocations: [{ kind: "hub-key", ref: K1, revokedAt: "2026-10-21T09:00:00Z" }], answer: "certified" })).toEqual(["FAC-SEM-081"]);
  });

  it("names the answer DL-14 gives and whose fault it is", () => {
    const message = (input: Json) => evaluateSemanticRules("delegation-hub-key", input).map((finding) => finding.message).join("\n");
    expect(message({ record: second, kid: K1, x: X2, at: "2026-10-25T09:00:00Z", answer: "certified" })).toContain("kid-not-certified (the token's fault: unauthenticated");
    expect(message({ record: second, kid: K1, x: X1, at: "2026-11-20T09:00:00Z", answer: "certified" })).toContain("estate-outside-window (the trust source's fault: issuer-unavailable)");
    expect(message({ record: second, kid: K1, x: X1, at: "no clock", answer: "certified" })).toContain("no-clock (its own clock: unknown-state)");
    expect(message({ record: second, kid: K1, x: X1, at: "2026-10-25T09:00:00Z", answer: "kid-not-certified" })).toContain("revision 2 certifies this kid for machine m-4c1e");
    expect(evaluateSemanticRules("delegation-hub-key", "not an object")).toEqual([{ code: "FAC-SEM-000", instancePath: "", message: "value must be an object" }]);
  });
});

// DEC-0066 (the owner's ruling A): one estate-record window everywhere. A revision verifyEstateRecord admits at an
// instant certifies its hub key at that instant, and the 60 s issuedAt skew is the same constant in both.
describe("hubKeyCertified and verifyEstateRecord agree on the window", () => {
  const estate = read("fixtures/vectors/estate-record.json");
  const entry = (estate.cases as Json[]).find((c) => c.name === "checked at the instant it was issued (EdDSA, re-signed revision 1)") as Json;
  const record = entry.record as Json;
  const hub = (record.machines as Json[]).find((m) => m.hubKey)?.hubKey as Json;
  const issued = strictTime(record.issuedAt), until = strictTime(record.validUntil);

  it.each([
    ["60 s before issuedAt", issued - 60_000, true],
    ["60 s and 1 ms before issuedAt", issued - 60_001, false],
    ["one ms before issuedAt", issued - 1, true],
    ["at validUntil", until, true],
    ["one ms after validUntil", until + 1, false]
  ] as const)("%s", (_name, at, inside) => {
    const verified = verifyEstateRecord(record, { ...(entry.trust as Json), at: new Date(at) } as never);
    const certified = hubKeyCertified(record, hub.kid, hub.x, new Date(at));
    expect(verified.ok).toBe(inside);
    expect(certified.certified).toBe(inside);
    if (!inside) expect(certified).toMatchObject({ detail: "estate-outside-window" });
  });
});
