/**
 * The generator of the operator-hold vectors (DEC-0079): `fixtures/vectors/comms-hold.json`.
 *
 *   tsx tools/vectors/comms-hold.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/comms-hold.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/comms-hold.test.ts` runs the check.
 * The expected outcome of every case comes from the decision's matrix written below as data (`ROWS`, DEC-0079 items 3
 * and 4) and from the hand-written lax cases. Nothing here imports `src/comms-hold.ts`: the gate then checks that the
 * reference returns what this file expects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
type Scope = "thread" | "project" | "slot";
const SCOPES: readonly Scope[] = ["thread", "project", "slot"];
export const VECTOR_FILE = "fixtures/vectors/comms-hold.json";

/** The vectors as an object: every tool with no hold, under each scope alone and under all three, then the lax cases. */
export function commsHoldVectors(): Json {
  const T = "thr-held-0001", P = "proj-b", C = "publish";
  const HOLDS: Record<Scope, Json> = {
    thread: { threads: [T] },
    project: { projects: [P] },
    slot: { slots: [{ project: P, capability: C }] }
  };
  // The decision's matrix (DEC-0079 items 3 and 4): for each tool and target form, the scopes that refuse it.
  const full = { thread: T, project: P, capability: C };
  const slotOnly = { project: P, capability: C };
  const ROWS: Array<[string, string, Json, Scope[]]> = [
    ["com.submit", "a message or request into an existing thread", full, ["thread"]],
    ["com.reply", "a participant's reply", { thread: T }, ["thread"]],
    ["com.reply", "a responder's fenced reply", { ...full, fenced: true }, []],
    ["com.enroll", "enrolling in a slot", slotOnly, ["project", "slot"]],
    ["com.responder_replace", "replacing a slot's responder", slotOnly, ["project", "slot"]],
    ["com.claim", "claiming a named request", full, ["thread", "project", "slot"]],
    ["com.claim", "claiming the oldest claimable request of a slot", slotOnly, ["project", "slot"]],
    ["com.accept", "accepting a claimed request", full, ["thread", "project", "slot"]],
    ["com.effect_begin", "beginning an accepted request's effect", full, ["thread", "project", "slot"]],
    ["com.complete", "completing started work", full, []],
    ["com.reconcile", "reconciling an outcome_unknown request", full, []],
    ["com.progress", "reporting progress, with or without a note", full, []],
    ["com.renew", "renewing the slot's and attempt's lease", full, []],
    ["com.cancel", "the sender cancelling its request", full, []],
    ["com.read_ack", "marking a message read", { thread: T }, []],
    ["com.list", "reading a page", { thread: T }, []],
    ["com.get", "reading a message", { thread: T }, []],
    ["com.status", "reading the Project's status", slotOnly, []],
    ["com.directory", "reading the directory", {}, []]
  ];
  const cases: Json[] = [];
  for (const [tool, what, target, scopes] of ROWS) {
    cases.push({ name: `${tool}: ${what}, no hold`, tool, target, holds: {}, refused: false });
    for (const scope of SCOPES) {
      cases.push({ name: `${tool}: ${what}, ${scope} held`, tool, target, holds: HOLDS[scope], refused: scopes.includes(scope) });
    }
    cases.push({ name: `${tool}: ${what}, thread, Project and slot all held`, tool, target, holds: { ...HOLDS.thread, ...HOLDS.project, ...HOLDS.slot }, refused: scopes.length > 0 });
  }
  const all = { ...HOLDS.thread, ...HOLDS.project, ...HOLDS.slot };
  const lax: Json[] = [
    { name: "lax: a fenced reply into a held thread is never refused (a port that refuses every com.reply in a held thread is wrong)", tool: "com.reply", target: { thread: T, fenced: true }, holds: HOLDS.thread, refused: false },
    { name: "lax: a fenced reply whose fenced is not the boolean true is a participant's reply", tool: "com.reply", target: { thread: T, fenced: "true" }, holds: HOLDS.thread, refused: true },
    { name: "lax: a request submitted into an unheld thread to a held Project is not refused; it queues and waits", tool: "com.submit", target: full, holds: { ...HOLDS.project, ...HOLDS.slot }, refused: false },
    { name: "lax: a new thread (no thread yet) is never thread-held", tool: "com.submit", target: slotOnly, holds: all, refused: false },
    { name: "lax: a participant's reply is not refused by a hold on its Project or slot", tool: "com.reply", target: full, holds: { ...HOLDS.project, ...HOLDS.slot }, refused: false },
    { name: "lax: enrolling is not refused by a thread hold, even with the thread named", tool: "com.enroll", target: full, holds: HOLDS.thread, refused: false },
    { name: "lax: replacing a responder is not refused by a thread hold, even with the thread named", tool: "com.responder_replace", target: full, holds: HOLDS.thread, refused: false },
    { name: "lax: Project ids compare as written; a hold on Proj-B does not hold proj-b", tool: "com.accept", target: full, holds: { projects: ["Proj-B"] }, refused: false },
    { name: "lax: thread ids compare as written; a hold on THR-HELD-0001 does not hold thr-held-0001", tool: "com.claim", target: full, holds: { threads: ["THR-HELD-0001"] }, refused: false },
    { name: "lax: a slot hold names a Project and a capability; the same capability of another Project is not held", tool: "com.claim", target: full, holds: { slots: [{ project: "proj-c", capability: C }] }, refused: false },
    { name: "lax: a slot hold on another capability of the same Project does not hold this one", tool: "com.accept", target: full, holds: { slots: [{ project: P, capability: "publish.draft" }] }, refused: false },
    { name: "lax: a slot hold is not a prefix; publish does not hold publish.release", tool: "com.effect_begin", target: { thread: T, project: P, capability: "publish.release" }, holds: HOLDS.slot, refused: false },
    { name: "lax: capability names compare as written; a hold on Publish does not hold publish", tool: "com.enroll", target: slotOnly, holds: { slots: [{ project: P, capability: "Publish" }] }, refused: false },
    { name: "lax: a hold on another thread does not hold this one", tool: "com.submit", target: full, holds: { threads: ["thr-other-0002"] }, refused: false },
    { name: "repeat: a repeat of a submit whose receipt was stored before the hold answers that receipt", tool: "com.submit", target: { ...full, repeat: true }, holds: all, refused: false },
    { name: "repeat: a repeat of an accept whose receipt was stored before the hold answers that receipt", tool: "com.accept", target: { ...full, repeat: true }, holds: all, refused: false },
    { name: "repeat: repeat is only the boolean true", tool: "com.accept", target: { ...full, repeat: 1 }, holds: all, refused: true },
    { name: "unknown: a tool the board does not serve is never refused held (it is unsupported_capability)", tool: "com.release", target: full, holds: all, refused: false },
    { name: "unknown: tool names compare as written; COM.ACCEPT is not com.accept", tool: "COM.ACCEPT", target: full, holds: all, refused: false }
  ];
  return {
    about: "Vectors for the operator's hold on the Project board (DEC-0079, fabric-project-comms/0.1). Each case: holdRefuses(tool, target, holds) is refused. target is what the board resolved from its own records: thread (the existing thread written into, or the request's thread; absent for a new thread or a slot-only call), project and capability (the slot acted on, or the request's target), fenced (a com.reply carrying a responder's fence), repeat (the call repeats a key and digest whose receipt was stored before the hold). holds: threads, projects, and slots as {project, capability}. Ids and capability names compare as written. Every tool appears with no hold, under each scope alone and under all three; the lax cases are what a careless port gets wrong.",
    tools: ROWS.map((row) => row[0]).filter((tool, i, list) => list.indexOf(tool) === i),
    scopes: [...SCOPES],
    cases: [...cases, ...lax]
    };
}

/** What `--write` writes: the vector file's exact text. */
export function buildCommsHoldVectors(): string {
  return `${JSON.stringify(commsHoldVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildCommsHoldVectors();
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
