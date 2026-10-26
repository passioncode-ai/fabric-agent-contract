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
// The operator's example (request 9db9e09e item 2): "run the research" told to a developer agent, which engages a
// research agent that charges for paid work.
const base: Json = {
  kind: "mandate/1",
  by: "operator",
  task: "research the eSIM market for the pricing page",
  instruction: "run the research on eSIM competitors' prices, up to 20 dollars",
  at: "2026-10-26T10:00:00Z",
  expiresAt: "2026-10-27T10:00:00Z",
  scope: { capabilities: ["research.run", "research.ask", "page.update"], effects: ["charge", "draft"], spendUsd: 20, projects: ["example-site"] },
  chain: [{ agent: "example-developer" , at: "2026-10-26T10:01:00Z" }]
};
const handed = (scope?: Json, agent = "example-researcher", at = "2026-10-26T10:05:00Z") => ({ ...base, chain: [...base.chain, scope ? { agent, at, scope } : { agent, at }] });
const research = { capability: "research.run", effect: "charge", spendUsd: 12, project: "example-site" };
const OK = (chain: string[]) => ({ ok: true, recordAs: { by: "operator", via: "mandate", task: base.task, chain } });
const OUT = (part: string) => ({ ok: false, code: "operator-decision-required", data: { detail: `outside-mandate: ${part}` } });
const BAD = (detail: string) => ({ ok: false, code: "decision-invalid", data: { detail } });

function cases(): Array<[string, Json, Json]> {
  const narrowed = { capabilities: ["research.run"], effects: ["charge"], spendUsd: 15, projects: ["example-site"] };
  return [
    ["the paid research the operator asked for, from the developer's machine", { mandate: base, tier: "T0", now: NOW, call: research }, OK(["example-developer"])],
    ["the same from another of the operator's machines (T1)", { mandate: base, tier: "T1", now: NOW, call: research }, OK(["example-developer"])],
    ["handed on narrowed, then used within the narrower scope", { mandate: handed(narrowed), tier: "T0", now: NOW, call: research }, OK(["example-developer", "example-researcher"])],
    ["handed on unchanged", { mandate: handed(), tier: "T0", now: NOW, call: research }, OK(["example-developer", "example-researcher"])],
    ["a read the effects admit (none is below every class)", { mandate: base, tier: "T0", now: NOW, call: { capability: "research.ask", effect: "none" } }, OK(["example-developer"])],
    ["a T2 caller: across the boundary only a delegation token carries authority", { mandate: base, tier: "T2", now: NOW, call: research }, BAD("mandate-at-t2")],
    ["a capability the operator did not name", { mandate: base, tier: "T0", now: NOW, call: { ...research, capability: "billing.topup" } }, OUT("capability")],
    ["an effect above the ceiling (publishing the page)", { mandate: base, tier: "T0", now: NOW, call: { capability: "page.update", effect: "publish", project: "example-site" } }, OUT("effect")],
    ["more than the mandate may spend", { mandate: base, tier: "T0", now: NOW, call: { ...research, spendUsd: 25 } }, OUT("spend")],
    ["more than the narrower scope may spend", { mandate: handed(narrowed), tier: "T0", now: NOW, call: { ...research, spendUsd: 16 } }, OUT("spend")],
    ["spend under a mandate that names none", { mandate: { ...base, scope: { ...base.scope, spendUsd: undefined } }, tier: "T0", now: NOW, call: research }, OUT("spend")],
    ["another project", { mandate: base, tier: "T0", now: NOW, call: { ...research, project: "other-site" } }, OUT("project")],
    ["a relayed action the mandate does not list", { mandate: { ...base, scope: { ...base.scope, actions: ["approve-draft"] } }, tier: "T0", now: NOW, call: { capability: "page.update", action: "publish-page", effect: "draft", project: "example-site" } }, OUT("action")],
    ["a relayed action it lists", { mandate: { ...base, scope: { ...base.scope, actions: ["approve-draft"] } }, tier: "T0", now: NOW, call: { capability: "page.update", action: "approve-draft", effect: "draft", project: "example-site" } }, OK(["example-developer"])],
    ["a relayed action under a mandate that lists neither actions nor capabilities", { mandate: { ...base, scope: { effects: ["draft"] } }, tier: "T0", now: NOW, call: { capability: "page.update", action: "approve-draft", effect: "draft" } }, OUT("action")],
    ["a hand-over that widens the spend", { mandate: handed({ ...narrowed, spendUsd: 50 }), tier: "T0", now: NOW, call: research }, BAD("mandate-widened")],
    ["a hand-over that adds a capability", { mandate: handed({ ...narrowed, capabilities: ["research.run", "billing.topup"] }), tier: "T0", now: NOW, call: research }, BAD("mandate-widened")],
    ["a hand-over that drops the project limit", { mandate: handed({ capabilities: ["research.run"], effects: ["charge"], spendUsd: 15 }), tier: "T0", now: NOW, call: research }, BAD("mandate-widened")],
    ["expired", { mandate: base, tier: "T0", now: "2026-10-27T10:00:00Z", call: research }, BAD("mandate-expired")],
    ["given in the future, beyond the clock's skew", { mandate: { ...base, at: "2026-10-26T12:02:00Z", chain: [{ agent: "example-developer", at: "2026-10-26T12:03:00Z" }] }, tier: "T0", now: NOW, call: research }, BAD("mandate-early")],
    ["standing longer than seven days", { mandate: { ...base, expiresAt: "2026-11-03T10:00:01Z" }, tier: "T0", now: NOW, call: research }, BAD("mandate-malformed")],
    ["a chain step before the operator spoke", { mandate: { ...base, chain: [{ agent: "example-developer", at: "2026-10-26T09:00:00Z" }] }, tier: "T0", now: NOW, call: research }, BAD("mandate-malformed")],
    ["an agent twice in the chain", { mandate: handed(undefined, "example-developer"), tier: "T0", now: NOW, call: research }, BAD("mandate-malformed")],
    ["a fifth agent", { mandate: { ...base, chain: ["a1", "a2", "a3", "a4", "a5"].map((agent, index) => ({ agent: `example-${agent}`, at: `2026-10-26T10:0${index + 1}:00Z` })) }, tier: "T0", now: NOW, call: research }, BAD("mandate-malformed")],
    ["no operator's words", { mandate: { ...base, instruction: "" }, tier: "T0", now: NOW, call: research }, BAD("mandate-malformed")],
    ["the clock does not read", { mandate: base, tier: "T0", now: "yesterday", call: research }, { fault: "now-unreadable" }]
  ];
}

export function mandateVectors(): Json {
  return {
    about: "Vectors for the operator's mandate, mandate/1 (DEC-0125, MD-1 to MD-5), written by tools/vectors/mandate.ts, never by hand. mandateCovers({mandate, tier, now, call: {capability, action?, effect, spendUsd?, project?}}) answers {ok: true, recordAs: {by: operator, via: mandate, task, chain}} for a call the mandate's effective scope covers (the last chain entry's scope, else the mandate's) from a T0 or T1 caller; {ok: false, code: operator-decision-required, data: {detail: outside-mandate: <capability|action|effect|spend|project>}} for a valid one that does not cover it, naming the first part not covered in that order; {ok: false, code: decision-invalid, data: {detail}} for a T2 caller (mandate-at-t2), a document that is not the schema's or stands more than 7 days or whose chain steps go back in time, repeat an agent or exceed four (mandate-malformed), a hand-over that widens a list, the effects or the spend (mandate-widened), one given more than 60 s after the clock (mandate-early) or one past its expiry (mandate-expired); {fault} is the callee's own and never sent. A relayed action is covered only when the scope's actions list it, or, when the scope lists no actions, its capabilities include the action's tool.",
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
