import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { acceptedRevisions, negotiateRevision, NAMED_ONLY, parseRevision, PROTOCOL_REVISIONS, protocolsFindings } from "../src/protocol-revisions.js";
import { COMMS_PROTOCOL } from "../src/comms-digest.js";
import { ESTATE_RECORD_SCHEMA } from "../src/estate-record-rules.js";
import { RELAY_PROTOCOL } from "../src/relay.js";
import { DELTA_TYPE, HEARTBEAT_TYPE } from "../src/revocation-delta.js";
import { ENVELOPE_TYPE } from "../src/secret-envelope.js";
import { HANDOFF_FORMAT } from "../src/session-handoff.js";
import { SETTINGS_BACKUP_FORMAT } from "../src/settings-backup.js";
import { WINDOW_LEASE_TYPE } from "../src/window-lease.js";
import { ENTITLEMENT_KEY_SET_TYPE, ENTITLEMENT_TYPE } from "../src/entitlement.js";
import { SCHEMA_PREFIX } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0067 (CON-OE-07): N and N−1, schema-unsupported, FAC-SEM-099.
const root = projectRoot();
const validator = await createValidator();
const valid = (schema: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const vectors = JSON.parse(readFileSync(path.join(root, "fixtures/vectors/protocol-revisions.json"), "utf8")) as { cases: Array<{ name: string; received: unknown; accepted: string[]; expect: unknown }> };

describe("protocol-revisions vectors", () => {
  it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => expect(negotiateRevision(c.received, c.accepted)).toEqual(c.expect));
  it("truncates a long received value to 80 characters", () => {
    const answer = negotiateRevision(`x/${"1".repeat(100)}`, ["fabric-device/0.1"]);
    expect("error" in answer && answer.error.data.protocol.length).toBe(80);
  });
});

describe("the register", () => {
  it("names every protocol revision a schema pins with const, plus the named-only list, and nothing else", () => {
    const pinned = new Set<string>();
    for (const file of readdirSync(path.join(root, "schemas"))) {
      for (const match of readFileSync(path.join(root, "schemas", file), "utf8").matchAll(/"const": "([a-z][a-z0-9.-]*\/[0-9][0-9.]*)"/g)) pinned.add(match[1] as string);
    }
    const registered = new Set([...PROTOCOL_REVISIONS].flatMap(([name, revisions]) => revisions.map((revision) => `${name}/${revision}`)));
    expect(registered).toEqual(new Set([...pinned, ...NAMED_ONLY]));
    for (const named of NAMED_ONLY) expect(pinned.has(named), named).toBe(false);
  });
  it("keeps every module's own revision constant at its protocol's newest revision, so a new revision widens them", () => {
    for (const constant of [COMMS_PROTOCOL, ESTATE_RECORD_SCHEMA, RELAY_PROTOCOL, DELTA_TYPE, HEARTBEAT_TYPE, ENVELOPE_TYPE, HANDOFF_FORMAT, SETTINGS_BACKUP_FORMAT, WINDOW_LEASE_TYPE, ENTITLEMENT_TYPE, ENTITLEMENT_KEY_SET_TYPE]) {
      const parsed = parseRevision(constant)!;
      expect(PROTOCOL_REVISIONS.get(parsed.name)?.at(-1), constant).toBe(parsed.revision);
    }
  });
  it("treats a named-only contract protocol as a contract protocol, not an extension", () => {
    expect(protocolsFindings(["fabric-interop/0.1", "fabric-interop/9"]).map((f) => f.instancePath)).toEqual(["/1"]);
  });
  it("gives N, and N−1 only when the register has one", () => {
    expect(acceptedRevisions("fabric-device")).toEqual(["fabric-device/0.1"]);
    expect(acceptedRevisions("fabric-device", "0.1")).toEqual(["fabric-device/0.1"]);
    expect(acceptedRevisions("fabric-device", "0.2")).toEqual([]);
    expect(acceptedRevisions("unknown")).toEqual([]);
  });
  it("gives N and N−1 of a protocol with three revisions, newest first", () => {
    const register = PROTOCOL_REVISIONS as Map<string, string[]>;
    register.set("test-protocol", ["1", "2", "3"]);
    try {
      expect(acceptedRevisions("test-protocol")).toEqual(["test-protocol/3", "test-protocol/2"]);
      expect(acceptedRevisions("test-protocol", "2")).toEqual(["test-protocol/2", "test-protocol/1"]);
      expect(acceptedRevisions("test-protocol", "1")).toEqual(["test-protocol/1"]);
      expect(protocolsFindings(["test-protocol/3", "test-protocol/2"])).toEqual([]);
      expect(protocolsFindings(["test-protocol/3", "test-protocol/1"]).map((f) => f.instancePath)).toEqual(["/1"]);
      expect(protocolsFindings(["test-protocol/1", "test-protocol/2", "test-protocol/3"]).map((f) => f.instancePath)).toEqual(["/2"]);
    } finally {
      register.delete("test-protocol");
    }
  });
  it("parses a revision whole, never a prefix", () => {
    expect(parseRevision("fabric-service/0.1")).toEqual({ name: "fabric-service", revision: "0.1" });
    for (const bad of ["fabric-service", "fabric-service/", "/0.1", "Fabric/1", "a/1.2.3.4", "a/1a", " a/1", 1]) expect(parseRevision(bad)).toBeUndefined();
  });
});

describe("FAC-SEM-099: a protocols list", () => {
  const paths = (value: unknown) => evaluateSemanticRules("protocols", value).map((f) => `${f.code} ${f.instancePath}`);
  it("passes the fixtures' lists and an extension protocol", () => {
    expect(paths({ protocols: ["fabric-device/0.1", "estate-record/1", "example.org-x/2", "example.org-x/1"] })).toEqual([]);
  });
  it("refuses a malformed entry, a repeat, an unpublished revision and a third revision", () => {
    expect(paths({ protocols: ["fabric-device"] })).toEqual(["FAC-SEM-099 /protocols/0"]);
    expect(paths({ protocols: ["fabric-device/0.1", "fabric-device/0.1"] })).toEqual(["FAC-SEM-099 /protocols/1"]);
    expect(paths({ protocols: ["example.org-x/1", "example.org-x/1"] })).toEqual(["FAC-SEM-099 /protocols/1"]);
    expect(paths({ protocols: ["fabric-device/0.2"] })).toEqual(["FAC-SEM-099 /protocols/0"]);
    expect(paths({ protocols: ["x/3", "x/2", "x/1"] })).toEqual(["FAC-SEM-099 /protocols/2"]);
    expect(paths({ protocols: ["fabric-device/0.2", "fabric-device/0.3", "fabric-device/0.1"] })).toEqual(["FAC-SEM-099 /protocols/0", "FAC-SEM-099 /protocols/1"]);
    expect(paths({ protocols: [] })).toEqual(["FAC-SEM-099 /protocols"]);
    expect(paths({ protocols: Array.from({ length: 65 }, (_, i) => `p${i}/1`) })).toEqual(["FAC-SEM-099 /protocols"]);
    expect(paths({ protocols: Array.from({ length: 64 }, (_, i) => `p${i}/1`) })).toEqual([]);
  });
  it("answers a value that is not a list with a finding, never by throwing", () => {
    expect(paths({ protocols: "fabric-device/0.1" })).toEqual(["FAC-SEM-099 /protocols"]);
    expect(protocolsFindings(null)).toEqual([{ code: "FAC-SEM-099", instancePath: "/protocols", message: "protocols is a list of protocol revisions" }]);
    expect(protocolsFindings(["fabric-device/0.1"])).toEqual([]);
  });
});

describe("the refusal is always a valid schema-unsupported document", () => {
  const many = Array.from({ length: 70 }, (_, i) => `p${i}/1`);
  const inputs: Array<[unknown, unknown[]]> = [
    ...vectors.cases.map((c) => [c.received, c.accepted] as [unknown, unknown[]]),
    ["x/2", ["x/1", "x/1", "not a revision", 7]],
    ["x/2", many],
    ["a".repeat(79) + "\u{1F600}", ["a/1"]],
    [{}, ["a/1"]],
  ];
  it.each(inputs.map((input, i) => [i, input] as const))("input %i", (_i, [received, accepted]) => {
    const answer = negotiateRevision(received, accepted);
    if ("error" in answer) expect(valid("schema-unsupported.schema.json", answer)).toBe(true);
  });
  it("answers its own fault, not a refusal, when nothing well-formed is accepted", () => {
    expect(negotiateRevision("x/1", [])).toEqual({ fault: "no-accepted-revisions" });
    expect(negotiateRevision("x/1", ["not a revision"])).toEqual({ fault: "no-accepted-revisions" });
    expect(negotiateRevision("x/1", acceptedRevisions("fabric-device", "0.2"))).toEqual({ fault: "no-accepted-revisions" });
    expect(negotiateRevision("x/1", "a/1" as unknown as string[])).toEqual({ fault: "no-accepted-revisions" });
  });
  it("de-duplicates and caps accepted at 64, and never splits a character", () => {
    const answer = negotiateRevision("x/2", [...many, "p0/1"]);
    expect("error" in answer && answer.error.data.accepted.length).toBe(64);
    const cut = negotiateRevision("a".repeat(79) + "\u{1F600}" + "b", ["a/1"]);
    expect("error" in cut && cut.error.data.protocol).toBe("a".repeat(79) + "\u{1F600}");
  });
});

describe("the revision pattern: code and schema agree at every limit", () => {
  const name = (n: number) => "a" + "b".repeat(n - 1);
  const cases: Array<[string, boolean]> = [
    [`${name(64)}/1`, true], [`${name(65)}/1`, false],
    ["a/1234", true], ["a/12345", false],
    ["a/1.2.3", true], ["a/1.2.3.4", false],
    ["a/1.1234", true], ["a/1.12345", false],
    ["a/1\n", false], ["é/1", false], ["a/１", false],
  ];
  it.each(cases)("%s → %s", (value, ok) => {
    expect(parseRevision(value) !== undefined).toBe(ok);
    expect(valid("schema-unsupported.schema.json", { error: { code: "schema-unsupported", message: "m", data: { protocol: "", accepted: [value] } } })).toBe(ok);
  });
});

describe("FAC-SEM-099 inside the documents that carry protocols", () => {
  const read = (name: string) => JSON.parse(readFileSync(path.join(root, "fixtures/positive", name), "utf8"));
  const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath}`).filter((f) => f.startsWith("FAC-SEM-099"));
  it("checks the well-known document's list", () => {
    const wellKnown = read("service-well-known-protocols.json");
    expect(codes("service-well-known", wellKnown)).toEqual([]);
    expect(codes("service-well-known", { ...wellKnown, protocols: ["fabric-service/0.1", "fabric-service/7"] })).toEqual(["FAC-SEM-099 /protocols/1"]);
  });
  it("checks the check-in's list, and reads a check-in without one as nothing", () => {
    const checkIn = read("device-check-in-protocols.json");
    expect(codes("device-check-in", checkIn)).toEqual([]);
    expect(codes("device-check-in", { ...checkIn, protocols: ["fabric-device/0.9"] })).toEqual(["FAC-SEM-099 /protocols/0"]);
    expect(codes("device-check-in", { ...checkIn, protocols: "fabric-device/0.1" })).toEqual(["FAC-SEM-099 /protocols"]);
    expect(codes("device-check-in", read("device-check-in.json"))).toEqual([]);
  });
  it("checks the enrollment response's list", () => {
    const response = read("device-enrollment-response-protocols.json");
    expect(codes("device-enrollment", { request: {}, response: { ...response, protocols: ["fabric-device/0.2"] } })).toEqual(["FAC-SEM-099 /response/protocols/0"]);
    expect(codes("device-enrollment", { request: {}, response })).toEqual([]);
  });
});
