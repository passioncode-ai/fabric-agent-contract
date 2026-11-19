import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { DOOR_REFUSALS, doorAdmits, doorContext, issueKeyAdmitted } from "../src/door-context.js";
import { strictTime } from "../src/rfc3339.js";
import { VECTOR_FILE, buildDoorContextVectors } from "../tools/vectors/door-context.js";

// DEC-0185 (CT-339): the context a key-issuing door proves, the issuer's rule and the door's own check.
type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;
const trustOf = (trust: Json) => ({
  now: new Date(strictTime(trust.now)),
  keySets: Object.fromEntries((trust.keySets as string[]).map((org) => [org, vectors.keySets[org]])),
  ...(trust.estate === null ? {} : { estate: vectors.estates[trust.estate] })
});

describe("the vectors (DEC-0185 DC-5)", () => {
  it("are the committed vector file, written by its generator", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildDoorContextVectors());
  });
  it("cover every refusal of the closed list and both sources", () => {
    const read = vectors.read as Json[];
    expect(new Set(read.filter((c) => !c.expected.ok).map((c) => c.expected.refusal))).toEqual(new Set(DOOR_REFUSALS));
    expect(new Set(read.filter((c) => c.expected.ok).map((c) => c.expected.source))).toEqual(new Set(["org-instance", "estate-record"]));
  });
});

describe("doorContext (DEC-0185 DC-1 to DC-3)", () => {
  for (const entry of vectors.read as Json[]) {
    it(entry.name, () => {
      expect(doorContext(entry.door, entry.asked, trustOf(entry.trust))).toEqual(entry.expected);
      expect(doorAdmits(entry.door, entry.asked, trustOf(entry.trust))).toBe(entry.expected.ok);
    });
  }
  it("refuses a trust that is not an object or carries no clock", () => {
    const door = vectors.read[0].door;
    expect(doorContext(door, "org:org-a", null as never)).toEqual({ ok: false, refusal: "context-invalid" });
    expect(doorContext(door, "org:org-a", { now: "2026-11-19T12:00:00Z" } as never)).toEqual({ ok: false, refusal: "context-invalid" });
  });
  it("reads a remote door's claim only from a statement, never from a member the door writes about itself", () => {
    const own = { kind: "remote", origin: "https://keys.org-a.example", org: "org:org-a", context: "org:org-a" };
    expect(doorContext(own, "org:org-a", { now: new Date("2026-11-19T12:00:00Z") })).toEqual({ ok: false, refusal: "door-claim-absent" });
  });
  it("reads a statement whose instance id is not a string as malformed", () => {
    const statement = { ...vectors.read[0].door.statement, instanceId: 7 };
    const verdict = doorContext({ kind: "remote", origin: "https://keys.org-a.example", statement }, "org:org-a", trustOf({ now: "2026-11-19T12:00:00Z", keySets: ["org:org-a"], estate: null }));
    expect(verdict).toEqual({ ok: false, refusal: "door-claim-invalid", detail: "malformed" });
  });
  it("refuses a verdict with no problem named as unverified, and a slot entry whose context is not a string", () => {
    const record = vectors.estates.verified.record as Json;
    const odd = { ...record, machines: [{ id: "mac-1", secrets: [{ agentRef: "a", slot: "S", from: "mac-1", context: 3 }, "x"] }] };
    const local = { kind: "local", machineId: "mac-1", agentRef: "a", slot: "S" };
    const now = new Date("2026-11-19T12:00:00Z");
    expect(doorContext(local, "personal", { now, estate: { record: odd, verdict: { ok: true, digest: record.digest } } })).toEqual({ ok: false, refusal: "door-claim-absent" });
    expect(doorContext(local, "personal", { now, estate: { record, verdict: { ok: false } } })).toEqual({ ok: false, refusal: "door-claim-invalid", detail: "record-unverified" });
    expect(doorContext(local, "personal", { now, estate: { record: { digest: record.digest }, verdict: { ok: true, digest: record.digest } } })).toEqual({ ok: false, refusal: "door-claim-absent" });
  });
});

describe("issueKeyAdmitted (DEC-0185 DC-7)", () => {
  for (const entry of vectors.issue as Json[]) {
    it(entry.name, () => {
      expect(issueKeyAdmitted(entry.doorOwn, entry.keyContext)).toEqual(entry.expected);
    });
  }
});
