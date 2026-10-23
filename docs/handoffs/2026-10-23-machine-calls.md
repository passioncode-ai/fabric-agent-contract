# 2026-10-23: calls between machines of one estate (DEC-0106)

## Objective

CT-85, S1 of the agent network: one person's machines calling each other's agents over the relay. The platform's A-6
(machine profiles) and A-7 (the call rule) on board thread `348467e5`, and the first organization server's question on
`ba63565c` item 4.

## Done

- **DEC-0106** and [machine calls](../specification/machine-calls.md): `machines[].profile` (`full`, `member`, `view`;
  absent is `full`; `FAC-SEM-134`), the T1 binding over the relay (`relayCallerTier`, `FAC-SEM-135`), the call rule
  (`machineCallVerdict`, refused `profile-forbids`, `FAC-SEM-136`), the sealed `fabric-agent-call/1`
  (`sealAgentCall`, `openAgentCall`), `relayCallerCredential` for the queue.
- Schemas `agent-call-sealed`, `agent-call-message`; `profile` in `estate-record`; `profile-forbids` in
  `delegation-refusal` and `REFUSAL_CODES`; `fabric-agent-call/1` in the protocol register.
- Vectors `fixtures/vectors/machine-call.json` by `tools/vectors/machine-call.ts` (profile, caller, verdict, open, seal);
  semantic fixtures `estate-profile-*`, `machine-call-*`, `machine-caller-*`; positive and negative `agent-call-*`.
- Docs: delegation (DL-11 amended, DL-19 row, DL-25 T1 row, Not decided), relay, interop C3.5, estate record,
  ceremonies (Change a machine's profile), agent network, conformance (three rows, register to `FAC-SEM-137`),
  versioning, README, DOCMAP, CONTEXT; UX JTBD-13, JRN-12, ST-030, ST-031, FLW-25, FLW-26, SCN-036, SCN-037.
- Backlog: CT-85 done; CT-110 (adoption) and CT-111 (`relayAdmissionSet` throws on a revision that is no primitive)
  filed.

## Decisions taken here, for the platform to confirm

- A T1 call needs no token (DL-26); A-7's "carries the hub's token" is read as "carries it when the hub minted one".
- The caller's `view` profile is checked as well as the target's.
- The code is `profile-forbids`, kebab-case like every DL-19 code.

## Open

- Consumers move at their next pin (CT-110): Fabric's hub and nodes, Fabric Dashboards, the first organization
  server's vendored schema. The hub writes no `profile` until its readers are pinned at or after DEC-0106.
- The two-Mac test of S1 needs the relay deployed (RLY-05, RLY-07).

## Readings

Round 1: unit one break (a plaintext with a byte-order mark opened), seam one break (`pnpm validate` could not tell
the two new schemas apart: the protocol sits in `type`), product four breaks (a machine without `#kem` "can be
called", answers to refusals the node cannot seal, two readers missing from the rollout gate, interop C3.5's
"only in headers"); all fixed with their risks.
Round 2: unit and seam pass, their risks fixed (a `#kem` kid listed under another machine, a lone surrogate, the
node's order named a duty, relay.md's T2); product three breaks (an em dash in SCR-23, ST-030 and relay.md still
admitting a T2 sender with a token, "a view machine runs no agent"), fixed with its risks (the idempotency key, the
rollout signal, the hub before a profile change, the window with no hub).

## Checks actually run

`pnpm run check` and `pnpm vectors:check` (output in the pull request).

## Next task

CT-89 (the hub moved to another machine, passkey recovery), due 2026-11-05, then CT-86 (credentials on request, the
call record), due 2026-11-07.
