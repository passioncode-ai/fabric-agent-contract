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
  // One cell holding every row (one agent, the period). A cost list copied per row made this quadratic (16 s on 100 000
  // rows at load 70, 2026-10-21). Growth, not a clock: 4x the rows takes about 4x the time when linear and 16x when
  // quadratic; three tries absorb a loaded machine, and quadratic growth fails all of them.
  it("answers rows in one cell in linear time", () => {
    const rows = (length: number) => Array.from({ length }, () => ({ agentRef: "urn:fabric:agent:acme:a0", day: "2026-10-12", calls: 1, unpricedCalls: 0, costUsd: 1 }));
    expect(partnerUsage({ usage: rows(100_000), publishers: ["acme"], step: "period" })).toMatchObject({ cells: [{ calls: 100_000, costUsd: 100_000 }] });
    const time = (input: unknown[]) => Math.min(...[0, 1, 2].map(() => { const started = performance.now(); partnerUsage({ usage: input, publishers: ["acme"], step: "period" }); return performance.now() - started; }));
    const small = rows(12_500);
    const large = rows(50_000);
    let a = 0;
    let b = 0;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      a = time(small);
      b = time(large);
      if (b < 8 * a + 150) break;
    }
    expect(b, `12500 rows ${a.toFixed(1)} ms, 50000 rows ${b.toFixed(1)} ms`).toBeLessThan(8 * a + 150);
  }, 60_000);
});
