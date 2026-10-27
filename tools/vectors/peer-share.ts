/**
 * The generator of the person-to-person share vectors (DEC-0142): `fixtures/vectors/peer-share.json`, shared by every
 * node that makes, claims, confirms, opens, reports on or takes back a share.
 *
 *   tsx tools/vectors/peer-share.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/peer-share.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/peer-share.test.ts` runs the check.
 * Thumbprints (RFC 7638), the claim MAC (HMAC-SHA-256), commitments, transcripts and codes are computed below from
 * peer-share.md's text with RFC 8785 from `src/canonical.ts` and SHA-256; envelopes and reports are sealed here with
 * HPKE base mode (`hpkeSealBase`, checked against RFC 9180 by `secret-envelope.json`) under an ephemeral scalar derived
 * from a published label and signed with RFC 6979 ES256, so a port reproduces each byte. Every verdict and refusal is
 * written by hand. Nothing here imports `src/peer-share.ts`: the gate then checks that the reference returns what this
 * file expects.
 */
import { createHash, createHmac } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";
import { hpkeSealBase } from "../../src/secret-envelope.js";
import { signDeterministic, testKey, type TestKey } from "./relay-crypto.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/peer-share.json";

const LABEL = "fabric-agent-contract/vectors/peer-share/";
const sha = (data: string | Buffer) => createHash("sha256").update(typeof data === "string" ? Buffer.from(data, "utf8") : data).digest();
const bytes32 = (label: string) => sha(`${LABEL}${label}`).toString("base64url");
const scalar = (key: TestKey) => Buffer.from(key.d.toString(16).padStart(64, "0"), "hex").toString("base64url");
/** RFC 7638: SHA-256 over the required members in lexicographic order with no whitespace. */
const thumb = (key: TestKey) => sha(`{"crv":"P-256","kty":"EC","x":"${key.jwk.x}","y":"${key.jwk.y}"}`).toString("base64url");

const K = {
  sSig: testKey("peer-share sender sig"), sKem: testKey("peer-share sender kem"),
  rSig: testKey("peer-share recipient sig"), rKem: testKey("peer-share recipient kem"),
  xSig: testKey("peer-share stranger sig"), xKem: testKey("peer-share stranger kem")
};
const keysOf = (sig: TestKey, kem: TestKey) => ({ sig: sig.jwk, kem: kem.jwk });
const SENDER = keysOf(K.sSig, K.sKem), RECIPIENT = keysOf(K.rSig, K.rKem), STRANGER = keysOf(K.xSig, K.xKem);
const SHARE = sha(`${LABEL}share id`).subarray(0, 16).toString("hex");
const OTHER_SHARE = sha(`${LABEL}another share id`).subarray(0, 16).toString("hex");
const CODE = sha(`${LABEL}claim code`).subarray(0, 16).toString("base64url");
const OTHER_CODE = sha(`${LABEL}another claim code`).subarray(0, 16).toString("base64url");
const FPR = thumb(K.sSig);
const ORIGIN = "https://mailbox.example";
const LINK = `${ORIGIN}/s/${SHARE}#c=${CODE}&k=${FPR}`;
const N_S = bytes32("sender nonce"), N_R = bytes32("recipient nonce"), N_X = bytes32("stranger nonce");
const AT = "2026-10-27T10:00:00Z", IAT = "2026-10-27T09:59:00Z", EXP = "2026-11-26T09:59:00Z", DEADLINE = "2026-11-03T10:00:00Z";
const SECRET = "or-key-minted-for-this-share";

const macOf = (code: string, shareId: string, keys: unknown, fpr: string) => createHmac("sha256", Buffer.from(code, "base64url")).update(rfc8785({ type: "fabric-peer-claim/1", shareId, keys, fpr }), "utf8").digest("base64url");
const commitOf = (role: string, shareId: string, keys: unknown, nonce: string) => `sha256:${sha(rfc8785({ type: "fabric-peer-commit/1", shareId, role, keys, nonce })).toString("hex")}`;
const codeOf = (shareId: string, sKeys: unknown, sNonce: string, rKeys: unknown, rNonce: string) => String(sha(rfc8785({ type: "fabric-peer-code/1", shareId, sender: { keys: sKeys, nonce: sNonce }, recipient: { keys: rKeys, nonce: rNonce } })).readUIntBE(0, 5) % 1_000_000).padStart(6, "0");
const side = (role: string, keys: unknown, nonce: string, shareId = SHARE) => ({ role, shareId, keys, nonce });
const frame = (step: string, members: Json): Json => ({ schema: "peer-share-frame/1", step, ...members });
const C_S = commitOf("sender", SHARE, SENDER, N_S), C_R = commitOf("recipient", SHARE, RECIPIENT, N_R);
const CLAIM = frame("claim", { shareId: SHARE, keys: RECIPIENT, mac: macOf(CODE, SHARE, RECIPIENT, FPR), commit: C_R });
const COMMIT = frame("commit", { shareId: SHARE, keys: SENDER, commit: C_S });
const REVEAL_R = frame("reveal", { role: "recipient", shareId: SHARE, nonce: N_R });
const REVEAL_S = frame("reveal", { role: "sender", shareId: SHARE, nonce: N_S });
const ABORT_R = frame("abort", { role: "recipient", shareId: SHARE });

function keys(): Json[] {
  return Object.entries(K).map(([name, key]) => ({ name, jwk: key.jwk, d: scalar(key), thumbprint: thumb(key) }));
}

function links(): Json[] {
  const ok = { ok: true, link: { origin: ORIGIN, shareId: SHARE, code: CODE, fpr: FPR } };
  const bad = { ok: false, problem: "malformed" };
  return [
    { name: "the link as the sender's node writes it", link: LINK, expect: ok },
    { name: "the fragment's two members in the other order", link: `${ORIGIN}/s/${SHARE}#k=${FPR}&c=${CODE}`, expect: ok },
    { name: "a port in the origin", link: `https://mailbox.example:8443/s/${SHARE}#c=${CODE}&k=${FPR}`, expect: { ok: true, link: { ...ok.link, origin: "https://mailbox.example:8443" } } },
    { name: "plain HTTP", link: LINK.replace("https:", "http:"), expect: bad },
    { name: "user information in the authority", link: `https://a@mailbox.example/s/${SHARE}#c=${CODE}&k=${FPR}`, expect: bad },
    { name: "an empty user information, which URL normalisation drops", link: `https://:@mailbox.example/s/${SHARE}#c=${CODE}&k=${FPR}`, expect: ok },
    { name: "a query", link: `${ORIGIN}/s/${SHARE}?x=1#c=${CODE}&k=${FPR}`, expect: bad },
    { name: "a third fragment member", link: `${LINK}&x=1`, expect: bad },
    { name: "the code twice", link: `${ORIGIN}/s/${SHARE}#c=${CODE}&c=${CODE}`, expect: bad },
    { name: "no fingerprint", link: `${ORIGIN}/s/${SHARE}#c=${CODE}`, expect: bad },
    { name: "a code of 15 bytes", link: `${ORIGIN}/s/${SHARE}#c=${CODE.slice(0, 20)}&k=${FPR}`, expect: bad },
    { name: "a share id in upper case", link: `${ORIGIN}/s/${SHARE.toUpperCase()}#c=${CODE}&k=${FPR}`, expect: bad },
    { name: "another path", link: `${ORIGIN}/share/${SHARE}#c=${CODE}&k=${FPR}`, expect: bad },
    { name: "a space", link: `${LINK} `, expect: bad },
    { name: "an authority that does not parse", link: `https://[/s/${SHARE}#c=${CODE}&k=${FPR}`, expect: bad },
    { name: "not a string", link: 7, expect: bad }
  ];
}

function claims(): Json[] {
  const link = { origin: ORIGIN, shareId: SHARE, code: CODE, fpr: FPR };
  return [
    { name: "the recipient's claim under the link's code", link, frame: CLAIM, mac: CLAIM.mac, holds: true },
    { name: "a claim whose MAC another code made", link, frame: { ...CLAIM, mac: macOf(OTHER_CODE, SHARE, RECIPIENT, FPR) }, holds: false },
    { name: "a claim that swaps in other keys under the recipient's MAC", link, frame: { ...CLAIM, keys: STRANGER }, holds: false },
    { name: "a claim of another share", link, frame: { ...CLAIM, shareId: OTHER_SHARE }, holds: false },
    { name: "a holder of the code claims with its own keys: the MAC holds, the comparison code is the defence", link, frame: { ...CLAIM, keys: STRANGER, mac: macOf(CODE, SHARE, STRANGER, FPR), commit: commitOf("recipient", SHARE, STRANGER, N_X) }, holds: true }
  ];
}

function pins(): Json[] {
  const link = { origin: ORIGIN, shareId: SHARE, code: CODE, fpr: FPR };
  return [
    { name: "the sender's commit names the share #sig the link pins", link, frame: COMMIT, holds: true },
    { name: "a commit with another #sig", link, frame: { ...COMMIT, keys: STRANGER }, holds: false },
    { name: "a claim is no commit", link, frame: CLAIM, holds: false }
  ];
}

function codes(): Json[] {
  const code = codeOf(SHARE, SENDER, N_S, RECIPIENT, N_R);
  return [
    { name: "both reveals open their commitments", senderCommit: C_S, sender: side("sender", SENDER, N_S), recipientCommit: C_R, recipient: side("recipient", RECIPIENT, N_R), expect: { ok: true, code } },
    { name: "a party in the middle, toward the sender: another code", senderCommit: C_S, sender: side("sender", SENDER, N_S), recipientCommit: commitOf("recipient", SHARE, STRANGER, N_X), recipient: side("recipient", STRANGER, N_X), expect: { ok: true, code: codeOf(SHARE, SENDER, N_S, STRANGER, N_X) } },
    { name: "a recipient nonce other than its commitment's", senderCommit: C_S, sender: side("sender", SENDER, N_S), recipientCommit: C_R, recipient: side("recipient", RECIPIENT, N_X), expect: { ok: false, problem: "commit-mismatch" } },
    { name: "the two reveals in each other's role", senderCommit: C_R, sender: side("recipient", RECIPIENT, N_R), recipientCommit: C_S, recipient: side("sender", SENDER, N_S), expect: { ok: false, problem: "role-mismatch" } },
    { name: "a reveal of another share", senderCommit: commitOf("sender", OTHER_SHARE, SENDER, N_S), sender: side("sender", SENDER, N_S, OTHER_SHARE), recipientCommit: C_R, recipient: side("recipient", RECIPIENT, N_R), expect: { ok: false, problem: "share-mismatch" } },
    { name: "the sender's own keys on the recipient's side", senderCommit: C_S, sender: side("sender", SENDER, N_S), recipientCommit: commitOf("recipient", SHARE, SENDER, N_R), recipient: side("recipient", SENDER, N_R), expect: { ok: false, problem: "same-keys" } },
    { name: "a nonce of 31 bytes", senderCommit: C_S, sender: side("sender", SENDER, N_S.slice(0, 42)), recipientCommit: C_R, recipient: side("recipient", RECIPIENT, N_R), expect: { ok: false, problem: "bad-nonce" } },
    { name: "one key in both roles", senderCommit: C_S, sender: side("sender", { sig: K.sSig.jwk, kem: K.sSig.jwk }, N_S), recipientCommit: C_R, recipient: side("recipient", RECIPIENT, N_R), expect: { ok: false, problem: "bad-keys" } }
  ];
}

function exchanges(): Json[] {
  const run = (name: string, frames: unknown[], expect: Json, at = AT, shareId = SHARE) => ({ name, shareId, claimDeadline: DEADLINE, at, frames, expect });
  return [
    run("claim, commit, both reveals", [CLAIM, COMMIT, REVEAL_R, REVEAL_S], { state: "complete" }),
    run("the sender reveals first", [CLAIM, COMMIT, REVEAL_S, REVEAL_R], { state: "complete" }),
    run("waiting for the sender", [CLAIM], { state: "open" }),
    run("one reveal so far", [CLAIM, COMMIT, REVEAL_R], { state: "open" }),
    run("the claim deadline passes before completion", [CLAIM, COMMIT], { state: "burnt", reason: "expired", index: 2 }, "2026-11-03T10:00:01Z"),
    run("read exactly at the claim deadline: still open", [CLAIM, COMMIT], { state: "open" }, DEADLINE),
    run("a completed exchange does not expire", [CLAIM, COMMIT, REVEAL_R, REVEAL_S], { state: "complete" }, "2026-11-04T00:00:00Z"),
    run("a reveal before the sender committed", [CLAIM, REVEAL_R], { state: "burnt", reason: "out-of-order", index: 1 }),
    run("a commit before any claim", [COMMIT], { state: "burnt", reason: "out-of-order", index: 0 }),
    run("a second claim: one claim per link", [CLAIM, CLAIM], { state: "burnt", reason: "repeated", index: 1 }),
    run("a second commit", [CLAIM, COMMIT, COMMIT], { state: "burnt", reason: "repeated", index: 2 }),
    run("a recipient reveals twice", [CLAIM, COMMIT, REVEAL_R, REVEAL_R], { state: "burnt", reason: "repeated", index: 3 }),
    run("a reveal that does not open its commitment", [CLAIM, COMMIT, frame("reveal", { role: "recipient", shareId: SHARE, nonce: N_X })], { state: "burnt", reason: "commit-mismatch", index: 2 }),
    run("an abort before completion", [CLAIM, COMMIT, ABORT_R], { state: "burnt", reason: "aborted", index: 2 }),
    run("an abort before any claim: aborted, not out of order", [ABORT_R], { state: "burnt", reason: "aborted", index: 0 }),
    run("the codes differ: one abort after completion", [CLAIM, COMMIT, REVEAL_R, REVEAL_S, ABORT_R], { state: "burnt", reason: "aborted", index: 4 }),
    run("anything after that abort", [CLAIM, COMMIT, REVEAL_R, REVEAL_S, ABORT_R, ABORT_R], { state: "burnt", reason: "closed", index: 5 }),
    run("a second frame after completion that is no abort", [CLAIM, COMMIT, REVEAL_R, REVEAL_S, REVEAL_S], { state: "burnt", reason: "closed", index: 4 }),
    run("a second claim after completion", [CLAIM, COMMIT, REVEAL_R, REVEAL_S, CLAIM], { state: "burnt", reason: "closed", index: 4 }),
    run("a claim whose MAC does not hold, first: it is the link's one claim, and the holder's claim burns it", [{ ...CLAIM, keys: STRANGER, mac: macOf(OTHER_CODE, SHARE, STRANGER, FPR), commit: commitOf("recipient", SHARE, STRANGER, N_X) }, CLAIM], { state: "burnt", reason: "repeated", index: 1 }),
    run("a frame of another share", [CLAIM, { ...COMMIT, shareId: OTHER_SHARE }], { state: "burnt", reason: "malformed", index: 1 }),
    run("a frame with a member more", [{ ...CLAIM, note: "x" }], { state: "burnt", reason: "malformed", index: 0 }),
    run("a claim whose keys are one key twice", [{ ...CLAIM, keys: { sig: K.rSig.jwk, kem: K.rSig.jwk } }], { state: "burnt", reason: "malformed", index: 0 }),
    run("a claim whose MAC is not 32 bytes", [{ ...CLAIM, mac: "short" }], { state: "burnt", reason: "malformed", index: 0 }),
    run("a reveal in no role", [CLAIM, COMMIT, { ...REVEAL_R, role: "witness" }], { state: "burnt", reason: "malformed", index: 2 }),
    run("a reveal whose nonce is not 32 bytes", [CLAIM, COMMIT, { ...REVEAL_R, nonce: N_R.slice(0, 40) }], { state: "burnt", reason: "malformed", index: 2 }),
    run("a step that does not exist", [frame("accept", { shareId: SHARE })], { state: "burnt", reason: "malformed", index: 0 }),
    run("a commit that reflects the claim's own keys: open; the code refuses it", [CLAIM, { ...COMMIT, keys: RECIPIENT, commit: commitOf("sender", SHARE, RECIPIENT, N_S) }], { state: "open" }),
    run("a frame of another shape after that abort: malformed wherever it comes", [CLAIM, COMMIT, REVEAL_R, REVEAL_S, ABORT_R, { bad: 1 }], { state: "burnt", reason: "malformed", index: 5 }),
    run("a clock that does not read", [CLAIM], { state: "burnt", reason: "malformed", index: -1 }, "today")
  ];
}

type Signer = { key: TestKey };
/** A sealed message to `recipient` under `header`, signed by `signer` over the RFC 8785 bytes of {header, ct}. */
function sealed(type: string, over: Json, signer: Signer, recipient: TestKey, label: string, plaintext: Buffer): Json {
  const ephemeral = sha(`${LABEL}ephemeral/${label}`);
  const pk = Buffer.from(recipient.octets, "base64");
  const enc = hpkeSealBase(pk, Buffer.from(type, "ascii"), Buffer.alloc(0), Buffer.alloc(0), ephemeral).enc;
  const header: Json = { type, alg: "ES256", suite: [16, 1, 1], recipient: thumb(recipient), signer: thumb(signer.key), shareId: SHARE, ...over, enc: enc.toString("base64url") };
  for (const key of Object.keys(header)) if (header[key] === undefined) delete header[key];
  const { ct } = hpkeSealBase(pk, Buffer.from(type, "ascii"), Buffer.from(rfc8785(header), "utf8"), plaintext, ephemeral);
  const unsigned = { header, ct: ct.toString("base64url") };
  return { ...unsigned, sig: signDeterministic(signer.key.d, rfc8785(unsigned)) };
}
const ENV = "fabric-peer-share-envelope/1";
const envelope = (over: Json, label: string, signer: Signer = { key: K.sSig }, recipient: TestKey = K.rKem) =>
  sealed(ENV, { slot: "OPENROUTER_API_KEY", provider: "openrouter", sequence: 1, iat: IAT, exp: EXP, ...over }, signer, recipient, label, Buffer.from(SECRET, "utf8"));
const digestOf = (value: unknown) => `sha256:${sha(rfc8785(value)).toString("hex")}`;

function envelopes(): Json[] {
  const ctx = (over: Json = {}): Json => ({ at: AT, shareId: SHARE, ownKem: K.rKem.jwk, senderSig: K.sSig.jwk, ...over });
  const ok = (env: Json) => ({ ok: true, mark: { shareId: SHARE, slot: env.header.slot, sequence: env.header.sequence, digest: digestOf(env) } });
  const no = (refusal: string) => ({ ok: false, refusal });
  const env = envelope({}, "ok");
  const tampered = { ...env, ct: `${String(env.ct).slice(0, 8)}${String(env.ct)[8] === "A" ? "B" : "A"}${String(env.ct).slice(9)}` };
  const mark = (sequence: number, digest: string) => [{ shareId: SHARE, slot: "OPENROUTER_API_KEY", sequence, digest }];
  const cases: Array<[string, unknown, Json, Json]> = [
    ["a share's value, in its window", env, ctx(), ok(env)],
    ["the same envelope again (a renewal reuses it) passes at its mark", env, ctx({ marks: mark(1, digestOf(env)) }), ok(env)],
    ["a member more", { ...env, note: "x" }, ctx(), no("malformed")],
    ["a header that carries the value", envelope({ value: SECRET }, "value"), ctx(), no("malformed")],
    ["a clock that does not read", env, ctx({ at: "2026-10-27 10:00" }), no("malformed")],
    ["marks that do not read", env, ctx({ marks: "x" }), no("malformed")],
    ["signed ES384", envelope({ alg: "ES384" }, "es384"), ctx(), no("unsupported-alg")],
    ["another share's envelope", envelope({ shareId: OTHER_SHARE }, "other-share"), ctx(), no("wrong-share")],
    ["sealed to another key", envelope({}, "stranger-kem", { key: K.sSig }, K.xKem), ctx(), no("wrong-recipient")],
    ["the recipient's device key is never the share's: an envelope to the share kem on a node that names another", env, ctx({ ownKem: K.xKem.jwk }), no("wrong-recipient")],
    ["signed by a key other than the sender's confirmed share #sig", envelope({}, "stranger-sig", { key: K.xSig }), ctx(), no("bad-key")],
    ["an enc that is no point of the curve", { ...env, header: { ...env.header, enc: Buffer.alloc(65, 4).toString("base64url") } }, ctx(), no("bad-key")],
    ["one character of the ciphertext changed", tampered, ctx(), no("bad-signature")],
    ["the sender's thumbprint, another key's signature", { ...envelope({}, "forged", { key: K.xSig }), header: { ...envelope({}, "forged", { key: K.xSig }).header, signer: thumb(K.sSig) } }, ctx(), no("bad-signature")],
    ["a share taken back", env, ctx({ revoked: true }), no("revoked")],
    ["a revocation flag that does not read", env, ctx({ revoked: "yes" }), no("malformed")],
    ["a sequence below the mark", env, ctx({ marks: mark(2, "sha256:" + "0".repeat(64)) }), no("replayed")],
    ["another envelope at the mark's sequence", env, ctx({ marks: mark(1, "sha256:" + "0".repeat(64)) }), no("sequence-reused")],
    ["marks that name one share and slot twice", env, ctx({ marks: [...mark(1, digestOf(env)), ...mark(1, digestOf(env))] }), no("malformed")],
    ["a mark of another slot does not apply", env, ctx({ marks: [{ shareId: SHARE, slot: "OTHER_KEY", sequence: 9, digest: "sha256:" + "0".repeat(64) }] }), ok(env)],
    ["issued more than 60 s ahead of the clock", env, ctx({ at: "2026-10-27T09:57:59Z" }), no("not-yet-valid")],
    ["issued exactly 60 s ahead of the clock", env, ctx({ at: "2026-10-27T09:58:00Z" }), ok(env)],
    ["an envelope that lives more than 90 days", envelope({ exp: "2027-01-25T09:59:01Z" }, "long"), ctx(), no("lifetime-too-long")],
    ["an envelope whose exp is its iat", envelope({ exp: IAT }, "no-life"), ctx(), no("lifetime-too-long")],
    ["a node key that does not read", env, ctx({ ownKem: { kty: "EC" } }), no("malformed")],
    ["an envelope of exactly 90 days", envelope({ exp: "2027-01-25T09:59:00Z" }, "ninety"), ctx(), ok(envelope({ exp: "2027-01-25T09:59:00Z" }, "ninety"))],
    ["an envelope past its exp", env, ctx({ at: EXP }), no("expired")],
    ["a time with an offset, not UTC", envelope({ iat: "2026-10-27T10:59:00+01:00" }, "offset"), ctx(), no("malformed")]
  ];
  return cases.map(([name, envelope, context, expect]) => ({ name, envelope, context, expect }));
}

const REPORT = "fabric-peer-share-report/1";
const BODY = { days: [{ date: "2026-10-27", slot: "OPENROUTER_API_KEY", uses: 3, lastUse: "2026-10-27T09:40:00Z" }], consumers: [{ slot: "OPENROUTER_API_KEY", agent: "claude-code" }], exports: [] };
const report = (over: Json, label: string, body: unknown = BODY, signer: Signer = { key: K.rSig }, recipient: TestKey = K.sKem) =>
  sealed(REPORT, { sequence: 1, iat: IAT, ...over }, signer, recipient, label, Buffer.from(rfc8785(body), "utf8"));

function reports(): Json[] {
  const ctx = (over: Json = {}): Json => ({ at: AT, shareId: SHARE, ownKem: K.sKem.jwk, recipientSig: K.rSig.jwk, ...over });
  const no = (refusal: string) => ({ ok: false, refusal });
  const rep = report({}, "ok");
  const cases: Array<[string, unknown, Json, Json]> = [
    ["the recipient's report, read by the sender", rep, ctx(), { ok: true, sequence: 1, body: BODY }],
    ["the next report after sequence 1", report({ sequence: 2 }, "next"), ctx({ lastSequence: 1 }), { ok: true, sequence: 2, body: BODY }],
    ["a report played again", rep, ctx({ lastSequence: 1 }), no("replayed")],
    ["a body that names an export made with the button", report({}, "export", { ...BODY, exports: [{ slot: "OPENROUTER_API_KEY", at: "2026-10-27T09:50:00Z" }] }), ctx(), { ok: true, sequence: 1, body: { ...BODY, exports: [{ slot: "OPENROUTER_API_KEY", at: "2026-10-27T09:50:00Z" }] } }],
    ["signed ES384", report({ alg: "ES384" }, "es384"), ctx(), no("unsupported-alg")],
    ["one character of the ciphertext changed", { ...rep, ct: `${String(rep.ct).slice(0, 8)}${String(rep.ct)[8] === "A" ? "B" : "A"}${String(rep.ct).slice(9)}` }, ctx(), no("bad-signature")],
    ["a last sequence that does not read", rep, ctx({ lastSequence: -1 }), no("malformed")],
    ["a node key that does not read", rep, ctx({ ownKem: { kty: "EC" } }), no("malformed")],
    ["a member more", { ...rep, note: "x" }, ctx(), no("malformed")],
    ["a report of another share", report({ shareId: OTHER_SHARE }, "other-share"), ctx(), no("wrong-share")],
    ["sealed to another key", report({}, "stranger-kem", BODY, { key: K.rSig }, K.xKem), ctx(), no("wrong-recipient")],
    ["signed by a key other than the recipient's confirmed share #sig", report({}, "stranger-sig", BODY, { key: K.xSig }), ctx(), no("bad-key")],
    ["issued more than 60 s ahead of the clock", rep, ctx({ at: "2026-10-27T09:57:59Z" }), no("not-yet-valid")],
    ["issued exactly 60 s ahead of the clock", rep, ctx({ at: "2026-10-27T09:58:00Z" }), { ok: true, sequence: 1, body: BODY }],
    ["a body that carries a value", report({}, "value-body", { ...BODY, value: SECRET }), ctx(), no("bad-body")],
    ["a body with a negative count", report({}, "negative", { ...BODY, days: [{ ...BODY.days[0], uses: -1 }] }), ctx(), no("bad-body")],
    ["a body that is no JSON", sealed(REPORT, { sequence: 1, iat: IAT }, { key: K.rSig }, K.sKem, "not-json", Buffer.from("uses: 3", "utf8")), ctx(), no("bad-body")],
    ["sealed to another key under the sender's thumbprint: the checks pass and it does not open", sealed(REPORT, { recipient: thumb(K.sKem), sequence: 1, iat: IAT }, { key: K.rSig }, K.xKem, "misdirected", Buffer.from(rfc8785(BODY), "utf8")), ctx(), no("cannot-open")],
    ["a time with an offset, not UTC", report({ iat: "2026-10-27T10:59:00+01:00" }, "offset"), ctx(), no("malformed")]
  ];
  return cases.map(([name, sealedReport, context, expect]) => ({ name, report: sealedReport, context, expect }));
}

function records(): Json[] {
  const sign = (record: Json, key: TestKey): Json => {
    const unsigned = { ...record, signer: thumb(key) };
    return { ...unsigned, sig: signDeterministic(key.d, rfc8785(unsigned)) };
  };
  const revocation = sign({ type: "peer-share-revocation/1", shareId: SHARE, at: "2026-10-28T10:00:00Z" }, K.sSig);
  const deletion = sign({ type: "peer-share-deletion/1", shareId: SHARE, at: "2026-10-28T10:05:00Z", revocation: digestOf(revocation) }, K.rSig);
  return [
    { name: "the sender's revocation", record: revocation, type: "peer-share-revocation/1", shareId: SHARE, signerSig: K.sSig.jwk, expect: { ok: true } },
    { name: "the recipient's deletion receipt naming it", record: deletion, type: "peer-share-deletion/1", shareId: SHARE, signerSig: K.rSig.jwk, expect: { ok: true } },
    { name: "a revocation checked under the recipient's key", record: revocation, type: "peer-share-revocation/1", shareId: SHARE, signerSig: K.rSig.jwk, expect: { ok: false, reason: "bad-key" } },
    { name: "a revocation with its time changed", record: { ...revocation, at: "2026-10-28T11:00:00Z" }, type: "peer-share-revocation/1", shareId: SHARE, signerSig: K.sSig.jwk, expect: { ok: false, reason: "bad-signature" } },
    { name: "a revocation of another share", record: revocation, type: "peer-share-revocation/1", shareId: OTHER_SHARE, signerSig: K.sSig.jwk, expect: { ok: false, reason: "wrong-share" } },
    { name: "a deletion receipt that names no revocation", record: (({ revocation: _r, ...rest }) => rest)(deletion), type: "peer-share-deletion/1", shareId: SHARE, signerSig: K.rSig.jwk, expect: { ok: false, reason: "malformed" } },
    { name: "a revocation read as a deletion receipt", record: revocation, type: "peer-share-deletion/1", shareId: SHARE, signerSig: K.sSig.jwk, expect: { ok: false, reason: "malformed" } },
    { name: "a revocation dated with an offset, not UTC", record: sign({ type: "peer-share-revocation/1", shareId: SHARE, at: "2026-10-28T11:00:00+01:00" }, K.sSig), type: "peer-share-revocation/1", shareId: SHARE, signerSig: K.sSig.jwk, expect: { ok: false, reason: "malformed" } }
  ];
}

function peerShareVectors(): Json {
  return {
    about: "DEC-0142 (docs/specification/peer-share.md): a credential shared from one person's estate with another person's. keys: the share key pairs (P-256 public JWKs, their private scalars d as unpadded base64url, their RFC 7638 thumbprints); links: parseShareLink; claims: claimMac and claimHolds; pins: pinHolds; codes: checkedPeerCode; exchanges: peerExchangeVerdict(shareId, claimDeadline, frames, at); envelopes: checkPeerShareEnvelope(envelope, context), and openPeerShare with the recipient's share #kem scalar answers the secret; reports: checkPeerReport and openPeerReport with the sender's share #kem scalar (a refusal from either, or {ok, sequence, body}); records: peerRecordStands(record, type, shareId, signerSig).",
    secret: SECRET,
    keys: keys(),
    links: links(),
    claims: claims(),
    pins: pins(),
    codes: codes(),
    exchanges: exchanges(),
    envelopes: envelopes(),
    reports: reports(),
    records: records()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildPeerShareVectors(): string {
  return `${JSON.stringify(peerShareVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildPeerShareVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}
