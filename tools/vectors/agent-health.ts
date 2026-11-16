/**
 * The generator of the agent-health vectors (DEC-0179): `fixtures/vectors/agent-health.json`, shared by every product
 * that answers `agent-health/1` and every watcher that reads it.
 *
 *   tsx tools/vectors/agent-health.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/agent-health.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/agent-health.test.ts` runs the check.
 * Each expected answer is written below from DEC-0179's text (HL-2, HL-5, HL-6); nothing here imports
 * `src/agent-health.ts`, so the gate checks that the reference returns what this file expects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, unknown>;
export const VECTOR_FILE = "fixtures/vectors/agent-health.json";

const check = (id: string, area: string, state: string, count = 0, fix?: Json | null): Json =>
  fix === undefined ? { id, area, state, count } : { id, area, state, count, fix };
const report = (state: string, checks: Json[], more: Json = {}): Json =>
  ({ schema: "agent-health/1", product: "switchboard", version: "0.7.102", at: 1794830000, state, checks, ...more });

/** HL-2: worstState(states). */
function worst(): Json[] {
  const list: Array<[string, unknown[], string]> = [
    ["no checks: unknown, never ok", [], "unknown"],
    ["one ok", ["ok"], "ok"],
    ["ok and unknown: unknown, an unmeasured check is not healthy", ["ok", "unknown"], "unknown"],
    ["unknown and warn: warn", ["unknown", "warn"], "warn"],
    ["warn and fail: fail", ["warn", "fail"], "fail"],
    ["fail first, then ok: fail, order does not matter", ["fail", "ok"], "fail"],
    ["every state: fail", ["ok", "unknown", "warn", "fail"], "fail"],
    ["a value that is no state: unknown", ["ok", "healthy"], "unknown"]
  ];
  return list.map(([name, states, expected]) => ({ name, input: states, expected }));
}

/** HL-5: readHealth(answer). */
function read(): Json[] {
  const list: Array<[string, unknown, Json]> = [
    ["a valid report: its state", report("fail", [check("owner", "lifecycle", "ok", 0, null), check("sessions_stuck", "sessions", "fail", 2, { capability: "incident.fix" })]), { state: "fail" }],
    ["a valid ok report", report("ok", [check("owner", "lifecycle", "ok")]), { state: "ok" }],
    ["a valid report with no checks: unknown", report("unknown", []), { state: "unknown" }],
    ["no answer (a timeout, a refused call): unknown", null, { state: "unknown", reason: "no-answer" }],
    ["a report with a field the schema does not name: unknown", report("ok", [check("owner", "lifecycle", "ok")], { note: "all good" }), { state: "unknown", reason: "schema" }],
    ["another revision: unknown", { ...report("ok", [check("owner", "lifecycle", "ok")]), schema: "agent-health/2" }, { state: "unknown", reason: "schema" }],
    ["a report that says ok while a check fails: unknown", report("ok", [check("owner", "lifecycle", "fail", 1)]), { state: "unknown", reason: "FAC-SEM-181" }],
    ["a report that says ok with no checks: unknown", report("ok", []), { state: "unknown", reason: "FAC-SEM-181" }],
    ["a report that names one check twice: unknown", report("ok", [check("owner", "lifecycle", "ok"), check("owner", "lifecycle", "ok")]), { state: "unknown", reason: "FAC-SEM-181" }]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

/** HL-6: episodeKey(product, checkId, at). */
function episodes(): Json[] {
  const list: Array<[string, [string, string, number], string]> = [
    ["the UTC day of the opening reading", ["switchboard", "sessions_stuck", 1794830000], "switchboard:sessions_stuck@2026-11-16"],
    ["the last second of a UTC day", ["passioncode", "disk_free", 1794873599], "passioncode:disk_free@2026-11-16"],
    ["the first second of the next UTC day", ["passioncode", "disk_free", 1794873600], "passioncode:disk_free@2026-11-17"],
    ["the epoch", ["observatory", "leaked_keys", 0], "observatory:leaked_keys@1970-01-01"]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

/** The vectors as an object. */
export function agentHealthVectors(): Json {
  return {
    about: "Vectors for agent-health/1 (DEC-0179), written by tools/vectors/agent-health.ts, never by hand. worst: worstState(input), the worst of a list of states in the order ok < unknown < warn < fail, unknown for an empty list or for a value that is no state (HL-2). read: readHealth(input), what a reader counts from one answer, input null standing for no answer: {state} of a report valid by schemas/agent-health.schema.json and FAC-SEM-181, otherwise {state: unknown, reason: no-answer | schema | FAC-SEM-181} (HL-5). episodes: episodeKey(product, checkId, at), the key <product>:<check id>@<YYYY-MM-DD> with the UTC day of the reading that opened the episode, at in Unix seconds (HL-6).",
    worst: worst(),
    read: read(),
    episodes: episodes()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildAgentHealthVectors(): string {
  return `${JSON.stringify(agentHealthVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildAgentHealthVectors();
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
