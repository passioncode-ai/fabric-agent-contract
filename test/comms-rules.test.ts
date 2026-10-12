import { describe, expect, it } from "vitest";
import { COMMS_TRANSITIONS, evaluateSemanticRules } from "../src/semantic-rules.js";

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
      expect(codes("comms-transition", { op, from, to, observed: true }), `${op} ${from}->${to}`).toEqual([]);
    }
    expect(codes("comms-transition", { op: "complete", from: "queued", to: "completed", observed: true })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "expire", from: "accepted", to: "expired" })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "cancel", from: "in_progress", to: "cancelled" })).toContain("FAC-SEM-027");
  });

  it("FAC-SEM-027 settles a started effect only by an observed result", () => {
    expect(codes("comms-transition", { op: "complete", from: "in_progress", to: "completed", observed: false })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "reconcile", from: "outcome_unknown", to: "failed_known" })).toContain("FAC-SEM-027");
    expect(codes("comms-transition", { op: "complete", from: "accepted", to: "completed" })).toEqual([]);
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
