/**
 * The generator of the enroll-token vectors (DEC-0084): `fixtures/vectors/enroll-token.json`.
 *
 *   tsx tools/vectors/enroll-token.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/enroll-token.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/enroll-token.test.ts` runs the check.
 * Each token is signed here by the EdDSA test passkey of `fixtures/vectors/estate-record.json` (Ed25519 is
 * deterministic, so the file is the same on every run): the statement's bytes are RFC 8785 from `src/canonical.ts`, the
 * challenge their SHA-256, the assertion WebAuthn Level 3's `authenticatorData ‖ SHA-256(clientDataJSON)`. Every verdict
 * is written by hand. Nothing here imports `src/enroll-token.ts` or `src/signing-challenges.ts`.
 */
import { createECDH, createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";
import { signDeterministic } from "./relay-crypto.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/enroll-token.json";

const root = projectRoot();
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const sha = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest();

/** The vectors as an object. */
export function enrollTokenVectors(): Json {
  const estateVectors = read("fixtures/vectors/estate-record.json");
  const record = read("fixtures/positive/estate-record-first.json");
  const passkey = estateVectors.keys.passkeyEdDSA;
  const authority = passkey.authority;
  const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(passkey.seed, "hex")]), format: "der", type: "pkcs8" });

  /** A passkey assertion by the EdDSA test passkey over SHA-256 of the statement's RFC 8785 form. */
  const assert = (statement: Json, origin: string = authority.origins[0]) => {
    const challenge = sha(Buffer.from(rfc8785(statement), "utf8"));
    const clientData = Buffer.from(JSON.stringify({ type: "webauthn.get", challenge: challenge.toString("base64url"), origin }));
    const authData = Buffer.concat([sha(authority.rpId), Buffer.from([0x05]), Buffer.alloc(4)]);
    const sig = sign(null, Buffer.concat([authData, sha(clientData)]), privateKey);
    return { format: "webauthn-assertion", credentialId: authority.credentialId, alg: "EdDSA", authenticatorData: authData.toString("base64url"), clientDataJSON: clientData.toString("base64url"), sig: sig.toString("base64url") };
  };
  const statement: Json = {
    type: "enroll-token/1",
    scope: `estate:${record.estate}`,
    genesis: record.digest,
    purpose: "agent-host",
    ceiling: null,
    notBefore: "2026-10-15T09:00:00Z",
    expiresAt: "2026-10-15T09:15:00Z",
    nonce: sha("enroll-token vectors nonce 1").toString("base64url"),
    uses: 1
  };
  const token = (changes: Json = {}) => {
    const s = { ...statement, ...changes };
    return { schema: "enroll-token/1", statement: s, signature: assert(s) };
  };
  const good = token();
  const at = (iso: string) => iso;
  const ok = { ok: true, nonce: statement.nonce, expiresAt: statement.expiresAt, signedBy: authority.credentialId };
  const refused = (problem: string) => ({ ok: false, problem });
  const genesis = record.digest;
  const otherAuthorityRecord = { ...record, authorities: [record.authorities[0]] };

  const verify: Json[] = [
    { name: "a token Fabric issued for 15 minutes, at its start", token: good, at: at("2026-10-15T09:00:00Z"), answer: ok },
    { name: "60 s before notBefore is within the clock skew", token: good, at: at("2026-10-15T08:59:00Z"), answer: ok },
    { name: "61 s before notBefore is not yet valid", token: good, at: at("2026-10-15T08:58:59Z"), answer: refused("not-yet-valid") },
    { name: "at exactly expiresAt it is still valid", token: good, at: at("2026-10-15T09:15:00Z"), answer: ok },
    { name: "one second after expiresAt it has expired", token: good, at: at("2026-10-15T09:15:01Z"), answer: refused("expired") },
    { name: "a window of exactly 900 s is accepted", token: good, at: at("2026-10-15T09:10:00Z"), answer: ok },
    { name: "a window of 901 s is too long-lived, though validly signed", token: token({ expiresAt: "2026-10-15T09:15:01Z" }), at: at("2026-10-15T09:01:00Z"), answer: refused("too-long-lived") },
    { name: "an expiry equal to notBefore is too long-lived (no window)", token: token({ expiresAt: "2026-10-15T09:00:00Z" }), at: at("2026-10-15T09:00:00Z"), answer: refused("too-long-lived") },
    { name: "an expiry before notBefore is too long-lived (no window)", token: token({ expiresAt: "2026-10-15T08:59:00Z" }), at: at("2026-10-15T09:00:00Z"), answer: refused("too-long-lived") },
    { name: "a ceiling digest is signed in and accepted", token: token({ ceiling: `sha256:${"ab".repeat(32)}` }), at: at("2026-10-15T09:01:00Z"), answer: ok },
    { name: "a token for another estate", token: token({ scope: "estate:estate-other" }), at: at("2026-10-15T09:01:00Z"), answer: refused("wrong-estate") },
    { name: "a token whose genesis is not the revision 1 the verifier holds (a chain forged around a copied public key)", token: token({ genesis: `sha256:${"cd".repeat(32)}` }), at: at("2026-10-15T09:01:00Z"), answer: refused("wrong-estate") },
    { name: "a nonce changed after signing: the challenge is rebuilt from the statement", token: { ...good, statement: { ...statement, nonce: sha("another nonce").toString("base64url") } }, at: at("2026-10-15T09:01:00Z"), answer: refused("wrong-challenge") },
    { name: "an expiry moved after signing", token: { ...good, statement: { ...statement, expiresAt: "2026-10-15T09:10:00Z" } }, at: at("2026-10-15T09:01:00Z"), answer: refused("wrong-challenge") },
    { name: "a ceremony in an origin the passkey does not pin", token: { ...good, signature: assert(statement, "https://sign.example.net") }, at: at("2026-10-15T09:01:00Z"), answer: refused("wrong-origin") },
    { name: "a passkey the revision does not list", token: good, record: otherAuthorityRecord, at: at("2026-10-15T09:01:00Z"), answer: refused("unknown-authority") },
    { name: "a passkey the revision revokes", token: good, record: { ...record, revocations: [{ kind: "authority", ref: authority.credentialId, revokedAt: "2026-10-14T00:00:00Z" }] }, at: at("2026-10-15T09:01:00Z"), answer: refused("revoked-authority") },
    { name: "a passkey listed twice", token: good, record: { ...record, authorities: [...record.authorities, authority] }, at: at("2026-10-15T09:01:00Z"), answer: refused("duplicate-authority") },
    { name: "a revision with no passkey", token: good, record: { ...record, authorities: [] }, at: at("2026-10-15T09:01:00Z"), answer: refused("no-trusted-authority") },
    { name: "a purpose other than agent-host", token: token({ purpose: "admin" }), at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "lax: a token for two uses", token: token({ uses: 2 }), at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "lax: a token without its ceiling member (absent is not null)", token: (() => { const { ceiling: _c, ...s } = statement; return { schema: "enroll-token/1", statement: s, signature: assert(s) }; })(), at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "a statement with a member the register does not list", token: token({ machine: "m-7b2d" }), at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "lax: an expiry without an offset", token: token({ expiresAt: "2026-10-15T09:15:00" }), at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "a nonce of 31 bytes", token: token({ nonce: sha("short").subarray(0, 31).toString("base64url") }), at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "another schema", token: { ...good, schema: "enroll-token/2" }, at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "a statement of another type", token: { ...good, statement: { ...statement, type: "limits/1" } }, at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "a signature that is not a WebAuthn assertion", token: { ...good, signature: { ...good.signature, format: "jws" } }, at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "lax: an unsigned member beside the statement (a ceiling the passkey never signed)", token: { ...good, ceiling: `sha256:${"ab".repeat(32)}` }, at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") },
    { name: "lax: an assertion with a member the schema does not list (a user handle)", token: { ...good, signature: { ...good.signature, userHandle: "dXNlcg" } }, at: at("2026-10-15T09:01:00Z"), answer: refused("malformed") }
  ];

  // The hub's single use: a ledger from nonce to entry, as [nonce, entry] pairs, and the joining key's proof over the
  // register's enroll-join/1 statement {digest of the token's statement, nonce}.
  const machineD = BigInt(`0x${sha("fabric-agent-contract pairing vectors new sig").toString("hex")}`);
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(sha("fabric-agent-contract pairing vectors new sig"));
  const machineKey = { kid: "m-7b2d#sig", use: "sig", alg: "es256", publicKey: ecdh.getPublicKey().toString("base64") };
  const fingerprint = `sha256:${sha(Buffer.from(machineKey.publicKey, "base64")).toString("hex")}`;
  const otherFingerprint = `sha256:${"ef".repeat(32)}`;
  const n = statement.nonce as string;
  const joinInput = (tok: Json) => rfc8785({ type: "enroll-join/1", digest: `sha256:${sha(Buffer.from(rfc8785(tok.statement), "utf8")).toString("hex")}`, nonce: tok.statement.nonce });
  const proof = signDeterministic(machineD, joinInput(good));
  const otherToken = token({ nonce: sha("enroll-token vectors nonce 2").toString("base64url") });
  // An Ed25519 #sig key proves the same way, with its 64-byte signature.
  const edSeed = sha("fabric-agent-contract enroll-token vectors ed25519 machine");
  const edKey = createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), edSeed]), format: "der", type: "pkcs8" });
  const edMachineKey = { kid: "m-9b31#sig", use: "sig", alg: "ed25519", publicKey: Buffer.from((edKey.export({ format: "jwk" }) as { x: string }).x, "base64url").toString("base64") };
  const edProof = sign(null, Buffer.from(joinInput(good), "utf8"), edKey).toString("base64url");
  const redeem: Json[] = [
    { name: "the first use binds the nonce to the machine's #sig key, proven by its signature", token: good, machineKey, proof, ledger: [], answer: { ok: true, record: { nonce: n, state: "redeemed", fingerprint } } },
    { name: "an Ed25519 #sig key proves and binds the same way", token: good, machineKey: edMachineKey, proof: edProof, ledger: [], answer: { ok: true, record: { nonce: n, state: "redeemed", fingerprint: `sha256:${sha(Buffer.from(edMachineKey.publicKey, "base64")).toString("hex")}` } } },
    { name: "lax: a key presented without its proof binds nothing", token: good, machineKey, proof: null, ledger: [], answer: refused("bad-proof") },
    { name: "lax: a proof made for another token is no proof for this one", token: good, machineKey, proof: signDeterministic(machineD, joinInput(otherToken)), ledger: [], answer: refused("bad-proof") },
    { name: "lax: another machine's proof under the presented key's name", token: good, machineKey: { ...machineKey, publicKey: edMachineKey.publicKey, alg: "ed25519" }, proof, ledger: [], answer: refused("bad-proof") },
    { name: "a second use by another key is refused and recorded", token: good, machineKey, proof, ledger: [[n, { state: "redeemed", fingerprint: otherFingerprint }]], answer: { ok: false, problem: "reused", log: { nonce: n, presented: fingerprint, boundTo: otherFingerprint } } },
    { name: "lax: a second use by the same key is refused too", token: good, machineKey, proof, ledger: [[n, { state: "redeemed", fingerprint }]], answer: { ok: false, problem: "reused", log: { nonce: n, presented: fingerprint, boundTo: fingerprint } } },
    { name: "a token Fabric revoked before its use", token: good, machineKey, proof, ledger: [[n, { state: "revoked" }]], answer: refused("revoked") },
    { name: "another token's use leaves this one unused", token: good, machineKey, proof, ledger: [["another-nonce", { state: "redeemed", fingerprint: otherFingerprint }]], answer: { ok: true, record: { nonce: n, state: "redeemed", fingerprint } } },
    { name: "a #kem key is not the key a join binds", token: good, machineKey: { ...machineKey, kid: "m-7b2d#kem", use: "kem", alg: "ecdh-p256" }, proof, ledger: [], answer: refused("bad-key") },
    { name: "a #sig key that is not on the curve", token: good, machineKey: { ...machineKey, publicKey: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 1)]).toString("base64") }, proof, ledger: [], answer: refused("bad-key") },
    { name: "a token without a register statement", token: { ...good, statement: { ...statement, uses: 2 } }, machineKey, proof, ledger: [], answer: refused("malformed") }
  ];

  return {
    about: "Vectors for enroll-token/1 (DEC-0084, docs/specification/ceremonies.md#a-headless-machine). verify: verifyEnrollToken(token, {record, genesis, at}) with record the estate's current revision (record when given, else fixtures/positive/estate-record-first.json, as the hub and the node hold it), genesis that record's revision 1 digest, and at an RFC 3339 instant read as the clock. Each token is signed by the EdDSA test passkey of fixtures/vectors/estate-record.json over SHA-256 of the RFC 8785 form of its statement (the register's enroll-token/1, DEC-0063). redeem: redeemEnrollToken(token, machineKey, proof, ledger) with ledger a map built from the [nonce, entry] pairs and proof the presented #sig key's signature over the register's enroll-join/1 statement {digest: sha256 of the token's statement bytes, nonce} (statement.join; ES256 as 64 bytes r||s low-S, Ed25519 as 64 bytes): a first use answers the record the hub stores, a second use (by any key) answers reused with the line the hub logs.",
    record: "fixtures/positive/estate-record-first.json",
    genesis,
    statement: { fields: statement, bytes: rfc8785(statement), challenge: sha(Buffer.from(rfc8785(statement), "utf8")).toString("base64url"), join: joinInput(good) },
    verify,
    redeem
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildEnrollTokenVectors(): string {
  return `${JSON.stringify(enrollTokenVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildEnrollTokenVectors();
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
