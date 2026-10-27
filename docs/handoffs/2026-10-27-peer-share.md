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
  `src/peer-share.ts`), `test/peer-share.test.ts`; four positive and four negative fixtures; `src/peer-share.ts` under a coverage floor.
- DEC-0143, [local channel](../specification/local-channel.md#secret-requests) SP-1 to SP-7: `secret.prompt`,
  `secret.cancel`, the `secret.ui` capability accepted only after the node's own signed-app check (macOS and Windows;
  none on Linux, CT-184), `secretOutcome`; `src/local-channel.ts`, `schemas/local-channel.schema.json`,
  `test/local-channel.test.ts`.
- `contexts.md`, `versioning.md`, `conformance.md` (four rows), the specification README, `DOCMAP.md`, `CONTEXT.md`;
  `docs/ux` JTBD-15, JRN-14, ST-039, ST-040, FLW-33, FLW-34, SCR-33, SCR-34, SCN-052, SCN-053; DEC-0075, DEC-0084,
  DEC-0086, DEC-0111 and DEC-0128 annotated; CT-178 closed on merge; CT-184, CT-185 and CT-186 (adoption) filed.

## Open

- Readings until two clean rounds in a row; merge; release; answer Observatory on thread `faa32585` (request
  `c50f590b`) with the two decision ids and the tag, and what its engine adopts at its next pin: replace
  `observatory-share-envelope/1` with `fabric-peer-share-envelope/1`, symmetric commit-reveal and a five-byte code in
  place of its asymmetric four-byte one, the RFC 8785 transcript and claim MAC, the ceilings (claim deadline 7 days, lease
  24 hours, envelope 90 days), no report nonce, and `secret.prompt` with the broker launching its app (SP-3). Tell it
  that DEC-0143 admits no `secret.ui` client on Linux (CT-184), where its D4 had the Tauri window, and that the mailbox's
  routes stay its own (CT-185).
- The UX artefacts reference ids SCN-052, SCN-053, SCR-33 and SCR-34 because SCN-050, SCN-051 and SCR-32 are taken on
  the branches of DEC-0138 and DEC-0140; whichever merges later keeps them.

## Checks actually run

`pnpm typecheck`, vitest with coverage written to the session scratchpad (every floor met), `pnpm ux:lint`,
`pnpm docs:check`, `pnpm privacy:check`, `pnpm vectors:check`, no U+2014 in the added lines.

## Next task

Three blind readings (unit, seam, product) of the branch head; fix or file what they find; two clean rounds; merge.
