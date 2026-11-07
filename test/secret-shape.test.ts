import { describe, expect, it } from "vitest";
import { JWT_SHAPE, hasJwt, jwtSpans } from "../src/secret-shape.js";

/** What a global `JWT_SHAPE` finds: leftmost, non-overlapping spans. */
const regexSpans = (text: string): Array<[number, number]> =>
  [...text.matchAll(new RegExp(JWT_SHAPE.source, "g"))].map((match) => [match.index as number, (match.index as number) + match[0].length]);

describe("jwtSpans and hasJwt (DEC-0149)", () => {
  it("read overlapping eyJ runs as one match, as the regex does", () => {
    for (const text of ["eyJeyJab.cd.ef", "xeyJeyJeyJab.cd.ef tail", "eyJeyJ.cd.ef", "eyJa.cd.ef eyJeyJab.cd."]) {
      expect(jwtSpans(text), text).toEqual(regexSpans(text));
      expect(hasJwt(text), text).toBe(JWT_SHAPE.test(text));
    }
    expect(jwtSpans("eyJeyJab.cd.ef")).toEqual([[0, 14]]);
    expect(jwtSpans("eyJa.cd.ef")).toEqual([]);
  });

  it("take an eyJ inside a match's third segment as part of that match, never as a second one", () => {
    const text = "eyJab.cd.eyJxy.zz.ww";
    expect(jwtSpans(text)).toEqual([[0, 14]]);
    expect(jwtSpans(text)).toEqual(regexSpans(text));
    const after = "eyJab.cd.eyJxy eyJpq.rs.tu";
    expect(jwtSpans(after)).toEqual([[0, 14], [15, 26]]);
    expect(jwtSpans(after)).toEqual(regexSpans(after));
  });

  it("stop at the first match with first, and answer none for text without one", () => {
    const text = "a eyJaa.bb.cc b eyJdd.ee.ff";
    expect(jwtSpans(text)).toEqual([[2, 13], [16, 27]]);
    expect(jwtSpans(text, true)).toEqual([[2, 13]]);
    expect(hasJwt(text)).toBe(true);
    for (const none of ["", "eyJ", "eyJab.c.d", "eyJab.cd", "eyJab..cd"]) {
      expect(jwtSpans(none, true), none).toEqual([]);
      expect(hasJwt(none), none).toBe(false);
      expect(JWT_SHAPE.test(none), none).toBe(false);
    }
  });
});
