/**
 * The generator of the decision verdict vectors (DEC-0172): `fixtures/vectors/decision-verdict.json`, shared by every
 * decision verifier that writes `decision-verdict/1` (Fabric's door `decision.verify`), every hub that dispatches a call
 * carrying a verdict's receipt (DV-8) and every reader of a verdict.
 *
 *   tsx tools/vectors/decision-verdict.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/decision-verdict.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/decision-verdict.test.ts` runs the
 * check. The digests are derived here with RFC 8785 and Node's crypto, not by importing `src/decision-verdict.ts`, so the
 * gate checks that the reference agrees. The reference cases take their inputs from the committed `actionDecision` and
 * `mandateCovers` vectors (`actions.json`, `levels.json`, `profile.json`, `mandate.json`) by case name, so a verdict is
 * paired with exactly the input the reference already answers; each case's expected codes are written by hand.
 */
import { createHash, createHmac } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/decision-verdict.json";

const root = projectRoot();
const vectors = (file: string): Json => JSON.parse(readFileSync(path.join(root, "fixtures/vectors", file), "utf8")) as Json;
const sha = (text: string) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
/** The host's own key for argsDigest in these vectors: 32 bytes of 0x42, never a real key. */
export const HOST_KEY_HEX = "42".repeat(32);
const hostKey = Buffer.from(HOST_KEY_HEX, "hex");
const args = (input: unknown) => `hmac-sha256:${createHmac("sha256", hostKey).update(rfc8785(input), "utf8").digest("hex")}`;
const POLICY = { version: "2026-11-15.1", digest: `sha256:${"5e".repeat(32)}` };
const CALL_INPUT = { reviewId: "r-412", reply: "draft-7" };

/** A verdict's digests derived again over its members (after `asked` changed). */
function rederive(v: Json): Json {
  const out = clone(v);
  out.askedDigest = sha(rfc8785(out.asked));
  out.id = sha(rfc8785({ askedDigest: out.askedDigest, caller: out.caller, policy: out.policy, session: out.session }));
  return out;
}

/** One verdict, its digests derived; `patch` replaces members after the derivation unless `derive` is asked again. */
function verdict(parts: Json, asked: Json = {}): Json {
  const a = { callee: "reviews-service", capability: "reviews.approve", action: "approve-reply", effect: "publish", context: "personal", tier: "T1", argsDigest: args(CALL_INPUT), ...asked };
  const askedDigest = sha(rfc8785(a));
  const v: Json = { kind: "decision-verdict/1", id: "", at: "2026-11-15T10:00:00Z", expiresAt: "2026-11-15T10:10:00Z", asked: a, askedDigest, caller: "agent-claude-code", session: "s-7f3a91", verdict: "allow", rule: "AP-2", reason: "covered", route: "operator", machineForm: "hub-dispatch", grounds: [{ kind: "decision", ref: `sha256:${"d1".repeat(32)}`, grade: "taken" }], policy: POLICY, ...parts };
  for (const key of Object.keys(v)) if (v[key] === undefined) delete v[key];
  v.id = sha(rfc8785({ askedDigest: v.askedDigest, caller: v.caller, policy: v.policy, session: v.session }));
  return v;
}

const human = (reason: string, h: Json, extra: Json = {}, asked: Json = {}) => verdict({ verdict: "human", reason, rule: extra.rule ?? "AP-2", route: undefined, machineForm: undefined, human: h, expiresAt: "2026-11-15T18:00:00Z", ...extra }, asked);
const deny = (reason: string, rule: string, extra: Json = {}) => verdict({ verdict: "deny", reason, rule, route: undefined, machineForm: undefined, grounds: [], expiresAt: "2026-11-15T10:30:00Z", ...extra });

function documents(): Json[] {
  const ok = (name: string, doc: Json): Json => ({ name, verdict: doc, schemaValid: true, findings: [] });
  const ruled = (name: string, doc: Json, findings: string[]): Json => ({ name, verdict: doc, schemaValid: true, findings });
  const refused = (name: string, doc: Json): Json => ({ name, verdict: doc, schemaValid: false, findings: [] });
  const tampered = (doc: Json, change: (d: Json) => void) => { const d = clone(doc); change(d); return d; };
  return [
    ok("an allow by the operator's word in the caller's own session", verdict({})),
    ok("an allow by a relay OA-3 accepts", verdict({ route: "forwarded", grounds: [{ kind: "relay", ref: "board:1f2cfb98", grade: "forwarded" }] })),
    ok("an allow by an administrator's bound level decision", verdict({ route: "level", rule: "LV-7", level: { required: "admin", satisfiedBy: "admin" }, grounds: [{ kind: "level-decision", ref: `sha256:${"a1".repeat(32)}`, grade: "verified" }] }, { context: "org:org-a", tier: "T2" })),
    ok("an allow a level holder's own agent executes", verdict({ route: "level", machineForm: "executed-by-holder", rule: "LV-7", grounds: [{ kind: "level-decision", ref: `sha256:${"a2".repeat(32)}`, grade: "verified" }] }, { context: "org:org-a" })),
    ok("an allow under the caller's approval/1, which the hub does not hold back (DV-8)", verdict({ route: "approval", machineForm: "caller-approval", rule: "DL-17", grounds: [{ kind: "approval", ref: `sha256:${"a3".repeat(32)}`, grade: "verified" }] }, { tier: "T2" })),
    ok("an allow of the caller's own act, with a budget read and not reserved", verdict({ route: "own-act", machineForm: "none", grounds: [{ kind: "budget", ref: "l1:example-site" }] }, { effect: "none", action: "reviews.approve" })),
    ok("an allow by a bound standing mandate", verdict({ route: "profile", rule: "AU-1", grounds: [{ kind: "standing", ref: `sha256:${"a4".repeat(32)}`, grade: "verified" }] }, { effect: "deploy", tier: "T2" })),
    ok("advice with no addressee: a policy row against the operator's word (row-advised)", human("row-advised", { addressees: [] }, { rule: "row:no-friday-publish", grounds: [{ kind: "decision", ref: `sha256:${"d1".repeat(32)}`, grade: "taken" }] })),
    ok("a question to the operator: no form the reference takes (not-covered)", human("not-covered", { addressees: ["operator"], questionId: "q-77" })),
    ok("spend above a key's ceiling, the person's step with its link once the callee gave it (DV-7)", human("spend-limit", { addressees: ["operator"], humanStep: "spend-above-limit", url: "https://hub.example/steps/88" }, { rule: "spend-rule-3" })),
    ok("rule 3's durable approval request in an organization's context, asking its owner and administrators", human("spend-limit", { addressees: ["m-owner-01", "m-admin-02"] }, { rule: "spend-rule-3", level: { required: "admin", satisfiedBy: "own-act" } }, { context: "org:org-a" })),
    ok("rule 3's durable approval request in a personal context, asking the operator", human("spend-limit", { addressees: ["operator"] }, { rule: "spend-rule-3" })),
    ok("a body gate: the person's sign-in (AP-4)", human("body-gate", { addressees: ["operator"], humanStep: "sign-in" }, { rule: "AP-4" })),
    ok("a policy row forbids it", deny("forbidden", "row:never-delete-prod")),
    ok("the operator said no", deny("person-denied", "answer:q-77", { expiresAt: "2026-11-16T09:00:00Z" })),
    ok("an approval on the caller agent's own account", deny("self-approval", "AP-5")),
    ruled("an allow beside a ground the reference does not take", verdict({ grounds: [{ kind: "decision", ref: `sha256:${"d1".repeat(32)}`, grade: "taken" }, { kind: "relay", ref: "chat:paste", grade: "data" }] }), ["FAC-SEM-179 /grounds/1/grade"]),
    ruled("an allow by the operator's word with no decision ground", verdict({ grounds: [{ kind: "grant", ref: "grant:7" }] }), ["FAC-SEM-179 /grounds"]),
    ruled("an allow by a level decision graded taken", verdict({ route: "level", grounds: [{ kind: "level-decision", ref: `sha256:${"a1".repeat(32)}`, grade: "taken" }] }), ["FAC-SEM-179 /grounds"]),
    ruled("an approval carried by the hub", verdict({ route: "approval", machineForm: "hub-dispatch", grounds: [{ kind: "approval", ref: `sha256:${"a3".repeat(32)}`, grade: "verified" }] }), ["FAC-SEM-179 /machineForm"]),
    ruled("an own act by a form", verdict({ route: "own-act", machineForm: "hub-dispatch", grounds: [] }), ["FAC-SEM-179 /machineForm"]),
    ruled("a holder's execution under the operator's word", verdict({ machineForm: "executed-by-holder" }), ["FAC-SEM-179 /machineForm"]),
    ruled("an allow standing longer than 15 minutes", verdict({ expiresAt: "2026-11-15T10:15:01Z" }), ["FAC-SEM-179 /expiresAt"]),
    ruled("a denial standing longer than an hour", deny("forbidden", "row:never-delete-prod", { expiresAt: "2026-11-15T11:00:01Z" }), ["FAC-SEM-179 /expiresAt"]),
    ruled("a verdict that expires when it is given", verdict({ expiresAt: "2026-11-15T10:00:00Z" }), ["FAC-SEM-179 /expiresAt"]),
    ruled("a question with no one to ask", human("not-covered", { addressees: [], questionId: "q-77" }), ["FAC-SEM-179 /human/questionId"]),
    ruled("a body gate without its step", human("body-gate", { addressees: ["operator"] }, { rule: "AP-4" }), ["FAC-SEM-179 /human/humanStep"]),
    ruled("a link without a step", human("not-covered", { addressees: ["operator"], url: "https://hub.example/steps/88" }), ["FAC-SEM-179 /human/url"]),
    ruled("a sign-in step on a spend limit", human("spend-limit", { addressees: ["operator"], humanStep: "sign-in" }, { rule: "spend-rule-3" }), ["FAC-SEM-179 /human/humanStep"]),
    ruled("a person's denial that names no answer", deny("person-denied", "AP-2"), ["FAC-SEM-179 /rule"]),
    ruled("a self-approval refused by another rule", deny("self-approval", "AP-2"), ["FAC-SEM-179 /rule"]),
    ruled("an id that is not its derivation", tampered(verdict({}), (d) => { d.id = sha("other"); }), ["FAC-SEM-179 /id"]),
    ruled("an asked changed after its digest", tampered(verdict({}), (d) => { d.asked.effect = "delete"; }), ["FAC-SEM-179 /askedDigest"]),
    refused("an allow that asks a person", verdict({ human: { addressees: ["operator"] } })),
    refused("a human verdict with a route", tampered(human("not-covered", { addressees: ["operator"] }), (d) => { d.route = "operator"; })),
    refused("an allow without its route", verdict({ route: undefined })),
    refused("a deny for want of a person (a human reason)", deny("not-covered", "AP-2")),
    refused("a requirement graded as an authority", verdict({ grounds: [{ kind: "decision", ref: `sha256:${"d1".repeat(32)}`, grade: "taken" }, { kind: "budget", ref: "l1", grade: "taken" }] })),
    refused("an entitlement as a ground (DEC-0168)", verdict({ grounds: [{ kind: "entitlement", ref: "ent:1", grade: "verified" }] })),
    refused("the arguments themselves in asked", verdict({}, { input: CALL_INPUT })),
    refused("a plain hash of the arguments", verdict({}, { argsDigest: sha(rfc8785(CALL_INPUT)) })),
    refused("an inherited name as a route", tampered(verdict({}), (d) => { d.route = "toString"; })),
    refused("the operator's words on the wire", verdict({ instruction: "approve the reply" }))
  ];
}

/** DV-3 by construction: each verdict with the reference input its route and grounds name. */
function references(): Json[] {
  const pick = (file: string, list: string, name: string): Json => {
    const found = (vectors(file)[list] as Json[]).find((c) => c.name === name);
    if (!found) throw new Error(`no case ${name} in ${file}`);
    return clone(found.input);
  };
  const action = (file: string, list: string, name: string) => ({ check: "action", input: pick(file, list, name) });
  const mandate = (name: string) => ({ check: "mandate", input: pick("mandate.json", "cases", name) });
  const relayed = action("actions.json", "cases", "relayed from T1 with the operator's instruction");
  relayed.input.decision.source = { project: "example-analyst", thread: "example-thread-3" };
  const level = verdict({ route: "level", rule: "LV-7", grounds: [{ kind: "level-decision", ref: `sha256:${"a1".repeat(32)}`, grade: "verified" }] }, { context: "org:org-a", tier: "T2" });
  /** The call the reference reads, as a verifier writes it in `asked` (DV-2: the decision's action, else the capability). */
  const askedFrom = (reference: Json): Json => {
    const input = reference.input;
    if (reference.check === "mandate") {
      const call = input.call;
      return { tier: input.tier, capability: call.capability, action: call.capability, effect: call.effect, ...(call.project ? { project: call.project } : {}), ...(call.spendUsd !== undefined ? { spendUsd: call.spendUsd } : {}) };
    }
    const action = input.decision?.action ?? input.action.tool;
    return { tier: input.tier, capability: input.action.tool, action, ...(input.effect ? { effect: input.effect } : {}), ...(input.context ? { context: input.context } : {}), ...(input.project ? { project: input.project } : {}) };
  };
  /** The verdict re-derived over the reference's call, unless the case keeps its own `asked` on purpose. */
  const c = (name: string, v: Json, reference: Json, findings: string[], keepAsked = false) => {
    const verdictFor = keepAsked ? v : rederive({ ...v, asked: { ...v.asked, ...askedFrom(reference) } });
    return { name, verdict: verdictFor, reference, findings };
  };
  return [
    c("the operator's word from T1, which the reference takes", verdict({}), action("actions.json", "cases", "relayed from T1 with the operator's instruction"), []),
    c("the service's own accepted elicitation, the operator's word", verdict({}), action("actions.json", "cases", "relayed from T0 after the service's own elicitation was accepted"), []),
    c("an OA-2 relay, taken by route forwarded in either context", verdict({ route: "forwarded", grounds: [{ kind: "relay", ref: "board:1f2cfb98", grade: "forwarded" }] }), relayed, []),
    c("the same relay named as the operator's own word", verdict({}), relayed, ["FAC-SEM-179 /verdict/verdict"]),
    c("an own act under gate none", verdict({ route: "own-act", machineForm: "none", grounds: [] }, { effect: "none" }), action("actions.json", "cases", "none from T2"), []),
    c("an accepted approval from T2", verdict({ route: "approval", machineForm: "caller-approval", rule: "DL-17", grounds: [{ kind: "approval", ref: `sha256:${"a3".repeat(32)}`, grade: "verified" }] }, { tier: "T2" }), action("actions.json", "cases", "relayed from T2 with an accepted approval"), []),
    c("a T2 call without its approval, allowed on the operator's word", verdict({}, { tier: "T2" }), action("actions.json", "cases", "relayed from T2 with a valid decision: the decision changes nothing"), ["FAC-SEM-179 /verdict/verdict"]),
    c("the owner's bound level decision from T2", level, action("levels.json", "actions", "the owner decides a relayed action from T2"), []),
    c("an organization's act LV-7 keeps for a level, allowed on the operator's word", verdict({}, { context: "org:org-a" }), action("levels.json", "actions", "the operator's decision on a billing act declared owner, in an organization's context, from T1"), ["FAC-SEM-179 /verdict/verdict"]),
    c("an architect outside its projects", level, action("levels.json", "actions", "an architect outside its projects"), ["FAC-SEM-179 /verdict/verdict"]),
    c("a headless profile bound by the token from T2", verdict({ route: "profile", rule: "AU-1", grounds: [{ kind: "standing", ref: `sha256:${"a4".repeat(32)}`, grade: "verified" }] }, { effect: "deploy", tier: "T2" }), action("profile.json", "actions", "a headless profile covers a deploy from T2 when the token binds it"), []),
    c("a profile from T2 without its prof", verdict({ route: "profile", rule: "AU-1", grounds: [{ kind: "standing", ref: `sha256:${"a4".repeat(32)}`, grade: "verified" }] }, { tier: "T2" }), action("profile.json", "actions", "from T2 without prof the profile changes nothing (MD-5)"), ["FAC-SEM-179 /verdict/verdict"]),
    c("a task mandate relayed under OA-2 with its source: route mandate, graded taken", verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a6".repeat(32)}`, grade: "taken" }] }), mandate("words relayed from another of the operator's agents: where they said them travels into the record"), []),
    c("a task mandate stated from a relay, beside the relay graded forwarded (SCN-046)", verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a6".repeat(32)}`, grade: "taken" }, { kind: "relay", ref: "board:1f2cfb98", grade: "forwarded" }] }), mandate("words relayed from another of the operator's agents: where they said them travels into the record"), []),
    c("the same relayed mandate graded forwarded, the grade of a relayed decision", verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a6".repeat(32)}`, grade: "forwarded" }] }), mandate("words relayed from another of the operator's agents: where they said them travels into the record"), ["FAC-SEM-179 /verdict/grounds"]),
    c("a task mandate that covers the research", verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a5".repeat(32)}`, grade: "taken" }] }, { action: "research.run", capability: "research.run", effect: "none", tier: "T0" }), mandate("the operator's words with no amount: the paid research is covered, the money limits decide its spend"), []),
    c("a policy change under a mandate, which no mandate covers (AP-5)", verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a5".repeat(32)}`, grade: "taken" }] }, { action: "page.update", capability: "page.update", effect: "change-policy", tier: "T0" }), mandate("a policy change, which no mandate covers (AP-5)"), ["FAC-SEM-179 /verdict/verdict"]),
    c("a human verdict is the verifier's own: advice beside a form the reference takes", human("row-advised", { addressees: [] }, { rule: "row:no-friday-publish" }), action("actions.json", "cases", "relayed from T1 with the operator's instruction"), []),
    c("a denial is the verifier's own", deny("forbidden", "row:never-delete-prod"), action("actions.json", "cases", "relayed from T1 with the operator's instruction"), []),
    c("an allow that asked about a T2 call, checked against the T1 call the reference reads", verdict({}, { tier: "T2" }), action("actions.json", "cases", "relayed from T1 with the operator's instruction"), ["FAC-SEM-179 /verdict/asked/tier"], true),
    c("a job's input step under the task's mandate, read as the hub sees it", verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a5".repeat(32)}`, grade: "taken" }] }, { effect: "reply", tier: "T0" }), action("actions.json", "jobSteps", "a step of a job the mandate's capabilities cover"), []),
    c("a job's input step checked against mandateCovers, which reads the job's capability", rederive({ ...verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a5".repeat(32)}`, grade: "taken" }] }), asked: { ...verdict({}).asked, tier: "T0", capability: "fabric.job.get", action: "fabric.job.get", effect: "none" } }), mandate("the operator's words with no amount: the paid research is covered, the money limits decide its spend"), ["FAC-SEM-179 /reference/check", "FAC-SEM-179 /verdict/asked/capability", "FAC-SEM-179 /verdict/asked/action", "FAC-SEM-179 /verdict/asked/effect", "FAC-SEM-179 /verdict/asked/project", "FAC-SEM-179 /verdict/asked/spendUsd"], true),
    c("an allow that asked about another action than the reference's", verdict({}, { action: "delete-reply" }), action("actions.json", "cases", "relayed from T1 with the operator's instruction"), ["FAC-SEM-179 /verdict/asked/action"], true),
    c("an allow that asked about less spend than the mandate's call", rederive({ ...verdict({ route: "mandate", rule: "MD-3", grounds: [{ kind: "mandate", ref: `sha256:${"a5".repeat(32)}`, grade: "taken" }] }), asked: { ...verdict({}).asked, ...{ tier: "T0", capability: "research.run", action: "research.run", effect: "charge", project: "example-site", spendUsd: 1 } } }), mandate("the operator's words with no amount: the paid research is covered, the money limits decide its spend"), ["FAC-SEM-179 /verdict/asked/spendUsd"], true)
  ];
}

/** DV-8: the hub's check of a call that carries a verdict's receipt. */
function dispatches(): Json[] {
  const allowed = verdict({}, { callee: "reviews-service", capability: "reviews.approve", action: "approve-reply" });
  const ownAct = verdict({ route: "own-act", machineForm: "none", grounds: [] }, { callee: "reviews-service", capability: "reviews.approve", action: "reviews.approve", effect: "none" });
  const call = (extra: Json = {}): Json => ({ agentId: "reviews-service", capability: "reviews.approve", input: CALL_INPUT, decision: { by: "operator", via: "relayed-instruction", action: "approve-reply", instruction: "approve the reply to the review from Anna", at: "2026-11-15T09:59:00Z" }, verdict: { id: allowed.id, askedDigest: allowed.askedDigest }, ...extra });
  const mismatch = { ok: false, code: "decision-invalid", data: { detail: "verdict-mismatch" } };
  const d = (name: string, c: Json, journal: Json | null, now: string, answer: Json) => ({ name, call: c, journal, now, answer });
  const changed = (change: (v: Json) => void) => { const v = clone(allowed); change(v); return v; };
  return [
    d("a current allow that matches the call", call(), allowed, "2026-11-15T10:05:00Z", { dispatch: "verified" }),
    d("an own act's allow, asked by its capability, on a call with no decision", (({ decision: _d, ...rest }) => ({ ...rest, verdict: { id: ownAct.id, askedDigest: ownAct.askedDigest } }))(call()), ownAct, "2026-11-15T10:05:00Z", { dispatch: "verified" }),
    d("a journal entry that is no decision-verdict/1", call(), changed((v) => { delete v.policy; }), "2026-11-15T10:05:00Z", mismatch),
    d("a call without a verdict is forwarded as C3.5 says", (({ verdict: _v, ...rest }) => rest)(call()), null, "2026-11-15T10:05:00Z", { dispatch: "forward" }),
    d("an expired allow", call(), allowed, "2026-11-15T10:10:00Z", mismatch),
    d("before the verdict was given", call(), allowed, "2026-11-15T09:59:59Z", mismatch),
    d("no verdict in the journal", call(), null, "2026-11-15T10:05:00Z", mismatch),
    d("another input than the one asked", call({ input: { reviewId: "r-413", reply: "draft-7" } }), allowed, "2026-11-15T10:05:00Z", mismatch),
    d("another callee", call({ agentId: "billing-service" }), allowed, "2026-11-15T10:05:00Z", mismatch),
    d("another capability", call({ capability: "reviews.delete" }), allowed, "2026-11-15T10:05:00Z", mismatch),
    d("another action in the decision", call({ decision: { by: "operator", via: "relayed-instruction", action: "delete-reply", instruction: "delete it", at: "2026-11-15T09:59:00Z" } }), allowed, "2026-11-15T10:05:00Z", mismatch),
    d("a receipt naming another asked", call({ verdict: { id: allowed.id, askedDigest: sha("other") } }), allowed, "2026-11-15T10:05:00Z", mismatch),
    d("a human verdict is no receipt to dispatch on", call(), changed((v) => { v.verdict = "human"; }), "2026-11-15T10:05:00Z", mismatch),
    d("a journal entry whose id is not its derivation", call({ verdict: { id: sha("forged"), askedDigest: allowed.askedDigest } }), changed((v) => { v.id = sha("forged"); }), "2026-11-15T10:05:00Z", mismatch)
  ];
}

export function decisionVerdictVectors(): Json {
  return {
    about: "Vectors for the decision verdict, decision-verdict/1 (DEC-0172), written by tools/vectors/decision-verdict.ts, never by hand. askedDigest is sha256: of the RFC 8785 canonical JSON of asked, id sha256: of the RFC 8785 canonical JSON of {askedDigest, caller, policy, session}, and asked.argsDigest hmac-sha256: under the host's key (hostKey, hex) of the RFC 8785 canonical JSON of the call's input. documents: schemaValid is the verdict against decision-verdict.schema.json; findings are evaluateSemanticRules(\"decision-verdict\", verdict). references: findings of evaluateSemanticRules(\"decision-verdict-reference\", {verdict, reference}); each reference input is copied from the actionDecision or mandateCovers vectors by case name. dispatches: checkVerdictDispatch({call, journal, now, hostKey}).",
    hostKey: HOST_KEY_HEX,
    documents: documents(),
    references: references(),
    dispatches: dispatches()
  };
}

export function buildDecisionVerdictVectors(): string {
  return `${JSON.stringify(decisionVerdictVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildDecisionVerdictVectors();
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
