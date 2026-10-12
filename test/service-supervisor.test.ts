import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { EXIT_ALREADY_RUNNING, LOCK_WAIT_MAX_MS, SUPERVISORS, lockWaitBudgetMs, supervisorMarker } from "../src/service-supervisor.js";

// DEC-0057 (CT-01): one copy under any supervisor. A copy without the lock touches nothing and exits 75 naming the
// holder; a copy its supervisor started, and marked so, may wait for the lock first, at most 300 s.
const root = projectRoot();
const read = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8")) as Record<string, unknown>;
const load = (name: string) => read(`fixtures/semantic/${name}.json`);
const findings = (value: unknown) => evaluateSemanticRules("service-lock-outcome", value);
const paths = (value: unknown) => findings(value).map((finding) => `${finding.code} ${finding.instancePath}`);

interface MarkerCase { name: string; env: Record<string, string>; argv: string[]; marker: { kind: string; manager?: string }; waitBudgetMs: number }
const vectors = read("fixtures/vectors/service-supervisor.json") as { managers: string[]; lockWaitMaxMs: number; exitStatus: number; cases: MarkerCase[] };

describe("the supervisor marker (DEC-0057)", () => {
  it("the vectors' constants are the code's", () => {
    expect(vectors.managers).toEqual([...SUPERVISORS]);
    expect(vectors.lockWaitMaxMs).toBe(LOCK_WAIT_MAX_MS);
    expect(vectors.exitStatus).toBe(EXIT_ALREADY_RUNNING);
    expect(vectors.cases.length).toBeGreaterThanOrEqual(15);
  });

  it.each(vectors.cases)("$name", (vector) => {
    const marker = supervisorMarker({ env: vector.env, argv: vector.argv });
    expect(marker.kind).toBe(vector.marker.kind);
    if (marker.kind === "supervised") expect(marker.manager).toBe(vector.marker.manager);
    expect(lockWaitBudgetMs(marker)).toBe(vector.waitBudgetMs);
  });

  it("covers the three forms the decision names: the variable, the argument, and both differing", () => {
    const kinds = vectors.cases.map((vector) => `${Object.keys(vector.env).length > 0 ? "env" : ""}${vector.argv.some((arg) => arg.startsWith("--fabric-supervisor")) ? "+arg" : ""}:${vector.marker.kind}`);
    expect(kinds).toEqual(expect.arrayContaining(["env:supervised", "+arg:supervised", "env+arg:conflict"]));
  });

  it("reads a malformed start as no marker, never throwing", () => {
    for (const start of [undefined, null, 7, "x", [], { env: null, argv: "--fabric-supervisor launchd" }, { env: { FABRIC_SERVICE_SUPERVISOR: 7 }, argv: [1, 2] }]) {
      expect(supervisorMarker(start).kind).toBe("manual");
    }
    // A marker inherited from Object.prototype is not the copy's environment.
    expect(supervisorMarker({ env: Object.create({ FABRIC_SERVICE_SUPERVISOR: "launchd" }) as object, argv: ["x"] }).kind).toBe("manual");
    expect(supervisorMarker({ env: {}, argv: ["x", "--fabric-supervisor", 7] })).toEqual({ kind: "manual", unreadable: "", forms: ["argument"] });
  });

  it("names the forms a conflict carries", () => {
    expect(supervisorMarker({ env: { FABRIC_SERVICE_SUPERVISOR: "launchd" }, argv: ["x", "--fabric-supervisor", "systemd"] })).toEqual({ kind: "conflict", values: ["launchd", "systemd"], forms: ["environment", "argument"] });
  });
});

describe("one copy: what a copy does when the lock is held (FAC-SEM-078)", () => {
  it.each(["service-lock-supervised-waited", "service-lock-supervised-took-over", "service-lock-task-argument", "service-lock-manual", "service-lock-conflict"])("%s conforms", (name) => {
    expect(findings(load(name))).toEqual([]);
  });

  it("refuses a hand-started copy that waited", () => {
    expect(paths(load("service-lock-manual-waited"))).toEqual(["FAC-SEM-078 /attempts", "FAC-SEM-078 /waitedMs"]);
  });

  it("holds a supervised copy to 300 s exactly: the limit passes, one millisecond more is refused", () => {
    const over = load("service-lock-over-limit");
    expect(paths(over)).toEqual(["FAC-SEM-078 /waitedMs"]);
    expect(findings({ ...over, waitedMs: LOCK_WAIT_MAX_MS })).toEqual([]);
  });

  it("refuses every side effect before the lock, naming it", () => {
    const found = findings(load("service-lock-side-effect"));
    expect(found.map((finding) => finding.instancePath)).toEqual(["/sideEffects/0", "/sideEffects/1"]);
    expect(found[0]?.message).toContain("bound its port");
    expect(paths({ ...load("service-lock-manual"), sideEffects: [{ port: 1 }] })).toEqual(["FAC-SEM-078 /sideEffects/0"]);
    expect(paths({ ...load("service-lock-manual"), sideEffects: "none" })).toEqual(["FAC-SEM-078 /sideEffects"]);
    expect(findings({ ...load("service-lock-manual"), sideEffects: undefined })).toEqual([]);
  });

  it("refuses a conflict that tried the lock, waited or took it", () => {
    expect(paths(load("service-lock-conflict-waited"))).toEqual(["FAC-SEM-078 /attempts", "FAC-SEM-078 /waitedMs", "FAC-SEM-078 /outcome/acquired"]);
  });

  it("refuses a conflict whose sentence does not name the markers present", () => {
    const conflict = load("service-lock-conflict");
    expect(paths({ ...conflict, outcome: { exitStatus: 75, message: "--fabric-supervisor disagrees." } })).toEqual(["FAC-SEM-078 /outcome/message"]);
    const twoArguments = { ...conflict, start: { env: {}, argv: ["x", "--fabric-supervisor", "node", "--fabric-supervisor=systemd"] }, outcome: { exitStatus: 75, message: "--fabric-supervisor is given twice." } };
    expect(findings(twoArguments)).toEqual([]);
  });

  it("refuses an exit other than 75 and a sentence that does not name the holder's pid", () => {
    expect(paths(load("service-lock-wrong-exit"))).toEqual(["FAC-SEM-078 /outcome/exitStatus", "FAC-SEM-078 /outcome/message"]);
    // The pid is a whole number in the sentence: 42420 does not name 4242.
    expect(paths({ ...load("service-lock-manual"), outcome: { exitStatus: 75, message: "Held by pid 42420." } })).toEqual(["FAC-SEM-078 /outcome/message"]);
    expect(paths({ ...load("service-lock-manual"), outcome: { exitStatus: 75 } })).toEqual(["FAC-SEM-078 /outcome/message"]);
  });

  it("refuses a supervised copy that never tried the lock", () => {
    expect(paths({ ...load("service-lock-supervised-waited"), attempts: 0 })).toEqual(["FAC-SEM-078 /attempts"]);
  });

  it("refuses unreadable numbers before comparing them", () => {
    const manual = load("service-lock-manual");
    for (const waitedMs of [Number.NaN, -1, "0", Number.POSITIVE_INFINITY, null]) expect(paths({ ...manual, waitedMs }), String(waitedMs)).toEqual(["FAC-SEM-078 /waitedMs"]);
    for (const waitedMs of [Number.POSITIVE_INFINITY, Number.NaN]) expect(findings({ ...load("service-lock-supervised-waited"), waitedMs })[0]?.message, String(waitedMs)).toContain("unreadable");
    for (const attempts of [1.5, -1, "1", Number.NaN]) expect(paths({ ...manual, attempts }), String(attempts)).toEqual(["FAC-SEM-078 /attempts"]);
    const supervised = load("service-lock-supervised-waited");
    expect(paths({ ...supervised, waitedMs: Number.NaN })).toEqual(["FAC-SEM-078 /waitedMs"]);
    const conflict = load("service-lock-conflict");
    expect(paths({ ...conflict, attempts: "0", waitedMs: "0" })).toEqual(["FAC-SEM-078 /attempts", "FAC-SEM-078 /waitedMs"]);
    for (const holderPid of [0, -4, 4242.5, "4242", undefined]) expect(paths({ ...manual, holderPid }), String(holderPid)).toEqual(["FAC-SEM-078 /holderPid"]);
    for (const outcome of [undefined, null, "exit 75", [75]]) expect(paths({ ...manual, outcome }), String(outcome)).toEqual(["FAC-SEM-078 /outcome"]);
  });
});
