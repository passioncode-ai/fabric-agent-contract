import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import {
  MAX_BLOB_RECIPIENTS, MAX_KID_CHARS, MAX_RELAY_REQUEST_BYTES, RELAY_ERROR_CODES, RELAY_REQUEST_HEADER, parseRelayRequest,
  relayRequestHeader, verifyBlobRequest
} from "../src/relay.js";

// DEC-0047 item 8, annotated 2026-10-12: the Fabric-Relay-Request wire form, and the relay's check of a blob request,
// over the shared vectors a port runs (fixtures/vectors/relay.json `blobRequest`).
type Case = { name: string; method: "PUT" | "GET"; header: string; admitted: Record<string, unknown>; stored?: { recipients: string[] }; expect: unknown };
const v = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures", "vectors", "relay.json"), "utf8")).blobRequest as {
  relay: string; digest: string; now: string; cases: Case[];
};
const check = (c: Case) => verifyBlobRequest(c.header, {
  relay: v.relay, method: c.method, digest: v.digest, now: new Date(v.now), admittedKey: (kid) => c.admitted[kid] as never,
  ...(c.stored ? { stored: c.stored } : {})
});

describe("Fabric-Relay-Request", () => {
  it.each(v.cases)("$name", (c) => {
    expect(check(c)).toEqual(c.expect);
  });

  it("names every refusal the annotation lists, each with its status", () => {
    const seen = new Map(v.cases.flatMap((c) => ("status" in (c.expect as object) ? [[(c.expect as { code: string }).code, (c.expect as { status: number }).status]] : [])));
    expect(Object.fromEntries(seen)).toEqual({
      "recipients-mismatch": 409, "not-admitted": 403, "unknown-recipient": 403, "unsupported-alg": 401, unauthenticated: 401,
      "not-yet-valid": 401, malformed: 400, "too-large": 431
    });
    for (const code of seen.keys()) expect(RELAY_ERROR_CODES).toContain(code);
  });

  it("states its limits and the header's name", () => {
    expect([RELAY_REQUEST_HEADER, MAX_RELAY_REQUEST_BYTES, MAX_BLOB_RECIPIENTS, MAX_KID_CHARS]).toEqual(["Fabric-Relay-Request", 8192, 64, 256]);
  });

  it("round-trips a header through its parser, and accepts exactly 64 recipients and a 256-character kid", () => {
    const kid = `${"k".repeat(MAX_KID_CHARS - 4)}#sig`;
    const request = { alg: "ES256", kid, recipients: Array.from({ length: 64 }, (_, i) => `urn:m${i}#sig`), iat: "2026-10-12T12:00:00Z", sig: "AA" };
    expect(parseRelayRequest(relayRequestHeader(request))).toEqual({ ok: true, request });
    const long = { ...request, kid: `k${kid}` };
    const verdict = verifyBlobRequest(relayRequestHeader(long), { relay: v.relay, method: "PUT", digest: v.digest, now: new Date("2026-10-12T12:00:10Z"), admittedKey: () => undefined });
    expect(verdict).toEqual({ ok: false, status: 400, code: "malformed" });
  });

  it("refuses non-JSON, a non-object and a header with a character outside base64url", () => {
    for (const header of [Buffer.from("not json").toString("base64url"), Buffer.from("[1]").toString("base64url"), "a+b/c", null]) {
      expect(parseRelayRequest(header)).toEqual({ ok: false, status: 400, code: "malformed" });
    }
    const wrongTypes = Buffer.from('{"alg":"ES256","iat":"x","kid":1,"recipients":[],"sig":"s"}').toString("base64url");
    expect(parseRelayRequest(wrongTypes)).toEqual({ ok: false, status: 400, code: "malformed" });
  });

  it("answers an admitted key off the curve as bad-key", () => {
    const put = v.cases[0]!;
    const offCurve = Object.values(put.admitted)[0] as Record<string, string>;
    const verdict = verifyBlobRequest(put.header, { relay: v.relay, method: "PUT", digest: v.digest, now: new Date(v.now),
      admittedKey: (kid) => (put.admitted[kid] ? { ...(put.admitted[kid] as object), y: offCurve.x } : undefined) as never });
    expect(verdict).toEqual({ ok: false, status: 403, code: "bad-key" });
  });
});
