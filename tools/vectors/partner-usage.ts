/**
 * The generator of the partner-usage vectors (DEC-0090 item 2): `fixtures/vectors/partner-usage.json`, shared by every
 * organization server that shows a partner organization its agents' usage.
 *
 *   tsx tools/vectors/partner-usage.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/partner-usage.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/partner-usage.test.ts` runs the check.
 * Each expected answer is written below by hand from DEC-0090's item 2. Nothing here imports `src/partner-usage.ts`, so
 * the gate checks that the reference returns what this file expects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/partner-usage.json";

const SETUP = "urn:fabric:agent:acme:setup-desk";
const BOOKS = "urn:fabric:agent:acme:books";
const OTHER = "urn:fabric:agent:example:inbox-digest";
const row = (agentRef: string, day: string, calls: number, unpricedCalls: number, costUsd: number | null) => ({ agentRef, day, calls, unpricedCalls, costUsd });
const cell = (agentRef: string, day: string | null, calls: number, unpricedCalls: number, costUsd: number | null) => ({ agentRef, day, calls, unpricedCalls, costUsd });
const FAULT = { fault: "input-invalid" };

function cases(): Json[] {
  const usage = [row(SETUP, "2026-10-12", 4, 0, 0.25), row(SETUP, "2026-10-13", 2, 1, 0.5), row(BOOKS, "2026-10-12", 1, 1, null), row(OTHER, "2026-10-12", 9, 0, 3), row(SETUP, "2026-10-12", 1, 0, 0.125)];
  const list: Array<[string, Json, Json]> = [
    ["per day: the partner's agents only, two rows of one agent and day summed", { usage, publishers: ["acme"], step: "day" }, { cells: [cell(BOOKS, "2026-10-12", 1, 1, null), cell(SETUP, "2026-10-12", 5, 0, 0.375), cell(SETUP, "2026-10-13", 2, 1, 0.5)] }],
    ["per period: one cell per agent", { usage, publishers: ["acme"], step: "period" }, { cells: [cell(BOOKS, null, 1, 1, null), cell(SETUP, null, 7, 1, 0.875)] }],
    ["a cell is unpriced only when every call in it is", { usage: [row(BOOKS, "2026-10-12", 1, 1, null), row(BOOKS, "2026-10-13", 2, 0, 1)], publishers: ["acme"], step: "period" }, { cells: [cell(BOOKS, null, 3, 1, 1)] }],
    ["another publisher's agents add nothing", { usage, publishers: ["globex"], step: "day" }, { cells: [] }],
    ["no publishers: nothing", { usage, publishers: [], step: "day" }, { cells: [] }],
    ["no usage: nothing", { usage: [], publishers: ["acme"], step: "day" }, { cells: [] }],
    ["a step that is neither day nor period", { usage, publishers: ["acme"], step: "hour" }, FAULT],
    ["a publisher name that is not one", { usage, publishers: ["Acme"], step: "day" }, FAULT],
    ["a row without an agent", { usage: [{ ...row(SETUP, "2026-10-12", 1, 0, 1), agentRef: undefined }], publishers: ["acme"], step: "day" }, FAULT],
    ["a day that does not exist", { usage: [row(SETUP, "2026-02-30", 1, 0, 1)], publishers: ["acme"], step: "day" }, FAULT],
    ["no calls", { usage: [row(SETUP, "2026-10-12", 0, 0, null)], publishers: ["acme"], step: "day" }, FAULT],
    ["more unpriced calls than calls", { usage: [row(SETUP, "2026-10-12", 1, 2, null)], publishers: ["acme"], step: "day" }, FAULT],
    ["a zero cost for an unpriced row", { usage: [row(SETUP, "2026-10-12", 1, 1, 0)], publishers: ["acme"], step: "day" }, FAULT],
    ["a null cost for a priced row", { usage: [row(SETUP, "2026-10-12", 1, 0, null)], publishers: ["acme"], step: "day" }, FAULT],
    ["a negative cost", { usage: [row(SETUP, "2026-10-12", 1, 0, -1)], publishers: ["acme"], step: "day" }, FAULT],
    ["not an object", null, FAULT]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

/** The vectors as an object. */
export function partnerUsageVectors(): Json {
  return {
    about: "Vectors for a partner's view of its agents' usage (DEC-0090 item 2), written by tools/vectors/partner-usage.ts, never by hand. partnerUsage(input): input is {usage, publishers, step}, usage the organization server's joined grant.usage rows {agentRef, day, calls, unpricedCalls, costUsd}, publishers the partner's publisher names, step day or period; the answer is {cells} ordered by agentRef then day, a cell {agentRef, day (null per period), calls, unpricedCalls, costUsd (null exactly when every call is unpriced)}, or {fault: input-invalid}.",
    cases: cases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildPartnerUsageVectors(): string {
  return `${JSON.stringify(partnerUsageVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildPartnerUsageVectors();
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
