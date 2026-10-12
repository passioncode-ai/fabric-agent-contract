import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

// DEC-0066 (CON-019): the key form a Cloudflare Worker's node:crypto (nodejs_compat) accepts. Inside `verify`'s options
// with `dsaEncoding`, a KeyObject throws there; a JWK with `format: "jwk"` works in both runtimes (#59). This mock makes
// Node behave as the Worker does, so reverting #59 at any of the three call sites — verifyEs256, openEnvelope (through
// it) and verifyAssertion — fails here, in the repository that owns the code. The relay's Miniflare test stays the
// end-to-end proof.
const worker = vi.hoisted(() => ({ mode: "worker" as "worker" | "broken" }));
vi.mock("node:crypto", async (importOriginal) => {
  const real = await importOriginal<typeof import("node:crypto")>();
  const verify = ((algorithm: string | null, data: Uint8Array, key: unknown, signature: Uint8Array) => {
    if (worker.mode === "broken") throw new Error("verify is unavailable");
    const options = key as { key?: unknown } | null;
    if (options && typeof options === "object" && options.key instanceof real.KeyObject) {
      throw new TypeError("The \"key\" property must be of type string, Buffer or JWK in a Worker's verify options");
    }
    return real.verify(algorithm, data, key as never, signature);
  }) as typeof real.verify;
  return { ...real, verify, default: { ...real, verify } };
});

const { projectRoot } = await import("../src/contract.js");
const { verifyEs256 } = await import("../src/relay.js");
const { estateChallenge } = await import("../src/estate-record-rules.js");
const { verifyAssertion } = await import("../src/webauthn.js");
const { envelopeVectorResults } = await import("../src/relay-vectors.js");

type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(projectRoot(), relative), "utf8")) as Json;
const relay = read("fixtures/vectors/relay.json");
const envelopes = read("fixtures/vectors/secret-envelope.json");
const estate = read("fixtures/vectors/estate-record.json");
const first = read("fixtures/positive/estate-record-first.json");

afterEach(() => { worker.mode = "worker"; });

describe("the Worker's key form (CON-019)", () => {
  it("verifyEs256 verifies the auth vector with the key as a JWK and as SEC 1 octets", () => {
    expect(verifyEs256(relay.machineKey, relay.auth.signingInput, relay.auth.frame.sig)).toBe(true);
    expect(verifyEs256(new Uint8Array(Buffer.from(relay.machineKeyOctets, "base64")), relay.auth.signingInput, relay.auth.frame.sig)).toBe(true);
  });

  it("openEnvelope opens every positive envelope vector", () => {
    const opened = envelopeVectorResults(envelopes).filter((r) => (r.expected as Json).ok === true);
    expect(opened.length).toBeGreaterThan(0);
    for (const r of opened) expect(r.actual, r.name).toEqual(r.expected);
  });

  it("verifyAssertion verifies an ES256 passkey's assertion", () => {
    const credential = estate.keys.passkeyEs256.authority;
    expect(verifyAssertion(first.signature, credential, estateChallenge(first.digest))).toEqual({ ok: true, flags: 0x1d, signCount: 0 });
  });

  it("verifyAssertion answers bad-signature, never a throw, when verify itself throws", () => {
    worker.mode = "broken";
    const credential = estate.keys.passkeyEs256.authority;
    expect(verifyAssertion(first.signature, credential, estateChallenge(first.digest))).toEqual({ ok: false, problem: "bad-signature" });
  });
});
