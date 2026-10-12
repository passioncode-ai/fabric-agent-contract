import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { ADMIT_REFUSALS, BLOB_REFUSALS, MESSAGE_REFUSALS, RELAY_ORIGIN_PATTERN } from "../src/relay.js";
import { ENVELOPE_REFUSALS } from "../src/secret-envelope.js";
import { envelopeVectorResults, relayVectorResults } from "../src/relay-vectors.js";
import { P256_CURVE } from "../src/p256.js";
import { VECTOR_FILES, buildVectorFiles, signDeterministic } from "../tools/vectors/relay-crypto.js";

// The shared vectors of the relay family (DEC-0066): every refusal is data a port runs through the vendored runner,
// and the committed files are exactly what the generator writes.
type Json = Record<string, any>;
const read = (relative: string) => readFileSync(path.join(projectRoot(), relative), "utf8");
const relay = JSON.parse(read("fixtures/vectors/relay.json")) as Json;
const envelope = JSON.parse(read("fixtures/vectors/secret-envelope.json")) as Json;
const results = [...relayVectorResults(relay), ...envelopeVectorResults(envelope)];

describe("the shared relay vectors", () => {
  it.each(results.map((r) => [`${r.group}: ${r.name}`, r] as const))("%s", (_label, r) => {
    expect(r.actual).toEqual(r.expected);
  });

  it("names every case once within its group", () => {
    const labels = results.map((r) => `${r.group}: ${r.name}`);
    expect(labels.length).toBe(new Set(labels).size);
  });

  it("every refusal is a shared case", () => {
    const outcomes = (group: string) => results.filter((r) => r.group === group).map((r) => r.expected as Json);
    const admitCodes = new Set(outcomes("admit").filter((e) => e.ok === false).map((e) => e.code));
    expect([...admitCodes].sort()).toEqual([...ADMIT_REFUSALS].sort());
    const replays = outcomes("replay").flatMap((steps) => steps as unknown as Json[]);
    const reasons = new Set([...outcomes("messageBody"), ...replays].filter((e) => e.ok === false).map((e) => e.reason));
    expect([...reasons].sort()).toEqual([...MESSAGE_REFUSALS].sort());
    const pairs = new Set(outcomes("blobRequest").filter((e) => e.ok === false).map((e) => `${e.status} ${e.code}`));
    expect([...pairs].sort()).toEqual(BLOB_REFUSALS.map(([status, code]) => `${status} ${code}`).sort());
    const refusals = new Set(outcomes("envelope").filter((e) => e.ok === false).map((e) => e.refusal));
    expect([...refusals].sort()).toEqual([...ENVELOPE_REFUSALS].sort());
  });

  it("has a positive in every group", () => {
    for (const group of ["admit", "messageBody", "blobRequest", "envelope"]) {
      expect(results.some((r) => r.group === group && (r.expected as Json).ok === true), group).toBe(true);
    }
  });
});

describe("hello.relay: the schema and isRelayOrigin agree on every relayOrigin case", () => {
  it("is one pattern: the schema carries RELAY_ORIGIN_PATTERN exactly", () => {
    const schema = JSON.parse(read("schemas/relay-frame.schema.json")) as Json;
    const hello = (schema.oneOf as Json[]).find((variant) => variant.properties.type.const === "hello") as Json;
    expect(hello.properties.relay.pattern).toBe(RELAY_ORIGIN_PATTERN);
  });

  it.each((relay.relayOrigin.cases as Json[]).map((c) => [c.name, c] as const))("%s", async (_name, c) => {
    const validator = await createValidator();
    const hello = { v: 1, type: "hello", id: "h", protocol: "fabric-relay/0.1", relay: c.value, nonce: "A".repeat(43), time: "2026-10-12T00:00:00Z" };
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/relay-frame.schema.json`, hello).valid).toBe(c.expect);
  });
});

// A consumer pinned before DEC-0066 reads the legacy members (the relay's tests/contract.test.ts reads message.frame.to):
// every member path the files had at 252fd25 is still there, cases aside.
describe("the legacy members stay", () => {
  const paths = (value: unknown, prefix = ""): string[] => (value && typeof value === "object" && !Array.isArray(value)
    ? Object.entries(value as Json).flatMap(([key, inner]) => [`${prefix}/${key}`, ...(key === "cases" ? [] : paths(inner, `${prefix}/${key}`))])
    : []);
  it.each([
    ["relay.json", relay, ["/about", "/auth", "/auth/context", "/auth/context/nonce", "/auth/context/now", "/auth/context/relay", "/auth/frame", "/auth/frame/alg", "/auth/frame/estate", "/auth/frame/iat", "/auth/frame/id", "/auth/frame/kid", "/auth/frame/protocol", "/auth/frame/sig", "/auth/frame/type", "/auth/frame/v", "/auth/sha256", "/auth/signingInput", "/blobRequest", "/blobRequest/about", "/blobRequest/cases", "/blobRequest/digest", "/blobRequest/now", "/blobRequest/relay", "/ed25519", "/ed25519/expect", "/ed25519/frame", "/ed25519/frame/alg", "/ed25519/frame/estate", "/ed25519/frame/iat", "/ed25519/frame/id", "/ed25519/frame/kid", "/ed25519/frame/protocol", "/ed25519/frame/sig", "/ed25519/frame/type", "/ed25519/frame/v", "/ed25519/key", "/ed25519/key/crv", "/ed25519/key/kty", "/ed25519/key/x", "/machineKey", "/machineKey/crv", "/machineKey/kty", "/machineKey/x", "/machineKey/y", "/machineKeyOctets", "/message", "/message/body", "/message/frame", "/message/frame/from", "/message/frame/msgId", "/message/frame/to", "/message/frame/ttl", "/message/now"]],
    ["secret-envelope.json", envelope, ["/about", "/digest", "/envelope", "/envelope/ct", "/envelope/header", "/envelope/header/agentRef", "/envelope/header/alg", "/envelope/header/enc", "/envelope/header/exp", "/envelope/header/iat", "/envelope/header/placement", "/envelope/header/recipient", "/envelope/header/sender", "/envelope/header/slot", "/envelope/header/suite", "/envelope/header/type", "/envelope/sig", "/open", "/open/now", "/open/ownKemKid", "/open/placement", "/open/secret", "/recipientKemPrivateKey", "/recipientKey", "/recipientKey/crv", "/recipientKey/kty", "/recipientKey/x", "/recipientKey/y", "/recipientKeyOctets", "/senderKey", "/senderKey/crv", "/senderKey/kty", "/senderKey/x", "/senderKey/y", "/senderKeyOctets"]]
  ] as const)("%s", (_name, file, legacy) => {
    const now = new Set(paths(file));
    expect(legacy.filter((member) => !now.has(member))).toEqual([]);
  });
});

describe("the generator (tools/vectors/relay-crypto.ts)", () => {
  it("writes exactly the committed vector files", () => {
    const built = buildVectorFiles();
    expect(Object.keys(built).sort()).toEqual([...VECTOR_FILES].sort());
    for (const file of VECTOR_FILES) expect(built[file], file).toBe(read(file));
  });

  it("signs with RFC 6979's nonce: its P-256/SHA-256 \"sample\" answer (A.2.5), normalised to low-S", () => {
    const d = BigInt("0xC9AFA9D845BA75166B5C215767B1D6934E50C3DB36E89B127B8A622B120F6721");
    const raw = Buffer.from(signDeterministic(d, "sample"), "base64url");
    expect(raw.subarray(0, 32).toString("hex").toUpperCase()).toBe("EFD48B2AACB6A8FD1140DD9CD45E81D69D2C877B56AAF991C34D0EA84EAF3716");
    // RFC 6979 gives s = F7CB…CDA8, which is above n/2; the low-S form is n − s.
    const s = BigInt("0xF7CB1C942D657C41D436C7A1B6E29F65F3E900DBB9AFF4064DC4AB2F843ACDA8");
    expect(BigInt(`0x${raw.subarray(32).toString("hex")}`)).toBe(P256_CURVE.n - s);
  });
});
