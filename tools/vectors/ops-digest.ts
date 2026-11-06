/**
 * The generator of the operations digest vectors (DEC-0153): `fixtures/vectors/ops-digest.json`, shared by every
 * product that folds its operations log into `ops.digest.hourly@1` and `ops.digest.daily@1`.
 *
 *   tsx tools/vectors/ops-digest.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/ops-digest.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/ops-digest.test.ts` runs the check.
 * Each expected digest is written below by hand from DEC-0153 (OD-3, OD-4). Nothing here imports `src/ops-digest.ts`,
 * so the gate checks that the reference folds return what this file expects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/ops-digest.json";

const c = (op: string, ok: number, failed: number, unknown: number) => ({ op, ok, failed, unknown });
const t = (ok: number, failed: number, unknown: number) => ({ ok, failed, unknown });
const hour = (from: string, to: string, ops: Json[], total: Json, risen: Json[]) => ({ schema: "ops.digest.hourly@1", from, to, ops, total, risen });
const H17 = "2026-11-04T17:00:00.000Z";
const H18 = "2026-11-04T18:00:00.000Z";
const H16 = "2026-11-04T16:00:00.000Z";
const H14 = "2026-11-04T14:00:00.000Z";
const H15 = "2026-11-04T15:00:00.000Z";

function hourCases(): Json[] {
  const before5 = hour(H16, H17, [c("cycle.receipt", 0, 5, 0)], t(0, 5, 0), []);
  const before6 = hour(H16, H17, [c("cycle.receipt", 0, 6, 0)], t(0, 6, 0), []);
  const list: Array<[string, Json, Json]> = [
    ["counts by operation and outcome, sorted by name, with the hour's window and totals",
      { counts: [c("ipc.work:home", 5, 0, 0), c("board.tick", 3, 2, 0), c("mcp.unparsed", 0, 0, 1)], from: H17, previous: null },
      hour(H17, H18, [c("board.tick", 3, 2, 0), c("ipc.work:home", 5, 0, 0), c("mcp.unparsed", 0, 0, 1)], t(8, 2, 1), [])],
    ["one operation's counts written twice are summed",
      { counts: [c("board.tick", 1, 0, 0), c("board.tick", 2, 1, 0)], from: H17, previous: null },
      hour(H17, H18, [c("board.tick", 3, 1, 0)], t(3, 1, 0), [])],
    ["an hour with nothing recorded is a digest with no operation",
      { counts: [], from: H17, previous: null },
      hour(H17, H18, [], t(0, 0, 0), [])],
    ["twice the hour before and at least 10: a rise",
      { counts: [c("cycle.receipt", 0, 10, 0)], from: H17, previous: before5 },
      hour(H17, H18, [c("cycle.receipt", 0, 10, 0)], t(0, 10, 0), [{ op: "cycle.receipt", failed: 10, previous: 5 }])],
    ["9 failures after 5: below the minimum of 10 (and short of twice), no rise",
      { counts: [c("cycle.receipt", 0, 9, 0)], from: H17, previous: before5 },
      hour(H17, H18, [c("cycle.receipt", 0, 9, 0)], t(0, 9, 0), [])],
    ["10 failures after 6: at least 10 but short of twice the hour before, no rise",
      { counts: [c("cycle.receipt", 0, 10, 0)], from: H17, previous: before6 },
      hour(H17, H18, [c("cycle.receipt", 0, 10, 0)], t(0, 10, 0), [])],
    ["9 failures with none the hour before: below the minimum, no rise",
      { counts: [c("x", 0, 9, 0)], from: H17, previous: null },
      hour(H17, H18, [c("x", 0, 9, 0)], t(0, 9, 0), [])],
    ["10 failures with none the hour before: none counts as one, a rise",
      { counts: [c("x", 0, 10, 0)], from: H17, previous: null },
      hour(H17, H18, [c("x", 0, 10, 0)], t(0, 10, 0), [{ op: "x", failed: 10, previous: 0 }])],
    ["after a gap the earlier hour is no baseline",
      { counts: [c("x", 0, 20, 0)], from: H17, previous: hour(H14, H15, [c("x", 0, 40, 0)], t(0, 40, 0), [{ op: "x", failed: 40, previous: 0 }]) },
      hour(H17, H18, [c("x", 0, 20, 0)], t(0, 20, 0), [{ op: "x", failed: 20, previous: 0 }])],
    ["an MCP method's name, with a slash, is an operation",
      { counts: [c("mcp.tools/list", 4, 0, 0), c("mcp.notifications/cancelled", 0, 0, 1)], from: H17, previous: null },
      hour(H17, H18, [c("mcp.notifications/cancelled", 0, 0, 1), c("mcp.tools/list", 4, 0, 0)], t(4, 0, 1), [])],
    ["a from written without a fraction is the same hour",
      { counts: [c("x", 1, 0, 0)], from: "2026-11-04T17:00:00Z", previous: null },
      hour(H17, H18, [c("x", 1, 0, 0)], t(1, 0, 0), [])]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

function dayCases(): Json[] {
  const h1 = hour("2026-11-04T01:00:00.000Z", "2026-11-04T02:00:00.000Z", [c("x", 0, 12, 0), c("y", 1, 0, 0)], t(1, 12, 0), [{ op: "x", failed: 12, previous: 0 }]);
  const h2 = hour("2026-11-04T02:00:00.000Z", "2026-11-04T03:00:00.000Z", [c("x", 0, 30, 0), c("z", 0, 11, 0)], t(0, 41, 0), [{ op: "x", failed: 30, previous: 12 }, { op: "z", failed: 11, previous: 0 }]);
  const other = hour("2026-11-05T00:00:00.000Z", "2026-11-05T01:00:00.000Z", [c("x", 0, 99, 0)], t(0, 99, 0), [{ op: "x", failed: 99, previous: 0 }]);
  const list: Array<[string, Json, Json]> = [
    ["the day's hours summed and counted, each rise with the hours it rose in, the most failures first; another day's hour left out",
      { day: "2026-11-04", hourly: [h1, h2, other] },
      { schema: "ops.digest.daily@1", day: "2026-11-04", hours: 2, ops: [c("x", 0, 42, 0), c("y", 1, 0, 0), c("z", 0, 11, 0)], total: t(1, 53, 0), risen: [{ op: "x", hours: 2, failed: 42 }, { op: "z", hours: 1, failed: 11 }] }],
    ["an hour written twice is folded once, the first line kept",
      { day: "2026-11-04", hourly: [h1, { ...h1, ops: [c("x", 0, 50, 0)], total: t(0, 50, 0), risen: [] }] },
      { schema: "ops.digest.daily@1", day: "2026-11-04", hours: 1, ops: [c("x", 0, 12, 0), c("y", 1, 0, 0)], total: t(1, 12, 0), risen: [{ op: "x", hours: 1, failed: 12 }] }],
    ["rises of equal failures ordered by name",
      { day: "2026-11-05", hourly: [hour("2026-11-05T00:00:00.000Z", "2026-11-05T01:00:00.000Z", [c("b", 0, 10, 0), c("a", 0, 10, 0)], t(0, 20, 0), [{ op: "a", failed: 10, previous: 0 }, { op: "b", failed: 10, previous: 0 }])] },
      { schema: "ops.digest.daily@1", day: "2026-11-05", hours: 1, ops: [c("a", 0, 10, 0), c("b", 0, 10, 0)], total: t(0, 20, 0), risen: [{ op: "a", hours: 1, failed: 10 }, { op: "b", hours: 1, failed: 10 }] }]
  ];
  const none: Array<[string, Json, null]> = [
    ["a day with no hour of its own has no digest", { day: "2026-11-06", hourly: [h1, other] }, null]
  ];
  return [...list, ...none].map(([name, input, expected]) => ({ name, input, expected }));
}

/** The vectors as an object. */
export function opsDigestVectors(): Json {
  return {
    about: "Vectors for the operations digests (DEC-0153), written by tools/vectors/ops-digest.ts, never by hand. hour: foldHour(input.counts, input.from, input.previous), counts a list of {op, ok, failed, unknown} (an op may repeat and is summed), from a whole UTC hour, previous the hour before's digest or null; the answer is the ops.digest.hourly@1 digest, from and to as Date.prototype.toISOString writes them. day: foldDay(input.day, input.hourly); the answer is the ops.digest.daily@1 digest, or null for a day with no hour of its own, which has no digest (OD-5). A rise is at least 10 failures in the hour and at least twice the hour before's, an hour before with none (or not closed) counting as one (OD-4).",
    hour: hourCases(),
    day: dayCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildOpsDigestVectors(): string {
  return `${JSON.stringify(opsDigestVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildOpsDigestVectors();
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
