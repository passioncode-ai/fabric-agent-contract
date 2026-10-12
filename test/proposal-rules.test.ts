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
    expect(paths("proposal", { ...rule, approvedBy: { role: "administrator" } })).toEqual(["FAC-SEM-104 /approvedBy"]);
    expect(paths("proposal", { ...fix, approvedBy: { role: "administrator" } })).toEqual([]);
  });
  it("allows exactly the decisions DEC-0072 names, and nothing else", () => {
    const edges = new Set(["proposed>approved", "proposed>refused", "proposed>merged", "proposed>superseded", "approved>applied", "approved>superseded", "applied>retired", "applied>superseded", "applied>verified"]);
    for (const from of PROPOSAL_TRANSITIONS.keys()) {
      for (const to of PROPOSAL_TRANSITIONS.keys()) {
        const expected = edges.has(`${from}>${to}`) && to !== "verified" ? [] : ["FAC-SEM-104 /to"];
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
    expect(paths("proposal-submit", { proposal: { ...rule, type: "listing", status: "refused" }, to: "organization" })).toEqual(["FAC-SEM-103 /proposal"]);
  });
  it("refuses a destination other than an organization server or an export, and a rule not from the organization's work", () => {
    for (const to of ["public", "organisation", undefined]) expect(paths("proposal-submit", { proposal: fix, to })).toEqual(["FAC-SEM-103 /to"]);
    for (const sourceClass of ["personal", "unknown", undefined]) expect(paths("proposal-submit", { proposal: { ...rule, sourceClass }, to: "organization" })).toEqual(["FAC-SEM-103 /proposal/sourceClass"]);
  });
  it("lets nothing leaving the estate carry a credential or a home path", () => {
    const token = "ghp_" + "a".repeat(36);
    // Home paths are built at run time, so no home path sits in the repository's text.
    const posixHome = ["", "Users", "someone", "notes", "secret.md"].join("/");
    const windowsHome = ["C:", "Users", "someone", "x"].join("\\");
    const leaking = { ...rule, change: `Use ${token} for the sync.`, evidence: [{ kind: "file", ref: posixHome }, { kind: "link", ref: "https://x.example/?token=sk-abcdef1234567890abcd" }], finding: undefined, payload: { note: windowsHome, "a/b": ["ok"] } };
    expect(paths("proposal-submit", { proposal: leaking, to: "export" })).toEqual(["FAC-SEM-103 /proposal/change", "FAC-SEM-103 /proposal/evidence/0/ref", "FAC-SEM-103 /proposal/evidence/1/ref", "FAC-SEM-103 /proposal/payload/note"]);
    expect(paths("proposal-submit", { proposal: { ...fix, finding: { ...fix.finding, text: "see ~/x" } }, to: "export" })).toEqual(["FAC-SEM-103 /proposal/finding/text"]);
    expect(paths("proposal-submit", { proposal: { ...fix, evidence: [null, { kind: "x" }] }, to: "export" })).toEqual([]);
    const fileUrl = `file://${posixHome}`;
    expect(paths("proposal-submit", { proposal: { ...fix, change: `path:${posixHome}`, evidence: [{ kind: "file", ref: fileUrl }] }, to: "export" })).toEqual(["FAC-SEM-103 /proposal/change", "FAC-SEM-103 /proposal/evidence/0/ref"]);
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
