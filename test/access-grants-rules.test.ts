import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot, SCHEMA_PREFIX } from "../src/contract.js";
import { accessGrantsRules, grantState } from "../src/access-grants-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidatorSync, validateDocument } from "../src/validator.js";

// DEC-0187: access-grants/1, FAC-SEM-185 and grantState.
type Json = Record<string, any>;
const positive = (): Json => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/access-grants.json"), "utf8")) as Json;
const codes = (value: Json) => accessGrantsRules(value).map((finding) => `${finding.code} ${finding.instancePath}`);
const schema = `${SCHEMA_PREFIX}schemas/access-grants.schema.json`;
const validator = createValidatorSync();

describe("FAC-SEM-185: an access-grants/1 answer", () => {
  it("passes for the positive fixture, through the dispatch too", () => {
    expect(accessGrantsRules(positive())).toEqual([]);
    expect(evaluateSemanticRules("access-grants", positive())).toEqual([]);
  });

  it("refuses a grant id that appears twice", () => {
    const doc = positive();
    doc.grants[1].id = doc.grants[0].id;
    expect(codes(doc)).toEqual(["FAC-SEM-185 /grants/1/id"]);
  });

  it("pairs a ceiling with its window", () => {
    const noPeriod = positive();
    delete noPeriod.grants[0].limitPeriod;
    expect(codes(noPeriod)).toEqual(["FAC-SEM-185 /grants/0/limitPeriod"]);
    const periodWithoutCeiling = positive();
    periodWithoutCeiling.grants[1].limitPeriod = "day";
    expect(codes(periodWithoutCeiling)).toEqual(["FAC-SEM-185 /grants/1/limitPeriod"]);
  });

  it("names the calling agent exactly when the act came through an agent's call", () => {
    const missing = positive();
    delete missing.grants[0].issued.agent;
    expect(codes(missing)).toEqual(["FAC-SEM-185 /grants/0/issued/agent"]);
    const extra = positive();
    extra.grants[1].issued.agent = "smm-manager.cloud";
    expect(codes(extra)).toEqual(["FAC-SEM-185 /grants/1/issued/agent"]);
    const revokedByAgentAtDashboard = positive();
    revokedByAgentAtDashboard.grants[2].revoked.by = "agent";
    expect(codes(revokedByAgentAtDashboard)).toEqual(["FAC-SEM-185 /grants/2/revoked/via"]);
    const ownAct = positive();
    ownAct.grants[2].revoked = { at: "2026-11-18T16:00:00Z", by: "agent", via: "agent", agent: "smm-manager.cloud" };
    expect(codes(ownAct)).toEqual([]);
  });

  it("orders issue, revocation, expiry and the answer's time", () => {
    const future = positive();
    future.grants[0].issued.at = "2026-11-19T14:00:01Z";
    expect(codes(future)).toEqual(["FAC-SEM-185 /grants/0/issued/at"]);
    const early = positive();
    early.grants[2].revoked.at = "2026-09-20T11:59:59Z";
    expect(codes(early)).toEqual(["FAC-SEM-185 /grants/2/revoked/at"]);
    const late = positive();
    late.grants[2].revoked.at = "2026-11-19T14:00:01Z";
    expect(codes(late)).toEqual(["FAC-SEM-185 /grants/2/revoked/at"]);
    const expiresAtIssue = positive();
    expiresAtIssue.grants[0].expiresAt = expiresAtIssue.grants[0].issued.at;
    expect(codes(expiresAtIssue)).toEqual(["FAC-SEM-185 /grants/0/expiresAt"]);
  });

  it("shows a breach instead of refusing it", () => {
    const doc = positive();
    doc.grants[0].spentDayUsd = 40;
    expect(codes(doc)).toEqual([]);
  });

  it("answers findings or none for malformed input, never an exception", () => {
    expect(accessGrantsRules({})).toEqual([]);
    expect(accessGrantsRules({ grants: "x" })).toEqual([]);
    expect(accessGrantsRules({ grants: [null, 3, {}], generatedAt: "not a time" })).toEqual([]);
    expect(codes({ grants: [{}, {}] })).toEqual(["FAC-SEM-185 /grants/1/id"]);
    expect(codes({ grants: [{ id: "a", issued: { at: "bad" }, revoked: { at: "2026-01-01T00:00:00Z" }, expiresAt: "2026-01-01T00:00:00Z" }] })).toEqual([]);
    expect(codes({ grants: [{ id: "a", revoked: "yes" }] })).toEqual([]);
  });
});

describe("grantState", () => {
  const now = Date.parse("2026-11-19T14:00:00Z");
  it("reads revoked first, then expiry, else active", () => {
    const [active, person, revoked] = positive().grants as Json[];
    expect(grantState(active, now)).toBe("active");
    expect(grantState(person, now)).toBe("active");
    expect(grantState(revoked, now)).toBe("revoked");
    expect(grantState({ ...revoked, revoked: undefined, expiresAt: "2026-11-19T14:00:00Z" }, now)).toBe("expired");
    expect(grantState({ ...active, expiresAt: "garbage" }, now)).toBe("active");
  });
  it("answers undefined for what is not a grant or not a time", () => {
    expect(grantState(null, now)).toBeUndefined();
    expect(grantState([], now)).toBeUndefined();
    expect(grantState({}, Number.NaN)).toBeUndefined();
  });
});

describe("the access-grants schema's inputs and answer", () => {
  const valid = (def: string, value: unknown) => validateDocument(validator, `${schema}#/$defs/${def}`, value).valid;
  it("takes the list input with optional filters only", () => {
    expect(valid("listInput", {})).toBe(true);
    expect(valid("listInput", { holder: "smm-manager.cloud", includeRevoked: true, limit: 500 })).toBe(true);
    expect(valid("listInput", { holder: "smm-manager-agent cloud" })).toBe(false);
    expect(valid("listInput", { limit: 501 })).toBe(false);
  });
  it("takes the revoke input and answers the revoked grant", () => {
    expect(valid("revokeInput", { grantId: "key_7f3a91c2", reason: "The operator asked.", idempotencyKey: "r-1" })).toBe(true);
    expect(valid("revokeInput", { grantId: "key_7f3a91c2", idempotencyKey: "r-1" })).toBe(false);
    expect(valid("revokeResult", { grant: positive().grants[2], repeated: true })).toBe(true);
    expect(valid("revokeResult", { grant: { ...positive().grants[2], revoked: { at: "2026-11-18T16:00:00Z", by: "service", via: "automatic", secret: "x" } } })).toBe(false);
  });
});
