import { createPrivateKey, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  DELTA_KINDS,
  HEARTBEAT_STALE_SECONDS,
  MAX_FUTURE_SECONDS,
  type DeltaState,
  acceptHeartbeat,
  applyDelta,
  deltaEntryHash,
  deltaFreshness,
  deltaGenesis,
  deltaHead,
  deltaTime,
  deltaRevocations,
  effectiveRevocations,
  isRevoked,
  emptyDeltaState,
  estateSigner,
  freshnessAnswer,
  reconcileRevision,
  signingInput,
  unreconciled
} from "../src/revocation-delta.js";
import { revocationDeltaRules } from "../src/revocation-delta-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0054: the revocation delta (an append-only chain of signed entries, one revocation each) and the timestamp
// heartbeat (a signed commitment to the delta's head and the estate revision), with the 72-hour rule.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const vectors = read("fixtures/vectors/revocation-delta.json");
const spec = readFileSync(path.join(root, "docs/specification/revocation-delta.md"), "utf8");
const validator = await createValidator();
const valid = (schema: string, value: unknown, pointer = "") => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json${pointer}`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const record = vectors.record as Json;
type Entry = { entry: Json; hash: string; signingInput: string };
const { e1, e2, e3 } = vectors.entries as { e1: Entry; e2: Entry; e3: Entry };
const AT = new Date("2026-10-12T12:00:00Z");
const trust = { record, at: AT };
const ESTATE = record.estate as string;
const PKCS8 = Buffer.from("302e020100300506032b657004220420", "hex");
const keyOf = (kid: string) => createPrivateKey({ key: Buffer.concat([PKCS8, Buffer.from(vectors.keys[kid].seed, "hex")]), format: "der", type: "pkcs8" });
const resign = (doc: Json, patch: Json, kid = String(doc.kid)): Json => {
  const { sig: _sig, ...body } = { ...doc, ...patch };
  return { ...body, sig: sign(null, signingInput(body), keyOf(kid)).toString("base64url") };
};
const held = (entries: Json[], extra: Partial<DeltaState> = {}): DeltaState => ({ estate: ESTATE, entries, ...extra });

describe("the documents (DEC-0054)", () => {
  it("accepts the positive page and heartbeats, and both pass every rule", () => {
    const page = read("fixtures/positive/revocation-delta-page.json");
    expect(valid("revocation-delta", page)).toBe(true);
    expect(codes("revocation-delta", page)).toEqual([]);
    for (const name of ["heartbeat", "heartbeat-genesis"]) {
      const heartbeat = read(`fixtures/positive/${name}.json`);
      expect(valid("heartbeat", heartbeat)).toBe(true);
      expect(codes("heartbeat", heartbeat)).toEqual([]);
    }
  });

  it("gives the heads and the heartbeat exactly the check-in's shapes (DEC-0053 records)", () => {
    const heartbeat = read("fixtures/positive/heartbeat.json");
    const checkIn = read("fixtures/positive/device-check-in-records.json");
    const withRecords = (records: Json) => ({ ...checkIn, records: { ...checkIn.records, ...records } });
    // The check-in reports the heartbeat's own sequence and at, and the head a machine applied, unchanged.
    expect(valid("device-check-in", withRecords({ heartbeat: { sequence: heartbeat.sequence, at: heartbeat.at }, revocationDelta: heartbeat.deltaHead }))).toBe(true);
    const state = applyDelta(emptyDeltaState(ESTATE), { head: {}, entries: [e1.entry, e2.entry] }, trust);
    expect(state.ok).toBe(true);
    expect(valid("device-check-in", withRecords({ revocationDelta: deltaHead(state.state) }))).toBe(true);
    expect(valid("device-check-in", withRecords({ revocationDelta: deltaHead(emptyDeltaState(ESTATE)) }))).toBe(true);
    // The check-in and the heartbeat name the same members for the same things.
    const schema = read("schemas/device-check-in.schema.json").$defs.checkIn.properties.records.properties;
    expect(Object.keys(schema.heartbeat.properties).sort()).toEqual(["at", "sequence"]);
    expect(Object.keys(schema.revocationDelta.properties).sort()).toEqual(Object.keys(read("schemas/revocation-delta.schema.json").$defs.head.properties).sort());
    expect(schema.revocationDelta.properties.sha256).toEqual(read("schemas/revocation-delta.schema.json").$defs.head.properties.sha256);
  });

  it("lets the check-in response and the relay frames carry the documents, and nothing else", () => {
    const response = read("fixtures/positive/device-check-in-response-records.json");
    expect(valid("device-check-in", response)).toBe(true);
    expect(valid("device-check-in", read("fixtures/negative/device-check-in-response-heartbeat-placeholder.json"))).toBe(false);
    expect(valid("relay-frame", read("fixtures/positive/relay-frame-delta.json"))).toBe(true);
    expect(valid("relay-frame", read("fixtures/positive/relay-frame-heartbeat.json"))).toBe(true);
    expect(valid("relay-frame", read("fixtures/negative/relay-frame-delta-unsigned-entry.json"))).toBe(false);
    expect(valid("relay-frame", { v: 1, type: "welcome", id: "w", session: "s", estateRevision: 3, deltaHead: { sequence: 0, sha256: deltaGenesis(ESTATE) }, heartbeat: null })).toBe(true);
    expect(valid("relay-frame", { v: 1, type: "welcome", id: "w", session: "s", estateRevision: 3, deltaHead: { sequence: 0, sha256: deltaGenesis(ESTATE) }, heartbeat: { sequence: 1 } })).toBe(false);
  });

  it("admits the estate record's revocation kinds but authority, and only EdDSA", () => {
    const kinds = read("schemas/revocation-delta.schema.json").$defs.revocation.properties.kind.enum as string[];
    const recordKinds = read("schemas/estate-record.schema.json").$defs.revocation.properties.kind.enum as string[];
    expect(kinds).toEqual([...DELTA_KINDS]);
    expect(recordKinds.filter((kind) => kind !== "authority")).toEqual(kinds);
    expect(valid("revocation-delta", read("fixtures/negative/revocation-delta-authority.json"))).toBe(false);
    expect(valid("revocation-delta", { head: { sequence: 1, sha256: e1.hash }, entries: [{ ...e1.entry, alg: "ES256" }] })).toBe(false);
    expect(valid("heartbeat", read("fixtures/negative/heartbeat-bare-digest.json"))).toBe(false);
    expect(valid("heartbeat", read("fixtures/negative/heartbeat-without-revision.json"))).toBe(false);
  });

  it("refuses a page of 257 entries, so a relay frame stays under 1 MiB", () => {
    const entries = Array.from({ length: 257 }, () => e1.entry);
    expect(valid("revocation-delta", { head: { sequence: 1, sha256: e1.hash }, entries })).toBe(false);
    expect(valid("revocation-delta", { head: { sequence: 1, sha256: e1.hash }, entries: entries.slice(0, 256) })).toBe(true);
  });
});

describe("the vectors a port runs", () => {
  it("hashes the genesis and each entry over RFC 8785 without sig", () => {
    expect(deltaGenesis(ESTATE)).toBe(vectors.genesis.sha256);
    expect(JSON.stringify({ estate: ESTATE, sequence: 0, type: "revocation-delta/1" })).toBe(vectors.genesis.input);
    for (const { entry, hash, signingInput: input } of [e1, e2, e3]) {
      expect(signingInput(entry).toString("utf8")).toBe(input);
      expect(deltaEntryHash(entry)).toBe(hash);
    }
    expect(e1.entry.prev).toBe(vectors.genesis.sha256);
    expect(e2.entry.prev).toBe(e1.hash);
    expect(e3.entry.prev).toBe(e2.hash);
  });

  it("reproduces every Ed25519 signature from its seed", () => {
    for (const { entry } of [e1, e2, e3]) expect(resign(entry, {}).sig).toBe(entry.sig);
    for (const c of vectors.heartbeats as Json[]) if (c.expect.ok === true) expect(resign(c.heartbeat, {}).sig).toBe(c.heartbeat.sig);
  });

  it.each(vectors.apply as Json[])("apply: $name", (c) => {
    const verdict = applyDelta(c.state, c.page, { record: c.trust.record, at: new Date(c.trust.at) });
    if (c.expect.ok) {
      expect(verdict).toMatchObject({ ok: true, applied: c.expect.applied });
      expect(deltaHead(verdict.state)).toEqual(c.expect.head);
    } else {
      expect(verdict).toMatchObject({ ok: false, problem: c.expect.problem, index: c.expect.index });
      if (c.expect.head) expect(deltaHead(verdict.state)).toEqual(c.expect.head);
      expect(verdict.state.broken === true).toBe(c.expect.broken === true);
    }
  });

  it.each(vectors.heartbeats as Json[])("heartbeat: $name", (c) => {
    const verdict = acceptHeartbeat(c.state, c.heartbeat, { record: c.trust.record, at: new Date(c.trust.at) });
    if (c.expect.ok) expect(verdict).toMatchObject({ ok: true, newer: c.expect.newer });
    else {
      expect(verdict).toMatchObject({ ok: false, problem: c.expect.problem });
      expect(verdict.state.broken === true).toBe(c.expect.broken === true);
    }
  });

  it.each(vectors.freshness as Json[])("freshness: $name", (c) => {
    expect(freshnessAnswer({ at: deltaTime(c.input.at), applied: c.input.applied, heartbeat: c.input.heartbeat ?? undefined, broken: c.input.broken }).answer).toBe(c.answer);
  });

  it.each(vectors.reconciliation as Json[])("reconciliation: $name", (c) => {
    expect(reconcileRevision(held(c.entries), c.revision)).toEqual(c.expect);
  });

  it("names every problem the verifiers return in the specification's table", () => {
    const problems = new Set<string>([...(vectors.apply as Json[]), ...(vectors.heartbeats as Json[])].filter((c) => !c.expect.ok).map((c) => c.expect.problem as string));
    problems.add("unreconciled");
    for (const problem of problems) expect(spec, problem).toContain(`\`${problem}\``);
    expect(spec).toContain(`${HEARTBEAT_STALE_SECONDS / 3600} hours`);
    expect(spec).toContain(`${MAX_FUTURE_SECONDS} s`);
  });
});

describe("what a machine does with them", () => {
  it("accepts remote calls only while current, and refuses them when stale, behind or broken", () => {
    const applied = applyDelta(emptyDeltaState(ESTATE), { head: {}, entries: [e1.entry, e2.entry] }, trust);
    expect(applied.ok).toBe(true);
    expect(deltaFreshness(applied.state, trust)).toMatchObject({ answer: "stale", remote: "refuse" });
    const heartbeat = (vectors.heartbeats as Json[])[0]!.heartbeat as Json;
    const accepted = acceptHeartbeat(applied.state, heartbeat, trust);
    expect(accepted.ok).toBe(true);
    expect(deltaFreshness(accepted.state, trust)).toMatchObject({ answer: "current", remote: "accept" });
    const later = new Date(deltaTime(heartbeat.at) + (HEARTBEAT_STALE_SECONDS + 1) * 1000);
    expect(deltaFreshness(accepted.state, { record, at: later })).toMatchObject({ answer: "stale", remote: "refuse" });
    expect(deltaFreshness(accepted.state, { record, at: new Date(Number.NaN) })).toMatchObject({ answer: "stale", remote: "refuse" });
    expect(deltaFreshness(accepted.state, { record: { ...record, revision: 2 }, at: AT })).toMatchObject({ answer: "behind", remote: "refuse" });
    expect(deltaFreshness({ ...accepted.state, broken: true }, trust)).toMatchObject({ answer: "broken", remote: "refuse" });
    const ahead = acceptHeartbeat(applied.state, (vectors.heartbeats as Json[])[1]!.heartbeat, trust);
    expect(deltaFreshness(ahead.state, trust)).toMatchObject({ answer: "behind", remote: "refuse" });
    // A held heartbeat the machine could not have accepted is refused, never read as "nothing newer held".
    for (const corrupt of [{ ...heartbeat, sequence: "nine" }, { ...heartbeat, at: "not a time" }, { ...heartbeat, deltaHead: "x" }]) {
      expect(acceptHeartbeat({ ...accepted.state, heartbeat: corrupt } as DeltaState, (vectors.heartbeats as Json[])[1]!.heartbeat, trust)).toMatchObject({ ok: false, problem: "malformed" });
    }
    // An applied sequence that is not a count is behind everything, never caught up.
    expect(freshnessAnswer({ at: deltaTime(heartbeat.at), applied: { sequence: "3", revision: 1 }, heartbeat, broken: false } as never).answer).toBe("behind");
    // Catching up makes it current again.
    const caught = applyDelta(ahead.state, { head: {}, entries: [e3.entry] }, trust);
    expect(deltaFreshness(caught.state, trust)).toMatchObject({ answer: "current", remote: "accept" });
  });

  it("keeps every revocation in force: the record's, the applied entries' and a fork's", () => {
    const fork = (vectors.apply as Json[]).find((c) => c.expect.problem === "fork")!;
    const verdict = applyDelta(fork.state, fork.page, trust);
    const revoked = effectiveRevocations(record, verdict.state);
    expect(isRevoked(revoked, "hub-key", "hub-m-9a07-1")).toBe(true);
    expect(isRevoked(revoked, "package", e2.entry.revocation.ref)).toBe(true);
    expect(isRevoked(revoked, "machine", "m-9a07")).toBe(true);
    // DL-14's extraRevocations: the delta's revocations in the estate record's form, the record's own left out.
    expect(deltaRevocations(verdict.state)).toEqual([e1.entry.revocation, e2.entry.revocation, (fork.page as Json).entries[0].revocation]);
    expect(effectiveRevocations({ revocations: [{ kind: "grant", ref: "g-1" }] }, undefined)).toEqual([{ kind: "grant", ref: "g-1" }]);
  });

  it("DEC-0076: matches a grant revocation by the normal form of its URI id, so another spelling is still revoked", () => {
    const revocations = [{ kind: "grant", ref: "urn:grant:estate:g-1" }, { kind: "grant", ref: 9 }];
    expect(isRevoked(revocations, "grant", "URN:grant:estate:g-1")).toBe(true);
    expect(isRevoked(revocations, "grant", "urn:grant:estate:G-1")).toBe(false);
    expect(isRevoked(revocations, "grant", "9")).toBe(false);
    expect(isRevoked([{ kind: "machine", ref: "Dev:m1" }], "machine", "dev:m1")).toBe(false);
    expect(isRevoked([{ kind: "machine", ref: "Dev:m1" }], "machine", "Dev:m1")).toBe(true);
  });

  it("matches a revocation exactly, as DL-14 does: no String() on the ref", () => {
    const revocations = [{ kind: "machine", ref: "5" }, { kind: "hub-key", ref: 7 }];
    expect(isRevoked(revocations, "machine", "5")).toBe(true);
    expect(isRevoked(revocations, "machine", 5)).toBe(false);
    expect(isRevoked(revocations, "hub-key", "7")).toBe(false);
    expect(isRevoked(revocations, "Machine", "5")).toBe(false);
    const numbered = { ...record, machines: [{ ...record.machines[0], id: 5 }] };
    expect(estateSigner(numbered, record.machines[0].hubKey.kid, [{ kind: "machine", ref: "5" }])).toHaveProperty("key");
    expect(reconcileRevision(held([e1.entry]), { issuedAt: "2026-10-12T10:00:00Z", revocations: [{ ...e1.entry.revocation, ref: [e1.entry.revocation.ref] }] })).toMatchObject({ ok: false, problem: "unreconciled" });
  });

  it("lets no relay break a machine: an unsigned or altered entry is refused without marking it broken", () => {
    const other = { ...e2.entry, revocation: { ...e2.entry.revocation, ref: "grant-x" } };
    const verdict = applyDelta(held([e1.entry, e2.entry]), { head: {}, entries: [other] }, trust);
    expect(verdict).toMatchObject({ ok: false, problem: "bad-signature" });
    expect(verdict.state.broken).toBeUndefined();
  });

  it("keeps the entries before a refused one applied", () => {
    const verdict = applyDelta(emptyDeltaState(ESTATE), { head: {}, entries: [e1.entry, e2.entry, { ...e3.entry, sig: "x" }] }, trust);
    expect(verdict).toMatchObject({ ok: false, problem: "malformed", index: 2 });
    expect(deltaHead(verdict.state)).toEqual({ sequence: 2, sha256: e2.hash });
  });

  it("refuses a revision that leaves out an applied entry it was issued after", () => {
    const state = held([e1.entry]);
    expect(reconcileRevision(state, { issuedAt: "2026-10-12T10:00:00Z", revocations: [] })).toMatchObject({ ok: false, problem: "unreconciled" });
    expect(reconcileRevision(state, { issuedAt: "2026-10-12T10:00:00Z", revocations: [e1.entry.revocation] })).toEqual({ ok: true });
    expect(codes("delta-reconciliation", { revision: { issuedAt: "2026-10-12T10:00:00Z", revocations: [] }, entries: [e1.entry] })).toEqual(["FAC-SEM-084"]);
  });

  it("reads times as instants in any time zone", () => {
    const zone = process.env.TZ;
    try {
      for (const tz of ["UTC", "Asia/Tokyo"]) {
        process.env.TZ = tz;
        expect(deltaTime("2026-10-15T20:00:00+09:00")).toBe(Date.UTC(2026, 9, 15, 11));
        expect(deltaTime("2026-10-12T10:00:00")).toBeNaN();
        for (const c of vectors.freshness as Json[]) expect(freshnessAnswer({ at: deltaTime(c.input.at), applied: c.input.applied, heartbeat: c.input.heartbeat ?? undefined, broken: c.input.broken }).answer, `${tz}: ${c.name}`).toBe(c.answer);
        for (const c of vectors.reconciliation as Json[]) expect(reconcileRevision(held(c.entries), c.revision), `${tz}: ${c.name}`).toEqual(c.expect);
      }
    } finally {
      if (zone === undefined) delete process.env.TZ;
      else process.env.TZ = zone;
    }
  });

  it("refuses a non-canonical base64url hub key and a key that does not decode", () => {
    const machine = (x: unknown) => ({ machines: [{ id: "m", hubKey: { kty: "OKP", crv: "Ed25519", alg: "EdDSA", kid: "k", x } }] });
    const x = record.machines[0].hubKey.x as string;
    const last = x.at(-1)!;
    // The last character's two spare bits set: the same 32 bytes, a different spelling (a lax port accepts it).
    const twin = String.fromCharCode(last.charCodeAt(0) + 1);
    expect(estateSigner(machine(x.slice(0, -1) + twin), "k", [])).toEqual({ problem: "unusable-key" });
    expect(estateSigner(machine(x.slice(0, 20)), "k", [])).toEqual({ problem: "unusable-key" });
    expect(estateSigner(machine(7), "k", [])).toEqual({ problem: "unusable-key" });
    expect(estateSigner({ machines: [{ id: "m", hubKey: { kty: "OKP", crv: "Ed25519", alg: "EdDSA", kid: "k", x, d: x } }] }, "k", [])).toEqual({ problem: "unusable-key" });
    expect(estateSigner({ machines: [record.machines[0], record.machines[0]] }, record.machines[0].hubKey.kid, [])).toEqual({ problem: "unknown-signer" });
    expect(estateSigner(record, 7, [])).toEqual({ problem: "unknown-signer" });
  });
});

describe("the semantic fixtures (FAC-SEM-082, FAC-SEM-083, FAC-SEM-084)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => /^(revocation-delta|heartbeat|delta-)/.test(name));
  it("covers every kind with a passing case and a refusal", () => {
    const kinds = new Set(files.map((name) => read(`fixtures/semantic/${name}`).kind as string));
    expect([...kinds].sort()).toEqual(["delta-freshness", "delta-reconciliation", "heartbeat", "revocation-delta"]);
  });
  it.each(files)("%s", (name) => {
    const fixture = read(`fixtures/semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
  });
});

describe("tolerance: every verifier answers, never throws", () => {
  const WRONG: unknown[] = [null, 7, "x", true, [], [null, 3], { a: null }, { estate: 7, entries: "x" }, { estate: ESTATE, entries: [null, 7], heartbeat: 3, forked: "x" }];
  it("answers malformed states, pages, heartbeats and trust", () => {
    for (const value of WRONG) {
      for (const state of [value, held([]), held([null as unknown as Json])]) {
        expect(() => applyDelta(state as DeltaState, value, trust)).not.toThrow();
        expect(() => applyDelta(state as DeltaState, { head: value, entries: [value] }, value as never)).not.toThrow();
        expect(() => acceptHeartbeat(state as DeltaState, value, trust)).not.toThrow();
        expect(() => acceptHeartbeat(state as DeltaState, (vectors.heartbeats as Json[])[0]!.heartbeat, { record: value, at: AT })).not.toThrow();
        expect(() => deltaFreshness(state as DeltaState, value as never)).not.toThrow();
        expect(() => reconcileRevision(state as DeltaState, value)).not.toThrow();
        expect(() => effectiveRevocations(value, state as DeltaState)).not.toThrow();
        expect(() => unreconciled(value, [value])).not.toThrow();
      }
    }
    expect(applyDelta(7 as never, { entries: [] }, trust)).toMatchObject({ ok: false, problem: "malformed" });
    expect(acceptHeartbeat(7 as never, {}, trust)).toMatchObject({ ok: false, problem: "malformed" });
    expect(reconcileRevision(7 as never, {})).toMatchObject({ ok: false, problem: "malformed" });
    expect(deltaFreshness(7 as never, trust)).toMatchObject({ answer: "stale" });
  });

  it("reads a held heartbeat that is not readable as stale, and one with no RFC 8785 form as no match", () => {
    expect(freshnessAnswer({ at: AT.getTime(), applied: { sequence: 0, revision: 1 }, heartbeat: { at: "2026-10-12T11:00:00Z", deltaHead: 3, estateRecord: { revision: 1 } } }).answer).toBe("stale");
    expect(freshnessAnswer({ at: AT.getTime(), applied: { sequence: "x", revision: null }, heartbeat: { at: "2026-10-12T11:00:00Z", deltaHead: { sequence: 0 }, estateRecord: { revision: 1 } } }).answer).toBe("behind");
    const hb = (vectors.heartbeats as Json[])[0]!.heartbeat as Json;
    const weird = acceptHeartbeat(held([e1.entry, e2.entry], { heartbeat: { ...hb, at: Number.NaN, extra: new Date(0) } as unknown as Json }), hb, trust);
    expect(weird).toMatchObject({ ok: false, problem: "malformed" });
  });
});

describe("every shape an entry or a heartbeat must have is checked", () => {
  const hb = (vectors.heartbeats as Json[])[0]!.heartbeat as Json;
  const state2 = held([e1.entry, e2.entry]);
  it.each([
    ["type", { type: "revocation-delta/2" }],
    ["estate", { estate: 7 }],
    ["kid", { kid: null }],
    ["alg", { alg: ["EdDSA"] }],
    ["sequence 0", { sequence: 0 }],
    ["sequence 1.5", { sequence: 1.5 }],
    ["revocation", { revocation: "hub-key" }],
    ["revocation kind", { revocation: { ...e1.entry.revocation, kind: 7 } }],
    ["revocation ref", { revocation: { ...e1.entry.revocation, ref: null } }],
    ["revokedAt", { revocation: { ...e1.entry.revocation, revokedAt: "2026-10-12T25:00:00Z" } }],
    ["a lone surrogate (no RFC 8785 form)", { revocation: { ...e1.entry.revocation, ref: "\ud800" } }],
    ["device-key ref, an @ form that is no key reference (DEC-0084)", { revocation: { ...e1.entry.revocation, kind: "device-key", ref: "m-c#sig@sha256:ABC" } }],
    ["device-key ref, a key reference in upper-case hex", { revocation: { ...e1.entry.revocation, kind: "device-key", ref: `m-c#sig@sha256:${"AB".repeat(32)}` } }]
  ])("an entry with a bad %s is malformed", (_name, patch) => {
    expect(applyDelta(emptyDeltaState(ESTATE), { head: {}, entries: [{ ...e1.entry, ...patch }] }, trust)).toMatchObject({ ok: false, problem: "malformed", index: 0 });
  });
  it.each([
    ["type", { type: "heartbeat/2" }],
    ["estate", { estate: 7 }],
    ["kid", { kid: 7 }],
    ["alg", { alg: null }],
    ["at", { at: "2026-10-12T11:00:00" }],
    ["deltaHead", { deltaHead: 3 }],
    ["deltaHead sequence", { deltaHead: { sequence: -1, sha256: e2.hash } }],
    ["estateRecord", { estateRecord: null }],
    ["estateRecord revision", { estateRecord: { revision: 0, digest: record.digest } }],
    ["sig", { sig: "!".repeat(86) }],
    ["a lone surrogate (no RFC 8785 form)", { kid: "\ud800" }]
  ])("a heartbeat with a bad %s is malformed", (_name, patch) => {
    expect(acceptHeartbeat(state2, { ...hb, ...patch }, trust)).toMatchObject({ ok: false, problem: "malformed" });
  });

  it("refuses a held heartbeat without its head or revision: a held state the machine could not have accepted", () => {
    const newer = resign(hb, { sequence: 6 });
    expect(acceptHeartbeat(held([e1.entry, e2.entry], { heartbeat: { sequence: 5, at: "2026-10-12T10:00:00Z" } }), newer, trust)).toMatchObject({ ok: false, problem: "malformed" });
    // The same newer heartbeat over a well-formed held one moves nothing back, so it is accepted.
    expect(acceptHeartbeat(held([e1.entry, e2.entry], { heartbeat: hb }), newer, trust)).toMatchObject({ ok: true, newer: true });
  });

  it("answers a page entry or record that is not an object", () => {
    expect(applyDelta(held([null as unknown as Json]), { head: {}, entries: [e1.entry] }, trust)).toMatchObject({ ok: false, problem: "fork" });
    expect(effectiveRevocations({}, held([{ revocation: 3 }]))).toEqual([]);
    expect(unreconciled({ issuedAt: "2026-10-12T10:00:00Z", revocations: [] }, [{ at: "2026-10-12T10:00:00Z", revocation: { kind: 5, ref: "x" } }])).toMatchObject({ unreadable: true });
    expect(estateSigner(7, "k", [])).toEqual({ problem: "unknown-signer" });
    expect(freshnessAnswer({ at: AT.getTime(), applied: { sequence: 0, revision: 1 }, heartbeat: { at: "2026-10-12T11:00:00Z", deltaHead: { sequence: 0 }, estateRecord: 3 } }).answer).toBe("stale");
    expect(revocationDeltaRules("revocation-delta", 7)).toBeUndefined();
    expect(revocationDeltaRules("other", {})).toBeUndefined();
  });

  it("checks a page's entries one by one, whatever they hold", () => {
    const page = (entries: unknown[]) => ({ head: {}, entries });
    expect(codes("revocation-delta", page([7]))).toEqual(["FAC-SEM-082"]);
    expect(codes("revocation-delta", page([{ ...e1.entry, revocation: 3 }]))).toEqual(["FAC-SEM-082"]);
    expect(codes("revocation-delta", page([resign(e1.entry, { revocation: { ...e1.entry.revocation, revokedAt: "yesterday" } })]))).toEqual(["FAC-SEM-082"]);
    // DEC-0084: a device-key ref is a kid or a key reference; an @ form that is neither is refused on the delta side too,
    // since FAC-SEM-076 would refuse every revision that lists it while FAC-SEM-084 requires the next one to.
    const refFindings = (ref: string) =>
      evaluateSemanticRules("revocation-delta", page([resign(e1.entry, { revocation: { ...e1.entry.revocation, kind: "device-key", ref } })]))
        .filter((finding) => finding.instancePath === "/entries/0/revocation/ref").map((finding) => finding.code);
    expect(refFindings("m-c#sig@sha256:ABC")).toEqual(["FAC-SEM-082"]);
    expect(refFindings(`m-c#sig@sha256:${"AB".repeat(32)}`)).toEqual(["FAC-SEM-082"]);
    expect(refFindings(`m-c#sig@sha256:${"ab".repeat(32)}`)).toEqual([]);
    expect(refFindings("m-c#sig")).toEqual([]);
    expect(codes("revocation-delta", { head: { sequence: 1, sha256: e1.hash }, entries: [{ ...e1.entry, revocation: { ...e1.entry.revocation, ref: "\ud800" } }] }).length).toBe(1);
    expect(evaluateSemanticRules("revocation-delta", { head: {}, entries: "x" })).toEqual([]);
    expect(codes("delta-freshness", { at: "2026-10-12T12:00:00Z", applied: { sequence: 2, revision: 3 }, heartbeat: { ...hb, at: "2026-10-12T11:00:00Z" }, broken: false, answer: "stale" })).toEqual(["FAC-SEM-083"]);
  });
});
