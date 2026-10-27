// #region peer-share — docs: docs/specification/peer-share.md
/**
 * DEC-0142: a credential one person shares from their estate with another person's estate, with no organization on
 * either side (`fabric-peer-share/1`). The trust root is the link the sender gives the recipient (the sender's share key
 * fingerprint and a one-time claim code) and a six-digit code the two people compare. Each side makes a key pair for
 * the one share (`#sig`, `#kem`), never its device keys. The value travels sealed to the recipient's share `#kem` with
 * the secret envelope's HPKE construction under its own `info`; usage reports travel sealed to the sender's share
 * `#kem`; a mailbox the sender names carries the frames and sees ciphertext and names only.
 *
 * The comparison code is DEC-0084's (both sides commit, then both reveal; the first five bytes of a SHA-256 over an
 * RFC 8785 transcript, modulo 10^6) under the share's own types. Keys are P-256 public JWKs, named by their RFC 7638
 * thumbprint. Every checking function answers malformed input with a verdict and never throws on a JSON value; the
 * seal and sign functions throw on an input no receiver would open, and `shareLink` formats only the parts it is given.
 */
import { createECDH, createHash, createHmac, createPublicKey, timingSafeEqual, type KeyObject } from "node:crypto";
import { rfc8785 } from "./canonical.js";
import { type JsonObject, isObject } from "./findings.js";
import { p256KeyRefusal, p256Point, signEs256 } from "./p256.js";
import { CLOCK_SKEW_SECONDS, instant, verifyEs256 } from "./relay.js";
import { ENVELOPE_SUITE, hpkeOpenBase, hpkeSealBase } from "./secret-envelope.js";

export const PEER_SHARE_PROTOCOL = "fabric-peer-share/1";
export const PEER_FRAME_SCHEMA = "peer-share-frame/1";
export const PEER_CLAIM_TYPE = "fabric-peer-claim/1";
export const PEER_COMMIT_TYPE = "fabric-peer-commit/1";
export const PEER_CODE_TYPE = "fabric-peer-code/1";
export const PEER_ENVELOPE_TYPE = "fabric-peer-share-envelope/1";
export const PEER_REPORT_TYPE = "fabric-peer-share-report/1";
export const PEER_REVOCATION_TYPE = "peer-share-revocation/1";
export const PEER_DELETION_TYPE = "peer-share-deletion/1";
export const PEER_CODE_DIGITS = 6;
/** A claim code answers at most this long after the share is made. */
export const MAX_CLAIM_DAYS = 7;
/** An envelope lives at most this long; the sender seals again to go on. */
export const MAX_PEER_ENVELOPE_DAYS = 90;
/** A lease the mailbox grants an honest recipient lasts at most this long. */
export const MAX_LEASE_SECONDS = 86_400;

const DAY_MS = 86_400_000;
const ALG = "ES256";
const SHARE_ID = /^[0-9a-f]{32}$/;
/** 16 bytes as unpadded base64url: 22 characters, the last carrying two bits. */
const LINK_CODE = /^[A-Za-z0-9_-]{21}[AQgw]$/;
/** 32 bytes as unpadded base64url: a thumbprint, a nonce, a MAC. */
const BYTES32 = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const B64URL = /^[A-Za-z0-9_-]+$/;
const SIG = /^[A-Za-z0-9_-]{86}$/;
const COORD = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
const SLOT = /^[A-Z][A-Z0-9_]{0,63}$/;
const PROVIDER = /^[a-z][a-z0-9-]{1,62}$/; // common.schema.json#/$defs/slug
const COMMIT = /^sha256:[0-9a-f]{64}$/;
const DIGEST = COMMIT;

const isString = (value: unknown): value is string => typeof value === "string";
const counter = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 1;
const exactly = (value: JsonObject, members: readonly string[]) => Object.keys(value).length === members.length && members.every((m) => m in value);
const sha256 = (text: string) => createHash("sha256").update(Buffer.from(text, "utf8")).digest();
const second = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");

// ---- Keys -------------------------------------------------------------------------------------------------------

export interface PeerJwk { kty: "EC"; crv: "P-256"; x: string; y: string }
export interface PeerKeys { sig: PeerJwk; kem: PeerJwk }

/** Whether a value is a P-256 public JWK with exactly `kty`, `crv`, `x` and `y`, its point on the curve. */
export function peerJwk(value: unknown): value is PeerJwk {
  return isObject(value) && exactly(value, ["kty", "crv", "x", "y"]) && value.kty === "EC" && value.crv === "P-256"
    && isString(value.x) && COORD.test(value.x) && isString(value.y) && COORD.test(value.y) && p256KeyRefusal(value as unknown as PeerJwk) === null;
}

/** The RFC 7638 SHA-256 thumbprint of a P-256 public JWK, unpadded base64url, or undefined for anything else. */
export function peerThumbprint(jwk: unknown): string | undefined {
  if (!peerJwk(jwk)) return undefined;
  // RFC 7638 §3.2: the required members in lexicographic order, no whitespace: the RFC 8785 form of those four.
  return createHash("sha256").update(rfc8785({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }), "utf8").digest("base64url");
}

/** A share's key pair: exactly `sig` and `kem`, each a P-256 public JWK, two different keys. */
export function peerKeys(value: unknown): value is PeerKeys {
  return isObject(value) && exactly(value, ["sig", "kem"]) && peerJwk(value.sig) && peerJwk(value.kem) && peerThumbprint(value.sig) !== peerThumbprint(value.kem);
}

// ---- The link ---------------------------------------------------------------------------------------------------

export interface ShareLink { origin: string; shareId: string; code: string; fpr: string }

/**
 * The share link, `https://<mailbox origin>/s/<shareId>#c=<code>&k=<fpr>`: an HTTPS origin without user information,
 * the path `/s/` and a 32-hex share id, no query, and a fragment with exactly `c` (16 random bytes) and `k` (the
 * thumbprint of the sender's share `#sig`), each once, in either order. The fragment never travels in a request.
 */
export function parseShareLink(value: unknown): { ok: true; link: ShareLink } | { ok: false; problem: "malformed" } {
  const no = { ok: false as const, problem: "malformed" as const };
  if (!isString(value) || value.length > 2048 || /[\s\u0000-\u001f\u007f]/.test(value) || value.includes("?")) return no;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return no;
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.search !== "") return no;
  const path = /^\/s\/([0-9a-f]{32})$/.exec(url.pathname);
  if (path === null || !url.hash.startsWith("#")) return no;
  const pairs = url.hash.slice(1).split("&").map((part) => part.split("="));
  if (pairs.length !== 2 || pairs.some((pair) => pair.length !== 2)) return no;
  const fields = new Map(pairs.map(([name, v]) => [name as string, v as string]));
  const code = fields.get("c"), fpr = fields.get("k");
  if (fields.size !== 2 || code === undefined || fpr === undefined || !LINK_CODE.test(code) || !BYTES32.test(fpr)) return no;
  return { ok: true, link: { origin: url.origin, shareId: path[1] as string, code, fpr } };
}

/** The link's text for a share; for parts `parseShareLink` answered, a parse of it answers the same parts. */
export function shareLink(link: ShareLink): string {
  return `${link.origin}/s/${link.shareId}#c=${link.code}&k=${link.fpr}`;
}

// ---- The claim --------------------------------------------------------------------------------------------------

/**
 * The claim's MAC: HMAC-SHA-256 keyed with the link's 16 code bytes over the UTF-8 RFC 8785 form of
 * `{type: "fabric-peer-claim/1", shareId, keys, fpr}`, unpadded base64url. It filters claims to those of a link's
 * holder; it authenticates nothing against the mailbox, whose landing page can read the code.
 */
export function claimMac(code: unknown, shareId: unknown, keys: unknown, fpr: unknown): string | undefined {
  if (!isString(code) || !LINK_CODE.test(code) || !isString(shareId) || !SHARE_ID.test(shareId) || !peerKeys(keys) || !isString(fpr) || !BYTES32.test(fpr)) return undefined;
  return createHmac("sha256", Buffer.from(code, "base64url")).update(rfc8785({ type: PEER_CLAIM_TYPE, shareId, keys, fpr }), "utf8").digest("base64url");
}

/** Whether a frame is a claim for the link's share whose MAC the link's code gives, compared in constant time. */
export function claimHolds(link: unknown, frame: unknown): boolean {
  if (!isObject(link) || !isString(link.code) || !isString(link.shareId) || !isString(link.fpr)) return false;
  const claim = peerFrame(frame);
  if (claim === undefined || claim.step !== "claim" || claim.shareId !== link.shareId) return false;
  const expected = claimMac(link.code, link.shareId, claim.keys, link.fpr);
  return expected !== undefined && timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(claim.mac as string, "utf8"));
}

/**
 * Whether the sender's commit frame names the share `#sig` the link pins: its thumbprint is the link's `k`. A
 * recipient whose link reached its app as sent aborts on a mismatch; one handed over by the mailbox's page has no pin
 * and rests on the comparison code alone.
 */
export function pinHolds(link: unknown, frame: unknown): boolean {
  const commit = peerFrame(frame);
  return isObject(link) && isString(link.fpr) && isString(link.shareId) && commit !== undefined && commit.step === "commit" && commit.shareId === link.shareId && peerThumbprint(commit.keys.sig) === link.fpr;
}

// ---- Frames -----------------------------------------------------------------------------------------------------

export type PeerRole = "sender" | "recipient";
export type PeerFrame =
  | { schema: typeof PEER_FRAME_SCHEMA; step: "claim"; shareId: string; keys: PeerKeys; mac: string; commit: string }
  | { schema: typeof PEER_FRAME_SCHEMA; step: "commit"; shareId: string; keys: PeerKeys; commit: string }
  | { schema: typeof PEER_FRAME_SCHEMA; step: "reveal"; role: PeerRole; shareId: string; nonce: string }
  | { schema: typeof PEER_FRAME_SCHEMA; step: "abort"; role: PeerRole; shareId: string };

const FRAME_MEMBERS: Record<string, readonly string[]> = {
  claim: ["schema", "step", "shareId", "keys", "mac", "commit"],
  commit: ["schema", "step", "shareId", "keys", "commit"],
  reveal: ["schema", "step", "role", "shareId", "nonce"],
  abort: ["schema", "step", "role", "shareId"]
};

/** A `peer-share-frame/1` of one step with the members `peer-share-frame.schema.json` gives it, or undefined. */
export function peerFrame(value: unknown): PeerFrame | undefined {
  if (!isObject(value) || value.schema !== PEER_FRAME_SCHEMA || !isString(value.step)) return undefined;
  const members = FRAME_MEMBERS[value.step];
  if (members === undefined || !exactly(value, members) || !isString(value.shareId) || !SHARE_ID.test(value.shareId)) return undefined;
  if ((value.step === "claim" || value.step === "commit") && (!peerKeys(value.keys) || !isString(value.commit) || !COMMIT.test(value.commit))) return undefined;
  if (value.step === "claim" && (!isString(value.mac) || !BYTES32.test(value.mac))) return undefined;
  if ((value.step === "reveal" || value.step === "abort") && value.role !== "sender" && value.role !== "recipient") return undefined;
  if (value.step === "reveal" && (!isString(value.nonce) || !BYTES32.test(value.nonce))) return undefined;
  return value as unknown as PeerFrame;
}

// ---- Commit, reveal and the comparison code -----------------------------------------------------------------------

export type PeerCodeProblem = "malformed" | "bad-role" | "bad-share" | "bad-keys" | "bad-nonce" | "role-mismatch" | "share-mismatch" | "commit-mismatch" | "same-keys";
export interface PeerSide { role: PeerRole; shareId: string; keys: PeerKeys; nonce: string }

function sideProblem(side: unknown): PeerCodeProblem | null {
  if (!isObject(side) || !exactly(side, ["role", "shareId", "keys", "nonce"])) return "malformed";
  if (side.role !== "sender" && side.role !== "recipient") return "bad-role";
  if (!isString(side.shareId) || !SHARE_ID.test(side.shareId)) return "bad-share";
  if (!peerKeys(side.keys)) return "bad-keys";
  if (!isString(side.nonce) || !BYTES32.test(side.nonce)) return "bad-nonce";
  return null;
}

/**
 * A side's commitment: `sha256:` and the hex SHA-256 of the UTF-8 RFC 8785 form of
 * `{type: "fabric-peer-commit/1", shareId, role, keys, nonce}`. The recipient sends it in its claim, the sender in its
 * commit frame; neither reveals its nonce before it holds the other's commitment.
 */
export function peerCommit(side: unknown): { ok: true; commit: string } | { ok: false; problem: PeerCodeProblem } {
  const problem = sideProblem(side);
  if (problem !== null) return { ok: false, problem };
  const s = side as PeerSide;
  return { ok: true, commit: `sha256:${sha256(rfc8785({ type: PEER_COMMIT_TYPE, shareId: s.shareId, role: s.role, keys: s.keys, nonce: s.nonce })).toString("hex")}` };
}

/** Whether a side's reveal opens its commitment in the role expected (else `role-mismatch`, `commit-mismatch`). */
export function checkPeerReveal(commit: unknown, side: unknown, expected: PeerRole): { ok: true } | { ok: false; problem: PeerCodeProblem } {
  if (!isString(commit) || !COMMIT.test(commit)) return { ok: false, problem: "malformed" };
  const made = peerCommit(side);
  if (!made.ok) return made;
  if ((side as PeerSide).role !== expected) return { ok: false, problem: "role-mismatch" };
  return made.commit === commit ? { ok: true } : { ok: false, problem: "commit-mismatch" };
}

/**
 * The comparison code over both reveals: the transcript is the UTF-8 RFC 8785 form of
 * `{type: "fabric-peer-code/1", shareId, sender: {keys, nonce}, recipient: {keys, nonce}}`; the code is the first five
 * bytes of its SHA-256 as a big-endian integer, modulo 10^6, six digits with leading zeros (DEC-0084's reading).
 */
export function peerComparisonCode(sender: unknown, recipient: unknown): { ok: true; code: string } | { ok: false; problem: PeerCodeProblem } {
  for (const side of [sender, recipient]) {
    const problem = sideProblem(side);
    if (problem !== null) return { ok: false, problem };
  }
  const s = sender as PeerSide, r = recipient as PeerSide;
  if (s.role !== "sender" || r.role !== "recipient") return { ok: false, problem: "role-mismatch" };
  if (s.shareId !== r.shareId) return { ok: false, problem: "share-mismatch" };
  const mine = [peerThumbprint(s.keys.sig), peerThumbprint(s.keys.kem)], theirs = [peerThumbprint(r.keys.sig), peerThumbprint(r.keys.kem)];
  if (mine.some((key) => theirs.includes(key))) return { ok: false, problem: "same-keys" };
  const transcript = rfc8785({ type: PEER_CODE_TYPE, shareId: s.shareId, sender: { keys: s.keys, nonce: s.nonce }, recipient: { keys: r.keys, nonce: r.nonce } });
  return { ok: true, code: String(sha256(transcript).readUIntBE(0, 5) % 10 ** PEER_CODE_DIGITS).padStart(PEER_CODE_DIGITS, "0") };
}

/** The code only after each reveal opened its own commitment: a port that codes reveals straight away loses the one-guess bound. */
export function checkedPeerCode(senderCommit: unknown, sender: unknown, recipientCommit: unknown, recipient: unknown): { ok: true; code: string } | { ok: false; problem: PeerCodeProblem } {
  const a = checkPeerReveal(senderCommit, sender, "sender");
  if (!a.ok) return a;
  const b = checkPeerReveal(recipientCommit, recipient, "recipient");
  if (!b.ok) return b;
  return peerComparisonCode(sender, recipient);
}

// ---- One attempt per link ---------------------------------------------------------------------------------------

export type PeerBurn = "malformed" | "expired" | "repeated" | "out-of-order" | "commit-mismatch" | "aborted" | "closed";
export type PeerExchangeVerdict = { state: "open" | "complete" } | { state: "burnt"; reason: PeerBurn; index: number };

/**
 * One share's exchange, as the sender's node, the recipient's node and the mailbox each read it from the frames in the
 * order received: the recipient's claim, then the sender's commit, then the two reveals in either order (each only
 * after both commitments); after both reveals open their commitments it is `complete` and carries exactly one more
 * frame, an `abort` (a person said the codes differ). It burns on the first frame out of that order, a second frame of
 * one step and role before completion (a second claim included: every claim counts, whatever its MAC, since the mailbox
 * cannot check one), a reveal that does not open its commitment, an abort before completion, any frame after completion
 * other than that one abort (`closed`), a frame for another share, or the claim deadline passing before completion (`at`
 * and `claimDeadline` read as RFC 3339). A node keeps the first burnt verdict it reached and never reads the share
 * again: the verdict carries no arrival times, so `expired` holds only for a node that kept it. A burnt exchange seals
 * nothing; a new attempt is a new share with a new link.
 */
export function peerExchangeVerdict(shareId: unknown, claimDeadline: unknown, frames: unknown, at: unknown): PeerExchangeVerdict {
  const deadline = instant(claimDeadline), now = instant(at);
  if (!isString(shareId) || !SHARE_ID.test(shareId) || deadline === undefined || now === undefined || !Array.isArray(frames)) return { state: "burnt", reason: "malformed", index: -1 };
  let claim: Extract<PeerFrame, { step: "claim" }> | undefined, commit: Extract<PeerFrame, { step: "commit" }> | undefined;
  const revealed = new Set<PeerRole>();
  let complete = false, aborted = false;
  for (const [index, value] of frames.entries()) {
    const frame = peerFrame(value);
    const burn = (reason: PeerBurn): PeerExchangeVerdict => ({ state: "burnt", reason, index });
    if (frame === undefined || frame.shareId !== shareId) return burn("malformed");
    if (aborted) return burn("closed");
    if (complete) {
      if (frame.step === "abort") { aborted = true; continue; }
      return burn("closed");
    }
    if (frame.step === "claim") {
      if (claim !== undefined) return burn("repeated");
      claim = frame;
    } else if (frame.step === "commit") {
      if (commit !== undefined) return burn("repeated");
      if (claim === undefined) return burn("out-of-order");
      commit = frame;
    } else if (frame.step === "reveal") {
      if (claim === undefined || commit === undefined) return burn("out-of-order");
      if (revealed.has(frame.role)) return burn("repeated");
      const opened = frame.role === "sender" ? checkPeerReveal(commit.commit, { role: "sender", shareId, keys: commit.keys, nonce: frame.nonce }, "sender")
        : checkPeerReveal(claim.commit, { role: "recipient", shareId, keys: claim.keys, nonce: frame.nonce }, "recipient");
      if (!opened.ok) return burn("commit-mismatch");
      revealed.add(frame.role);
      if (revealed.size === 2) complete = true;
    } else {
      return burn("aborted");
    }
  }
  if (aborted) return { state: "burnt", reason: "aborted", index: frames.length - 1 };
  if (complete) return { state: "complete" };
  return now > deadline ? { state: "burnt", reason: "expired", index: frames.length } : { state: "open" };
}

// ---- Sealed messages: the envelope and the usage report -----------------------------------------------------------

export interface PeerSealedHeader {
  type: typeof PEER_ENVELOPE_TYPE | typeof PEER_REPORT_TYPE;
  alg: typeof ALG;
  suite: number[];
  recipient: string; // the thumbprint of the receiving side's share #kem
  signer: string; // the thumbprint of the sending side's share #sig
  shareId: string;
  slot?: string; // an envelope's
  provider?: string; // an envelope's
  sequence: number;
  iat: string;
  exp?: string; // an envelope's
  enc: string;
}
export interface PeerSealed { header: PeerSealedHeader; ct: string; sig: string }

const HEADERS: Record<string, readonly string[]> = {
  [PEER_ENVELOPE_TYPE]: ["type", "alg", "suite", "recipient", "signer", "shareId", "slot", "provider", "sequence", "iat", "exp", "enc"],
  [PEER_REPORT_TYPE]: ["type", "alg", "suite", "recipient", "signer", "shareId", "sequence", "iat", "enc"]
};

/**
 * Whether a value has exactly the shape `peer-share-envelope.schema.json` (or the report's) gives a sealed message of
 * `type`, its times real instants: the schema's time pattern admits a day or a second that does not exist, which the
 * calendar check here (`instant`, as the relay family reads times) refuses.
 */
export function peerSealedShape(value: unknown, type: typeof PEER_ENVELOPE_TYPE | typeof PEER_REPORT_TYPE): value is PeerSealed {
  if (!isObject(value) || !exactly(value, ["header", "ct", "sig"]) || !isObject(value.header)) return false;
  const h = value.header;
  if (h.type !== type || !exactly(h, HEADERS[type] as readonly string[])) return false;
  const envelope = type === PEER_ENVELOPE_TYPE;
  return isString(h.alg) && [...h.alg].length <= 16 && JSON.stringify(h.suite) === JSON.stringify(ENVELOPE_SUITE)
    && isString(h.recipient) && BYTES32.test(h.recipient) && isString(h.signer) && BYTES32.test(h.signer)
    && isString(h.shareId) && SHARE_ID.test(h.shareId) && counter(h.sequence) && instant(h.iat) !== undefined
    && (!envelope || (isString(h.slot) && SLOT.test(h.slot) && isString(h.provider) && PROVIDER.test(h.provider) && instant(h.exp) !== undefined))
    && isString(h.enc) && B64URL.test(h.enc) && isString(value.ct) && B64URL.test(value.ct) && isString(value.sig) && SIG.test(value.sig);
}

const signingInput = (sealed: { header: unknown; ct: unknown }) => rfc8785({ header: sealed.header, ct: sealed.ct });

/** `sha256:` and the hex SHA-256 of a sealed message's or a record's RFC 8785 bytes. */
export function peerDigest(value: unknown): string {
  return `sha256:${createHash("sha256").update(rfc8785(value), "utf8").digest("hex")}`;
}

export interface PeerSealInput {
  recipientKem: PeerJwk; // the receiving side's share #kem
  signer: { sig: PeerJwk; privateKey: KeyObject }; // the sending side's share #sig and its private key
  shareId: string;
  sequence: number; // the sealer's next for the share (and slot); never one it used
  iat: Date;
  plaintext: Buffer;
  ephemeralPrivateKey?: Buffer; // tests only: a fixed ephemeral key repeats a seal; never reuse one for two values
}

/** Throws unless `privateKey` is the P-256 private key of the share `#sig` named: a mismatched pair signs what no reader verifies. */
function signerKeyHolds(signer: { sig: PeerJwk; privateKey: KeyObject }): void {
  const key = signer.privateKey;
  if (key.type !== "private" || key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") throw new Error("bad-key: the signer's key is not a P-256 private key");
  if (!peerJwk(signer.sig)) throw new Error("bad-key: a share key is not a P-256 public JWK");
  const pub = createPublicKey(key).export({ format: "jwk" }) as { x?: string; y?: string };
  if (pub.x !== signer.sig.x || pub.y !== signer.sig.y) throw new Error("bad-key: the private key is not the signer's share #sig");
}

function seal(type: PeerSealedHeader["type"], input: PeerSealInput, extra: Partial<PeerSealedHeader>): PeerSealed {
  signerKeyHolds(input.signer);
  const key = input.signer.privateKey;
  if (!peerJwk(input.recipientKem)) throw new Error("bad-key: a share key is not a P-256 public JWK");
  const ephemeral = createECDH("prime256v1");
  if (input.ephemeralPrivateKey) ephemeral.setPrivateKey(input.ephemeralPrivateKey);
  else ephemeral.generateKeys();
  const header = {
    type, alg: ALG, suite: [...ENVELOPE_SUITE], recipient: peerThumbprint(input.recipientKem) as string, signer: peerThumbprint(input.signer.sig) as string,
    shareId: input.shareId, ...extra, sequence: input.sequence, iat: second(input.iat), enc: ephemeral.getPublicKey(null, "uncompressed").toString("base64url")
  } as PeerSealedHeader;
  if (!peerSealedShape({ header, ct: "AA", sig: "A".repeat(86) }, type)) throw new Error("malformed: the message would not have the schema's shape");
  const { ct } = hpkeSealBase(p256Point(input.recipientKem), Buffer.from(type, "ascii"), Buffer.from(rfc8785(header), "utf8"), input.plaintext, ephemeral.getPrivateKey());
  const unsigned = { header, ct: ct.toString("base64url") };
  return { ...unsigned, sig: signEs256(key, Buffer.from(signingInput(unsigned), "utf8")) };
}

/** Seals a shared value to the recipient's share `#kem` (DEC-0142 PS-7). Throws on an input no recipient would open. */
export function sealPeerShare(input: PeerSealInput & { slot: string; provider: string; exp: Date }): PeerSealed {
  // The header carries whole seconds, so the life is judged on what the recipient reads.
  const life = Date.parse(second(input.exp)) - Date.parse(second(input.iat));
  if (!(life > 0 && life <= MAX_PEER_ENVELOPE_DAYS * DAY_MS)) throw new Error("lifetime-too-long: an envelope lives more than zero and at most 90 days");
  return seal(PEER_ENVELOPE_TYPE, input, { slot: input.slot, provider: input.provider, exp: second(input.exp) });
}

/** Seals a usage report to the sender's share `#kem` (DEC-0142 PS-8); the body is checked first. */
export function sealPeerReport(input: Omit<PeerSealInput, "plaintext"> & { body: unknown }): PeerSealed {
  if (!peerReportBody(input.body)) throw new Error("bad-body: the report's body is not a peer-share report body");
  return seal(PEER_REPORT_TYPE, { ...input, plaintext: Buffer.from(rfc8785(input.body), "utf8") }, {});
}

export const PEER_ENVELOPE_REFUSALS = ["malformed", "unsupported-alg", "wrong-share", "wrong-recipient", "bad-key", "bad-signature", "revoked", "replayed", "sequence-reused", "not-yet-valid", "lifetime-too-long", "expired", "cannot-open"] as const;
export type PeerEnvelopeRefusal = (typeof PEER_ENVELOPE_REFUSALS)[number];
export interface PeerMark { shareId: string; slot: string; sequence: number; digest: string }

/**
 * What the recipient's node holds for one share: its own share `#kem`, the sender's share `#sig` it confirmed in the
 * exchange, whether a revocation stands, its marks, and its clock (RFC 3339).
 */
export interface PeerEnvelopeContext { at: string; shareId: string; ownKem: PeerJwk; senderSig: PeerJwk; revoked?: boolean; marks?: PeerMark[] }

function marksRead(marks: unknown): marks is PeerMark[] | undefined {
  if (marks === undefined) return true;
  if (!Array.isArray(marks)) return false;
  const keys = new Set<string>();
  for (const mark of marks) {
    if (!isObject(mark) || !exactly(mark, ["shareId", "slot", "sequence", "digest"]) || !isString(mark.shareId) || !isString(mark.slot) || !counter(mark.sequence) || !isString(mark.digest) || !DIGEST.test(mark.digest)) return false;
    const key = `${mark.shareId}\u0000${mark.slot}`;
    if (keys.has(key)) return false;
    keys.add(key);
  }
  return true;
}

/**
 * Every check of a peer-share envelope short of opening it, in this order; the first that fails names the refusal:
 * `malformed` (a shape, or a context: clock, share id, keys, marks or a revocation flag, that does not read), `unsupported-alg`, `wrong-share`, `wrong-recipient`, `bad-key`
 * (an `enc` off the curve, or a signer other than the sender's confirmed share `#sig`), `bad-signature`, `revoked`,
 * `replayed` (a sequence below the mark for the share and slot) and `sequence-reused` (another envelope at the mark's
 * sequence; the same envelope again passes), `not-yet-valid` (`iat` more than 60 s ahead), `lifetime-too-long` (`exp`
 * not after `iat`, or more than 90 days), `expired`.
 */
export function checkPeerShareEnvelope(value: unknown, ctx: unknown): { ok: true; mark: PeerMark } | { ok: false; refusal: PeerEnvelopeRefusal } {
  const no = (refusal: PeerEnvelopeRefusal) => ({ ok: false as const, refusal });
  if (!peerSealedShape(value, PEER_ENVELOPE_TYPE) || !isObject(ctx)) return no("malformed");
  const at = instant(ctx.at);
  // A revocation flag that does not read fails closed, as marks and the clock do.
  if (at === undefined || !marksRead(ctx.marks) || !isString(ctx.shareId) || !peerJwk(ctx.ownKem) || !peerJwk(ctx.senderSig) || (ctx.revoked !== undefined && typeof ctx.revoked !== "boolean")) return no("malformed");
  const h = value.header;
  if (h.alg !== ALG) return no("unsupported-alg");
  if (h.shareId !== ctx.shareId) return no("wrong-share");
  if (h.recipient !== peerThumbprint(ctx.ownKem)) return no("wrong-recipient");
  if (p256KeyRefusal(Buffer.from(h.enc, "base64url")) !== null || h.signer !== peerThumbprint(ctx.senderSig)) return no("bad-key");
  if (verifyEs256(ctx.senderSig, signingInput(value), value.sig) !== true) return no("bad-signature");
  if (ctx.revoked === true) return no("revoked");
  const digest = peerDigest(value);
  const mark = (ctx.marks as PeerMark[] | undefined)?.find((m) => m.shareId === h.shareId && m.slot === h.slot);
  if (mark !== undefined) {
    if (h.sequence < mark.sequence) return no("replayed");
    if (h.sequence === mark.sequence && mark.digest !== digest) return no("sequence-reused");
  }
  const iat = instant(h.iat) as number, exp = instant(h.exp) as number;
  if (iat - at > CLOCK_SKEW_SECONDS * 1000) return no("not-yet-valid");
  if (exp <= iat || exp - iat > MAX_PEER_ENVELOPE_DAYS * DAY_MS) return no("lifetime-too-long");
  if (at >= exp) return no("expired");
  return { ok: true, mark: { shareId: h.shareId, slot: h.slot as string, sequence: h.sequence, digest } };
}

/** Checks, then opens with the recipient's share `#kem` private scalar. The node keeps the ciphertext and opens it at each use. */
export function openPeerShare(value: unknown, ctx: unknown, ownKemPrivateKey: Buffer): { ok: true; secret: Buffer; mark: PeerMark } | { ok: false; refusal: PeerEnvelopeRefusal } {
  const check = checkPeerShareEnvelope(value, ctx);
  if (!check.ok) return check;
  const sealed = value as PeerSealed;
  try {
    const secret = hpkeOpenBase(ownKemPrivateKey, Buffer.from(sealed.header.enc, "base64url"), Buffer.from(PEER_ENVELOPE_TYPE, "ascii"), Buffer.from(rfc8785(sealed.header), "utf8"), Buffer.from(sealed.ct, "base64url"));
    return { ok: true, secret, mark: check.mark };
  } catch {
    return { ok: false, refusal: "cannot-open" };
  }
}

// ---- The usage report -------------------------------------------------------------------------------------------

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const AGENT_NAME = /^[A-Za-z0-9][A-Za-z0-9 ._:@/-]{0,127}$/;

/**
 * A report's body (`peer-share-report.schema.json#/$defs/body`): per slot and UTC day the uses the recipient's node
 * counted, the last use, the consumer labels (agent names from its journal) and the exports made with the export
 * button; never a value, a command, an argument or an output. At most 400 entries in each list.
 */
export function peerReportBody(value: unknown): boolean {
  if (!isObject(value) || !exactly(value, ["days", "consumers", "exports"])) return false;
  const list = (v: unknown, ok: (entry: JsonObject) => boolean) => Array.isArray(v) && v.length <= 400 && v.every((entry) => isObject(entry) && ok(entry));
  const day = (entry: JsonObject) => exactly(entry, ["date", "slot", "uses", "lastUse"]) && isString(entry.date) && DATE.test(entry.date) && instant(`${entry.date}T00:00:00Z`) !== undefined
    && isString(entry.slot) && SLOT.test(entry.slot) && Number.isSafeInteger(entry.uses) && (entry.uses as number) >= 0 && (entry.lastUse === null || instant(entry.lastUse) !== undefined);
  const consumer = (entry: JsonObject) => exactly(entry, ["slot", "agent"]) && isString(entry.slot) && SLOT.test(entry.slot) && isString(entry.agent) && AGENT_NAME.test(entry.agent);
  const exported = (entry: JsonObject) => exactly(entry, ["slot", "at"]) && isString(entry.slot) && SLOT.test(entry.slot) && instant(entry.at) !== undefined;
  return list(value.days, day) && list(value.consumers, consumer) && list(value.exports, exported);
}

export type PeerReportRefusal = "malformed" | "unsupported-alg" | "wrong-share" | "wrong-recipient" | "bad-key" | "bad-signature" | "replayed" | "not-yet-valid" | "cannot-open" | "bad-body";
/** What the sender's node holds for one share: its own share `#kem`, the recipient's confirmed share `#sig`, the last report sequence it read, its clock. */
export interface PeerReportContext { at: string; shareId: string; ownKem: PeerJwk; recipientSig: PeerJwk; lastSequence?: number }

/**
 * A usage report's checks short of opening it, in order: `malformed`, `unsupported-alg`, `wrong-share`,
 * `wrong-recipient` (not the sender's share `#kem`), `bad-key` (an `enc` off the curve, a signer other than the
 * recipient's confirmed share `#sig`), `bad-signature`, `replayed` (a sequence not above the last one read; the mailbox
 * cannot move a report between shares or play one again), `not-yet-valid`.
 */
export function checkPeerReport(value: unknown, ctx: unknown): { ok: true; sequence: number } | { ok: false; refusal: PeerReportRefusal } {
  const no = (refusal: PeerReportRefusal) => ({ ok: false as const, refusal });
  if (!peerSealedShape(value, PEER_REPORT_TYPE) || !isObject(ctx)) return no("malformed");
  const at = instant(ctx.at);
  if (at === undefined || !isString(ctx.shareId) || !peerJwk(ctx.ownKem) || !peerJwk(ctx.recipientSig) || (ctx.lastSequence !== undefined && !(Number.isSafeInteger(ctx.lastSequence) && (ctx.lastSequence as number) >= 0))) return no("malformed");
  const h = value.header;
  if (h.alg !== ALG) return no("unsupported-alg");
  if (h.shareId !== ctx.shareId) return no("wrong-share");
  if (h.recipient !== peerThumbprint(ctx.ownKem)) return no("wrong-recipient");
  if (p256KeyRefusal(Buffer.from(h.enc, "base64url")) !== null || h.signer !== peerThumbprint(ctx.recipientSig)) return no("bad-key");
  if (verifyEs256(ctx.recipientSig, signingInput(value), value.sig) !== true) return no("bad-signature");
  if (h.sequence <= ((ctx.lastSequence as number | undefined) ?? 0)) return no("replayed");
  if ((instant(h.iat) as number) - at > CLOCK_SKEW_SECONDS * 1000) return no("not-yet-valid");
  return { ok: true, sequence: h.sequence };
}

/** Checks, then opens a report with the sender's share `#kem` private scalar, and reads its body. */
export function openPeerReport(value: unknown, ctx: unknown, ownKemPrivateKey: Buffer): { ok: true; body: JsonObject; sequence: number } | { ok: false; refusal: PeerReportRefusal } {
  const check = checkPeerReport(value, ctx);
  if (!check.ok) return check;
  const sealed = value as PeerSealed;
  let text: string;
  try {
    text = hpkeOpenBase(ownKemPrivateKey, Buffer.from(sealed.header.enc, "base64url"), Buffer.from(PEER_REPORT_TYPE, "ascii"), Buffer.from(rfc8785(sealed.header), "utf8"), Buffer.from(sealed.ct, "base64url")).toString("utf8");
  } catch {
    return { ok: false, refusal: "cannot-open" };
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, refusal: "bad-body" };
  }
  return peerReportBody(body) ? { ok: true, body: body as JsonObject, sequence: check.sequence } : { ok: false, refusal: "bad-body" };
}

// ---- Revocation and deletion --------------------------------------------------------------------------------------

/**
 * Whether a signed record stands: a `peer-share-revocation/1` the sender's share `#sig` signed, or a
 * `peer-share-deletion/1` the recipient's share `#sig` signed, naming a revocation by `peerDigest` of the signed
 * revocation; `sig` is ES256 over the RFC 8785 bytes of the record without `sig`. `signer` is the thumbprint of the key
 * given. Which revocation a receipt answers is not checked here: the sender's node compares the digest with its own.
 */
export function peerRecordStands(record: unknown, type: typeof PEER_REVOCATION_TYPE | typeof PEER_DELETION_TYPE, shareId: unknown, signerSig: unknown): { ok: true } | { ok: false; reason: "malformed" | "wrong-share" | "bad-key" | "bad-signature" } {
  const members = type === PEER_REVOCATION_TYPE ? ["type", "shareId", "at", "signer", "sig"] : ["type", "shareId", "at", "revocation", "signer", "sig"];
  if (!isObject(record) || record.type !== type || !exactly(record, members) || !isString(record.shareId) || !SHARE_ID.test(record.shareId) || instant(record.at) === undefined
    || !isString(record.signer) || !BYTES32.test(record.signer) || !isString(record.sig) || !SIG.test(record.sig)
    || (type === PEER_DELETION_TYPE && (!isString(record.revocation) || !DIGEST.test(record.revocation))) || !isString(shareId) || !peerJwk(signerSig)) return { ok: false, reason: "malformed" };
  if (record.shareId !== shareId) return { ok: false, reason: "wrong-share" };
  if (record.signer !== peerThumbprint(signerSig)) return { ok: false, reason: "bad-key" };
  const { sig, ...unsigned } = record;
  return verifyEs256(signerSig, rfc8785(unsigned), sig) === true ? { ok: true } : { ok: false, reason: "bad-signature" };
}

/**
 * Signs a revocation (the sender's share `#sig`) or a deletion receipt (the recipient's). Throws on a key that is not
 * the share `#sig` named, or a record `peerRecordStands` would refuse, so nothing unreadable is sent.
 */
export function signPeerRecord(record: Record<string, unknown>, signer: { sig: PeerJwk; privateKey: KeyObject }): JsonObject {
  signerKeyHolds(signer);
  const unsigned = { ...record, signer: peerThumbprint(signer.sig) };
  const signed = { ...unsigned, sig: signEs256(signer.privateKey, rfc8785(unsigned)) } as JsonObject;
  const type = record.type === PEER_DELETION_TYPE ? PEER_DELETION_TYPE : PEER_REVOCATION_TYPE;
  const stands = peerRecordStands(signed, type, record.shareId, signer.sig);
  if (!stands.ok) throw new Error(`${stands.reason}: the record would not stand`);
  return signed;
}
// #endregion peer-share
