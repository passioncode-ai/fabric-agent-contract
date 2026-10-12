# Handoff — device transport and keys (DEC-0056, board run wave 4, P4-04; DEV-HTTPSIG, DEV-KEY-ROLES, DEV-CHECKIN-DIGEST)

## Objective

Close packet [P4-04](../evidence/specs/2026-10-11-board-waves/packets/wave-4/P4-04-device-transport.md) of node N18 of
the [board run](../evidence/specs/2026-10-11-board-waves/canvas.md): an HTTP message signature on every device request
beside mutual TLS (the binding agreed with the first organization server, its ADR-0007 amended 2026-10-12 at its commit
`7a47447`), device-key roles counted at enrollment, and the estate revision's digest in the check-in.

## Done

- **DEC-0056** in [`docs/DECISIONS.md`](../DECISIONS.md), reserved by git CAS
  (`reserve --key w4-p4-04-device-transport-20261012 DEC`); rule code **FAC-SEM-077** `device-request-signature`
  (receipt SEM-0077, `--key w4-p4-04-sem-request-signature-20261012 SEM`). DEC-0031 and DEC-0053 carry an *Annotated*
  line. The three guarded registers (`docs/DECISIONS.md`, `docs/specification/conformance.md`, `docs/backlog.md`) travelled
  as a patch while another run held their leases (the agent-sync guard refuses a guarded commit without a lease); the
  owner applied it under its leases on 2026-10-12 and deleted it in the same commit.
- The three-tier review (unit, seam, product), one fix round and a confirming reading, then the owner's merge.

## Next task

Done by the owner: the registers applied under its leases, the branch merged with `main`, markers `DEC-0060` and
`FAC-SEM-081`. Next: add the relay cross-reference (devices.md#transport ↔ relay.md#blobs), mark DEV-HTTPSIG,
DEV-KEY-ROLES and DEV-CHECKIN-DIGEST done at the wave-4 close, and send the first organization server the merge commit
to run `fixtures/vectors/http-signature.json` (CT-04).
