/**
 * The generator of the autonomy-profile vectors (DEC-0166): `fixtures/vectors/profile.json`, shared by every service
 * that declares `standing` in its authority extension (`extensions/authority/0.1`) and every hub that states a place's profile as a standing mandate.
 *
 *   tsx tools/vectors/profile.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/profile.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/profile.test.ts` runs the check.
 * The `prof` digest is derived here from DEC-0166 AU-3, not by importing `src/mandate.ts`, so the gate checks that the
 * reference's hashing agrees; the RFC 8785 form itself is `src/canonical.ts`'s, which `test/canonical.test.ts` checks. Each case's expected answer is written by hand.
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
const settingsAction = { id: "autonomy.profile.set", title: "Set the place's profile", tool: "hub.settings", gate: "relayed" };
const payment = { id: "top-up", title: "Top up", tool: "billing.topup", gate: "human", humanStep: "payment" };
const URL = "https://example-deployer.example/billing/top-up";
const STANDING = { place: "studio-space-1", placeKind: "headless", revision: 3, context: "personal" };
/** An organization's profile: stated for that organization's context, with the level of the holder who set it. */
const ORG_STANDING = { ...STANDING, context: "org:org-a" };

/** A place's standing mandate as its hub states it for one assignment (AU-1, AU-3), handed to the runner, then to us;
 * its instruction is the operator's recorded sentence of 2026-11-09 (AU-4's default for a headless place). */
function profile(extra: Json = {}, scope: Json = { capabilities: ["site.deploy"], effects: ["deploy"] }): Json {
  return {
    kind: "mandate/1", by: "operator", standing: STANDING,
    task: "assignment:alpha-0412", instruction: "По дефолту вообще все, что работает на студии, должно как бы доводиться до конца автономно.",
    at: "2026-11-12T09:00:00Z", expiresAt: "2026-11-13T08:00:00Z", scope,
    chain: [{ agent: RUNNER, at: "2026-11-12T09:00:05Z" }, { agent: SELF, at: "2026-11-12T09:30:00Z" }],
    ...extra
  };
}
/** AU-3: sha256 of the RFC 8785 canonical JSON of the mandate without its chain and its source. */
const prof = (mandate: Json) => {
  const { chain: _chain, source: _source, ...stated } = mandate;
  return `sha256:${createHash("sha256").update(rfc8785(stated), "utf8").digest("hex")}`;
};
/** DEC-0162's level contexts, as its own vectors give a service that reads levels in `org:org-a`. */
const LEVELS = (JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/levels.json"), "utf8")) as { actions: [{ input: { levels: Json } }] }).actions[0].input.levels;
const call = (tier: string, mandate: Json, extra: Json = {}): Json => ({
  action: deploy, tier, caller: CALLER, callerAgent: RUNNER, self: SELF, mandate, effect: "deploy", now: NOW,
  // The context the call acts in, the service's own knowledge: the profile's own unless a case says otherwise (AU-1).
  context: mandate?.standing?.context ?? "personal",
  actionDigest: DIGEST, standing: true, ...extra
});
const taken = (mandate: Json, digest = prof(mandate)) => ({
  ok: true, recordAs: { by: "operator", via: "profile", task: mandate.task, chain: [RUNNER, SELF], profile: { place: "studio-space-1", revision: 3, digest, ...(mandate.standing.setLevel === undefined ? {} : { setLevel: mandate.standing.setLevel }) }, caller: CALLER }
});

/** A task's operator mandate (no standing), with a scope. */
const task = (scope: Json): Json => (({ standing: _s, ...rest }) => ({ ...rest, scope, expiresAt: "2026-11-14T09:00:00Z" }))(profile());

function actionCases(): Json[] {
  const p = profile();
  const fractional = profile({}, { capabilities: ["site.deploy"], effects: ["deploy"], perCallMaxUsd: 0.5 });
  const headlessDefault = profile({}, { capabilities: ["site.deploy"], effects: ["draft", "publish", "send", "reply", "charge", "delete", "merge", "deploy"] });
  const narrowed = profile({ chain: [{ agent: RUNNER, at: "2026-11-12T09:00:05Z" }, { agent: SELF, at: "2026-11-12T09:30:00Z", scope: { capabilities: ["site.deploy"], effects: ["draft"] } }] });
  const otherProf = `sha256:${"cd".repeat(32)}`;
  const estateDefault = profile({ standing: { ...STANDING, estateCapabilities: true } }, { effects: ["draft", "publish", "send", "reply", "charge", "delete", "merge", "deploy"] });
  const byAdmin = profile({ standing: { ...ORG_STANDING, setLevel: "admin" } });
  const byOwner = profile({ standing: { ...ORG_STANDING, setLevel: "owner" } });
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
    // AU-2: a send to people outside the estate, which the service answers as absent by passing no standing for it.
    ["a send to people outside the estate, answered as absent, from T1", call("T1", p, { standing: undefined, effect: "send" }), { ok: false, code: "operator-decision-required" }],
    // AU-5: no profile sets a profile, and none covers a body gate.
    ["a profile setting its own place's profile", call("T1", profile({}, { capabilities: ["autonomy.profile.set", "site.deploy"], effects: ["deploy"] }), { action: setProfile, effect: "deploy" }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: capability" } }],
    ["a payment under a headless profile", { ...call("T1", p), action: payment, humanStepUrl: URL }, { ok: false, code: "human-step-required", data: { humanStep: "payment", url: URL } }],
    // AU-1: the scope bounds it as any mandate's.
    ["a merge outside the profile's effects", call("T1", p, { effect: "merge" }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: effect" } }],
    ["a profile living longer than a day", call("T1", profile({ expiresAt: "2026-11-13T10:00:00Z" })), { ok: false, code: "decision-invalid", data: { detail: "mandate-malformed" } }],
    ["an expired profile", call("T1", p, { now: "2026-11-13T08:00:00Z" }), { ok: false, code: "decision-invalid", data: { detail: "mandate-expired" } }],
    // AU-2: a level holder's profile at a service that reads standing mandates but no levels: as if absent (LV-10).
    ["a malformed level standing mandate where no levels are read, as LV-10, from T1", call("T1", profile({ by: "level", level: "admin", org: "org:org-a", membership: { kind: "an attestation the service never reads" } })), { ok: false, code: "operator-decision-required" }],
    // AU-3: a ceiling with cents has a canonical form (RFC 8785), so its profile is digested and bound like any other.
    ["a profile with a fractional per-call ceiling, from T1", call("T1", fractional, { spendUsd: 0.1 } as Json), taken(fractional)],
    ["the same from T2 with its prof", call("T2", fractional, { tokenProf: prof(fractional), spendUsd: 0.1 } as Json), taken(fractional)],
    // AU-2: a profile an organization's level holder set covers no action declared above that level (LV-7, LV-10).
    ["an administrator's profile at an action declared operator, from T1", call("T1", byAdmin, { actionLevel: "operator" }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: operator" } }],
    ["an administrator's profile at an action declared owner, from T2", call("T2", byAdmin, { actionLevel: "owner", tokenProf: prof(byAdmin) }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: owner", actionDigest: DIGEST } }],
    ["an owner's profile at an action declared owner, from T1", call("T1", byOwner, { actionLevel: "owner" }), taken(byOwner)],
    ["an administrator's profile at an action declared admin, from T1", call("T1", byAdmin, { actionLevel: "admin" }), taken(byAdmin)],
    ["an owner's profile at an action declared operator, from T1", call("T1", byOwner, { actionLevel: "operator" }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: operator" } }],
    ["a service's mistyped declared level is its own fault, never a caller's answer", call("T1", byAdmin, { actionLevel: "Owner" }), { fault: "action-level-invalid" }],
    // AU-1: a profile stands only in the context it was stated for, as a level does (DEC-0162 LV-4).
    ["an administrator's profile on a call in a personal context, from T0", call("T0", byAdmin, { context: "personal" }), { ok: false, code: "decision-invalid", data: { detail: "profile-context" } }],
    ["an administrator's profile on a call in another organization, from T1", call("T1", byAdmin, { actionLevel: "admin", context: "org:org-b" }), { ok: false, code: "decision-invalid", data: { detail: "profile-context" } }],
    ["the operator's personal profile on a call in an organization's context, from T1", call("T1", p, { context: "org:org-a", actionLevel: "owner" }), { ok: false, code: "decision-invalid", data: { detail: "profile-context" } }],
    ["a service reading profiles that does not say the call's context", (({ context: _c, ...rest }) => rest)(call("T1", p)), { fault: "context-missing" }],
    // AU-1, AU-2: an organization's profile always names its setter's level.
    ["an organization's profile without a setter's level, from T1", call("T1", profile({ standing: ORG_STANDING })), { ok: false, code: "decision-invalid", data: { detail: "mandate-malformed" } }],
    ["a profile with a setter's level stated for the personal context", call("T1", profile({ standing: { ...STANDING, setLevel: "admin" } })), { ok: false, code: "decision-invalid", data: { detail: "mandate-malformed" } }],
    ["the operator's own profile at an action declared operator, from T1", call("T1", p, { actionLevel: "operator" }), taken(p)],
    // AU-2: an architect records no profile (the operator's answer to question 4, 2026-11-13), so the schema refuses its level.
    // AU-2 and DEC-0162 LV-7: at a service that reads levels, in an organization's context, an act declared owner or admin
    // takes only a level form; a profile's setLevel is the hub's statement, so it is refused like an operator form.
    ["an owner's profile on an act declared owner, at a service reading levels, from T1", call("T1", byOwner, { levels: LEVELS, actionLevel: "owner" }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: owner" } }],
    ["an administrator's profile on an act declared admin, at a service reading levels, from T2 with prof", call("T2", byAdmin, { levels: LEVELS, actionLevel: "admin", tokenProf: prof(byAdmin) }), { ok: false, code: "operator-decision-required", data: { detail: "level-insufficient: admin", actionDigest: DIGEST } }],
    ["an administrator's profile on an act left undeclared, at a service reading levels, from T1", call("T1", byAdmin, { levels: LEVELS }), taken(byAdmin)],
    ["a profile an architect set, from T1", call("T1", profile({ standing: { ...STANDING, setLevel: "architect" } }), { project: "alpha" }), { ok: false, code: "decision-invalid", data: { detail: "mandate-malformed" } }],
    // A non-object standing is no standing mandate: refused as malformed even where standing is not read.
    ["a mandate whose standing is null, at a callee that reads no standing mandate, from T1", call("T1", { ...task({ capabilities: ["site.deploy"], effects: ["deploy"] }), standing: null }, { standing: undefined }), { ok: false, code: "decision-invalid", data: { detail: "mandate-malformed" } }],
    // AU-3: OA-7 strips source toward a target not listing operator-source/1; the digest leaves it out, so the token binds.
    ["a profile stated with source, delivered without it, from T2 under the stated prof", call("T2", p, { tokenProf: prof({ ...p, source: { project: "fabric-workspace", session: "a616cbcb" } }) }), taken(p)],
    // AU-4: a headless default naming the estate's capabilities by estateCapabilities, inside the boundary only.
    ["a headless default naming the estate's capabilities, from T1", call("T1", estateDefault), taken(estateDefault)],
    ["the same from T2 under its prof", call("T2", estateDefault, { tokenProf: prof(estateDefault) }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: capability", actionDigest: DIGEST } }],
    // DL-25: a caller placed in no tier is read as T2, so its token's prof binds the standing mandate too.
    ["a bound profile from a caller placed in no tier", call("T2", p, { tier: undefined, tokenProf: prof(p) }), taken(p)],
    // DL-17: from T2 an operator decision counts for nothing, so a bound profile beside one is still read.
    ["a bound profile beside an operator decision, from T2", call("T2", p, { tokenProf: prof(p), decision: { by: "operator", via: "relayed-instruction", action: "deploy-site", instruction: "deploy it", at: "2026-11-12T09:59:00Z" } }), taken(p)],
    // AU-5: no mandate of any kind sets a place's profile, a task's mandate included.
    ["a task's mandate naming autonomy.profile.set, from T1", call("T1", task({ capabilities: ["autonomy.profile.set"], effects: ["deploy"] }), { action: setProfile, effect: "deploy", standing: undefined }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: capability" } }],
    // AU-5: the bound reads the action id as well as the capability.
    ["a profile naming the action id autonomy.profile.set under another tool", call("T1", profile({}, { capabilities: ["hub.settings"], actions: ["autonomy.profile.set"], effects: ["deploy"] }), { action: settingsAction, effect: "deploy" }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: capability" } }],
    // AU-4: a headless place with no recorded profile: every capability of the estate's registered services, which the
    // hub lists by name, and every effect class but change-policy.
    ["a headless place's default profile covers a deploy", call("T1", headlessDefault), taken(headlessDefault)],
    // AU-3: from T2 the token binds the profile, not the chain; a narrowing in the chain binds while it is presented.
    ["a narrowing in the chain, presented from T2", call("T2", narrowed, { tokenProf: prof(narrowed) }), { ok: false, code: "operator-decision-required", data: { detail: "outside-mandate: effect", actionDigest: DIGEST } }],
    ["the same mandate with the narrowing stripped, from T2", call("T2", p, { tokenProf: prof(narrowed) }), taken(p, prof(narrowed))],
    // AU-3: a profile with no canonical form (a lone surrogate) has no digest.
    ["a profile whose instruction holds a lone surrogate", call("T1", profile({ instruction: "x\ud800y" })), { ok: false, code: "decision-invalid", data: { detail: "mandate-malformed" } }],
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
    ["a profile whose instruction holds a lone surrogate", profile({ instruction: "x\ud800y" }), ["FAC-SEM-144 "]],
    // AU-1: the hub states a profile by the operator of the place's estate; the setter's level is checked at the set.
    ["an administrator's profile", profile({ standing: { ...ORG_STANDING, setLevel: "admin" } }), []],
    ["a profile naming the estate's capabilities and listing some as well", profile({ standing: { ...STANDING, estateCapabilities: true } }), ["FAC-SEM-144 "]],
    ["a place recorded by an estate machine id holding a tilde", profile({ standing: { ...STANDING, place: "mac~studio-1" } }), []],
    ["a profile stated by a level", profile({ by: "level", level: "admin", org: "org:org-a", membership: { kind: "an attestation" } }), ["FAC-SEM-144 "]],
    // FAC-SEM-173 also reads a widened mandate's chain.
    ["a widened profile whose chain step names autonomy.profile.set", profile({ chain: [{ agent: RUNNER, at: "2026-11-12T09:00:05Z" }, { agent: SELF, at: "2026-11-12T09:30:00Z", scope: { capabilities: ["site.deploy", "autonomy.profile.set"], effects: ["deploy"] } }] }), ["FAC-SEM-144 ", "FAC-SEM-173 /chain/1/scope"]]
  ].map(([name, mandate, findings]) => ({ name, mandate, findings }));
}

export function profileVectors(): Json {
  return {
    about: "Vectors for a place's autonomy profile, a standing mandate (mandate/1 with standing, DEC-0166), written by tools/vectors/profile.ts, never by hand. actions: actionDecision's answer for each input (a service declaring standing passes standing: true; tokenProf is the prof claim of the call's verified delegation token, the sha256 of the RFC 8785 canonical JSON of the mandate without its chain and its source). documents: the codes and paths of evaluateSemanticRules(\"mandate\", mandate), in order.",
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
