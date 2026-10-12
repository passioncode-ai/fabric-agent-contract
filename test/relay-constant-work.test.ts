import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// DEC-0066 (adversarial finding F1): before the signer is proven, nothing the relay holds may change the answer — nor
// the work. Every pre-proof path of `admit` and `verifyBlobRequest` runs exactly one real signature verification: under
// the admitted key, or under a fixed dummy key when the kid is unknown, the estate differs, no record is held or the
// admitted key is unusable. Timing is not asserted (it is flaky); the count of node:crypto verify calls is.
const counter = vi.hoisted(() => ({ verifies: 0, keyChecks: 0, lowS: 0, lookups: 0 }));
vi.mock("../src/p256.js", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/p256.js")>();
  return {
    ...real,
    p256KeyRefusal: (key: Parameters<typeof real.p256KeyRefusal>[0]) => { counter.keyChecks += 1; return real.p256KeyRefusal(key); },
    isLowS: (raw: Uint8Array) => { counter.lowS += 1; return real.isLowS(raw); }
  };
});
vi.mock("node:crypto", async (importOriginal) => {
  const real = await importOriginal<typeof import("node:crypto")>();
  const verify = ((...args: Parameters<typeof real.verify>) => {
    counter.verifies += 1;
    return real.verify(...args);
  }) as typeof real.verify;
  return { ...real, verify, default: { ...real, verify } };
});

const { projectRoot } = await import("../src/contract.js");
const { admit, verifyBlobRequest } = await import("../src/relay.js");
const { vectorKey } = await import("../src/relay-vectors.js");
const { highS } = await import("../tools/vectors/relay-crypto.js");

type Json = Record<string, any>;
const relay = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/relay.json"), "utf8")) as Json;
const ok = (relay.admit.cases as Json[]).find((c) => c.name === "the vector machine, key as a JWK") as Json;
const kid = ok.frame.kid as string;
const key = vectorKey(ok.context.admitted[kid]);
const ed25519 = relay.ed25519.key;
const junk = Buffer.alloc(64, 1).toString("base64url");
const lookup = (map: (k: string) => unknown) => (k: string) => { counter.lookups += 1; return map(k) as never; };
const context = (over: Json = {}) => ({
  relay: ok.context.relay, nonce: ok.context.nonce, nonceUsed: false, estate: ok.context.estate as string | undefined,
  now: new Date(ok.context.now), ...over,
  admittedKey: lookup((over.admittedKey as ((k: string) => unknown) | undefined) ?? ((k: string) => (k === kid ? key : undefined)))
});
/** Per path: signature verifications, key validations, low-S checks and admission-set lookups — each exactly one. */
const calls = (run: () => unknown) => {
  counter.verifies = 0; counter.keyChecks = 0; counter.lowS = 0; counter.lookups = 0;
  run();
  return { verifies: counter.verifies, keyChecks: counter.keyChecks, lowS: counter.lowS, lookups: counter.lookups };
};
const ONE = { verifies: 1, keyChecks: 1, lowS: 1, lookups: 1 };

afterEach(() => { counter.verifies = 0; });

describe("admit does one verification on every path past the frame's own bytes", () => {
  it.each([
    ["the admitted machine, a valid signature", () => admit(ok.frame, context())],
    ["the admitted machine, a junk signature", () => admit({ ...ok.frame, sig: junk }, context())],
    ["an unknown kid", () => admit({ ...ok.frame, kid: "urn:fabric:machine:nobody#sig", sig: junk }, context())],
    ["another estate", () => admit({ ...ok.frame, estate: "urn:fabric:estate:other", sig: junk }, context())],
    ["no record held", () => admit({ ...ok.frame, sig: junk }, context({ estate: undefined, admittedKey: () => undefined }))],
    ["an admitted Ed25519 key", () => admit({ ...ok.frame, sig: junk }, context({ admittedKey: () => ed25519 }))],
    ["an admitted key off the curve", () => admit({ ...ok.frame, sig: junk }, context({ admittedKey: () => ({ ...(key as Json), y: (key as Json).x }) }))],
    ["a signature that is not 64 bytes", () => admit({ ...ok.frame, sig: "AAAA" }, context())],
    ["a high-S copy of the valid signature", () => admit({ ...ok.frame, sig: highS(ok.frame.sig) }, context())],
    ["a kid with a lone surrogate", () => admit({ ...ok.frame, kid: "\ud800#sig" }, context())]
  ] as const)("%s", (_name, run) => {
    expect(calls(run)).toEqual(ONE);
  });
});

describe("verifyBlobRequest does one verification on every path past the header's own bytes", () => {
  const blob = relay.blobRequest as Json;
  const put = (blob.cases as Json[]).find((c) => c.name === "a PUT by an admitted machine to admitted recipients") as Json;
  const admitted = (map: Json) => lookup((k: string) => (Object.hasOwn(map, k) ? vectorKey(map[k]) : undefined));
  const check = (header: string, map: Json) => () => verifyBlobRequest(header, { relay: blob.relay, method: "PUT", digest: blob.digest, now: new Date(blob.now), admittedKey: admitted(map) });
  const forged = (blob.cases as Json[]).find((c) => c.name === "a forged PUT of a blob the relay does not hold") as Json;

  it.each([
    ["the admitted signer", check(put.header, put.admitted)],
    ["a forged signature under an admitted kid", check(forged.header, forged.admitted)],
    ["a kid outside the admission set", check(put.header, {})],
    ["an admitted Ed25519 key", check(put.header, { ...put.admitted, "urn:fabric:machine:a#sig": ed25519 })]
  ] as const)("%s", (_name, run) => {
    // The admitted signer's PUT also looks up its recipient after the proof; before it, one of each.
    const counts = calls(run);
    expect({ ...counts, lookups: Math.min(counts.lookups, 1) }).toEqual(ONE);
  });
});
