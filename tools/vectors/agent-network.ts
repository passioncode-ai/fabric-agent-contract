/**
 * The generator of the agent-network vectors (DEC-0104): `fixtures/vectors/agent-network.json`, shared by every hub,
 * node and organization server that derives a directory or runs a call queue.
 *
 *   tsx tools/vectors/agent-network.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/agent-network.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected answer is written below by
 * hand from DEC-0104; nothing here imports `src/agent-network.ts`, so the gate checks that the reference agrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/agent-network.json";

const DIGEST = `sha256:${"a".repeat(64)}`;
const INBOX = "urn:fabric:agent:example:inbox-digest";
const WRITER = "urn:fabric:agent:example:writer";
const ORG = "org_7kq2m4xw";
const place = (agentRef: string, context?: string) => ({ agentRef, digest: DIGEST, publisherKid: "example-publisher-2026", ...(context ? { context, grant: "urn:fabric:share:3f9c2a7e5b1d4c608e2f71a9d0b6c4e8" } : {}) });
const record = (...machines: Json[][]) => ({ machines: machines.map((packages, n) => ({ id: `m-${n}`, packages })) });
const entry = (agentRef: string, context: string, listed = true) => ({ agentRef, context, listed });

function estateCases(): Json[] {
  const cases: Array<[string, unknown, unknown, Json[]]> = [
    ["one personal placement", record([place(INBOX)]), [], [entry(INBOX, "personal")]],
    ["the same agent on two machines is one entry", record([place(INBOX)], [place(INBOX)]), [], [entry(INBOX, "personal")]],
    ["one agent in two contexts is two entries, the organization's first", record([place(INBOX), place(INBOX, `org:${ORG}`)]), [], [entry(INBOX, `org:${ORG}`), entry(INBOX, "personal")]],
    ["unlisted by the owner, still read by the owner", record([place(WRITER), place(INBOX)]), [{ agentRef: WRITER, context: "personal" }], [entry(INBOX, "personal"), entry(WRITER, "personal", false)]],
    ["an unlisted entry of another context leaves this one listed", record([place(INBOX)]), [{ agentRef: INBOX, context: `org:${ORG}` }], [entry(INBOX, "personal")]],
    ["no record", null, [], []],
    ["a placement without agentRef is skipped", record([{ digest: DIGEST }, place(INBOX)]), [], [entry(INBOX, "personal")]],
    ["machines that are not a list", { machines: "m-1" }, [], []]
  ];
  return cases.map(([name, rec, unlisted, expected]) => ({ name, record: rec, unlisted, expected }));
}

function organizationCases(): Json[] {
  const at = "2026-10-22T09:00:00Z";
  const active = (agentRef: string, change: Json = {}) => ({ user: "u-1", grantId: "urn:fabric:share:3f9c2a7e5b1d4c608e2f71a9d0b6c4e8", state: "active", grantRevision: 1, agentRef, startsAt: "2026-10-01T00:00:00Z", expiresAt: "2026-11-01T00:00:00Z", digest: DIGEST, ...change });
  const ctx = `org:${ORG}`;
  const cases: Array<[string, Json, Json[]]> = [
    ["a member reads an active registration", { held: [active(INBOX)], own: [], unlisted: [], viewer: "member" }, [entry(INBOX, ctx)]],
    ["two members share the same agent: one entry", { held: [active(INBOX), active(INBOX, { user: "u-2" })], own: [], unlisted: [], viewer: "member" }, [entry(INBOX, ctx)]],
    ["a withdrawn registration is not listed", { held: [{ user: "u-1", grantId: "urn:fabric:share:3f9c2a7e5b1d4c608e2f71a9d0b6c4e8", state: "withdrawn", withdrawnAt: "2026-10-10T00:00:00Z", digest: DIGEST }], own: [], unlisted: [], viewer: "member" }, []],
    ["a window not yet started", { held: [active(INBOX, { startsAt: "2026-10-23T00:00:00Z" })], own: [], unlisted: [], viewer: "member" }, []],
    ["a window that ended at the instant", { held: [active(INBOX, { expiresAt: at })], own: [], unlisted: [], viewer: "member" }, []],
    ["a window that starts at the instant", { held: [active(INBOX, { startsAt: at })], own: [], unlisted: [], viewer: "member" }, [entry(INBOX, ctx)]],
    ["the organization's own machine runs an agent", { held: [], own: [WRITER], unlisted: [], viewer: "member" }, [entry(WRITER, ctx)]],
    ["unlisted: a member does not see it", { held: [active(INBOX)], own: [WRITER], unlisted: [WRITER], viewer: "member" }, [entry(INBOX, ctx)]],
    ["unlisted: the administrator sees it marked", { held: [active(INBOX)], own: [WRITER], unlisted: [WRITER], viewer: "admin" }, [entry(INBOX, ctx), entry(WRITER, ctx, false)]],
    ["an owner is no viewer of an organization's directory", { held: [active(INBOX)], own: [], unlisted: [], viewer: "owner" }, []],
    ["an unreadable clock lists nothing", { held: [active(INBOX)], own: [], unlisted: [], viewer: "member", at: "today" }, []],
    ["an empty organization id lists nothing", { orgId: "", held: [], own: [WRITER], unlisted: [], viewer: "admin" }, []]
  ];
  return cases.map(([name, input, expected]) => ({ name, orgId: ORG, at, ...input, expected }));
}

function queueCases(): Json[] {
  const limits = { concurrency: 2, perCaller: 1, queueMax: 3 };
  const job = (id: string, caller: string, at: string) => ({ id, caller, at });
  const cases: Array<[string, Json, string | null]> = [
    ["the oldest job starts when nothing runs", { queue: [job("j2", "b", "2026-10-22T09:00:02Z"), job("j1", "a", "2026-10-22T09:00:01Z")], running: [], limits }, "j1"],
    ["nothing starts at the concurrency limit", { queue: [job("j3", "c", "2026-10-22T09:00:03Z")], running: [{ id: "j1", caller: "a" }, { id: "j2", caller: "b" }], limits }, null],
    ["a caller at its own limit waits; another caller's job starts", { queue: [job("j2", "a", "2026-10-22T09:00:01Z"), job("j3", "b", "2026-10-22T09:00:02Z")], running: [{ id: "j1", caller: "a" }], limits }, "j3"],
    ["every waiting caller at its limit: nothing starts", { queue: [job("j2", "a", "2026-10-22T09:00:01Z")], running: [{ id: "j1", caller: "a" }], limits }, null],
    ["fairness: the caller running fewer wins over an older job", { queue: [job("j3", "a", "2026-10-22T09:00:01Z"), job("j4", "b", "2026-10-22T09:00:05Z")], running: [{ id: "j1", caller: "a" }], limits: { concurrency: 4, perCaller: 3, queueMax: 9 } }, "j4"],
    ["between callers running as many, the oldest arrival", { queue: [job("j5", "b", "2026-10-22T09:00:02Z"), job("j4", "a", "2026-10-22T09:00:01Z")], running: [], limits }, "j4"],
    ["an arrival tie breaks by id", { queue: [job("jb", "b", "2026-10-22T09:00:01Z"), job("ja", "a", "2026-10-22T09:00:01Z")], running: [], limits }, "ja"],
    ["a caller's own jobs go in arrival order", { queue: [job("j9", "a", "2026-10-22T09:00:09Z"), job("j8", "a", "2026-10-22T09:00:08Z")], running: [], limits: { concurrency: 2, perCaller: 2, queueMax: 3 } }, "j8"],
    ["an arrival that is not a time is skipped", { queue: [job("j1", "a", "yesterday"), job("j2", "b", "2026-10-22T09:00:02Z")], running: [], limits }, "j2"],
    ["an arrival in lower case or at an offset is not a UTC instant: skipped", { queue: [job("j1", "a", "2026-10-22t09:00:01z"), job("j2", "b", "2026-10-22T11:00:00+02:00"), job("j3", "c", "2026-10-22T09:00:05Z")], running: [], limits }, "j3"],
    ["unreadable limits start nothing", { queue: [job("j1", "a", "2026-10-22T09:00:01Z")], running: [], limits: { concurrency: 0, perCaller: 1, queueMax: 3 } }, null],
    ["a running job without a caller still holds a slot", { queue: [job("j1", "a", "2026-10-22T09:00:01Z")], running: [{ id: "j0" }], limits: { concurrency: 1, perCaller: 1, queueMax: 9 } }, null],
    ["an empty queue starts nothing", { queue: [], running: [], limits }, null]
  ];
  return cases.map(([name, input, expected]) => ({ name, ...input, expected }));
}

function admitCases(): Json[] {
  const limits = { concurrency: 1, perCaller: 1, queueMax: 2 };
  const job = (id: string, caller: string, at: string) => ({ id, caller, at });
  const mine = job("jn", "n", "2026-10-22T09:00:09Z");
  const full = (after: number) => ({ admit: false, error: { code: "queue-full", message: "the agent's queue for this context is full: start again later", data: { retryable: true, retryAfterSeconds: after } } });
  const busy = [{ id: "r1", caller: "a" }];
  const two = [job("w1", "a", "2026-10-22T09:00:01Z"), job("w2", "b", "2026-10-22T09:00:02Z")];
  const cases: Array<[string, Json, Json]> = [
    ["room in the queue", { queue: [two[0]], running: busy, job: mine, limits, retryAfterSeconds: 30 }, { admit: true }],
    ["the queue is full", { queue: two, running: busy, job: mine, limits, retryAfterSeconds: 30 }, full(30)],
    ["an idle agent admits a start that runs at once, even with queueMax 0", { queue: [], running: [], job: mine, limits: { ...limits, queueMax: 0 }, retryAfterSeconds: 5 }, { admit: true }],
    ["queueMax 0 refuses a start that would wait", { queue: [], running: busy, job: mine, limits: { ...limits, queueMax: 0 }, retryAfterSeconds: 5 }, full(5)],
    ["a free slot behind a caller at its own limit: the start runs at once", { queue: [job("w1", "a", "2026-10-22T09:00:01Z")], running: busy, job: mine, limits: { concurrency: 4, perCaller: 1, queueMax: 1 }, retryAfterSeconds: 30 }, { admit: true }],
    ["an unreadable retry-after becomes 60", { queue: two, running: busy, job: mine, limits, retryAfterSeconds: 0 }, full(60)],
    ["a retry-after above an hour becomes 60", { queue: two, running: busy, job: mine, limits, retryAfterSeconds: 3601 }, full(60)],
    ["unreadable limits refuse", { queue: [], running: [], job: mine, limits: { concurrency: 1, perCaller: 1 }, retryAfterSeconds: 10 }, full(10)],
    ["a job whose arrival is not a UTC instant is refused", { queue: [], running: [], job: job("jn", "n", "2026-10-22T11:00:09+02:00"), limits, retryAfterSeconds: 10 }, full(10)]
  ];
  return cases.map(([name, input, expected]) => ({ name, ...input, expected }));
}

function callerCases(): Json[] {
  const owner = "urn:fabric:person:example:owner";
  const accepted = (principal: string, caller: string) => ({ ok: true, principal, caller });
  const cases: Array<[string, unknown, unknown, string | null]> = [
    ["the owner's own agent under a token", accepted(owner, "urn:fabric:agent:example:writer"), "hub-credential", '["delegated","urn:fabric:person:example:owner","urn:fabric:agent:example:writer"]'],
    ["a partner's agent under the same sub is another caller", accepted(owner, "urn:fabric:agent:partner:assistant"), "hub-credential", '["delegated","urn:fabric:person:example:owner","urn:fabric:agent:partner:assistant"]'],
    ["another person behind the same hub credential is another caller", accepted("urn:fabric:person:example:guest", "urn:fabric:agent:example:writer"), "hub-credential", '["delegated","urn:fabric:person:example:guest","urn:fabric:agent:example:writer"]'],
    ["no token: the credential (T0, T1, DL-26)", undefined, "local-session-7", '["credential","local-session-7"]'],
    ["a token the node did not accept: the credential", { ok: false, code: "token-invalid" }, "local-session-7", '["credential","local-session-7"]'],
    ["an empty principal: the credential", accepted("", "urn:fabric:agent:example:writer"), "local-session-7", '["credential","local-session-7"]'],
    ["neither readable", undefined, "", null]
  ];
  return cases.map(([name, acceptedValue, credential, expected]) => ({ name, accepted: acceptedValue, credential, expected }));
}

function positionCases(): Json[] {
  const cases: Array<[string, unknown, Json | null]> = [
    ["first of three", "queued 1 of 3", { position: 1, length: 3 }],
    ["last of three", "queued 3 of 3", { position: 3, length: 3 }],
    ["a position past the length", "queued 4 of 3", null],
    ["position zero", "queued 0 of 3", null],
    ["a pause is not a place in the queue", "quota-exhausted until 2026-10-22T10:00:00Z", null],
    ["extra words", "queued 1 of 3 behind a long job", null],
    ["a leading zero", "queued 01 of 3", null],
    ["not a string", 7, null]
  ];
  return cases.map(([name, statusMessage, expected]) => ({ name, statusMessage, expected }));
}

export function buildAgentNetworkVectors(): string {
  const vectors = {
    $comment: "Vectors for DEC-0104 (agent-network.md), written by tools/vectors/agent-network.ts, never by hand. estate: estateDirectory(record, unlisted). organization: organizationDirectory(orgId, held, own, unlisted, viewer, at); held is what decideShareRegistration keeps. queue: nextQueuedJob(queue, running, limits) is the id to start, null for none. admit: admitJob(queue, running, job, limits, retryAfterSeconds). caller: jobCallerKey(accepted, credential), accepted shaped as verifyDelegation answers. position: readQueuePosition(statusMessage). expected is exactly what the reference returns, with null for undefined; entries are sorted by context, then agentRef, as UTF-16 code units.",
    estate: estateCases(),
    organization: organizationCases(),
    queue: queueCases(),
    admit: admitCases(),
    caller: callerCases(),
    position: positionCases()
  };
  return `${JSON.stringify(vectors, null, 2)}\n`;
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const file = path.join(projectRoot(), VECTOR_FILE);
  const text = buildAgentNetworkVectors();
  if (process.argv.includes("--write")) writeFileSync(file, text);
  else if (readFileSync(file, "utf8") !== text) { console.error(`${VECTOR_FILE} is stale: run tsx tools/vectors/agent-network.ts --write`); process.exit(1); }
}
