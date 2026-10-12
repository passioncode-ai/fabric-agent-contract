# P3-01 — the agent package, `fabric-package/1`

- **Node:** N17 · **Wave:** 3, first · **Closes:** V4-PACKAGE, V4-AGENTREF (inventory) and CON-OE-03's package part
  (SK-02a)

## Sources

- The first organization server's target architecture v4, §12. Its `fabric-package/1` row lists: the manifest; a
  service template; `secrets[]`; `requires`; `costPresets`; a result signal; `state[]`; an evals receipt; vendored
  dependencies; a digest; an ES256 publisher signature; an organization countersignature (a passkey assertion). See
  also §3's "Agent package" noun, §6's paths (pack, change, move: `state[]` decides what moves) and §7.
- The organization edition's agent-network design for `fabric-package/1` — CON-OE-03 in the owed-decisions finding,
  [findings/owed-decisions.json](../../findings/owed-decisions.json). It names these fields: `schema`, `kind`, `id`
  (a scoped reverse name that equals the plugin name), `version`, `layer`, `publisher`, `licence`, `runners`, `skills`,
  `allowedToolsCeiling`, `requires {servers, packages}`, `evals`, `listingChars`, `digest`. Reconcile the two lists:
  v4 is the later text and wins where they conflict, and the decision says where.
- The adapter writes packages (v4 Stage 0: "adapter writes effects and `costPresets`"; Stage 1: `new/test/pack`).
  Read the adapter's current pack format, if any, read-only:
  `git -C <workspace>/fabric-agent-adapter grep -n -i "costPresets\|fabric.package" origin/main`.
- Fabric ADR-0138 (digests per version: packaged, shared, published, revoked), read-only, from Fabric `main`.

## What to build — two decisions, one PR

1. **Format and digest** (one DEC):
   - `schemas/fabric-package.schema.json` and `docs/specification/package.md`, with every v4 field typed;
   - `secrets[]` as named references only, never values (DEC-0013); `costPresets` in the shape DEC-0037's spend
     policy reads, so a project's L1 options compute from it;
   - the result signal, the event that says the agent's result is met (v4 §6), named so the meter's receipts and
     Fabric's results can join on it;
   - `state[]`, what moves when a placement moves;
   - the digest: SHA-256 over RFC 8785 of the package without its signatures (DEC-0043); add the row to the
     canonical-forms register;
   - fixtures and a rule file `src/package-rules.ts`.
2. **Signatures** (a second DEC):
   - a publisher signature and an organization countersignature over the digest, each naming its algorithm (`EdDSA`
     today; `ES256` when Fabric's D2 lands — say so);
   - the publisher's key passes the small-order check (DEC-0045);
   - verification functions in `src/` with tests and planted defects, and vectors in `fixtures/vectors/` that the
     adapter's ports can run.
3. **`agentRef`**: the rule v4 §12 lists. It is how a placement names an agent across versions (§6 "same `agentRef`").
   Define it with the package and add a rule.

## Proof

A fixture per refusal (a secret value instead of a reference, a digest mismatch, a bad signature, a small-order
publisher key, an unknown algorithm). Plant each rule removed. The positive sweep maps the new schema. Raise floors.
The handoff names the adapter's and Fabric's next pins.
