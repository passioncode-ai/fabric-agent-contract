import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { actionDecision } from "../src/actions.js";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { verifyOrgMembership } from "../src/org-membership.js";
import { buildLevelsVectors, VECTOR_FILE } from "../tools/vectors/levels.js";

// DEC-0162: authority levels. The vectors are written by tools/vectors/levels.ts with hand-written expectations; the
// reference (actionDecision, mandateCovers through it, verifyOrgMembership) must give exactly those answers.
type Json = Record<string, any>;
const root = projectRoot();
const committed = readFileSync(path.join(root, VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as Json;

describe("levels vectors (DEC-0162)", () => {
  it("is the file the generator writes", () => expect(committed).toBe(buildLevelsVectors()));
  it.each((vectors.actions as Json[]).map((c) => [c.name, c] as const))("action: %s", (_name, c) => expect(actionDecision(c.input)).toEqual(c.expected));
  it.each((vectors.mandates as Json[]).map((c) => [c.name, c] as const))("mandate: %s", (_name, c) => expect(actionDecision(c.input)).toEqual(c.expected));
  it.each((vectors.verify as Json[]).map((c) => [c.name, c] as const))("verify: %s", (_name, c) => {
    const membership = typeof c.membership === "string" ? vectors.memberships[c.membership] : c.membership;
    expect(verifyOrgMembership(membership, { ...c.trust, now: new Date(c.trust.now), keySet: vectors.keySet })).toEqual(c.expected);
  });
  it("names each membership's digest as a hub writes mem", () => {
    for (const [name, value] of Object.entries(vectors.digests as Record<string, string>)) {
      const verdict = verifyOrgMembership(vectors.memberships[name], { now: new Date("2026-10-25T11:00:30Z"), org: "org:org-a", audience: vectors.memberships[name].audience, keySet: vectors.keySet, levels: true });
      expect(verdict.ok && verdict.digest, name).toBe(value);
    }
  });
});

describe("FAC-SEM-169 and FAC-SEM-170 (DEC-0162)", () => {
  const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath}`);
  const architect = vectors.memberships.architect as Json;
  const decision = (extra: Json) => ({ by: "level", via: "level-command", level: "architect", org: "org:org-a", project: "alpha", action: "approve-reply", instruction: "approve it", at: "2026-10-25T11:20:00Z", membership: architect, ...extra });
  it("passes a coherent architect attestation and decision", () => {
    expect(codes("org-membership-2", architect)).toEqual([]);
    expect(codes("decision", decision({}))).toEqual([]);
    expect(codes("decision", { by: "operator", via: "relayed-instruction", action: "a", instruction: "b", at: "2026-10-25T11:20:00Z" })).toEqual([]);
  });
  it("flags projects that do not match the role, and a project named twice", () => {
    expect(codes("org-membership-2", { ...architect, projects: [] })).toEqual(["FAC-SEM-169 /projects"]);
    expect(codes("org-membership-2", { ...architect, role: "admin" })).toEqual(["FAC-SEM-169 /projects"]);
    expect(codes("org-membership-2", { ...architect, projects: ["alpha", "alpha"] })).toEqual(["FAC-SEM-169 /projects/1"]);
  });
  it("flags a level decision its attestation does not support", () => {
    expect(codes("decision", decision({ level: "admin", project: undefined }))).toEqual(["FAC-SEM-170 /level"]);
    expect(codes("decision", decision({ project: "gamma" }))).toEqual(["FAC-SEM-170 /membership/projects"]);
    expect(codes("decision", decision({ org: "org:org-b" }))).toEqual(["FAC-SEM-170 /org"]);
    expect(codes("decision", decision({ at: "2026-10-25T12:00:00Z" }))).toEqual(["FAC-SEM-170 /at"]);
    expect(codes("decision", decision({ membership: vectors.memberships.v1Member }))).toEqual(["FAC-SEM-170 /membership"]);
  });
  it("flags a level mandate whose scope reaches past an architect's projects", () => {
    const mandate = vectors.mandates[0].input.mandate as Json;
    expect(codes("mandate", mandate)).toEqual([]);
    expect(codes("mandate", { ...mandate, scope: { ...mandate.scope, projects: ["alpha", "gamma"] } })).toEqual(["FAC-SEM-170 /membership/projects"]);
    expect(codes("mandate", { ...mandate, scope: { capabilities: ["reviews.approve"], effects: ["reply"] } })).toEqual(["FAC-SEM-170 /level"]);
  });
});
