import { createHash, createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import {
  type DeviceCertificateRecord,
  type DeviceRequest,
  type DeviceSigningKey,
  DEVICE_SIGNATURE_LABEL,
  checkDeviceSignature,
  contentDigest,
  createMemoryNonceStore,
  deviceSignatureBase,
  deviceSignatureParams,
  deviceTargetUri,
  httpAlgFor,
  parseDictionary,
  serializeSignatureParams,
  serializeString,
  signDeviceRequest,
  signatureBase,
  strictTime,
  verifyDeviceRequest
} from "../src/http-signature.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0056: the device transport binding — HTTP message signatures (RFC 9421 subset) and Content-Digest (RFC 9530) beside
// mutual TLS, over the shared vectors a receiver or collector port runs too.
type Json = Record<string, any>;
const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/http-signature.json"), "utf8")) as Json;
const certificates = vectors.certificates as DeviceCertificateRecord[];
const bySerial = new Map(certificates.map((record) => [record.serial, record]));
const AT = new Date(vectors.at as string);
const T = AT.getTime() / 1000;
const context = (overrides: Partial<{ at: Date; publicBaseUrl: string; certificate: (serial: string) => DeviceCertificateRecord | undefined; clientCertificateSerial: string }> = {}) => ({
  publicBaseUrl: vectors.publicBaseUrl as string,
  certificate: (serial: string) => bySerial.get(serial),
  at: AT,
  ...overrides
});
const storeWith = (seen: Json[] = []) => {
  const store = createMemoryNonceStore();
  for (const pair of seen) store.recordOnce(pair.serial, pair.nonce, pair.keepUntil, T);
  return store;
};
const rawP256 = (jwk: Json) => Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, "base64url"), Buffer.from(jwk.y, "base64url")]).toString("base64");
const freshKeys = () => {
  const es = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const ed = generateKeyPairSync("ed25519");
  return {
    es: { key: { alg: "es256" as const, privateKey: es.privateKey }, publicKey: rawP256(es.publicKey.export({ format: "jwk" }) as Json) },
    ed: { key: { alg: "ed25519" as const, privateKey: ed.privateKey }, publicKey: ed.publicKey.export({ format: "der", type: "spki" }).subarray(12).toString("base64") }
  };
};
const WINDOW = { notBefore: "2026-10-07T08:30:05Z", notAfter: "2026-10-14T08:30:05Z" };
const NONCE = "Zm9yLXRoZS10ZXN0cy1vbmx5";
const BODY = "{\"protocol\":\"fabric-device/0.1\",\"kind\":\"check-in\"}";

describe("RFC 9421 and RFC 9530's own examples", () => {
  const b26 = vectors.rfc9421 as Json;

  it("serializes B.2.6's signature parameters and builds its signature base byte for byte", () => {
    const params = { components: b26.components as string[], parameters: b26.parameters as Array<[string, number | string]> };
    expect(serializeSignatureParams(params)).toBe(b26.signatureParams);
    expect(signatureBase(params, new Map(Object.entries(b26.values as Record<string, string>)))).toBe(b26.signatureBase);
  });

  it("verifies B.2.6's Ed25519 signature over that base, and parses its Signature-Input and Signature as Dictionaries", () => {
    const input = parseDictionary(b26.signatureInput as string)!;
    const value = parseDictionary(b26.signature as string)!;
    const list = input.members.get("sig-b26") as Json;
    expect(list.items.map((item: Json) => item.value)).toEqual(b26.components);
    expect(list.params).toEqual(b26.parameters);
    const signature = Buffer.from((value.members.get("sig-b26") as Json).value as Uint8Array);
    const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(b26.publicKey as string, "base64")]), format: "der", type: "spki" });
    expect(verify(null, Buffer.from(b26.signatureBase as string, "ascii"), key, signature)).toBe(true);
    expect(verify(null, Buffer.from(`${b26.signatureBase as string} `, "ascii"), key, signature)).toBe(false);
  });

  it("computes RFC 9530 Appendix D's sha-256 Content-Digest", () => {
    expect(contentDigest(vectors.rfc9530.body as string)).toBe(vectors.rfc9530.contentDigest);
    expect(contentDigest(Buffer.from(vectors.rfc9530.body as string))).toBe(vectors.rfc9530.contentDigest);
  });
});

describe("the binding's vectors (DEC-0056)", () => {
  const cases = vectors.cases as Json[];

  it("covers every fault the packet names, each refusal code, and acceptance", () => {
    const expected = new Set(cases.map((c) => c.expect));
    expect([...expected].sort()).toEqual(["accepted", "certificate-expired", "certificate-revoked", "certificate-unknown", "digest-mismatch", "organization-closed", "signature-invalid", "signature-missing", "signature-replayed", "signature-stale"]);
    const faults = new Set(cases.map((c) => c.fault));
    for (const fault of ["none", "body", "target", "created", "nonce", "key", "alg", "signature", "certificate"]) expect(faults).toContain(fault);
    expect(cases.length).toBeGreaterThanOrEqual(54);
    expect(cases.filter((c) => typeof c.clientCertificateSerial === "string").length).toBeGreaterThanOrEqual(6);
  });

  it.each(cases.map((c) => [c.name, c] as const))("%s", async (_name, c) => {
    const verdict = await verifyDeviceRequest(c.request as DeviceRequest, { ...context(c.clientCertificateSerial ? { clientCertificateSerial: c.clientCertificateSerial } : {}), nonces: storeWith(c.seen) });
    expect(verdict.ok ? "accepted" : verdict.code).toBe(c.expect);
    if (c.signatureBase) {
      const digest = c.request.headers["content-digest"] as string;
      const params = parseDictionary(c.request.headers["signature-input"])!.members.get(DEVICE_SIGNATURE_LABEL) as Json;
      const [[, created], [, nonce], [, keyid], [, alg]] = params.params;
      expect(deviceSignatureBase(c.request.method, deviceTargetUri(vectors.publicBaseUrl, c.request.target)!, digest, deviceSignatureParams(created, nonce, keyid, alg))).toBe(c.signatureBase);
    }
  });

  it.each(cases.map((c) => [c.name, c] as const))("FAC-SEM-077 holds a receiver to %s", (_name, c) => {
    const input = { publicBaseUrl: vectors.publicBaseUrl, certificates, at: vectors.at, ...c };
    expect(evaluateSemanticRules("device-request-signature", { ...input, answer: c.expect })).toEqual([]);
    const wrong = c.expect === "accepted" ? "signature-invalid" : "accepted";
    expect(evaluateSemanticRules("device-request-signature", { ...input, answer: wrong }).map((f) => `${f.code} ${f.instancePath}`)).toEqual(["FAC-SEM-077 /answer"]);
  });

  it("names why it refuses a signature as invalid", () => {
    const reason = (name: string) => {
      const c = cases.find((x) => x.name === name)!;
      const verdict = checkDeviceSignature(c.request as DeviceRequest, context());
      return verdict.ok ? "" : verdict.reason.split(":")[0];
    };
    expect(reason("the wrong alg for the key: ed25519 named for an ES256 key")).toBe("wrong-alg");
    expect(reason("a small-order Ed25519 key on record (DEC-0045): a forgery a verifier without the check may accept")).toBe("unusable-key");
    expect(reason("a P-256 key on record off the curve (SEC 1 §3.2.2) verifies nothing")).toBe("unusable-key");
    expect(reason("a signature of 63 octets")).toBe("bad-length");
    expect(reason("a foreign key: signed by a P-256 key that is not the device's")).toBe("bad-signature");
    expect(reason("altered target: signed for /v1/devices/check-in, received at /v1/devices/rotate")).toBe("bad-signature");
  });

  it("carries a small-order forgery whose cofactorless equation holds: R = B, S = 1, k ≡ 0 (mod 4) under the order-4 key", () => {
    const c = cases.find((x) => x.name.startsWith("a small-order Ed25519 key on record"))!;
    const L = (1n << 252n) + 27742317777372353535851937790883648493n;
    const signature = Buffer.from((parseDictionary(c.request.headers.signature)!.members.get(DEVICE_SIGNATURE_LABEL) as Json).value);
    const R = signature.subarray(0, 32), S = signature.subarray(32);
    expect(R.toString("hex")).toBe("5866666666666666666666666666666666666666666666666666666666666666");
    expect(S.toString("hex")).toBe(`01${"00".repeat(31)}`);
    const A = Buffer.from(bySerial.get("2a2b2c2d2e2f3031")!.key.publicKey, "base64");
    const params = (parseDictionary(c.request.headers["signature-input"])!.members.get(DEVICE_SIGNATURE_LABEL) as Json).params;
    const base = deviceSignatureBase("POST", deviceTargetUri(vectors.publicBaseUrl, c.request.target)!, c.request.headers["content-digest"], deviceSignatureParams(params[0][1], params[1][1], params[2][1], params[3][1]))!;
    const h = createHash("sha512").update(Buffer.concat([R, A, Buffer.from(base, "ascii")])).digest();
    expect((BigInt(`0x${Buffer.from(h).reverse().toString("hex")}`) % L) % 4n).toBe(0n);
  });
});

describe("the reference receiver", () => {
  const sign = (key: DeviceSigningKey, serial: string, overrides: Partial<{ created: number; nonce: string; target: string; body: string }> = {}) => {
    const target = overrides.target ?? "/v1/devices/check-in";
    const body = overrides.body ?? BODY;
    const headers = signDeviceRequest({ method: "POST", targetUri: `https://org.example${target}`, body, serial, key, created: overrides.created ?? Math.floor(T), nonce: overrides.nonce ?? NONCE });
    return { method: "POST", target, headers, body } satisfies DeviceRequest;
  };

  it("accepts what the reference signer makes, with either key, and refuses its replay once recorded", async () => {
    const keys = freshKeys();
    const records = new Map<string, DeviceCertificateRecord>([
      ["aa01", { serial: "aa01", ...WINDOW, key: { alg: "es256", publicKey: keys.es.publicKey } }],
      ["aa02", { serial: "aa02", ...WINDOW, key: { alg: "ed25519", publicKey: keys.ed.publicKey } }]
    ]);
    const nonces = createMemoryNonceStore();
    const ctx = { ...context({ certificate: (serial) => records.get(serial) }), nonces };
    for (const [key, serial] of [[keys.es.key, "aa01"], [keys.ed.key, "aa02"]] as const) {
      const request = sign(key, serial);
      expect(await verifyDeviceRequest(request, ctx)).toEqual({ ok: true, binding: "signature", serial, nonce: NONCE, created: Math.floor(T), keepUntil: Math.floor(T) + 300 });
      expect(await verifyDeviceRequest(request, ctx)).toMatchObject({ ok: false, code: "signature-replayed" });
    }
    expect(nonces.size()).toBe(2);
  });

  it("records nothing for a refused request, so a forgery never burns a device's nonce", async () => {
    const keys = freshKeys();
    const record: DeviceCertificateRecord = { serial: "aa01", ...WINDOW, key: { alg: "es256", publicKey: keys.es.publicKey } };
    const nonces = createMemoryNonceStore();
    const ctx = { ...context({ certificate: (serial) => (serial === "aa01" ? record : undefined) }), nonces };
    const forged = sign(freshKeys().es.key, "aa01");
    expect(await verifyDeviceRequest(forged, ctx)).toMatchObject({ ok: false, code: "signature-invalid" });
    expect(nonces.size()).toBe(0);
    expect(await verifyDeviceRequest(sign(keys.es.key, "aa01"), ctx)).toMatchObject({ ok: true });
  });

  it("keeps a pair while now ≤ keepUntil and drops it after", () => {
    const store = createMemoryNonceStore();
    expect(store.recordOnce("aa01", NONCE, 1000, 700)).toBe(true);
    expect(store.recordOnce("aa01", NONCE, 1300, 1000)).toBe(false);
    expect(store.recordOnce("aa01", NONCE, 1301, 1001)).toBe(true);
    expect(store.size()).toBe(1);
  });

  it("answers a context or request of the wrong shape without throwing (context-invalid, signature-missing)", async () => {
    const c = (vectors.cases as Json[])[0]!;
    for (const bad of [null, 7, "x", []]) {
      expect(checkDeviceSignature(c.request as DeviceRequest, bad as unknown as ReturnType<typeof context>)).toMatchObject({ ok: false, code: "context-invalid" });
      expect(await verifyDeviceRequest(c.request as DeviceRequest, bad as never)).toMatchObject({ ok: false, code: "context-invalid" });
      expect(checkDeviceSignature(bad as unknown as DeviceRequest, context())).toMatchObject({ ok: false, code: "signature-missing" });
    }
    expect(checkDeviceSignature(c.request as DeviceRequest, { ...context(), certificate: 7 as never })).toMatchObject({ ok: false, code: "context-invalid" });
    for (const nonces of [null, {}, { recordOnce: 7 }]) {
      expect(await verifyDeviceRequest(c.request as DeviceRequest, { ...context(), nonces: nonces as never })).toMatchObject({ ok: false, code: "context-invalid" });
    }
  });

  it("accepts an unsigned request only on a client certificate it knows, and never stores a nonce for it", async () => {
    const unsigned = (vectors.cases as Json[]).find((x) => x.name.startsWith("missing: no Signature-Input"))!.request as DeviceRequest;
    const nonces = createMemoryNonceStore();
    expect(await verifyDeviceRequest(unsigned, { ...context({ clientCertificateSerial: "7b6578616d706c65" }), nonces })).toEqual({ ok: true, binding: "mutual-tls", serial: "7b6578616d706c65" });
    expect(nonces.size()).toBe(0);
    expect(checkDeviceSignature(unsigned, context({ clientCertificateSerial: "ffff" }))).toMatchObject({ ok: false, code: "certificate-unknown" });
    expect(checkDeviceSignature(unsigned, context({ clientCertificateSerial: "1213141516171819" }))).toMatchObject({ ok: false, code: "certificate-expired" });
    expect(checkDeviceSignature(unsigned, context({ clientCertificateSerial: 7 as unknown as string }))).toMatchObject({ ok: false, code: "signature-missing" });
    // A field that does not parse is absent (RFC 8941 §4.2), so the request is unsigned.
    const garbled = { ...unsigned, headers: { ...unsigned.headers, signature: "fabric-device=(" } };
    expect(checkDeviceSignature(garbled, context({ clientCertificateSerial: "7b6578616d706c65" }))).toMatchObject({ ok: true, binding: "mutual-tls" });
    expect(checkDeviceSignature(garbled, context())).toMatchObject({ ok: false, code: "signature-missing" });
    const signatureOnly = (vectors.cases as Json[])[0]!.request as Json;
    const { "signature-input": _input, ...rest } = signatureOnly.headers;
    expect(checkDeviceSignature({ ...signatureOnly, headers: rest } as DeviceRequest, context({ clientCertificateSerial: "7b6578616d706c65" }))).toMatchObject({ ok: false, code: "signature-missing" });
  });

  it("refuses an unreadable clock before reading anything else", () => {
    const request = { method: "POST", target: "/v1/devices/check-in", headers: {}, body: "" };
    expect(checkDeviceSignature(request, context({ at: new Date(Number.NaN) }))).toMatchObject({ ok: false, code: "clock-unreadable" });
    expect(checkDeviceSignature(request, context({ at: "2026-10-12T09:00:00Z" as unknown as Date }))).toMatchObject({ ok: false, code: "clock-unreadable" });
    expect(checkDeviceSignature(request, context())).toMatchObject({ ok: false, code: "signature-missing" });
  });

  it.each(["http://org.example", "https://org.example/fabric", "https://org.example/?x=1", "https://org.example/#top", "https://user@org.example", "https://user:pw@org.example", "not a url", 7])(
    "refuses the public base URL %s as the receiver's own fault",
    (publicBaseUrl) => {
      const c = (vectors.cases as Json[])[0]!;
      expect(checkDeviceSignature(c.request as DeviceRequest, context({ publicBaseUrl: publicBaseUrl as string }))).toMatchObject({ ok: false, code: "base-url-invalid" });
    }
  );

  it("builds the target URI from the base's scheme and authority, lower-case host, no default port, never from Host", () => {
    expect(deviceTargetUri("https://ORG.example:443", "/v1/x?y=1")).toBe("https://org.example/v1/x?y=1");
    expect(deviceTargetUri("https://org.example:8443/", "/v1/x")).toBe("https://org.example:8443/v1/x");
    expect(deviceTargetUri("https://org.example", "v1/x")).toBeNull();
    expect(deviceTargetUri("https://org.example", "/v1/x#frag")).toBeNull();
    expect(deviceTargetUri("https://org.example", "/v1 /x")).toBeNull();
    expect(deviceTargetUri("https://org.example", "/v1/é")).toBeNull();
  });

  it("refuses a request whose method or target cannot enter a signature base", () => {
    const keys = freshKeys();
    const record: DeviceCertificateRecord = { serial: "aa01", ...WINDOW, key: { alg: "es256", publicKey: keys.es.publicKey } };
    const ctx = context({ certificate: () => record });
    const request = sign(keys.es.key, "aa01");
    expect(checkDeviceSignature({ ...request, method: "PO ST" }, ctx)).toMatchObject({ ok: false, code: "signature-invalid", reason: expect.stringMatching(/^no-base/) });
    expect(checkDeviceSignature({ ...request, target: "v1/devices/check-in" }, ctx)).toMatchObject({ ok: false, code: "signature-invalid", reason: expect.stringMatching(/^no-base/) });
    expect(checkDeviceSignature({ ...request, method: 7 as unknown as string }, ctx)).toMatchObject({ ok: false, reason: expect.stringMatching(/^no-base/) });
    expect(checkDeviceSignature({ ...request, target: 7 as unknown as string }, ctx)).toMatchObject({ ok: false, reason: expect.stringMatching(/^no-base/) });
  });

  it("finds a certificate only by the serial it was asked for, and reads its window strictly", () => {
    const keys = freshKeys();
    const request = sign(keys.es.key, "aa01");
    const record = (fields: Partial<DeviceCertificateRecord>): DeviceCertificateRecord => ({ serial: "aa01", ...WINDOW, key: { alg: "es256", publicKey: keys.es.publicKey }, ...fields });
    const answer = (r: DeviceCertificateRecord) => checkDeviceSignature(request, context({ certificate: () => r }));
    expect(answer(record({}))).toMatchObject({ ok: true });
    expect(answer(record({ serial: "aa02" }))).toMatchObject({ ok: false, code: "certificate-unknown" });
    // A missing offset or a day that does not exist is unreadable, never local time or the next month: two days of margin
    // keep the first case refused in every time zone, so it fails if Date.parse replaces the strict reader.
    expect(answer(record({ notAfter: "2026-10-14T08:30:05" }))).toMatchObject({ ok: false, code: "certificate-expired" });
    expect(answer(record({ notAfter: "2026-10-32T08:30:05Z" }))).toMatchObject({ ok: false, code: "certificate-expired" });
    expect(answer(record({ notBefore: "2026-10-12T09:00:01Z" }))).toMatchObject({ ok: false, code: "certificate-expired" });
    expect(answer(record({ notBefore: "2026-10-12T09:00:00Z" }))).toMatchObject({ ok: true });
    expect(answer(record({ notAfter: "2026-10-12T09:00:01Z" }))).toMatchObject({ ok: true });
    expect(answer(record({ revoked: false }))).toMatchObject({ ok: true });
    for (const revoked of [true, "true", 1, 0, null]) expect(answer(record({ revoked: revoked as boolean })), String(revoked)).toMatchObject({ ok: false, code: "certificate-revoked" });
    // DEC-0103: a closed organization answers before revocation and expiry, with its time; an unreadable time is the receiver's.
    expect(answer(record({ organizationClosedAt: "2026-10-10T00:00:00Z", revoked: true }))).toEqual({ ok: false, code: "organization-closed", status: 410, reason: expect.any(String), closedAt: "2026-10-10T00:00:00Z" });
    expect(answer(record({ organizationClosedAt: "2026-10-10T00:00:00Z", notAfter: "2026-10-08T00:00:00Z" }))).toMatchObject({ ok: false, code: "organization-closed" });
    expect(answer(record({ serial: "aa02", organizationClosedAt: "2026-10-10T00:00:00Z" }))).toMatchObject({ ok: false, code: "certificate-unknown" });
    for (const closedAt of ["2026-10-10", "2026-10-32T00:00:00Z", 7, null]) expect(answer(record({ organizationClosedAt: closedAt as string })), String(closedAt)).toMatchObject({ ok: false, code: "context-invalid" });
    expect(answer(7 as unknown as DeviceCertificateRecord)).toMatchObject({ ok: false, code: "certificate-unknown" });
    expect(answer({ ...record({}), key: null as unknown as DeviceCertificateRecord["key"] })).toMatchObject({ ok: false, reason: expect.stringMatching(/^wrong-alg/) });
    expect(answer(record({ key: { alg: "es256", publicKey: 7 as unknown as string } }))).toMatchObject({ ok: false, reason: expect.stringMatching(/^unusable-key/) });
  });

  it("reads header names in any case and joins repeated lines, as RFC 9421 §2.1 says", () => {
    const keys = freshKeys();
    const record: DeviceCertificateRecord = { serial: "aa01", ...WINDOW, key: { alg: "es256", publicKey: keys.es.publicKey } };
    const request = sign(keys.es.key, "aa01");
    const upper = { ...request, headers: { "Content-Digest": request.headers["content-digest"], "SIGNATURE-INPUT": ` ${request.headers["signature-input"]}\t`, Signature: [request.headers.signature], ignored: undefined, alsoIgnored: [7] as unknown as string[] } };
    expect(checkDeviceSignature(upper, context({ certificate: () => record }))).toMatchObject({ ok: true });
    const split = { ...request, headers: { ...request.headers, "signature-input": ["proxy=(\"@method\");keyid=\"edge\"", request.headers["signature-input"]], Signature: "proxy=:AAAA:", signature: request.headers.signature } };
    expect(checkDeviceSignature(split, context({ certificate: () => record }))).toMatchObject({ ok: true });
    expect(checkDeviceSignature({ ...request, headers: null as unknown as DeviceRequest["headers"] }, context())).toMatchObject({ code: "signature-missing" });
    expect(checkDeviceSignature({ ...request, headers: ["x"] as unknown as DeviceRequest["headers"] }, context())).toMatchObject({ code: "signature-missing" });
    expect(checkDeviceSignature({ ...request, body: 7 as unknown as string }, context({ certificate: () => record }))).toMatchObject({ code: "digest-mismatch" });
  });

  it("refuses a Signature member that is not a bare Byte Sequence, and a non-integer created", () => {
    const keys = freshKeys();
    const request = sign(keys.es.key, "aa01");
    const value = request.headers.signature.slice(DEVICE_SIGNATURE_LABEL.length + 1);
    const variants = [
      { signature: `${DEVICE_SIGNATURE_LABEL}=${value};x=1` },
      { signature: `${DEVICE_SIGNATURE_LABEL}=("a")` },
      { signature: `${DEVICE_SIGNATURE_LABEL}="text"` },
      { signature: DEVICE_SIGNATURE_LABEL },
      { "signature-input": `${DEVICE_SIGNATURE_LABEL}=:AAAA:` },
      { "signature-input": request.headers["signature-input"].replace(/created=\d+/, "created=1791795600.5") },
      { "signature-input": request.headers["signature-input"].replace(/nonce="[^"]+"/, "nonce=tok") },
      { "signature-input": request.headers["signature-input"].replace(/keyid="[^"]+"/, "keyid=7") },
      { "signature-input": request.headers["signature-input"].replace("\"@method\"", "\"@method\";req") },
      { "signature-input": request.headers["signature-input"].replace("\"@method\"", "@method") }
    ];
    for (const headers of variants) expect(checkDeviceSignature({ ...request, headers: { ...request.headers, ...headers } }, context()), JSON.stringify(headers)).toMatchObject({ code: "signature-missing" });
  });

  it("maps a device key to the algorithm it signs requests with, and signs with no other", () => {
    expect(httpAlgFor("es256")).toBe("ecdsa-p256-sha256");
    expect(httpAlgFor("ed25519")).toBe("ed25519");
    expect(httpAlgFor("ecdh-p256")).toBeUndefined();
    expect(httpAlgFor("constructor")).toBeUndefined();
    expect(httpAlgFor(undefined)).toBeUndefined();
    const { privateKey } = generateKeyPairSync("ed25519");
    expect(() => signDeviceRequest({ method: "POST", targetUri: "https://org.example/x", body: "", serial: "aa01", key: { alg: "ecdh-p256" as "es256", privateKey }, created: 1, nonce: NONCE })).toThrow(/signs no request/);
    expect(() => signDeviceRequest({ method: "POST", targetUri: "https://org.example/x\n", body: "", serial: "aa01", key: { alg: "ed25519", privateKey }, created: 1, nonce: NONCE })).toThrow(/signature base/);
    const ok = { method: "POST", targetUri: "https://org.example/x", body: "", serial: "aa01", key: { alg: "ed25519" as const, privateKey }, created: 1, nonce: NONCE };
    expect(() => signDeviceRequest({ ...ok, nonce: "short" })).toThrow(/nonce/);
    expect(() => signDeviceRequest({ ...ok, nonce: 7 as unknown as string })).toThrow(/nonce/);
    expect(() => signDeviceRequest({ ...ok, serial: "AA01" })).toThrow(/serial/);
    expect(() => signDeviceRequest({ ...ok, serial: 7 as unknown as string })).toThrow(/serial/);
    expect(() => signDeviceRequest({ ...ok, created: 1.5 })).toThrow(/created/);
    expect(() => signDeviceRequest({ ...ok, created: Number.NaN })).toThrow(/created/);
    expect(() => signDeviceRequest(ok)).not.toThrow();
  });
});

describe("workerd compatibility (Cloudflare Workers)", () => {
  it("passes every P-256 key beside dsaEncoding as a JWK, never as a KeyObject", () => {
    for (const file of ["src/http-signature.ts", "src/device-rules.ts"]) {
      const lines = readFileSync(path.join(projectRoot(), file), "utf8").split("\n").filter((line) => line.includes("dsaEncoding") && !line.trim().startsWith("*") && !line.trim().startsWith("//"));
      expect(lines.length, file).toBeGreaterThan(0);
      for (const line of lines) expect(line, file).toMatch(/format: "jwk", dsaEncoding/);
    }
  });
});

describe("RFC 9421 §2.3 and §2.5 refusals", () => {
  const values = new Map([["@method", "POST"], ["a", "1"]]);

  it("refuses a component listed twice, @signature-params as a component, a missing value and a newline", () => {
    expect(signatureBase({ components: ["@method", "@method"], parameters: [] }, values)).toBeNull();
    expect(signatureBase({ components: ["@signature-params"], parameters: [] }, new Map([["@signature-params", "x"]]))).toBeNull();
    expect(signatureBase({ components: ["b"], parameters: [] }, values)).toBeNull();
    expect(signatureBase({ components: ["a"], parameters: [] }, new Map([["a", "1\n2"]]))).toBeNull();
    expect(signatureBase({ components: ["a"], parameters: [] }, new Map([["a", "1\r2"]]))).toBeNull();
    expect(signatureBase({ components: ["a"], parameters: [] }, new Map([["a", "é"]]))).toBeNull();
    expect(signatureBase({ components: ["é"], parameters: [] }, new Map([["é", "1"]]))).toBeNull();
    expect(signatureBase({ components: [], parameters: [["nonce", "x"]] }, values)).toBe("\"@signature-params\": ();nonce=\"x\"");
  });

  it("serializes Integers, Strings with escapes and Booleans, and refuses what has no serialization", () => {
    expect(serializeSignatureParams({ components: ["a"], parameters: [["created", -1], ["tag", "q\"\\"], ["flag", true], ["off", false]] })).toBe("(\"a\");created=-1;tag=\"q\\\"\\\\\";flag;off=?0");
    expect(serializeSignatureParams({ components: [], parameters: [["Created", 1]] })).toBeNull();
    expect(serializeSignatureParams({ components: [], parameters: [["created", 1.5]] })).toBeNull();
    expect(serializeSignatureParams({ components: [], parameters: [["created", 1e16]] })).toBeNull();
    expect(serializeSignatureParams({ components: [], parameters: [["tag", "é"]] })).toBeNull();
    expect(serializeString("\u007f")).toBeNull();
  });
});

describe("RFC 8941 Dictionary parsing (§4.2)", () => {
  const ok = (field: string) => parseDictionary(field);

  it("parses Items of every type and Inner Lists, with parameters", () => {
    const d = ok("a=1, b=-2.5, c=\"x\\\"y\", d=tok/en:1, e=:AAE=:, f=?0, g, h=(1 \"s\");p;q=?1, i=()")!;
    expect([...d.members.keys()]).toEqual(["a", "b", "c", "d", "e", "f", "g", "h", "i"]);
    expect((d.members.get("a") as Json).value).toBe(1);
    expect((d.members.get("b") as Json).value).toBe(-2.5);
    expect((d.members.get("c") as Json).value).toBe("x\"y");
    expect((d.members.get("d") as Json).value).toEqual({ token: "tok/en:1" });
    expect(Buffer.from((d.members.get("e") as Json).value).toString("hex")).toBe("0001");
    expect((d.members.get("f") as Json).value).toBe(false);
    expect(d.members.get("g")).toEqual({ value: true, params: [] });
    expect(d.members.get("h")).toEqual({ items: [{ value: 1, params: [] }, { value: "s", params: [] }], params: [["p", true], ["q", true]] });
    expect(d.members.get("i")).toEqual({ items: [], params: [] });
    expect(ok("")!.members.size).toBe(0);
    expect(ok("  a=1\t,\tb=2")!.members.size).toBe(2);
  });

  it("keeps the last of a repeated key and names it as repeated", () => {
    const d = ok("a=1, b=2, a=3")!;
    expect([...d.members.entries()].map(([k, v]) => [k, (v as Json).value])).toEqual([["b", 2], ["a", 3]]);
    expect([...d.duplicates]).toEqual(["a"]);
  });

  it("keeps the last value of a repeated parameter in its first position, and marks the member (RFC 8941 §4.2.3.2)", () => {
    const d = ok("a=(\"x\";p=1;p=2);q=1;r;q=3, b=1;s=1;s=2")!;
    expect(d.members.get("a")).toEqual({ items: [{ value: "x", params: [["p", 2]], repeated: true }], params: [["q", 3], ["r", true]], repeated: true });
    expect(d.members.get("b")).toEqual({ value: 1, params: [["s", 2]], repeated: true });
  });

  it("parses RFC 9651's Date and Display String", () => {
    const d = ok("a=@1659578233, b=@-1, c=%\"caf%c3%a9 \\\", e=%\"\"")!;
    expect((d.members.get("a") as Json).value).toEqual({ date: 1659578233 });
    expect((d.members.get("b") as Json).value).toEqual({ date: -1 });
    expect((d.members.get("c") as Json).value).toEqual({ display: "café \\" });
    expect((d.members.get("e") as Json).value).toEqual({ display: "" });
  });

  it.each(["a=@1.5", "a=@", "a=%x", "a=%\"%C3%A9\"", "a=%\"%c3\"", "a=%\"%g0\"", "a=%\"%c", "a=%\"abc", "a=%\"\t\""])("fails the RFC 9651 item %j", (field) => {
    expect(parseDictionary(field)).toBeNull();
  });

  it("accepts a Byte Sequence without padding (RFC 8941 §4.2.7)", () => {
    expect(Buffer.from((ok("a=:AAE:")!.members.get("a") as Json).value).toString("hex")).toBe("0001");
  });

  it.each([
    "a=1,", "a=1 b=2", "A=1", "1a=1", "a=", "a=\"x", "a=\"x\\n\"", "a=\"\u0001\"", "a=\"x\\", "a=:AA", "a=:A-B=:", "a=:A=AA:", "a=:A:",
    "a=?2", "a=?", "a=1234567890123456", "a=1234567890123.1", "a=1.", "a=1.2345", "a=12345678901234.12", "a=-", "a=-x", "a=(1", "a=(1,2)",
    "a=%", "a=é", "a=1, ", "a=1;", "a=123456789012.1234", "a=\"\t\""
  ])("fails %j", (field) => {
    expect(parseDictionary(field)).toBeNull();
  });
});

describe("strictTime", () => {
  it.each([["2026-10-12T09:00:00Z", Date.UTC(2026, 9, 12, 9)], ["2026-10-12T11:00:00+02:00", Date.UTC(2026, 9, 12, 9)], ["2026-10-12t09:00:00.5z", Date.UTC(2026, 9, 12, 9) + 500]])("reads %s", (value, ms) => {
    expect(strictTime(value)).toBe(ms);
  });

  it.each(["2026-10-12 09:00:00Z", "2026-10-12T09:00:00", "2026-02-30T00:00:00Z", "2026-10-12T24:00:00Z", "2026-10-12T09:60:00Z", "2026-10-12T09:00:60Z", 7, null])("refuses %s", (value) => {
    expect(strictTime(value)).toBeNaN();
  });
});
