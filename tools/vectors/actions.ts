/**
 * The generator of the action-parity vectors (DEC-0121): `fixtures/vectors/actions.json`, shared by every service that
 * takes an action call and every host that reads a service's `extensions/actions/0.1`.
 *
 *   tsx tools/vectors/actions.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/actions.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected answer is written below by
 * hand from DEC-0121 (AP-1, AP-2, AP-4) and DL-17, DL-25; nothing here imports `src/actions.ts`, so the gate checks
 * that the reference agrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/actions.json";
const KEY = "https://fabric.passioncode.ai/agent-contract/extensions/actions/0.1";
const KEY_PATH = "/extensions/https:~1~1fabric.passioncode.ai~1agent-contract~1extensions~1actions~10.1";

const none = { id: "retry-job", title: "Retry", tool: "fabric.job.retry", gate: "none" };
const relayed = { id: "approve-reply", title: "Approve the reply", tool: "reviews.approve", gate: "relayed" };
const human = (humanStep: string) => ({ id: "connect-store", title: "Do it yourself", tool: "accounts.connect", gate: "human", humanStep });

const AT = "2026-10-24T09:30:00Z";
const instructed = { by: "operator", via: "relayed-instruction", at: AT, instruction: "approve the reply to the review from Anna" };
const elicited = { by: "operator", via: "elicitation", at: AT };

const caller = { ok: true, recordAs: "caller" };
const operator = (via: string, relayedBy?: string) => ({ ok: true, recordAs: { by: "operator", via, ...(relayedBy === undefined ? {} : { relayedBy }) } });
const refuse = (code: string) => ({ ok: false, code });
const step = (humanStep: string) => ({ ok: false, code: "human-step-required", humanStep });

function cases(): Json[] {
  const list: Array<[string, Json, Json]> = [
    // gate none: the caller's own act, at every tier, whatever the call carries.
    ["none from T0", { action: none, tier: "T0" }, caller],
    ["none from T2", { action: none, tier: "T2" }, caller],
    ["none from T1 with a decision: still the caller's act", { action: none, tier: "T1", decision: instructed }, caller],
    // gate human (AP-4): the person's step, at every tier, a decision changes nothing.
    ...["sign-in", "consent", "payment", "secret", "spend-above-limit"].map((name): [string, Json, Json] => [`human ${name} from T0`, { action: human(name), tier: "T0" }, step(name)]),
    ["human from T1 with the operator's decision: still the person's step", { action: human("payment"), tier: "T1", decision: instructed }, step("payment")],
    ["human from T2", { action: human("consent"), tier: "T2" }, step("consent")],
    // gate relayed from T2 (DL-17): an approval, the decision ignored.
    ["relayed from T2 without a decision", { action: relayed, tier: "T2" }, refuse("approval-required")],
    ["relayed from T2 with a valid decision: the decision changes nothing", { action: relayed, tier: "T2", decision: instructed }, refuse("approval-required")],
    ["relayed from a caller placed nowhere is T2 (DL-25)", { action: relayed, tier: "T3", decision: instructed }, refuse("approval-required")],
    ["relayed with no tier is T2 (DL-25)", { action: relayed, decision: instructed }, refuse("approval-required")],
    // gate relayed from T0 or T1 (AP-2).
    ["relayed from T0 without a decision", { action: relayed, tier: "T0" }, refuse("operator-decision-required")],
    ["relayed from T1 without a decision", { action: relayed, tier: "T1" }, refuse("operator-decision-required")],
    ["relayed from T0 with the operator's instruction", { action: relayed, tier: "T0", decision: instructed }, operator("relayed-instruction")],
    ["relayed from T1 with the operator's instruction and the relaying agent", { action: relayed, tier: "T1", decision: { ...instructed, relayedBy: "claude-code" } }, operator("relayed-instruction", "claude-code")],
    ["relayed from T0 with an accepted elicitation", { action: relayed, tier: "T0", decision: elicited }, operator("elicitation")],
    ["relayed from T0, an elicitation with the relaying agent", { action: relayed, tier: "T0", decision: { ...elicited, relayedBy: "codex" } }, operator("elicitation", "codex")],
    ["an instruction of 500 characters", { action: relayed, tier: "T0", decision: { ...instructed, instruction: "a".repeat(500) } }, operator("relayed-instruction")],
    ["an at with an offset", { action: relayed, tier: "T0", decision: { ...elicited, at: "2026-10-24T11:30:00+02:00" } }, operator("elicitation")],
    ["a decision 60 s ahead of the service's clock", { action: relayed, tier: "T0", decision: elicited, now: "2026-10-24T09:29:00Z" }, operator("elicitation")],
    ["a decision before the service's clock", { action: relayed, tier: "T0", decision: elicited, now: "2026-10-25T09:30:00Z" }, operator("elicitation")],
    // An invalid decision (AP-2): decision-invalid.
    ["a relayed instruction without the operator's words", { action: relayed, tier: "T0", decision: { by: "operator", via: "relayed-instruction", at: AT } }, refuse("decision-invalid")],
    ["an instruction of 501 characters", { action: relayed, tier: "T0", decision: { ...instructed, instruction: "a".repeat(501) } }, refuse("decision-invalid")],
    ["an empty instruction", { action: relayed, tier: "T0", decision: { ...instructed, instruction: "" } }, refuse("decision-invalid")],
    ["a decision by the agent", { action: relayed, tier: "T0", decision: { ...instructed, by: "agent" } }, refuse("decision-invalid")],
    ["a decision through a page", { action: relayed, tier: "T0", decision: { ...instructed, via: "page" } }, refuse("decision-invalid")],
    ["a decision with no time", { action: relayed, tier: "T0", decision: { by: "operator", via: "elicitation" } }, refuse("decision-invalid")],
    ["a decision with a member of its own", { action: relayed, tier: "T0", decision: { ...elicited, approved: true } }, refuse("decision-invalid")],
    ["a decision that is null", { action: relayed, tier: "T0", decision: null }, refuse("decision-invalid")],
    ["a decision that is a string", { action: relayed, tier: "T1", decision: "the operator said yes" }, refuse("decision-invalid")],
    ["an empty relayedBy", { action: relayed, tier: "T0", decision: { ...elicited, relayedBy: "" } }, refuse("decision-invalid")],
    ["an at with a space for T", { action: relayed, tier: "T0", decision: { ...elicited, at: "2026-10-24 09:30:00Z" } }, refuse("decision-invalid")],
    ["an at with a leap second", { action: relayed, tier: "T0", decision: { ...elicited, at: "2026-12-31T23:59:60Z" } }, refuse("decision-invalid")],
    ["an at on 30 February", { action: relayed, tier: "T0", decision: { ...elicited, at: "2026-02-30T09:30:00Z" } }, refuse("decision-invalid")],
    ["an at without an offset", { action: relayed, tier: "T0", decision: { ...elicited, at: "2026-10-24T09:30:00" } }, refuse("decision-invalid")],
    ["a decision 61 s ahead of the service's clock", { action: relayed, tier: "T0", decision: elicited, now: "2026-10-24T09:28:59Z" }, refuse("decision-invalid")],
    // The service's own faults: never an answer to the caller.
    ["a service clock it cannot read", { action: relayed, tier: "T0", decision: elicited, now: "yesterday" }, { fault: "now-unreadable" }],
    ["an action with an unknown gate", { action: { ...relayed, gate: "operator" }, tier: "T0", decision: instructed }, { fault: "action-invalid" }],
    ["a human action that names no step", { action: { ...none, gate: "human" }, tier: "T0" }, { fault: "action-invalid" }],
    ["a relayed action that names a step", { action: { ...relayed, humanStep: "consent" }, tier: "T0", decision: instructed }, { fault: "action-invalid" }],
    ["no action", { tier: "T0" }, { fault: "action-invalid" }]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

/** FAC-SEM-142 on a well-known document: the instance paths of its findings, none for a conforming declaration. */
function declarations(): Json[] {
  const doc = (value: unknown, capabilities?: string[]) => ({
    surfaces: { events: { path: "/fabric/v1/events" }, mcp: { path: "/mcp", transport: "streamable-http", ...(capabilities ? { capabilities } : {}) } },
    extensions: { [KEY]: value }
  });
  const served = ["fabric.job.retry", "reviews.approve", "accounts.connect"];
  const list: Array<[string, unknown, string[]]> = [
    ["no key: nothing to check", { surfaces: {}, extensions: {} }, []],
    ["no extensions: nothing to check", { surfaces: {} }, []],
    ["three actions, each tool served", doc({ actions: [none, relayed, human("sign-in")] }, served), []],
    ["no capability list: tools are not compared", doc({ actions: [relayed] }), []],
    ["an id declared twice", doc({ actions: [relayed, { ...none, id: relayed.id }] }, served), [`${KEY_PATH}/actions/1/id`]],
    ["a human action without its step", doc({ actions: [{ ...none, gate: "human" }] }, served), [`${KEY_PATH}/actions/0/humanStep`]],
    ["a step on a relayed action", doc({ actions: [{ ...relayed, humanStep: "consent" }] }, served), [`${KEY_PATH}/actions/0/humanStep`]],
    ["a tool the MCP surface does not serve: a button without an agent twin", doc({ actions: [relayed] }, ["fabric.job.retry"]), [`${KEY_PATH}/actions/0/tool`]],
    ["a value that is not the schema's: one finding at the key", doc({ actions: [] }, served), [KEY_PATH]],
    ["an action with no tool: one finding at the key", doc({ actions: [{ id: "approve-reply", title: "Approve", gate: "relayed" }] }, served), [KEY_PATH]],
    ["a value that is not an object", doc([relayed], served), [KEY_PATH]]
  ];
  return list.map(([name, input, findings]) => ({ name, input, findings }));
}

export function actionsVectors(): Json {
  return {
    about: "Vectors for fabric-actions/0.1 (DEC-0121), written by tools/vectors/actions.ts, never by hand. `cases`: actionDecision({action, tier, decision?, now?}) answers {ok: true, recordAs: \"caller\"} for gate none, {ok: false, code: \"human-step-required\", humanStep} for gate human, {ok: false, code: \"approval-required\"} for gate relayed from any tier but T0 and T1 (DL-17, DL-25), and from T0 or T1 {ok: false, code: \"operator-decision-required\"} without a decision, {ok: false, code: \"decision-invalid\"} for one invalid against decision.schema.json, read strictly or more than 60 s ahead of now, else {ok: true, recordAs: {by: \"operator\", via, relayedBy?}}; {fault} is the service's own and is never sent. `declarations`: the instance paths of FAC-SEM-142's findings on a well-known document's extensions/actions/0.1.",
    cases: cases(),
    declarations: declarations()
  };
}

export function buildActionsVectors(): string {
  return `${JSON.stringify(actionsVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildActionsVectors();
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
