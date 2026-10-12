import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { acceptedRevisions, negotiateRevision, parseRevision, PROTOCOL_REVISIONS, protocolsFindings } from "../src/protocol-revisions.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0067 (CON-OE-07): N and N−1, schema-unsupported, FAC-SEM-099.
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, "fixtures/vectors/protocol-revisions.json"), "utf8")) as { cases: Array<{ name: string; received: unknown; accepted: string[]; expect: unknown }> };

describe("protocol-revisions vectors", () => {
  it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => expect(negotiateRevision(c.received, c.accepted)).toEqual(c.expect));
  it("truncates a long received value to 80 characters", () => {
    const answer = negotiateRevision(`x/${"1".repeat(100)}`, ["fabric-device/0.1"]);
    expect("error" in answer && answer.error.data.protocol.length).toBe(80);
  });
});

describe("the register", () => {
  it("names every protocol revision a schema pins with const, and nothing a schema does not", () => {
    const pinned = new Set<string>();
    for (const file of readdirSync(path.join(root, "schemas"))) {
      for (const match of readFileSync(path.join(root, "schemas", file), "utf8").matchAll(/"const": "([a-z][a-z0-9.-]*\/[0-9][0-9.]*)"/g)) pinned.add(match[1] as string);
    }
    const registered = new Set([...PROTOCOL_REVISIONS].flatMap(([name, revisions]) => revisions.map((revision) => `${name}/${revision}`)));
    expect(registered).toEqual(pinned);
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
    expect(paths({ protocols: ["fabric-device/0.2"] })).toEqual(["FAC-SEM-099 /protocols/0"]);
    expect(paths({ protocols: ["x/3", "x/2", "x/1"] })).toEqual(["FAC-SEM-099 /protocols/2"]);
  });
  it("answers a value that is not a list with a finding, never by throwing", () => {
    expect(paths({ protocols: "fabric-device/0.1" })).toEqual(["FAC-SEM-099 /protocols"]);
    expect(protocolsFindings(null)).toEqual([{ code: "FAC-SEM-099", instancePath: "/protocols", message: "protocols is a list of protocol revisions" }]);
    expect(protocolsFindings(["fabric-device/0.1"])).toEqual([]);
  });
});
