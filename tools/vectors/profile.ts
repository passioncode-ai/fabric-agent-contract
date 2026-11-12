/**
 * The generator of the autonomy-profile vectors (DEC-0166): `fixtures/vectors/profile.json`, shared by every service
 * that declares `standing` in its authority extension (`extensions/authority/0.1`) and every hub that states a place's profile as a standing mandate.
 *
 *   tsx tools/vectors/profile.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/profile.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/profile.test.ts` runs the check.
 * The `prof` digest is derived here from DEC-0166 AU-3 with the RFC 8785 canonical form, not by importing
 * `src/mandate.ts`, so the gate checks that the reference agrees. Each case's expected answer is written by hand.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/profile.json";

const NOW = "2026-11-12T10:00:00Z";
const DIGEST = `sha256:${"9a".repeat(32)}`;
const SELF = "example-deployer";
const RUNNER = "example-runner";
const CALLER = "agent:example-runner";
const deploy = { id: "deploy-site", title: "Deploy the site", tool: "site.deploy", gate: "relayed" };
const setProfile = { id: "set-profile", title: "Set the place's profile", tool: "autonomy.profile.set", gate: "relayed" };
const payment = { id: "top-up", title: "Top up", tool: "billing.topup", gate: "human", humanStep: "payment" };
const URL = "https://example-deployer.example/billing/top-up";

/** A place's standing mandate as its hub states it for one assignment (AU-1, AU-3), handed to the runner, then to us;
 * its instruction is the operator's recorded sentence of 2026-11-09 (AU-4's default for a headless place). */
function profile(extra: Json = {}, scope: Json = { capabilities: ["site.deploy"], effects: ["deploy"] }): Json {
  return {
    kind: "mandate/1", by: "operator", standing: { place: "studio-space-1", placeKind: "headless", revision: 3 },
    task: "assignment:alpha-0412", instruction: "По дефолту вообще все, что работает на студии, должно как бы доводиться до конца автономно.",
    at: "2026-11-12T09:00:00Z", expiresAt: "2026-11-13T08:00:00Z", scope,
    chain: [{ agent: RUNNER, at: "2026-11-12T09:00:05Z" }, { agent: SELF, at: "2026-11-12T09:30:00Z" }],
    ...extra
  };
}
/** AU-3: sha256 of the RFC 8785 canonical JSON of the mandate without its chain. */
const prof = (mandate: Json) => {
  const { chain: _chain, ...stated } = mandate;
  return `sha256:${createHash("sha256").update(rfc8785(stated), "utf8").digest("hex")}`;
};
const call = (tier: string, mandate: Json, extra: Json = {}): Json => ({
  action: deploy, tier, caller: CALLER, callerAgent: RUNNER, self: SELF, mandate, effect: "deploy", now: NOW,
  actionDigest: DIGEST, standing: true, ...extra
});
const taken = (mandate: Json, digest = prof(mandate)) => ({
  ok: true, recordAs: { by: "operator", via: "profile", task: mandate.task, chain: [RUNNER, SELF], profile: { place: "studio-space-1", revision: 3, digest }, caller: CALLER }
});

/** A task's operator mandate (no standing), with a scope. */
const task = (scope: Json): Json => (({ standing: _s, ...rest }) => ({ ...rest, scope, expiresAt: "2026-11-14T09:00:00Z" }))(profile());

function actionCases(): Json[] {
  const p = profile();
  const fractional = profile({}, { capabilities: ["site.deploy"], effects: ["deploy"], perCallMaxUsd: 0.5 });
  const otherProf = `sha256:${"cd".repeat(32)}`;
  return [
    // AU-1, AU-3: inside the boundary the standing mandate is read like a task's (MD-3); recorded via profile (AU-6).
    ["a headless profile covers a deploy, from T1", call("T1", p), taken(p)],
    ["the same from T1 with the token's prof", call("T1", p, { tokenProf: prof(p) }), taken(p)],
    // AU-3: from T2 the token's prof binds it.
    ["a headless profile covers a deploy from T2 when the token binds it", call("T2", p, { tokenProf: prof(p) }), taken(p)],
    ["from T2 without prof the profile changes nothing (MD-5)", call("T2", p), { ok: false, code: "approval-required", data: { actionDigest: DIGEST } }],
    ["a token bound to another profile, from T2", call("T2", p, { tokenProf: otherProf }), { ok: false, code: "decision-invalid", data: { detail: "profile-unbound", actionDigest: DIGEST } }],
    ["a token bound to another profile, from T0", call("T0", p, { tokenProf: otherProf }), { ok: false, code: "decision-invalid", data: { detail: "profile-unbound" } }],
    // AU-3: a revision the hub replaced binds no later token: the token's prof names the new revision's digest.
    ["an older revision under a token of the newer", call("T2", p, { tokenProf: prof(profile({ standing: { place: "studio-space-1", placeKind: "headless", revision: 4 } })) }), { ok: false, code: "decision-invalid", data: { detail: "profile-unbound", actionDigest: DIGEST } }],
    // AU-3: a service that does not declare standing answers as if the call carried no mandate.
    ["a service that reads no standing mandates, from T1", call("T1", p, { standing: undefined }), { ok: false, code: "operator-decision-required" }],
    ["a service that reads no standing mandates, from T2", call("T2", p, { standing: undefined, tokenProf: prof(p) }), { ok: false, code: "approval-required", data: { actionDigest: DIGEST } }],
    // AU-5: no profile sets a profile, and none covers a body gate.
    ["a profile setting its own place's profile", call("T1", profile({}, { capabilities: ["autonomy.profile.set", "site.deploy"], effects: ["deploy"] }), { action: setProfile, effect: "deploy" }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: capability" } }],
    ["a payment under a headless profile", { ...call("T1", p), action: payment, humanStepUrl: URL }, { ok: false, code: "human-step-required", data: { humanStep: "payment", url: URL } }],
    // AU-1: the scope bounds it as any mandate's.
    ["a merge outside the profile's effects", call("T1", p, { effect: "merge" }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: effect" } }],
    ["a profile living longer than a day", call("T1", profile({ expiresAt: "2026-11-13T10:00:00Z" })), { ok: false, code: "decision-invalid", data: { detail: "mandate-malformed" } }],
    ["an expired profile", call("T1", p, { now: "2026-11-13T08:00:00Z" }), { ok: false, code: "decision-invalid", data: { detail: "mandate-expired" } }],
    // AU-2: a level holder's profile at a service that reads standing mandates but no levels: as if absent (LV-10).
    ["a level holder's profile where no levels are read, from T1", call("T1", profile({ by: "level", level: "admin", org: "org:org-a", membership: { kind: "an attestation the service never reads" } })), { ok: false, code: "operator-decision-required" }],
    // AU-3: a ceiling with cents has a canonical form (RFC 8785), so its profile is digested and bound like any other.
    ["a profile with a fractional per-call ceiling, from T1", call("T1", fractional, { spendUsd: 0.1 } as Json), taken(fractional)],
    ["the same from T2 with its prof", call("T2", fractional, { tokenProf: prof(fractional), spendUsd: 0.1 } as Json), taken(fractional)],
    // DL-17: from T2 an operator decision counts for nothing, so a bound profile beside one is still read.
    ["a bound profile beside an operator decision, from T2", call("T2", p, { tokenProf: prof(p), decision: { by: "operator", via: "relayed-instruction", action: "deploy-site", instruction: "deploy it", at: "2026-11-12T09:59:00Z" } }), taken(p)],
    // AU-5: no mandate of any kind sets a place's profile, a task's mandate included.
    ["a task's mandate naming autonomy.profile.set, from T1", call("T1", task({ capabilities: ["autonomy.profile.set"], effects: ["deploy"] }), { action: setProfile, effect: "deploy", standing: undefined }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: capability" } }],
    // A task's mandate is unchanged by DEC-0166: from T2 it is still ignored, whatever prof the token carries.
    ["a task's mandate from T2 with a prof", call("T2", (({ standing: _s, ...rest }) => ({ ...rest, expiresAt: "2026-11-14T09:00:00Z" }))(p), { tokenProf: prof(p) }), { ok: false, code: "approval-required", data: { actionDigest: DIGEST } }]
  ].map(([name, input, expected]) => ({ name, input, expected }));
}

/** FAC-SEM-173 on the mandate document (AU-5), beside FAC-SEM-144's lifetime. */
function documentCases(): Json[] {
  return [
    ["a headless profile", profile(), []],
    ["a profile naming autonomy.profile.set", profile({}, { capabilities: ["autonomy.profile.set"], effects: ["deploy"] }), ["FAC-SEM-173 /scope"]],
    ["a profile listing change-policy", profile({}, { capabilities: ["site.deploy"], effects: ["deploy", "change-policy"] }), ["FAC-SEM-173 /scope"]],
    ["a profile handed on with autonomy.profile.set in an action list", profile({ chain: [{ agent: RUNNER, at: "2026-11-12T09:00:05Z" }, { agent: SELF, at: "2026-11-12T09:30:00Z", scope: { capabilities: ["site.deploy"], actions: ["autonomy.profile.set"], effects: ["deploy"] } }] }), ["FAC-SEM-173 /chain/1/scope"]],
    ["a profile living longer than a day", profile({ expiresAt: "2026-11-13T10:00:00Z" }), ["FAC-SEM-144 "]],
    // AU-1: the hub states a profile by the operator of the place's estate; the setter's level is checked at the set.
    ["a profile stated by a level", profile({ by: "level", level: "admin", org: "org:org-a", membership: { kind: "an attestation" } }), ["FAC-SEM-144 "]],
    // FAC-SEM-173 also reads a widened mandate's chain.
    ["a widened profile whose chain step names autonomy.profile.set", profile({ chain: [{ agent: RUNNER, at: "2026-11-12T09:00:05Z" }, { agent: SELF, at: "2026-11-12T09:30:00Z", scope: { capabilities: ["site.deploy", "autonomy.profile.set"], effects: ["deploy"] } }] }), ["FAC-SEM-144 ", "FAC-SEM-173 /chain/1/scope"]]
  ].map(([name, mandate, findings]) => ({ name, mandate, findings }));
}

export function profileVectors(): Json {
  return {
    about: "Vectors for a place's autonomy profile, a standing mandate (mandate/1 with standing, DEC-0166), written by tools/vectors/profile.ts, never by hand. actions: actionDecision's answer for each input (a service declaring standing passes standing: true; tokenProf is the prof claim of the call's verified delegation token, the sha256 of the RFC 8785 canonical JSON of the mandate without its chain). documents: the codes and paths of evaluateSemanticRules(\"mandate\", mandate), in order.",
    actions: actionCases(),
    documents: documentCases()
  };
}

export function buildProfileVectors(): string {
  return `${JSON.stringify(profileVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildProfileVectors();
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
