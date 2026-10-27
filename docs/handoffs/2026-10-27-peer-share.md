# 2026-10-27: a credential shared with another person, and a secret request (CT-178, DEC-0142, DEC-0143)

## Objective

Answer Project Observatory's three asks (board request `c50f590b`, thread `faa32585`, due 2026-11-05; its design
`docs/design/PERSON-SURFACES.md` at `b0bb0abd`, D2, D3, D4, D8): a person-to-person share profile, a local-channel
method for secret requests, and a single-person cloud service. Observatory answered (reply `1623e11f`, 2026-10-27)
that the share works between two personal estates with no organization, from the first version.

## Done

- DEC-0142, [peer share](../specification/peer-share.md) PS-1 to PS-10: `fabric-peer-share/1`, a key pair per share on
  each side, the link and its pin, the claim MAC as a filter only, DEC-0084's comparison code under its own types with
  one attempt per link (`peerExchangeVerdict`), the envelope and the usage report under DEC-0111's construction with
  their own `info`, taking back in three steps, the mailbox's rules. No context kind `share:`: a share is held apart
  from every context's vault (PS-3). The cloud's HTTP routes and name stay the product's (PS-10): the third ask is
  answered by PS-10, not by a protocol of its own.
- `src/peer-share.ts`; schemas `peer-share-frame`, `peer-share-envelope`, `peer-share-report`, `peer-share-record`;
  `fixtures/vectors/peer-share.json` (written by `tools/vectors/peer-share.ts`, which imports nothing of
  `src/peer-share.ts`), `test/peer-share.test.ts`; four positive and four negative fixtures, and `fixtures/positive/local-channel-secret-cancel.json`, with their rows in
  `fixtures/catalogue.json`; `src/peer-share.ts` under a coverage floor.
- DEC-0143, [local channel](../specification/local-channel.md#secret-requests) SP-1 to SP-7: `secret.prompt`,
  `secret.cancel`, the `secret.ui` capability accepted only after the node's own signed-app check (macOS and Windows;
  none on Linux, CT-184), `secretOutcome`; `src/local-channel.ts`, `schemas/local-channel.schema.json`,
  `test/local-channel.test.ts`; `fixtures/vectors/local-channel.json` (written by `tools/vectors/local-channel.ts`).
- `humanStep: comparison`: `src/actions.ts`, `schemas/service-actions-extension.schema.json`,
  `schemas/delegation-refusal.schema.json`, `tools/vectors/actions.ts` and `fixtures/vectors/actions.json` (one case,
  one declaration); `src/protocol-revisions.ts` and its test, `tools/vectors/run.ts`, `test/positive-sweep.test.ts`,
  `test/schema-compilation.test.ts`, `vitest.config.ts`.
- The handoff's row in `docs/handoffs/README.md`.
- `contexts.md`, `versioning.md`, `conformance.md` (five rows), the specification README, `DOCMAP.md`, `CONTEXT.md`;
  `docs/ux` JTBD-15, JRN-14, ST-035, ST-037, ST-039, ST-040, FLW-33, FLW-34, SCR-33, SCR-34, SCN-052, SCN-053; `service.md` AP-4, `delegation.md` (DL-26, the refusal table, MD-6, OA-5) and `interop.md` for
  `humanStep: comparison`; DEC-0075, DEC-0084, DEC-0086, DEC-0111, DEC-0121 and DEC-0128 annotated; CT-178 closed on merge; CT-184, CT-185, CT-186 (adoption) and CT-187 filed.

## Open

After merge (2026-10-27): #218 merged as `759704b4` after thirteen rounds of readings, the last two clean, and released as [`v0.1.0+2026-10-27.3`](https://github.com/passioncode-ai/fabric-agent-contract/releases/tag/v0.1.0%2B2026-10-27.3); the tag and the changes since its acceptance went to Observatory on thread `faa32585` (reply `f9dac514`); the adapter, Fabric Dashboards and Fabric were asked to re-pin on thread `ba94b8f5`; the risks of rounds 12 and 13 are CT-189. The list below is the state before merge, kept as written.

- Readings until two clean rounds in a row; merge; release; answer Observatory on thread `faa32585` (request
  `c50f590b`) with the two decision ids and the tag, and what its engine adopts at its next pin, the whole list being
  backlog row CT-186: replace `observatory-share-envelope/1` with the whole `fabric-peer-share/1` profile (per-share
  keys, the link and its pin, every claim counting, the three-step take-back), the mailbox running `peerExchangeVerdict`
  until the first envelope is stored, carrying a burning frame to both nodes and refusing the upload of a burnt share,
  the sender's node warning of a claim or abort after a share stored without comparing, human steps linking to the
  node's page, its vault's slot names (`[A-Z_][A-Z0-9_]{0,127}`) against the contract's `^[A-Z][A-Z0-9_]{0,63}$`, and
  `local-channel.json`'s `prompts` section, which checks its validator; its OBS-260 `prompt_view` does not conform
  today, which only a producer-side test catches (one that validates `prompt_view(record)` against the vendored
  `$defs/secretPrompt` for a record with no provider, one with a filled slot, and names at the patterns' edges; its
  `test_secret_prompt.py` assertion on `lastChange` flips with it); symmetric commit-reveal and a five-byte code in
  place of its asymmetric four-byte one, the RFC 8785 transcript and claim MAC, the ceilings (claim deadline 7 days, lease
  24 hours, envelope 90 days), no report nonce, mailbox requests signed under DEC-0056's RFC 9421 subset with the share
  keys, and `secret.prompt` with the broker launching its app (SP-3). Tell it
  that DEC-0143 admits no `secret.ui` client on Linux (CT-184), where its D4 had the Tauri window, and that the mailbox's
  routes stay its own (CT-185), that a share is no `share:` context (PS-3), that its job sees five outcomes (SP-5), and
  that the comparison and "Store" are DEC-0121 human gates (`humanStep: comparison`, a new value, and `secret`),
  declared only after the readers below re-pin; that it vendors `local-channel.json` as well as `peer-share.json`;
  that its OBS-260 branch (its PR #378) differs from DEC-0143 in six points to fix before it ships (`secretPrompt`
  carries no `lastChange` and leaves `provider` out rather than null; no desktop answers `no-client`; a withdrawn
  request reads `no-answer`, never a sixth outcome `cancelled`; `stored` counts a write after the prompt, not after
  filing; its provider names follow `common.schema.json#/$defs/slug`, as the prompt and the share envelope read them; an
  answer at the deadline counts, as `local-channel.json` pins); and that until CT-187 is decided a recipient's metered agent cannot use a share.
- Ask the Fabric Agent Adapter (its kits' `HUMAN_STEPS`, the 67-case and 11-declaration asserts, the test-side
  `HUMAN_STEPS` copies in its delegation tests, its register port's six new entries and its two reference docs that
  list six steps) and Fabric Dashboards (its actions reader's `STEPS`, against the new declaration vector) to re-pin
  at or after DEC-0142 before Observatory declares `comparison` (CT-186). Fabric's hub reads no action declaration
  today and forwards `human-step-required` unchanged, so it gates nothing; whichever reader CT-125 adds passes the
  declaration vector "a human comparison of codes, a step DEC-0142 added".
- After merge: the knowledge base's products and plans rows for the new revisions (`fabric-workspace/knowledge/`),
  then `node scripts/workspace.mjs sync` or the scheduled sync.
- The UX artefacts reference ids SCN-052, SCN-053, SCR-33 and SCR-34 because SCN-050, SCN-051 and SCR-32 are taken on
  the branches of DEC-0138 and DEC-0140; whichever merges later keeps them.

## Checks actually run

The specification README's "no released consumer runs a session yet" rests on the round-1 and round-2 seam readings:
`git grep` for `channel.hello`, `consent.ui` and `secret.ui` at Project Observatory v0.29.2, Fabric v0.3.14, Fabric
Dashboards v0.8.8, Fabric Switchboard v0.6.83 and the Fabric Agent Adapter v0.52.0 found no session client or
server.

`pnpm typecheck`, vitest with coverage written to the session scratchpad (every floor met), `pnpm ux:lint`,
`pnpm docs:check`, `pnpm privacy:check`, `pnpm vectors:check`, no U+2014 in the added prose (one `#region` code marker, the repository's convention).

## Next task

Three blind readings (unit, seam, product) of the branch head; fix or file what they find; two clean rounds; merge.
