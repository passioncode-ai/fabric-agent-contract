/**
 * The generator of the role-slot vectors (DEC-0167): `fixtures/vectors/role-slot.json`, shared by every registry that
 * keeps an estate's role slots (Fabric's hub) and every writer that holds one (the estate's manager session).
 *
 *   tsx tools/vectors/role-slot.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/role-slot.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/role-slot.test.ts` runs the check.
 * Each case's expected answer is written by hand.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/role-slot.json";

const ref = (id: string, revision: number, fill: string) => ({ id, revision, contentHash: `sha256:${fill.repeat(32)}` });
const MANAGER = ref("urn:binding:estate:manager", 2, "15");
const SUCCESSOR = ref("urn:binding:estate:manager-2", 1, "16");
const slot = (epoch: number, holder: Json, extra: Json = {}): Json => ({
  type: "role-slot/1", estate: "urn:estate:one", role: "ceo", scope: { estate: "urn:estate:one" }, epoch, holder, since: "2026-11-12T10:00:00Z", ...extra
});

/** MG-3: a write is taken only from the holder at the current epoch. */
function writeCases(): Json[] {
  const current = slot(3, MANAGER);
  return [
    ["the holder at the current epoch", { slot: current, write: { epoch: 3, holder: MANAGER } }, { ok: true }],
    ["the holder's id in another spelling", { slot: current, write: { epoch: 3, holder: { ...MANAGER, id: "URN:binding:estate:manager" } } }, { ok: true }],
    ["the previous holder at its older epoch, on a live transport", { slot: current, write: { epoch: 2, holder: MANAGER } }, { ok: false, refused: "slot-epoch-stale" }],
    ["a holder naming its own higher epoch", { slot: current, write: { epoch: 4, holder: MANAGER } }, { ok: false, refused: "slot-epoch-unknown" }],
    ["an epoch that is not an integer", { slot: current, write: { epoch: "3", holder: MANAGER } }, { ok: false, refused: "slot-epoch-unknown" }],
    ["another binding at the current epoch", { slot: current, write: { epoch: 3, holder: SUCCESSOR } }, { ok: false, refused: "slot-not-holder" }],
    ["the holder's next revision at the current epoch", { slot: current, write: { epoch: 3, holder: { ...MANAGER, revision: 3 } } }, { ok: false, refused: "slot-not-holder" }]
  ].map(([name, input, answer]) => ({ name, input, answer }));
}

/** MG-3, MG-4: the next revision of a slot keeps it and raises the epoch with a new holder. */
function successionCases(): Json[] {
  return [
    ["a new holder at a higher epoch", { previous: slot(3, MANAGER), next: slot(4, SUCCESSOR) }, []],
    ["the same holder at the same epoch", { previous: slot(3, MANAGER), next: slot(3, MANAGER, { since: "2026-11-12T11:00:00Z" }) }, []],
    ["a new holder at a repeated epoch", { previous: slot(3, MANAGER), next: slot(3, SUCCESSOR) }, ["FAC-SEM-174 /next/epoch"]],
    ["the same holder at a new epoch", { previous: slot(3, MANAGER), next: slot(4, MANAGER) }, ["FAC-SEM-174 /next/epoch"]],
    ["an epoch that goes back", { previous: slot(3, MANAGER), next: slot(2, SUCCESSOR) }, ["FAC-SEM-174 /next/epoch"]],
    ["another estate's slot", { previous: slot(3, MANAGER), next: slot(4, SUCCESSOR, { estate: "urn:estate:two", scope: { estate: "urn:estate:two" } }) }, ["FAC-SEM-174 /next/scope"]]
  ].map(([name, input, findings]) => ({ name, input, findings }));
}

export function roleSlotVectors(): Json {
  return {
    about: "Vectors for an estate's role slots (role-slot/1, DEC-0167), written by tools/vectors/role-slot.ts, never by hand. writes: slotWrite(input.slot, input.write) answers answer (MG-3). successions: the codes and paths of evaluateSemanticRules(\"role-slot-succession\", input), in order (MG-3, MG-4).",
    writes: writeCases(),
    successions: successionCases()
  };
}

export function buildRoleSlotVectors(): string {
  return `${JSON.stringify(roleSlotVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildRoleSlotVectors();
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
