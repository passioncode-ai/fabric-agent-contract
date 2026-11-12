# run: CT-250 DEC (DEC-0162), authority levels

- stage: 1 (build), full flow; model Opus 5.5; brief = docs/evidence/plans/2026-11-12-ct250-authority-levels.md
- ids: DEC-0162, FAC-SEM-169 (org-membership/2 shape), FAC-SEM-170 (level decision and level mandate coherence)
- operator-question defaults taken (design section "Questions for the operator").
- deviation from the design, recorded in the DEC: `projects` is always present in org-membership/2 (`[]` unless architect),
  since OM-1 and the signing register keep every member present.

## REQ

- R1 org-membership/2 schema, register, verifier (LV-1); /1 reader refuses /2 (malformed).
- R2 decision.schema level form (LV-3); actionDecision reads it (LV-4, LV-5, LV-6 relayed + T2 approval, LV-10, LV-11).
- R3 mandate/1 by:"level" (LV-6), mandateCovers at T2 when bound.
- R4 delegation-token `mem` claim (LV-5).
- R5 FAC-SEM-169, FAC-SEM-170; vectors fixtures/vectors/levels.json.
- R6 pages: membership, service AP-2/AP-4, delegation DL-17/18/26 MD-3/5/6, governance, conformance; DEC, backlog, handoff.
