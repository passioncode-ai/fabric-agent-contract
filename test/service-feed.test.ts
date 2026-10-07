import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { tokenHeader } from "../src/service-feed.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0025: a feed client sends the token where the descriptor says, in the form it says. One
// that assumed `Authorization: Bearer` against a custom header was refused on every poll and
// dropped the service's notify events without a word.
type Case = { descriptor: { auth: Record<string, unknown> }; token: string; request: { path: string; headers: Record<string, string> } };
const load = (name: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/semantic", `${name}.json`), "utf8")) as Case;
const validator = await createValidator();
const findings = (value: unknown) => evaluateSemanticRules("service-feed-request", value);

describe("feed client token header (DEC-0025, FAC-SEM-036)", () => {
  it("sends the raw token in the declared custom header when the scheme is none", () => {
    const ok = load("service-feed-request-custom-header");
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/service-descriptor.schema.json`, ok.descriptor).valid).toBe(true);
    expect(tokenHeader(ok.descriptor.auth, ok.token)).toEqual({ name: "X-Example-Token", value: ok.token });
    expect(findings(ok)).toEqual([]);
  });

  it("flags a client that assumed Authorization: Bearer, without echoing the token", () => {
    const bad = load("service-feed-request-assumed-bearer");
    const found = findings(bad);
    expect(found.map((finding) => finding.instancePath)).toEqual(["/request/headers", "/request/headers/Authorization"]);
    expect(found.every((finding) => finding.code === "FAC-SEM-036" && !finding.message.includes(bad.token))).toBe(true);
  });

  it("flags the declared header carrying the wrong form", () => {
    const wrong = load("service-feed-request-custom-header");
    wrong.request.headers = { "X-Example-Token": `Bearer ${wrong.token}` };
    expect(findings(wrong)).toEqual([expect.objectContaining({ code: "FAC-SEM-036", instancePath: "/request/headers/X-Example-Token" })]);
  });

  it("reads header names case-insensitively", () => {
    const lower = load("service-feed-request-custom-header");
    lower.request.headers = { "x-example-token": lower.token };
    expect(findings(lower)).toEqual([]);
  });

  it("defaults to Authorization: Bearer when the descriptor declares neither header nor scheme", () => {
    const plain = load("service-feed-request-custom-header");
    plain.descriptor.auth = { tokenFile: "~/.config/example-agent/service.token" };
    expect(tokenHeader(plain.descriptor.auth, plain.token)).toEqual({ name: "Authorization", value: `Bearer ${plain.token}` });
    plain.request.headers = { Authorization: `Bearer ${plain.token}` };
    expect(findings(plain)).toEqual([]);
  });

  it("flags a token in the URL", () => {
    const leaked = load("service-feed-request-custom-header");
    leaked.request.path = `/fabric/v1/events?token=${leaked.token}`;
    expect(findings(leaked).map((finding) => finding.instancePath)).toEqual(["/request/path"]);
  });
});
