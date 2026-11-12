/**
 * The generator of the task-context vectors (DEC-0165): `fixtures/vectors/task-context.json`, shared by every agent that
 * can reach more than one context (an operator's personal estate and organizations on one machine) and by the hosts that
 * show it which contexts it reaches.
 *
 *   tsx tools/vectors/task-context.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/task-context.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected answer is written below by
 * hand from DEC-0165 TC-2 and TC-3; nothing here imports `src/task-context.ts`, so the gate checks that the reference
 * agrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/task-context.json";

const A = "org:org-a";
const B = "org:org-b";
const claim = (source: string, ...contexts: string[]) => ({ source, contexts });

function cases(): Json[] {
  const list: Array<[string, Json[], unknown, Json]> = [
    // One reachable context, or none: nothing to ask (TC-3's last sentence).
    ["one reachable context and no claim", [], [A], { settled: A, by: [] }],
    ["nothing reachable and no claim: personal", [], [], { settled: "personal", by: [] }],
    ["the same context reachable twice", [], [A, A], { settled: A, by: [] }],
    // Claims that agree settle it, by the sources in their order.
    ["the folder's Project claims one organization", [claim("folder", A)], [A, B, "personal"], { settled: A, by: ["folder"] }],
    ["the operator's words and the board request agree", [claim("operator", B), claim("board", B)], [A, B], { settled: B, by: ["operator", "board"] }],
    ["a Project with no organization claims personal", [claim("folder", "personal")], [A, "personal"], { settled: "personal", by: ["folder"] }],
    ["a claim outside the reachable contexts still settles it", [claim("grant", A)], [B], { settled: A, by: ["grant"] }],
    ["one source named twice", [claim("folder", A), claim("folder", A)], [A, B], { settled: A, by: ["folder"] }],
    // No claim and more than one reachable: ask once, every candidate an option (TC-3).
    ["no claim, two organizations reachable", [], [A, B], { ask: [A, B] }],
    ["no claim, personal and an organization reachable", [], ["personal", A], { ask: ["personal", A] }],
    // Claims that differ: a conflict, never a pick (TC-3).
    ["a Project listed for two organizations", [claim("folder", A, B)], [A, B], { conflict: [{ source: "folder", context: A }, { source: "folder", context: B }] }],
    ["the operator's words against the folder's Project", [claim("operator", B), claim("folder", A)], [A, B], { conflict: [{ source: "operator", context: B }, { source: "folder", context: A }] }],
    ["a grant's context against the place's", [claim("grant", A), claim("place", B)], [A, B], { conflict: [{ source: "grant", context: A }, { source: "place", context: B }] }],
    ["personal against an organization", [claim("board", "personal"), claim("folder", A)], [A, "personal"], { conflict: [{ source: "board", context: "personal" }, { source: "folder", context: A }] }],
    // Ids compare as written (DEC-0082).
    ["two spellings of one id are two contexts", [claim("operator", "org:Org-A"), claim("folder", "org:org-A")], [A], { conflict: [{ source: "operator", context: "org:Org-A" }, { source: "folder", context: "org:org-A" }] }],
    // The caller's own faults.
    ["a claim from an unknown source", [claim("rumour", A)], [A], { fault: "claims-invalid" }],
    ["a claim naming no context", [claim("folder")], [A], { fault: "claims-invalid" }],
    ["a claim naming something that is not a context", [claim("folder", "Org A")], [A], { fault: "claims-invalid" }],
    ["reachable is not a list", [], "org:org-a", { fault: "reachable-invalid" }]
  ];
  return list.map(([name, claims, reachable, expected]) => ({ name, claims, reachable, expected }));
}

export function taskContextVectors(): Json {
  return {
    about: "Vectors for the context of a task (DEC-0165), written by tools/vectors/task-context.ts, never by hand. cases: resolveTaskContext(claims, reachable); claims are {source, contexts} in the order the agent read them (sources: operator, board, folder, grant, place); expected is exactly what the reference returns.",
    cases: cases()
  };
}

export function buildTaskContextVectors(): string {
  return `${JSON.stringify(taskContextVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildTaskContextVectors();
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
