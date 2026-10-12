import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { activityEventId, pathSourceKey } from "../src/activity-rules.js";
import { rfc8785, settingsCanonicalJson } from "../src/canonical.js";
import { COMMS_PROTOCOL, commsDigest } from "../src/comms-digest.js";
import { projectRoot } from "../src/contract.js";
import { actionDigest, jcs } from "../src/delegation.js";
import { policySigningInput } from "../src/device-rules.js";
import { canonicalJson, settingsBackupDigest } from "../src/settings-backup.js";

// DEC-0043: the contract's two canonical forms, run over the shared vectors a kit port runs too
// (fixtures/vectors/canonical.json), and each signed or hashed document's use of the form the register names
// (docs/specification/conformance.md#canonical-forms).
const root = projectRoot();
type Case = { name: string; input?: unknown; inputJson?: string; ieee754?: string; expected?: string; utf8Hex?: string };
type Differ = Case & { settings: string | null; rfc8785: string };
type Comms = { name: string; operation: string; args?: unknown; argsJson?: string; canonical?: string; digest?: string };
const vectors = JSON.parse(readFileSync(path.join(root, "fixtures/vectors/canonical.json"), "utf8")) as {
  settings: { vectors: Case[]; refuses: Case[] };
  rfc8785: { vectors: Case[]; numbers: Case[]; refuses: Case[] };
  differ: Differ[];
  commsDigest: { vectors: Comms[]; refuses: Comms[] };
};
/** A vector's value: its `ieee754` double, its parsed `inputJson`, or its `input`. */
const valueOf = (c: Case): unknown => {
  if (c.ieee754 !== undefined) return new DataView(Uint8Array.from(Buffer.from(c.ieee754, "hex")).buffer).getFloat64(0);
  return c.inputJson !== undefined ? JSON.parse(c.inputJson) : c.input;
};
const sha256 = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");

describe("the shared vectors", () => {
  it("hold every case the register promises a port", () => {
    expect(vectors.settings.vectors.length).toBeGreaterThanOrEqual(5);
    expect(vectors.rfc8785.numbers).toHaveLength(24); // RFC 8785 Appendix B's finite rows
    expect(vectors.rfc8785.refuses.filter((c) => c.ieee754)).toHaveLength(2); // its NaN and Infinity
    expect(vectors.differ.length).toBeGreaterThanOrEqual(1);
    expect(vectors.commsDigest.vectors.length).toBeGreaterThanOrEqual(3);
  });
});

describe("the settings form (settingsCanonicalJson)", () => {
  it.each(vectors.settings.vectors)("$name", (c) => {
    expect(settingsCanonicalJson(valueOf(c))).toBe(c.expected);
  });

  it.each(vectors.settings.refuses)("refuses $name", (c) => {
    expect(() => settingsCanonicalJson(valueOf(c))).toThrow(TypeError);
  });

  it("refuses what JSON cannot carry and does not check prototypes (its comment says so)", () => {
    for (const value of [undefined, () => 1, 1n, Number.NaN, Number.POSITIVE_INFINITY]) expect(() => settingsCanonicalJson(value)).toThrow(TypeError);
    expect(settingsCanonicalJson(new Map([["a", 1]]))).toBe("{}");
  });

  it("CT-25: refuses a lone surrogate in a value or a key, high or low, and writes a well-formed pair as itself", () => {
    for (const value of ["\ud800", "x\udfff", { "\udc00": 1 }, [{ a: "\ud83d" }]]) expect(() => settingsCanonicalJson(value)).toThrow(/lone surrogate/);
    expect(settingsCanonicalJson({ "\ud83d\ude00": "\ud83d\ude00" })).toBe('{"\ud83d\ude00": "\ud83d\ude00"}');
  });
});

describe("RFC 8785 (rfc8785)", () => {
  it.each(vectors.rfc8785.vectors)("$name", (c) => {
    const text = rfc8785(valueOf(c));
    expect(text).toBe(c.expected);
    if (c.utf8Hex) expect(Buffer.from(text, "utf8").toString("hex")).toBe(c.utf8Hex);
  });

  it.each(vectors.rfc8785.numbers)("Appendix B: $ieee754 is $expected", (c) => {
    expect(rfc8785(valueOf(c))).toBe(c.expected);
  });

  it.each(vectors.rfc8785.refuses)("refuses $name", (c) => {
    expect(() => rfc8785(valueOf(c))).toThrow(TypeError);
  });
});

describe("the two forms differ", () => {
  it.each(vectors.differ)("$name", (c) => {
    const value = valueOf(c);
    expect(rfc8785(value)).toBe(c.rfc8785);
    if (c.settings === null) expect(() => settingsCanonicalJson(value)).toThrow(TypeError);
    else expect(settingsCanonicalJson(value)).toBe(c.settings);
    expect(rfc8785(value)).not.toBe(c.settings);
  });
});

describe("the board's idempotency digest (commsDigest, DEC-0022 pinned to RFC 8785)", () => {
  it.each(vectors.commsDigest.vectors)("$name", (c) => {
    expect(rfc8785(c.args)).toBe(c.canonical);
    expect(commsDigest(c.operation, c.args)).toBe(c.digest);
    expect(c.digest).toBe(`sha256:${sha256(`${COMMS_PROTOCOL}\u0000${c.operation}\u0000${c.canonical}`)}`);
  });

  it.each(vectors.commsDigest.refuses)("refuses $name", (c) => {
    expect(() => commsDigest(c.operation, JSON.parse(c.argsJson ?? "{}"))).toThrow(TypeError);
  });

  it("refuses an empty operation and a fraction nested in an array", () => {
    expect(() => commsDigest("", {})).toThrow(TypeError);
    expect(() => commsDigest("com.submit", { a: [{ b: [1.5] }] })).toThrow(TypeError);
  });
});

describe("each signed or hashed document uses the form the register names", () => {
  // The audit probe (F-B-315): the forms differ on it in separators and in key order.
  const probe = { b: 1, a: ["x", true], "\u{1F600}": 1, "｡": 2 };

  it("the old names are the register's functions", () => {
    expect(canonicalJson).toBe(settingsCanonicalJson);
    expect(jcs).toBe(rfc8785);
  });

  it("settings backup checksum: the settings form", () => {
    expect(settingsBackupDigest(probe)).toBe(sha256(settingsCanonicalJson(probe)));
  });

  it("device policy and key-set signatures (DEC-0031's 'its canonical JSON'): the settings form", () => {
    const policy = { ...probe, signature: { alg: "ed25519", keyId: "k1", value: "AA==" } };
    expect(policySigningInput(policy).toString("utf8")).toBe(settingsCanonicalJson(probe));
  });

  it("activity eventId and path sourceKey: the settings form", () => {
    expect(activityEventId("claude-code", "\u{1F600}")).toBe(`sha256:${sha256(settingsCanonicalJson({ key: "\u{1F600}", source: "claude-code" }))}`);
    const key = Buffer.alloc(32, 7);
    const expected = createHmac("sha256", key).update(settingsCanonicalJson({ offset: 12, path: "p/｡.jsonl" }), "utf8").digest("hex");
    expect(pathSourceKey(key, "p/｡.jsonl", 12)).toBe(`hmac-sha256:${expected}`);
  });

  it("the approval's action digest: RFC 8785", () => {
    expect(actionDigest(probe)).toBe(`sha256:${sha256(rfc8785(probe))}`);
  });
});

describe("the register in conformance.md", () => {
  it("names one of the two forms on every row, and the rule against a third", () => {
    const text = readFileSync(path.join(root, "docs/specification/conformance.md"), "utf8");
    const section = /## Canonical forms\n([\s\S]*?)\n## /.exec(text)?.[1] ?? "";
    // The document table: from its header to the first line that is not a row.
    const lines = section.split("\n");
    const header = lines.findIndex((line) => line.startsWith("| Document |"));
    const end = lines.findIndex((line, i) => i > header && !line.startsWith("|"));
    const rows = lines.slice(header + 2, end);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    for (const row of rows) expect(row.split(" | ")[1], row).toMatch(/^(settings form|RFC 8785)/);
    expect(section).toMatch(/never a third/);
  });
});
