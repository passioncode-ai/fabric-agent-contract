# P3-02 — activity and devices, hardened and amended together

- **Node:** N07 · **Wave:** 3 · **Closes:** F-B-101…F-B-114, CON-OE-01, CON-OE-12, V4-RUN-RESULT, V4-DEVICE, CT-25.
  OQ-0010 stays deferred: its answer comes with the first organization server's VES-03. Read every receipt in
  [inventory.json](../../inventory.json) and each CON-OE packet's `must_define` in
  [findings/owed-decisions.json](../../findings/owed-decisions.json).

## Why one packet

These items all amend DEC-0030 (activity) and DEC-0031 (devices) and their two rule files, so they are designed
together: separately, they would be the intermediate state the plan forbids.

## What to build

One decision is acceptable; two (activity, devices) are fine if the text is clearer. Reserve each id.

1. **The audit's fixes**, each with a test that fails without it:
   - ten device branches and four activity clauses that no test killed (F-B-101, F-B-102);
   - `devices.md`'s `sha256:` hashed branch becomes `hmac-sha256:` (F-B-103);
   - path-free `detail` and `error` fields (F-B-104);
   - FAC-SEM-044 checks the signed-in user (F-B-105);
   - policy-key validity judged at verification against the current key set, not at the signer's `issuedAt`
     (F-B-106; the decision states it);
   - F-B-107…F-B-114 as their receipts say.

   Raise `device-rules.ts` and `activity-rules.ts` toward 100 % branch coverage.
2. **CON-OE-01:**
   - `account.class` and `account.tenantRef`;
   - `policy.violation` by UTC day (a time finer than a day is refused);
   - `noticeVersion` in the policy;
   - neutral `notice.acknowledgement` and `consent` messages (the storage of consent records is private and never
     here);
   - `purposeId` on access-log entries;
   - posture `re_enrolled`;
   - OD-1 in neutral form: per-person usage only as sums per day or billing period;
   - DEC-0030 item 10 marked as narrowed.
3. **CON-OE-12:**
   - `accounts.tenants[]`;
   - `models.credentials[]`, organization API keys only;
   - `models.personalKeySharing`, where absent means forbidden;
   - `workspace.folders` and `machine.mode`;
   - `collectionStart` and `expiresAt` (after expiry, locks stay and grants stop);
   - a key set counter-signed by the offline root, with TUF pinned in the source ledger;
   - `build_channel` defaulting to official for an organization.
4. **v4 (the first organization server's target architecture, §12):**
   - DEC-0030: a `result` kind and a root `run` on receipts, with no person dimension added;
   - DEC-0031: `platform-keystore` device keys, an `ES256` form for `policyRootKey` (admitted beside Ed25519; Fabric's
     D2 covers delegation, not device policy, so this decision is the contract's own — say so), and a check-in that
     carries the estate-record revision, the heartbeat, the revocation delta's head and the leases. Fields only: the
     delta and the leases themselves are the relay protocol's (DEC-0047, reserved).
5. **CT-25:** the settings form refuses a lone surrogate in every input instead of writing `\udxxx`. Make the
   activity rule tolerant, so it refuses the event rather than throws, and update the vectors and the register row.

## Proof

- A fixture per refusal.
- The canonical-forms register and the vectors are updated if a form's behaviour changes (CT-25).
- J10 checked: nothing that assesses a person.
- Consumer rows on the board name what the collector, the organization server and Observatory adopt.
