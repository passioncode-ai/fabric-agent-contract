# P4-05 — window leases and signing challenges

- **Node:** N18 · **Wave:** 4 · **After:** #53 (DEC-0047, the relay) merges · **Closes:** V4-WINDOW-LEASE,
  V4-SIGNING-CHALLENGE.

## Sources

- The first organization server's target architecture v4 (commit `9c6a780`): §6 (the estate record sets a static split
  of each estate window per machine, re-split by the hub when it is awake; a lease), §7 (signing challenges over JCS, the
  dedicated signing RP), §12's rows.
- DEC-0053's check-in `records.leases` (`leaseId`, `expiresAt`), whose shape it names as the window lease's own
  decision; DEC-0055's challenge type `estate-revision/1` (`estateChallenge`), which this decision adopts or replaces.
- The meter's spend windows (DEC-0037, DEC-0045, CT-20): a lease is a share of a window the meter enforces offline.

## What to build (one decision each, or one with two parts)

1. **`window-lease/1`:** the document a hub signs to give a machine a share of an estate window (window, amount, unit,
   `expiresAt`, the machine, the estate revision it follows), how the meter on that machine spends against it offline,
   what happens at expiry and at re-split, and the check-in's `records.leases` shape. Coordinate with Project
   Observatory's session (the meter) before writing; it owns the enforcement.
2. **Signing challenges:** a register of challenge types, each SHA-256 over RFC 8785 of `{type, ...}`, starting with
   `estate-revision/1` (DEC-0055) and the package countersignature's (DEC-0051), and the dedicated signing RP
   (`sign.<domain>`, never the sign-in credential) as a contract.

## Proof

Fixtures and vectors; the canonical-forms register; consumer rows (Fabric's hub signs leases and runs ceremonies;
Project Observatory's meter spends against leases).
