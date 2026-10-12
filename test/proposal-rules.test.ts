import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { PROPOSAL_TRANSITIONS } from "../src/proposal-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0072 (CON-OE-05): proposals and learning notes — FAC-SEM-103 (submit), FAC-SEM-104 (approval, transitions), FAC-SEM-105 (rollout).
type Json = Record<string, any>;
const read = (name: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive", name), "utf8")) as Json;
const rule = read("fabric-proposal-rule.json");
const fix = read("fabric-proposal-fix.json");
const note = read("learning-note.json");
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => `${finding.code} ${finding.instancePath}`);

describe("FAC-SEM-104: a rule is approved by a person, and a proposal moves along its decisions", () => {
  it("passes the fixtures and refuses a rule approved by a policy", () => {
    expect(paths("proposal", rule)).toEqual([]);
    expect(paths("proposal", fix)).toEqual([]);
    expect(paths("proposal", { ...rule, approvedBy: { policy: "auto" } })).toEqual(["FAC-SEM-104 /approvedBy"]);
  });
  it("allows every edge of the graph and nothing else", () => {
    for (const [from, next] of PROPOSAL_TRANSITIONS) {
      for (const to of PROPOSAL_TRANSITIONS.keys()) {
        const expected = next.includes(to) && !(to === "verified") ? [] : ["FAC-SEM-104 /to"];
        expect(paths("proposal-transition", { type: "rule", from, to }), `${from} → ${to}`).toEqual(expected);
      }
    }
  });
  it("verifies only a fix, after it was applied", () => {
    expect(paths("proposal-transition", { type: "fix", from: "applied", to: "verified" })).toEqual([]);
    expect(paths("proposal-transition", { type: "fix", from: "approved", to: "verified" })).toEqual(["FAC-SEM-104 /to"]);
    expect(paths("proposal-transition", { type: "fix", from: "evaluated", to: "approved" })).toEqual(["FAC-SEM-104 /to"]);
    expect(paths("proposal-transition", { from: 1, to: null })).toEqual(["FAC-SEM-104 /to"]);
  });
});

describe("FAC-SEM-103: what leaves the estate", () => {
  it("never submits or exports a proposal about a private agent", () => {
    for (const to of ["organization", "export"]) expect(paths("proposal-submit", { proposal: { ...rule, private: true }, to })).toEqual(["FAC-SEM-103 /proposal/private"]);
  });
  it("sends an organization server an approved or applied rule, or a listing, and nothing else", () => {
    expect(paths("proposal-submit", { proposal: rule, to: "organization" })).toEqual([]);
    expect(paths("proposal-submit", { proposal: { ...rule, status: "approved" }, to: "organization" })).toEqual([]);
    expect(paths("proposal-submit", { proposal: { ...rule, status: "proposed" }, to: "organization" })).toEqual(["FAC-SEM-103 /proposal"]);
    expect(paths("proposal-submit", { proposal: { ...rule, type: "listing", status: "proposed" }, to: "organization" })).toEqual([]);
    expect(paths("proposal-submit", { proposal: fix, to: "organization" })).toEqual(["FAC-SEM-103 /proposal"]);
    expect(paths("proposal-submit", { proposal: fix, to: "export" })).toEqual([]);
    expect(paths("proposal-submit", { to: "organization" })).toEqual(["FAC-SEM-103 /proposal"]);
  });
});

describe("FAC-SEM-105: a learning note's rollout", () => {
  it("lets only an organization note feed an organization rollout", () => {
    expect(paths("learning-rollout", { note, rollout: "organization" })).toEqual([]);
    for (const sourceClass of ["personal", "unknown"]) expect(paths("learning-rollout", { note: { ...note, sourceClass }, rollout: "organization" })).toEqual(["FAC-SEM-105 /note/sourceClass"]);
    expect(paths("learning-rollout", { note: { ...note, sourceClass: "personal" }, rollout: "project" })).toEqual([]);
    expect(paths("learning-rollout", { rollout: "organization" })).toEqual(["FAC-SEM-105 /note/sourceClass"]);
  });
});
