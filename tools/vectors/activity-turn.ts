/**
 * The generator of the agent-turn and account-inventory vectors (DEC-0171): `fixtures/vectors/activity-turn.json`, shared
 * by every collector that writes a `turn` or an `account.inventory` event (Project Observatory's node) and every receiver
 * that reads them and builds `activity-summary/2`.
 *
 *   tsx tools/vectors/activity-turn.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/activity-turn.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/activity-turn.test.ts` runs the check.
 * The `sourceKey` and `eventId` are derived here from DEC-0171 RT-2 and SI-4 and activity's *Event id* with the settings
 * canonical form, not by importing `src/activity-rules.ts`, so the gate checks that the reference agrees. Each case's
 * expected schema answer, rule codes, route, population and bucket are written by hand.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { settingsCanonicalJson } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/activity-turn.json";

const hex = (text: string) => createHash("sha256").update(text, "utf8").digest("hex");
const eventId = (key: string, source: string) => `sha256:${hex(settingsCanonicalJson({ key, source }))}`;
const turnKey = (session: string, ordinal: number) => `sha256:${hex(settingsCanonicalJson({ ordinal, session }))}`;
const inventoryKey = (d: Json) => `sha256:${hex(settingsCanonicalJson({ billing: d.billing, day: d.day, holder: d.holder, plan: d.plan ?? null, provider: d.provider, tenantRef: d.tenantRef }))}`;

const TENANT = `sha256:${"7a".repeat(32)}`;
const OTHER_TENANT = `sha256:${"3c".repeat(32)}`;
const SESSION = "s-91c2e4";
const clone = (value: Json): Json => JSON.parse(JSON.stringify(value));

/** One `turn` event, its ids derived, as a device collector writes it after the day ends. */
function turn(data: Json = {}, envelope: Json = {}): Json {
  const d = { ordinal: 3, day: "2026-11-14", turnMs: 41_250, modelCalls: 4, modelMs: 30_100, toolCalls: 3, toolMs: 9_800, toolKinds: [{ kind: "shell", calls: 2, ms: 8_900 }, { kind: "file", calls: 1, ms: 900 }], method: "otel", outcome: "answered", ...data };
  const session = envelope.session?.id ?? SESSION;
  const key = turnKey(session, d.ordinal);
  const source = envelope.source ?? "claude_code.otel";
  return {
    protocol: "fabric-activity/0.1", eventId: eventId(key, source), kind: "turn", source, sourceKey: key,
    collector: { id: "observatory-node", epoch: 4 }, seq: 1, occurred: `${d.day}T00:00:00Z`, bootId: "boot-7c41e2", monotonicNs: "0",
    session: { id: SESSION }, project: { id: "example-project" }, runtime: { name: "claude_code", version: "2.4.1" }, skill: "task-pipeline",
    account: { class: "organization", tenantRef: TENANT },
    data: d,
    ...envelope
  };
}

/** One `account.inventory` event, its ids derived. */
function inventory(data: Json = {}, envelope: Json = {}): Json {
  const d: Json = { day: "2026-11-14", provider: "anthropic", tenantRef: TENANT, billing: "subscription", plan: "max-5x", holder: "switchboard", accounts: 2, ...data };
  if (d.plan === undefined) delete d.plan;
  const key = inventoryKey(d);
  const source = envelope.source ?? (d.holder === "switchboard" ? "switchboard" : "process");
  return {
    protocol: "fabric-activity/0.1", eventId: eventId(key, source), kind: "account.inventory", source, sourceKey: key,
    collector: { id: "observatory-node", epoch: 4 }, seq: 1, occurred: `${d.day}T00:00:00Z`, bootId: "boot-7c41e2", monotonicNs: "0",
    data: d,
    ...envelope
  };
}

function events(): Json[] {
  const valid = (name: string, event: Json): Json => ({ name, event, schemaValid: true, findings: [] });
  const refused = (name: string, event: Json): Json => ({ name, event, schemaValid: false, findings: [] });
  const ruled = (name: string, event: Json, findings: string[]): Json => ({ name, event, schemaValid: true, findings });
  const withKey = (event: Json, sourceKey: string) => ({ ...event, sourceKey, eventId: eventId(sourceKey, event.source) });
  const list: Json[] = [
    // RT-1: a turn, its calls and the time it waited on them.
    valid("a turn read from the runtime's OpenTelemetry export", turn()),
    valid("a turn with no tool call and no tool kinds, read from a hook", turn({ toolCalls: 0, toolMs: 0, toolKinds: undefined, method: "hook" })),
    valid("a turn read from a transcript the collector stamped live", turn({ method: "transcript", outcome: "unknown" })),
    valid("a turn in a session of the same person's second machine, with no skill and no account", turn({ ordinal: 1 }, { session: { id: "s-2b7d10" }, skill: undefined, account: undefined })),
    ruled("tool kinds that count more calls than the turn made", turn({ toolCalls: 2 }), ["FAC-SEM-178 /data/toolKinds"]),
    ruled("tool kinds that spent more time than the turn waited on tools", turn({ toolMs: 9_000 }), ["FAC-SEM-178 /data/toolKinds"]),
    ruled("a tool kind named twice", turn({ toolKinds: [{ kind: "shell", calls: 2, ms: 8_900 }, { kind: "shell", calls: 1, ms: 900 }] }), ["FAC-SEM-178 /data/toolKinds/1/kind"]),
    // RT-2: a day and no finer time; a derived id over the session and the ordinal.
    ruled("a turn whose midnight is not its day", { ...turn(), occurred: "2026-11-13T00:00:00Z" }, ["FAC-SEM-178 /occurred"]),
    ruled("a turn whose sourceKey names another ordinal", withKey(turn(), turnKey(SESSION, 4)), ["FAC-SEM-178 /sourceKey"]),
    refused("a turn with a time of day", { ...turn(), occurred: "2026-11-14T10:41:07Z" }),
    refused("a turn with a monotonic reading", { ...turn(), monotonicNs: "8312000000000" }),
    refused("a turn with a user", turn({}, { user: { id: "m-7f3a91c2" } })),
    refused("a turn with a run, which would join it to a timed run", turn({}, { run: { root: "run-4b1d9e02" } })),
    refused("a turn with a ULID and no sourceKey", (({ sourceKey: _k, ...rest }) => ({ ...rest, eventId: "01JC8ZQ7Y0M2X3A4B5C6D7E8F9" }))(turn())),
    refused("a turn without its session", (({ session: _s, ...rest }) => rest)(turn())),
    refused("a tool's name as a tool kind", turn({ toolKinds: [{ kind: "github-mcp", calls: 3, ms: 9_800 }] })),
    refused("a turn read by process sampling", turn({ method: "process" })),
    refused("a turn of a session on a personal account (RT-6)", turn({}, { account: { class: "personal" } })),
    refused("an empty list of tool kinds, which a collector leaves out", turn({ toolCalls: 0, toolMs: 0, toolKinds: [] })),
    // SI-1, SI-2: an organization's accounts on one machine for one day.
    valid("Switchboard's two subscription seats of one plan", inventory()),
    valid("a coding agent's own sign-in, read by the collector", inventory({ holder: "runtime", plan: "team", accounts: 1 })),
    valid("an API key held by name in the vault, with no plan", inventory({ holder: "vault", billing: "api", plan: undefined, provider: "openrouter", accounts: 1 })),
    valid("an openai subscription", inventory({ provider: "openai", plan: "business", holder: "runtime", accounts: 1 })),
    ruled("a plan off the provider's list", inventory({ plan: "plus" }), ["FAC-SEM-178 /data/plan"]),
    ruled("a plan for a provider with no list", inventory({ provider: "moonshot", plan: "pro" }), ["FAC-SEM-178 /data/plan"]),
    ruled("an inventory whose midnight is not its day", { ...inventory(), occurred: "2026-11-15T00:00:00Z" }, ["FAC-SEM-178 /occurred"]),
    ruled("an inventory whose sourceKey names another holder", withKey(inventory(), inventoryKey({ ...inventory().data, holder: "runtime" })), ["FAC-SEM-178 /sourceKey"]),
    refused("a plan on an API account", inventory({ billing: "api" })),
    refused("an inventory without a tenant: a personal account has none", (() => { const e = inventory(); delete e.data.tenantRef; return e; })()),
    refused("an inventory with a session", inventory({}, { session: { id: SESSION } })),
    refused("an inventory with a project", inventory({}, { project: { id: "example-project" } })),
    refused("an inventory with the envelope's account", inventory({}, { account: { class: "organization", tenantRef: TENANT } })),
    refused("Switchboard's seats under the process source", inventory({}, { source: "process" })),
    refused("a runtime's sign-in under the switchboard source", inventory({ holder: "runtime" }, { source: "switchboard" })),
    refused("a workspace's name as a plan", inventory({ plan: "acme-design-team" })),
    refused("no accounts", inventory({ accounts: 0 }))
  ];
  return list.map((c) => ({ ...c, event: clone(c.event) }));
}

/** SI-3: where an inventory goes, by which enrollment's policy lists its tenant. */
function routes(): Json[] {
  const a = { org: "org_a", tenants: [TENANT] };
  const b = { org: "org_b", tenants: [OTHER_TENANT] };
  return [
    { name: "the one enrollment whose policy lists the tenant", tenantRef: TENANT, enrollments: [b, a], answer: { route: "enrollment", org: "org_a", index: 1 } },
    { name: "no enrollment lists it", tenantRef: TENANT, enrollments: [b], answer: { route: "none", reason: "unlisted" } },
    { name: "two organizations list one tenant: neither learns the other's seats", tenantRef: TENANT, enrollments: [a, { org: "org_b", tenants: [OTHER_TENANT, TENANT] }], answer: { route: "none", reason: "ambiguous" } },
    { name: "two enrollments of one organization list one tenant: ambiguous, sent to neither", tenantRef: TENANT, enrollments: [a, { org: "org_a", tenants: [TENANT] }], answer: { route: "none", reason: "ambiguous" } },
    { name: "a tenant compared as written, never case-folded", tenantRef: TENANT.toUpperCase(), enrollments: [a], answer: { route: "none", reason: "unlisted" } },
    { name: "an enrollment with no list lists nothing", tenantRef: TENANT, enrollments: [{ org: "org_a" }], answer: { route: "none", reason: "unlisted" } },
    { name: "no device enrollment", tenantRef: TENANT, enrollments: [], answer: { route: "none", reason: "unlisted" } }
  ];
}

/** RT-4, SI-5: a cell's population counts people; one person's five sessions are one subject. */
function populations(): Json[] {
  const five = ["s-1", "s-2", "s-3", "s-4", "s-5"].map((key) => ({ person: "m-7f3a91c2", key }));
  return [
    { name: "one person across five sessions is one subject", rows: five, population: 1 },
    { name: "three people, one with two machines", rows: [{ person: "m-1", key: "d-1" }, { person: "m-1", key: "d-2" }, { person: "m-2", key: "d-3" }, { person: "m-3", key: "d-4" }], population: 3 },
    { name: "a device bound to no person is one subject, whatever its sessions", rows: [{ person: null, key: "d-9" }, { person: null, key: "d-9" }, { person: "m-1", key: "d-3" }], population: 2 },
    { name: "two devices bound to no person are two subjects", rows: [{ person: null, key: "d-8" }, { person: null, key: "d-9" }], population: 2 },
    { name: "a person and an unbound device that spells the same id are two subjects", rows: [{ person: "d-1", key: "d-9" }, { person: null, key: "d-1" }], population: 2 }
  ];
}

/** RT-4: the fixed buckets, each bound exclusive. */
function buckets(): Json[] {
  return [[0, "under1s"], [999, "under1s"], [1_000, "under5s"], [4_999, "under5s"], [5_000, "under15s"], [14_999, "under15s"], [15_000, "under60s"], [59_999, "under60s"], [60_000, "under300s"], [299_999, "under300s"], [300_000, "from300s"], [86_400_000, "from300s"]].map(([turnMs, bucket]) => ({ turnMs, bucket }));
}

/** `activity-summary/2`: a valid summary and the shapes FAC-SEM-040 refuses. */
function summaries(): Json[] {
  const base: Json = {
    format: "activity-summary/2", generatedAt: "2026-11-15T03:00:00Z", from: "2026-11-14", to: "2026-11-14", producer: { id: "org-receiver-1" },
    idleThresholdSeconds: 300, minPopulation: 5, cells: [],
    turnCells: [
      { agent: "claude_code", skill: "task-pipeline", project: "example-project", day: "2026-11-14", population: 5, turns: 40, turnBuckets: { under1s: 0, under5s: 6, under15s: 14, under60s: 15, under300s: 4, from300s: 1 }, modelMs: 900_000, toolMs: 310_000 },
      { other: true, day: "2026-11-14", population: 6, turns: 12, turnBuckets: { under1s: 1, under5s: 3, under15s: 4, under60s: 3, under300s: 1, from300s: 0 }, modelMs: 150_000, toolMs: 20_000 }
    ],
    inventoryCells: [
      { provider: "anthropic", plan: "max-5x", billing: "subscription", day: "2026-11-14", population: 5, machines: 6, accounts: 9 },
      { other: true, day: "2026-11-14", population: 5, machines: 5, accounts: 5 }
    ]
  };
  const edit = (name: string, change: (s: Json) => void, findings: string[], schemaValid = true): Json => {
    const summary = clone(base);
    change(summary);
    return { name, summary, schemaValid, findings };
  };
  return [
    { name: "turn and inventory cells at the organization's minimum of five", summary: clone(base), schemaValid: true, findings: [] },
    edit("a turn cell below the minimum", (s) => { s.turnCells[0].population = 4; }, ["FAC-SEM-040 /turnCells/0/population"]),
    edit("buckets that do not add up to the turns", (s) => { s.turnCells[0].turnBuckets.from300s = 2; }, ["FAC-SEM-040 /turnCells/0/turnBuckets"]),
    edit("more people than turns", (s) => { s.turnCells[1].turns = 5; s.turnCells[1].turnBuckets = { under1s: 1, under5s: 1, under15s: 1, under60s: 1, under300s: 1, from300s: 0 }; }, ["FAC-SEM-040 /turnCells/1/population"]),
    edit("two turn cells for one agent, skill, project and day", (s) => { s.turnCells.push(clone(s.turnCells[0])); }, ["FAC-SEM-040 /turnCells/2"]),
    edit("an inventory cell with more machines than accounts", (s) => { s.inventoryCells[0].accounts = 5; }, ["FAC-SEM-040 /inventoryCells/0/machines"]),
    edit("an inventory cell below the minimum", (s) => { s.inventoryCells[0].population = 3; }, ["FAC-SEM-040 /inventoryCells/0/population"]),
    edit("two other inventory cells in one day", (s) => { s.inventoryCells.push(clone(s.inventoryCells[1])); }, ["FAC-SEM-040 /inventoryCells/2"]),
    edit("an inventory cell outside the range", (s) => { s.inventoryCells[0].day = "2026-11-13"; }, ["FAC-SEM-040 /inventoryCells/0/day"]),
    edit("a person's id in a turn cell", (s) => { s.turnCells[0].user = "m-7f3a91c2"; }, [], false),
    edit("a plan on an API inventory cell", (s) => { s.inventoryCells[0].billing = "api"; }, [], false),
    edit("a turn cell with an outcome dimension", (s) => { s.turnCells[0].outcome = "answered"; }, [], false)
  ];
}

export function activityTurnVectors(): Json {
  return {
    about: "Vectors for the agent turn and the account inventory (DEC-0171), written by tools/vectors/activity-turn.ts, never by hand. A turn's sourceKey is sha256: of the settings-form canonical JSON {ordinal, session} (session.id), an inventory's of {billing, day, holder, plan, provider, tenantRef} (plan null when absent), and each eventId sha256: of the settings-form canonical JSON {key: sourceKey, source}. events: schemaValid is the event against telemetry-event.schema.json; findings are the codes and paths of evaluateSemanticRules(\"telemetry-event\", event), in order. routes: routeInventory(tenantRef, enrollments). populations: boundPopulation(rows), each row's key the device when it is bound to no person. buckets: turnBucket(turnMs). summaries: schemaValid against activity-summary-2.schema.json, findings of evaluateSemanticRules(\"activity-summary-2\", summary).",
    events: events(),
    routes: routes(),
    populations: populations(),
    buckets: buckets(),
    summaries: summaries()
  };
}

export function buildActivityTurnVectors(): string {
  return `${JSON.stringify(activityTurnVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildActivityTurnVectors();
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
