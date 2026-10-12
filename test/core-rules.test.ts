import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { coreRules } from "../src/core-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0064: the 0.1.0 core keeps its promises — FAC-SEM-093 (claims and proof), FAC-SEM-094 (approval separation),
// FAC-SEM-006 (a project without its manager), FAC-SEM-096 (rollback), FAC-SEM-097 (a grant's window).
type Json = Record<string, any>;
const read = (name: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive", name), "utf8")) as Json;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => `${finding.code} ${finding.instancePath}`);

describe("FAC-SEM-093: a result's claims and proof", () => {
  it("refuses one claim id on two done claims, and names each done item by its own index", () => {
    const result = read("result.json");
    const twice = { ...result, done: [...result.done, { ...result.done[0], statement: "another statement" }] };
    expect(paths("result", twice)).toEqual([`FAC-SEM-093 /done/${result.done.length}/claimId`]);
    const unprovenTwice = { ...twice, outcome: "partial", proof: [] };
    expect(paths("result", unprovenTwice)).toEqual([`FAC-SEM-093 /done/${result.done.length}/claimId`, "FAC-SEM-093 /done/0"]);
    const shifted = { ...result, outcome: "partial", proof: [], done: [{ statement: "no id" }, result.done[0]] };
    expect(paths("result", shifted)).toEqual(["FAC-SEM-093 /done/1"]);
  });
  const result = read("result.json");
  it("passes a result whose every done claim is proven", () => expect(codes("result", result)).toEqual([]));
  it("refuses a proof that names a claim the result does not report as done", () => {
    const stray = { ...result, proof: [{ ...result.proof[0], claimIds: ["KEYWORDS_ANALYZED", "NOT_DONE"] }] };
    expect(paths("result", stray)).toEqual(["FAC-SEM-093 /proof/0/claimIds/1"]);
  });
  it("refuses a done claim with no proof unless notVerified lists it by its id", () => {
    const unproven = { ...result, outcome: "partial", proof: [] };
    expect(paths("result", unproven)).toEqual(["FAC-SEM-093 /done/0"]);
    expect(codes("result", { ...unproven, notVerified: [{ claim: "KEYWORDS_ANALYZED", reason: "no checker yet" }] })).toEqual([]);
    expect(paths("result", { ...unproven, notVerified: [{ claim: "Keyword set was ranked", reason: "listed by statement" }] })).toEqual(["FAC-SEM-093 /done/0"]);
  });
  it("keeps FAC-SEM-001: a succeeded result lists nothing in notVerified", () => {
    expect(codes("result", { ...result, notVerified: [{ claim: "KEYWORDS_ANALYZED", reason: "pending" }] })).toEqual(["FAC-SEM-001"]);
  });
  it("reads malformed members without throwing", () => {
    for (const bad of [null, 7, "x", [null, 3], { claimIds: 5 }]) expect(() => evaluateSemanticRules("result", { done: bad, proof: [bad], notVerified: bad })).not.toThrow();
  });
});

describe("FAC-SEM-094: approval separation", () => {
  const learning = read("memory-learning.json");
  it("passes a proposal and an approval by someone else", () => {
    expect(codes("learning", learning)).toEqual([]);
    expect(codes("learning", { ...learning, state: "approved", approvedBy: "urn:person:pm" })).toEqual([]);
  });
  it("refuses an approval by the author, and an approval without an approver", () => {
    expect(paths("learning", { ...learning, state: "approved", approvedBy: learning.meta.createdBy })).toEqual(["FAC-SEM-094 /approvedBy"]);
    expect(paths("promotion", { state: "approved", meta: { createdBy: "urn:agent:a" } })).toEqual(["FAC-SEM-094 /approvedBy"]);
    expect(paths("promotion", { state: "approved", meta: { createdBy: "urn:agent:a" }, approvedBy: "urn:agent:a" })).toEqual(["FAC-SEM-094 /approvedBy"]);
    expect(codes("promotion", { state: "approved", meta: 7, approvedBy: "urn:person:pm" })).toEqual([]);
  });
});

describe("FAC-SEM-006: every project an assignment scopes has its product manager", () => {
  const roles = read("roles.json");
  it("passes the fixture, and finds a project with a developer and no manager", () => {
    expect(codes("roles", roles)).toEqual([]);
    const orphan = { ...roles, assignments: [...roles.assignments, { id: "urn:assignment:dev-b", role: "developer", principal: roles.assignments[0].principal, scope: { project: "urn:project:orphan" }, active: true }] };
    expect(evaluateSemanticRules("roles", orphan).map((finding) => finding.message)).toEqual(["project urn:project:orphan requires exactly one active product manager"]);
    const inactive = { ...roles, assignments: [...roles.assignments, { id: "urn:assignment:dev-c", role: "developer", principal: roles.assignments[0].principal, scope: { project: "urn:project:old" }, active: false }] };
    expect(codes("roles", inactive)).toEqual([]);
  });
});

describe("FAC-SEM-096: rollback and parents", () => {
  const setting = read("versioned-setting.json");
  const id = setting.meta.id;
  const at = (revision: number) => ({ ...setting, meta: { ...setting.meta, revision }, parents: [] });
  it("passes a rollback to an earlier revision of the same setting", () => {
    expect(codes("versioned-setting", setting)).toEqual([]);
    expect(codes("versioned-setting", { ...at(3), parents: [{ id, revision: 2, contentHash: setting.meta.contentHash }], rollbackBasis: { id, revision: 1, contentHash: setting.meta.contentHash } })).toEqual([]);
  });
  it("refuses a rollback to another setting, to the same or a later revision, and a parent not earlier", () => {
    const hash = setting.meta.contentHash;
    expect(paths("versioned-setting", { ...at(3), rollbackBasis: { id: "urn:other", revision: 1, contentHash: hash } })).toEqual(["FAC-SEM-096 /rollbackBasis/id"]);
    expect(paths("versioned-setting", { ...at(3), rollbackBasis: { id, revision: 3, contentHash: hash } })).toEqual(["FAC-SEM-096 /rollbackBasis/revision"]);
    expect(paths("versioned-setting", { ...at(3), parents: [{ id, revision: 3, contentHash: hash }] })).toEqual(["FAC-SEM-096 /parents/0/revision"]);
    expect(paths("versioned-setting", { ...at(3), rollbackBasis: "x", parents: [{ revision: "2" }] })).toEqual(["FAC-SEM-096 /rollbackBasis/id", "FAC-SEM-096 /rollbackBasis/revision", "FAC-SEM-096 /parents/0/revision"]);
  });
});

describe("FAC-SEM-097: a standing grant's window", () => {
  const grant = read("governance-grant.json");
  it("passes the fixture, alone and inside its window", () => {
    expect(codes("grant-window", grant)).toEqual([]);
    expect(codes("grant-window", { grant, at: "2026-09-01T00:00:00Z" })).toEqual([]);
  });
  it("refuses a window that is not positive, unreadable dates, and an active grant outside its window", () => {
    expect(paths("grant-window", { ...grant, expiresAt: grant.startsAt })).toEqual(["FAC-SEM-097 /expiresAt"]);
    expect(paths("grant-window", { ...grant, startsAt: "2026-02-30T00:00:00Z" })).toEqual(["FAC-SEM-097 /startsAt"]);
    expect(paths("grant-window", { grant, at: grant.expiresAt })).toEqual(["FAC-SEM-097 /grant/state"]);
    expect(paths("grant-window", { grant, at: grant.startsAt })).toEqual([]);
    expect(paths("grant-window", { ...grant, expiresAt: "2026-13-01T00:00:00Z" })).toEqual(["FAC-SEM-097 /expiresAt"]);
    expect(paths("grant-window", { grant, at: "2026-08-26T10:07:59Z" })).toEqual(["FAC-SEM-097 /grant/state"]);
    expect(paths("grant-window", { grant, at: "yesterday" })).toEqual(["FAC-SEM-097 /at"]);
    expect(codes("grant-window", { grant: { ...grant, state: "expired" }, at: "2027-01-01T00:00:00Z" })).toEqual([]);
  });
});

describe("the module reads only its own kinds and objects", () => {
  it("answers nothing for another kind or a non-object", () => {
    expect(coreRules("package", {})).toBeUndefined();
    expect(coreRules("result", null)).toBeUndefined();
  });
});
