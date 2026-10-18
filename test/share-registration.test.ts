import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { rfc8785 } from "../src/canonical.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { PROTOCOL_REVISIONS } from "../src/protocol-revisions.js";
import { schemaClosure } from "../src/schema-closure.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import {
  MAX_MESSAGE,
  RECEIVER_FAULTS,
  RESEND_SECONDS,
  SHARE_REFUSAL_CODES,
  SHARE_REGISTRATION_RECEIPT_TYPE,
  SHARE_REGISTRATION_TYPE,
  TRANSPORT_REFUSALS,
  decideShareRegistration,
  deriveShareRegistrations,
  isOrgContext,
  isShareGrantId,
  joinGrantUsage,
  registrationWellFormed,
  shareGrantIdFindings,
  shareRegistrationDigest
} from "../src/share-registration.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildShareRegistrationVectors } from "../tools/vectors/share-registration.js";

// DEC-0086: share-registration/1, its receipt, the share grant id (FAC-SEM-117), the derivation, the receiver's SR table,
// the join's GJ table (FAC-SEM-118), and grant.usage's context (FAC-SEM-045 amended).
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const load = (relative: string) => read(`fixtures/${relative}`);
const validator = await createValidator();
const SCHEMA = `${SCHEMA_PREFIX}schemas/share-registration.schema.json`;
const valid = (value: unknown, pointer = "") => validateDocument(validator, `${SCHEMA}${pointer}`, value).valid;
const validAs = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => `${finding.code} ${finding.instancePath}`);
const vectors = read(VECTOR_FILE);
const schema = read("schemas/share-registration.schema.json");
const common = read("schemas/common.schema.json");
const spec = readFileSync(path.join(root, "docs/specification/share-registration.md"), "utf8");
const devices = readFileSync(path.join(root, "docs/specification/devices.md"), "utf8");
const ACTIVE = load("positive/share-registration-active.json");
const WITHDRAWN = load("positive/share-registration-withdrawn.json");
const A = "urn:fabric:share:3f9c2a7e5b1d4c608e2f71a9d0b6c4e8";
const BINDING = { transport: { ok: true }, org: { id: "org_7kq2m4xw" }, user: { id: "m-4821" } };
const sha = (value: unknown) => `sha256:${createHash("sha256").update(Buffer.from(rfc8785(value), "utf8")).digest("hex")}`;

describe("the schema (DEC-0086)", () => {
  it("is one of a registration, a receipt and a refusal, each closed", () => {
    expect(schema.oneOf).toEqual([{ $ref: "#/$defs/registration" }, { $ref: "#/$defs/receipt" }, { $ref: "#/$defs/refusal" }]);
    for (const def of ["registration", "receipt", "refusal"]) expect(schema.$defs[def].additionalProperties, def).toBe(false);
    expect(schema.$defs.refusal.properties.error.additionalProperties).toBe(false);
    expect(schema.$defs.registration.properties.type.const).toBe(SHARE_REGISTRATION_TYPE);
    expect(schema.$defs.receipt.properties.type.const).toBe(SHARE_REGISTRATION_RECEIPT_TYPE);
    expect(schema.$defs.refusal.properties.error.properties.code.enum).toEqual([...SHARE_REFUSAL_CODES]);
    expect(schema.$defs.refusal.properties.error.properties.message.maxLength).toBe(MAX_MESSAGE);
    expect(schema.$defs.receipt.properties.state.enum).toEqual(["registered", "unchanged", "withdrawn"]);
    expect(schema.$defs.registration.properties.state.enum).toEqual(["active", "withdrawn"]);
  });

  it("requires an active registration's four members and forbids withdrawnAt, and the reverse for a withdrawal", () => {
    const [active, withdrawn] = schema.$defs.registration.allOf as [Json, Json];
    expect(active.if.properties.state.const).toBe("active");
    expect(active.then.required).toEqual(["grantRevision", "agentRef", "startsAt", "expiresAt"]);
    expect(active.then.properties.withdrawnAt).toBe(false);
    expect(withdrawn.if.properties.state.const).toBe("withdrawn");
    expect(withdrawn.then.required).toEqual(["withdrawnAt"]);
    for (const member of ["grantRevision", "agentRef", "startsAt", "expiresAt"]) expect(withdrawn.then.properties[member], member).toBe(false);
  });

  it("names the grant by a share grant id and the organization by its context, and reuses the agentRef", () => {
    expect(common.$defs.shareGrantId).toMatchObject({ type: "string", format: "uri", pattern: "^urn:fabric:share:(?!0{32}$)[0-9a-f]{32}$" });
    expect(common.$defs.orgContextId).toMatchObject({ type: "string", pattern: "^org:[A-Za-z0-9][A-Za-z0-9_-]{0,127}$" });
    expect(common.$defs.orgContextId.pattern.slice(1)).toBe(common.$defs.contextId.pattern.replace("^(?:personal|", "").replace(")$", "$"));
    expect(schema.$defs.registration.properties.grantId.$ref).toBe("common.schema.json#/$defs/shareGrantId");
    expect(schema.$defs.receipt.properties.grantId.$ref).toBe("common.schema.json#/$defs/shareGrantId");
    expect(schema.$defs.registration.properties.context.$ref).toBe("common.schema.json#/$defs/orgContextId");
    expect(schema.$defs.registration.properties.agentRef.$ref).toBe("fabric-package.schema.json#/$defs/agentRef");
    expect(schema.$defs.receipt.properties.digest.$ref).toBe("common.schema.json#/$defs/sha256");
    expect(schema.$defs.instant.pattern).toBe(read("schemas/entitlement.schema.json").$defs.instant.pattern);
  });

  it("names nothing a registration must not carry (DEC-0086 item 2)", () => {
    const names = JSON.stringify(schema).match(/"([a-zA-Z]+)":/g)?.map((match) => match.slice(1, -2)) ?? [];
    for (const forbidden of ["estate", "revision", "machine", "machines", "principal", "issuer", "createdBy", "project", "audience", "capabilities", "effectCeiling", "dataClasses", "spend", "contentHash", "note", "comment", "user", "email"]) {
      expect(names, forbidden).not.toContain(forbidden);
    }
  });

  it("accepts its positive fixtures, refuses its negatives, and a consumer vendors its whole $ref closure", () => {
    for (const name of ["active", "withdrawn", "receipt", "refusal"]) expect(valid(load(`positive/share-registration-${name}.json`)), name).toBe(true);
    const negatives = readdirSync(path.join(root, "fixtures/negative")).filter((name) => name.startsWith("share-registration-"));
    expect(negatives.length).toBeGreaterThanOrEqual(16);
    for (const name of negatives) expect(valid(load(`negative/${name}`)), name).toBe(false);
    expect(schemaClosure(path.join(root, "schemas"), "share-registration.schema.json")).toEqual([
      "common.schema.json", "fabric-package.schema.json", "interop-capability.schema.json", "manifest.schema.json", "service-common.schema.json", "share-registration.schema.json"
    ]);
  });

  it("publishes the two revisions (DEC-0067)", () => {
    expect(PROTOCOL_REVISIONS.get("share-registration")).toEqual(["1"]);
    expect(PROTOCOL_REVISIONS.get("share-registration-receipt")).toEqual(["1"]);
  });

  it("takes from DEC-0056 exactly the transport's 401 codes and its step-0 faults", () => {
    const table = devices.slice(devices.indexOf("| Step | Refused when | Code |"), devices.indexOf("**The nonce store.**"));
    const rows = [...table.matchAll(/^\| ([0-8]) \|[^\n]*\| ([^|\n]+) \|$/gm)];
    const code = (step: string) => rows.filter((row) => row[1] === step).flatMap((row) => [...(row[2] ?? "").matchAll(/`([a-z-]+)`/g)].map((m) => m[1] as string));
    expect([...new Set(["1", "2", "3", "4", "5", "6", "7", "8"].flatMap(code))]).toEqual([...TRANSPORT_REFUSALS]);
    expect(code("0")).toEqual([...RECEIVER_FAULTS]);
    expect(RESEND_SECONDS).toBe(604_800);
  });
});

describe("the share grant id and the organization's context (FAC-SEM-117)", () => {
  it.each(vectors.grantId as Json[])("$name", (entry) => {
    expect(isShareGrantId(entry.value)).toBe(entry.ok);
    expect(valid({ type: SHARE_REGISTRATION_RECEIPT_TYPE, grantId: entry.value, state: "registered", digest: `sha256:${"0".repeat(64)}` })).toBe(entry.ok);
  });

  it("reads an organization's context exactly as the schema does", () => {
    for (const [value, expected] of [["org:org_7kq2m4xw", true], ["org:a", true], [`org:${"o".repeat(128)}`, true], [`org:${"o".repeat(129)}`, false], ["personal", false], ["org:", false], ["ORG:a", false], ["org:a\n", false], ["org:a.b", false], [7, false]] as const) {
      expect(isOrgContext(value), String(value)).toBe(expected);
      expect(valid({ ...ACTIVE, context: value }), String(value)).toBe(expected);
    }
  });
});

describe("the digest", () => {
  it("is sha256: of the RFC 8785 form, and undefined for what has none", () => {
    expect(shareRegistrationDigest(ACTIVE)).toBe(sha(ACTIVE));
    expect(shareRegistrationDigest({ ...ACTIVE, grantRevision: Number.NaN })).toBeUndefined();
    expect(shareRegistrationDigest({ ...ACTIVE, grantRevision: 3n })).toBeUndefined();
    expect(shareRegistrationDigest(new Date(0))).toBeUndefined();
  });
});

describe("the vectors (DEC-0086)", () => {
  const zone = process.env.TZ;
  afterAll(() => {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  it("are exactly what the generator writes (tools/vectors/share-registration.ts)", () => {
    expect(buildShareRegistrationVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });

  it.each(vectors.derive as Json[])("derive: $name", (entry) => {
    expect(deriveShareRegistrations(entry.record, entry.entries, entry.orgId, entry.previouslyRegistered)).toEqual(entry.expected);
  });

  it.each(vectors.intake as Json[])("intake: $name", (entry) => {
    expect(decideShareRegistration(entry.held, entry.registration, entry.binding)).toEqual(entry.expected);
  });

  it.each(vectors.join as Json[])("join: $name", (entry) => {
    expect(joinGrantUsage(entry.event, entry.binding, entry.registrations)).toEqual(entry.expected);
  });

  it("holds the same answers in UTC, in America/St_Johns and in Pacific/Kiritimati", () => {
    for (const [name, offset] of [["UTC", 0], ["America/St_Johns", 210], ["Pacific/Kiritimati", -840]] as const) {
      process.env.TZ = name;
      expect(new Date(2026, 0, 1).getTimezoneOffset(), name).toBe(offset);
      for (const entry of vectors.derive as Json[]) expect(deriveShareRegistrations(entry.record, entry.entries, entry.orgId, entry.previouslyRegistered), `${name}: ${entry.name}`).toEqual(entry.expected);
      for (const entry of vectors.intake as Json[]) expect(decideShareRegistration(entry.held, entry.registration, entry.binding), `${name}: ${entry.name}`).toEqual(entry.expected);
      for (const entry of vectors.join as Json[]) expect(joinGrantUsage(entry.event, entry.binding, entry.registrations), `${name}: ${entry.name}`).toEqual(entry.expected);
    }
  });

  it("hold a case per row of share-registration.md's SR and GJ tables, and the tables name every answer", () => {
    const rows = (prefix: string) => [...spec.matchAll(new RegExp(`^\\| ${prefix}-(\\d+) \\|`, "gm"))].map((match) => `${prefix}-${match[1]}`);
    expect(rows("SR")).toEqual(Array.from({ length: 12 }, (_, i) => `SR-${i}`));
    expect(rows("GJ")).toEqual(Array.from({ length: 7 }, (_, i) => `GJ-${i}`));
    for (const row of rows("SR")) expect((vectors.intake as Json[]).some((entry) => entry.name.startsWith(`${row}:`)), row).toBe(true);
    for (const row of rows("GJ")) expect((vectors.join as Json[]).some((entry) => entry.name.startsWith(`${row}:`)), row).toBe(true);
    const refusals = new Set((vectors.intake as Json[]).flatMap((entry) => (entry.expected.body ? [entry.expected.body.error.code] : [])));
    expect([...refusals].sort()).toEqual([...SHARE_REFUSAL_CODES, "schema-unsupported"].sort());
    const receipts = new Set((vectors.intake as Json[]).flatMap((entry) => (entry.expected.receipt ? [entry.expected.receipt.state] : [])));
    expect([...receipts].sort()).toEqual(["registered", "unchanged", "withdrawn"]);
    const reasons = new Set((vectors.join as Json[]).map((entry) => entry.expected.reason ?? entry.expected.fault ?? "joined"));
    expect([...reasons].sort()).toEqual(["after-end", "attribution", "before-start", "context-invalid", "joined", "schema", "unassigned-device", "unregistered"]);
    const degraded = new Set((vectors.derive as Json[]).flatMap((entry) => entry.expected.degraded.map((d: Json) => d.code)));
    expect([...degraded].sort()).toEqual(["share-grant-agents", "share-grant-id", "share-grant-unreadable"]);
  });

  it("cover the brief's matrix by name", () => {
    const names = [...vectors.derive, ...vectors.intake, ...vectors.join, ...vectors.grantId].map((entry: Json) => entry.name as string);
    for (const needed of [
      "upper-case hex", "URN in capitals", "31 hex digits", "33 hex digits", "all zeros", "the legacy id", "an e-mail address", "an estate id", "a revision appended", "a trailing newline",
      "withdrawn: a delta entry ahead of the revision", "withdrawn: a revocation ref spelled otherwise", "active: two machines run one agentRef", "degraded: two agentRefs",
      "SR-4: a certificate org.id that differs only in case", "SR-4: a certificate org.id that is a prefix", "SR-11: two registrants with one grant id", "SR-6: tombstone then active",
      "SR-10: a second, earlier withdrawal", "SR-10: redelivery", "SR-11: a higher revision extends expiresAt",
      "GJ-3: another member's device", "GJ-6: the expiry's UTC day itself", "GJ-4: a negative-offset start"
    ]) expect(names.some((name) => name.includes(needed)), needed).toBe(true);
  });
});

describe("every output validates, and every input the schema refuses is refused (the standing instruction)", () => {
  it("derives only registrations the schema and FAC-SEM-118 accept", () => {
    const outputs = (vectors.derive as Json[]).flatMap((entry) => deriveShareRegistrations(entry.record, entry.entries, entry.orgId, entry.previouslyRegistered).registrations);
    expect(outputs.length).toBeGreaterThan(15);
    for (const output of outputs) {
      expect(valid(output), JSON.stringify(output)).toBe(true);
      expect(codes("share-registration", output)).toEqual([]);
    }
  });

  it("answers only receipts and refusals the schemas accept", () => {
    for (const entry of vectors.intake as Json[]) {
      const answer = decideShareRegistration(entry.held, entry.registration, entry.binding) as Json;
      if (answer.status === 200) expect(valid(answer.receipt, "#/$defs/receipt"), entry.name).toBe(true);
      else if (answer.body?.error?.code === "schema-unsupported") expect(validAs("schema-unsupported.schema.json", answer.body), entry.name).toBe(true);
      else if (answer.body) expect(valid(answer.body, "#/$defs/refusal"), entry.name).toBe(true);
    }
  });

  /** Changes to a valid registration. */
  const MUTATIONS: Array<[string, (doc: Json) => unknown]> = [
    ["no type", ({ type: _t, ...d }) => d],
    ["a numeric type", (d) => ({ ...d, type: 1 })],
    ["a null type", (d) => ({ ...d, type: null })],
    ["no grantId", ({ grantId: _g, ...d }) => d],
    ["no context", ({ context: _c, ...d }) => d],
    ["no state", ({ state: _s, ...d }) => d],
    ["no grantRevision", ({ grantRevision: _r, ...d }) => d],
    ["no agentRef", ({ agentRef: _a, ...d }) => d],
    ["no startsAt", ({ startsAt: _s, ...d }) => d],
    ["no expiresAt", ({ expiresAt: _e, ...d }) => d],
    ["an extra member", (d) => ({ ...d, note: "x" })],
    ["a withdrawnAt", (d) => ({ ...d, withdrawnAt: "2026-10-20T00:00:00Z" })],
    ["state withdrawn with the active members", (d) => ({ ...d, state: "withdrawn", withdrawnAt: "2026-10-20T00:00:00Z" })],
    ["an unknown state", (d) => ({ ...d, state: "paused" })],
    ["a legacy grant id", (d) => ({ ...d, grantId: "urn:grant:estate:share-inbox-digest-org-a" })],
    ["a grant id with a newline", (d) => ({ ...d, grantId: `${A}\n` })],
    ["a numeric grant id", (d) => ({ ...d, grantId: 7 })],
    ["the personal context", (d) => ({ ...d, context: "personal" })],
    ["an empty organization", (d) => ({ ...d, context: "org:" })],
    ["a context with a dot", (d) => ({ ...d, context: "org:org.example" })],
    ["revision 0", (d) => ({ ...d, grantRevision: 0 })],
    ["a fractional revision", (d) => ({ ...d, grantRevision: 1.5 })],
    ["a string revision", (d) => ({ ...d, grantRevision: "3" })],
    ["a revision above 2^53 - 1", (d) => ({ ...d, grantRevision: 2 ** 53 })],
    ["an agentRef in capitals", (d) => ({ ...d, agentRef: "urn:fabric:agent:Example:inbox" })],
    ["an agentRef too long", (d) => ({ ...d, agentRef: `urn:fabric:agent:a:${"b".repeat(128)}` })],
    ["a time without an offset", (d) => ({ ...d, startsAt: "2026-10-12T08:00:00" })],
    ["a time with four fraction digits", (d) => ({ ...d, expiresAt: "2026-10-26T08:00:00.0001Z" })],
    ["a time with a space", (d) => ({ ...d, startsAt: "2026-10-12 08:00:00Z" })],
    ["a numeric time", (d) => ({ ...d, startsAt: 1 })],
    ["an array", () => [ACTIVE]],
    ["a string", () => "share-registration/1"]
  ];

  it("reads a registration of another revision as no registration, though the receiver answers it at SR-2", () => {
    expect(registrationWellFormed({ ...ACTIVE, type: "share-registration/2" })).toBe(false);
    expect(registrationWellFormed({ ...WITHDRAWN, type: SHARE_REGISTRATION_RECEIPT_TYPE })).toBe(false);
  });

  it.each(MUTATIONS)("%s: the schema's verdict is the receiver's", (_name, mutate) => {
    const value = mutate(structuredClone(ACTIVE));
    const answer = decideShareRegistration([], value, BINDING) as Json;
    if (valid(value, "#/$defs/registration")) expect(answer.status, JSON.stringify(answer)).toBe(200);
    else expect(answer.status, JSON.stringify(answer)).toBe(400);
    expect(registrationWellFormed(value)).toBe(valid(value, "#/$defs/registration"));
  });

  it.each(MUTATIONS.map(([name, mutate]) => [name, (doc: Json) => mutate({ ...doc, ...WITHDRAWN, grantRevision: doc.grantRevision })] as const))("a withdrawal, %s: the schema's verdict is the receiver's", (_name, mutate) => {
    const value = mutate(structuredClone(ACTIVE));
    const answer = decideShareRegistration([], value, BINDING) as Json;
    expect(answer.status === 400, JSON.stringify(answer)).toBe(!valid(value, "#/$defs/registration"));
  });

  it("refuses a registration whose window does not end after it starts, which the schema alone admits (FAC-SEM-118)", () => {
    for (const expiresAt of ["2026-10-12T08:00:00Z", "2026-10-11T08:00:00Z", "2026-11-31T08:00:00Z"]) {
      const value = { ...ACTIVE, expiresAt };
      expect(decideShareRegistration([], value, BINDING)).toEqual({ status: 400, body: { error: { code: "malformed", message: expect.any(String) } } });
    }
    expect(valid({ ...ACTIVE, expiresAt: "2026-10-11T08:00:00Z" })).toBe(true);
  });

  it("rejects as schema exactly the events whose day, grant id or context the schema refuses", () => {
    const base = (vectors.join as Json[]).find((entry) => entry.name.startsWith("GJ-6: the start's UTC day")) as Json;
    for (const [member, value] of [["day", "2026-13-01"], ["day", 7], ["grantId", A.toUpperCase()], ["grantId", "x"], ["context", "personal"], ["context", "org:"], ["context", undefined]] as const) {
      const event = { ...base.event, data: { ...base.event.data, [member]: value } };
      expect(validAs("telemetry-event.schema.json", event), `${member} ${String(value)}`).toBe(false);
      expect(joinGrantUsage(event, base.binding, base.registrations), `${member} ${String(value)}`).toEqual({ outcome: "rejected", reason: "schema" });
    }
    expect(validAs("telemetry-event.schema.json", base.event)).toBe(true);
    // A day that does not exist passes the day's pattern, but its event's occurred (that day's midnight, FAC-SEM-039)
    // fails date-time: the schema refuses the event, and the join answers schema without reading occurred.
    const noSuchDay = (vectors.join as Json[]).find((entry) => entry.name === "GJ-0: a day that does not exist") as Json;
    expect(validAs("telemetry-event.schema.json", noSuchDay.event)).toBe(false);
    expect(joinGrantUsage(noSuchDay.event, noSuchDay.binding, noSuchDay.registrations)).toEqual({ outcome: "rejected", reason: "schema" });
  });
});

describe("totality: every function answers and never throws", () => {
  const HOSTILE: unknown[] = [undefined, null, 0, -1, 2 ** 64, Number.NaN, "", "__proto__", "constructor", [], {}, { toString: 1 }, Object.create(null), [null], { __proto__: { org: { id: "org_7kq2m4xw" } } }, JSON.parse('{"__proto__": {"id": "x"}}'), 9007199254740993n, Symbol("x")];
  it("derives from anything", () => {
    for (const a of HOSTILE) for (const b of HOSTILE) {
      expect(() => deriveShareRegistrations(a, b, a, b)).not.toThrow();
      expect(() => deriveShareRegistrations({ shareGrants: [a, { context: "org:o", meta: a }], machines: [a, { packages: [a, b] }], revocations: [a, { kind: "grant", ref: b, revokedAt: a }] }, [a, { revocation: b }], "o", [a, b, A])).not.toThrow();
    }
  });
  it("decides on anything", () => {
    for (const a of HOSTILE) for (const b of HOSTILE) {
      expect(() => decideShareRegistration(a, b, a)).not.toThrow();
      expect(() => decideShareRegistration([], { ...ACTIVE, grantRevision: a, agentRef: b }, { ...BINDING, user: a })).not.toThrow();
      expect(() => decideShareRegistration([a], ACTIVE, { transport: { ok: false, code: a }, org: { id: b } })).not.toThrow();
      expect(() => decideShareRegistration([], { type: a }, BINDING)).not.toThrow();
    }
  });
  it("joins anything", () => {
    for (const a of HOSTILE) for (const b of HOSTILE) {
      expect(() => joinGrantUsage(a, b, a)).not.toThrow();
      expect(() => joinGrantUsage({ kind: "grant.usage", data: { day: a, grantId: b, context: a } }, { org: { id: b }, user: a }, [])).not.toThrow();
    }
  });
  it("reads no inherited member", () => {
    const inherited = Object.create({ transport: { ok: true }, org: { id: "org_7kq2m4xw" }, user: { id: "m-4821" } }) as Json;
    expect(decideShareRegistration([], ACTIVE, inherited)).toEqual({ fault: "context-invalid" });
    expect(joinGrantUsage({ kind: "grant.usage", data: { day: "2026-10-15", grantId: A, context: "org:org_7kq2m4xw" } }, inherited, [])).toEqual({ fault: "context-invalid" });
    expect(deriveShareRegistrations(Object.create({ shareGrants: [] }), [], "org_7kq2m4xw", [A])).toEqual({ registrations: [], degraded: [{ grantId: A, code: "share-grant-unreadable" }] });
  });
});

describe("share-registration semantic fixtures (FAC-SEM-117, FAC-SEM-118, FAC-SEM-045)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => /^(share-|grant-usage-join-|device-attribution-grant-usage-)/.test(name));

  it("holds a passing and a failing input for each kind", () => {
    const fixtures = files.map((name) => load(`semantic/${name}`));
    for (const [kind, code] of [["grant", "FAC-SEM-117"], ["org-share-grants", "FAC-SEM-117"], ["share-registration", "FAC-SEM-118"], ["share-registration-derive", "FAC-SEM-118"], ["share-registration-intake", "FAC-SEM-118"], ["grant-usage-join", "FAC-SEM-118"], ["device-attribution", "FAC-SEM-045"]]) {
      const own = fixtures.filter((fixture) => fixture.kind === kind);
      expect(own.some((fixture) => fixture.expect.length === 0), kind).toBe(true);
      expect(own.some((fixture) => fixture.expect.includes(code)), kind).toBe(true);
    }
    for (const row of Array.from({ length: 12 }, (_, i) => `sr-${i}`)) expect(files, row).toContain(`share-registration-intake-${row}.json`);
    for (const row of Array.from({ length: 7 }, (_, i) => `gj-${i}`)) expect(files, row).toContain(`grant-usage-join-${row}.json`);
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = load(`semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
  });

  it("flags a share grant id where it is (FAC-SEM-117)", () => {
    const grant = load("positive/governance-grant-share-context.json");
    expect(paths("grant", { ...grant, meta: { ...grant.meta, id: "urn:grant:estate:x" } })).toEqual(["FAC-SEM-117 /meta/id"]);
    expect(paths("grant", { ...grant, meta: "x" })).toEqual(["FAC-SEM-117 /meta/id"]);
    expect(paths("grant", { ...grant, context: "personal", principalKind: "internal", meta: { ...grant.meta, id: "urn:grant:estate:x" } })).toEqual([]);
    expect(paths("grant", { ...grant, context: 7, meta: { ...grant.meta, id: "urn:grant:estate:x" } })).toEqual([]);
    expect(shareGrantIdFindings(null, "/x")).toEqual([]);
    const record = load("positive/estate-record-contexts.json");
    const legacy = structuredClone(record);
    legacy.shareGrants[2].meta.id = "urn:grant:estate:b";
    expect(paths("org-share-grants", { record: legacy })).toEqual(["FAC-SEM-117 /record/shareGrants/2/meta/id"]);
    const twice = structuredClone(record);
    twice.machines[1].packages.push({ ...record.machines[0].packages[1], agentRef: "urn:fabric:agent:example:notes" });
    expect(paths("org-share-grants", { record: twice })).toEqual(["FAC-SEM-117 /record/shareGrants/1"]);
    // Another context's placement naming the grant is FAC-SEM-111's, not counted here.
    const elsewhere = structuredClone(record);
    elsewhere.machines[1].packages.push({ ...record.machines[0].packages[1], agentRef: "urn:fabric:agent:example:notes", context: "org:org_3fh9p1zc" });
    expect(paths("org-share-grants", { record: elsewhere })).toEqual([]);
    expect(paths("org-share-grants", { record: "x" })).toEqual([]);
    const noMeta = structuredClone(record);
    noMeta.shareGrants[1].meta = "x";
    expect(paths("org-share-grants", { record: noMeta })).toEqual(["FAC-SEM-117 /record/shareGrants/1/meta/id"]);
  });

  it("flags a registration's document clauses where they are (FAC-SEM-118)", () => {
    expect(paths("share-registration", { ...ACTIVE, startsAt: "x" })).toEqual(["FAC-SEM-118 /startsAt"]);
    expect(paths("share-registration", { ...ACTIVE, startsAt: 1, expiresAt: "2026-02-30T00:00:00Z" })).toEqual(["FAC-SEM-118 /startsAt", "FAC-SEM-118 /expiresAt"]);
    expect(paths("share-registration", { ...ACTIVE, expiresAt: ACTIVE.startsAt })).toEqual(["FAC-SEM-118 /expiresAt"]);
    expect(paths("share-registration", { ...WITHDRAWN, withdrawnAt: "2026-10-20T00:00:00.1234Z" })).toEqual(["FAC-SEM-118 /withdrawnAt"]);
    expect(paths("share-registration", load("positive/share-registration-refusal.json"))).toEqual([]);
    expect(paths("share-registration-intake", { answer: { status: 200 } })).toEqual(["FAC-SEM-118 /answer"]);
  });

  it("refuses another organization's grant.usage as attribution, as written (FAC-SEM-045 amended)", () => {
    const fixture = load("semantic/device-attribution-grant-usage-other-org.json").input;
    const at = fixture.batch.events.length - 1;
    expect(paths("device-attribution", fixture)).toEqual([`FAC-SEM-045 /batch/events/${at}/data/context`]);
    const noOrg = { ...fixture, binding: { ...fixture.binding, org: { id: 7 } } };
    expect(paths("device-attribution", noOrg)).toEqual([`FAC-SEM-045 /batch/events/${at}/data/context`]);
    const right = structuredClone(fixture);
    right.batch.events[at].data.context = "org:org-7f3a";
    expect(paths("device-attribution", right)).toEqual([]);
    right.batch.events[at].data = "x";
    expect(paths("device-attribution", right)).toEqual([`FAC-SEM-045 /batch/events/${at}/data/context`]);
  });
});
