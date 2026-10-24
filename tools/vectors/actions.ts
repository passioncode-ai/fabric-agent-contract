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

const none = { id: "retry-job", title: "Retry", tool: "jobs.retry", gate: "none" };
const relayed = { id: "approve-reply", title: "Approve the reply", tool: "reviews.approve", gate: "relayed" };
const human = (humanStep: string) => ({ id: "connect-store", title: "Do it yourself", tool: "accounts.connect", gate: "human", humanStep });

const NOW = "2026-10-24T09:30:00Z";
const CALLER = "agent:claude-code";
const URL = "https://store.example/connect";
const DIGEST = `sha256:${"ab".repeat(32)}`;
const decided = (at = NOW, extra: Json = {}) => ({ by: "operator", via: "relayed-instruction", action: "approve-reply", instruction: "approve the reply to the review from Anna", at, ...extra });
const instructed = decided();
const base = { action: relayed, caller: CALLER, now: NOW };

const caller = { ok: true, recordAs: "caller" };
const operator = (via: string) => ({ ok: true, recordAs: { by: "operator", via, caller: CALLER } });
const approved = { ok: true, recordAs: { by: "person:anna", via: "approval", caller: CALLER } };
const refuse = (code: string) => ({ ok: false, code });
const needsApproval = { ok: false, code: "approval-required", data: { actionDigest: DIGEST } };
const step = (humanStep: string) => ({ ok: false, code: "human-step-required", data: { humanStep, url: URL } });

function cases(): Json[] {
  const list: Array<[string, Json, Json]> = [
    // gate none: the caller's own act, at every tier, whatever the call carries.
    ["none from T0", { action: none, tier: "T0" }, caller],
    ["none from T2", { action: none, tier: "T2" }, caller],
    ["none from T1 with a decision: still the caller's act", { action: none, tier: "T1", decision: instructed }, caller],
    // gate human (AP-4): the person's step and its direct link, at every tier; a decision changes nothing.
    ...["sign-in", "consent", "payment", "secret", "spend-above-limit"].map((name): [string, Json, Json] => [`human ${name} from T0`, { action: human(name), tier: "T0", humanStepUrl: URL }, step(name)]),
    ["human from T1 with the operator's decision: still the person's step", { action: human("payment"), tier: "T1", decision: instructed, humanStepUrl: URL }, step("payment")],
    ["human from T2", { action: human("consent"), tier: "T2", humanStepUrl: URL }, step("consent")],
    ["human with a path on the service's origin", { action: human("consent"), tier: "T0", humanStepUrl: "/dashboard/connect" }, { ok: false, code: "human-step-required", data: { humanStep: "consent", url: "/dashboard/connect" } }],
    // gate relayed with an accepted approval/1 (DL-18): the approver's decision, at any tier.
    ["relayed from T2 with an accepted approval", { ...base, tier: "T2", approval: { ok: true, approver: "person:anna" } }, approved],
    ["relayed from T0 with an accepted approval (DL-26 MAY)", { ...base, tier: "T0", approval: { ok: true, approver: "person:anna" } }, approved],
    // gate relayed from T2 without one (DL-17, DL-18): approval-required with the digest; a decision changes nothing.
    ["relayed from T2 without a decision", { ...base, tier: "T2", actionDigest: DIGEST }, needsApproval],
    ["relayed from T2 with a valid decision: the decision changes nothing", { ...base, tier: "T2", decision: instructed, actionDigest: DIGEST }, needsApproval],
    ["relayed from T2 with an approval that was not accepted", { ...base, tier: "T2", approval: { ok: false, code: "approval-invalid" }, actionDigest: DIGEST }, needsApproval],
    ["relayed from a caller placed nowhere is T2 (DL-25)", { ...base, tier: "T3", decision: instructed, actionDigest: DIGEST }, needsApproval],
    ["relayed with no tier is T2 (DL-25)", { ...base, decision: instructed, actionDigest: DIGEST }, needsApproval],
    // gate relayed from T0 or T1 (AP-2).
    ["relayed from T0 without a decision", { ...base, tier: "T0" }, refuse("operator-decision-required")],
    ["relayed from T1 without a decision", { ...base, tier: "T1" }, refuse("operator-decision-required")],
    ["relayed from T0 with the operator's instruction", { ...base, tier: "T0", decision: instructed }, operator("relayed-instruction")],
    ["relayed from T1 with the operator's instruction", { ...base, tier: "T1", decision: instructed }, operator("relayed-instruction")],
    ["relayed from T0 after the service's own elicitation was accepted", { ...base, tier: "T0", elicited: true }, operator("elicitation")],
    ["an elicitation the caller claims is not the service's record", { ...base, tier: "T0", elicited: "true" }, refuse("operator-decision-required")],
    ["an instruction of 500 characters", { ...base, tier: "T0", decision: decided(NOW, { instruction: "a".repeat(500) }) }, operator("relayed-instruction")],
    ["an at with an offset", { ...base, tier: "T0", decision: decided("2026-10-24T11:30:00+02:00") }, operator("relayed-instruction")],
    ["a decision 60 s ahead of the service's clock", { ...base, tier: "T0", decision: decided("2026-10-24T09:31:00Z") }, operator("relayed-instruction")],
    ["a decision exactly 24 h old", { ...base, tier: "T0", decision: decided("2026-10-23T09:30:00Z") }, operator("relayed-instruction")],
    // An invalid decision (AP-2): decision-invalid.
    ["a decision for another action", { ...base, tier: "T0", decision: decided(NOW, { action: "publish-post" }) }, refuse("decision-invalid")],
    ["a decision that names no action", { ...base, tier: "T0", decision: { by: "operator", via: "relayed-instruction", instruction: "approve it", at: NOW } }, refuse("decision-invalid")],
    ["a decision without the operator's words", { ...base, tier: "T0", decision: { by: "operator", via: "relayed-instruction", action: "approve-reply", at: NOW } }, refuse("decision-invalid")],
    ["an instruction of 501 characters", { ...base, tier: "T0", decision: decided(NOW, { instruction: "a".repeat(501) }) }, refuse("decision-invalid")],
    ["an empty instruction", { ...base, tier: "T0", decision: decided(NOW, { instruction: "" }) }, refuse("decision-invalid")],
    ["a decision by the agent", { ...base, tier: "T0", decision: decided(NOW, { by: "agent" }) }, refuse("decision-invalid")],
    ["a caller claiming an elicitation in its decision", { ...base, tier: "T0", decision: decided(NOW, { via: "elicitation" }) }, refuse("decision-invalid")],
    ["a decision through a page", { ...base, tier: "T0", decision: decided(NOW, { via: "page" }) }, refuse("decision-invalid")],
    ["a decision naming who relayed it: the service records its own caller", { ...base, tier: "T0", decision: decided(NOW, { relayedBy: "the-operator-themself" }) }, refuse("decision-invalid")],
    ["a decision with no time", { ...base, tier: "T0", decision: { by: "operator", via: "relayed-instruction", action: "approve-reply", instruction: "approve it" } }, refuse("decision-invalid")],
    ["a decision that is null", { ...base, tier: "T0", decision: null }, refuse("decision-invalid")],
    ["a decision that is a string", { ...base, tier: "T1", decision: "the operator said yes" }, refuse("decision-invalid")],
    ["an at with a space for T", { ...base, tier: "T0", decision: decided("2026-10-24 09:30:00Z") }, refuse("decision-invalid")],
    ["an at with a leap second", { ...base, tier: "T0", decision: decided("2026-12-31T23:59:60Z") }, refuse("decision-invalid")],
    ["an at on 30 February", { ...base, tier: "T0", decision: decided("2026-02-30T09:30:00Z") }, refuse("decision-invalid")],
    ["an at without an offset", { ...base, tier: "T0", decision: decided("2026-10-24T09:30:00") }, refuse("decision-invalid")],
    ["a decision 61 s ahead of the service's clock", { ...base, tier: "T0", decision: decided("2026-10-24T09:31:01Z") }, refuse("decision-invalid")],
    ["a decision 24 h and 1 s old", { ...base, tier: "T0", decision: decided("2026-10-23T09:29:59Z") }, refuse("decision-invalid")],
    // The service's own faults: never an answer to the caller.
    ["a service clock it cannot read", { ...base, tier: "T0", decision: instructed, now: "yesterday" }, { fault: "now-unreadable" }],
    ["no service clock", { action: relayed, caller: CALLER, tier: "T1", decision: instructed }, { fault: "now-unreadable" }],
    ["no authenticated caller", { action: relayed, now: NOW, tier: "T0", decision: instructed }, { fault: "caller-missing" }],
    ["a T2 refusal without the action's digest", { ...base, tier: "T2" }, { fault: "digest-missing" }],
    ["a human step without its link", { action: human("payment"), tier: "T0" }, { fault: "url-missing" }],
    ["a human step whose link is not https", { action: human("payment"), tier: "T0", humanStepUrl: "http://store.example/pay" }, { fault: "url-missing" }],
    ["an action with an unknown gate", { ...base, action: { ...relayed, gate: "operator" }, tier: "T0", decision: instructed }, { fault: "action-invalid" }],
    ["a human action that names no step", { action: { ...none, gate: "human" }, tier: "T0" }, { fault: "action-invalid" }],
    ["a relayed action that names a step", { ...base, action: { ...relayed, humanStep: "consent" }, tier: "T0", decision: instructed }, { fault: "action-invalid" }],
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
  const served = ["jobs.retry", "reviews.approve", "accounts.connect"];
  const list: Array<[string, unknown, string[]]> = [
    ["no key: nothing to check", { surfaces: {}, extensions: {} }, []],
    ["no extensions: nothing to check", { surfaces: {} }, []],
    ["three actions, each tool served", doc({ actions: [none, relayed, human("sign-in")] }, served), []],
    ["no capability list: tools are not compared", doc({ actions: [relayed] }), []],
    ["an id declared twice", doc({ actions: [relayed, { ...none, id: relayed.id }] }, served), [`${KEY_PATH}/actions/1/id`]],
    ["a human action without its step", doc({ actions: [{ ...none, gate: "human" }] }, served), [`${KEY_PATH}/actions/0/humanStep`]],
    ["a step on a relayed action", doc({ actions: [{ ...relayed, humanStep: "consent" }] }, served), [`${KEY_PATH}/actions/0/humanStep`]],
    ["a tool the MCP surface does not serve: a button without an agent twin", doc({ actions: [relayed] }, ["jobs.retry"]), [`${KEY_PATH}/actions/0/tool`]],
    ["a value that is not the schema's: one finding at the key", doc({ actions: [] }, served), [KEY_PATH]],
    ["an action with no tool: one finding at the key", doc({ actions: [{ id: "approve-reply", title: "Approve", gate: "relayed" }] }, served), [KEY_PATH]],
    ["a value that is not an object", doc([relayed], served), [KEY_PATH]]
  ];
  return list.map(([name, input, findings]) => ({ name, input, findings }));
}

export function actionsVectors(): Json {
  return {
    about: "Vectors for fabric-actions/0.1 (DEC-0121), written by tools/vectors/actions.ts, never by hand. `cases`: actionDecision({action, tier, caller, decision?, elicited?, approval?, actionDigest?, humanStepUrl?, now}) answers {ok: true, recordAs: \"caller\"} for gate none; {ok: false, code: \"human-step-required\", data: {humanStep, url}} for gate human; for gate relayed an accepted approval/1 at any tier is the approver's ({by: approver, via: \"approval\", caller}), a T2 caller without one gets {ok: false, code: \"approval-required\", data: {actionDigest}} (DL-17, DL-18, DL-25), and from T0 or T1 the service's own accepted elicitation, else {ok: false, code: \"operator-decision-required\"} without a decision, {ok: false, code: \"decision-invalid\"} for one invalid against decision.schema.json, for another action, read strictly, more than 60 s ahead of now or more than 24 h behind it, else {ok: true, recordAs: {by: \"operator\", via, caller}}, caller being the service's own identity of who relayed it; {fault} is the service's own and is never sent. `declarations`: the instance paths of FAC-SEM-142's findings on a well-known document's extensions/actions/0.1.",
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
