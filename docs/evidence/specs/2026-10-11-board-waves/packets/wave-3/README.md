# Wave 3 packets — the organization edition's first contracts, activity and devices

Wave 3 of the [plan](../../plan.md): nodes N17 and N07 of the [canvas](../../canvas.md). The rules are
[wave 2's](../wave-2/README.md) and [wave 1's](../wave-1/README.md#rules-every-packet-follows). These are added:

- **The organization edition's design is a proposal to this repository.** The target architecture v4 of the first
  organization server says each module's part is a proposal to that module's owner, and this repository's owner
  session accepted its §12 contract set into this plan. Read it read-only:
  `git -C <workspace>/the first organization server's repository show origin/main:docs/design/2026-10-12-target-architecture.md`
  (§3 nouns, §6 paths, §7 authority, §12 contract changes, §15 decisions). Cite it in this public repository as *the
  first organization server's target architecture v4* with its commit. Name neither the server nor its repository, as
  CON-OE-04 asks.
- **Nothing about assessing people lands here** (J10). Before writing, check every field against the organization
  edition's open/private split: fabric-workspace
  `docs/reports/2026-10-07-wave1-open-private-split/README.md`.
- **Signing algorithms follow Fabric.** ES256 beside EdDSA is Fabric's decision D2 (ADR-0144). Until Fabric records it,
  a new signed document names its algorithm in a field and admits EdDSA. Every Ed25519 key passes
  `src/ed25519.ts` `isSmallOrderKey` (DEC-0045, CT-29). Every signed or hashed JSON uses a form from the canonical-forms
  register (DEC-0043, `conformance.md#canonical-forms`): RFC 8785 for anything new.

| Packet | Node | Owns | Order |
|---|---|---|---|
| [P3-01 agent package](P3-01-agent-package.md) | N17 | `schemas/fabric-package.schema.json` (new), `docs/specification/package.md` (new), `src/package-rules.ts` (new), the `agentRef` rule | first; parallel with P3-02 |
| [P3-02 activity and devices](P3-02-activity-devices.md) | N07 | `activity.md`, `devices.md`, the activity and device schemas, `src/activity-rules.ts`, `src/device-rules.ts`, `src/settings-backup.ts` (CT-25 only) | parallel with P3-01 |
| [P3-03 estate record](P3-03-estate-record.md) | N17 | `schemas/estate-record.schema.json` (new), its spec section, rules | after P3-01 and P3-02 (it references packages and device keys) |
