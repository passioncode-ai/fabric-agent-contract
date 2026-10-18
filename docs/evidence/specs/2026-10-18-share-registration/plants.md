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
