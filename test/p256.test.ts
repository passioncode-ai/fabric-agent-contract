import { createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { P256_CURVE, isEd25519Key, isLowS, isValidP256Key, p256Jwk, p256KeyRefusal, p256Point, p256PublicKey, signEs256, toLowS, type P256Key } from "../src/p256.js";

// DEC-0053, DEC-0047: a P-256 public key is validated by SEC 1 v2 §3.2.2 before anything is verified or sealed under
// it, over the shared vectors a port runs too — SEC 1 octets (device keys, roots) and JWKs (relay keys). The curve
// constants are checked against the base point and the JWK cases against Node's own decoder, so the list does not
// vouch for itself.
type Point = { name: string; publicKey: string; refusal?: string };
type JwkCase = { name: string; jwk: Record<string, unknown>; refusal: string | null };
const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/p256.json"), "utf8")) as {
  valid: Point[]; invalid: Point[]; jwk: JwkCase[];
};
const raw = (base64: string) => Buffer.from(base64, "base64");
const nodeAccepts = (jwk: Record<string, unknown>) => {
  try {
    createPublicKey({ key: jwk as never, format: "jwk" });
    return true;
  } catch {
    return false;
  }
};

describe("isValidP256Key and p256KeyRefusal (SEC 1 §3.2.2)", () => {
  it.each(vectors.valid)("accepts $name", ({ publicKey }) => {
    expect(isValidP256Key(raw(publicKey))).toBe(true);
    expect(p256KeyRefusal(raw(publicKey))).toBeNull();
  });

  it.each(vectors.invalid)("refuses $name, naming why", ({ publicKey, refusal }) => {
    expect(isValidP256Key(raw(publicKey))).toBe(false);
    expect(p256KeyRefusal(raw(publicKey))).toBe(refusal);
  });

  it.each(vectors.jwk)("answers the JWK $name", ({ jwk, refusal }) => expect(p256KeyRefusal(jwk as P256Key)).toBe(refusal));

  it("covers each refusal and the valid case at least once", () => {
    const seen = new Set<string | null>([...vectors.invalid.map((v) => v.refusal ?? "missing"), ...vectors.jwk.map((v) => v.refusal), null]);
    for (const outcome of ["point-at-infinity", "coordinate-out-of-range", "not-on-curve", "bad-encoding"]) expect(seen.has(outcome), outcome).toBe(true);
    expect(seen.has("missing")).toBe(false);
  });

  it("agrees with Node's decoder on every well-formed P-256 JWK vector", () => {
    for (const c of vectors.jwk) {
      if (c.jwk.crv !== "P-256" || c.refusal === "bad-encoding") continue;
      expect(nodeAccepts(c.jwk), c.name).toBe(c.refusal === null);
    }
  });

  it("holds the SEC 2 base point on the curve with the constants it uses", () => {
    const { p, a, b, gx, gy } = P256_CURVE;
    expect((gy * gy) % p).toBe((((gx * gx * gx + a * gx + b) % p) + p) % p);
  });

  it("accepts every key Node generates, as octets and as a JWK, and refuses the same point with y changed", () => {
    for (let i = 0; i < 16; i += 1) {
      const jwk = generateKeyPairSync("ec", { namedCurve: "P-256" }).publicKey.export({ format: "jwk" }) as Record<string, string>;
      const point = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x as string, "base64url"), Buffer.from(jwk.y as string, "base64url")]);
      expect(isValidP256Key(point)).toBe(true);
      expect(isValidP256Key(jwk)).toBe(true);
      point[64] = point[64]! ^ 1;
      expect(p256KeyRefusal(point)).toBe("not-on-curve");
    }
  });

  it("refuses what is not a key at all", () => {
    for (const value of [{}, { kty: "OKP", crv: "Ed25519", x: "AA" }, { kty: "EC", crv: "P-256", x: 1, y: 2 }, new Uint8Array(0)]) {
      expect(p256KeyRefusal(value as P256Key)).toBe("bad-encoding");
    }
    expect(p256KeyRefusal(null as unknown as P256Key)).toBe("bad-encoding");
  });
});

describe("one key, two forms (DEC-0053 octets, DEC-0047 JWKs)", () => {
  it("reaches the same point and the same public key from octets and from a JWK", () => {
    const pair = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const jwk = pair.publicKey.export({ format: "jwk" }) as Record<string, string>;
    const point = p256Point(jwk);
    expect(point).toHaveLength(65);
    expect(p256Point(new Uint8Array(point))).toEqual(point);
    const a = p256PublicKey(jwk).export({ format: "jwk" });
    const b = p256PublicKey(new Uint8Array(point)).export({ format: "jwk" });
    expect(b).toEqual(a);
    expect(p256Jwk(new Uint8Array(point))).toEqual({ kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y });
  });

  it("throws on a key SEC 1 refuses, naming why", () => {
    const point = Buffer.from(vectors.valid[0]!.publicKey, "base64");
    point[64] = point[64]! ^ 1;
    expect(() => p256Point(point)).toThrow(/bad-key: not-on-curve/);
    expect(() => p256PublicKey({ kty: "EC", crv: "P-256", x: 1, y: 2 } as P256Key)).toThrow(/bad-encoding/);
  });

  it("tells an Ed25519 key from a P-256 one", () => {
    const ed = generateKeyPairSync("ed25519").publicKey.export({ format: "jwk" });
    expect(isEd25519Key(ed)).toBe(true);
    expect(isEd25519Key(new Uint8Array(32))).toBe(true);
    expect(isEd25519Key(new Uint8Array(65))).toBe(false);
    expect(isEd25519Key({ kty: "EC", crv: "P-256" })).toBe(false);
    expect(isEd25519Key(null)).toBe(false);
  });
});

// DEC-0066 (CON-015): one ES256 rule for the relay family. A signature's s is at most n/2; a signer normalises after
// signing, so a third party (the relay included) cannot mint a second valid encoding of the same signature.
describe("low-S ES256", () => {
  const half = P256_CURVE.n / 2n;
  const s = (raw: Uint8Array) => BigInt(`0x${Buffer.from(raw).subarray(32).toString("hex")}`);
  const key = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const flip = (raw: Uint8Array) => Buffer.concat([Buffer.from(raw).subarray(0, 32), Buffer.from((P256_CURVE.n - s(raw)).toString(16).padStart(64, "0"), "hex")]);

  it("signEs256 always gives the low-S form, and it verifies (1000 signatures)", () => {
    for (let i = 0; i < 1000; i += 1) {
      const sig = Buffer.from(signEs256(key.privateKey, `message ${i}`), "base64url");
      expect(sig.length).toBe(64);
      expect(s(sig) <= half).toBe(true);
      expect(isLowS(sig)).toBe(true);
      expect(verify("sha256", Buffer.from(`message ${i}`), { key: key.publicKey, dsaEncoding: "ieee-p1363" }, sig)).toBe(true);
    }
  });

  it("toLowS maps (r, s) and (r, n − s) to one form, idempotently, and both verify under plain ECDSA", () => {
    const low = Buffer.from(signEs256(key.privateKey, Buffer.from("m")), "base64url");
    const high = flip(low);
    expect(isLowS(high)).toBe(false);
    expect(verify("sha256", Buffer.from("m"), { key: key.publicKey, dsaEncoding: "ieee-p1363" }, high)).toBe(true);
    expect(Buffer.from(toLowS(high)).equals(low)).toBe(true);
    expect(Buffer.from(toLowS(low)).equals(low)).toBe(true);
    expect(Buffer.from(toLowS(toLowS(high))).equals(Buffer.from(toLowS(high)))).toBe(true);
  });

  it("puts the boundary at n/2 and refuses what is not 64 bytes", () => {
    const at = (value: bigint) => Buffer.concat([Buffer.alloc(32, 1), Buffer.from(value.toString(16).padStart(64, "0"), "hex")]);
    expect(isLowS(at(half))).toBe(true);
    expect(isLowS(at(half + 1n))).toBe(false);
    expect(isLowS(new Uint8Array(63))).toBe(false);
    expect(() => toLowS(new Uint8Array(65))).toThrow(/64 bytes/);
  });
});
