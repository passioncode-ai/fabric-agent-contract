import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { actionDecision } from "../src/actions.js";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { verifyOrgMembership } from "../src/org-membership.js";
import { levelStanding } from "../src/levels.js";
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

describe("levelStanding and FAC-SEM-170 at their edges (DEC-0162)", async () => {
  const { levelStanding, levelRules } = await import("../src/levels.js");
  const { actionDecision: decide } = await import("../src/actions.js");
  const now = Date.parse("2026-10-25T11:30:00Z");
  const contexts = { "org:org-a": { audience: "reviews-service-a1", keySet: vectors.keySet } };
  const admin = vectors.memberships.admin as Json;
  const base = { membership: admin, org: "org:org-a", level: "admin", at: "2026-10-25T11:20:00Z", contexts, tokenMem: vectors.digests.admin, now };
  it("stands, with a held record in the context", () => {
    const held = { subject: admin.subject, revision: admin.revision, digest: vectors.digests.admin };
    expect(levelStanding({ ...base, contexts: { "org:org-a": { ...contexts["org:org-a"], held } } })).toMatchObject({ ok: true, level: "admin" });
  });
  it("refuses a /1 attestation, a decision made after the attestation expires, and a level that decides nothing", () => {
    expect(levelStanding({ ...base, membership: vectors.memberships.v1Member, tokenMem: vectors.digests.v1Member })).toEqual({ ok: false, invalid: "level-membership: malformed" });
    expect(levelStanding({ ...base, at: "2026-10-25T12:00:00Z" })).toEqual({ ok: false, invalid: "level-expired" });
    expect(levelStanding({ ...base, level: "member" })).toEqual({ ok: false, invalid: "level-role" });
    expect(levelStanding({ ...base, level: "boss" })).toEqual({ ok: false, invalid: "level-role" });
  });
  it("answers a level decision's own faults and its target", () => {
    const call = vectors.actions[1].input as Json;
    expect(decide({ ...call, now: "not a time" })).toEqual({ fault: "now-unreadable" });
    const t2 = vectors.actions[0].input as Json;
    expect(decide({ ...t2, actionDigest: undefined })).toEqual({ fault: "digest-missing" });
    expect(decide({ ...call, decision: { ...call.decision, target: "review-7" }, target: "review-7" })).toMatchObject({ ok: true, recordAs: { by: "level" } });
    expect(decide({ ...call, decision: { ...call.decision, target: "review-7" }, target: "review-8" })).toEqual({ ok: false, code: "decision-invalid" });
  });
  it("covers a level mandate's call in no project", () => {
    const call = vectors.mandates[1].input as Json;
    const { project: _p, ...noProject } = call;
    expect(decide({ ...noProject, mandate: { ...call.mandate, scope: { capabilities: ["reviews.approve"], effects: ["reply"] } } })).toMatchObject({ ok: true, recordAs: { by: "level", via: "mandate" } });
  });
  it("reads only kinds decision and mandate, and documents with odd members", () => {
    const flags = (kind: string, value: Json) => (levelRules(kind, value) ?? []).map((f) => f.instancePath);
    expect(levelRules("org-membership", {})).toBeUndefined();
    expect(flags("decision", { by: "level", level: "boss", org: "org:org-a", at: "2026-10-25T11:20:00Z", membership: { ...admin, role: "guest" } })).toEqual(["/level"]);
    expect(flags("decision", { by: "level", level: "architect", org: "org:org-a", project: "alpha", at: "2026-10-25T11:20:00Z", membership: { ...admin, projects: "alpha" } })).toEqual([]);
    expect(flags("mandate", { by: "level", level: "admin", org: "org:org-a", at: "2026-10-25T11:20:00Z", membership: admin, scope: "all" })).toEqual([]);
    expect(evaluateSemanticRules("mandate", { kind: "x" }).map((f) => f.code)).toEqual(["FAC-SEM-144"]);
  });
  it("refuses /2 projects of the wrong shape", () => {
    const architect = vectors.memberships.architect as Json;
    const trust = { now: new Date(now), org: "org:org-a", audience: "reviews-service-a1", keySet: vectors.keySet, levels: true };
    for (const projects of ["alpha", Array.from({ length: 65 }, (_, i) => `p${i}`), ["bad project"], ["alpha", "alpha"]]) {
      expect(verifyOrgMembership({ ...architect, projects }, trust)).toEqual({ ok: false, problem: "malformed" });
    }
  });
});

describe("levelStanding on inputs a service builds itself (DEC-0162 LV-4)", () => {
  const admin = vectors.memberships.admin as Json;
  const contexts = { "org:org-a": { audience: admin.audience, keySet: vectors.keySet } };
  const base = { org: "org:org-a", at: "2026-10-25T11:00:00Z", contexts, now: Date.parse("2026-10-25T11:00:30Z") };
  it("refuses an attestation without a subject as malformed, and a level that decides nothing as above the role", () => {
    expect(levelStanding({ ...base, membership: { ...admin, subject: undefined }, level: "admin", tokenMem: vectors.digests.admin })).toEqual({ ok: false, invalid: "level-membership: malformed" });
    expect(levelStanding({ ...base, membership: admin, level: "member", tokenMem: vectors.digests.admin })).toEqual({ ok: false, invalid: "level-role" });
  });
});

