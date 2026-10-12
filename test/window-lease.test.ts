import { createPrivateKey, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { strictTime } from "../src/rfc3339.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import {
  LEASE_ALGORITHMS,
  LEASE_WINDOWS,
  MAX_LEASE_SECONDS,
  WINDOW_LEASE_TYPE,
  certifiedHubKey,
  formatUsd,
  mayReserve,
  periodBounds,
  periodOf,
  usdMicros,
  verifyWindowLease,
  windowLeaseSigningInput,
  windowRemainder
} from "../src/window-lease.js";

// DEC-0062: window-lease/1 — the hub's signed share of one window instance, the meter's decision under it, the hub's
// division, and the check-in's report.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const load = (relative: string) => read(`fixtures/${relative}`);
const validator = await createValidator();
const valid = (value: unknown, schema = "window-lease") => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value);
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const vectors = load("vectors/window-lease.json");
const lease = load("positive/window-lease.json");
const schema = read("schemas/window-lease.schema.json");
const spec = readFileSync(path.join(root, "docs/specification/window-lease.md"), "utf8");
/** A vector's clock, read strictly: an unparseable one is an unreadable clock (`Invalid Date`). */
const clock = (text: unknown) => new Date(strictTime(text));
const trustOf = (trust: Json | null) => (trust === null ? null : { ...trust, at: clock(trust.at), estateRecord: trust.estateRecord ?? vectors.estateRecord });
const hubKey = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(vectors.keys.hub.seed, "hex")]), format: "der", type: "pkcs8" });

/** Every vector of the lease, run in the time zone the process is in. */
function runVectors(): void {
  for (const entry of vectors.verify as Json[]) expect(verifyWindowLease(entry.lease, trustOf(entry.trust) as never), entry.name).toEqual(entry.expected);
  for (const entry of vectors.reserve as Json[]) expect(mayReserve(entry.lease, { ...entry.request, at: clock(entry.request.at) }), entry.name).toEqual(entry.expected);
  for (const entry of vectors.remainder as Json[]) expect(windowRemainder({ ...entry.ledger, at: clock(entry.ledger.at) }), entry.name).toEqual(entry.expected);
  for (const entry of vectors.periods.bounds as Json[]) {
    const bounds = periodBounds(entry.window, entry.period);
    if (entry.valid === false) expect(bounds, `${entry.window} ${entry.period}`).toBeUndefined();
    else expect(bounds && { start: new Date(bounds.start).toISOString(), end: new Date(bounds.end).toISOString() }, `${entry.window} ${entry.period}`).toEqual({ start: entry.start, end: entry.end });
  }
  for (const entry of vectors.periods.periodOf as Json[]) expect(periodOf(entry.window, strictTime(entry.at)), `${entry.window} ${entry.at}`).toBe(entry.period);
}

describe("the document (DEC-0062)", () => {
  it("accepts the month and week leases, and every semantic rule passes them", () => {
    for (const name of ["window-lease", "window-lease-week"]) {
      const value = load(`positive/${name}.json`);
      expect(valid(value).valid, name).toBe(true);
      expect(codes("window-lease", value), name).toEqual([]);
    }
  });

  it("carries v4's lease fields and the agreed ones, and no escalation field", () => {
    expect(schema.required).toEqual(["type", "leaseId", "sequence", "estate", "estateRevision", "machine", "scope", "window", "period", "amount", "unit", "issuedAt", "expiresAt", "alg", "kid", "sig"]);
    expect(schema.additionalProperties).toBe(false);
    expect(valid(load("negative/window-lease-escalation-field.json")).valid).toBe(false);
    expect(schema.properties.window.enum).toEqual([...LEASE_WINDOWS]);
    expect(schema.properties.alg.enum).toEqual([...LEASE_ALGORITHMS]);
    expect(schema.properties.type.const).toBe(WINDOW_LEASE_TYPE);
    expect(MAX_LEASE_SECONDS).toBe(86_400);
  });

  it("writes the amount as the device policy writes a quota: a decimal string", () => {
    const policy = read("schemas/device-policy.schema.json");
    const quota = JSON.stringify(policy).match(/"usd":\{"type":"string","pattern":"([^"]+)"/)?.[1];
    expect(schema.properties.amount.pattern).toBe(JSON.parse(`"${quota}"`));
    for (const name of ["amount-exponent", "amount-number", "unit-lower-case", "month-with-week-period", "es256", "scope-organization", "short-sig"]) {
      expect(valid(load(`negative/window-lease-${name}.json`)).valid, name).toBe(false);
    }
  });

  it("is the check-in's report and the check-in response's record (DEC-0053 records.leases)", () => {
    const checkIn = read("schemas/device-check-in.schema.json");
    const text = JSON.stringify(checkIn);
    expect(text).toContain('"leaseId":{"$ref":"activity-common.schema.json#/$defs/opaqueId"}');
    expect(text).toContain('"spent":{"type":"string","pattern":"^(0|[1-9][0-9]{0,8})(\\\\.[0-9]{1,6})?$"');
    expect(text).toContain('"items":{"$ref":"window-lease.schema.json"');
    const response = load("positive/device-check-in-response-records.json");
    expect(response.records.leases).toEqual([lease]);
    expect(valid(response, "device-check-in").valid).toBe(true);
    const withSpent = load("positive/device-check-in-records.json");
    expect(withSpent.records.leases[0].spent).toBe("120.25");
    expect(valid(withSpent, "device-check-in").valid).toBe(true);
    expect(valid({ ...withSpent, records: { ...withSpent.records, leases: [{ ...withSpent.records.leases[0], spent: "1e2" }] } }, "device-check-in").valid).toBe(false);
    expect(valid({ ...response, records: { leases: [{ ...lease, unit: "EUR" }] } }, "device-check-in").valid).toBe(false);
  });
});

describe("the signature (DEC-0062, the register's window-lease/1)", () => {
  it("signs the RFC 8785 form of the lease without sig, which ports reproduce from the seed", () => {
    expect(windowLeaseSigningInput(vectors.signingInput.lease)?.toString("utf8")).toBe(vectors.signingInput.input);
    expect(vectors.signingInput.input.startsWith('{"alg":"EdDSA","amount":"250.5"')).toBe(true);
    expect(vectors.signingInput.input).toContain('"type":"window-lease/1"');
    expect(vectors.signingInput.input).not.toContain('"sig"');
    expect(sign(null, windowLeaseSigningInput(lease) as Buffer, hubKey).toString("base64url")).toBe(lease.sig);
    expect(certifiedHubKey(vectors.estateRecord, lease.kid)?.x).toBe(vectors.keys.hub.x);
  });

  it("has no signing input for another type, an extra member or a value RFC 8785 has no form for", () => {
    expect(windowLeaseSigningInput({ ...lease, type: "window-lease/2" })).toBeUndefined();
    expect(windowLeaseSigningInput({ ...lease, extra: 1 })).toBeUndefined();
    expect(windowLeaseSigningInput({ ...lease, amount: Number.NaN })).toBeUndefined();
    expect(windowLeaseSigningInput("lease")).toBeUndefined();
  });

  it("certifies a hub key only once, unrevoked, on a machine that is not revoked", () => {
    expect(certifiedHubKey(null, lease.kid)).toBeUndefined();
    expect(certifiedHubKey(vectors.estateRecord, 7)).toBeUndefined();
    expect(certifiedHubKey({ ...vectors.estateRecord, machines: "x", revocations: null }, lease.kid)).toBeUndefined();
  });
});

describe("the vectors (DEC-0062)", () => {
  const zone = process.env.TZ;
  afterAll(() => {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  it.each(vectors.verify as Json[])("verify: $name", (entry) => {
    expect(verifyWindowLease(entry.lease, trustOf(entry.trust) as never)).toEqual(entry.expected);
  });

  it.each(vectors.reserve as Json[])("reserve: $name", (entry) => {
    expect(mayReserve(entry.lease, { ...entry.request, at: clock(entry.request.at) })).toEqual(entry.expected);
  });

  it.each(vectors.remainder as Json[])("remainder: $name", (entry) => {
    expect(windowRemainder({ ...entry.ledger, at: clock(entry.ledger.at) })).toEqual(entry.expected);
  });

  it("holds the same answers in UTC, in Asia/Tokyo and in America/St_Johns", () => {
    for (const [name, offset] of [["UTC", 0], ["Asia/Tokyo", -540], ["America/St_Johns", 210]] as const) {
      process.env.TZ = name;
      // The zone took effect, so the vectors below really ran in it.
      expect(new Date(2026, 0, 1).getTimezoneOffset(), name).toBe(offset);
      runVectors();
    }
  });

  it("reads decimal dollars as integers, refusing what a lax parser accepts", () => {
    for (const entry of vectors.decimals as Json[]) expect(usdMicros(entry.text), entry.text).toBe(entry.micros === null ? undefined : BigInt(entry.micros));
    expect(usdMicros(250.5)).toBeUndefined();
    expect(formatUsd(250_500_000n)).toBe("250.5");
    expect(formatUsd(1n)).toBe("0.000001");
    expect(formatUsd(7_000_000n)).toBe("7");
    expect(formatUsd(-5n)).toBe("0");
  });

  it("names no period for an unknown window or an unusable clock", () => {
    expect(periodOf("year", 0)).toBeUndefined();
    expect(periodOf("day", Number.NaN)).toBeUndefined();
    expect(periodOf("day", 8.64e15 + 1)).toBeUndefined();
    expect(periodOf("day", Date.UTC(10000, 0, 1))).toBeUndefined();
    expect(periodOf("day", -62_198_755_200_000)).toBeUndefined();
    expect(periodBounds("day", 20261012)).toBeUndefined();
    expect(periodBounds("day", "0000-01-01")).toBeUndefined();
    expect(periodBounds("week", "0000-W01")).toBeUndefined();
    expect(periodBounds("month", "0000-01")).toBeUndefined();
  });

  it("holds a case per problem in window-lease.md's WL table, and the table names every problem the vectors answer", () => {
    const table = [...spec.matchAll(/^\| WL-\d+ \| ([^|]+) \|/gm)].flatMap((match) => [...(match[1] ?? "").matchAll(/`([a-z-]+)`/g)].map((m) => m[1]));
    const answered = new Set((vectors.verify as Json[]).filter((entry) => !entry.expected.ok).map((entry) => entry.expected.problem));
    expect([...answered].sort()).toEqual([...new Set(table)].sort());
    const reserveProblems = new Set((vectors.reserve as Json[]).filter((entry) => !entry.expected.ok).map((entry) => entry.expected.problem));
    expect([...reserveProblems].sort()).toEqual(["exhausted", "expired", "malformed", "no-clock", "not-current-period", "not-yet-valid"]);
  });
});

describe("the verifier's context and edges (DEC-0062)", () => {
  const trust = { at: new Date("2026-10-12T12:00:00Z"), machine: "m-9a07", remainderUsd: "1000", estateRecord: vectors.estateRecord };

  it("refuses a context it cannot use before reading the lease, and never throws", () => {
    for (const bad of [
      { ...trust, machine: 7 },
      { ...trust, estateRecord: null },
      { ...trust, held: "lease" },
      { ...trust, remainderUsd: 1000 }
    ]) expect(verifyWindowLease(lease, bad as never)).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyWindowLease(lease, { ...trust, at: "2026-10-12T12:00:00Z" } as never)).toEqual({ ok: false, problem: "no-clock" });
    expect(verifyWindowLease(null, trust)).toEqual({ ok: false, problem: "malformed" });
    expect(verifyWindowLease({ ...lease, kid: "" }, trust)).toEqual({ ok: false, problem: "malformed" });
    expect(verifyWindowLease({ ...lease, sig: "not base64url!" }, trust)).toEqual({ ok: false, problem: "malformed" });
    expect(verifyWindowLease({ ...lease, amount: Number.NaN }, trust)).toEqual({ ok: false, problem: "malformed" });
  });

  it("refuses a hub key the revocation delta revoked, and compares revocation refs exactly (DEC-0054, DEC-0060)", () => {
    const machine = vectors.estateRecord.machines[0];
    const revokedKey = [{ kind: "hub-key", ref: machine.hubKey.kid, revokedAt: "2026-10-12T09:00:00Z" }];
    expect(verifyWindowLease(lease, trust).ok).toBe(true);
    expect(verifyWindowLease(lease, { ...trust, estateRevocations: revokedKey })).toEqual({ ok: false, problem: "hub-key-uncertified" });
    expect(verifyWindowLease(lease, { ...trust, estateRevocations: [{ kind: "machine", ref: machine.id, revokedAt: "2026-10-12T09:00:00Z" }] })).toEqual({ ok: false, problem: "hub-key-uncertified" });
    expect(verifyWindowLease(lease, { ...trust, estateRevocations: [null, 7, { kind: "machine", ref: [machine.id] }] }).ok).toBe(true);
  });

  it("refuses an estate record without a revision, a hub key for another algorithm and a private hub key", () => {
    expect(verifyWindowLease(lease, { ...trust, estateRecord: { ...vectors.estateRecord, revision: "1" } })).toEqual({ ok: false, problem: "wrong-estate" });
    const withKey = (change: Json) => ({ ...vectors.estateRecord, machines: [{ ...vectors.estateRecord.machines[0], hubKey: { ...vectors.estateRecord.machines[0].hubKey, ...change } }] });
    expect(verifyWindowLease(lease, { ...trust, estateRecord: withKey({ alg: "ES256" }) })).toEqual({ ok: false, problem: "hub-key-uncertified" });
    expect(verifyWindowLease(lease, { ...trust, estateRecord: withKey({ d: "private" }) })).toEqual({ ok: false, problem: "unusable-key" });
    expect(verifyWindowLease(lease, { ...trust, estateRecord: withKey({ kty: "EC" }) })).toEqual({ ok: false, problem: "unusable-key" });
    expect(verifyWindowLease(lease, { ...trust, estateRecord: withKey({ crv: "X25519" }) })).toEqual({ ok: false, problem: "unusable-key" });
    expect(verifyWindowLease(lease, { ...trust, estateRecord: withKey({ x: 7 }) })).toEqual({ ok: false, problem: "unusable-key" });
    expect(verifyWindowLease({ ...lease, sig: `${lease.sig.slice(0, -1)}B` }, trust)).toEqual({ ok: false, problem: "bad-signature" });
  });

  it("lets a held lease of another slot, or a malformed one, supersede nothing", () => {
    expect(verifyWindowLease(lease, { ...trust, held: { ...lease, scope: "project:p-1", sequence: 99 } }).ok).toBe(true);
    expect(verifyWindowLease(lease, { ...trust, held: { ...lease, leaseId: "other", sequence: "x" } }).ok).toBe(true);
  });

  it("refuses a meter's request it cannot read, and a ledger it cannot read", () => {
    expect(mayReserve(lease, null as never)).toEqual({ ok: false, problem: "no-clock" });
    expect(mayReserve(null, { amountUsd: "1", at: trust.at, spentUsd: "0" })).toEqual({ ok: false, problem: "malformed" });
    expect(windowRemainder(null as never)).toEqual({ ok: false, problem: "no-clock" });
    const ledger = { limitUsd: "1000", at: trust.at, machine: "m-b2c3", leases: [], reports: [] };
    for (const change of [{ machine: 7 }, { leases: "x" }, { reports: null }, { leases: [7] }]) expect(windowRemainder({ ...ledger, ...change } as never)).toEqual({ ok: false, problem: "malformed" });
    expect(windowRemainder({ ...ledger, reports: [7, { leaseId: 1, receivedAt: "x" }] as never })).toEqual({ ok: true, remainderUsd: "1000", heldUsd: "0" });
  });
});

describe("window-lease semantic fixtures (FAC-SEM-089…091)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => /^(window-lease|lease-reservation)-/.test(name));

  it("has a passing and a failing input for each rule", () => {
    const fixtures = files.map((name) => load(`semantic/${name}`));
    for (const [kind, code] of [["window-lease", "FAC-SEM-089"], ["window-lease-division", "FAC-SEM-090"], ["lease-reservation", "FAC-SEM-091"]]) {
      const own = fixtures.filter((fixture) => fixture.kind === kind);
      expect(own.some((fixture) => fixture.expect.length === 0), kind).toBe(true);
      expect(own.some((fixture) => fixture.expect.includes(code)), kind).toBe(true);
    }
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = load(`semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
  });

  it("names the remainder the hub could lease, and the decision the meter owed", () => {
    const over = evaluateSemanticRules("window-lease-division", load("semantic/window-lease-division-over.json").input);
    expect(over.map((finding) => `${finding.instancePath} ${finding.message}`)).toEqual([
      "/leases/2/amount the hub could lease machine m-b2c3 at most 349.5 USD of this window instance when it issued this lease: the others held 650.5"
    ]);
    const late = evaluateSemanticRules("lease-reservation", load("semantic/lease-reservation-after-expiry.json").input);
    expect(late[0]?.message).toBe("the meter must refuse: the lease answers expired");
    const wrongly = evaluateSemanticRules("lease-reservation", load("semantic/lease-reservation-refused-wrongly.json").input);
    expect(wrongly[0]?.message).toBe("the meter must reserve: the lease leaves 0 USD after it");
  });

  it("reads a division with no lease list as empty, and orders leases issued at one instant as listed", () => {
    expect(codes("window-lease-division", { limitUsd: "1000", leases: "x", reports: [] })).toEqual([]);
    const division = load("semantic/window-lease-division-ok.json").input;
    const [first, second] = division.leases as [Json, Json];
    const together = { ...division, leases: [first, { ...second, issuedAt: first.issuedAt, amount: "600" }] };
    expect(codes("window-lease-division", together)).toEqual([]);
    const over = { ...division, leases: [first, { ...second, issuedAt: first.issuedAt, amount: "600.000001" }] };
    expect(codes("window-lease-division", over)).toEqual(["FAC-SEM-090"]);
  });

  it("flags each problem of one lease where it is", () => {
    const at = (change: Json) => evaluateSemanticRules("window-lease", { ...lease, ...change }).map((finding) => finding.instancePath);
    expect(at({ window: "day", period: "2026-02-29" })).toEqual(["/period"]);
    expect(at({ window: "month", period: "2026-W42" })).toEqual(["/period"]);
    expect(at({ expiresAt: "2026-10-12T09:00:00" })).toEqual(["/expiresAt"]);
    expect(at({ issuedAt: "2026-10-13T09:00:00Z" })).toEqual(["/expiresAt"]);
    expect(evaluateSemanticRules("window-lease", { ...lease, window: "week", period: "x" })[0]?.message).toMatch(/ISO 8601 week/);
    expect(evaluateSemanticRules("window-lease", { ...lease, window: "day", period: "x" })[0]?.message).toMatch(/a date, YYYY-MM-DD/);
  });
});
