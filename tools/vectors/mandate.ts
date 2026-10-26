/**
 * The generator of the mandate vectors (DEC-0125): `fixtures/vectors/mandate.json`, shared by every agent that leads a
 * task or hands one on and every callee that reads `_meta.mandate`.
 *
 *   tsx tools/vectors/mandate.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/mandate.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected answer is written below by
 * hand from DEC-0125; nothing here imports `src/mandate.ts`, so the gate checks that the reference agrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/mandate.json";

const NOW = "2026-10-26T12:00:00Z";
// The operator's example (request 9db9e09e item 2), in its own words: "run the research", told to a developer agent,
// which calls a research agent that charges for paid work. The chain holds both: every call appends its callee.
const base: Json = {
  kind: "mandate/1",
  by: "operator",
  task: "research the eSIM market for the pricing page",
  instruction: "run the research on eSIM competitors' prices",
  at: "2026-10-26T10:00:00Z",
  expiresAt: "2026-10-27T10:00:00Z",
  scope: { capabilities: ["research.run", "research.ask", "page.update"], effects: ["charge", "draft"], projects: ["example-site"] },
  chain: [{ agent: "example-developer", at: "2026-10-26T10:01:00Z" }, { agent: "example-researcher", at: "2026-10-26T10:05:00Z" }]
};
const withScope = (scope: Json) => ({ ...base, scope: { ...base.scope, ...scope } });
const lastScope = (scope: Json) => ({ ...base, chain: [base.chain[0], { ...base.chain[1], scope }] });
const research = { capability: "research.run", effect: "charge", spendUsd: 12, project: "example-site" };
const call = (extra: Json = {}) => ({ mandate: base, tier: "T0", now: NOW, self: "example-researcher", callerAgent: "example-developer", call: research, ...extra });
const OK = (chain: string[] = ["example-developer", "example-researcher"]) => ({ ok: true, recordAs: { by: "operator", via: "mandate", task: base.task, chain } });
const OUT = (part: string, data: Json = {}) => ({ ok: false, code: "operator-decision-required", data: { detail: `outside-mandate: ${part}`, ...data } });
const BAD = (detail: string) => ({ ok: false, code: "decision-invalid", data: { detail } });

function cases(): Array<[string, Json, Json]> {
  const narrowed = { capabilities: ["research.run"], effects: ["charge"], perCallMaxUsd: 15, projects: ["example-site"] };
  const third = { ...base, chain: [...base.chain, { agent: "example-crawler", at: "2026-10-26T10:06:00Z" }] };
  return [
    ["the operator's words with no amount: the paid research is covered, the money limits decide its spend", call(), OK()],
    ["the same from another of the operator's machines (T1)", call({ tier: "T1" }), OK()],
    ["a read the effects admit (none is below every class)", call({ call: { capability: "research.ask", effect: "none" } }), OK()],
    ["a per-call ceiling the estimate stays within", call({ mandate: withScope({ perCallMaxUsd: 20 }) }), OK()],
    ["handed on narrowed, used within the narrower scope", call({ mandate: lastScope(narrowed) }), OK()],
    ["a third agent the researcher called", call({ mandate: third, self: "example-crawler", callerAgent: "example-researcher" }), OK(["example-developer", "example-researcher", "example-crawler"])],
    // DEC-0126 OA-2, OA-6: the operator said it in another of their agents' sessions; where travels into the record.
    ["words relayed from another of the operator's agents: where they said them travels into the record", call({ mandate: { ...base, source: { project: "example-analyst", thread: "example-thread-3" } } }), { ...OK(), recordAs: { ...OK().recordAs, source: { project: "example-analyst", thread: "example-thread-3" } } }],
    ["a source naming neither the session nor the thread", call({ mandate: { ...base, source: { project: "example-analyst" } } }), BAD("mandate-malformed")],
    ["a T2 caller: its mandate changes nothing, the profile applies", call({ tier: "T2" }), { ignored: "mandate-at-t2" }],
    ["the callee is not the chain's last agent", call({ self: "example-other" }), BAD("mandate-not-for-this-call")],
    ["the authenticated caller is not the agent before the callee", call({ callerAgent: "example-other" }), BAD("mandate-not-for-this-call")],
    ["no authenticated caller id (the shared descriptor token on loopback): the chain's end binds it", call({ callerAgent: undefined }), OK()],
    ["a relayed action with an external effect, named by actions alone", call({ mandate: { ...base, scope: { actions: ["publish-page"], effects: ["publish"] } }, call: { capability: "page.update", action: "publish-page", effect: "publish" } }), OK()],
    ["a capability with an external effect under a mandate that lists only actions", call({ mandate: { ...base, scope: { actions: ["approve-draft"], effects: ["charge"] } } }), OUT("capability")],
    ["a chain of the leading agent alone names no callee", call({ mandate: { ...base, chain: [base.chain[0]] }, self: "example-developer" }), BAD("mandate-not-for-this-call")],
    ["a capability the operator did not name", call({ call: { ...research, capability: "billing.topup" } }), OUT("capability")],
    ["an effect above the ceiling (publishing the page)", call({ call: { capability: "page.update", effect: "publish", project: "example-site" } }), OUT("effect")],
    ["a policy change, which no mandate covers (AP-5)", call({ mandate: withScope({ effects: ["change-policy"] }), call: { capability: "page.update", effect: "change-policy", project: "example-site" } }), OUT("effect")],
    ["an external effect under a mandate that names no capability or action", call({ mandate: { ...base, scope: { effects: ["charge"] } }, call: { capability: "research.run", effect: "charge", spendUsd: 1 } }), OUT("capability")],
    ["a draft under a mandate that names no capability", call({ mandate: { ...base, scope: { effects: ["draft"] } }, call: { capability: "page.update", effect: "draft" } }), OK()],
    ["above the per-call ceiling", call({ mandate: withScope({ perCallMaxUsd: 20 }), call: { ...research, spendUsd: 25 } }), OUT("spend", { estimateUsd: 25, perCallMaxUsd: 20 })],
    ["no estimate under a per-call ceiling", call({ mandate: withScope({ perCallMaxUsd: 20 }), call: { capability: "research.run", effect: "charge", project: "example-site" } }), OUT("spend", { perCallMaxUsd: 20 })],
    ["above the narrower ceiling", call({ mandate: lastScope(narrowed), call: { ...research, spendUsd: 16 } }), OUT("spend", { estimateUsd: 16, perCallMaxUsd: 15 })],
    ["another project", call({ call: { ...research, project: "other-site" } }), OUT("project")],
    ["a relayed action the mandate does not list", call({ mandate: withScope({ actions: ["approve-draft"] }), call: { capability: "page.update", action: "publish-page", effect: "draft", project: "example-site" } }), OUT("action")],
    ["a relayed action it lists", call({ mandate: withScope({ actions: ["approve-draft"] }), call: { capability: "page.update", action: "approve-draft", effect: "draft", project: "example-site" } }), OK()],
    ["a relayed action under a mandate that lists neither actions nor capabilities", call({ mandate: { ...base, scope: { effects: ["draft"] } }, call: { capability: "page.update", action: "approve-draft", effect: "draft" } }), OUT("action")],
    ["a hand-over that raises the ceiling", call({ mandate: { ...withScope({ perCallMaxUsd: 20 }), chain: [base.chain[0], { ...base.chain[1], scope: { ...narrowed, perCallMaxUsd: 50 } }] } }), BAD("mandate-widened")],
    ["a hand-over that drops the ceiling", call({ mandate: { ...withScope({ perCallMaxUsd: 20 }), chain: [base.chain[0], { ...base.chain[1], scope: { capabilities: ["research.run"], effects: ["charge"], projects: ["example-site"] } }] } }), BAD("mandate-widened")],
    ["a hand-over that adds a capability", call({ mandate: lastScope({ ...narrowed, capabilities: ["research.run", "billing.topup"] }) }), BAD("mandate-widened")],
    ["a hand-over that drops the project limit", call({ mandate: lastScope({ capabilities: ["research.run"], effects: ["charge"] }) }), BAD("mandate-widened")],
    ["expired", call({ now: "2026-10-27T10:00:00Z" }), BAD("mandate-expired")],
    ["given in the future, beyond the clock's skew", call({ mandate: { ...base, at: "2026-10-26T12:02:00Z", chain: [{ agent: "example-developer", at: "2026-10-26T12:03:00Z" }, { agent: "example-researcher", at: "2026-10-26T12:04:00Z" }] } }), BAD("mandate-early")],
    ["standing longer than seven days", call({ mandate: { ...base, expiresAt: "2026-11-03T10:00:01Z" } }), BAD("mandate-malformed")],
    ["a chain step before the operator spoke", call({ mandate: { ...base, chain: [{ agent: "example-developer", at: "2026-10-26T09:00:00Z" }, base.chain[1]] } }), BAD("mandate-malformed")],
    ["an agent twice in the chain", call({ mandate: { ...base, chain: [...base.chain, { agent: "example-developer", at: "2026-10-26T10:07:00Z" }] }, self: "example-developer", callerAgent: "example-researcher" }), BAD("mandate-malformed")],
    ["a fifth agent", call({ mandate: { ...base, chain: ["a1", "a2", "a3", "a4", "a5"].map((agent, index) => ({ agent: `example-${agent}`, at: `2026-10-26T10:0${index + 1}:00Z` })) } }), BAD("mandate-malformed")],
    ["no operator's words", call({ mandate: { ...base, instruction: "" } }), BAD("mandate-malformed")],
    ["the clock does not read", call({ now: "yesterday" }), { fault: "now-unreadable" }],
    // DEC-0136 MD-2a: a scope naming no call covers no relayed action; a hand-over that adds actions there widens it.
    ["a hand-over that added an actions list the scope in force left out (MD-2a)", call({ mandate: { ...base, scope: { effects: ["publish"], projects: ["example-site"] }, chain: [base.chain[0], { ...base.chain[1], scope: { actions: ["publish-page"], effects: ["publish"], projects: ["example-site"] } }] }, call: { capability: "page.update", action: "publish-page", effect: "publish", project: "example-site" } }), BAD("mandate-widened")]
  ];
}

// MD-2, the hand-over: what an agent sends when it calls the next one. The input is the mandate it holds, the agent it
// calls, when, and the narrower scope it hands on, if any; the answer is the mandate it sends, or the problem that
// stops it (the call then goes without the mandate, or does not go). Written by hand, like the cases above.
const leading: Json = { ...base, chain: [base.chain[0]] };
const narrow: Json = { capabilities: ["research.run"], effects: ["charge"], perCallMaxUsd: 5, projects: ["example-site"] };
const handed: Json = { ...base, chain: [base.chain[0], { agent: "example-researcher", at: "2026-10-26T10:05:00Z", scope: narrow }] };
const step = (agent: string, at: string, scope?: Json) => (scope ? { agent, at, scope } : { agent, at });
const SENT = (mandate: Json, ...steps: Json[]) => ({ mandate: { ...mandate, chain: [...mandate.chain, ...steps] } });
const STOP = (problem: string) => ({ refused: problem });

function handOnCases(): Array<[string, Json, Json]> {
  const four = { ...base, chain: ["developer", "researcher", "third", "fourth"].map((agent, index) => step(`example-${agent}`, `2026-10-26T10:0${index + 1}:00Z`)) };
  const sourced = { ...leading, source: { project: "example-analyst", session: "example-session-7" } };
  // A scope that names no call: reads and drafts on any capability, no external effect, no relayed action (MD-3).
  const unnamed = { ...leading, scope: { effects: ["publish"], projects: ["example-site"] } };
  const actioned = { ...base, chain: [base.chain[0], { agent: "example-researcher", at: "2026-10-26T10:05:00Z", scope: { ...narrow, actions: ["approve-draft", "reject-draft"] } }] };
  const passed = { ...handed, chain: [...handed.chain, step("example-crawler", "2026-10-26T10:06:00Z")] };
  const widenedEarlier = { ...base, chain: [base.chain[0], { ...base.chain[1], scope: { ...base.scope, capabilities: ["research.run", "research.ask", "page.update", "page.delete"] } }] };
  return [
    ["the leading agent calls the researcher: the chain gains it, the scope in force stays the mandate's", { mandate: leading, callee: "example-researcher", at: "2026-10-26T10:05:00Z" }, SENT(leading, step("example-researcher", "2026-10-26T10:05:00Z"))],
    ["handed on narrowed: the callee's step carries the narrower scope", { mandate: leading, callee: "example-researcher", at: "2026-10-26T10:05:00Z", narrower: narrow }, SENT(leading, step("example-researcher", "2026-10-26T10:05:00Z", narrow))],
    ["the narrowed holder hands on with no scope of its own: the narrower one stays in force", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z" }, SENT(handed, step("example-crawler", "2026-10-26T10:06:00Z"))],
    ["narrower again: fewer effects (draft stays below charge), a lower ceiling", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, effects: ["draft"], perCallMaxUsd: 2 } }, SENT(handed, step("example-crawler", "2026-10-26T10:06:00Z", { ...narrow, effects: ["draft"], perCallMaxUsd: 2 }))],
    ["the same scope again: equal is within", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: narrow }, SENT(handed, step("example-crawler", "2026-10-26T10:06:00Z", narrow))],
    ["adding an actions list where capabilities are listed narrows the relayed actions they name", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, actions: ["approve-draft"] } }, SENT(handed, step("example-crawler", "2026-10-26T10:06:00Z", { ...narrow, actions: ["approve-draft"] }))],
    ["an actions list within the one in force", { mandate: actioned, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, actions: ["approve-draft"] } }, SENT(actioned, step("example-crawler", "2026-10-26T10:06:00Z", { ...narrow, actions: ["approve-draft"] }))],
    ["an action the scope in force does not list widens", { mandate: actioned, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, actions: ["approve-draft", "publish-page"] } }, STOP("mandate-widened")],
    ["adding a projects list narrows it (no list means every project)", { mandate: unnamed, callee: "example-researcher", at: "2026-10-26T10:05:00Z", narrower: { effects: ["publish"], projects: ["example-site"] } }, SENT(unnamed, step("example-researcher", "2026-10-26T10:05:00Z", { effects: ["publish"], projects: ["example-site"] }))],
    ["at the same second as the step before", { mandate: leading, callee: "example-researcher", at: "2026-10-26T10:01:00Z" }, SENT(leading, step("example-researcher", "2026-10-26T10:01:00Z"))],
    ["where the operator said the words travels unchanged", { mandate: sourced, callee: "example-researcher", at: "2026-10-26T10:05:00Z" }, SENT(sourced, step("example-researcher", "2026-10-26T10:05:00Z"))],
    ["a higher per-call ceiling widens", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, perCallMaxUsd: 6 } }, STOP("mandate-widened")],
    ["dropping the per-call ceiling widens", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { capabilities: ["research.run"], effects: ["charge"], projects: ["example-site"] } }, STOP("mandate-widened")],
    ["a capability the holder was not given widens", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, capabilities: ["research.run", "page.update"] } }, STOP("mandate-widened")],
    ["an effect outside the holder's ceiling (its closure, as a grant's) widens", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, effects: ["charge", "publish"] } }, STOP("mandate-widened")],
    ["adding an actions list where the scope in force names no call widens (it would cover a relayed action, MD-2a)", { mandate: unnamed, callee: "example-researcher", at: "2026-10-26T10:05:00Z", narrower: { actions: ["publish-page"], effects: ["publish"], projects: ["example-site"] } }, STOP("mandate-widened")],
    ["adding a capabilities list where the scope in force has none widens (it would name calls for an external effect, MD-2a)", { mandate: unnamed, callee: "example-researcher", at: "2026-10-26T10:05:00Z", narrower: { capabilities: ["page.update"], effects: ["publish"], projects: ["example-site"] } }, STOP("mandate-widened")],
    ["the scope in force after a step with none is the last one named", { mandate: passed, callee: "example-fourth", at: "2026-10-26T10:07:00Z", narrower: { ...narrow, perCallMaxUsd: 6 } }, STOP("mandate-widened")],
    ["a mandate already widened by an earlier step is not handed on", { mandate: JSON.parse(JSON.stringify(widenedEarlier)), callee: "example-crawler", at: "2026-10-26T10:06:00Z" }, STOP("mandate-widened")],
    ["dropping the capabilities list widens (no list names no call for an external effect)", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { effects: ["charge"], perCallMaxUsd: 5, projects: ["example-site"] } }, STOP("mandate-widened")],
    ["dropping the projects list widens (no list means every project)", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { capabilities: ["research.run"], effects: ["charge"], perCallMaxUsd: 5 } }, STOP("mandate-widened")],
    ["back in time from the step before", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:04:00Z" }, STOP("mandate-malformed")],
    ["a narrower scope that is not the schema's (an empty effects list)", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, effects: [] } }, STOP("mandate-malformed")],
    ["at the mandate's expiry (expiresAt itself is already past)", { mandate: leading, callee: "example-researcher", at: "2026-10-27T10:00:00Z" }, STOP("mandate-malformed")],
    ["an agent already in the chain", { mandate: handed, callee: "example-developer", at: "2026-10-26T10:06:00Z" }, STOP("mandate-malformed")],
    ["two problems: a widening step back in time is malformed (time is read before scope)", { mandate: handed, callee: "example-crawler", at: "2026-10-26T10:04:00Z", narrower: { ...narrow, perCallMaxUsd: 6 } }, STOP("mandate-malformed")],
    ["two problems: a widening step by an agent already in the chain is widened (repeats are read last)", { mandate: handed, callee: "example-developer", at: "2026-10-26T10:06:00Z", narrower: { ...narrow, perCallMaxUsd: 6 } }, STOP("mandate-widened")],
    ["a fifth agent", { mandate: four, callee: "example-fifth", at: "2026-10-26T10:08:00Z" }, STOP("mandate-malformed")]
  ];
}

export function mandateVectors(): Json {
  return {
    about: "Vectors for the operator's mandate, mandate/1 (DEC-0125, MD-1 to MD-6), written by tools/vectors/mandate.ts, never by hand. mandateCovers({mandate, tier, now, self, callerAgent?, call: {capability, action?, effect, spendUsd?, project?}}) answers {ignored: mandate-at-t2} for a T2 caller (its mandate changes nothing); {ok: false, code: decision-invalid, data: {detail}} for a document that is not the schema's, stands more than 7 days, or whose chain goes back in time, repeats an agent or exceeds four (mandate-malformed), a hand-over that widens a list, the effects or the per-call ceiling or drops one (mandate-widened), a chain that does not end in self, or, when the callee authenticated its caller's agent id (callerAgent), does not name it before self (mandate-not-for-this-call), one given more than 60 s after the clock (mandate-early) or past its expiry (mandate-expired); {ok: false, code: operator-decision-required, data: {detail: outside-mandate: <action|capability|effect|spend|project>, estimateUsd?, perCallMaxUsd?}} for a valid one that does not cover the call, naming the first part not covered in that order; otherwise {ok: true, recordAs: {by: operator, via: mandate, task, chain, source?}}, source being where the operator said the words when the mandate carries it (DEC-0126 OA-6). The scope in force is the last chain entry's that names one, else the mandate's. A relayed action is covered when the scope's actions list it, or, with no actions listed, its capabilities include its tool; change-policy is never covered (AP-5); an effect beyond draft needs the call named, a relayed action by actions or capabilities and any other call by capabilities; with perCallMaxUsd the call's own estimate must exist and be within it, without it the money limits decide. {fault} is the callee's own and never sent. `handOn`: handOn({mandate, callee, at, narrower?}) answers {mandate} the agent sends with its call, the chain gaining {agent: callee, at, scope: narrower?} (MD-2), or the first problem FAC-SEM-144 finds in the resulting document, read in this order: the schema (mandate-malformed: a result that is not the schema's, a fifth agent), the 7-day span, then each step in turn, its time (mandate-malformed: back in time, an equal time being in order, or at or after expiresAt) before its scope (mandate-widened: an entry of a list the scope in force does not hold, a list it holds that is dropped, a capabilities or actions list it leaves out that is added, except actions where it lists capabilities (DEC-0136 MD-2a), an effect outside its ceiling's closure as a grant's, a higher or dropped per-call ceiling; a projects list may be added), then an agent named twice (mandate-malformed). The scope in force is the last step's that names one, else the mandate's. source travels unchanged.",
    cases: cases().map(([name, input, expected]) => ({ name, input: JSON.parse(JSON.stringify(input)), expected })),
    handOn: handOnCases().map(([name, input, expected]) => ({ name, input: JSON.parse(JSON.stringify(input)), expected: JSON.parse(JSON.stringify(expected)) }))
  };
}

export function buildMandateVectors(): string {
  return `${JSON.stringify(mandateVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildMandateVectors();
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
