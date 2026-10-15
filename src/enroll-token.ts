import { createHash, createPublicKey, verify as nodeVerify } from "node:crypto";
import { deviceKeyFingerprint } from "./estate-record-rules.js";
import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { machineOfKeys } from "./pairing.js";
import { verifyEs256 } from "./relay.js";
import { CLOCK_SKEW_SECONDS, strictTime } from "./rfc3339.js";
import { ENROLL_TOKEN_FIELDS, signingStatement, verifySigningAssertion } from "./signing-challenges.js";
import type { AssertionProblem, PasskeyCredential } from "./webauthn.js";

// #region enroll-token — docs: docs/specification/ceremonies.md#a-headless-machine
/**
 * `enroll-token/1` (DEC-0084, DV-05 as amended by DV-CON-01): the one-time token with which a machine that has no screen
 * joins an estate. Fabric issues it under the person's signing credential — a passkey assertion over the register's
 * `enroll-token/1` statement (DEC-0063) — for 15 minutes at most, for one use, purpose `agent-host`. The node reads it from
 * stdin or a file only its user can read, never from argv, a URL or a log, and presents it with its `#sig` key; the hub
 * verifies it, binds its nonce to that key's fingerprint on first use and refuses every later use. The token gives the
 * machine no trust: only a passkey-signed revision that lists the machine does. It authenticates the join, and its
 * `genesis` — revision 1's digest — authenticates the estate to the node.
 */

export const ENROLL_TOKEN_SCHEMA = "enroll-token/1";
/** The register's type (DEC-0063): the statement the passkey's challenge is derived from. */
export const ENROLL_TOKEN_TYPE = "enroll-token/1";
export const ENROLL_PURPOSE = "agent-host";
/** DV-05: a token lives at most 15 minutes. */
export const MAX_ENROLL_TOKEN_SECONDS = 900;

export type EnrollTokenProblem =
  | "no-clock"
  | "malformed"
  | "wrong-estate"
  | "no-trusted-authority"
  | "unknown-authority"
  | "duplicate-authority"
  | "revoked-authority"
  | AssertionProblem
  | "too-long-lived"
  | "not-yet-valid"
  | "expired";

export type EnrollTokenVerdict =
  | { ok: true; nonce: string; expiresAt: string; signedBy: string }
  | { ok: false; problem: EnrollTokenProblem };

export interface EnrollTokenTrust {
  /** The current estate revision the verifier applied (`verifyEstateRecord` accepted it): its estate and its passkeys. */
  record: unknown;
  /** The digest of revision 1 of that estate, as the verifier verified it. */
  genesis: unknown;
  /** The verifier's clock. */
  at: Date;
}

const isString = (value: unknown): value is string => typeof value === "string";
/** `estate-record.schema.json#/$defs/assertion`'s members, sorted. */
const ASSERTION_MEMBERS = "alg,authenticatorData,clientDataJSON,credentialId,format,sig";
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);

/**
 * The statement's fields beside `type`, or `undefined` when the token is not `{schema: "enroll-token/1", statement,
 * signature}` whose statement has the register's `type` and exactly its fields, with values the register admits.
 */
function statementFields(token: unknown): JsonObject | undefined {
  if (!isObject(token) || token.schema !== ENROLL_TOKEN_SCHEMA || !isObject(token.statement) || token.statement.type !== ENROLL_TOKEN_TYPE) return undefined;
  // The token holds exactly the schema's members: nothing unsigned rides beside the statement (DEC-0084).
  if (Object.keys(token).sort().join() !== "schema,signature,statement") return undefined;
  const { type: _type, ...fields } = token.statement;
  return signingStatement(ENROLL_TOKEN_TYPE, fields) ? fields : undefined;
}

/**
 * The reference verifier of an `enroll-token/1`, for the hub that admits a join and the node that pins the estate. In
 * this order, the first failure answering:
 * 1. `no-clock`: the clock is not a readable time (checked first, so no window comparison runs on NaN);
 * 2. `malformed`: not an `enroll-token/1` of exactly `{schema, statement, signature}` with a register statement and a
 *    `webauthn-assertion` signature of exactly the schema's members whose `credentialId` is a string, or a record that
 *    is not an object with a string `estate`;
 * 3. `wrong-estate`: the statement's `scope` is not `estate:<the record's estate>`, or its `genesis` is not the digest
 *    of revision 1 the verifier holds;
 * 4. the passkey among the record's `authorities`: `no-trusted-authority` (none listed), `revoked-authority` (the record
 *    revokes it), `duplicate-authority`, `unknown-authority`;
 * 5. the assertion over the register's `enroll-token/1` challenge (`verifySigningAssertion`: a signing RP, a pinned
 *    origin, WebAuthn Level 3 §7.2);
 * 6. the window: `too-long-lived` (`expiresAt` not after `notBefore`, or more than 900 s after it), `not-yet-valid`
 *    (the clock more than 60 s before `notBefore`), `expired` (after `expiresAt`). Both instants are inside the window.
 */
export function verifyEnrollToken(token: unknown, trust: EnrollTokenTrust): EnrollTokenVerdict {
  const at = isObject(trust) && trust.at instanceof Date ? trust.at.getTime() : Number.NaN;
  if (!Number.isFinite(at)) return { ok: false, problem: "no-clock" };
  const fields = statementFields(token);
  const record = trust.record;
  if (!fields || !isObject(record) || !isString(record.estate)) return { ok: false, problem: "malformed" };
  const signature = (token as JsonObject).signature;
  if (!isObject(signature) || Object.keys(signature).sort().join() !== ASSERTION_MEMBERS || signature.format !== "webauthn-assertion" || !isString(signature.credentialId)) return { ok: false, problem: "malformed" };
  if (fields.scope !== `estate:${record.estate}` || fields.genesis !== trust.genesis) return { ok: false, problem: "wrong-estate" };

  const authorities = list(record.authorities);
  if (authorities.length === 0) return { ok: false, problem: "no-trusted-authority" };
  const revoked = list(record.revocations).some((entry) => entry.kind === "authority" && entry.ref === signature.credentialId);
  if (revoked) return { ok: false, problem: "revoked-authority" };
  const matches = authorities.filter((entry) => entry.credentialId === signature.credentialId);
  if (matches.length > 1) return { ok: false, problem: "duplicate-authority" };
  const authority = matches[0];
  if (!authority) return { ok: false, problem: "unknown-authority" };
  const credential: PasskeyCredential = {
    credentialId: signature.credentialId,
    alg: show(authority.alg),
    publicKey: isObject(authority.publicKey) ? authority.publicKey : {},
    rpId: show(authority.rpId),
    origins: Array.isArray(authority.origins) ? authority.origins.filter(isString) : []
  };
  const assertion = verifySigningAssertion(signature, credential, ENROLL_TOKEN_TYPE, fields);
  if (!assertion.ok) return { ok: false, problem: assertion.problem };

  // The register admitted both instants, so neither is NaN here.
  const notBefore = strictTime(fields.notBefore);
  const expiresAt = strictTime(fields.expiresAt);
  if (expiresAt <= notBefore || expiresAt - notBefore > MAX_ENROLL_TOKEN_SECONDS * 1000) return { ok: false, problem: "too-long-lived" };
  if (at < notBefore - CLOCK_SKEW_SECONDS * 1000) return { ok: false, problem: "not-yet-valid" };
  if (at > expiresAt) return { ok: false, problem: "expired" };
  return { ok: true, nonce: fields.nonce as string, expiresAt: fields.expiresAt as string, signedBy: credential.credentialId };
}

/** What the hub's ledger holds per token nonce: the key fingerprint a use bound it to, or Fabric's revocation before use. */
export type EnrollLedgerEntry = { state: "redeemed"; fingerprint: string } | { state: "revoked" };

export type RedeemAnswer =
  | { ok: true; record: { nonce: string; state: "redeemed"; fingerprint: string } }
  | { ok: false; problem: "malformed" | "bad-key" | "bad-proof" | "revoked" }
  | { ok: false; problem: "reused"; log: { nonce: string; presented: string; boundTo: string } };

/** The register type of the joining machine's proof of its key (DEC-0084): `{digest, nonce}`, signed by the key. */
export const ENROLL_JOIN_TYPE = "enroll-join/1";

/**
 * The bytes the joining machine signs with the `#sig` key it presents (DEC-0084): the register's `enroll-join/1`
 * statement, `{type: "enroll-join/1", digest, nonce}`, where `digest` is `sha256:` and the hex SHA-256 of the token's
 * statement bytes (`signingStatement("enroll-token/1", …)`) and `nonce` the token's. `undefined` for a token without a
 * register statement.
 */
export function enrollJoinInput(token: unknown): string | undefined {
  const fields = statementFields(token);
  const statement = fields && signingStatement(ENROLL_TOKEN_TYPE, fields);
  if (!fields || !statement) return undefined;
  return signingStatement(ENROLL_JOIN_TYPE, { digest: `sha256:${createHash("sha256").update(statement).digest("hex")}`, nonce: fields.nonce })?.toString("utf8");
}

/** Whether `proof` is the presented key's signature over `input`: ES256 as 64 bytes r ‖ s, low-S (as relay-auth/1); Ed25519 as 64 bytes. */
function proves(key: JsonObject, input: string, proof: unknown): boolean {
  if (!isString(proof) || !/^[A-Za-z0-9_-]{86}$/.test(proof)) return false;
  const octets = Buffer.from(key.publicKey as string, "base64");
  if (key.alg === "es256") return verifyEs256(new Uint8Array(octets), input, proof) === true;
  const publicKey = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: octets.toString("base64url") }, format: "jwk" });
  return nodeVerify(null, Buffer.from(input, "utf8"), publicKey, Buffer.from(proof, "base64url"));
}

/**
 * The hub's single use of a verified token (DEC-0084), after `verifyEnrollToken` accepted it: `token` is that token,
 * `machineKey` the joining machine's `#sig` device key, `proof` that key's signature over `enrollJoinInput(token)`,
 * `ledger` the hub's map from nonce to entry, which it keeps for each nonce at least until the token's `expiresAt` plus
 * 60 s (the verifier refuses the token after that). In this order:
 * - `malformed`: no register statement in the token, or no ledger map;
 * - `bad-key`: `machineKey` is not one valid `<id>#sig` device key;
 * - `bad-proof`: `proof` is not that key's signature over the join input, so the presenter does not hold the key it
 *   asks to bind;
 * - `revoked`: Fabric revoked the token before its use;
 * - `reused`: a second use, by any key, the same included. `log` is what the hub records: the nonce, the fingerprint
 *   presented and the one it is bound to. The joining machine learns only the refusal;
 * - `ok`: the first use. `record` is what the hub stores before it answers: the nonce bound to the key's fingerprint.
 * The token is a bearer token: whoever presents it first, with a key it holds, binds that key. The person compares the
 * fingerprint the node prints with the one Fabric is about to list before signing (ceremonies.md, A headless machine).
 */
export function redeemEnrollToken(token: unknown, machineKey: unknown, proof: unknown, ledger: unknown): RedeemAnswer {
  const input = enrollJoinInput(token);
  if (input === undefined || !(ledger instanceof Map)) return { ok: false, problem: "malformed" };
  const nonce = (statementFields(token) as JsonObject).nonce as string;
  // One key alone is a machine's key list only when it is a valid `<id>#sig` key, so a `#kem` key is refused here too.
  if (machineOfKeys([machineKey]) === undefined) return { ok: false, problem: "bad-key" };
  if (!proves(machineKey as JsonObject, input, proof)) return { ok: false, problem: "bad-proof" };
  const fingerprint = deviceKeyFingerprint(machineKey) as string;
  const entry: unknown = ledger.get(nonce);
  if (isObject(entry) && entry.state === "revoked") return { ok: false, problem: "revoked" };
  if (entry !== undefined) return { ok: false, problem: "reused", log: { nonce, presented: fingerprint, boundTo: isObject(entry) ? show(entry.fingerprint) : show(entry) } };
  return { ok: true, record: { nonce, state: "redeemed", fingerprint } };
}

/**
 * FAC-SEM-113 on one `enroll-token/1` (kind `enroll-token`): its statement is the register's — `type` `enroll-token/1`
 * and exactly its fields, `purpose` `agent-host`, `uses` 1, `scope` `estate:<id>`, `genesis` a digest, a 32-byte
 * `nonce`, `ceiling` `null` or a digest — and its window is RFC 3339 read strictly, positive and at most 900 s.
 */
function tokenFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-113", instancePath, message });
  const statement = isObject(value.statement) ? value.statement : undefined;
  if (!statement) {
    flag("/statement", "an enroll token carries its signed statement");
    return findings;
  }
  if (statement.type !== ENROLL_TOKEN_TYPE) flag("/statement/type", "the statement's type is enroll-token/1, the register's (DEC-0063)");
  const fields: readonly string[] = ENROLL_TOKEN_FIELDS;
  const extra = Object.keys(statement).filter((name) => name !== "type" && !fields.includes(name));
  const missing = fields.filter((name) => !Object.hasOwn(statement, name));
  if (extra.length > 0 || missing.length > 0) flag("/statement", `the statement has exactly the register's fields: ${fields.join(", ")}`);
  if (statement.purpose !== ENROLL_PURPOSE) flag("/statement/purpose", "an enroll token's purpose is agent-host");
  if (statement.uses !== 1) flag("/statement/uses", "an enroll token is used once: uses is 1, and the hub binds its nonce on the first use");
  const notBefore = strictTime(statement.notBefore);
  const expiresAt = strictTime(statement.expiresAt);
  const { type: _type, ...rest } = statement;
  // Every other member the register checks, reported once: the clauses above and below name their own members.
  const named = extra.length === 0 && missing.length === 0 && statement.purpose === ENROLL_PURPOSE && statement.uses === 1 && Number.isFinite(notBefore) && Number.isFinite(expiresAt);
  if (named && !signingStatement(ENROLL_TOKEN_TYPE, rest)) flag("/statement", "scope is estate:<id>, genesis a sha256: digest, nonce 32 bytes in base64url, and ceiling null or a digest");
  if (!Number.isFinite(notBefore) || !Number.isFinite(expiresAt)) {
    flag(Number.isFinite(notBefore) ? "/statement/expiresAt" : "/statement/notBefore", "notBefore and expiresAt are RFC 3339 date-times with an offset, on days that exist");
  } else if (expiresAt <= notBefore || expiresAt - notBefore > MAX_ENROLL_TOKEN_SECONDS * 1000) {
    flag("/statement/expiresAt", "an enroll token is valid after notBefore and for at most 15 minutes (900 s)");
  }
  return findings;
}

export function enrollTokenRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "enroll-token") return tokenFindings(value);
  return undefined;
}
// #endregion enroll-token
