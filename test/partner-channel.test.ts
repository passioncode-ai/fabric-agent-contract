import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { chainDepth, isPartnerActor } from "../src/delegation.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { SCHEMA_PREFIX } from "../src/contract.js";

type Json = Record<string, any>;
const load = (name: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/semantic", name), "utf8")) as Json;
const ajv = await createValidator();
const valid = (schema: string, doc: unknown) => validateDocument(ajv, `${SCHEMA_PREFIX}schemas/${schema}`, doc).valid;
const at = (value: Json) => evaluateSemanticRules("delegation-mint", value).filter((f) => f.code === "FAC-SEM-124").map((f) => f.instancePath).sort();

describe("owner to partner to agents (DEC-0090 item 3, FAC-SEM-124)", () => {
  it("a token minted at a partner grant holds the partner's agent and, inside it, the partner", () => {
    const ok = load("delegation-mint-partner-ok.json");
    expect(valid("governance.schema.json", ok.grant)).toBe(true);
    expect(valid("delegation-token.schema.json", ok.token)).toBe(true);
    expect(evaluateSemanticRules("delegation-mint", ok)).toEqual([]);
    expect(chainDepth(ok.token.act)).toBe(2);
  });
  it("refuses another partner, no partner, a personal grant and a partner actor under an agent's grant", () => {
    expect(at(load("delegation-mint-partner-other-partner.json"))).toEqual(["/token/act"]);
    expect(at(load("delegation-mint-partner-no-partner.json"))).toEqual(["/token/act"]);
    expect(at(load("delegation-mint-partner-personal.json"))).toEqual(["/grant/context"]);
    expect(at(load("delegation-mint-agent-grant-partner-actor.json"))).toEqual(["/token/act"]);
  });
  it("keeps the partner innermost onward: the chain grows by one agent outside", () => {
    const ok = load("delegation-mint-partner-ok.json");
    const onward = { ...ok, parent: ok.token, token: { ...ok.token, aud: "example-writer", act: { sub: ok.token.aud, act: ok.token.act } } };
    expect(at(onward)).toEqual([]);
    expect(chainDepth(onward.token.act)).toBe(3);
  });
  it("admits a partner actor only innermost, never outermost and never with other members", () => {
    expect(isPartnerActor({ partner: "org:acme_partners" })).toBe(true);
    expect(isPartnerActor({ partner: "org:acme_partners", sub: "x" })).toBe(false);
    expect(isPartnerActor({ partner: "personal" })).toBe(false);
    expect(chainDepth({ partner: "org:acme_partners" })).toBe(Number.POSITIVE_INFINITY);
    expect(valid("delegation-token.schema.json", { ...load("delegation-mint-partner-ok.json").token, act: { partner: "org:acme_partners" } })).toBe(false);
  });
});
