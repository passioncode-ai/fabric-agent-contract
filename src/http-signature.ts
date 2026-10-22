// #region http-signature — docs: docs/specification/devices.md#transport
import { type KeyObject, createHash, createPublicKey, sign, verify } from "node:crypto";
import { isSmallOrderKey } from "./ed25519.js";
import { isValidP256Key, p256Jwk } from "./p256.js";

/**
 * The device transport binding (DEC-0056): HTTP message signatures, a subset of RFC 9421, beside mutual TLS for
 * `fabric-device/0.1` and `fabric-activity/0.1`. A host that terminates TLS never sees a client certificate, so a
 * device proves its key by signing every batch, check-in, rotation and share-registration request (DEC-0086): label `fabric-device`, covered
 * components `@method`, `@target-uri` and `content-digest` (RFC 9530, SHA-256 of the body), parameters
 * `created;nonce;keyid;alg` in that order, `keyid` the certificate serial, `alg` the device's `#sig` key's.
 *
 * The receiver rebuilds the target URI from its public base URL, never from a `Host` header a proxy may rewrite,
 * refuses a `created` more than 300 seconds from its clock, verifies under the device key on record, and only then
 * records the (serial, nonce) pair until `created + 300`; a repeat is `signature-replayed`. Header values are parsed
 * as RFC 8941 Structured Fields; the signature base is RFC 9421 §2.5's, its last line §2.3's signature parameters.
 */

/** The binding's signature label (RFC 9421 §4.1): the member of `Signature-Input` and `Signature` a receiver reads. */
export const DEVICE_SIGNATURE_LABEL = "fabric-device";
/** The covered components, in their one order (RFC 9421 §2.3 step 2). */
export const DEVICE_COVERED_COMPONENTS = ["@method", "@target-uri", "content-digest"] as const;
/** The signature parameters, in their one order (RFC 9421 §2.3 step 4). */
export const DEVICE_SIGNATURE_PARAMETERS = ["created", "nonce", "keyid", "alg"] as const;
/** How far `created` may be from the receiver's clock, either way, in seconds. */
export const MAX_SIGNATURE_SKEW_SECONDS = 300;
/** A nonce: 22–64 base64url characters (22 carry 128 bits), fresh per request. */
export const NONCE_PATTERN = /^[A-Za-z0-9_-]{22,64}$/;
/** A certificate serial (`device-common#/$defs/serial`): the `keyid`. */
export const SERIAL_PATTERN = /^[0-9a-f]{2,40}$/;

/** A device key's algorithm (DEC-0053) and the RFC 9421 §3.3 algorithm it signs requests with. */
export type DeviceKeyAlg = "es256" | "ed25519";
export type HttpSignatureAlg = "ecdsa-p256-sha256" | "ed25519";
const HTTP_ALG = new Map<string, HttpSignatureAlg>([["es256", "ecdsa-p256-sha256"], ["ed25519", "ed25519"]]);
/** The RFC 9421 `alg` a device key signs with, or undefined for a key that signs no request. */
export const httpAlgFor = (alg: unknown): HttpSignatureAlg | undefined => (typeof alg === "string" ? HTTP_ALG.get(alg) : undefined);

/** A refusal the receiver answers with 401 and this code; `organization-closed` (DEC-0103) with 410 and `closedAt`. */
export type SignatureRefusal =
  | "organization-closed"
  | "signature-missing"
  | "digest-mismatch"
  | "signature-stale"
  | "certificate-unknown"
  | "certificate-revoked"
  | "certificate-expired"
  | "signature-invalid"
  | "signature-replayed";
/** What a misconfigured receiver answers instead: it accepts nothing, and the fault is its own, not the device's. */
export type ReceiverFault = "clock-unreadable" | "base-url-invalid" | "context-invalid";

// ---------------------------------------------------------------------------------------------------------------
// RFC 8941 Structured Fields: the subset RFC 9421 needs — a Dictionary whose members are Items or Inner Lists — and
// RFC 9651's Date and Display String, so a member another party sends in the newer revision does not hide ours.

export type BareItem = number | string | boolean | Uint8Array | { token: string } | { date: number } | { display: string };
/** `repeated` is set when a parameter key occurred twice: RFC 8941 keeps the last value; the binding refuses it on its own member. */
export interface SfItem { value: BareItem; params: Array<[string, BareItem]>; repeated?: true }
export interface SfInnerList { items: SfItem[]; params: Array<[string, BareItem]>; repeated?: true }
export type SfMember = SfItem | SfInnerList;
/** A parsed Dictionary, members in order; `duplicates` names keys that occurred more than once (RFC 8941 keeps the last). */
export interface SfDictionary { members: Map<string, SfMember>; duplicates: Set<string> }

class Parser {
  i = 0;
  constructor(readonly s: string) {}
  get rest() { return this.s.length - this.i; }
  peek() { return this.s[this.i] ?? ""; }
  fail(): never { throw new SyntaxError(`structured field: unexpected ${JSON.stringify(this.peek())} at ${this.i}`); }
  skip(chars: string) { while (this.rest && chars.includes(this.peek())) this.i += 1; }

  key(): string {
    if (!/[a-z*]/.test(this.peek())) this.fail();
    const start = this.i;
    while (this.rest && /[a-z0-9_\-.*]/.test(this.peek())) this.i += 1;
    return this.s.slice(start, this.i);
  }

  bareItem(): BareItem {
    const c = this.peek();
    if (c === "-" || /[0-9]/.test(c)) return this.number();
    if (c === "\"") return this.string();
    if (/[A-Za-z*]/.test(c)) return this.token();
    if (c === ":") return this.bytes();
    if (c === "?") return this.boolean();
    if (c === "@") return this.date();
    if (c === "%") return this.display();
    return this.fail();
  }

  /** RFC 9651 §4.2.9: `@` and an Integer. */
  date(): { date: number } {
    this.i += 1;
    const start = this.i;
    const value = this.number();
    if (this.s.slice(start, this.i).includes(".")) this.fail();
    return { date: value };
  }

  /** RFC 9651 §4.2.10: `%"`, printable ASCII with `%xx` lower-case hex escapes, decoded as UTF-8. */
  display(): { display: string } {
    if (this.s[this.i + 1] !== "\"") this.fail();
    this.i += 2;
    const bytes: number[] = [];
    while (this.rest) {
      const c = this.s[this.i++]!;
      if (c < " " || c > "~") { this.i -= 1; this.fail(); }
      if (c === "%") {
        const hex = this.s.slice(this.i, this.i + 2);
        if (!/^[0-9a-f]{2}$/.test(hex)) this.fail();
        bytes.push(Number.parseInt(hex, 16));
        this.i += 2;
      } else if (c === "\"") {
        try { return { display: new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes)) }; } catch { return this.fail(); }
      } else bytes.push(c.charCodeAt(0));
    }
    return this.fail();
  }

  number(): number {
    let sign = 1;
    if (this.peek() === "-") { sign = -1; this.i += 1; }
    if (!/[0-9]/.test(this.peek())) this.fail();
    const start = this.i;
    let decimal = false;
    while (this.rest) {
      const c = this.peek();
      if (/[0-9]/.test(c)) this.i += 1;
      else if (c === "." && !decimal) { if (this.i - start > 12) this.fail(); decimal = true; this.i += 1; }
      else break;
      if (!decimal && this.i - start > 15) this.fail();
      if (decimal && this.i - start > 16) this.fail();
    }
    const text = this.s.slice(start, this.i);
    if (decimal && (text.endsWith(".") || text.split(".")[1]!.length > 3)) this.fail();
    return sign * Number(text);
  }

  string(): string {
    this.i += 1;
    let out = "";
    while (this.rest) {
      const c = this.s[this.i++]!;
      if (c === "\\") {
        const next = this.s[this.i++];
        if (next !== "\"" && next !== "\\") { this.i -= 1; this.fail(); }
        out += next;
      } else if (c === "\"") return out;
      else if (c < " " || c > "~") { this.i -= 1; this.fail(); }
      else out += c;
    }
    return this.fail();
  }

  token(): { token: string } {
    const start = this.i;
    this.i += 1;
    while (this.rest && /[!#$%&'*+\-.^_`|~0-9A-Za-z:/]/.test(this.peek())) this.i += 1;
    return { token: this.s.slice(start, this.i) };
  }

  bytes(): Uint8Array {
    this.i += 1;
    const end = this.s.indexOf(":", this.i);
    if (end < 0) this.fail();
    const content = this.s.slice(this.i, end);
    // RFC 8941 §4.2.7: the base64 alphabet only; missing padding is synthesized, a padding character inside is refused.
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(content) || content.replace(/=+$/, "").length % 4 === 1) this.fail();
    this.i = end + 1;
    return new Uint8Array(Buffer.from(content, "base64"));
  }

  boolean(): boolean {
    this.i += 1;
    const c = this.peek();
    if (c !== "0" && c !== "1") this.fail();
    this.i += 1;
    return c === "1";
  }

  /** RFC 8941 §4.2.3.2: a repeated key overwrites the value in its first position, and is reported as `repeated`. */
  params(): { params: Array<[string, BareItem]>; repeated?: true } {
    const params: Array<[string, BareItem]> = [];
    let repeated = false;
    while (this.peek() === ";") {
      this.i += 1;
      this.skip(" ");
      const key = this.key();
      let value: BareItem = true;
      if (this.peek() === "=") { this.i += 1; value = this.bareItem(); }
      const at = params.findIndex(([k]) => k === key);
      if (at >= 0) { params[at] = [key, value]; repeated = true; } else params.push([key, value]);
    }
    return repeated ? { params, repeated: true } : { params };
  }

  item(): SfItem { const value = this.bareItem(); return { value, ...this.params() }; }

  member(): SfMember {
    if (this.peek() !== "(") return this.item();
    this.i += 1;
    const items: SfItem[] = [];
    while (this.rest) {
      this.skip(" ");
      if (this.peek() === ")") { this.i += 1; return { items, ...this.params() }; }
      items.push(this.item());
      if (this.peek() !== " " && this.peek() !== ")") this.fail();
    }
    return this.fail();
  }
}

/** RFC 8941 §4.2 with field type "dictionary", or null when the field does not parse (then it is treated as absent). */
export function parseDictionary(field: string): SfDictionary | null {
  if (!/^[\x20-\x7e\t]*$/.test(field)) return null;
  const p = new Parser(field);
  const members = new Map<string, SfMember>();
  const duplicates = new Set<string>();
  try {
    p.skip(" ");
    while (p.rest) {
      const key = p.key();
      let member: SfMember;
      if (p.peek() === "=") { p.i += 1; member = p.member(); } else member = { value: true, ...p.params() };
      if (members.has(key)) { duplicates.add(key); members.delete(key); }
      members.set(key, member);
      p.skip(" \t");
      if (!p.rest) break;
      if (p.peek() !== ",") p.fail();
      p.i += 1;
      p.skip(" \t");
      if (!p.rest) p.fail();
    }
    return { members, duplicates };
  } catch {
    return null;
  }
}

/** RFC 8941 §4.1.6: a String, or null when it holds a character outside printable ASCII. */
export function serializeString(value: string): string | null {
  if (!/^[\x20-\x7e]*$/.test(value)) return null;
  return `"${value.replace(/[\\"]/g, (c) => `\\${c}`)}"`;
}

/** RFC 8941 §4.1.4 and §4.1.6 for a parameter's value; `true` is written as the bare key and `false` as `?0` (§4.1.1.2). */
const serializeParameterValue = (value: number | string | false): string | null => {
  if (typeof value === "number") return Number.isInteger(value) && Math.abs(value) <= 999_999_999_999_999 ? String(value) : null;
  if (typeof value === "string") return serializeString(value);
  return "?0";
};

// ---------------------------------------------------------------------------------------------------------------
// RFC 9421: the signature parameters (§2.3) and the signature base (§2.5).

export interface SignatureParams {
  /** Covered component identifiers, in order; names only (this binding uses no component parameters). */
  components: readonly string[];
  /** Signature parameters, in order: Integer, String or Boolean values. */
  parameters: ReadonlyArray<readonly [string, number | string | boolean]>;
}

/** RFC 9421 §2.3: the `@signature-params` value — the covered components as an Inner List of Strings, then the parameters. */
export function serializeSignatureParams(params: SignatureParams): string | null {
  const names = params.components.map(serializeString);
  if (names.some((name) => name === null)) return null;
  let out = `(${names.join(" ")})`;
  for (const [key, value] of params.parameters) {
    if (!/^[a-z*][a-z0-9_\-.*]*$/.test(key)) return null;
    if (value === true) { out += `;${key}`; continue; }
    const serialized = serializeParameterValue(value);
    if (serialized === null) return null;
    out += `;${key}=${serialized}`;
  }
  return out;
}

/**
 * RFC 9421 §2.5: the signature base — one line `"<name>": <value>` per covered component, in order, each followed by
 * LF, then `"@signature-params": <value>` with no LF after it. Null on any error the section names: a component listed
 * twice, `@signature-params` among the covered ones, a value missing or with a newline, a non-ASCII output.
 */
export function signatureBase(params: SignatureParams, values: ReadonlyMap<string, string>): string | null {
  const signatureParams = serializeSignatureParams(params);
  if (signatureParams === null) return null;
  const seen = new Set<string>();
  let out = "";
  for (const name of params.components) {
    if (seen.has(name) || name === "@signature-params") return null;
    seen.add(name);
    const value = values.get(name);
    if (value === undefined || /[\r\n]/.test(value)) return null;
    out += `${serializeString(name)}: ${value}\n`;
  }
  out += `"@signature-params": ${signatureParams}`;
  return /^[\x00-\x7f]*$/.test(out) ? out : null;
}

// ---------------------------------------------------------------------------------------------------------------
// The binding.

/** RFC 9530 §2: the `Content-Digest` a device sends — exactly one member, `sha-256`, over the body's bytes. */
export function contentDigest(body: Uint8Array | string): string {
  return `sha-256=:${createHash("sha256").update(body).digest("base64")}:`;
}

/**
 * The `@target-uri` (RFC 9421 §2.2.2): the receiver's public base URL — `https://` and its authority, host in lower
 * case, no default port, no path, query or user — followed by the request target as received (origin-form: the path
 * and query). Null when the base is not such a URL or the target is not origin-form. Never built from `Host`.
 */
export function deviceTargetUri(publicBaseUrl: string, target: string): string | null {
  const origin = publicOrigin(publicBaseUrl);
  if (origin === null || !/^\/[\x21-\x7e]*$/.test(target) || target.includes("#")) return null;
  return `${origin}${target}`;
}

const publicOrigin = (base: unknown): string | null => {
  if (typeof base !== "string") return null;
  let url: URL;
  try { url = new URL(base); } catch { return null; }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
  return `https://${url.host}`;
};

/** The `@signature-params` of a device request. */
export function deviceSignatureParams(created: number, nonce: string, keyid: string, alg: HttpSignatureAlg): SignatureParams {
  return { components: DEVICE_COVERED_COMPONENTS, parameters: [["created", created], ["nonce", nonce], ["keyid", keyid], ["alg", alg]] };
}

/** The signature base of a device request. */
export function deviceSignatureBase(method: string, targetUri: string, digest: string, params: SignatureParams): string | null {
  return signatureBase(params, new Map([["@method", method], ["@target-uri", targetUri], ["content-digest", digest]]));
}

export interface DeviceSigningKey { alg: DeviceKeyAlg; privateKey: KeyObject }

/**
 * What a device adds to a request (a collector's reference): `Content-Digest`, `Signature-Input` and `Signature`. ES256
 * signs as RFC 9421 §3.3.4 says — SHA-256, then r ‖ s, 32 octets each; Ed25519 as §3.3.6, over the base itself.
 */
export function signDeviceRequest(input: { method: string; targetUri: string; body: Uint8Array | string; serial: string; key: DeviceSigningKey; created: number; nonce: string }): Record<"content-digest" | "signature-input" | "signature", string> {
  const alg = httpAlgFor(input.key.alg);
  if (!alg) throw new TypeError(`a ${String(input.key.alg)} key signs no request`);
  // What a receiver refuses as signature-missing is never signed: a signer error is the device's to see, not a 401.
  if (typeof input.nonce !== "string" || !NONCE_PATTERN.test(input.nonce)) throw new TypeError("the nonce is 22–64 base64url characters, fresh for each request");
  if (typeof input.serial !== "string" || !SERIAL_PATTERN.test(input.serial)) throw new TypeError("keyid is the certificate's serial: 2–40 lower-case hex digits");
  if (!Number.isSafeInteger(input.created)) throw new TypeError("created is Unix time in whole seconds");
  const digest = contentDigest(input.body);
  const params = deviceSignatureParams(input.created, input.nonce, input.serial, alg);
  const base = deviceSignatureBase(input.method, input.targetUri, digest, params);
  if (base === null) throw new TypeError("the signature base cannot be built from these values (RFC 9421 §2.5)");
  const bytes = Buffer.from(base, "ascii");
  // A P-256 key is passed as a JWK beside dsaEncoding, the form workerd accepts as well as Node (`p256Jwk`, DEC-0047).
  const signature = alg === "ed25519"
    ? sign(null, bytes, input.key.privateKey)
    : sign("sha256", bytes, { key: input.key.privateKey.export({ format: "jwk" }), format: "jwk", dsaEncoding: "ieee-p1363" });
  return {
    "content-digest": digest,
    "signature-input": `${DEVICE_SIGNATURE_LABEL}=${serializeSignatureParams(params)}`,
    signature: `${DEVICE_SIGNATURE_LABEL}=:${signature.toString("base64")}:`
  };
}

/** A request as the receiver got it. Header names in any case; a field sent on several lines is joined with ", ". */
export interface DeviceRequest {
  method: string;
  /** The request target, origin-form: the path and query as received. */
  target: string;
  headers: Readonly<Record<string, string | readonly string[] | undefined>>;
  body: Uint8Array | string;
}

/** The receiver's record of a certificate, found by serial, with the key the device signs requests with. */
export interface DeviceCertificateRecord {
  serial: string;
  notBefore: string;
  notAfter: string;
  /** Present and not `false` means revoked. */
  revoked?: boolean;
  /**
   * DEC-0103: the time the organization's closing began (RFC 3339), set only once the closing can no longer be cancelled
   * and only for a node pinned at or after DEC-0103 (known from the last product and version it reported). The server
   * keeps it from its termination record after the organization is deleted, so the device learns the end.
   */
  organizationClosedAt?: string;
  /**
   * The `#sig` key of the enrollment whose epoch the certificate carries (DEC-0053; rotation keeps it), or the certified key
   * when that enrollment listed no `deviceKeys`. Which one is the receiver's data model's to record.
   */
  key: { alg: DeviceKeyAlg; publicKey: string };
}

export interface DeviceSignatureContext {
  /** The receiver's public base URL: the one the device enrolled with. */
  publicBaseUrl: string;
  certificate: (serial: string) => DeviceCertificateRecord | undefined;
  /** The receiver's clock. */
  at: Date;
  /**
   * The serial of the client certificate of a mutual-TLS session, when the receiver sees one. A signature beside it names
   * that serial; an unsigned request is accepted on it alone.
   */
  clientCertificateSerial?: string;
}

/** `binding` says what proved the key: the signature, or (unsigned) the mutual-TLS session's client certificate. */
export type DeviceSignatureVerdict =
  | { ok: true; binding: "signature"; serial: string; nonce: string; created: number; keepUntil: number }
  | { ok: true; binding: "mutual-tls"; serial: string }
  | { ok: false; code: "organization-closed"; status: 410; reason: string; closedAt: string }
  | { ok: false; code: Exclude<SignatureRefusal, "organization-closed"> | ReceiverFault; reason: string };

/** The strict RFC 3339 reader (`T`, an offset and a day that exists), shared by every rule that compares a time. */
export { strictTime } from "./rfc3339.js";
import { strictTime } from "./rfc3339.js";

/** Header lookup by lower-case name, joining repeated lines with ", " (RFC 9421 §2.1) and trimming the value. */
const headerMap = (headers: unknown): Map<string, string> => {
  const map = new Map<string, string>();
  if (typeof headers !== "object" || headers === null || Array.isArray(headers)) return map;
  for (const [name, raw] of Object.entries(headers)) {
    const lines = Array.isArray(raw) ? raw.filter((line): line is string => typeof line === "string") : typeof raw === "string" ? [raw] : [];
    if (!lines.length) continue;
    const key = name.toLowerCase();
    const value = lines.map((line) => line.replace(/^[ \t]+|[ \t]+$/g, "")).join(", ");
    map.set(key, map.has(key) ? `${map.get(key)}, ${value}` : value);
  }
  return map;
};

const isInnerList = (member: SfMember): member is SfInnerList => "items" in member;
const isObjectLike = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Whether either field carries a `fabric-device` member; a field that does not parse is absent (RFC 8941 §4.2). */
const signaturePresent = (headers: Map<string, string>): boolean =>
  ["signature-input", "signature"].some((name) => {
    const field = parseDictionary(headers.get(name) ?? "");
    return field !== null && (field.members.has(DEVICE_SIGNATURE_LABEL) || field.duplicates.has(DEVICE_SIGNATURE_LABEL));
  });
const refuse = (code: Exclude<SignatureRefusal, "organization-closed"> | ReceiverFault, reason: string): DeviceSignatureVerdict => ({ ok: false, code, reason });

/** The parsed binding: what a conforming `fabric-device` signature carries, or null when the request carries none. */
interface ParsedSignature { created: number; nonce: string; keyid: string; alg: HttpSignatureAlg; signature: Uint8Array }

const parseDeviceSignature = (headers: Map<string, string>): ParsedSignature | null => {
  const input = parseDictionary(headers.get("signature-input") ?? "");
  const value = parseDictionary(headers.get("signature") ?? "");
  if (!input || !value || input.duplicates.has(DEVICE_SIGNATURE_LABEL) || value.duplicates.has(DEVICE_SIGNATURE_LABEL)) return null;
  const list = input.members.get(DEVICE_SIGNATURE_LABEL);
  const sig = value.members.get(DEVICE_SIGNATURE_LABEL);
  if (!list || !isInnerList(list) || !sig || isInnerList(sig) || !(sig.value instanceof Uint8Array) || sig.params.length) return null;
  // A parameter named twice is RFC 8941's last-wins elsewhere; on the binding's own member it is refused.
  if (list.repeated || list.items.some((item) => item.repeated)) return null;
  const names = list.items.map((item) => (item.params.length === 0 && typeof item.value === "string" ? item.value : null));
  if (names.length !== DEVICE_COVERED_COMPONENTS.length || names.some((name, i) => name !== DEVICE_COVERED_COMPONENTS[i])) return null;
  if (list.params.length !== DEVICE_SIGNATURE_PARAMETERS.length || list.params.some(([key], i) => key !== DEVICE_SIGNATURE_PARAMETERS[i])) return null;
  const [[, created], [, nonce], [, keyid], [, alg]] = list.params as [[string, BareItem], [string, BareItem], [string, BareItem], [string, BareItem]];
  if (typeof created !== "number" || !Number.isInteger(created)) return null;
  if (typeof nonce !== "string" || !NONCE_PATTERN.test(nonce)) return null;
  if (typeof keyid !== "string" || !SERIAL_PATTERN.test(keyid)) return null;
  if (alg !== "ecdsa-p256-sha256" && alg !== "ed25519") return null;
  return { created, nonce, keyid, alg, signature: sig.value };
};

/** DER prefix of an Ed25519 SubjectPublicKeyInfo (RFC 8410). */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
/**
 * A raw uncompressed P-256 point (0x04 ‖ X ‖ Y) as a public JWK. A P-256 key goes to `verify` as `{key: jwk, format: "jwk",
 * dsaEncoding}`: workerd (Cloudflare Workers) throws a TypeError on a KeyObject beside `dsaEncoding`, and Node accepts both.
 * Local until `p256Jwk` (src/p256.ts, #59) lands.
 */

/**
 * Every check of the binding but the nonce store, in this order: the receiver's own faults (`context-invalid`,
 * `clock-unreadable`, `base-url-invalid`; never a throw); an unsigned request, accepted only on a mutual-TLS client
 * certificate that is known, not revoked and valid now (`binding: "mutual-tls"`); a conforming signature
 * (`signature-missing`), the body's digest (`digest-mismatch`), the window (`signature-stale`), `keyid` equal to the
 * client certificate's serial when there is one, and the certificate (`certificate-unknown`, then `organization-closed`
 * for a closed organization's, DEC-0103, then `-revoked`, `-expired`), the
 * algorithm and key (`signature-invalid`), and the signature over the rebuilt base (`signature-invalid`). The vectors
 * carry one fault each, so a port that orders the checks otherwise answers them alike; the `organization` cases also
 * carry a revocation on purpose, to pin step 4 before step 5 (DEC-0103).
 */
export function checkDeviceSignature(request: DeviceRequest, context: DeviceSignatureContext): DeviceSignatureVerdict {
  // The receiver's own faults first: a context that is not an object, an unreadable clock — a NaN clock makes every window
  // comparison false and so would accept a signature of any age — a malformed base URL, a certificate lookup that is not a
  // function. None of them throws: a public verifier answers.
  if (!isObjectLike(context)) return refuse("context-invalid", "the receiver's context is not an object");
  const at = context.at instanceof Date ? context.at.getTime() : Number.NaN;
  if (Number.isNaN(at)) return refuse("clock-unreadable", "the receiver's clock is unreadable; it accepts nothing until it reads one");
  if (publicOrigin(context.publicBaseUrl) === null) return refuse("base-url-invalid", "the receiver's public base URL is not https:// and an authority alone");
  if (typeof context.certificate !== "function") return refuse("context-invalid", "the receiver's certificate lookup is not a function");
  const client = typeof context.clientCertificateSerial === "string" ? context.clientCertificateSerial : undefined;
  if (!isObjectLike(request)) return refuse("signature-missing", "no request");
  const headers = headerMap(request.headers);
  const certificateRefusal = (serial: string): DeviceSignatureVerdict | DeviceCertificateRecord => {
    const record = context.certificate(serial);
    if (!isObjectLike(record) || record.serial !== serial) return refuse("certificate-unknown", "no certificate with this serial");
    // DEC-0103: a closed organization answers before revocation, so the device learns the end, not one machine's revocation.
    if (record.organizationClosedAt !== undefined) {
      const closedAt = record.organizationClosedAt;
      if (typeof closedAt !== "string" || Number.isNaN(strictTime(closedAt))) return refuse("context-invalid", "the receiver's record of the organization's closing has no readable time");
      return { ok: false, code: "organization-closed", status: 410, reason: "the organization is closed: stop every request for it", closedAt };
    }
    if (record.revoked !== undefined && record.revoked !== false) return refuse("certificate-revoked", "the certificate is revoked: re-enroll");
    const from = strictTime(record.notBefore), to = strictTime(record.notAfter);
    if (!(at >= from && at < to)) return refuse("certificate-expired", "the certificate is not valid now: re-enroll");
    return record;
  };
  // DEC-0056 item 1: a signature that is present is always verified; only an unsigned request rests on mutual TLS alone.
  if (!signaturePresent(headers)) {
    if (client === undefined) return refuse("signature-missing", "no fabric-device signature, and no client certificate");
    const record = certificateRefusal(client);
    return "ok" in record ? record : { ok: true, binding: "mutual-tls", serial: client };
  }
  const parsed = parseDeviceSignature(headers);
  if (!parsed) return refuse("signature-missing", "no fabric-device signature with the three covered components and created, nonce, keyid and alg in that order");
  const body = typeof request.body === "string" || request.body instanceof Uint8Array ? request.body : "";
  const digest = headers.get("content-digest");
  if (digest !== contentDigest(body)) return refuse("digest-mismatch", "Content-Digest is not sha-256 of the body as received");
  if (Math.abs(at / 1000 - parsed.created) > MAX_SIGNATURE_SKEW_SECONDS) return refuse("signature-stale", `created is more than ${MAX_SIGNATURE_SKEW_SECONDS} s from the receiver's clock`);
  if (client !== undefined && client !== parsed.keyid) return refuse("certificate-unknown", "keyid is not the serial of the mutual-TLS session's client certificate");
  const found = certificateRefusal(parsed.keyid);
  if ("ok" in found) return found;
  const record = found;
  const key = typeof record.key === "object" && record.key !== null ? record.key : { alg: undefined, publicKey: undefined };
  if (httpAlgFor(key.alg) !== parsed.alg) return refuse("signature-invalid", "wrong-alg: alg is not the algorithm of the device's signing key");
  const raw = Buffer.from(typeof key.publicKey === "string" ? key.publicKey : "", "base64");
  // DEC-0045: a small-order Ed25519 key verifies forged signatures on Node 20 and 22; DEC-0053: a P-256 key is a valid point.
  if (parsed.alg === "ed25519" ? isSmallOrderKey(raw) : !isValidP256Key(raw)) return refuse("signature-invalid", "unusable-key: the key on record is not a usable key of its algorithm");
  const targetUri = deviceTargetUri(context.publicBaseUrl, typeof request.target === "string" ? request.target : "");
  const method = typeof request.method === "string" && /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(request.method) ? request.method : null;
  const base = targetUri && method ? deviceSignatureBase(method, targetUri, digest, deviceSignatureParams(parsed.created, parsed.nonce, parsed.keyid, parsed.alg)) : null;
  if (base === null) return refuse("signature-invalid", "no-base: the signature base cannot be built from this request (RFC 9421 §2.5)");
  if (parsed.signature.length !== 64) return refuse("signature-invalid", "bad-length: the signature is not 64 octets (RFC 9421 §3.3.4, §3.3.6)");
  const bytes = Buffer.from(base, "ascii");
  const signature = Buffer.from(parsed.signature);
  let ok = false;
  try {
    ok = parsed.alg === "ed25519"
      ? verify(null, bytes, createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, raw]), format: "der", type: "spki" }), signature)
      : verify("sha256", bytes, { key: p256Jwk(raw), format: "jwk", dsaEncoding: "ieee-p1363" }, signature);
  } catch {
    // A key the platform cannot load verifies nothing; the checks above refuse every such key first.
    ok = false;
  }
  if (!ok) return refuse("signature-invalid", "bad-signature: the signature does not verify under the device's key");
  return { ok: true, binding: "signature", serial: parsed.keyid, nonce: parsed.nonce, created: parsed.created, keepUntil: parsed.created + MAX_SIGNATURE_SKEW_SECONDS };
}

/**
 * Where a receiver records (serial, nonce) pairs. `recordOnce` is atomic: it records the pair, kept at least while
 * `now ≤ keepUntil` (Unix seconds), and answers true — or answers false when the pair is already held. A database
 * implements it as an insert on a unique key; a pair may be dropped once `now > keepUntil`, when `created` can no
 * longer pass the window.
 */
export interface NonceStore {
  recordOnce(serial: string, nonce: string, keepUntil: number, now: number): boolean | Promise<boolean>;
}

/** A nonce store in memory, for one process and for tests. */
export function createMemoryNonceStore(): NonceStore & { size(): number } {
  const held = new Map<string, number>();
  return {
    recordOnce(serial, nonce, keepUntil, now) {
      for (const [pair, until] of held) if (until < now) held.delete(pair);
      const pair = `${serial} ${nonce}`;
      if (held.has(pair)) return false;
      held.set(pair, keepUntil);
      return true;
    },
    size: () => held.size
  };
}

/**
 * The reference receiver (DEC-0056): `checkDeviceSignature`, then — only after a signature verifies — the nonce store
 * (an unsigned request accepted on mutual TLS has no nonce). A store that is not an object with `recordOnce` is
 * `context-invalid`.
 * A repeated (serial, nonce) inside its window is `signature-replayed`; a refused request records nothing, so a forged
 * request cannot burn a device's nonce.
 */
export async function verifyDeviceRequest(request: DeviceRequest, context: DeviceSignatureContext & { nonces: NonceStore }): Promise<DeviceSignatureVerdict> {
  const verdict = checkDeviceSignature(request, context);
  if (!verdict.ok || verdict.binding === "mutual-tls") return verdict;
  // A store without `recordOnce` cannot detect a repeat, so nothing signed is accepted through it (and nothing throws).
  if (!isObjectLike(context.nonces) || typeof context.nonces.recordOnce !== "function") return refuse("context-invalid", "the receiver's nonce store has no recordOnce function");
  const fresh = await context.nonces.recordOnce(verdict.serial, verdict.nonce, verdict.keepUntil, context.at.getTime() / 1000);
  return fresh ? verdict : refuse("signature-replayed", "this (serial, nonce) was already accepted; sign again with a new nonce");
}
// #endregion http-signature
