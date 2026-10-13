import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { COMMS_TRANSITIONS, evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

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
});
