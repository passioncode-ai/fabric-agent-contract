import { generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { isValidP256Key } from "../src/p256.js";

// DEC-0053: a P-256 public key is validated by SEC 1 v2 §3.2.2 before use, over the shared vectors a port runs too.
const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/p256.json"), "utf8")) as { valid: Array<{ name: string; publicKey: string }>; invalid: Array<{ name: string; publicKey: string }> };
const raw = (base64: string) => Buffer.from(base64, "base64");

describe("isValidP256Key (SEC 1 §3.2.2)", () => {
  it.each(vectors.valid)("accepts $name", ({ publicKey }) => expect(isValidP256Key(raw(publicKey))).toBe(true));
  it.each(vectors.invalid)("refuses $name", ({ publicKey }) => expect(isValidP256Key(raw(publicKey))).toBe(false));

  it("accepts every key Node generates, and refuses the same point with one coordinate changed", () => {
    for (let i = 0; i < 16; i += 1) {
      const jwk = generateKeyPairSync("ec", { namedCurve: "P-256" }).publicKey.export({ format: "jwk" }) as { x: string; y: string };
      const point = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")]);
      expect(isValidP256Key(point)).toBe(true);
      point[64] = point[64]! ^ 1;
      expect(isValidP256Key(point)).toBe(false);
    }
  });
});
