import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { normalIdentifier, sameIdentifier } from "../src/identifiers.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0076: identifier equality — the normal form (RFC 3986 §6.2.2; RFC 8141 §3.1 for `urn:`) over the shared vectors a
// port runs too (fixtures/vectors/identifiers.json), checked against `common.schema.json#/$defs/uri` on the same inputs.
type Normal = { name: string; input: string; expected: string; schema: boolean };
type Lax = { name: string; input: string; wrong: string; expected: string };
const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/identifiers.json"), "utf8")) as {
  normal: Normal[];
  same: [string, string][];
  different: [string, string][];
  laxPorts: Lax[];
};
const URI = "https://fabric.passioncode.ai/agent-contract/0.1.0/schemas/common.schema.json#/$defs/uri";
const validator = await createValidator();
const isUri = (text: string) => validateDocument(validator, URI, text).valid;

describe("the shared vectors", () => {
  it("hold every case the specification promises a port", () => {
    expect(vectors.normal.length).toBeGreaterThanOrEqual(20);
    expect(vectors.same.length).toBeGreaterThanOrEqual(5);
    expect(vectors.different.length).toBeGreaterThanOrEqual(5);
    expect(vectors.laxPorts.map((c) => c.name)).toEqual(expect.arrayContaining(["decoding a reserved character", "lower-casing a URN's NSS"]));
  });

  it.each(vectors.normal)("$name", (c) => {
    expect(normalIdentifier(c.input)).toBe(c.expected);
    // Idempotent: the normal form is its own normal form.
    expect(normalIdentifier(c.expected)).toBe(c.expected);
  });

  it.each(vectors.same)("%s is the same as %s", (a, b) => {
    expect(sameIdentifier(a, b)).toBe(true);
    expect(sameIdentifier(b, a)).toBe(true);
  });

  it.each(vectors.different)("%s is not the same as %s", (a, b) => {
    expect(sameIdentifier(a, b)).toBe(false);
  });

  it.each(vectors.laxPorts)("a lax port's mistake: $name", (c) => {
    expect(normalIdentifier(c.input)).toBe(c.expected);
    expect(c.wrong).not.toBe(c.expected);
    expect(sameIdentifier(c.input, c.wrong)).toBe(false);
  });
});

describe("the normal form against the schema (common.schema.json#/$defs/uri)", () => {
  it.each(vectors.normal)("$name: the schema's verdict is the vector's", (c) => {
    expect(isUri(c.input)).toBe(c.schema);
  });

  it("normalizes only a string the schema admits, and its normal form is admitted too", () => {
    for (const c of vectors.normal) {
      const normal = normalIdentifier(c.input) as string;
      if (!c.schema) expect(normal).toBe(c.input);
      else expect(isUri(normal)).toBe(true);
    }
  });

  it("agrees with the schema on the edge of the grammar", () => {
    // "x://h:12a/" is no RFC 3986 URI (a port is digits), though the schema's validator admits it (see the vectors'
    // note): this function never normalizes it, so it can only miss a sameness, never invent one.
    expect(isUri("x://h:12a/")).toBe(true);
    expect(normalIdentifier("X://h:12a/")).toBe("X://h:12a/");
    const refused = ["x:%G0", "1x:a", "x y:a", "X:", "X:?q", "x://[::G]/", "x://a b/", "x:a\u00e9", "x:a b", "x:a^b", "x://[1:2:3:4:5:6:7:8:9]/", "x:/\\a", "x:a?b c", "x:a#b^c", "x://u^v@h/"];
    for (const text of refused) {
      expect(isUri(text)).toBe(false);
      expect(normalIdentifier(text)).toBe(text);
    }
    const admitted = ["X://U%41@EX%41MPLE.com:1/%41?%41#%41", "X://[V1.Ab]/", "X://[::FFFF:1.2.3.4]/", "X://1.2.3.4/", "X:/a/./b", "URN:A1:b"];
    for (const text of admitted) {
      expect(isUri(text)).toBe(true);
      expect(normalIdentifier(text)).not.toBe(text);
      expect(isUri(normalIdentifier(text) as string)).toBe(true);
    }
    expect(normalIdentifier("X://U%41@EX%41MPLE.com:1/%41?%41#%41")).toBe("x://UA@example.com:1/A?A#A");
  });
});

describe("normalIdentifier and sameIdentifier", () => {
  it("answer a value that is not a string without throwing: no normal form, compared as it is", () => {
    for (const value of [undefined, null, 0, 7, true, {}, [], ["agent:x"], { toString: () => "agent:x" }]) {
      expect(normalIdentifier(value)).toBeUndefined();
      expect(sameIdentifier(value, "agent:x")).toBe(false);
      expect(sameIdentifier("agent:x", value)).toBe(false);
    }
    expect(sameIdentifier(undefined, undefined)).toBe(true);
    expect(sameIdentifier(null, undefined)).toBe(false);
  });

  it("read inherited names as strings, never as members of anything", () => {
    for (const name of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      expect(normalIdentifier(name)).toBe(name);
      expect(sameIdentifier(name, name)).toBe(true);
      expect(sameIdentifier(name, "agent:x")).toBe(false);
    }
    expect(normalIdentifier("x:__proto__")).toBe("x:__proto__");
  });

  it("read a very long input in linear time", () => {
    const path = "/a".repeat(200_000);
    const started = Date.now();
    expect(normalIdentifier(`HTTPS://EXAMPLE.com${path}/./..`)).toBe(`https://example.com${path.slice(0, -2)}/`);
    expect(normalIdentifier(`x:${"%".repeat(200_000)}`)).toBe(`x:${"%".repeat(200_000)}`);
    expect(normalIdentifier(`urn:a1:${"%2f".repeat(100_000)}`)).toBe(`urn:a1:${"%2F".repeat(100_000)}`);
    expect(normalIdentifier(`agent:${"./".repeat(200_000)}x`)).toBe("agent:x");
    expect(Date.now() - started).toBeLessThan(5000);
  });

  it("removes dot segments as RFC 3986 §5.2.4 does", () => {
    const cases: [string, string][] = [
      ["/a/b/c/./../../g", "/a/g"],
      ["/./a", "/a"],
      ["/.", "/"],
      ["/..", "/"],
      ["/../a", "/a"],
      ["/a/..", "/"],
      ["/a/./", "/a/"],
      ["/a//../b", "/a/b"],
      ["/a/b//..", "/a/b/"],
      ["", ""],
    ];
    for (const [input, expected] of cases) expect(normalIdentifier(`x://h${input}`)).toBe(`x://h${expected}`);
    expect(normalIdentifier("x:/a/../b")).toBe("x:/b");
  });

  it("keeps a path that would begin with '//' without an authority, so it is never read as one", () => {
    expect(normalIdentifier("X:/.//a")).toBe("x:/.//a");
    expect(normalIdentifier("x://a")).toBe("x://a");
  });

  it("reads a URN by RFC 8141: the NID only when it is one, an authority form kept but for hex case", () => {
    expect(normalIdentifier("URN:-bad:X")).toBe("urn:-bad:X");
    expect(normalIdentifier("URN:A")).toBe("urn:A");
    expect(normalIdentifier("urn://H/%7e")).toBe("urn://H/%7E");
    expect(normalIdentifier("urn:Ab:c?=q")).toBe("urn:ab:c");
    expect(normalIdentifier("urn:ab:c?x%7e")).toBe("urn:ab:c?x%7E");
  });
});
