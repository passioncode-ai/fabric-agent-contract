import { describe, expect, it } from "vitest";
import { indexed, isObject, jsonEqual, show, toNumber } from "../src/findings.js";

// The helpers every rule module reads its input through (DEC-0052's tolerance; `indexed` shared since DEC-0083).
describe("the findings helpers", () => {
  it("indexed keeps each object item with its index as written, past non-objects", () => {
    const a = { id: "a" };
    const b = { id: "b" };
    expect(indexed([null, a, 7, "x", [], b])).toEqual([[a, 1], [b, 5]]);
    for (const value of [undefined, null, 7, "x", { 0: a }]) expect(indexed(value)).toEqual([]);
  });

  it("show writes a value as String() does, and an object whose toString is not a function as its JSON or its type", () => {
    expect(show("x")).toBe("x");
    expect(show(7)).toBe("7");
    expect(show(undefined)).toBe("undefined");
    expect(show({ toString: 1 })).toBe('{"toString":1}');
    // JSON has no text for a function, so its type is written.
    expect(show(Object.assign(() => 0, { toString: 1 }))).toBe("function");
  });

  it("toNumber reads as Number() does, and an object whose toString is not a function as no number", () => {
    expect(toNumber("3")).toBe(3);
    expect(toNumber({ toString: 1 })).toBeNaN();
  });

  it("isObject and jsonEqual", () => {
    expect([isObject({}), isObject([]), isObject(null)]).toEqual([true, false, false]);
    expect(jsonEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
  });
});
