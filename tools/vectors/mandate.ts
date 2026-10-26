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
const call = (extra: Json = {}) => ({ mandate: base, tier: "T0", now: NOW, self: "example-researcher", caller: "example-developer", call: research, ...extra });
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
    ["a third agent the researcher called", call({ mandate: third, self: "example-crawler", caller: "example-researcher" }), OK(["example-developer", "example-researcher", "example-crawler"])],
    ["a T2 caller: its mandate changes nothing, the profile applies", call({ tier: "T2" }), { ignored: "mandate-at-t2" }],
    ["the callee is not the chain's last agent", call({ self: "example-other" }), BAD("mandate-not-for-this-call")],
    ["the caller is not the agent before the callee", call({ caller: "example-other" }), BAD("mandate-not-for-this-call")],
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
    ["an agent twice in the chain", call({ mandate: { ...base, chain: [...base.chain, { agent: "example-developer", at: "2026-10-26T10:07:00Z" }] }, self: "example-developer", caller: "example-researcher" }), BAD("mandate-malformed")],
    ["a fifth agent", call({ mandate: { ...base, chain: ["a1", "a2", "a3", "a4", "a5"].map((agent, index) => ({ agent: `example-${agent}`, at: `2026-10-26T10:0${index + 1}:00Z` })) } }), BAD("mandate-malformed")],
    ["no operator's words", call({ mandate: { ...base, instruction: "" } }), BAD("mandate-malformed")],
    ["the clock does not read", call({ now: "yesterday" }), { fault: "now-unreadable" }]
  ];
}

export function mandateVectors(): Json {
  return {
    about: "Vectors for the operator's mandate, mandate/1 (DEC-0125, MD-1 to MD-6), written by tools/vectors/mandate.ts, never by hand. mandateCovers({mandate, tier, now, self, caller, call: {capability, action?, effect, spendUsd?, project?}}) answers {ignored: mandate-at-t2} for a T2 caller (its mandate changes nothing); {ok: false, code: decision-invalid, data: {detail}} for a document that is not the schema's, stands more than 7 days, or whose chain goes back in time, repeats an agent or exceeds four (mandate-malformed), a hand-over that widens a list, the effects or the per-call ceiling or drops one (mandate-widened), a chain that does not end in self with caller before it (mandate-not-for-this-call), one given more than 60 s after the clock (mandate-early) or past its expiry (mandate-expired); {ok: false, code: operator-decision-required, data: {detail: outside-mandate: <action|capability|effect|spend|project>, estimateUsd?, perCallMaxUsd?}} for a valid one that does not cover the call, naming the first part not covered in that order; otherwise {ok: true, recordAs: {by: operator, via: mandate, task, chain}}. The scope in force is the last chain entry's that names one, else the mandate's. A relayed action is covered when the scope's actions list it, or, with no actions listed, its capabilities include its tool; change-policy is never covered (AP-5); an effect beyond draft needs capabilities or actions listed; with perCallMaxUsd the call's own estimate must exist and be within it, without it the money limits decide. {fault} is the callee's own and never sent.",
    cases: cases().map(([name, input, expected]) => ({ name, input: JSON.parse(JSON.stringify(input)), expected }))
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
