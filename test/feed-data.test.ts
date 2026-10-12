import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { feedDataFindings } from "../src/feed-data.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0070: an optional machine-readable data object on service feed events (FAC-SEM-101).
const page = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-events-page-data.json"), "utf8"));
const withValue = (value: Record<string, unknown>) => ({ ...page, events: [{ ...page.events[0], data: { ...page.events[0].data, value } }] });
const paths = (value: unknown) => evaluateSemanticRules("service-events-page", value).map((f) => `${f.code} ${f.instancePath}`);

describe("FAC-SEM-101: no secret in an event's data", () => {
  it("passes the fixture, whose counts sit under names such as inputTokens", () => expect(paths(page)).toEqual([]));
  it("refuses a string under a credential's name at either level, and never names the value", () => {
    expect(paths(withValue({ apiKey: "abc" }))).toEqual(["FAC-SEM-101 /events/0/data/value/apiKey"]);
    expect(paths(withValue({ login: { password: "hunter2" } }))).toEqual(["FAC-SEM-101 /events/0/data/value/login/password"]);
    const finding = evaluateSemanticRules("service-events-page", withValue({ apiKey: "abc-very-secret" }))[0]!;
    expect(finding.message.includes("abc-very-secret")).toBe(false);
  });
  it("refuses a credential-shaped string anywhere, in a list too", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln";
    expect(paths(withValue({ note: `Bearer ${"x".repeat(20)}` }))).toEqual(["FAC-SEM-101 /events/0/data/value/note"]);
    expect(paths(withValue({ refs: ["ok", jwt] }))).toEqual(["FAC-SEM-101 /events/0/data/value/refs/1"]);
    expect(paths(withValue({ meta: { trace: jwt } }))).toEqual(["FAC-SEM-101 /events/0/data/value/meta/trace"]);
  });
  it("lets a number, a boolean or null sit under any name", () => {
    expect(paths(withValue({ tokens: 12, password: true, secret: null }))).toEqual([]);
  });
  it("reads a page without data, and malformed data, as nothing, never by throwing", () => {
    expect(feedDataFindings({ events: [null, 3, { data: "x" }, { data: { value: [1] } }, { data: { value: { a: [null, { b: 1 }] } } }] })).toEqual([]);
    expect(feedDataFindings({ events: "x" })).toEqual([]);
  });
});
