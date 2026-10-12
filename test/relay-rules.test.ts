import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { MAX_BODY_BYTES, MAX_MESSAGE_TTL_SECONDS } from "../src/relay.js";
import { relayRules } from "../src/relay-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0047: FAC-SEM-070 (the secret envelope) and FAC-SEM-071 (relay frame limits), with their schemas.
type Json = Record<string, any>;
const fixtures = path.join(projectRoot(), "fixtures");
const load = (relative: string) => JSON.parse(readFileSync(path.join(fixtures, relative), "utf8")) as Json;
const validator = await createValidator();
const SCHEMA: Record<string, string> = { "secret-envelope": "secret-envelope", "relay-frame": "relay-frame" };
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);

describe("relay semantic fixtures (FAC-SEM-070, FAC-SEM-071)", () => {
  const files = readdirSync(path.join(fixtures, "semantic")).filter((name) => name.startsWith("relay-"));

  it("has a passing and a failing input for each rule", () => {
    const expected = new Set(files.flatMap((name) => load(`semantic/${name}`).expect as string[]));
    expect([...expected].sort()).toEqual(["FAC-SEM-070", "FAC-SEM-071"]);
    for (const kind of ["secret-envelope", "relay-frame"]) {
      expect(files.some((name) => load(`semantic/${name}`).kind === kind && (load(`semantic/${name}`).expect as string[]).length === 0), kind).toBe(true);
    }
  });

  it.each(files)("%s yields exactly its expected codes, and its input is schema-valid", (name) => {
    const fixture = load(`semantic/${name}`);
    expect([...new Set(codes(fixture.kind, fixture.input))]).toEqual(fixture.expect);
    const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/${SCHEMA[fixture.kind]}.schema.json`, fixture.input);
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
  });
});

describe("FAC-SEM-070 and FAC-SEM-071 at the edges", () => {
  const envelope = load("semantic/relay-envelope-ok.json").input;
  const at = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => f.instancePath);

  it("names each broken envelope field by its path", () => {
    const broken = { ...envelope, header: { ...envelope.header, sender: "m#kem", suite: [16, 1, 2], exp: envelope.header.iat } };
    expect(at("secret-envelope", broken)).toEqual(["/header/sender", "/header/suite", "/header/exp"]);
    expect(at("secret-envelope", { header: "x" })).toEqual(["/header/recipient", "/header/sender", "/header/alg", "/header/suite", "/header/exp", "/header/enc"]);
  });

  it("reads an envelope's iat and exp as strict instants: a day that does not exist is refused, not rolled over (CON-004)", () => {
    // Date.parse reads 2026-02-30 as 2 March, which would make each of these a life of an hour or so.
    expect(at("secret-envelope", { ...envelope, header: { ...envelope.header, iat: "2026-03-01T23:00:00Z", exp: "2026-02-30T00:00:00Z" } })).toEqual(["/header/exp"]);
    expect(at("secret-envelope", { ...envelope, header: { ...envelope.header, iat: "2026-02-30T00:00:00Z", exp: "2026-03-02T01:00:00Z" } })).toEqual(["/header/exp"]);
  });

  it("checks send and auth frames and lets every other frame through", () => {
    const send = load("semantic/relay-frame-send-ok.json").input;
    expect(at("relay-frame", { ...send, to: "m#kem", ttl: 0, body: "A".repeat(1_048_600) })).toEqual(["/to", "/ttl", "/body"]);
    expect(at("relay-frame", { ...send, ttl: 1.5 })).toEqual(["/ttl"]);
    expect(at("relay-frame", { ...send, ttl: MAX_MESSAGE_TTL_SECONDS })).toEqual([]);
    expect(at("relay-frame", { ...send, ttl: MAX_MESSAGE_TTL_SECONDS + 1 })).toEqual(["/ttl"]);
    expect(at("relay-frame", { ...send, body: Buffer.alloc(MAX_BODY_BYTES).toString("base64url") })).toEqual([]);
    expect(at("relay-frame", { ...send, body: Buffer.alloc(MAX_BODY_BYTES + 1).toString("base64url") })).toEqual(["/body"]);
    expect(at("relay-frame", { v: 1, type: "auth", id: "a", kid: "m#sig", alg: "ES256", protocol: "fabric-relay/9" })).toEqual(["/protocol"]);
    expect(at("relay-frame", { v: 1, type: "auth", id: "a", kid: "m#sig", protocol: "fabric-relay/0.1" })).toEqual(["/alg"]);
    expect(at("relay-frame", { v: 1, type: "ping", id: "p" })).toEqual([]);
    expect(relayRules("relay-frame", "not an object")).toBeUndefined();
    expect(relayRules("something-else", {})).toBeUndefined();
  });

  it("refuses a frame the schema does not know and an error message that spans lines", () => {
    const frame = `${SCHEMA_PREFIX}schemas/relay-frame.schema.json`;
    expect(validateDocument(validator, frame, { v: 1, type: "teleport", id: "x" }).valid).toBe(false);
    expect(validateDocument(validator, frame, { v: 1, type: "error", id: "e", code: "internal", message: "a\nb" }).valid).toBe(false);
    expect(validateDocument(validator, frame, { v: 1, type: "error", id: "e", code: "internal", message: "one line" }).valid).toBe(true);
  });
});

describe("welcome and delta carry the check-in's revocation-delta shape (DEC-0047 item 9)", () => {
  const frame = `${SCHEMA_PREFIX}schemas/relay-frame.schema.json`;
  const head = { sequence: 41, sha256: "a".repeat(64) };
  const welcome = { v: 1, type: "welcome", id: "w", session: "s", estateRevision: 3, deltaHead: head, heartbeat: null };

  it("puts the welcome's deltaHead into a check-in's records.revocationDelta unchanged", () => {
    expect(validateDocument(validator, frame, welcome).valid).toBe(true);
    expect(validateDocument(validator, frame, { v: 1, type: "delta", id: "d", head, entries: [] }).valid).toBe(true);
    const checkIn = load("positive/device-check-in-records.json"); // the request: what the device has applied
    const records = { ...(checkIn.records as Json), revocationDelta: welcome.deltaHead };
    const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/device-check-in.schema.json`, { ...checkIn, records });
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
    // The check-in schema reads that path: the old shape there is refused, so the agreement above is not vacuous.
    const old = { ...(checkIn.records as Json), revocationDelta: { seq: 41, hash: "a".repeat(64) } };
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/device-check-in.schema.json`, { ...checkIn, records: old }).valid).toBe(false);
  });

  it("refuses the old {seq, hash} shape, and an estate revision that is 0, null or absent", () => {
    expect(validateDocument(validator, frame, { ...welcome, deltaHead: { seq: 41, hash: "x" } }).valid).toBe(false);
    expect(validateDocument(validator, frame, { ...welcome, deltaHead: { ...head, sha256: "A".repeat(64) } }).valid).toBe(false);
    expect(validateDocument(validator, frame, { ...welcome, estateRevision: 0 }).valid).toBe(false);
    expect(validateDocument(validator, frame, { ...welcome, estateRevision: null }).valid).toBe(false);
    // A relay admits only from a verified estate record, so every welcome names its revision.
    const { estateRevision: _omitted, ...withoutRevision } = welcome;
    expect(validateDocument(validator, frame, withoutRevision).valid).toBe(false);
  });
});

describe("the envelope's slot name (DEC-0047 item 7)", () => {
  it("is 1 to 64 characters, like a package's secret names", () => {
    const envelope = load("semantic/relay-envelope-ok.json").input;
    const schema = `${SCHEMA_PREFIX}schemas/secret-envelope.schema.json`;
    const withSlot = (slot: string) => ({ ...envelope, header: { ...envelope.header, slot } });
    expect(validateDocument(validator, schema, withSlot(`A${"B".repeat(63)}`)).valid).toBe(true);
    expect(validateDocument(validator, schema, withSlot(`A${"B".repeat(64)}`)).valid).toBe(false);
    expect(validateDocument(validator, schema, withSlot("")).valid).toBe(false);
  });
});

