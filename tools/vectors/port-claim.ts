/**
 * The generator of the port-claim vectors (DEC-0154 HA-1, DEC-0160): `fixtures/vectors/port-claim.json`, shared by
 * every installer and local service that records a port per OS account (Fabric, Switchboard, the adapter's kits).
 *
 *   tsx tools/vectors/port-claim.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/port-claim.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/port-claim.test.ts` runs the check.
 * Each expected answer is written below from HA-1's text; nothing here imports `src/port-claim.ts`, so the gate checks
 * that the reference returns what this file expects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, unknown>;
export const VECTOR_FILE = "fixtures/vectors/port-claim.json";

const SCHEMA = "passioncode-port-claim/1";
const T = "2026-11-08T09:00:00Z";
/** This account, another account on the computer, and an account no longer on it. */
const ME = "501";
const OTHER = "502";
const GONE = "503";
const SID = "S-1-5-21-3623811015-3361044348-30300820-1013";
const SERVICE = "example-agent";
const APP_PART = "ai.passioncode.desktop.hub";
/** Two parts of one app in one account, one per data folder, named with 8 hex digits of the canonical folder path's hash (Switchboard). */
const PART_A = "ai.passioncode.fabric-switchboard.proxy-1a2b3c4d";
const PART_B = "ai.passioncode.fabric-switchboard.proxy-9e8f7a6b";
/** The longest service (130 characters) and account (100 characters) a claim takes: the file name is 255 bytes. */
const LONG_SERVICE = `ai.passioncode.${"x".repeat(115)}`;
const LONG_ACCOUNT = `S-1-5-21-${Array.from({ length: 8 }, () => "4294967295").join("-")}-123`;

const fileName = (service: string, account: string) => `.passioncode-ports.${service}.${account}.json`;

/** A claim file as a reader finds it: its name, its owner and its parsed content. */
function file(service: string, account: string, ports: number[], more: Json = {}): Json {
  const { owner = account, name = fileName(service, account), json = { schema: SCHEMA, service, account, ports, updatedAt: T } } = more as { owner?: string; name?: string; json?: unknown };
  return { name, owner, json };
}

/** The claim a reader keeps from a file. */
const claim = (service: string, account: string, ports: number[]) => ({ schema: SCHEMA, service, account, ports, updatedAt: T });

function readCases(): Json[] {
  const present = [ME, OTHER];
  const read = (files: Json[], presentAccounts: string[] = present) => ({ files, presentAccounts });
  const list: Array<[string, Json, Json]> = [
    ["a claim of this account and one of another: both kept, in the order read",
      read([file(SERVICE, ME, [48210]), file(SERVICE, OTHER, [48230])]),
      { claims: [claim(SERVICE, ME, [48210]), claim(SERVICE, OTHER, [48230])], notes: [] }],
    ["an app's part with two ports", read([file(APP_PART, ME, [48300, 48301])]), { claims: [claim(APP_PART, ME, [48300, 48301])], notes: [] }],
    ["a Windows claim, its owner the SID it names", read([file(SERVICE, SID, [48210])], [SID]), { claims: [claim(SERVICE, SID, [48210])], notes: [] }],
    ["a claim whose owner is not its account: ignored", read([file(SERVICE, OTHER, [48210], { owner: ME })]),
      { claims: [], notes: [{ code: "claim-owner-mismatch", file: fileName(SERVICE, OTHER) }] }],
    ["a uid with a leading zero: invalid, never compared with the owner's uid", read([file(SERVICE, "0501", [48210], { owner: ME })]),
      { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, "0501") }] }],
    ["a claim of an account no longer on the computer: ignored", read([file(SERVICE, GONE, [48210])]),
      { claims: [], notes: [{ code: "claim-account-absent", file: fileName(SERVICE, GONE) }] }],
    ["a name that names another account than the content: ignored", read([file(SERVICE, ME, [48210], { name: fileName(SERVICE, OTHER) })]),
      { claims: [], notes: [{ code: "claim-name-mismatch", file: fileName(SERVICE, OTHER) }] }],
    ["a name that names another service than the content: ignored", read([file(SERVICE, ME, [48210], { name: fileName("other-agent", ME) })]),
      { claims: [], notes: [{ code: "claim-name-mismatch", file: fileName("other-agent", ME) }] }],
    ["a member beyond the five: invalid", read([file(SERVICE, ME, [48210], { json: { ...claim(SERVICE, ME, [48210]), pid: 7 } })]),
      { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["no port: invalid (a claim with no port is deleted)", read([file(SERVICE, ME, [])]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["port 0: invalid", read([file(SERVICE, ME, [0])]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["port 65536: invalid", read([file(SERVICE, ME, [65536])]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["a port that is not an integer: invalid", read([file(SERVICE, ME, [48210.5])]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["a port named twice: invalid", read([file(SERVICE, ME, [48210, 48210])]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["65 ports: invalid", read([file(SERVICE, ME, Array.from({ length: 65 }, (_, n) => 48000 + n))]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["an account named by its login name: invalid", read([file(SERVICE, "alice", [48210])], [ME, "alice"]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, "alice") }] }],
    ["a service id with an upper-case letter and no dot: invalid", read([file("Example", ME, [48210])]), { claims: [], notes: [{ code: "claim-invalid", file: fileName("Example", ME) }] }],
    ["updatedAt with an offset: invalid", read([file(SERVICE, ME, [48210], { json: { ...claim(SERVICE, ME, [48210]), updatedAt: "2026-11-08T10:00:00+01:00" } })]),
      { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["updatedAt on a day that does not exist: invalid", read([file(SERVICE, ME, [48210], { json: { ...claim(SERVICE, ME, [48210]), updatedAt: "2026-02-30T09:00:00Z" } })]),
      { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["another schema revision: invalid", read([file(SERVICE, ME, [48210], { json: { ...claim(SERVICE, ME, [48210]), schema: "passioncode-port-claim/2" } })]),
      { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["content that is not an object: invalid", read([file(SERVICE, ME, [48210], { json: [48210] })]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["invalid content and another owner: invalid is named first", read([file(SERVICE, ME, [0], { owner: OTHER })]),
      { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, ME) }] }],
    ["a wrong name and another owner: the name is named first", read([file(SERVICE, ME, [48210], { name: fileName(SERVICE, OTHER), owner: OTHER })]),
      { claims: [], notes: [{ code: "claim-name-mismatch", file: fileName(SERVICE, OTHER) }] }],
    ["another owner and an absent account: the owner is named first", read([file(SERVICE, GONE, [48210], { owner: ME })]),
      { claims: [], notes: [{ code: "claim-owner-mismatch", file: fileName(SERVICE, GONE) }] }],
    ["the longest service and account: kept", read([file(LONG_SERVICE, LONG_ACCOUNT, [48210])], [LONG_ACCOUNT]), { claims: [claim(LONG_SERVICE, LONG_ACCOUNT, [48210])], notes: [] }],
    ["a service of 131 characters: invalid (the file name would pass 255 bytes)", read([file(`${LONG_SERVICE}x`, ME, [48210])]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(`${LONG_SERVICE}x`, ME) }] }],
    ["an account of 101 characters: invalid (the file name would pass 255 bytes)", read([file(SERVICE, `${LONG_ACCOUNT}4`, [48210])], [`${LONG_ACCOUNT}4`]), { claims: [], notes: [{ code: "claim-invalid", file: fileName(SERVICE, `${LONG_ACCOUNT}4`) }] }],
    ["one ignored claim among usable ones", read([file(SERVICE, OTHER, [48230]), file(SERVICE, GONE, [48210]), file(APP_PART, ME, [48300])]),
      { claims: [claim(SERVICE, OTHER, [48230]), claim(APP_PART, ME, [48300])], notes: [{ code: "claim-account-absent", file: fileName(SERVICE, GONE) }] }]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

function chooseCases(): Json[] {
  /** The defaults: this account's instance `example-agent.default`, both accounts present, two candidates, nothing held. */
  const choose = (more: Json): Json => ({
    account: ME, service: SERVICE, instance: "default", recorded: 48210, ownListener: false,
    descriptors: [], files: [], presentAccounts: [ME, OTHER], listeners: [], candidates: [48210, 48211, 48212], squatted: false,
    ...more
  });
  const kept = (port: number, reason: string, notes: string[] = []) => ({ port, kept: true, reason, notes });
  const fresh = (port: number, reason: string, notes: string[] = []) => ({ port, kept: false, reason, notes });
  const ownDescriptor = { service: SERVICE, instance: "default", port: 48210 };
  const otherDescriptor = { service: "other-agent", instance: "default", port: 48210 };
  const otherAccountClaim = file(SERVICE, OTHER, [48210]);
  const appClaim = file(APP_PART, ME, [48210]);
  const otherListener = { port: 48210, account: OTHER };
  const list: Array<[string, Json, Json]> = [
    ["no port recorded: the first free candidate", choose({ recorded: null }), fresh(48210, "new-none-recorded")],
    ["the recorded port free: kept", choose({}), kept(48210, "kept-free")],
    ["held by its own listener: kept", choose({ ownListener: true, listeners: [{ port: 48210, account: ME }] }), kept(48210, "kept-own-listener")],
    ["its own descriptor declares it: kept", choose({ descriptors: [ownDescriptor] }), kept(48210, "kept-free")],
    ["held by another id.instance's descriptor: a new port", choose({ descriptors: [otherDescriptor] }), fresh(48211, "new-held-by-descriptor")],
    ["held by another instance of this service: a new port", choose({ descriptors: [{ service: SERVICE, instance: "second", port: 48210 }] }), fresh(48211, "new-held-by-descriptor")],
    ["its own listener holds it and another id.instance's descriptor declares it: a new port", choose({ ownListener: true, listeners: [{ port: 48210, account: ME }], descriptors: [otherDescriptor] }), fresh(48211, "new-held-by-descriptor")],
    ["named by another account's claim: a new port", choose({ files: [otherAccountClaim] }), fresh(48211, "new-held-by-claim-other-account")],
    ["named by another account's claim while its own listener holds it: kept", choose({ ownListener: true, listeners: [{ port: 48210, account: ME }], files: [otherAccountClaim] }), kept(48210, "kept-own-listener")],
    ["held by another account's listener: a new port", choose({ listeners: [otherListener] }), fresh(48211, "new-held-by-listener")],
    ["held by a listener of this account that is not this instance's: a new port", choose({ listeners: [{ port: 48210, account: ME }] }), fresh(48211, "new-held-by-listener")],
    ["listeners of another account on the recorded port and the next candidate: the candidate after them", choose({ listeners: [{ port: 48210, account: OTHER }, { port: 48211, account: OTHER }] }), fresh(48212, "new-held-by-listener")],
    ["a claim of an absent account: ignored, the port kept", choose({ files: [file(SERVICE, GONE, [48210])] }), kept(48210, "kept-free")],
    ["a claim whose owner is not its account: ignored, the port kept", choose({ files: [file(SERVICE, OTHER, [48210], { owner: ME })] }), kept(48210, "kept-free")],
    ["a claim path held by another owner: claims are not read, the port kept, the path reported", choose({ squatted: true, files: [otherAccountClaim, appClaim] }), kept(48210, "kept-free", ["claim-path-squatted"])],
    ["a claim path held by another owner, no port recorded: a candidate another account claims is taken", choose({ squatted: true, recorded: null, files: [otherAccountClaim] }), fresh(48210, "new-none-recorded", ["claim-path-squatted"])],
    ["a claim path held by another owner: the listener test still holds", choose({ squatted: true, listeners: [otherListener] }), fresh(48211, "new-held-by-listener", ["claim-path-squatted"])],
    ["a claim path held by another owner: the descriptor test still holds", choose({ squatted: true, descriptors: [otherDescriptor] }), fresh(48211, "new-held-by-descriptor", ["claim-path-squatted"])],
    ["a claim aged out (its file missing): the port kept while free", choose({ descriptors: [ownDescriptor], files: [] }), kept(48210, "kept-free")],
    ["this service's own claim names the recorded port: kept", choose({ files: [file(SERVICE, ME, [48210])] }), kept(48210, "kept-free")],
    ["this account's claim of another service (an app with no descriptor origin) names the recorded port: a new port while that app is not listening", choose({ files: [appClaim] }), fresh(48211, "new-held-by-claim-other-service")],
    ["this account's claim of another service names a candidate: the next candidate", choose({ recorded: null, files: [appClaim] }), fresh(48211, "new-none-recorded")],
    ["this account's claim of another service while its own listener holds it: kept", choose({ ownListener: true, listeners: [{ port: 48210, account: ME }], files: [appClaim] }), kept(48210, "kept-own-listener")],
    ["two instances of one service, one restarts: its port kept, the other's port not taken",
      choose({ descriptors: [ownDescriptor, { service: SERVICE, instance: "second", port: 48211 }], files: [file(SERVICE, ME, [48210, 48211])], listeners: [{ port: 48211, account: ME }] }),
      kept(48210, "kept-free")],
    ["two instances of one service, the second without a port: it skips the first's",
      choose({ instance: "second", recorded: null, descriptors: [ownDescriptor], files: [file(SERVICE, ME, [48210])], listeners: [{ port: 48210, account: ME }] }),
      fresh(48211, "new-none-recorded")],
    ["two parts of one app in one account (one per data folder): a part skips the port the other part claims",
      choose({ service: PART_A, instance: "default", recorded: null, files: [file(PART_B, ME, [48210])] }), fresh(48211, "new-none-recorded")],
    ["two parts of one app in one account: a part keeps its own port beside the other's claim",
      choose({ service: PART_A, instance: "default", files: [file(PART_A, ME, [48210]), file(PART_B, ME, [48211])] }), kept(48210, "kept-free")],
    ["a candidate named only by this service's own claim: taken", choose({ recorded: null, files: [file(SERVICE, ME, [48210])] }), fresh(48210, "new-none-recorded")],
    ["holder order: a descriptor is named before a claim and a listener",
      choose({ descriptors: [otherDescriptor], files: [otherAccountClaim, appClaim], listeners: [otherListener] }), fresh(48211, "new-held-by-descriptor")],
    ["holder order: another account's claim before this account's claim of another service and a listener",
      choose({ files: [appClaim, otherAccountClaim], listeners: [otherListener] }), fresh(48211, "new-held-by-claim-other-account")],
    ["holder order: this account's claim of another service before a listener", choose({ files: [appClaim], listeners: [otherListener] }), fresh(48211, "new-held-by-claim-other-service")],
    ["a held recorded port and every candidate held: no free port",
      choose({ listeners: [otherListener], descriptors: [{ service: "other-agent", instance: "default", port: 48211 }], files: [file(SERVICE, OTHER, [48212])] }), { fault: "no-free-port", notes: [] }],
    ["no port recorded and no candidate free: no free port", choose({ recorded: null, candidates: [48210], listeners: [otherListener] }), { fault: "no-free-port", notes: [] }],
    ["no candidates at all: no free port", choose({ recorded: null, candidates: [] }), { fault: "no-free-port", notes: [] }],
    ["a squatted path and no free candidate: the fault carries the note", choose({ squatted: true, recorded: null, candidates: [48210], listeners: [otherListener] }), { fault: "no-free-port", notes: ["claim-path-squatted"] }],
    ["on Windows, another account's claim by SID: a new port",
      choose({ account: SID, presentAccounts: [SID, "S-1-5-21-3623811015-3361044348-30300820-1014"], files: [file(SERVICE, "S-1-5-21-3623811015-3361044348-30300820-1014", [48210])] }),
      fresh(48211, "new-held-by-claim-other-account")]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

function rebuildCases(): Json[] {
  const rebuild = (more: Json): Json => ({ account: ME, service: SERVICE, descriptors: [], ownState: [], now: T, ...more });
  const list: Array<[string, Json, Json]> = [
    ["one instance with a descriptor", rebuild({ descriptors: [{ service: SERVICE, instance: "default", port: 48210 }] }), claim(SERVICE, ME, [48210])],
    ["two instances of which one restarts: both ports", rebuild({ descriptors: [{ service: SERVICE, instance: "second", port: 48211 }, { service: SERVICE, instance: "default", port: 48210 }] }), claim(SERVICE, ME, [48210, 48211])],
    ["another service's descriptors in the account are not this claim's", rebuild({ descriptors: [{ service: SERVICE, instance: "default", port: 48210 }, { service: "other-agent", instance: "default", port: 48220 }] }), claim(SERVICE, ME, [48210])],
    ["a claim aged out: the rebuild writes the port back", rebuild({ descriptors: [{ service: SERVICE, instance: "default", port: 48210 }] }), claim(SERVICE, ME, [48210])],
    ["an app without a descriptor origin: the port in its own state", rebuild({ service: APP_PART, ownState: [48300] }), claim(APP_PART, ME, [48300])],
    ["an app's part with two ports out of order and one twice: sorted, once each", rebuild({ service: APP_PART, ownState: [48301, 48300, 48301] }), claim(APP_PART, ME, [48300, 48301])],
    ["a descriptor's port also in its own state: once", rebuild({ descriptors: [{ service: SERVICE, instance: "default", port: 48210 }], ownState: [48210] }), claim(SERVICE, ME, [48210])],
    ["uninstall of one of two instances: the remaining one's port, the removed one's state never read", rebuild({ descriptors: [{ service: SERVICE, instance: "second", port: 48211 }] }), claim(SERVICE, ME, [48211])],
    ["uninstall of the last instance: the claim is deleted", rebuild({}), { delete: true }],
    ["only another service's descriptor remains: the claim is deleted", rebuild({ descriptors: [{ service: "other-agent", instance: "default", port: 48220 }] }), { delete: true }],
    ["on Windows, the account by SID", rebuild({ account: SID, descriptors: [{ service: SERVICE, instance: "default", port: 48210 }] }), claim(SERVICE, SID, [48210])],
    ["one of two parts of one app in one account: only its own state, never the other part's claim", rebuild({ service: PART_A, ownState: [48210] }), claim(PART_A, ME, [48210])],
    ["one of two parts of one app loses its last port: only its claim is deleted", rebuild({ service: PART_B, descriptors: [{ service: SERVICE, instance: "default", port: 48220 }] }), { delete: true }],
    ["65 ports: a fault, no claim written", rebuild({ ownState: Array.from({ length: 65 }, (_, n) => 48000 + n) }), { fault: "claim-invalid" }],
    ["port 0 in its own state: a fault, no claim written", rebuild({ ownState: [0, 48210] }), { fault: "claim-invalid" }],
    ["an account named by its login name: a fault, no claim written", rebuild({ account: "alice", ownState: [48210] }), { fault: "claim-invalid" }],
    ["now with an offset: a fault, no claim written", rebuild({ ownState: [48210], now: "2026-11-08T09:00:00+00:00" }), { fault: "claim-invalid" }]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

function fileNameCases(): Json[] {
  return [
    ["a service id and a uid", { service: SERVICE, account: ME }],
    ["an app's part and a uid", { service: APP_PART, account: ME }],
    ["a service id and a SID", { service: SERVICE, account: SID }],
    ["two parts of one app in one account: two files", { service: PART_A, account: ME }],
    ["two parts of one app in one account: the other part's file", { service: PART_B, account: ME }],
    ["the longest service and account: 255 bytes", { service: LONG_SERVICE, account: LONG_ACCOUNT }]
  ].map(([name, input]) => ({ name, input, expected: fileName((input as { service: string }).service, (input as { account: string }).account) }));
}

/** The vectors as an object. */
export function portClaimVectors(): Json {
  return {
    about: "Vectors for the port claim and the port choice (DEC-0154 HA-1, DEC-0160), written by tools/vectors/port-claim.ts, never by hand. fileName: claimFileName(service, account), .passioncode-ports.<service>.<account>.json. read: readClaims(files, presentAccounts), each file {name, owner, json} as a reader finds it in the shared folder (owner the file owner's uid, its SID on Windows); the answer is {claims, notes}: the usable claims in the order read, and one note {code, file} per ignored file, the first that applies in this order: claim-invalid (not a passioncode-port-claim/1 document, updatedAt a real UTC instant), claim-name-mismatch (the name is not claimFileName of the content's service and account), claim-owner-mismatch (the owner is not the account it names), claim-account-absent (the account is not in presentAccounts). choose: choosePort(input) with input.claims = readClaims(input.files, input.presentAccounts).claims; descriptors are this account's services directory, any service, as {service, instance, port}; listeners every listener accepting on 127.0.0.1:<port>, a wildcard bind (0.0.0.0, [::]) included, as {port, account}: the caller lists a wildcard bind among them, and no vector carries an address; ownListener whether this instance's own listener holds the recorded port; squatted whether this account's own claim path exists with another owner, and then no claim is read. The answer is {port, kept, reason, notes} or {fault: no-free-port, notes}; reason kept-own-listener, kept-free, new-none-recorded, or new-held-by- followed by the first holder of the recorded port in the order descriptor, claim-other-account, claim-other-service, listener; a new port is the first candidate no listener, no other id.instance's descriptor, and no claim of another account or of another service in this account names; notes holds claim-path-squatted when squatted. rebuild: rebuildClaim({account, service, descriptors, ownState, now}): the ports of this service's descriptors in the account and its own state, once each, ascending, in a claim with updatedAt now; {delete: true} when none remains; {fault: claim-invalid} when that claim would not be a valid passioncode-port-claim/1 document (more than 64 ports, a port outside 1 to 65535, an account that is not a uid or a SID, now not a UTC instant with Z); the old claim is never read. A service is at most 130 characters and an account at most 100, so a file name is at most 255 bytes.",
    fileName: fileNameCases(),
    read: readCases(),
    choose: chooseCases(),
    rebuild: rebuildCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildPortClaimVectors(): string {
  return `${JSON.stringify(portClaimVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildPortClaimVectors();
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
