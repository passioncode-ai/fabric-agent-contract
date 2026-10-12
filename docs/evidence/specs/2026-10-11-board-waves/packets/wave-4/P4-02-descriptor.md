# P4-02 — the descriptor for listings (V4-DESCRIPTOR)

- **Node:** N08 · **Wave:** 4 · **After:** P4-01 (both edit `schemas/service-descriptor.schema.json`) · **Closes:**
  V4-DESCRIPTOR.

## Sources

- The first organization server's target architecture v4 (commit `9c6a780`) §12's descriptor row: placement `peer`
  (endpoint, custody, residency, maximum data class), `installedBy`, `runner.credentialKind` checked, `lifecycle.manager`
  `node`. Cite it as wave 3 did; never name the server.
- Fabric (2026-10-12): it needs `installedBy` and `lifecycle.manager`; `runner.credentialKind` is the kind of a runner's
  sign-in, never a value. Fabric ADR-0139 (Fabric as a service: descriptor, well-known, read-only) and CO-263 (Fabric does
  not yet write its own descriptor; the button kit recognises Fabric by it). The rest is this repository's call.
- The organization edition's open/private split (J10): a data class is a property of the service, never of a person.

## What to build (one decision)

- `placement.peer {endpoint, custody, residency, maxDataClass}` for a remote placement offered to others: what each
  field means, its vocabulary (residency as ISO 3166-1 alpha-2 or a region list; data classes as the organization
  edition's names), and what a host refuses.
- `installedBy` (who installed it: a person's role, a node, an organization — never a name).
- `runner.credentialKind` as an enum checked against the runner catalogue (subscription, key, none, ...), and a rule
  that refuses a credential value in its place (the shared detector, `src/secret-shape.ts`).
- `lifecycle.manager: node` (P4-01's supervisor list).
- The usage report's shape for listings, if v4 asks for one, or a named open item.

## Proof

Fixtures per refusal; the positive sweep; consumer rows (Fabric writes its own descriptor, CO-263; Fabric Inbox's B-87
starts on landing). **On merge, the owner session tells Fabric Inbox's session (B-87) that the descriptor and the
usage-report shape for listings are fixed, with the commit.**
