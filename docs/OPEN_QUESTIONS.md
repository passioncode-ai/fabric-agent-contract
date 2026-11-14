# Open questions

Append-only register. Status vocabulary: `Open`, `Resolved→DEC-####`, or
`Dropped (<reason>)`.

No open questions remain from stage 0. Later stages reserve `OQ-####` before adding
an entry. The coordination config declares no `OQ` id register, so an id is taken
under the lease on this file, from the line below.

**Next free ID:** `OQ-0019`

The seven questions below were raised by module AR-1 (DEC-0016) about the contracts
Fabric locked on 2026-09-29. Each names the part that is implemented and the part that
waits. The owner of the answer is the operator; all seven were ruled on 2026-09-30 and are
resolved by DEC-0017. Each "Meanwhile" line below records what AR-1 did before the
ruling; DEC-0017 states what holds now.

### OQ-0001 — What does "the manifest's `provider.id` equals the entry's `id`" compare?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (FAC-SEM-014)
- **Question:** `manifest.schema.json` makes `provider.id` an absolute URI; a provider
  entry's `id` is a slug (`^[a-z][a-z0-9-]{1,62}$`). The two can never be equal. Options:
  (a) the manifest names its entry in an extension block, as a service manifest names its
  descriptor; (b) `provider.id` must be `urn:fabric:provider:<id>`; (c) the last path
  segment of `provider.id` equals the entry id.
- **Meanwhile:** FAC-SEM-014 enforces the resolvable half only (the manifest resolves to a
  provider manifest).

### OQ-0002 — Is a job result a full result envelope?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (C3.2)
- **Question:** C3.2 lists `{done, proof, scope, notVerified, output, usage}`; the full
  result (DEC-0011) also requires `id`, `contractVersion`, `outcome`, `artifacts`,
  `createdAt` and `producer`, and its `scope` requires `project`, `run`, `node` and
  `binding`, which an agent called through the hub knows only if the hub passes them.
- **Meanwhile:** `interop-result.schema.json` requires exactly the listed members, reuses
  the full result's item shapes, and admits `outcome` and `artifacts` as optional.

### OQ-0003 — Where does a job result carry its trace id?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (FAC-SEM-019)
- **Question:** C3.2's job shape has no trace field, yet FAC-SEM-019 speaks of "a job result
  without a trace id". Options: the `_meta.traceparent` of the answer that delivers the
  result, or a `traceId`/`spanId` pair inside `job`.
- **Meanwhile:** the rule reads the answer's `_meta.traceparent`.

### OQ-0004 — Which "secret patterns" does FAC-SEM-015 apply to an env value?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (FAC-SEM-015)
- **Question:** the adapter's existing patterns are secret *names* (password, API key,
  access token, client secret, private key). Applied to a value they refuse
  `secret-ref:EXAMPLE_API_KEY`, which is a correct reference.
- **Meanwhile:** the rule refuses a value that is not `secret-ref:…` and a reference whose
  body has a credential's *shape* (token prefix, PEM key, JWT, long mixed-case key run).

### OQ-0005 — How does PL-1 read a checker stage and a join?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (PL-1)
- **Question:** a checker stage without a capability has no schemas, so the locked example's
  `check → publish` edge cannot be checked literally; and "for each edge" makes every
  producer of a join provide all of the consumer's required properties.
- **Meanwhile:** a capability-less checker passes its inputs through (its outgoing edges are
  checked against the stages feeding it), and PL-1 is applied per edge as locked.

### OQ-0006 — What does a job-capable tool declare as its `outputSchema`?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (C3.1 with C3.2)
- **Question:** C3.1 serves the capability's `outputSchema` on the tool, and MCP requires
  `structuredContent` to conform to a declared `outputSchema`; C3.2 has a job-capable tool
  return `{job: {...}}` in `structuredContent`, which does not conform. Options: the tool
  declares `oneOf` of the output and the job handle; the handle travels outside
  `structuredContent`; or a job-capable tool declares no `outputSchema` and the manifest
  keeps it.
- **Meanwhile:** FAC-SEM-017 compares schemas exactly as locked; the Fabric Agent Adapter's
  kit serves the job tool's `outputSchema` as the capability's and says so.

### OQ-0007 — Which events must carry `traceId` and `spanId`?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (C3.4 c)
- **Question:** C3.4 says "every event"; a service also publishes events no traced request
  caused (it started, a schedule fired).
- **Meanwhile:** the pair is optional in the events schema and required, as a pair, on an
  event about traced work.

### OQ-0008 — Which project-communication choices does Fabric accept (DEC-0022)?

- **Status:** Resolved→DEC-0022 (2026-10-05: the operator accepted C1–C9 as written)
- **Raised:** 2026-10-04, COM-01 (fabric-dashboards session, carrying the Codex coordinator's
  draft, fabric branch `codex/com01-contract-candidate-20261004`)
- **Owner of the answer:** the operator and Fabric (COM-01 is owned by Fabric and this repository).
- **Question:** `fabric-project-comms/0.1` (DEC-0022) is written with these choices. Accept,
  amend or reject each:
  - **C1** — the protocol is an opt-in extension, separate from `fabric-service/0.1`;
  - **C2** — a thread's participant Projects are immutable, and the whole history of a Project's
    threads needs an explicit grant;
  - **C3** — cursors are private to their principal, and no estate ordinal reaches a reader;
  - **C4** — a responder is fenced by generation, attempt and effect, and accepted work is held
    on expiry;
  - **C5** — no background helper by default; claims are short 60 s tool bursts, and there is no
    attention guarantee;
  - **C6** — namespace admission is finite, with a retired-epoch floor and durable unknown facts;
  - **C7** — a restore brings back archived history only, and a new restore epoch excludes all
    execution authority;
  - **C8** — Telegram is off by default, the user mapping is private, and causal loops are bounded;
  - **C9** — short MCP calls only, with no Tasks or A2A claim without negotiated acceptance.
- **Meanwhile:** the schemas, the semantic rules `FAC-SEM-026`/`FAC-SEM-027` and the fixtures
  exist and are tested, so the choices can be reviewed on a real wire. No consumer may claim
  conformance, and no Fabric migration is reserved for them.

### OQ-0009 — Activity telemetry: a minimum summary cell, raw-retention expiry and an OTLP transport (DEC-0030)

- **Status:** Resolved→DEC-0030 (2026-10-08: the operator answered all three parts)
- **Raised:** 2026-10-08, with DEC-0030. Narrowed the same day by the review of PR #22, which
  resolved inside DEC-0030 that a device never produces a summary.
- **Owner of the answer:** the operator.
- **Question:** (a) Does `activity-summary/1` need a minimum cell size? (b) When `retention.raw_days`
  expires, does a receiver delete raw events, or keep them under a stricter scope? (c) Should a
  receiver also accept the same records as OTLP logs?
- **Answer (2026-10-08, DEC-0030 item 10):**
  - (a) Yes, k = 3. A cell is published only when its population is at least 3 — distinct
    `user.id` where events carry one, else distinct sessions. Smaller cells fold into the day's
    other cell or are suppressed (`FAC-SEM-040`).
  - (b) Delete; only summaries already built remain.
  - (c) OTLP logs MAY be accepted as a second intake, through the mapping table, under the same
    rules and deduplication.

### OQ-0010 — Devices: attestation formats (DEC-0031)

- **Status:** Open, deferred by the operator on 2026-10-08 until the first real organization server
  adopts DEC-0031
- **Raised:** 2026-10-08, with DEC-0031. Narrowed twice the same day:
  - The review of PR #22 resolved in DEC-0031 how a reinstall is told from tampering.
  - The operator answered the other parts (DEC-0031 item 7):
    - trusted policy keys arrive as a key set signed by the root key from enrollment, with
      overlapping rotation (`FAC-SEM-046`);
    - a device is `inactive` after 7 days without events by default, and a server MAY change that.
- **Owner of the answer:** the operator, with the first organization server that adopts DEC-0031.
- **Question:** Which platform attestation formats prove `build_channel.allowed: attested`, and a
  non-exportable key at enrollment?
- **Meanwhile:** `attestation` is an optional opaque field in the enrollment request. No consumer is
  required to produce or verify one. A file-held key (DEC-0094) carries none, so if `attested` is proved by it, such a device cannot meet it.

### OQ-0011 — Identifier equality: what DEC-0076 left open

- **Status:** Open
- **Raised:** 2026-10-13, CT-39 (#87, DEC-0076 *Not decided here*)
- **Owner of the answer:** this repository.
- **Question:** four choices DEC-0076 did not make:
  - **Q1** — internationalized identifiers (IRIs) and Unicode normalization: today a non-ASCII string is no URI and is
    compared as it is;
  - **Q2** — scheme-based normalization (RFC 3986 §6.2.3) for any scheme, such as a default port or an empty path;
  - **Q3** — URN namespace-specific equivalence (RFC 8141 §3.1 lets a namespace add rules), for `urn:fabric:` first;
  - **Q4** — whether a schema refuses a non-normal spelling outright, so that a writer MUST emit the normal form and the
    readers' lookup by normal form becomes a check.
- **Meanwhile:** readers compare by normal form; writers SHOULD emit it; nothing refuses a non-normal spelling.

### OQ-0012 — Jobs and capabilities under limits and uncertain effects: a typed pause, `outcome-unknown` beyond comms, unknown as `null`

- **Status:** Resolved→DEC-0087 (2026-10-19; ruled in principle 2026-10-17)
- **Raised:** 2026-10-17, an agent retrospective of 18 agents (a private report, candidates C1–C4), read
  against `7a14a48`; board row CT-55
- **Owner of the answer:** this repository.
- **Question:** four candidates for normative text, with their evidence as reported:
  - **C1**: a job stopped by a provider or subscription limit ended as `failed` in about ten agents, and callers
    resubmitted and paid twice; `interop.md` C3.2 has no limit state, no `resetsAt`;
  - **C2**: `outcome_unknown` exists only for `com.*` (project comms); several agents booked duplicate charges by
    resending an uncertain write under a new idempotency key;
  - **C3**: unknown as `null` in every number and verdict, beyond `costUsd` (DEC-0021, `FAC-SEM-025`);
  - **C4**: a 4xx at submit is a settled rejection; a 4xx while polling an accepted job is a lost job.
- **Ruling in principle (2026-10-17):**
  - C1 and C2 change the wire: one additive `fabric-interop` revision: a job error code `quota-exhausted` with
    `retryable` and an optional `resetsAt` (RFC 3339 UTC), a `working` status message for a job a limit paused (the
    provider resumes the same job), a job error code `outcome-unknown` for an effect that may have happened, and the
    caller rules: no resubmit after either code, a resend reuses the idempotency key derived from the intent, never a
    clock or a random value. Codes are lowercase-hyphenated as C3.2 requires; `degraded` stays health, never a job state.
  - C3: already binding for cost; the DEC extends `null` for unknown to a job's `usage` totals, counts and coverage.
    A check that did not run is already never a pass: a claim no checker verified stays in `notVerified`, and
    `succeeded` is refused while any claim is there (`FAC-SEM-001`, DEC-0064; [results and evidence](specification/results-and-evidence.md)).
  - C4: caller behaviour that moves no shape, so guidance in fabric-agent-adapter (its PR #122), not contract text.
- **Meanwhile:** nothing changes on the wire; providers follow the adapter's guidance.
- **Resolution:** DEC-0087, [interop → limits and uncertain effects](specification/interop.md#limits-and-uncertain-effects):
  `quota-exhausted` with `data: {retryable, resetsAt?}`, the pause grammar of a `working` job's `statusMessage`,
  `outcome-unknown`, the caller's act (`jobCallerAction`), the intent's key (`intentIdempotencyKey`), the provider's
  answer to a repeated key, `null` and `partial` in `usage` under the revision `fabric-interop/0.2` a caller names in
  `_meta.protocols`; `FAC-SEM-119`, `FAC-SEM-120`. C4 stays adapter guidance.

### OQ-0013: Usage data: does "only for this" admit counting one installation once across the products, and does "every product" reach a hosted service?

- **Status:** Open
- **Raised:** 2026-11-08, the blind readings of DEC-0157 (CT-216), on branch `agent/ct216-usage-data-20261107`, since
  recut as `agent/ct216-usage-data-v2` (the earlier name is historical); the second part raised in round 11, the same day
- **Owner of the answer:** the operator.
- **Question:** (1) the operator's decision of 2026-11-04 names one purpose for anonymous usage and error data: «чтобы мы
  улучшали наш продукт. Все, только для этого» (quoted in Fabric Switchboard's `docs/ANALYTICS.md`; the knowledge
  base's plans.md item D). DEC-0157 reads it as admitting a second purpose, counting one installation once across the
  products that share its installation id, as an accurate count serving the same improvement. His item C of the same
  plan bears on it: «логи добавляем ... аналитику для корректной оценки, отслеживания» (plans.md line 97 at
  `c84c7a40`). Two live notices already state the second purpose: Switchboard's ("A random installation number, shared
  by the PassionCode.ai tools on this computer, lets one person using several of them count once", `src/main.ts`
  line 109 at `b99a17b`) and Fabric Inbox's ("An id shared by the PassionCode apps on this computer counts one person
  once", `desktop/main.cjs` line 937 at `1395416`), so a narrower answer changes shipped strings, not only future
  wording. Switchboard's same line also gives its first purpose as "to help PassionCode.ai improve its apps" (unchanged
  at `f6f1dc1`), every app of the organization rather than Switchboard, which DEC-0157 counts as a UD-1 debt; a narrow
  answer changes that string too. Both notices also say the shared id counts "one person" once, while UD-1 and UD-3
  count one installation and name no person (one OS account used by two people, or one person on two machines, makes
  "one person" untrue); whatever the answer, those notices are asked to say "one installation" (or "this computer")
  rather than "one person", a new notice under UD-1's re-show rule (the board message's Switchboard and Fabric Inbox
  lines). Does "only for this" admit the second purpose, or is a shared id's only use each product's own improvement?
  (2) Plans.md item D addresses "every product owner". DEC-0157 reads it as the products the estate ships to people
  (an app, an agent, a command line tool, a component run on the person's own server) and leaves out a service the
  estate hosts that installs nothing on the person's machine or in an account or server of theirs, since nothing of it
  runs where the person's switch could stop it. Does "every product" reach such a hosted service, at least for what
  "anonymous" means (UD-3) and what its documentation states (UD-5)?
- **Meanwhile:** [usage data](specification/usage-data.md) UD-1 and DEC-0157 item 1 state both purposes and mark the
  second, and the notice wording that follows from it, as provisional; a narrower answer changes the notice's purposes
  (UD-1) and is a new notice under its re-show rule. The page's scope and DEC-0157 item 1 mark the hosted exclusion as
  DEC-0157's reading pending (2); an answer that reaches hosted services is a new decision extending UD-3 and UD-5 to
  them, the switch staying each product's.

### OQ-0014: Usage data: what repair of a shared installation file that stays unreadable may a product offer?

- **Status:** Open
- **Raised:** 2026-11-12, round 30 of the blind readings of DEC-0157 (CT-216), branch `agent/ct216-usage-data-v2`.
- **Owner of the answer:** the operator.
- **Question:** a shared installation file (`<root>/installation.json`) that exists but stays unreadable stops every
  product that sends only with the shared id (Fabric, Switchboard, the launcher) for good: UD-4 lets no agent rewrite
  it, the file records no creator, and resetting its id is all the sharing products' (UD-2, UD-5). Which repair may a
  product offer, on the person's act in its settings or on the operator's word through an agent: (a) none, the hold
  stays; (b) restoring read permission only, keeping the file's id and answer; (c) (b), and replacing a file that does
  not parse with a new id and `analytics: false`, as a reset every sharing product accepts? Answer a, b or c.
- **Meanwhile:** the hold stays; the product's hold line names the file and says it is read again at each start, and
  the agent tells the operator the file's location and that its repair waits on this answer
  ([usage data](specification/usage-data.md) UD-2, UD-4; DEC-0157).

### OQ-0015: Is a unit cell drawn from one member's work served inside a larger organization?

- **Status:** Open
- **Raised:** 2026-11-12, DEC-0164 (CT-259) blind readings
- **Question:** Units are served only for an organization whose signed member list names at least 3 members ([activity](specification/activity.md#kinds), DEC-0164 AE-3). Inside such an organization a project with one member, an agent only one member runs, or a task class only one member's work falls into gives a cell that is that person's agents' output. Serve such cells, or fold them into the organization's total?
- **Meanwhile:** folded into the organization's total (the safer, reversible default); the operator answers before the first monthly number is published.

### OQ-0016: Under which access-log scope is a read of a person acceptance logged?

- **Status:** Open
- **Raised:** 2026-11-12, DEC-0164 (CT-259) blind readings
- **Question:** A read of a unit whose `acceptedBy` is a person is logged in that person's access log. Under `activity.raw` (which `FAC-SEM-067` narrows to a purpose the person confirmed, served without cost) or a scope of its own?
- **Meanwhile:** `activity.raw`.

### OQ-0017: Which audience's pairwise subject does a person acceptance carry?

- **Status:** Open
- **Raised:** 2026-11-12, DEC-0164 (CT-259) blind readings
- **Question:** A member holds one pairwise subject per (organization, audience) (OM-1). A unit can reach the organization's journal and Observatory's local journal; which audience's subject does a writer put in `acceptedBy.ref`?
- **Meanwhile:** the organization's own journal's audience; a receiver resolves any audience's subject it issued for that member.

### OQ-0018: Is a cell counting units by the members' own role permitted?

- **Status:** Open
- **Raised:** 2026-11-12, DEC-0164 (CT-259) blind readings
- **Question:** DEC-0164 serves units only by agent, project, task class and the organization's total. May a cell count units by the role of the members whose work they are, read from the signed member list (owner, admin, member; an architect only once DEC-0162's `org-membership/2` is read), and with what minimum? The product's existing answer for aggregates of people is a cell of at least five (fabric-workspace `knowledge/north-star.md`, section 9). This is not the North Star's G26, whose role cut is a dashboard per viewer role built from the cells already served (the owner's view is the organization's total).
- **Meanwhile:** no cell counts units by the members' role; G1-e's per-role dashboards are views over the served cells and wait on nothing here.
