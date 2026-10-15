import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { ENROLL_PURPOSE, MAX_ENROLL_TOKEN_SECONDS, enrollJoinInput, redeemEnrollToken, verifyEnrollToken } from "../src/enroll-token.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { SIGNING_STATEMENTS, signingChallenge, signingStatement } from "../src/signing-challenges.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildEnrollTokenVectors } from "../tools/vectors/enroll-token.js";

// DEC-0084: enroll-token/1 — a headless machine joins with a one-time, 15-minute token Fabric signs with the person's
// signing passkey; the hub binds it to the machine's #sig key on first use and refuses every later use.
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const vectors = JSON.parse(read(VECTOR_FILE)) as Json;
const record = JSON.parse(read(vectors.record)) as Json;
const validator = await createValidator();
const valid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/enroll-token.schema.json`, value).valid;
const codes = (value: unknown) => [...new Set(evaluateSemanticRules("enroll-token", value).map((finding) => finding.code))];
const good = vectors.verify[0].token as Json;
const verify = (token: unknown, at: string, rec: unknown = record, genesis: unknown = vectors.genesis) => verifyEnrollToken(token, { record: rec, genesis, at: new Date(at) });
const spec = read("docs/specification/ceremonies.md");

describe("the vectors (fixtures/vectors/enroll-token.json)", () => {
  it("are exactly what the generator writes (tools/vectors/enroll-token.ts)", () => {
    expect(buildEnrollTokenVectors()).toBe(read(VECTOR_FILE));
  });

  it.each((vectors.verify as Json[]).map((entry) => [entry.name, entry] as const))("verify: %s", (_name, entry) => {
    expect(verify(entry.token, entry.at, entry.record ?? record)).toEqual(entry.answer);
  });

  it.each((vectors.redeem as Json[]).map((entry) => [entry.name, entry] as const))("redeem: %s", (_name, entry) => {
    expect(redeemEnrollToken(entry.token, entry.machineKey, entry.proof, new Map(entry.ledger))).toEqual(entry.answer);
  });

  it("give the join proof's bytes as the register computes them (enroll-join/1)", () => {
    expect(enrollJoinInput(good)).toBe(vectors.statement.join);
    expect(JSON.parse(vectors.statement.join)).toEqual({ digest: `sha256:${createHash("sha256").update(vectors.statement.bytes, "utf8").digest("hex")}`, nonce: good.statement.nonce, type: "enroll-join/1" });
  });

  it("give the statement's bytes and challenge as the register computes them", () => {
    const { type, ...fields } = vectors.statement.fields as Json;
    expect(type).toBe("enroll-token/1");
    expect(signingStatement("enroll-token/1", fields)?.toString("utf8")).toBe(vectors.statement.bytes);
    expect(signingChallenge("enroll-token/1", fields)?.toString("base64url")).toBe(vectors.statement.challenge);
    expect(createHash("sha256").update(vectors.statement.bytes, "utf8").digest("base64url")).toBe(vectors.statement.challenge);
  });

  it("carry every problem the verifier and the ledger answer", () => {
    const problems = new Set([...vectors.verify, ...vectors.redeem].map((entry: Json) => entry.answer.problem ?? "ok"));
    expect([...problems].sort()).toEqual([
      "bad-key", "bad-proof", "duplicate-authority", "expired", "malformed", "no-trusted-authority", "not-yet-valid", "ok", "reused", "revoked", "revoked-authority", "too-long-lived", "unknown-authority", "wrong-challenge", "wrong-estate", "wrong-origin"
    ]);
  });
});

describe("the register entry (DEC-0063, DEC-0084)", () => {
  it("is a passkey statement with one field list for good", () => {
    expect(SIGNING_STATEMENTS.get("enroll-token/1")).toMatchObject({ signer: "passkey", decision: "DEC-0084", fields: ["scope", "genesis", "purpose", "ceiling", "notBefore", "expiresAt", "nonce", "uses"] });
  });

  it("admits ceiling null or a digest, and nothing else", () => {
    const { type: _type, ...fields } = good.statement;
    expect(signingStatement("enroll-token/1", { ...fields, ceiling: `sha256:${"ab".repeat(32)}` })).toBeDefined();
    for (const ceiling of [undefined, "", 0, {}, `sha256:${"AB".repeat(32)}`]) expect(signingStatement("enroll-token/1", { ...fields, ceiling }), String(ceiling)).toBeUndefined();
    for (const change of [{ genesis: "sha256:x" }, { scope: "estate:" }, { notBefore: "2026-10-15 09:00:00Z" }, { uses: "1" }, { purpose: "agent-host " }]) {
      expect(signingStatement("enroll-token/1", { ...fields, ...change }), JSON.stringify(change)).toBeUndefined();
    }
  });
});

describe("the verifier's order and its edges", () => {
  it("refuses an unreadable clock first, before it reads the token", () => {
    for (const at of [new Date(Number.NaN), "2026-10-15T09:00:00Z", undefined]) expect(verifyEnrollToken(null, { record, genesis: vectors.genesis, at: at as Date })).toEqual({ ok: false, problem: "no-clock" });
    expect(verifyEnrollToken(good, null as never)).toEqual({ ok: false, problem: "no-clock" });
  });

  it("holds the window at 900 s: 900 s accepted, 901 s refused, both instants inside", () => {
    expect(MAX_ENROLL_TOKEN_SECONDS).toBe(900);
    expect(verify(good, "2026-10-15T09:15:00Z").ok).toBe(true);
    expect(verify(good, "2026-10-15T09:15:00.001Z")).toEqual({ ok: false, problem: "expired" });
    expect(verify(good, "2026-10-15T08:59:00Z").ok).toBe(true);
    expect(verify(good, "2026-10-15T08:58:59.999Z")).toEqual({ ok: false, problem: "not-yet-valid" });
  });

  it("refuses a record that is not an object with a string estate, and a genesis it does not hold", () => {
    for (const rec of [null, [], { ...record, estate: 7 }]) expect(verify(good, "2026-10-15T09:01:00Z", rec)).toEqual({ ok: false, problem: "malformed" });
    expect(verify(good, "2026-10-15T09:01:00Z", record, null)).toEqual({ ok: false, problem: "wrong-estate" });
  });

  it("reads authorities that are not objects as none, and a malformed signature as malformed", () => {
    expect(verify(good, "2026-10-15T09:01:00Z", { ...record, authorities: [7, null] })).toEqual({ ok: false, problem: "no-trusted-authority" });
    expect(verify(good, "2026-10-15T09:01:00Z", { ...record, authorities: 7 })).toEqual({ ok: false, problem: "no-trusted-authority" });
    expect(verify(good, "2026-10-15T09:01:00Z", { ...record, revocations: "x" }).ok).toBe(true);
    expect(verify({ ...good, signature: { ...good.signature, credentialId: 7 } }, "2026-10-15T09:01:00Z")).toEqual({ ok: false, problem: "malformed" });
    expect(verify({ ...good, signature: "x" }, "2026-10-15T09:01:00Z")).toEqual({ ok: false, problem: "malformed" });
    const odd = { ...record, authorities: record.authorities.map((entry: Json) => ({ ...entry, publicKey: 7, origins: "x", alg: { toString: 1 } })) };
    expect(verify(good, "2026-10-15T09:01:00Z", odd).ok).toBe(false);
  });

  it("never throws on junk", () => {
    for (const junk of [undefined, null, 7, "x", [], {}, { schema: "enroll-token/1", statement: [] }, { toString: 1 }]) {
      expect(() => verify(junk, "2026-10-15T09:01:00Z")).not.toThrow();
      expect(() => redeemEnrollToken(junk, junk, junk, junk)).not.toThrow();
      expect(enrollJoinInput(junk)).toBeUndefined();
      expect(() => evaluateSemanticRules("enroll-token", { statement: junk })).not.toThrow();
    }
  });

  it("refuses a nonce that is not a string and a ledger that is not a map", () => {
    const { machineKey: key, proof } = vectors.redeem[0];
    expect(redeemEnrollToken(7, key, proof, new Map())).toEqual({ ok: false, problem: "malformed" });
    expect(redeemEnrollToken(good, key, proof, {})).toEqual({ ok: false, problem: "malformed" });
    expect(redeemEnrollToken(good, "key", proof, new Map())).toEqual({ ok: false, problem: "bad-key" });
    expect(redeemEnrollToken(good, key, `${proof.slice(0, -1)}A`, new Map()).ok).toBe(false);
    expect(redeemEnrollToken(good, key, `${proof}AA`, new Map())).toEqual({ ok: false, problem: "bad-proof" });
    // A ledger entry the hub wrote in another shape still counts as a use.
    const n = good.statement.nonce as string;
    expect(redeemEnrollToken(good, key, proof, new Map([[n, "sha256:old"]]))).toMatchObject({ ok: false, problem: "reused", log: { boundTo: "sha256:old" } });
  });
});

describe("FAC-SEM-113 fixtures and the schema", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("enroll-token-"));

  it("has a passing and failing inputs", () => {
    expect(files.filter((name) => JSON.parse(read(`fixtures/semantic/${name}`)).expect.length === 0).length).toBeGreaterThanOrEqual(1);
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = JSON.parse(read(`fixtures/semantic/${name}`));
    expect(codes(fixture.input)).toEqual(fixture.expect);
    // The schema agrees with the rule on every fixture but the window's length, which only the rule reads.
    if (!/901-seconds|no-window|day-not-exists/.test(name)) expect(valid(fixture.input), name).toBe(fixture.expect.length === 0);
  });

  it("refuses exactly 901 s and accepts exactly 900 s", () => {
    expect(codes(good)).toEqual([]);
    expect(codes({ ...good, statement: { ...good.statement, expiresAt: "2026-10-15T09:15:01Z" } })).toEqual(["FAC-SEM-113"]);
    expect(codes({ ...good, statement: { ...good.statement, expiresAt: "2026-10-15T09:15:00.999Z" } })).toEqual(["FAC-SEM-113"]);
  });

  it("names the member it refuses", () => {
    const paths = (statement: Json) => evaluateSemanticRules("enroll-token", { ...good, statement }).map((finding) => finding.instancePath);
    expect(paths({ ...good.statement, uses: 2 })).toEqual(["/statement/uses"]);
    expect(paths({ ...good.statement, purpose: ENROLL_PURPOSE.toUpperCase() })).toEqual(["/statement/purpose"]);
    expect(paths({ ...good.statement, nonce: "short" })).toEqual(["/statement"]);
    expect(paths({ ...good.statement, expiresAt: "x" })).toEqual(["/statement/expiresAt"]);
    expect(paths({ ...good.statement, notBefore: "x" })).toEqual(["/statement/notBefore"]);
  });
});

describe("the specification (docs/specification/ceremonies.md)", () => {
  it("states the token's rules", () => {
    for (const phrase of ["`enroll-token/1`", "900 s", "stdin", "0600", "never", "`reused`", "`genesis`", "`bad-proof`", "bearer", "`enroll-join/1`", "verifyEnrollToken(", "redeemEnrollToken(", "`FAC-SEM-113`"]) expect(spec, phrase).toContain(phrase);
  });
});
