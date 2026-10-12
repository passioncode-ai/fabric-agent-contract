# P2-04 — runner and model profiles

- **Node:** N14 · **Wave:** 2 · **After:** P2-03 (shares `spend-policy.md`) · **Closes:** CT-05

## Sources

- Fabric ADR-0147 at `31a9d6ca`, on Fabric's branch `agent/release-040-wave2`, not yet on main:
  `docs/adr/0147-runner-and-model-profiles-one-catalogue-named-profiles-one-resolution-order.md`. Read it with
  `git -C <workspace>/fabric show 31a9d6ca:<path>` and pin every link at that commit (or at its merge commit
  if it has reached main by then).
- The private proposal *Runner and model profiles* (2026-10-11, commit `9f05a3f`), §3.2 items 1–7. It lives in a
  private repository of the operator's: cite it in this public repository **by title and commit only — no
  repository name, URL or path**. Fabric's ADR carries its content; work from the ADR.
- Fabric's rulings over the proposal (recorded in [brief.md](../../brief.md)):
  - the runner catalogue stays Fabric's `registry/runners.json`, which `shared/agents.ts` checks against;
  - Fabric publishes `registry/models.json` and `registry/model-profiles.json`;
  - a `subscription` route runs only in its vendor's runner;
  - an empty intersection with L1's model classes refuses the launch, naming the policy;
  - on key routes the model allow-list is the profile's id.
- Inputs from the requesters ([CT-05 on the board](../../../../../backlog.md)): each model catalogue row MAY carry
  a `provider` routing object in OpenRouter's provider-routing shape:
  - `ignore`, `order` (provider slugs), `allow_fallbacks` (boolean), `sort` (`price` | `throughput` | `latency`);
  - the proxy applies it on a key route, and the model allow-list does not change it;
  - measured: `sort: price` cut a pair of 30k-token requests from $0.047 to $0.0052;
  - an estate default of `sort: price` is proposed. The default is Fabric's call as the catalogue's publisher, so
    write it as a recommendation unless ADR-0147 decides it.

## What to build (one decision; reserve the DEC id and the rule codes)

1. A `modelClasses` vocabulary. DEC-0037 left the classes free strings; the vocabulary closes them, and the
   catalogue maps model ids to classes.
2. Schemas `registry-models`, `model-profile` and `runner-profile`, with fixtures (the proposal's §2 measured
   models are good positive fixtures).
3. A runner profile's route, `subscription | key`, and a rule that a subscription runs only in its vendor's runner.
4. Headless drives `pi-json`, `opencode-json` and `kimi-stream-json`, and the shared kind name `pi` in
   `runners.md`. Update `session-handoff.schema.json`'s runtime enum and its test, which ties it to `runners.md`.
5. Precedence: the provider chooses within the project's allowed classes (resolves `profiles.md:60` against L1);
   request > agent > binding/L1 > estate default; an empty intersection refuses, naming the policy.
6. A service's well-known or capability declares its config slots and the resolved profile, read-only. The usage
   report carries the route.
7. Issued keys carry the profile's model allow-list (the profile id on key routes).
8. The `provider` routing object, as above.

## Proof

- A fixture per refusal: a subscription outside its vendor's runner, an empty class intersection, an unknown
  class, a bad `sort`. Plant each rule removed and watch a fixture fail.
- The positive-fixture sweep covers the new schemas (map them in `test/positive-sweep.test.ts`).
- Handoff: Fabric publishes the registries; the adapter's kits read the profile; Observatory meters by route.

## Files you own

`docs/specification/runners.md`, `profiles.md` (the precedence line), `spend-policy.md` (`modelClasses`), the new
schemas, `service-usage.schema.json` (route), `session-handoff.schema.json` (runtime enum),
`src/registry-rules.ts` or a new `src/profile-rules.ts`, tests, fixtures, `docs/DECISIONS.md` and
`conformance.md` (leases), one handoff.
