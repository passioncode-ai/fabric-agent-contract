import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { actionDecision } from "../src/actions.js";
import { projectRoot } from "../src/contract.js";
import { type Mandate, mandateCovers, profileDigest } from "../src/mandate.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { levelShortOf } from "../src/levels.js";
import { buildProfileVectors, VECTOR_FILE } from "../tools/vectors/profile.js";

// DEC-0166: a place's autonomy profile as a standing mandate. The vectors are written by tools/vectors/profile.ts
// with hand-written expectations; the reference (actionDecision, mandateCovers through it) must give exactly those.
type Json = Record<string, any>;
const committed = readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8");
const vectors = JSON.parse(committed) as Json;

describe("profile vectors (DEC-0166)", () => {
  it("is the file the generator writes", () => expect(committed).toBe(buildProfileVectors()));
  it.each((vectors.actions as Json[]).map((c) => [c.name, c] as const))("action: %s", (_name, c) => expect(actionDecision(c.input)).toEqual(c.expected));
  it.each((vectors.documents as Json[]).map((c) => [c.name, c] as const))("document: %s", (_name, c) => {
    expect(evaluateSemanticRules("mandate", c.mandate).map((f) => `${f.code} ${f.instancePath}`)).toEqual(c.findings);
  });
});

describe("profileDigest and mandateCovers on a standing mandate (DEC-0166 AU-3)", () => {
  const mandate = vectors.actions[0].input.mandate as Mandate;
  it("ignores the chain, which grows at every hand-over, and names the revision", () => {
    expect(profileDigest({ ...mandate, chain: mandate.chain.slice(0, 1) })).toBe(profileDigest(mandate));
    expect(profileDigest({ ...mandate, standing: { ...mandate.standing!, revision: 4 } })).not.toBe(profileDigest(mandate));
  });
  it("answers ignored, never a refusal, where the callee reads no standing mandate or a T2 call carries no prof", () => {
    const call = { capability: "site.deploy", effect: "deploy" };
    const base = { mandate, now: "2026-11-12T10:00:00Z", self: "example-deployer", callerAgent: "example-runner", call };
    expect(mandateCovers({ ...base, tier: "T1" })).toEqual({ ignored: "standing-not-read" });
    expect(mandateCovers({ ...base, tier: "T2", standing: true })).toEqual({ ignored: "mandate-at-t2" });
  });
});

describe("levelShortOf (DEC-0166 AU-2, DEC-0162 LV-7)", () => {
  it("ranks a level it does not know below every declared level (the schema admits none), and an owner covers owner acts anywhere", () => {
    expect(levelShortOf("boss", undefined, true)).toBeUndefined();
    expect(levelShortOf("boss", "admin", true)).toBe("level-insufficient: admin");
    expect(levelShortOf("boss", "owner", true)).toBe("level-insufficient: owner");
    expect(levelShortOf("owner", "owner", false)).toBeUndefined();
  });
});
