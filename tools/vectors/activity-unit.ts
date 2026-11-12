/**
 * The generator of the unit-of-work vectors (DEC-0164): `fixtures/vectors/activity-unit.json`, shared by every writer of
 * a `unit` event (an agent's kit, a device collector) and every reader (Project Observatory's journal).
 *
 *   tsx tools/vectors/activity-unit.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/activity-unit.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/activity-unit.test.ts` runs the
 * check. The `sourceKey` and `eventId` are derived here from DEC-0164 AE-2 and activity's *Event id* with the settings
 * canonical form, not by importing `src/activity-rules.ts`, so the gate checks that the reference agrees. Each case's
 * expected schema answer and rule codes are written by hand.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { settingsCanonicalJson } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/activity-unit.json";

const hex = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const sourceKey = (agent: string, unit: Json, transition: string, root: string) =>
  `sha256:${hex(settingsCanonicalJson({ agent, key: unit.key, run: root, system: unit.system, transition }))}`;
const eventId = (key: string) => `sha256:${hex(settingsCanonicalJson({ key, source: "unit" }))}`;

const AGENT = "example-writer.default";
const UNIT = { system: "github", key: "example-org:site#412" };
const RUN_1 = "run-4b1d9e02";
const RUN_2 = "run-7c3a5f18";
const MAP = { id: "classes-2026-11", revision: 3 };

/** One `unit` event, its ids derived, the envelope a device collector writes. */
function unit(transition: string, extra: Json = {}, root = RUN_1, seq = 1, envelope: Json = {}): Json {
  const key = sourceKey(AGENT, UNIT, transition, root);
  return {
    protocol: "fabric-activity/0.1", eventId: eventId(key), kind: "unit", source: "unit", sourceKey: key,
    collector: { id: "observatory-node", epoch: 4 }, seq, occurred: "2026-11-12T10:00:00Z", bootId: "boot-7c41e2", monotonicNs: "0",
    project: { id: "example-project" }, run: { root },
    data: { agent: AGENT, unit: UNIT, transition, taskClass: "code.change", taskClassMap: MAP, cost: { usd: 0.42, basis: "provider" }, ...extra },
    ...envelope
  };
}

const accepted = (root: string, seq: number, by: Json = { kind: "rule", ref: "ci-green-and-reviewed" }) =>
  unit("accepted", { acceptedBy: by, acceptedAt: "2026-11-12T09:58:00Z" }, root, seq);

function cases(): Json[] {
  const valid = (name: string, event: Json): Json => ({ name, event, schemaValid: true, findings: [] });
  const list: Json[] = [
    // AE-1: each transition.
    valid("started", unit("started")),
    valid("ended, completed", unit("ended", { outcome: "completed", evidence: ["https://ci.example/runs/88", `sha256:${"ab".repeat(32)}`] })),
    valid("handed over", unit("handed-over")),
    valid("accepted by a rule", accepted(RUN_1, 4)),
    valid("accepted by a person's pairwise subject, kept in the organization's journal (AE-3)", accepted(RUN_1, 4, { kind: "person", ref: "m-7f3a91c2" })),
    // AE-2: a reopened unit accepted again under a new run.root is a new event.
    valid("accepted again after a reopening, under a new run.root", accepted(RUN_2, 9)),
    // AE-1: the class and its map; an unknown cost.
    valid("unclassified, with no map", unit("started", { taskClass: "unclassified", taskClassMap: undefined })),
    valid("an unknown cost is null", unit("started", { cost: { usd: null } })),
    // Refused by the schema.
    { name: "a classified unit without its map", event: unit("started", { taskClassMap: undefined }), schemaValid: false, findings: [] },
    { name: "a unit with a user", event: unit("started", {}, RUN_1, 1, { user: { id: "m-7f3a91c2" } }), schemaValid: false, findings: [] },
    { name: "an outcome on a start", event: unit("started", { outcome: "completed" }), schemaValid: false, findings: [] },
    { name: "an acceptance without who accepted", event: unit("accepted", { acceptedAt: "2026-11-12T09:58:00Z" }), schemaValid: false, findings: [] },
    { name: "a unit without a project", event: (({ project: _p, ...rest }) => rest)(unit("started")), schemaValid: false, findings: [] },
    // FAC-SEM-171: the derived key.
    { name: "a sourceKey derived from another run.root", event: { ...unit("accepted", { acceptedBy: { kind: "agent", ref: "example-reviewer" }, acceptedAt: "2026-11-12T09:58:00Z" }), run: { root: RUN_2 } }, schemaValid: true, findings: ["FAC-SEM-171 /sourceKey"] },
    { name: "an acceptance recorded before it happened", event: accepted(RUN_1, 4, undefined), schemaValid: true, findings: [] }
  ].map((c) => ({ ...c, event: JSON.parse(JSON.stringify(c.event)) }));
  const late = list[list.length - 1] as Json;
  late.name = "an acceptance recorded before it happened";
  late.event.data.acceptedAt = "2026-11-12T10:05:00Z";
  late.findings = ["FAC-SEM-171 /data/acceptedAt"];
  return list;
}

export function activityUnitVectors(): Json {
  return {
    about: "Vectors for the unit-of-work event, telemetry-event kind unit (DEC-0164), written by tools/vectors/activity-unit.ts, never by hand. Each event's sourceKey is sha256: of the settings-form canonical JSON {agent, key, run, system, transition} (unit.key, run.root, unit.system), and its eventId sha256: of the settings-form canonical JSON {key: sourceKey, source: \"unit\"}. cases: schemaValid is the event against telemetry-event.schema.json; findings are the codes and paths of evaluateSemanticRules(\"telemetry-event\", event), in order. A repeated write of one transition has the same eventId (the first two accepted events of run.root run-4b1d9e02 share one); a unit accepted again under another run.root has another.",
    cases: cases()
  };
}

export function buildActivityUnitVectors(): string {
  return `${JSON.stringify(activityUnitVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildActivityUnitVectors();
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
