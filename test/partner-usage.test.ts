import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { partnerUsage, publisherOf } from "../src/partner-usage.js";
import { VECTOR_FILE, buildPartnerUsageVectors } from "../tools/vectors/partner-usage.js";

type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;

describe("partner usage (DEC-0090 item 2)", () => {
  it("the vectors are the generator's output", () => {
    expect(buildPartnerUsageVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });
  it.each(vectors.cases as Json[])("$name", (entry) => {
    expect(partnerUsage(entry.input)).toEqual(entry.expected);
  });
  it("reads the publisher of an agentRef and nothing else", () => {
    expect(publisherOf("urn:fabric:agent:acme:setup-desk")).toBe("acme");
    expect(publisherOf("urn:fabric:agent:Acme:x")).toBeUndefined();
    expect(publisherOf(`urn:fabric:agent:${"a".repeat(80)}:${"b".repeat(80)}`)).toBeUndefined();
    expect(publisherOf(7)).toBeUndefined();
  });
  it("never throws, and answers the largest input it accepts", () => {
    for (const bad of [undefined, 1, "", [], {}, { usage: [null], publishers: [], step: "day" }, { usage: [{}], publishers: [], step: "day" }]) expect(() => partnerUsage(bad)).not.toThrow();
    // No clock: on this Mac at load 500 any time bound failed (2.1 s against 2 s on 2026-10-20, then a growth ratio).
    // The bound that matters is the input's: 100 000 rows are answered, one more is refused.
    const usage = Array.from({ length: 100_000 }, (_, n) => ({ agentRef: `urn:fabric:agent:acme:a${n % 100}`, day: "2026-10-12", calls: 1, unpricedCalls: 0, costUsd: 1 }));
    expect(partnerUsage({ usage, publishers: ["acme"], step: "day" })).toMatchObject({ cells: expect.any(Array) });
    expect(partnerUsage({ usage: [...usage, usage[0]], publishers: ["acme"], step: "day" })).toEqual({ fault: "input-invalid" });
  });
});
