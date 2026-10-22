import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DIRECTORY_MAX, admitJob, agentNetworkRules, estateDirectory, jobCallerKey, loadExtensionRules, nextQueuedJob, organizationDirectory, queueStatusMessage, readQueuePosition } from "../src/agent-network.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { buildAgentNetworkVectors } from "../tools/vectors/agent-network.js";

// DEC-0104 (CT-84): the directory, the call queue and the load report; FAC-SEM-130 to FAC-SEM-132.
type Json = Record<string, any>;
const read = (file: string) => readFileSync(path.join(projectRoot(), file), "utf8");
const vectors = JSON.parse(read("fixtures/vectors/agent-network.json")) as Record<"estate" | "organization" | "queue" | "admit" | "caller" | "position", Json[]>;
const ajv = await createValidator();
const nul = (value: unknown) => value ?? null;

describe("agent network vectors (DEC-0104)", () => {
  it("the vector file is the generator's output", () => {
    expect(read("fixtures/vectors/agent-network.json")).toBe(buildAgentNetworkVectors());
  });
  it.each(vectors.estate)("estate: $name", ({ record, unlisted, expected }) => {
    expect(estateDirectory(record, unlisted)).toEqual(expected);
  });
  it.each(vectors.organization)("organization: $name", ({ orgId, held, own, unlisted, viewer, at, expected }) => {
    expect(organizationDirectory(orgId, held, own, unlisted, viewer, at)).toEqual(expected);
  });
  it.each(vectors.queue)("queue: $name", ({ queue, running, limits, expected }) => {
    expect(nul(nextQueuedJob(queue, running, limits))).toEqual(expected);
  });
  it.each(vectors.admit)("admit: $name", ({ queue, running, job, limits, retryAfterSeconds, expected }) => {
    expect(admitJob(queue, running, job, limits, retryAfterSeconds)).toEqual(expected);
  });
  it.each(vectors.caller)("caller: $name", ({ accepted, credential, expected }) => {
    expect(nul(jobCallerKey(accepted, credential))).toEqual(expected);
  });
  it.each(vectors.position)("position: $name", ({ statusMessage, expected }) => {
    expect(nul(readQueuePosition(statusMessage))).toEqual(expected);
  });
});

describe("the reference functions", () => {
  it("never throw on any shape", () => {
    const shapes: unknown[] = [undefined, null, 1, "x", [], {}, [null], [{ id: 1 }], { machines: [{ packages: [null] }] }];
    for (const a of shapes) {
      for (const b of shapes) {
        expect(() => estateDirectory(a, b)).not.toThrow();
        expect(() => organizationDirectory("org_1", a, b, a, "admin", "2026-10-22T09:00:00Z")).not.toThrow();
        expect(() => nextQueuedJob(a, b, { concurrency: 1, perCaller: 1, queueMax: 1 })).not.toThrow();
        expect(() => admitJob(a, b, a, b, a)).not.toThrow();
      }
      expect(() => readQueuePosition(a)).not.toThrow();
      expect(() => jobCallerKey(a, a)).not.toThrow();
    }
  });
  it("organizationDirectory refuses an id that is not a string and an absent instant", () => {
    expect(organizationDirectory(7, [], ["urn:fabric:agent:example:writer"], [], "admin", "2026-10-22T09:00:00Z")).toEqual([]);
    expect(organizationDirectory("org_1", [], ["urn:fabric:agent:example:writer"], [], "admin", undefined)).toEqual([]);
  });
  it("organizationDirectory skips a registration whose window or agent is unreadable", () => {
    const base = { state: "active", agentRef: "urn:fabric:agent:example:writer", startsAt: "2026-10-01T00:00:00Z", expiresAt: "2026-11-01T00:00:00Z" };
    const at = "2026-10-22T09:00:00Z";
    expect(organizationDirectory("org_1", [{ ...base, agentRef: 3 }], [], [], "member", at)).toEqual([]);
    expect(organizationDirectory("org_1", [{ ...base, startsAt: undefined }], [], [], "member", at)).toEqual([]);
    expect(organizationDirectory("org_1", [{ ...base, expiresAt: 5 }], [], [], "member", at)).toEqual([]);
    expect(organizationDirectory("org_1", [base], [], [], "member", at)).toEqual([{ agentRef: base.agentRef, context: "org:org_1", listed: true }]);
  });
  it("a directory carries at most DIRECTORY_MAX entries, the first in order", () => {
    const packages = Array.from({ length: DIRECTORY_MAX + 1 }, (_, n) => ({ agentRef: `urn:fabric:agent:example:a${String(n).padStart(5, "0")}` }));
    const entries = estateDirectory({ machines: [{ packages }] }, []);
    expect(entries).toHaveLength(DIRECTORY_MAX);
    expect(entries.at(-1)?.agentRef).toBe(`urn:fabric:agent:example:a${String(DIRECTORY_MAX - 1).padStart(5, "0")}`);
    const own = packages.map((p) => p.agentRef);
    expect(organizationDirectory("org_1", [], own, [], "admin", "2026-10-22T09:00:00Z")).toHaveLength(DIRECTORY_MAX);
    const doc = { type: "agent-directory/1", source: "estate", viewer: "owner", generatedAt: "2026-10-22T09:00:00Z", entries };
    expect(agentNetworkRules("agent-directory-view", { source: "estate", record: { machines: [{ packages }] }, directory: doc })).toEqual([]);
  });
  it("compares entries by member, not by the order members are written in", () => {
    const record = { machines: [{ packages: [{ agentRef: "urn:fabric:agent:example:writer" }] }] };
    const directory = { source: "estate", viewer: "owner", entries: [{ listed: true, context: "personal", agentRef: "urn:fabric:agent:example:writer" }] };
    expect(agentNetworkRules("agent-directory-view", { source: "estate", record, directory })).toEqual([]);
    expect(agentNetworkRules("agent-directory-view", { source: "estate", record, directory: { ...directory, entries: [{ ...directory.entries[0], extra: 1 }] } })?.map((f) => f.instancePath)).toEqual(["/directory/entries"]);
    expect(agentNetworkRules("agent-directory-view", { source: "estate", record, directory: { ...directory, entries: [null] } })?.map((f) => f.instancePath)).toEqual(["/directory/entries"]);
  });
  it("an organization's directory is never an owner's", () => {
    const value = { source: "organization", orgId: "org_1", held: [], own: [], viewer: "owner", at: "2026-10-22T09:00:00Z", directory: { source: "organization", viewer: "owner", entries: [] } };
    expect(agentNetworkRules("agent-directory-view", value)?.map((f) => f.instancePath)).toEqual(["/directory/viewer"]);
  });
  it("estateDirectory reads an unlisted list only of agentRef and context pairs", () => {
    const record = { machines: [{ packages: [{ agentRef: "urn:fabric:agent:example:writer" }] }] };
    expect(estateDirectory(record, [{ agentRef: "urn:fabric:agent:example:writer" }, "x"])).toEqual([{ agentRef: "urn:fabric:agent:example:writer", context: "personal", listed: true }]);
  });
  it("a running job without a caller holds a slot but no caller's count; limits that are not integers start nothing", () => {
    const queue = [{ id: "j1", caller: "a", at: "2026-10-22T09:00:01Z" }];
    expect(nextQueuedJob(queue, [{ id: "j0" }], { concurrency: 2, perCaller: 1, queueMax: 1 })).toBe("j1");
    expect(nextQueuedJob(queue, "j0", { concurrency: 1, perCaller: 1, queueMax: 1 })).toBe("j1");
    expect(nextQueuedJob(queue, [], { concurrency: 1.5, perCaller: 1, queueMax: 1 })).toBeUndefined();
    expect(nextQueuedJob(queue, [], { concurrency: 1, perCaller: 1, queueMax: -1 })).toBeUndefined();
    expect(nextQueuedJob(queue, [], null)).toBeUndefined();
    expect(nextQueuedJob([{ id: "j1", caller: "a", at: "2026-10-22T09:00:01Z" }, { id: "j1", caller: "b", at: "2026-10-22T09:00:01Z" }], [], { concurrency: 1, perCaller: 1, queueMax: 9 })).toBe("j1");
    expect(nextQueuedJob([{ id: "jb", caller: "a", at: "2026-10-22T09:00:01Z" }, { id: "ja", caller: "b", at: "2026-10-22T09:00:01Z" }, { id: "jc", caller: "c", at: "2026-10-22T09:00:01Z" }], [], { concurrency: 1, perCaller: 1, queueMax: 9 })).toBe("ja");
  });
  it("admitJob reads a queue that is not a list as empty and refuses a job it cannot read", () => {
    const job = { id: "jn", caller: "n", at: "2026-10-22T09:00:09Z" };
    expect(admitJob(undefined, [{ id: "r", caller: "a" }], job, { concurrency: 1, perCaller: 1, queueMax: 5 }, 9)).toEqual({ admit: true });
    expect(admitJob([], [], { id: "jn" }, { concurrency: 1, perCaller: 1, queueMax: 5 }, 9)).toMatchObject({ admit: false, error: { data: { retryAfterSeconds: 9 } } });
    expect(admitJob([], [], null, { concurrency: 1, perCaller: 1, queueMax: 5 }, 1.5)).toMatchObject({ admit: false, error: { data: { retryAfterSeconds: 60 } } });
  });
  it("queueStatusMessage writes what readQueuePosition reads", () => {
    expect(readQueuePosition(queueStatusMessage(2, 5))).toEqual({ position: 2, length: 5 });
    for (const [p, l] of [[0, 3], [1.5, 3], [4, 3], [1, 1000000]]) expect(queueStatusMessage(p as number, l as number)).toBeUndefined();
    expect(readQueuePosition("queued 1234567 of 1234567")).toBeUndefined();
  });
});

describe("the semantic rules (FAC-SEM-130 to FAC-SEM-132)", () => {
  const dir = path.join(projectRoot(), "fixtures/semantic");
  const fixtures = readdirSync(dir).filter((name) => /^(agent-directory-view|job-queue|service-load)-/.test(name)).map((name) => ({ name, ...(JSON.parse(readFileSync(path.join(dir, name), "utf8")) as { kind: string; expect: string[]; input: unknown }) }));
  it("has a passing and a failing fixture of each kind", () => {
    for (const kind of ["agent-directory-view", "job-queue", "service-load"]) {
      expect(fixtures.some((f) => f.kind === kind && f.expect.length === 0), kind).toBe(true);
      expect(fixtures.some((f) => f.kind === kind && f.expect.length > 0), kind).toBe(true);
    }
  });
  it.each(fixtures)("$name", ({ kind, input, expect: codes }) => {
    expect(evaluateSemanticRules(kind, input).map((f) => f.code)).toEqual(codes);
  });
  it("answers undefined for a kind it does not read", () => {
    expect(agentNetworkRules("service-well-known", {})).toBeUndefined();
  });
  it("job-queue reads an absent started as none, and names the job a node should have started", () => {
    const value = { queue: [{ id: "j1", caller: "a", at: "2026-10-22T09:00:01Z" }], running: [], limits: { concurrency: 1, perCaller: 1, queueMax: 1 } };
    expect(agentNetworkRules("job-queue", value)?.[0]?.message).toContain("j1");
    expect(agentNetworkRules("job-queue", { ...value, queue: [] })).toEqual([]);
    expect(agentNetworkRules("job-queue", { ...value, queue: [], started: "j1" })?.[0]?.message).toBe("nothing may start now");
  });
  it("agent-directory-view refuses a directory without entries", () => {
    const value = { source: "estate", record: { machines: [] }, directory: null };
    expect(agentNetworkRules("agent-directory-view", value)?.map((f) => f.instancePath)).toEqual(["/directory/source", "/directory/viewer", "/directory/entries"]);
  });
  it("service-load reads an unreadable report without throwing, and checks only what it can read", () => {
    expect(agentNetworkRules("service-load", { windows: [{ start: 1, byContext: [{ context: 2, runMs: { p50: "1", p95: 0 } }] }] })).toEqual([]);
    expect(agentNetworkRules("service-load", { windowSeconds: 60, generatedAt: "2026-10-22T10:00:00Z", windows: [{ start: "2026-10-22T09:00:00Z", byContext: [{ context: "personal", completed: 1, failed: 0, runMs: { p50: 1, p95: 2 } }] }] })).toEqual([]);
  });
});

describe("the wire", () => {
  const valid = (schema: string, value: unknown) => validateDocument(ajv, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
  it("names the load key with the contract's other extension keys", () => {
    expect(EXTENSION_KEYS.load).toBe("https://fabric.passioncode.ai/agent-contract/extensions/load/0.1");
  });
  it("every directory a vector derives is a valid agent-directory/1", () => {
    for (const entry of [...vectors.estate, ...vectors.organization]) {
      const doc = { type: "agent-directory/1", source: "orgId" in entry ? "organization" : "estate", viewer: entry.viewer ?? "owner", generatedAt: "2026-10-22T09:00:00Z", entries: entry.expected };
      expect(valid("agent-directory.schema.json", doc), entry.name).toBe(true);
    }
  });
  it("every queue-full refusal admitJob answers is a valid start refusal, and never ends a job", () => {
    for (const entry of vectors.admit.filter((e) => e.expected.admit === false)) {
      expect(valid("interop-tool-error.schema.json", { error: entry.expected.error }), entry.name).toBe(true);
      expect(valid("interop-job.schema.json", { job: { id: "job_1", status: "failed", updatedAt: "2026-10-22T09:00:00Z", error: entry.expected.error } }), entry.name).toBe(false);
    }
  });
  it("checks the load key in a well-known document (FAC-SEM-133), and nothing without it", () => {
    const wellKnown = JSON.parse(read("fixtures/positive/service-well-known.json")) as Json;
    const ext = JSON.parse(read("fixtures/positive/service-load-extension.json")) as Json;
    expect(loadExtensionRules(wellKnown)).toEqual([]);
    expect(loadExtensionRules({ ...wellKnown, extensions: { [EXTENSION_KEYS.load]: ext } })).toEqual([]);
    const bad = { ...wellKnown, extensions: { [EXTENSION_KEYS.load]: { ...ext, path: "load" } } };
    const findings = evaluateSemanticRules("service-well-known", bad);
    expect(findings.map((f) => f.code)).toEqual(["FAC-SEM-133"]);
    expect(findings[0]?.instancePath).toBe("/extensions/https:~1~1fabric.passioncode.ai~1agent-contract~1extensions~1load~10.1");
    expect(loadExtensionRules({ extensions: null })).toEqual([]);
  });
  it("a queued job's message travels in a valid working job", () => {
    expect(valid("interop-job.schema.json", { job: { id: "job_1", status: "working", statusMessage: queueStatusMessage(1, 3), updatedAt: "2026-10-22T09:00:00Z" } })).toBe(true);
  });
});
