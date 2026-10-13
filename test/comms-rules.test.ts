import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { COMMS_TRANSITIONS, evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, createValidatorSync, validateDocument } from "../src/validator.js";
import { findingSubmitAnswer } from "../src/comms-finding.js";

const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => f.code);
const submit = { idempotency: { epoch: 1, key: "k-00000001" }, thread: { new: { participants: ["proj-a"] } }, kind: "request", body: { text: "x" }, request: { target: "proj-a", capability: "a.b" } };

describe("fabric-project-comms/0.1 semantic rules (DEC-0022, proposed)", () => {
  it("FAC-SEM-026 accepts a coherent request and flags a target outside the new thread", () => {
    expect(codes("comms-submit", submit)).toEqual([]);
    expect(codes("comms-submit", { ...submit, request: { target: "proj-z", capability: "a.b" } })).toContain("FAC-SEM-026");
    expect(codes("comms-submit", { ...submit, kind: "message" })).toContain("FAC-SEM-026");
  });

  it("FAC-SEM-027 allows every table transition and refuses the rest", () => {
    for (const [op, pairs] of Object.entries(COMMS_TRANSITIONS)) for (const [from, to] of pairs) {
      // A settling record names who settled the request (FAC-SEM-109, DEC-0081).
      const settledBy = op === "complete" || op === "reconcile" ? { settledBy: "responder" } : {};
      expect(codes("comms-transition", { op, from, to, observed: true, ...settledBy }), `${op} ${from}->${to}`).toEqual([]);
    }
    expect(codes("comms-transition", { op: "complete", from: "queued", to: "completed", observed: true })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "expire", from: "accepted", to: "expired" })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "cancel", from: "in_progress", to: "cancelled" })).toContain("FAC-SEM-027");
  });

  it("FAC-SEM-027 settles a started effect only by an observed result", () => {
    expect(codes("comms-transition", { op: "complete", from: "in_progress", to: "completed", observed: false })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "reconcile", from: "outcome_unknown", to: "failed_known" })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "complete", from: "accepted", to: "completed", settledBy: "responder" })).toEqual([]);
    // A settling record without settledBy is refused, so a record cannot pass as the responder's by omission (DEC-0081).
    expect(codes("comms-transition", { op: "complete", from: "accepted", to: "completed" })).toEqual(["FAC-SEM-109"]);
  });

  it("FAC-SEM-027 has no abandon path and never reopens a settlement (DEC-0081)", () => {
    // outcome_unknown leaves only by an observed reconciliation: no operation moves it to cancelled.
    for (const [op, pairs] of Object.entries(COMMS_TRANSITIONS)) expect(pairs.some(([from, to]) => from === "outcome_unknown" && to === "cancelled"), op).toBe(false);
    expect(codes("comms-transition", { op: "cancel", from: "outcome_unknown", to: "cancelled", observed: true })).toEqual(["FAC-SEM-027"]);
    expect(codes("comms-transition", { op: "reconcile", from: "outcome_unknown", to: "cancelled", observed: true, settledBy: "owner", summary: "x", principal: { kind: "operator", id: "o", provenance: "trusted" } })).toEqual(["FAC-SEM-027"]);
    // A late responder finds the request terminal: neither a completion nor a reconciliation moves it again.
    for (const from of ["completed", "failed_known"]) for (const op of ["complete", "reconcile"]) for (const to of ["completed", "failed_known"]) {
      expect(codes("comms-transition", { op, from, to, observed: true, settledBy: "responder" }), `${op} ${from}->${to}`).toEqual(["FAC-SEM-027"]);
    }
  });

  it("FAC-SEM-027 answers an op that names an Object.prototype member with a finding, never by throwing", () => {
    for (const op of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(() => evaluateSemanticRules("comms-transition", { op, from: "queued", to: "claimed" }), op).not.toThrow();
      expect(codes("comms-transition", { op, from: "queued", to: "claimed" }), op).toEqual(["FAC-SEM-027"]);
    }
  });

  describe("FAC-SEM-109: who settled a request (DEC-0081)", () => {
    const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/comms-settlement.json"), "utf8")) as { cases: Array<{ name: string; record: unknown; expect: string[] }> };
    const paths = (value: unknown) => evaluateSemanticRules("comms-transition", value).map((f) => `${f.code} ${f.instancePath}`);
    it("covers the boundaries a port must hold", () => {
      const names = vectors.cases.map((c) => c.name);
      for (const name of ["owner-summary-2000-astral-characters", "owner-summary-2001-characters", "owner-summary-empty", "owner-abandons-to-cancelled", "settled-by-null", "owner-provenance-capitalised", "reconcile-record-without-settled-by", "complete-record-without-settled-by"]) expect(names).toContain(name);
      expect(new Set(names).size).toBe(names.length);
    });
    it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
      expect(paths(c.record)).toEqual(c.expect);
    });
    it("counts the owner's summary as the schema counts com.reconcile's summary, on the same inputs", async () => {
      const validator = await createValidator();
      const args = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/comms-reconcile-owner.json"), "utf8")) as { outcome: { summary: string } };
      const record = { op: "reconcile", from: "outcome_unknown", to: "completed", observed: true, settledBy: "owner", principal: { kind: "operator", id: "operator:x", provenance: "trusted" } };
      for (const summary of ["", "a", "a".repeat(2000), "a".repeat(2001), "\u{1F600}".repeat(2000), "\u{1F600}".repeat(2001)]) {
        const schemaAccepts = validateDocument(validator, `${SCHEMA_PREFIX}schemas/comms-reconcile.schema.json`, { ...args, outcome: { ...args.outcome, summary } }).valid;
        const ruleAccepts = evaluateSemanticRules("comms-transition", { ...record, summary }).length === 0;
        expect(ruleAccepts, `${summary.length} UTF-16 units`).toBe(schemaAccepts);
      }
    });
    it("names each refusal in one sentence a reader can act on", () => {
      const record = { op: "reconcile", from: "outcome_unknown", to: "completed", observed: true, settledBy: "owner" };
      expect(evaluateSemanticRules("comms-transition", record).map((f) => f.message)).toEqual([
        "the estate owner's settlement carries a summary of what it observed, 1–2000 characters",
        "the estate owner is an operator principal the host verified (trusted)"
      ]);
    });
    it("answers malformed records with findings or none, never by throwing", () => {
      for (const value of [{}, { settledBy: "owner" }, { settledBy: "owner", op: 7, summary: [], principal: "x" }, { settledBy: {}, op: null }, { settledBy: "owner", op: "reconcile", principal: { kind: {}, provenance: [] } }, { settledBy: "responder", op: "__proto__" }]) {
        expect(() => evaluateSemanticRules("comms-transition", value)).not.toThrow();
      }
      expect(paths({ settledBy: "responder", op: "__proto__" })).toEqual(["FAC-SEM-027 /to", "FAC-SEM-109 /settledBy"]);
    });
  });

  describe("FAC-SEM-107: a directory page lists each Project once and each capability once per Project (DEC-0077)", () => {
    const entry = (id: string, capabilities: Array<[string, string]>, name = id) => ({ id, name, capabilities: capabilities.map(([capability, responder]) => ({ capability, responder })) });
    const page = (...projects: unknown[]) => ({ protocol: "fabric-project-comms/0.1", snapshot: { readAt: "2026-10-13T10:00:00Z", stale: false }, projects });
    const paths = (value: unknown) => evaluateSemanticRules("comms-directory", value).map((f) => `${f.code} ${f.instancePath}`);
    it("accepts distinct Projects, one capability under two Projects, and an empty page", () => {
      expect(paths(page(entry("proj-a", [["a.b", "active"], ["a.c", "absent"]]), entry("proj-b", [["a.b", "stale"]])))).toEqual([]);
      expect(paths(page())).toEqual([]);
    });
    it("refuses a Project listed twice, even under another name, naming the second entry", () => {
      expect(paths(page(entry("proj-a", []), entry("proj-b", []), entry("proj-a", [], "Other name")))).toEqual(["FAC-SEM-107 /projects/2/id"]);
      expect(evaluateSemanticRules("comms-directory", page(entry("proj-a", []), entry("proj-a", [])))[0]?.message).toBe("a directory page lists each Project once: proj-a is listed again");
    });
    it("refuses one capability listed twice in a Project, even with two responder states", () => {
      expect(paths(page(entry("proj-a", [["a.b", "active"], ["a.b", "absent"]])))).toEqual(["FAC-SEM-107 /projects/0/capabilities/1/capability"]);
    });
    it("compares ids and capability names as written: they are opaque and names, not URIs (DEC-0076)", () => {
      expect(paths(page(entry("proj-a", [["a.b", "active"], ["A.b", "active"]]), entry("Proj-a", [])))).toEqual([]);
    });
    it("answers malformed pages with findings or none, never by throwing", () => {
      for (const value of [{}, { projects: "x" }, { projects: [null, 3, { id: 7, capabilities: "x" }, { capabilities: [null, { capability: 7 }] }] }, { projects: [{ id: "p", capabilities: [{ capability: 7 }, { capability: 7 }] }, { id: 7 }, { id: 7 }] }]) {
        expect(() => evaluateSemanticRules("comms-directory", value)).not.toThrow();
        expect(paths(value)).toEqual([]);
      }
    });
  });

  describe("FAC-SEM-108: a structured finding is coherent (DEC-0080)", () => {
    const row = (id = "CT-41", repository = "passioncode-ai/fabric-agent-contract", file = "docs/backlog.md") => ({ repository, path: file, id });
    const finding = (...affects: unknown[]) => ({ severity: "warning", consequence: "c", affects, dedupeKey: "dedupe-key-1" });
    const sent = (value: unknown, kind = "finding") => ({ idempotency: { epoch: 1, key: "k-00000001" }, thread: { id: "thr_00000001" }, kind, body: { text: "x" }, finding: value });
    const read = (value: unknown, kind = "finding") => ({ id: "msg_00000001", thread: "thr_00000001", kind, finding: value });
    const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath}`);

    it("accepts a finding naming distinct rows and tasks, on a submit and on a message", () => {
      expect(paths("comms-submit", sent(finding(row(), row("CT-42"), { task: "tsk_00000001" })))).toEqual([]);
      expect(paths("comms-message", read(finding(row(), { redacted: true }, { redacted: true }, { task: "tsk_00000001" })))).toEqual([]);
    });
    it("refuses finding details on any other kind, and leaves a kind finding without them alone", () => {
      for (const kind of ["message", "request", "reply", "announcement"]) {
        expect(paths("comms-submit", sent(finding(row()), kind)), kind).toContain("FAC-SEM-108 /finding");
        expect(paths("comms-message", read(finding(row()), kind)), kind).toContain("FAC-SEM-108 /finding");
      }
      expect(paths("comms-submit", { ...sent(undefined), finding: undefined })).toEqual([]);
      expect(paths("comms-message", { id: "msg_00000001", kind: "message" })).toEqual([]);
    });
    it("refuses an item that repeats an earlier one, naming the repeat and the item it repeats", () => {
      expect(paths("comms-message", read(finding(row(), { redacted: true }, row())))).toEqual(["FAC-SEM-108 /finding/affects/2"]);
      expect(evaluateSemanticRules("comms-message", read(finding(row(), { redacted: true }, row())))[0]?.message).toBe("a finding names each thing it affects once: item 2 repeats item 0");
      expect(paths("comms-submit", sent(finding({ task: "tsk_00000001" }, row(), { task: "tsk_00000001" })))).toEqual(["FAC-SEM-108 /finding/affects/2"]);
    });
    it("compares rows and tasks as written: another case is another item, and a row is never a task", () => {
      expect(paths("comms-message", read(finding(row(), row("ct-41"), row("CT-41", "Passioncode-AI/fabric-agent-contract"), row("CT-41", undefined, "docs/Backlog.md"), { task: "CT-41-task" }, { task: "ct-41-task" })))).toEqual([]);
    });
    it("refuses a redacted item in a submit and keeps it in a message", () => {
      expect(paths("comms-submit", sent(finding(row(), { redacted: true })))).toEqual(["FAC-SEM-108 /finding/affects/1"]);
      expect(paths("comms-submit", sent(finding({ redacted: false })))).toEqual(["FAC-SEM-108 /finding/affects/0"]);
      expect(paths("comms-message", read(finding({ redacted: true })))).toEqual([]);
    });
    it("answers malformed findings with findings or none, never by throwing", () => {
      const odd: unknown[] = [null, 7, "x", [], {}, { affects: "x" }, { affects: [null, 3, "y", [], { task: 7 }, { repository: 1, path: 2, id: 3 }, JSON.parse('{"__proto__": 1}'), { constructor: "x" }] }, { affects: [{ task: "constructor" }, { task: "constructor" }] }];
      for (const value of odd) for (const kind of ["comms-submit", "comms-message"]) {
        expect(() => evaluateSemanticRules(kind, { kind: "finding", finding: value }), kind).not.toThrow();
      }
      expect(paths("comms-message", { kind: "finding", finding: { affects: [{ task: "constructor" }, { task: "constructor" }] } })).toEqual(["FAC-SEM-108 /finding/affects/1"]);
      expect(paths("comms-message", { kind: "finding", finding: { affects: [{ task: 7 }, { task: 7 }, { repository: "a/b", path: "p" }, { repository: "a/b", path: "p" }] } })).toEqual([]);
    });

    type Case = { description: string; kind: string; expect: string[]; input: unknown };
    const dir = path.join(projectRoot(), "fixtures/semantic");
    const cases = readdirSync(dir).filter((name) => name.startsWith("comms-finding-")).map((name) => [name, JSON.parse(readFileSync(path.join(dir, name), "utf8")) as Case] as const);
    it("has its seven semantic fixtures, three of them refused", () => {
      expect(cases).toHaveLength(7);
      expect(cases.filter(([, c]) => c.expect.length > 0)).toHaveLength(3);
    });
    it.each(cases)("%s", (_name, c) => expect([...new Set(evaluateSemanticRules(c.kind, c.input).map((f) => f.code))]).toEqual(c.expect));

    const validator = createValidatorSync();
    const schemaOf = { "comms-submit": "comms-submit.schema.json", "comms-message": "comms-message.schema.json" } as const;
    it.each(cases)("%s is schema-valid unless it is a refused submit", (_name, c) => {
      const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schemaOf[c.kind as keyof typeof schemaOf]}`, c.input);
      // A message's duplicate is the rule's to refuse; a submit's duplicate or redacted item, and a finding on another
      // kind, the schema refuses as well.
      expect(result.valid, JSON.stringify(result.errors)).toBe(c.expect.length === 0 || c.kind === "comms-message");
    });
  });

  describe("the finding's shared vectors (DEC-0080, fixtures/vectors/comms-finding.json)", () => {
    type Vector = { name: string; on: "submit" | "message"; finding: unknown; valid: boolean; lax?: string; key?: string };
    const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/comms-finding.json"), "utf8")) as { base: Record<"submit" | "message", Record<string, unknown>>; cases: Vector[] };
    const validator = createValidatorSync();
    const schemaOf = { submit: "comms-submit.schema.json", message: "comms-message.schema.json" } as const;
    it.each(vectors.cases.map((c) => [c.name, c] as const))("%s", (_name, c) => {
      const base = vectors.base[c.on];
      const value = c.key === undefined ? { ...base, finding: c.finding } : { ...base, idempotency: { ...(base.idempotency as object), key: c.key }, finding: c.finding };
      const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schemaOf[c.on]}`, value);
      expect(result.valid, JSON.stringify(result.errors)).toBe(c.valid);
    });
    it("covers each limit at its bound and one past it", () => {
      const names = vectors.cases.map((c) => c.name);
      for (const name of ["idempotency key of 22 characters with a finding", "idempotency key of 21 characters with a finding", "task id of 128 characters", "task id of 129 characters", "dedupeKey of 8 characters", "dedupeKey of 7 characters", "dedupeKey of 128 characters", "dedupeKey of 129 characters", "consequence of 500 astral-plane characters", "consequence of 501 astral-plane characters", "16 affects items", "17 affects items", "path of 256 characters", "path of 257 characters", "row id of 64 characters", "row id of 65 characters"]) expect(names).toContain(name);
      const astral = vectors.cases.find((c) => c.name === "consequence of 500 astral-plane characters") as Vector & { finding: { consequence: string } };
      expect(astral.finding.consequence.length).toBe(1000);
      expect([...astral.finding.consequence]).toHaveLength(500);
    });
  });

  describe("the order a submit is answered in: idempotency, then a hold, then dedupe (DEC-0080, DEC-0079)", () => {
    const standing = { message: "msg_00000001", thread: "thr_standing1", at: "2026-10-13T11:00:00Z" };
    const state = { findings: [{ project: "proj-a", dedupeKey: "dedupe-key-1", receipt: standing }] };
    const call = { project: "proj-a", thread: "thr_other001", key: "fnd_Q7mX2cL9pZ4tVb1Nk8Rw", digest: "sha256:1", dedupeKey: "dedupe-key-1" };

    it("a dedupe hit answers the standing finding's receipt, its thread not the one the call named, and stores only the receipt", () => {
      expect(findingSubmitAnswer(call, state)).toEqual({ receipt: standing, repeated: true, stores: "receipt" });
      expect(findingSubmitAnswer({ ...call, thread: undefined }, state)).toEqual({ receipt: standing, repeated: true, stores: "receipt" });
    });
    it("a hold on the thread the call writes into answers `held` before dedupe, and stores nothing", () => {
      expect(findingSubmitAnswer(call, { ...state, holds: { threads: ["thr_other001"] } })).toEqual({ refused: "held", stores: "nothing" });
      // A hold on the standing finding's thread does not refuse a call that writes elsewhere: dedupe writes nothing there.
      expect(findingSubmitAnswer(call, { ...state, holds: { threads: ["thr_standing1"] } })).toEqual({ receipt: standing, repeated: true, stores: "receipt" });
    });
    it("a stored idempotency key answers first, even under a hold, and another digest is a conflict, whatever the dedupe key", () => {
      const keys = [{ project: "proj-a", key: call.key, digest: "sha256:1", receipt: standing }];
      expect(findingSubmitAnswer(call, { ...state, keys, holds: { threads: ["thr_other001"] } })).toEqual({ receipt: standing, repeated: true, stores: "nothing" });
      expect(findingSubmitAnswer({ ...call, digest: "sha256:2" }, { ...state, keys })).toEqual({ refused: "idempotency_conflict", stores: "nothing" });
    });
    it("dedupes only within the sender's Project, and compares the dedupe key as written", () => {
      expect(findingSubmitAnswer({ ...call, project: "proj-b" }, state)).toEqual({ repeated: false, stores: "message" });
      expect(findingSubmitAnswer({ ...call, dedupeKey: "Dedupe-key-1" }, state)).toEqual({ repeated: false, stores: "message" });
      expect(findingSubmitAnswer({ ...call, dedupeKey: undefined }, state)).toEqual({ repeated: false, stores: "message" });
      // Another Project's key with the same name never answers: the receipt would hand over its message and thread ids.
      expect(findingSubmitAnswer({ ...call, key: "fnd_other_key_0000000001" }, { keys: [{ project: "proj-b", key: "fnd_other_key_0000000001", digest: "sha256:1", receipt: standing }] })).toEqual({ repeated: false, stores: "message" });
    });
    it("answers malformed state without throwing", () => {
      const odd: unknown[] = [{}, { keys: "x", findings: 7 }, { keys: [null, { project: "proj-a", key: call.key, digest: "sha256:1", receipt: 3 }], findings: [null, { project: "proj-a", dedupeKey: "dedupe-key-1", receipt: null }] }];
      for (const value of odd) expect(() => findingSubmitAnswer(call, value as never)).not.toThrow();
      expect(findingSubmitAnswer(call, odd[2] as never)).toEqual({ refused: "idempotency_conflict", stores: "nothing" });
      expect(findingSubmitAnswer({ ...call, key: "other-key-0001" }, odd[2] as never)).toEqual({ repeated: false, stores: "message" });
      // A state that is not an object holds nothing; a call that is not an object, or lacks its strings, is refused.
      for (const value of [null, 7, "x", []]) expect(findingSubmitAnswer(call, value as never)).toEqual({ repeated: false, stores: "message" });
      for (const value of [null, 7, "x", [], {}, { ...call, project: 7 }, { ...call, key: null }, { ...call, digest: undefined }]) {
        expect(findingSubmitAnswer(value as never, state)).toEqual({ refused: "invalid_arguments", stores: "nothing" });
        expect(findingSubmitAnswer(value as never, null as never)).toEqual({ refused: "invalid_arguments", stores: "nothing" });
      }
    });
  });
});
