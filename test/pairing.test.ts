import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rfc8785 } from "../src/canonical.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  CODE_DIGITS,
  CODE_TYPE,
  COMMIT_TYPE,
  FINGERPRINT_TYPE,
  RENDEZVOUS_SECONDS,
  checkReveal,
  comparisonCode,
  estateFingerprint,
  joinListed,
  machineOfKeys,
  ownKeysDecision,
  pairingCommit,
  rendezvousVerdict
} from "../src/pairing.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildPairingVectors } from "../tools/vectors/pairing.js";

// DEC-0084: the pairing that adds a machine — commit, reveal, comparison code — the one-time rendezvous, the estate
// fingerprint and the node's checks on the revision that adds or re-keys it, from the shared vectors a port runs.
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const vectors = JSON.parse(read(VECTOR_FILE)) as Json;
const validator = await createValidator();
const messageValid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/pairing-message.schema.json`, value).valid;
const spec = read("docs/specification/ceremonies.md");
const named = (entries: Json[]) => entries.map((entry) => [entry.name as string, entry] as const);

describe("the vectors (fixtures/vectors/pairing.json)", () => {
  it("are exactly what the generator writes (tools/vectors/pairing.ts)", () => {
    expect(buildPairingVectors()).toBe(read(VECTOR_FILE));
  });

  it.each(named(vectors.commits))("commit: %s", (_name, entry) => {
    expect(pairingCommit(entry.side)).toEqual(entry.answer);
    if (entry.input) expect(entry.input).toBe(rfc8785({ type: COMMIT_TYPE, role: entry.side.role, keys: entry.side.keys, nonce: entry.side.nonce }));
    // Every side a commitment is made for, as a reveal, is valid against the schema.
    if (entry.answer.ok) expect(messageValid({ schema: "pairing-message/1", step: "reveal", ...entry.side })).toBe(true);
  });

  it.each(named(vectors.reveals))("reveal: %s", (_name, entry) => {
    expect(checkReveal(entry.commit, entry.reveal, entry.expected)).toEqual(entry.answer);
    // Every message a check accepts is valid against the schema.
    if (entry.answer.ok) expect(messageValid(entry.commit) && messageValid(entry.reveal)).toBe(true);
  });

  it.each(named(vectors.codes))("code: %s", (_name, entry) => {
    expect(comparisonCode(entry.new, entry.trusted)).toEqual(entry.answer);
    if (entry.laxCode) expect(entry.laxCode).not.toBe(entry.answer.code);
  });

  it.each(named(vectors.fingerprints))("fingerprint: %s", (_name, entry) => {
    expect(estateFingerprint(entry.digest)).toEqual(entry.answer);
  });

  it.each(named(vectors.rendezvous))("rendezvous: %s", (_name, entry) => {
    expect(rendezvousVerdict(entry.openedAt, entry.messages, new Date(entry.at))).toEqual(entry.answer);
  });

  it.each(named(vectors.join))("join: %s", (_name, entry) => {
    expect(joinListed(entry.record, entry.new, entry.trusted, entry.genesis)).toEqual(entry.answer);
  });

  it.each(named(vectors.ownKeys))("own keys: %s", (_name, entry) => {
    expect(ownKeysDecision(entry.record, entry.machine, entry.held)).toEqual(entry.answer);
  });

  it("carry every problem and every burn reason, and the cases a lax port gets wrong", () => {
    const problems = new Set([...vectors.commits, ...vectors.reveals, ...vectors.codes].map((entry: Json) => entry.answer.problem).filter(Boolean));
    expect([...problems].sort()).toEqual(["bad-genesis", "bad-keys", "bad-nonce", "bad-role", "commit-mismatch", "malformed", "role-mismatch", "same-machine"]);
    const reasons = new Set(vectors.rendezvous.map((entry: Json) => entry.answer.reason ?? entry.answer.state));
    expect([...reasons].sort()).toEqual(["aborted", "closed", "commit-mismatch", "complete", "expired", "malformed", "open", "out-of-order", "repeated"]);
    const names = [...vectors.commits, ...vectors.reveals, ...vectors.codes, ...vectors.fingerprints].map((entry: Json) => entry.name as string).join("\n");
    for (const phrase of ["non-canonical JSON", "swapped role", "swapped order", "upper-case hex", "unpadded base64", "another order"]) expect(names, phrase).toContain(phrase);
  });
});

describe("the comparison code and the fingerprint (DEC-0084 item 3 step 4, item 2)", () => {
  const main = vectors.codes[0] as Json;

  it("is six digits, from the transcript the vector gives byte for byte", () => {
    expect(CODE_DIGITS).toBe(6);
    expect(main.answer.code).toMatch(/^\d{6}$/);
    expect(main.transcript).toBe(rfc8785({ type: CODE_TYPE, new: { keys: main.new.keys, nonce: main.new.nonce }, trusted: { keys: main.trusted.keys, nonce: main.trusted.nonce, genesis: main.trusted.genesis } }));
    // RFC 8785 sorts every object's members, so the transcript starts with "new" and ends with "type".
    expect(main.transcript.startsWith('{"new":{"keys":[{"alg":')).toBe(true);
    // Every vector code has exactly six digits, a leading zero kept.
    for (const entry of vectors.codes as Json[]) if (entry.answer.ok) expect(entry.answer.code, entry.name).toMatch(/^\d{6}$/);
  });

  it("changes when any key, nonce or the trusted machine's estate changes", () => {
    const changed = (vectors.codes as Json[]).filter((entry) => / changes the code|gives? another code/.test(entry.name));
    expect(changed.length).toBe(7);
    for (const entry of changed) expect(entry.answer.code, entry.name).not.toBe(main.answer.code);
  });

  it("keeps a leading zero: a transcript whose value is below 10^5 is written with six digits", () => {
    // Search a nonce of the new machine until the code starts with 0, so the padding is exercised by the reference.
    let found: string | undefined;
    for (let i = 0; i < 200 && !found; i += 1) {
      const nonce = Buffer.alloc(32, i).toString("base64url");
      const answer = comparisonCode({ ...main.new, nonce }, main.trusted);
      if (answer.ok && answer.code.startsWith("0")) found = answer.code;
    }
    expect(found).toMatch(/^0\d{5}$/);
  });

  it("writes the fingerprint as five groups of five digits", () => {
    for (const entry of vectors.fingerprints as Json[]) if (entry.answer.ok) expect(entry.answer.fingerprint, entry.name).toMatch(/^\d{5}( \d{5}){4}$/);
    expect(vectors.fingerprints[0].input).toBe(rfc8785({ type: FINGERPRINT_TYPE, digest: vectors.fingerprints[0].digest }));
  });
});

describe("the rendezvous lives at most 600 s (DEC-0084 item 3 step 2)", () => {
  const full = vectors.rendezvous[0].messages as Json[];
  const opened = "2026-10-15T09:00:00Z";
  const at = (ms: number) => new Date(Date.parse(opened) + ms);

  it("is 600 s, accepted at 600 s and burned 1 ms later", () => {
    expect(RENDEZVOUS_SECONDS).toBe(600);
    expect(rendezvousVerdict(opened, full, at(600_000))).toEqual({ state: "complete" });
    expect(rendezvousVerdict(opened, full, at(600_001))).toEqual({ state: "burned", reason: "expired", index: -1 });
  });

  it("refuses an unreadable clock rather than compare NaN", () => {
    for (const clock of [new Date(Number.NaN), "2026-10-15T09:00:00Z", 0, null]) expect(rendezvousVerdict(opened, full, clock)).toEqual({ state: "burned", reason: "malformed", index: -1 });
  });
});

describe("every function is total: malformed input answers a refusal, never a throw", () => {
  const junk: unknown[] = [undefined, null, 7, "x", true, [], [null], {}, { role: "new", keys: "x", nonce: 7 }, JSON.parse('{"__proto__": {"role": "new"}}'), { toString: 1 }];

  it("answers every junk input", () => {
    for (const a of junk) {
      expect(() => pairingCommit(a)).not.toThrow();
      expect(pairingCommit(a).ok).toBe(false);
      expect(machineOfKeys(a)).toBeUndefined();
      expect(estateFingerprint(a).ok).toBe(false);
      for (const b of junk) {
        expect(checkReveal(a, b).ok).toBe(false);
        expect(comparisonCode(a, b).ok).toBe(false);
        expect(() => rendezvousVerdict(a, b, new Date())).not.toThrow();
        expect(joinListed(a, b, b, a).ok).toBe(false);
        expect(() => ownKeysDecision(a, b, a)).not.toThrow();
      }
    }
  });

  it("reads a role only as the side's own member", () => {
    const side = vectors.commits[0].side as Json;
    expect(pairingCommit(Object.assign(Object.create({ role: "new" }), { keys: side.keys, nonce: side.nonce }))).toEqual({ ok: false, problem: "bad-role" });
  });

  it("refuses keys of more than two, a machine id outside the opaque-id set, and a key listed twice", () => {
    const keys = vectors.keys.new as Json[];
    expect(machineOfKeys([...keys, keys[0]])).toBeUndefined();
    expect(machineOfKeys([{ ...keys[0], kid: " m#sig" }])).toBeUndefined();
    expect(machineOfKeys([keys[0], keys[0]])).toBeUndefined();
    expect(machineOfKeys([{ ...keys[0], use: "enc" }])).toBeUndefined();
    expect(machineOfKeys([{ ...keys[0], kid: 7 }])).toBeUndefined();
    expect(machineOfKeys(keys)).toBe("m-7b2d");
  });
});

describe("the specification (docs/specification/ceremonies.md)", () => {
  it("states the constants the code holds", () => {
    for (const phrase of ['"fabric-enroll-commit/1"', '"fabric-enroll-code/1"', '"estate-fingerprint/1"', "`genesis`", "six decimal digits", "600 s", "five groups of five digits", "pairingCommit(", "checkReveal(", "comparisonCode(", "estateFingerprint(", "rendezvousVerdict(", "joinListed(", "ownKeysDecision("]) {
      expect(spec, phrase).toContain(phrase);
    }
  });
});
