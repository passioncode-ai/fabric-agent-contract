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
});
