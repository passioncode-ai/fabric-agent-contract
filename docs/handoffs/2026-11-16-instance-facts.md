# Handoff 2026-11-16: DEC-0173, instance facts (CT-321)

**Objective.** Decide and ship what a host may show of one instance: who it serves, how it keeps data apart and the
OS space it runs in (Fabric Dashboards' request `5da92f65`, FD-273, relaying the operator's ask `d660cc30`).

**Done.**
- DEC-0173 accepted: the extension `instance-facts/0.1` (`EXTENSION_KEYS.instanceFacts`, protocol
  `fabric-instance-facts/0.1`, schema `schemas/service-instance-facts-extension.schema.json`), the reference reading
  [`instanceFacts`](../../src/instance-facts.ts) (field by field, the well-known document first, a refused value never
  read, a foreign well-known document giving nothing, `entry` from a host login only for a service that declares a
  fact) and `FAC-SEM-180` on the descriptor, the well-known document and the pair.
- Vectors `fixtures/vectors/instance-facts.json` (34 cases), fixtures, [service](../specification/service.md#instance-facts)
  *Instance facts*, conformance rows, CONTEXT, the index row, and the details panel: ST-045, FLW-36, SCR-36, SCN-065.
- Blind readings (unit, seam, product): rounds 1, 2 and 4 folded, round 3 clean, rounds 5 and 6 clean at one head.
- Filed: CT-327 (the readings' risks).

**Checks run.** `pnpm run check` exit 0 on the landing commit (see the PR).

**Decisions.** Whose instance stays the placement's `context` (DEC-0082 item 4), never a member of the facts; a
dashboard's login alone declares nothing; a label stays out of a local well-known document.

**Open.**
- Fabric Dashboards adopts it under FD-273 (told on thread `589abe7e`: its `agent-facts.ts` entry rule and FD-273's row
  predate the DEC); Prowl Agent declares first; the adapter kits' `PROTOCOL_REVISIONS` gain the protocol at their next
  repin.
- CT-325 (the adapter's six secret shapes): waiting for the adapter's exact forms (`b63a1c30`), due 2026-11-22.
- CT-327, CT-326, CT-324, CT-317 (1) to (4), CT-322's normative items, CT-323's remaining items.

**Next task.** The fixes wave for CT-327 (one `serviceKey` helper first), then CT-325 when the adapter answers.
