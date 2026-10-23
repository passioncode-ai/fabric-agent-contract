/**
 * The generator of the hub-move vectors (DEC-0107): `fixtures/vectors/hub-move.json`, shared by every machine that
 * alerts its person about a silent hub and every network view that shows a move or the passkeys left.
 *
 *   tsx tools/vectors/hub-move.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/hub-move.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/hub-move.test.ts` runs the check.
 * Each expected answer is written below by hand from DEC-0107's items; nothing here imports `src/hub-move.ts`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, unknown>;
export const VECTOR_FILE = "fixtures/vectors/hub-move.json";

const NOW = "2026-10-23T12:00:00Z";

function silenceCases(): Json[] {
  const speaking = (sinceSeconds: number): Json => ({ answer: "speaking", sinceSeconds });
  const silent = (sinceSeconds: number): Json => ({ answer: "silent", sinceSeconds });
  const stale = (sinceSeconds: number): Json => ({ answer: "stale", sinceSeconds });
  const cases: Array<[string, unknown, unknown, Json]> = [
    ["an hour old", "2026-10-23T11:00:00Z", NOW, speaking(3600)],
    ["24 hours exactly: still speaking", "2026-10-22T12:00:00Z", NOW, speaking(86400)],
    ["a second past 24 hours: silent, the person is told", "2026-10-22T11:59:59Z", NOW, silent(86401)],
    ["half a second past 24 hours: silent, the seconds floored", "2026-10-22T11:59:59.500Z", NOW, silent(86400)],
    ["two days old", "2026-10-21T12:00:00Z", NOW, silent(172800)],
    ["72 hours exactly: still silent, calls still accepted", "2026-10-20T12:00:00Z", NOW, silent(259200)],
    ["a second past 72 hours: stale", "2026-10-20T11:59:59Z", NOW, stale(259201)],
    ["a heartbeat ahead of the clock reads as just signed", "2026-10-23T12:00:30Z", NOW, speaking(0)],
    ["an offset other than Z", "2026-10-23T13:00:00+02:00", NOW, speaking(3600)],
    ["no heartbeat held", undefined, NOW, { answer: "unknown", reason: "no-heartbeat" }],
    ["a heartbeat time that does not read", "2026-02-30T12:00:00Z", NOW, { answer: "unknown", reason: "no-heartbeat" }],
    ["a clock that does not read", "2026-10-23T11:00:00Z", "noon", { answer: "unknown", reason: "no-clock" }],
    ["no clock and no heartbeat: the clock first", null, 7, { answer: "unknown", reason: "no-clock" }]
  ];
  return cases.map(([name, heartbeatAt, at, expect]) => (heartbeatAt === undefined ? { name, at, expect } : { name, heartbeatAt, at, expect }));
}

const passkey = (credentialId: string): Json => ({ credentialId, alg: "ES256", rpId: "sign.example.org", origins: ["https://sign.example.org"] });

function recoveryCases(): Json[] {
  const cases: Array<[string, unknown, Json]> = [
    ["one passkey: a lost one loses the estate", { authorities: [passkey("cred-a")] }, { ready: false, authorities: 1 }],
    ["two passkeys", { authorities: [passkey("cred-a"), passkey("cred-b")] }, { ready: true, authorities: 2 }],
    ["two passkeys, one revoked", { authorities: [passkey("cred-a"), passkey("cred-b")], revocations: [{ kind: "authority", ref: "cred-b", revokedAt: NOW }] }, { ready: false, authorities: 1 }],
    ["one passkey listed twice counts once", { authorities: [passkey("cred-a"), passkey("cred-a")] }, { ready: false, authorities: 1 }],
    ["a revocation of another kind with the same ref changes nothing", { authorities: [passkey("cred-a"), passkey("cred-b")], revocations: [{ kind: "machine", ref: "cred-b", revokedAt: NOW }] }, { ready: true, authorities: 2 }],
    ["an authority without a credential id is not counted", { authorities: [passkey("cred-a"), { alg: "ES256" }] }, { ready: false, authorities: 1 }],
    ["three passkeys", { authorities: [passkey("cred-a"), passkey("cred-b"), passkey("cred-c")] }, { ready: true, authorities: 3 }],
    ["no authorities", {}, { ready: false, authorities: 0 }],
    ["no record", null, { ready: false, authorities: 0 }]
  ];
  return cases.map(([name, record, expect]) => ({ name, record, expect }));
}

const X = "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo";
const X2 = "Pr10mR4vI7xmKAz9WpIG3oPBWHnApm7gtEmRbHtnmdc";
const hubKey = (kid: string, x = X): Json => ({ kty: "OKP", crv: "Ed25519", alg: "EdDSA", kid, x });
const machine = (id: string, kid?: string, x?: string): Json => ({ id, ...(kid ? { hubKey: hubKey(kid, x) } : {}) });

function moveCases(): Json[] {
  const parent = { machines: [machine("m-a", "hub-a"), machine("m-b")] };
  const cases: Array<[string, unknown, unknown, Json]> = [
    ["a move that leaves the old key unrevoked: FAC-SEM-114 refuses such a revision", parent, { machines: [machine("m-a"), machine("m-b", "hub-b")] },
      { moved: true, added: [{ machine: "m-b", kid: "hub-b" }], removed: [{ machine: "m-a", kid: "hub-a", revoked: false }] }],
    ["a move: the old key revoked in the same revision", parent, { machines: [machine("m-a"), machine("m-b", "hub-b")], revocations: [{ kind: "hub-key", ref: "hub-a", revokedAt: NOW }] },
      { moved: true, added: [{ machine: "m-b", kid: "hub-b" }], removed: [{ machine: "m-a", kid: "hub-a", revoked: true }] }],
    ["a move with the lost machine removed", parent, { machines: [machine("m-b", "hub-b")], revocations: [{ kind: "machine", ref: "m-a", revokedAt: NOW }, { kind: "hub-key", ref: "hub-a", revokedAt: NOW }] },
      { moved: true, added: [{ machine: "m-b", kid: "hub-b" }], removed: [{ machine: "m-a", kid: "hub-a", revoked: true }] }],
    ["a second hub added: no move", parent, { machines: [machine("m-a", "hub-a"), machine("m-b", "hub-b")] },
      { moved: false, added: [{ machine: "m-b", kid: "hub-b" }], removed: [] }],
    ["the hub removed with none in its place, unrevoked: no move, no hub, and FAC-SEM-114 refuses it", parent, { machines: [machine("m-a"), machine("m-b")] },
      { moved: false, added: [], removed: [{ machine: "m-a", kid: "hub-a", revoked: false }] }],
    ["the hub's key replaced on the same machine, unrevoked: FAC-SEM-114 refuses it", parent, { machines: [machine("m-a", "hub-a2"), machine("m-b")] },
      { moved: true, added: [{ machine: "m-a", kid: "hub-a2" }], removed: [{ machine: "m-a", kid: "hub-a", revoked: false }] }],
    ["nothing changed", parent, parent, { moved: false, added: [], removed: [] }],
    ["another key under the same kid: added and removed, as the record's rules read it", parent, { machines: [machine("m-a", "hub-a", X2), machine("m-b")] },
      { moved: true, added: [{ machine: "m-a", kid: "hub-a" }], removed: [{ machine: "m-a", kid: "hub-a", revoked: false }] }],
    ["a machine listed twice: its first entry only", parent, { machines: [machine("m-a"), machine("m-a", "hub-a"), machine("m-b")] },
      { moved: false, added: [], removed: [{ machine: "m-a", kid: "hub-a", revoked: false }] }],
    ["revision 1, no parent", null, parent, { moved: false, added: [{ machine: "m-a", kid: "hub-a" }], removed: [] }]
  ];
  return cases.map(([name, parentRecord, next, expect]) => ({ name, parent: parentRecord, next, expect }));
}

// ---- anchor: anchorDelta(state, record), over the revocation delta's committed entries --------------------------

function anchorCases(): Json[] {
  const delta = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/revocation-delta.json"), "utf8")) as { record: Json; entries: Record<string, { entry: Json; hash: string }> };
  const estate = delta.record.estate as string;
  const { e1, e2 } = delta.entries as { e1: { entry: Json; hash: string }; e2: { entry: Json; hash: string } };
  const E1 = e1.entry, E2 = e2.entry;
  const state = (entries: Json[], extra: Json = {}): Json => ({ estate, entries, ...extra });
  const rec = (deltaAnchor?: Json, revocations: Json[] = [E1.revocation as Json, E2.revocation as Json], other: Json = {}): Json => ({ estate, revocations, ...(deltaAnchor ? { deltaAnchor } : {}), ...other });
  const at2 = { sequence: 2, sha256: e2.hash };
  const at3 = { sequence: 3, sha256: "c".repeat(64) };
  const cases: Array<[string, Json, Json, Json]> = [
    ["no anchor: nothing changes", state([E1]), rec(), { ok: true, state: state([E1]) }],
    ["a machine that holds nothing starts at the anchor", state([]), rec(at2), { ok: true, state: state([], { anchor: at2 }) }],
    ["a machine that was behind starts at the anchor, the entry it drops listed", state([E1]), rec(at2), { ok: true, state: state([], { anchor: at2 }) }],
    ["a machine that holds the anchor's entry with its hash keeps its chain", state([E1, E2]), rec(at2), { ok: true, state: state([E1, E2]) }],
    ["another hash at a held sequence: a second history", state([E1, E2]), rec({ sequence: 2, sha256: "0".repeat(64) }), { ok: false, problem: "fork", state: state([E1, E2], { broken: true }) }],
    ["an entry it would drop whose revocation the record does not list: unreconciled, nothing changes", state([E1, E2]), rec(at3, [E1.revocation as Json]), { ok: false, problem: "unreconciled", state: state([E1, E2]), missing: [2] }],
    ["an anchor below where the chain already starts changes nothing", state([], { anchor: { sequence: 5, sha256: "a".repeat(64) } }), rec(at2), { ok: true, state: state([], { anchor: { sequence: 5, sha256: "a".repeat(64) } }) }],
    ["another estate's record", state([E1]), rec(at2, undefined, { estate: "estate-other" }), { ok: false, problem: "wrong-estate", state: state([E1]) }],
    ["an anchor at sequence 0", state([E1]), rec({ sequence: 0, sha256: e1.hash }), { ok: false, problem: "malformed", state: state([E1]) }],
    ["an anchor hash in upper case", state([E1]), rec({ sequence: 2, sha256: e2.hash.toUpperCase() }), { ok: false, problem: "malformed", state: state([E1]) }]
  ];
  return cases.map(([name, held, record, expect]) => ({ name, state: held, record, expect }));
}

export function hubMoveVectors(): Json {
  return {
    about:
      "Vectors for keeping an estate recoverable (DEC-0107), written by tools/vectors/hub-move.ts, never by hand. Absent values are absent members. silence: hubSilence(heartbeatAt, at), heartbeatAt the at of the heartbeat a machine holds; speaking up to 24 hours, silent past it up to 72, stale past 72; sinceSeconds floored, never below zero. recovery: recoveryReady(record), ready with two passkeys or more by distinct credentialId that the record does not revoke. move: hubMove(parent, next), added and removed by machine, kid and public x (reported by machine and kid) in the order the record lists machines, a machine listed twice read by its first entry, revoked when next lists the removed kid as a hub-key revocation; a removed key not revoked is a revision FAC-SEM-114 refuses (DEC-0084). anchor: anchorDelta(state, record) over the committed entries of fixtures/vectors/revocation-delta.json; a record that lists every dropped entry's revocation by kind and ref; missing names the dropped entries' sequences. Every case holds in every time zone.",
    silence: silenceCases(),
    recovery: recoveryCases(),
    move: moveCases(),
    anchor: anchorCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildHubMoveVectors(): string {
  return `${JSON.stringify(hubMoveVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildHubMoveVectors();
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
