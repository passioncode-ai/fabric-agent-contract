import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { estateRecordDigest, estateRecordRules } from "../src/estate-record-rules.js";
import { hubKeyCertified } from "../src/hub-key-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0128: a hub key per organization context, certified by the estate record beside the personal one, read by DL-14
// only for its own context and only while the record pins the organization.
type Json = Record<string, any>;
const root = projectRoot();
const RECORD = JSON.parse(readFileSync(path.join(root, "fixtures/positive/estate-record-organizations.json"), "utf8")) as Json;
const ORG = "org:org_3fh9p1zc";
const AT = new Date("2026-10-20T00:00:00Z");
const hubMachine = (RECORD.machines as Json[]).find((machine) => machine.hubKey) as Json;
const CONTEXT_KEY = (hubMachine.contextHubKeys as Json[])[0]?.key as Json;
const PERSONAL_KEY = hubMachine.hubKey as Json;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const redigest = (record: Json): Json => ({ ...record, digest: estateRecordDigest(record) });

describe("context hub keys in DL-14 (DEC-0128)", () => {
  it("certifies a context key for its own context only", () => {
    expect(hubKeyCertified(RECORD, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: ORG })).toEqual({ certified: true, machine: hubMachine.id, revision: RECORD.revision });
    expect(hubKeyCertified(RECORD, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT)).toMatchObject({ certified: false, detail: "kid-not-certified" });
    expect(hubKeyCertified(RECORD, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: "personal" })).toMatchObject({ certified: false, detail: "kid-not-certified" });
    expect(hubKeyCertified(RECORD, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: "org:org_7kq2m4xw" })).toMatchObject({ certified: false, detail: "kid-not-certified" });
  });

  it("never lets the personal key sign an organization's token", () => {
    expect(hubKeyCertified(RECORD, PERSONAL_KEY.kid, PERSONAL_KEY.x, AT)).toMatchObject({ certified: true });
    expect(hubKeyCertified(RECORD, PERSONAL_KEY.kid, PERSONAL_KEY.x, AT, undefined, { context: ORG })).toMatchObject({ certified: false, detail: "kid-not-certified" });
    // A context that is neither personal nor an organization's fails closed.
    for (const context of ["org:", "Org:org_3fh9p1zc", "team:x"]) expect(hubKeyCertified(RECORD, PERSONAL_KEY.kid, PERSONAL_KEY.x, AT, undefined, { context })).toMatchObject({ detail: "kid-not-certified" });
  });

  it("refuses a context key whose organization is unpinned, revoked, or whose public key differs", () => {
    const unpinned = { ...RECORD, organizations: (RECORD.organizations as Json[]).filter((pin) => pin.org !== ORG) };
    expect(hubKeyCertified(unpinned, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: ORG })).toMatchObject({ detail: "kid-not-certified" });
    expect(hubKeyCertified({ ...RECORD, organizations: "none" }, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: ORG })).toMatchObject({ detail: "kid-not-certified" });
    const { organizations: _pins, ...noPins } = RECORD;
    expect(hubKeyCertified(noPins, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: ORG })).toMatchObject({ detail: "kid-not-certified" });
    expect(hubKeyCertified(RECORD, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: ORG, extraRevocations: [{ kind: "hub-key", ref: CONTEXT_KEY.kid }] })).toMatchObject({ detail: "kid-not-certified" });
    expect(hubKeyCertified(RECORD, CONTEXT_KEY.kid, PERSONAL_KEY.x, AT, undefined, { context: ORG })).toMatchObject({ detail: "kid-not-certified" });
    const garbled = { ...RECORD, machines: (RECORD.machines as Json[]).map((machine) => (machine.id === hubMachine.id ? { ...machine, contextHubKeys: "none" } : machine)) };
    expect(hubKeyCertified(garbled, CONTEXT_KEY.kid, CONTEXT_KEY.x, AT, undefined, { context: ORG })).toMatchObject({ detail: "kid-not-certified" });
  });

  it("answers FAC-SEM-081 with the context the verifier serves", () => {
    const base = { record: RECORD, kid: CONTEXT_KEY.kid, x: CONTEXT_KEY.x, at: "2026-10-20T00:00:00Z" };
    expect(codes("delegation-hub-key", { ...base, context: ORG, answer: "certified" })).toEqual([]);
    expect(codes("delegation-hub-key", { ...base, answer: "kid-not-certified" })).toEqual([]);
    expect(codes("delegation-hub-key", { ...base, answer: "certified" })).toEqual(["FAC-SEM-081"]);
  });
});

describe("context hub keys in the record's rules (DEC-0128)", () => {
  it("reads only a context issuer's opaque part for the estate id (FAC-SEM-147)", () => {
    expect(codes("estate-record", redigest({ ...RECORD, estate: "e" }))).not.toContain("FAC-SEM-147");
    expect(codes("estate-record", redigest({ ...RECORD, estate: "C7D2A91F" }))).toContain("FAC-SEM-147");
  });

  it("keeps a context key off a machine that is not full (FAC-SEM-134)", () => {
    const { hubKey: _drop, ...noHub } = hubMachine;
    const record = redigest({ ...RECORD, machines: (RECORD.machines as Json[]).map((machine) => (machine.id === hubMachine.id ? { ...noHub, profile: "member" } : machine)) });
    expect(codes("estate-record", record)).toContain("FAC-SEM-134");
  });

  it("flags a context twice on one machine, a reused key and a key of small order (FAC-SEM-073)", () => {
    const twice = (entries: Json[]) => redigest({ ...RECORD, machines: (RECORD.machines as Json[]).map((machine) => (machine.id === hubMachine.id ? { ...machine, contextHubKeys: entries } : machine)) });
    const entry = { context: ORG, key: CONTEXT_KEY };
    expect(codes("estate-record", twice([entry, { context: ORG, key: { ...CONTEXT_KEY, kid: "hub-ctx-a-2", x: "Q2T0QOvPprzOcLfCCzIP1Ef2bIRiTqgZQB8uwN3qqUA" } }]))).toEqual(["FAC-SEM-073"]);
    expect(codes("estate-record", twice([{ context: ORG, key: { ...CONTEXT_KEY, x: PERSONAL_KEY.x } }]))).toEqual(["FAC-SEM-073"]);
    expect(evaluateSemanticRules("estate-record", twice([{ context: ORG, key: { ...CONTEXT_KEY, x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" } }])).map((finding) => finding.message).join(" ")).toContain("small order");
    expect(codes("estate-record", twice([{ context: ORG, key: "none" }]))).toEqual([]);
  });

  it("revokes a dropped or replaced context key in the same revision (FAC-SEM-114)", () => {
    const parent = RECORD;
    const dropped = (change: (machine: Json) => Json, revocations: Json[] = []) => {
      const next = redigest({
        ...parent,
        revision: parent.revision + 1,
        parent: parent.digest,
        revocations: [...(parent.revocations as Json[]), ...revocations],
        machines: (parent.machines as Json[]).map((machine) => (machine.id === hubMachine.id ? change(machine) : machine))
      });
      return [...new Set((estateRecordRules("estate-record-revision", { parent, next }) ?? []).map((finding) => finding.code))];
    };
    expect(dropped((machine) => ({ ...machine, contextHubKeys: [] }))).toEqual(["FAC-SEM-114"]);
    expect(dropped((machine) => ({ ...machine, contextHubKeys: [] }), [{ kind: "hub-key", ref: CONTEXT_KEY.kid, revokedAt: parent.issuedAt }])).toEqual([]);
    expect(dropped((machine) => machine)).toEqual([]);
    // Relabelled to the other pinned organization, the same kid and key: a key that leaves its context is revoked.
    expect(dropped((machine) => ({ ...machine, contextHubKeys: [{ context: "org:org_7kq2m4xw", key: CONTEXT_KEY }] }))).toEqual(["FAC-SEM-114"]);
    const removed = redigest({
      ...parent,
      revision: parent.revision + 1,
      parent: parent.digest,
      machines: (parent.machines as Json[]).filter((machine) => machine.id !== hubMachine.id),
      revocations: [...(parent.revocations as Json[]), { kind: "machine", ref: hubMachine.id, revokedAt: parent.issuedAt }, { kind: "hub-key", ref: PERSONAL_KEY.kid, revokedAt: parent.issuedAt }]
    });
    const removedCodes = (estateRecordRules("estate-record-revision", { parent, next: removed }) ?? []).map((finding) => finding.message);
    expect(removedCodes.some((message) => message.includes("context hub key"))).toBe(true);
    const removedRevoked = redigest({ ...removed, revocations: [...(removed.revocations as Json[]), { kind: "hub-key", ref: CONTEXT_KEY.kid, revokedAt: parent.issuedAt }] });
    expect((estateRecordRules("estate-record-revision", { parent, next: removedRevoked }) ?? []).some((finding) => finding.message.includes("context hub key"))).toBe(false);
  });
});

describe("unlinkable enrollments (DEC-0128 FAC-SEM-148, FAC-SEM-149)", () => {
  it("flags each value two enrollments share, and the estate id as a device id", async () => {
    const { enrollmentsLinkable, nodeEnrollmentRules } = await import("../src/node-enrollments.js");
    const one = { org: "org:org-a", deviceId: "d-1", kids: ["d-1#sig"], publicKeys: ["k-1"], telemetryKeyId: "t-1", collectorIds: ["c-1"] };
    const two = { org: "org:org-b", deviceId: "d-2", kids: ["d-2#sig"], publicKeys: ["k-2"], telemetryKeyId: "t-2", collectorIds: ["c-2"] };
    expect(enrollmentsLinkable({ estateMachineId: "m-1", enrollments: [one, two] })).toBe(false);
    expect(enrollmentsLinkable("registry")).toBe(false);
    for (const shared of [{ org: "org:org-a" }, { deviceId: "d-1" }, { kids: ["d-1#sig"] }, { publicKeys: ["k-1"] }, { telemetryKeyId: "t-1" }, { collectorIds: ["c-1"] }, { deviceId: "m-1" }, { kids: ["m-1#sig"] }, { publicKeys: ["m-1"] }, { telemetryKeyId: "m-1" }, { collectorIds: ["m-1"] }, { collectorIds: ["t-1"] }]) {
      expect(enrollmentsLinkable({ estateMachineId: "m-1", enrollments: [one, { ...two, ...shared }] }), JSON.stringify(shared)).toBe(true);
    }
    // Shapes the registry does not hold are read as absent, never as a match.
    expect(nodeEnrollmentRules("node-enrollments", { enrollments: [{ ...one, kids: "d-1#sig", deviceId: 7 }, { ...two, kids: [3] }] })).toEqual([]);
    expect(nodeEnrollmentRules("check-in-outbound", { checkIn: "x" })).toEqual([]);
    expect(nodeEnrollmentRules("check-in-response-outbound", {})).toEqual([]);
    expect(nodeEnrollmentRules("another", {})).toBeUndefined();
  });
});

describe("moving the hub with its context keys (DEC-0128)", () => {
  it("reports a context key added and removed beside the personal one", async () => {
    const { hubMove } = await import("../src/hub-move.js");
    const moved = (RECORD.machines as Json[]).map((machine) =>
      machine.id === hubMachine.id ? { ...machine, contextHubKeys: [{ context: ORG, key: { ...CONTEXT_KEY, kid: "hub-ctx-a-2" } }] } : machine);
    const next = { ...RECORD, machines: moved, revocations: [{ kind: "hub-key", ref: CONTEXT_KEY.kid }] };
    expect(hubMove(RECORD, next)).toEqual({
      moved: true,
      added: [{ machine: hubMachine.id, kid: "hub-ctx-a-2", context: ORG }],
      removed: [{ machine: hubMachine.id, kid: CONTEXT_KEY.kid, context: ORG, revoked: true }]
    });
    expect(hubMove(RECORD, RECORD)).toEqual({ moved: false, added: [], removed: [] });
    const junk = { ...RECORD, machines: [{ id: 7, contextHubKeys: [{ context: ORG, key: CONTEXT_KEY }] }, { id: "m-x", contextHubKeys: [{ context: 1, key: CONTEXT_KEY }, { context: ORG, key: "k" }, { context: ORG, key: { kid: 1 } }] }] };
    expect(hubMove(junk, junk)).toEqual({ moved: false, added: [], removed: [] });
  });
});
