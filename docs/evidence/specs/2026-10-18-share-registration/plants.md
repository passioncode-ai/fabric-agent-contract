# Plants: share registrations (CT-56, DEC-0086)

Each refusal clause of `src/share-registration.ts`, each SR and GJ row, `FAC-SEM-117`, `FAC-SEM-118`, the amended
`FAC-SEM-045` clause in `src/device-rules.ts`, the `FAC-SEM-117` call in `src/context-rules.ts` and the schema clauses
of `share-registration.schema.json`, `common.schema.json` (`shareGrantId`, `orgContextId`) and `grantUsage` were removed
or loosened once, one at a time, and the focused tests were run (`vitest run --bail=1 test/share-registration.test.ts
test/contexts.test.ts test/device-rules.test.ts test/fixtures.test.ts`). A plant is killed when that run fails. The
file was restored after each plant; the worktree was clean at the end of the pass.

94 plants; 92 killed on the first pass, 2 survived and were closed with tests:

- **P-05, `orgContextId` admits 130 characters:** no test named the 128-character bound of an organization's id. The
  test "reads an organization's context exactly as the schema does" now checks a 128-character id (accepted) and a
  129-character one (refused) through `isOrgContext` and the schema. Re-planted: killed.
- **P-11, the registration's `type` not checked by `registrationWellFormed`:** `decideShareRegistration` answers another
  string `type` at SR-2 first, so only a non-string `type` reached the clause, and no case had one. The mutations "a
  numeric type" and "a null type" and the test "reads a registration of another revision as no registration" now
  reach it. Re-planted: killed.

| Plant | What was removed or loosened | Result |
|---|---|---|
| P-01 | shareGrantId admits all zeros | killed |
| P-02 | shareGrantId admits upper-case hex | killed |
| P-03 | shareGrantId with the m flag admits a trailing newline | killed |
| P-04 | shareGrantId case-insensitive | killed |
| P-05 | orgContextId admits 130 characters | survived the first pass; killed after the test named above |
| P-06 | orgContextId admits a dot | killed |
| P-07 | agentRef length unbounded | killed |
| P-08 | instants admit nine fraction digits | killed |
| P-09 | instants read without the strict reader | killed |
| P-10 | revision 0 admitted | killed |
| P-11 | registration type not checked | survived the first pass; killed after the test named above |
| P-12 | registration grantId not checked | killed |
| P-13 | registration context not checked | killed |
| P-14 | active members not exact | killed |
| P-15 | active revision not checked | killed |
| P-16 | active agentRef not checked | killed |
| P-17 | active empty window admitted | killed |
| P-18 | withdrawn members not exact | killed |
| P-19 | withdrawnAt not read | killed |
| P-20 | latest revokedAt kept | killed |
| P-21 | revocation ref compared as written | killed |
| P-22 | orgId not a context | killed |
| P-23 | revocations of any kind withdraw | killed |
| P-24 | placements of every context counted | killed |
| P-25 | unreadable registrations emitted | killed |
| P-26 | grants of every context registered | killed |
| P-27 | legacy ids registered | killed |
| P-28 | a grant listed twice registers twice | killed |
| P-29 | revocations ignored | killed |
| P-30 | placement grant compared as written | killed |
| P-31 | two agentRefs registered | killed |
| P-32 | an agentRef that is no agentRef registered | killed |
| P-33 | a listed grant also withdrawn | killed |
| P-34 | dropped grant withdrawn at issuedAt even when revoked | killed |
| P-35 | non-share ids withdrawn | killed |
| P-36 | held digest not checked | killed |
| P-37 | half tombstone held | killed |
| P-38 | duplicate held keys admitted | killed |
| P-39 | empty user admitted | killed |
| P-40 | binding org not checked | killed |
| P-41 | SR-1 any code is 401 | killed |
| P-42 | SR-0 step-0 faults not passed through | killed |
| P-43 | SR-0 missing transport accepted | killed |
| P-44 | SR-2 removed | killed |
| P-45 | SR-3 removed | killed |
| P-46 | SR-4 case-folded | killed |
| P-47 | SR-4 by prefix | killed |
| P-48 | SR-4 removed | killed |
| P-49 | SR-5 removed | killed |
| P-50 | SR keyed by grantId only | killed |
| P-51 | SR-6 removed | killed |
| P-52 | SR-7 removed | killed |
| P-53 | SR-8 removed | killed |
| P-54 | SR-9 removed | killed |
| P-55 | SR-10 redelivery registered | killed |
| P-56 | SR-10 later withdrawal kept | killed |
| P-57 | SR-10 second withdrawal taken as new | killed |
| P-58 | SR-11 withdrawal drops the agent | killed |
| P-59 | GJ-0 held list not checked | killed |
| P-60 | GJ-0 kind not checked | killed |
| P-61 | GJ-0 day not checked | killed |
| P-62 | GJ-0 day existence not checked | killed |
| P-63 | GJ-0 grant id not checked | killed |
| P-64 | GJ-0 context form not checked | killed |
| P-65 | GJ-1 removed | killed |
| P-66 | GJ-2 removed | killed |
| P-67 | GJ-3 another member's registration joins | killed |
| P-68 | GJ-3 tombstone joins | killed |
| P-69 | GJ-4 removed | killed |
| P-70 | GJ-4 local day of startsAt | killed |
| P-71 | GJ-5 removed | killed |
| P-72 | GJ-5 withdrawal ignored | killed |
| P-73 | GJ-5 end day excluded | killed |
| P-74 | FAC-SEM-117 id form not checked | killed |
| P-75 | FAC-SEM-117 reads no organization grant | killed |
| P-76 | FAC-SEM-117 two agents admitted | killed |
| P-77 | FAC-SEM-117 counts every context | killed |
| P-78 | FAC-SEM-118 unreadable not flagged | killed |
| P-79 | FAC-SEM-118 empty window admitted | killed |
| P-80 | FAC-SEM-118 answers not compared | killed |
| P-81 | kind grant without FAC-SEM-117 | killed |
| P-82 | FAC-SEM-045 grant.usage context not checked | killed |
| P-83 | FAC-SEM-045 case-folded | killed |
| P-84 | FAC-SEM-045 no org.id admits any context | killed |
| P-85 | registration schema open | killed |
| P-86 | active may carry withdrawnAt | killed |
| P-87 | withdrawal may carry agentRef | killed |
| P-88 | refusal message unbounded | killed |
| P-89 | refusal admits another code | killed |
| P-90 | instant pattern open | killed |
| P-91 | schema shareGrantId admits zeros | killed |
| P-92 | schema orgContextId admits personal | killed |
| P-93 | grant.usage context optional | killed |
| P-94 | grant.usage grantId any URI | killed |

## The fix round

The three blind readings of `cbcd03c` (unit fail, seam pass, product fail) led to a fix round: millisecond carrying of
withdrawal and window times, `gateGrantUsage`, `FAC-SEM-117`'s window digits and parent `agentRef`, days compared as
numbers, no leap second. Each new clause and each branch of the gate was planted once, the same way and with the same
focused tests. 26 plants: 21 killed on the first pass; of the 5 that survived, one was closed with a test, one was a
redundant guard removed from the code, and three are equivalent (no input tells them apart from the reference):

- **P-117, the parent's grant looked up in any context:** no case had the parent revision hold the grant under another
  context with placements of its own there. The test "share-registration semantic fixtures" now gives the parent the
  grant in another organization, run there by another agent, and expects no finding. Re-planted: killed.
- **P-118, a record with no placement under the grant compared:** `refs.size === 0` guarded nothing, since an empty set
  has no member to differ from the parent's. The guard was removed from `orgShareGrants`; the plant no longer applies.
- **P-99, the earliest revocation by its carried time:** flooring is monotonic, so the floor of the earliest instant is
  the earliest floor: equivalent.
- **P-102, GJ-5 compares the day with the end's instant:** the usage day is a midnight, so it is after the end's instant
  exactly when it is after the end's day: equivalent. P-103, the same change on GJ-4, is killed, since a start is not a
  midnight.
- **P-119, the code's instant admits a leap second:** `strictTime` refuses second 60 by itself, so `time` answers NaN
  either way: equivalent. The pattern keeps `[0-5][0-9]` to read as the schema's, whose own plant (P-120) is killed.

| Plant | What was removed or loosened | Result |
|---|---|---|
| P-95 | a sub-millisecond time carried as written | killed |
| P-96 | a window's start rounded down, not up | killed |
| P-97 | a start whose cut digits are zero still moved up | killed |
| P-98 | the earliest revocation read only at three fraction digits | killed |
| P-99 | the earliest revocation by its carried time, not at full precision | equivalent |
| P-100 | a drop's withdrawal at `issuedAt` as written | killed |
| P-101 | the window copied as written | killed |
| P-102 | GJ-5 compares the day with the end's instant, not its day | equivalent |
| P-103 | GJ-4 compares the day with the start's instant, not its day | killed |
| P-104 | the gate sends on any status 200 | killed |
| P-105 | the gate sends on a receipt of any status | killed |
| P-106 | the gate holds after `stale-revision` | killed |
| P-107 | the gate holds after `already-withdrawn` | killed |
| P-108 | `agent-mismatch` only held | killed |
| P-109 | `wrong-organization` only held | killed |
| P-110 | `unassigned-device` only held | killed |
| P-111 | `revision-conflict` only held | killed |
| P-112 | an unknown code held as degraded | killed |
| P-113 | `FAC-SEM-117` window digits not checked | killed |
| P-114 | `FAC-SEM-117` checks only `startsAt` | killed |
| P-115 | `FAC-SEM-117` parent not compared | killed |
| P-116 | a parent with no placement under the grant flags | killed |
| P-117 | the parent's grant looked up in any context | killed (after a test) |
| P-118 | a record with no placement under the grant compared | guard removed |
| P-119 | the code's instant admits a leap second | equivalent |
| P-120 | the schema's instant admits a leap second | killed |

## The second reading

After the second reading (unit and product of `b0a3307`), the gate's status check, the floor that keeps its offset and
the two codes moved to `hold-degraded` were planted once each, the same way. 5 plants, each killed.

| Plant | What was removed or loosened | Result |
|---|---|---|
| P-121 | the gate sends on a send code under any status | killed |
| P-122 | the gate degrades on a typed code under any status | killed |
| P-123 | a floored time written in UTC, its offset lost | killed |
| P-124 | `malformed` held, not degraded | killed |
| P-125 | `schema-unsupported` held, not degraded | killed |
| P-126 | the applied entries' revocations listed before the record's | killed (the third reading's tie vector) |
| P-127 | every rounded start written in UTC, an unmoved one too | killed (the fourth reading's vector) |
