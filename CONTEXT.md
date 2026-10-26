# Fabric Agent Contract language

The vocabulary used by the compatibility contract between Fabric hosts and
independently developed providers.

## Language

**Host**: The system that discovers, admits, binds, and runs providers; Fabric is
the first host. Fabric is PassionCode.ai's product, the CEO AI agent; in this contract
"Fabric" means its kernel acting as host, and this contract is what makes any agent
Fabric-compatible (names: Fabric ADR-0090).

**Provider**: An independently versioned implementation that offers one or more
capabilities through a declared protocol profile.

**Agent**: A provider that autonomously accepts an outcome and owns the internal
work needed to produce it.

**Capability provider**: A provider exposing bounded functions or data whose
input and output shapes are controlled by the host.

**Capability**: A host-owned, versioned semantic contract that may be served by
different providers.

**Binding**: The immutable capability-to-provider choice recorded for one run.

**Profile**: A normative compatibility mode, named as the manifest schema names it:
`mcp`, `a2a` or `local-runner`. An `mcp` capability is served by a capability
provider, an `a2a` one by a peer agent; those are kinds of provider, not profile
names.

**Execution context**: A versioned, secret-free description of the runtime,
account pool, shell, workspace, tools, filesystem, network, and limits made
available to an agent.

**Account pool**: The project-scoped set of runtime account profiles between
which an approved adapter may switch under a versioned fallback policy.

**Observation**: A measured fact carrying a source, time, and validity domain.

**Evidence**: A resolvable record supporting a claim within an explicit scope.

**Insight**: A derived conclusion that cites observations or evidence.

**Learning**: A versioned contrast between a failed attempt and a verified
correction, proposed by a retrospective.

**Memory Kernel**: The host control plane that authenticates memory scope,
governs canonical revisions and assembles bounded retrieval context.

**Memory ledger**: The append-only canonical store of memory revisions,
evidence links, conflicts and tombstones.

**Memory backend**: A replaceable data-plane adapter that stores rebuildable
search, embedding or graph projections and never decides access or truth.

**MemoryPack**: A bounded, cited retrieval result containing selected records,
supported conflicts, unknowns and a consistency cursor.

**Memory use trace**: An auditable record of which memory revisions influenced a
run and what feedback the consumer later supplied.

**Promotion**: The governed act that makes a project insight retrievable from
the global memory scope without copying its sources.

**Coordination lease**: A time-bounded, atomically acquired right to perform a
claimed piece of shared work.

**Write scope**: The paths or logical resources a node declares it may modify.

**Standing grant**: A named, scoped, expiring authorization for a class of
otherwise approval-bound external actions. With a `spend` block it authorizes spending: `unlimited`, or
`limited` by one or more **Limit windows** at once; the owner pays (DEC-0037, DEC-0038).

**Spend policy**: A project's L1 record of what its agents may spend — the monthly limit, the auto-approve
threshold per task, the model classes and the credential sources — that an agent checks instead of asking
the person ([spend policy](docs/specification/spend-policy.md), DEC-0037).

**Limit window**: The span a grant's spending limit counts over: `total`, `task`, `project`, `day`, `week`
or `month`; several apply together and the first reached stops the spend (DEC-0038). `call` is a refusal
window at L3, not a grant limit (DEC-0041).

**Context**: Where work happens and whose it is: `personal`, the person's own, or `org:<orgId>`, an organization by the
organization server's opaque id (`common.schema.json#/$defs/contextId`), compared as written. A grant names the context
its principal uses it in, never `personal` for an external one; an agent is placed on a machine once per context, an
organization's instance under its own share grant; no event carries its session's context and no check-in carries a
context but a node summary's own `org:<org.id>` (DEC-0102) and its credential requests' and call records' (the same
context, DEC-0111, DEC-0114): a device sends each enrollment's check-ins to that enrollment's server, a collector sends a session's events
only to its context's organization, and a grant's usage reaches the grant's organization as a daily `grant.usage`
event, which carries the grant's own `org:<orgId>` (DEC-0086) ([contexts](docs/specification/contexts.md), DEC-0082).

**Network**: A **Context**, seen as the machines that work in it (the operator's NET-1, 2026-10-15, recorded by
DEC-0084): a person's own network is their personal estate, `personal`, all their own machines; any other network is an
organization, `org:<orgId>`. Creating a network of one's own machines is the "create my network" ceremony; an
organization's network and sharing into it are share grants (DEC-0082). No schema names a network
([ceremonies](docs/specification/ceremonies.md)).

**Estate ceremony**: How a signed estate revision is made (DEC-0084): "create my network" (revision 1), "add a
machine" nearby or remotely (a **Comparison code**) or without a screen (an **Enroll token**), "remove a machine" and
"replace a machine's key", and (DEC-0107) "move the hub" and "recover a lost passkey". Each ends in a revision the person's passkey signs and each machine applies offline; what a
revision drops it revokes in the same revision (`FAC-SEM-114`) ([ceremonies](docs/specification/ceremonies.md)).

**Delta anchor**: A head of the revocation delta a revision vouches for (`deltaAnchor`, DEC-0107): a machine that lacks
the entries before it starts its chain there, so entries signed by a hub key that has since moved never block it
([revocation delta](docs/specification/revocation-delta.md#the-anchor)).

**Comparison code**: The six digits both screens show when a machine pairs with a trusted one (DEC-0084): from the
SHA-256 of the RFC 8785 transcript of both sides' keys, both nonces and the trusted side's estate `genesis`, after both
sides committed before either revealed (`comparisonCode`). One rendezvous allows one guess; a wrong code burns it.

**Estate fingerprint**: Five groups of five digits rendered from revision 1's digest (`estateFingerprint`, DEC-0084):
what a person compares to know two screens show one network. It never pins a passkey alone.

**Enroll token**: `enroll-token/1` (DEC-0084): Fabric's one-time, at most 15-minute token, signed by the person's
signing passkey, with which a machine without a screen joins an estate; the hub binds it to the machine's `#sig` key on
first use and refuses every later use (`FAC-SEM-113`). It gives no trust until a revision lists the machine.

**Key reference**: One device key's identity in a `device-key` revocation, `<kid>@sha256:<hex>` over its octets
(`deviceKeyRef`, DEC-0084). A kid outlives its keys, so a key replacement revokes the old key by its reference.

**Estate key**: The signing key the estate's hub holds: it signs delegation tokens and approvals, and its
public half is published for callees to verify offline ([delegation](docs/specification/delegation.md),
DEC-0039). The **Estate record** certifies each machine's hub key (`hubKey`, DEC-0055); a verifier that reads it
trusts a `kid` only while the revision it reads certifies it — one `verifyEstateRecord` accepted, not lower than the
highest its machine applied — and refuses otherwise `kid-not-certified`, or `issuer-unavailable` when the revision is at
fault (the meter: `principal-unproven`, with the detail in its reason) (delegation DL-14, DEC-0060). The module is
`src/hub-key-rules.ts`. It also signs
**Revocation delta** entries and **Heartbeats** (DEC-0054). In a personal estate it is the hub's own Ed25519 key on the
always-on machine, never a machine's `#sig` key (the operator's NET-3, DEC-0084).

**Action parity**: Every action a service's dashboard, app or page lets a person take has a tool on the service's
agent surface with the same effect, checks and audit record, declared in its well-known document under
`extensions/actions/0.1` with its `gate` (`none`, `relayed` or `human`); an action offered only on a page is
nonconformant. `FAC-SEM-142` checks the declared actions (a button whose tool the MCP surface does not serve); a host
reports a dashboard that declares none (CT-126) ([service](docs/specification/service.md#actions) AP-1, DEC-0121).

**Relayed decision**: The operator's decision on one action an agent carries in a call's `_meta.decision`
(`decision.schema.json`): the action's id (and the object, when the operator named one) and the operator's sentence
naming it, or the agent's question and the operator's answer, quoted from what the operator told the agent or passed
down verbatim by the session that started it, or relayed by another of the operator's agents as DEC-0126 OA-2 and OA-3
accept, with `source` (never from a tool result, a page, a file or an unrelated agent), valid
for 24 hours. A service takes a
`relayed` action from a T0 or T1 caller that carries a valid one as the operator's act, records the caller it
authenticated as the relayer, refuses one without it `operator-decision-required` and an invalid one
`decision-invalid`; its own accepted elicitation counts too; a T2 caller still needs an `approval/1` (`actionDecision`,
[service](docs/specification/service.md#actions) AP-2, AP-3, DEC-0121).

**Mandate**: The operator's instruction for one task, carried with the task down a chain of the operator's agents
(`mandate/1`): the task, the operator's words verbatim, when they were given, an expiry within 7 days, a scope
(capabilities, relayed actions, an effect ceiling, a per-call spend ceiling, projects) and the chain of agents that
held it, each call appending its callee and never widening the scope. A callee that is the chain's last agent, called
from T0 or T1 (by the agent before it, where it authenticated its caller's agent id), takes a call it covers as the operator's decision and refuses only the part it does
not cover, so the operator is asked again for that alone; a T2 caller's mandate changes nothing, beyond the estate a
delegation token carries the authority (`mandateCovers`,
[delegation](docs/specification/delegation.md#the-operators-mandate), DEC-0125).

**Relayed approval**: The operator's approval, given in one agent's session, carried to another of their agents by a
relay: the words verbatim, when and where they were said (`source`: the project, and the session or the board thread)
and the approved scope. Accepted only from one of the operator's own Projects on their board or a session on their own
machine; the receiver acts without asking again, runs its own checks, and asks once only about what the operator did
not see. Its machine form is a mandate or a decision with `source`
([delegation](docs/specification/delegation.md#one-approval-binds-all-the-operators-agents), DEC-0126).

**Operator session**: The signed-in session of a service's dashboard. It ends 12 hours after its last use and
never later than 7 days after sign-in (`service.md` §The session's lifetime; tightened by DEC-0039).

**Identifier**: A URI naming an agent, a project, a proposal, a setting or an account
(`common.schema.json#/$defs/uri`). Two identifiers are the same when their normal forms are equal — RFC 3986 §6.2.2 for
a URI, RFC 8141 §3.1 for a URN, any other string as it is; writers SHOULD emit the normal form; readers MUST compare by it
([identifiers](docs/specification/identifiers.md), DEC-0076).

**Usage report**: What a service publishes about its own spend at `surfaces.usage`, with every spending limit
it applies, enforced or not (DEC-0021, DEC-0027), and MAY attribute its calls to projects and task runs, never
to a caller (DEC-0065). Money is summed over its rows not on a subscription; a subscription row's cost is an
estimate at list price, shown apart (DEC-0110, `usageSpend`).

**Spending limit**: A cap a service applies to its own spend — per day or UTC month, per order, a velocity limit, or
a rolling window of `windowSeconds` — each listed in its usage report, enforced or not (DEC-0021, DEC-0027);
distinct from a grant's **Limit window**, which caps what a grant may spend.

**Services folder**: The per-user directory where installed services' descriptors and token files live:
`~/Library/Application Support/ai.passioncode.fabric/services/` on macOS,
`${XDG_DATA_HOME:-~/.local/share}/passioncode-fabric/services/` on Linux,
`%LOCALAPPDATA%\passioncode-fabric\services\` on Windows, or `FABRIC_SERVICES_DIR` (DEC-0015, DEC-0032).

**Supervisor**: The system service manager that keeps a local service running — launchd, systemd or the
Task Scheduler — or Project Observatory's node for the services it starts as its children, named by the descriptor's
`lifecycle.manager` (`node` for the node, with no supervisor file; DEC-0015, DEC-0032, DEC-0057, DEC-0061).

**Peer (a service offered to others)**: A service a colleague, an organization's members or a guest may call beside
its operator — a listing. Its descriptor's `peer` names the `endpoint` they reach, the `custody` of the machine or
account (organization-managed, personal, or processor-hosted for a machine a processor runs for an organization,
DEC-0099), the `residency` (ISO 3166-1 alpha-2 codes) and the `maxDataClass` (public,
internal, confidential, restricted) a host never sends above. It grants nobody access (DEC-0061).

**Credential kind**: The kind of a runner's sign-in, never its value: `subscription` (the operator's own vendor login,
never offered to others), `key`, `platform-metered` (the hosting platform's own metered models) or `none` — the
descriptor's `runner.credentialKind` and, for the same calls, a usage row's `route` (DEC-0046, DEC-0061).

**Supervisor marker**: How a service's copy knows its supervisor started it: `FABRIC_SERVICE_SUPERVISOR=<manager>` in its
environment or `--fabric-supervisor <manager>` in its arguments, written into the plist, unit or task. Only a marked
copy may wait for a held `service.lock`, at most 300 s, before it exits 75 (DEC-0057).

**Token file**: The file in the services folder holding a service's descriptor token: readable by its user
only (mode 0600) on macOS and Linux; on Windows its owner and every ACE that grants a right name the user,
SYSTEM or Administrators — the trust of root reading a 0600 file (DEC-0032, DEC-0033).

**Project board**: The board a Project's agents exchange information and requests through, under
`fabric-project-comms/0.1` ([project communication](docs/specification/project-comms.md), DEC-0022).

**Primary responder**: The holder of a Project's `project.work` slot, the capability a request names when it names no
narrower one, shown by a host as the Project's main session; the operator may move it, or any slot, to another live,
authorized session of the Project ([project communication](docs/specification/project-comms.md#the-primary-responder), DEC-0140).

**Session role**: What a session says it does (`coder`, `observer`, `monitor`, `responder`) when its host enrolls it:
display and routing only, never authority, and not a role assignment of `roles.schema.json`
([project communication](docs/specification/project-comms.md#a-sessions-role-and-branch), DEC-0140).

**Delivery**: Which Projects a board message counts as unread for, and the only ones a transport mirror may send it
to (DEC-0135): every participant but the sender for a message, request, finding or announcement; for a reply the
sender of what it answers by default (the whole thread when that is the replier's own Project or the board no
longer holds it), or the whole thread or named participants by its `deliverTo`, and always the
requester of a request it answers unless that is the replier's own Project or the board no longer holds the request; every message a responder posts on a request's thread (fenced reply, progress note, effect and checkpoint
summaries) to the requester, or the whole thread when that is the responder's own Project or the request is no longer held. A reader pinned before
DEC-0135 counts every message its Project did not send as delivered to it. Never who reads:
every participant reads every message of its thread.

**Project directory**: What `com.directory` answers: the addressable Projects of the caller's estate, each with its
id, name, listed capabilities and their responder state, and nothing else. Only a managed or enrolled session of a
Project of the same estate reads it (T0 or T1 of the estate's owner); asserted, viewer and share-grant principals and
every other estate are refused `not_authorized`, and the caller's own Project is never listed. An operator may unlist
a Project: that hides it from discovery only, and it stays addressable by id
([project communication](docs/specification/project-comms.md#project-directory), DEC-0073).

**Board receipt**: The one answer of every successful board mutation (`comms-receipt.schema.json`): `ok`,
`repeated`, and the message, request, slot or attempt the call touched; for a bulk read mark `marked`,
`alreadyRead` and `more`, and for the requester's request nobody can answer now `noResponder` (DEC-0098); never a
sequence number (DEC-0073).

**Board hold**: The operator's hold, set in the host or relayed by their agent to the host's action (DEC-0121), on a thread, a Project or a (Project, capability) responder slot.
While it lasts the board refuses new work in its scope `held` (retryable), never refuses a cancel or a read, and
never refuses the current responder's calls on started work; if that responder's session ends under a slot or
Project hold, enrollment and replacement wait for the lift, and its accepted work stays held as C4 says. It is not an
authority change and bumps no generation
([project communication](docs/specification/project-comms.md#holds), DEC-0079). Not the C4 sense in which accepted
work is *held* past its deadline.

**Owner settlement**: The estate owner (the `trusted` operator principal that owns the request's target Project; in an
organization, that member only) settling an `outcome_unknown` request through `com.reconcile` while no responder holds
its slot: observed only, with a required summary, never to `cancelled`; the request then reads `settledBy: "owner"`,
which a board sends on nothing else ([project communication](docs/specification/project-comms.md#owner-settlement),
DEC-0081).

**`answered`**: A request state (DEC-0098): a participant's message of any kind but a request (never a responder's
fenced message or progress note) from the request's target Project, whose `replyTo` is a `queued` request, moves it
to `answered` (DEC-0102). It is not open: no responder claims it, its deadline no longer expires it, and only the
requester's `com.cancel` moves it. It says the target answered, never that the asked work was done (`FAC-SEM-027`,
[project communication](docs/specification/project-comms.md#request-lifecycle)).

**Board finding**: A message of kind `finding` with a structured `finding`: a severity (`info`, `warning`,
`blocking`), a consequence, 1–16 items it affects (a backlog row linked by repository, path and id, never copied, or a
task) and a `dedupeKey`. The same sender Project and `dedupeKey` answer the standing finding's receipt with
`repeated: true` instead of a second message, for as long as that finding is retained; a reader sees
`{redacted: true}` in place of an item outside its grants, the count kept
([project communication](docs/specification/project-comms.md#findings), DEC-0080).

**memory/0.1**: The wire on which agent memory is served, first by Project Observatory
([memory and learning](docs/specification/memory-and-learning.md), DEC-0023).

**Key set**: The device's set of trusted policy keys, signed by the organization's **Policy root key** and
rotated with overlap; a policy counts only when signed by a key of the current set valid when the device verifies (`FAC-SEM-041`, DEC-0053), and the set
itself is checked under the root key (`FAC-SEM-046`) ([devices](docs/specification/devices.md), DEC-0031).

**Policy root key**: The organization's root key, delivered at enrollment, that signs **Key sets** and nothing
else (DEC-0031); Ed25519 or ES256, naming its algorithm, and certified by the offline root an installer pinned when
it pinned one (**Root certification**, `FAC-SEM-069`, DEC-0053).

**Device key**: A device's key, non-exportable unless its `key.storage` is `file` (DEC-0094). Beside DEC-0031's enrollment key, `deviceKeys` lists exactly one signing
key `<device.id>#sig` (ES256 or Ed25519) and at most one key-agreement key `<device.id>#kem` (ECDH over P-256), never
one key in both roles (`FAC-SEM-044`, DEC-0056); a P-256 key is a valid point by SEC 1 §3.2.2 (`isValidP256Key`,
DEC-0053).

**Device request signature**: The HTTP message signature (an RFC 9421 subset, label `fabric-device`) a device puts on
every batch, check-in, rotation and share-registration request with its `#sig` key, beside mutual TLS, so a receiver behind a host that
terminates TLS still proves the device's key; its `keyid` is the certificate's serial, and a (serial, nonce) pair is
accepted once (`FAC-SEM-077`, [devices](docs/specification/devices.md#transport), DEC-0056).

**`org-cloud`**: A device certificate binding's `role` (DEC-0099): the device is the organization's own cloud machine
(its `org-cloud` or `enterprise-cloud` hosting), a VM no person uses, and the binding names no `user`. Only an
`enrollment-token` whose record says `role: "org-cloud"` gives it, never an SSO sign-in (`FAC-SEM-044`). Such a machine
derives no share registrations, and the organization's own signed repair request is its notice (DEC-0102)
([devices](docs/specification/devices.md#enrollment)).

**Renewal by the key on record**: `auth.method: "key-on-record"` (DEC-0100): a device on record, not revoked, enrolls
again within 30 days of its last certificate's `notAfter` with a CSR from its key on record and no other proof; the
certificate keeps the user and role on record, a new epoch is issued, the renewal is audited, and a server MAY refuse
it by policy (`FAC-SEM-044`). The 30 days are judged by the server's clock (the new certificate's `notBefore`), never
the device's `requestedAt`; before the last certificate's end the same request is a re-enrollment by the key on record
with a new epoch (DEC-0102) ([devices](docs/specification/devices.md#enrollment)).

**Closed organization**: An organization whose closing can no longer be cancelled. Its server MAY answer a device request of a
node pinned at or after DEC-0103 (never an enrollment) with 410 `organization-closed` and `closedAt`, and a node ends that enrollment at once and drops what it buffered for it
([devices](docs/specification/devices.md#organization-closed), DEC-0103).

**Collection start**: When a device starts collecting for the organization: the notice's acknowledgement, or under
device management the earlier of that and the policy's deadline; the first acknowledgement, never moved by a later
notice's (DEC-0102). Nothing that occurred before it is uploaded
(`FAC-SEM-068`, DEC-0053).

**`acknowledgedNoticeVersion`**: The check-in response member naming the latest notice version the device's person
acknowledged, on every response once there is one (DEC-0102). A collector held by a `purpose` rejection sends that
kind for that person again when it differs from the value it held at the rejection, absence at the rejection included;
a value that becomes absent is no signal. A server sends it only to a node pinned at or after DEC-0102
([devices](docs/specification/devices.md#check-in)).

**`before-purpose`**: A batch acknowledgement's rejection reason (DEC-0102): the event occurred before its purpose was
collected for that person (their acknowledgement of the notice naming it, or the mdm deadline where the organization
collects under it), and that purpose is collected now. A receiver may keep such an event; when it does not, it answers
`before-purpose`, never `purpose`, and the event is consumed with nothing held. It is sent to every collector and is not
GJ-4's `before-start`, a stored state of a `grant.usage`
([activity](docs/specification/activity.md#batch-and-acknowledgement)).

**Node summary**: `node-summary/1` (DEC-0101): a check-in record (`records.nodeSummary`) for one organization context,
its enrollment's own `org:<org.id>` (DEC-0102): the coding agents by catalogue id, the MCP servers with source,
transport and health, the skills and plugins with their digests and versions, the hook count, the agent services placed
in that context, and the drift. It names no person, path, credential, argument, environment value, prompt, output or
file content (`FAC-SEM-128`); how much of the harness it lists follows `machine.mode` (DEC-0118)
([node summary](docs/specification/node-summary.md#the-summary)).

**Harness baseline**: The policy key `harness.baseline` (DEC-0101): what an organization expects every machine to run,
items by kind and name, signed with the policy and read from its `mdm` and `server` layers only; `minVersion` only for
a coding agent or a plugin, `digest` only for a skill or a plugin (DEC-0102). A node summary's `drift` gives one state
per item in its order, `missing`, `stopped`, `changed` or `outdated` (`FAC-SEM-128`,
[node summary](docs/specification/node-summary.md#the-baseline-and-the-drift)).

**Repair request**: `repair-request/1` (DEC-0101): an organization's ask that a node run one package by `agentRef`,
version and digest, carried in a check-in response's `records.repairs`, signed like a policy layer by a key of the
current policy key set, within a window of at most 7 days. The node runs it only as `repairDecision` answers
(`FAC-SEM-129`): a verified signature, this device and organization, inside its window, an unexpired policy, a package
`repair.packages` lists, and the person told before it started; a repair id runs at most once, and its one
`repair-result/1` is sent again unchanged for a redelivered request (DEC-0102)
([node summary](docs/specification/node-summary.md#repairs)).

**Stream epoch**: The epoch a device's collectors use, issued by the server at enrollment and greater than
every epoch issued to that device before; it attributes events, and a lost counter means re-enrolling
(DEC-0030, DEC-0031).

**Delegation grant**: A **Standing grant** that names an `audience` — the one agent its principal may
call — with that agent's `capabilities` and an `effectCeiling`. The hub mints **Delegation tokens**
only under one (DEC-0039).

**Delegation token**: A JWT of at most ten minutes, signed by the estate hub (Ed25519), that names the
**Principal**, the **Actor chain**, exactly one callee, the capabilities and effect ceiling, and the
grant a call is under (`fabric-delegation/0.1`, DEC-0039). The callee checks it offline against the
estate's published keys. Not the service's descriptor token, which stays the host's. It names exactly one
grant (DEC-0045).

**Trust tier**: Where a caller stands against the machine boundary (DEC-0045, delegation DL-25): **T0** the
operator's own machine, **T1** an enrolled machine of the same owner, **T2** everything else. A callee requires no
**Delegation token**, approval or grant record of a T0 or T1 caller; money limits and human gates bind at every tier.
A `relayed` action from a T0 or T1 caller carries the operator's decision (**Relayed decision**, DEC-0121).
Over the relay a node places a sender in T1 from the estate record it applied (`relayCallerTier`, DEC-0106).

**Adaptation plan**: What a person moves into an organization they join: projects, history, results and schedules.
The plan's draft and the inventory it is chosen from stay in the person's Fabric; only its organization part, what the
person chose and their requests to the organization's administrators, leaves for that organization (OM-7, DEC-0129,
[membership](docs/specification/membership.md#what-leaves-a-persons-fabric)). A project's entry is the estate revision
the person's passkey signs, never part of the plan that leaves.

**Family**: The operator's agents: every agent placed on a machine of the operator's estate and the operator's own
local sessions, which a callee recognises only by placing them in **T0** or **T1** (any process of the owner's OS account,
one the owner did not install included); never a caller's own claim. Open to everything open to the operator in the
context the call runs in, within the money limits, the human gates, the credential source, the contexts' routing, the machine profiles on calls over the relay and, for a relayed action, the operator's decision or a mandate. Not a context and not a tier of its own (DEC-0130, DEC-0137, [delegation](docs/specification/delegation.md#the-family-and-the-agent-network)).
Every other reachable agent is in the agent network beyond the family: **T2**, open to what its context was granted.
The agent network is not **Network** (NET-1, a context's machines). Unrelated to the relay family (the relay's
documents), a runner's provider family or a capability family (`memory/0.1`), where family names a set of documents, providers or
capabilities.

**Narrow credential**: A credential an agent instance asks its organization for (`credential-request/1`), issued
by the organization's issuer from an account its door holds and delivered sealed into that organization's context on
the agent's machine (`fabric-credential-envelope/1`), ending at most 30 days after it was issued (DEC-0111).

**Call record**: One call between two agents (`call-record/1`): the agents, the context, the capability, the times,
the outcome and the cost, never a person, an argument or an output; kept apart from usage reports (DEC-0111).

**Keyed digest**: An HMAC under the estate's digest key (`keyedDigest`), so machines compare two credential values
without moving either (DEC-0111).

**Machine profile**: What a machine of an estate may do, in the signed record (DEC-0106): `full` (the default), `member`
(no hub key) or `view` (no placement, no secret, no hub key; over the relay it calls and is called only to read, and
reports to its hub like any machine, DEC-0132); a
call between machines over the relay that a profile does not allow is refused `profile-forbids` ([machine calls](docs/specification/machine-calls.md)).

**Machine report**: What one machine of an estate tells its hub machines (DEC-0132): those of the revision it applied,
both during a hub move, and the hub of a newer revision it refused. It carries the estate revision it applied, its
heartbeat, its revocation-delta head and the window leases it holds, plus the newest expired lease of each slot until
its window instance ends, each with what it spent, by the check-in's own `records` names, sealed to the hub's `#kem`
over the relay so the relay reads none of it (on the hub's own machine, read from the node's `machine.report` over the
local channel instead). Never sent to an organization server (DEC-0128 UE-2). Not a **Node summary**, which goes to an
organization ([relay](docs/specification/relay.md#the-machines-report)).

**Small-order key**: An Ed25519 public key whose point has order 1, 2, 4 or 8 — libsodium's seven encodings, sign bit
ignored. Anyone can forge a signature under one, and Node 20 and 22 accept the forgery, so every Ed25519 check in
the contract refuses such a key before verifying (`src/ed25519.ts`, DEC-0045, CT-29).

**Package**: One version of an agent or a skill set as one folder, described by its `fabric.package.json`
(`fabric-package/1`, DEC-0050): the files with their SHA-256, the service template, secret slots by name, what it
requires, cost presets, the **Result signal**, the state that moves, the evals receipt and its dependencies. Its
**Package digest** names it; its publisher signs it and an organization countersigns it (DEC-0051)
([package](docs/specification/package.md)).

**agentRef**: `urn:fabric:agent:<publisher>:<id>`, the name of one agent across its versions, derived from its
package and never chosen. A placement names an agent by it and keeps it when it moves (`FAC-SEM-066`, DEC-0050).

**Package digest**: SHA-256 over the RFC 8785 form of a **Package** without its digest and signatures; through the
listed files it covers the whole folder, and a countersignature does not change it (DEC-0050).

**Result signal**: What counts as done for an agent, declared in its **Package** (`resultSignal`: a name and the
card's "done when …"). Fabric's `result` event names it; that event and the meter's receipts join on the root run.

**Estate record**: One person's estate as signed state (`estate-record/1`, DEC-0055): the passkeys that sign the
next revision, the machines with their device keys and a certificate of each machine's hub key, the packages placed on
each machine by `agentRef`, digest and publisher key, where each secret slot is filled from (never a value), share
grants and revocations. Each revision is whole, names its parent's digest, is valid for at most 30 days and is signed
by a passkey assertion every machine verifies offline ([estate record](docs/specification/estate-record.md)).

**Principal**: In delegation, the person on whose behalf the work runs: the operator, or an external
person under a share grant (a token's `sub`). A grant's `principal` field names who the grant is
given to; for an agent or session grant that is the actor: `urn:agent:<agent id>` names the agent whose id is
the token's outermost `act.sub`, and `urn:session:<agent id>:<session id>` names that agent in that session
(its `act.session`).

**Actor chain**: The agents acting for the **Principal**, the one calling now outermost and each
earlier one nested inside (a token's `act`, RFC 8693), at most four deep; under a partner grant the innermost actor is
the partner organization (DEC-0090).

**Approval document**: `approval/1`, a JWS by the estate key that one person approved one action — bound
by the SHA-256 of its RFC 8785 canonical form — for one callee, used once, within 24 hours (DEC-0039).

**Grant projection**: The hub's copy of each grant it holds, one `<meta.id>.json` file in the standing-grant
shape at its latest revision, in the directory its hub document names `grantsDir` (0600 in 0700, written
atomically). The meter beside the hub reads the grant a verified token names from it; the file authorises
nothing alone (DL-23, DL-24, DEC-0041).

**Task claim**: A **Delegation token**'s optional `task`, the issuing host's task the work runs under. The meter
keys a grant's `task` window on it; else on the first `session` met walking the meter token's actor chain from
its outermost actor; else on the grant itself (`grant:<ref>`), never on a `jti`. An onward token keeps it or
drops it, never replaces it (DEC-0041).

**Refusal code**: One of the contract's seventeen kebab-case reasons a callee, the hub or the meter
refuses (`error.code`, DEC-0039); a product's own words go in `error.data`.

**Session handoff**: The folder a host writes for one coding-agent session before its first turn —
`handoff.json`, `context.md`, `mcp.json`, optionally `brief.md` and `task.md` — in its user data, never in a
repository; format `session-handoff/1` (DEC-0042). Not Fabric's `execution-packet/1`, the integrity layer under it. It is
not the operator session of a service's dashboard ([service](docs/specification/service.md), its lifetime); its
bearer is the session bearer of [delegation](docs/specification/delegation.md) (DEC-0039).

**Fabric's button**: The floating button a dashboard MAY show that opens Fabric on that product through
a **Fabric link**, and says how to get Fabric when it is not installed (DEC-0040).

**Fabric link**: A `fabric://chat` or `fabric://session/new` URL naming a service, a project or a
runner by id. Following one opens a view in Fabric and nothing else; it never carries a secret
(DEC-0040).

**open_link**: Fabric Dashboards' `fabric-dashboards://service/<id>.<instance>[?path=<path>]`, the action that hands a
person a service's page inside the host, signed in by it. Not a Fabric link, which opens Fabric; a raw local address
is only its diagnostic, or the action where the host cannot run (DEC-0123, [service](docs/specification/service.md#page-links)).

**Service**: A long-running agent process following the `fabric-service/0.1`
extension — on the operator's own computer, supervised by the operating system
(a **local placement**), or online at an `https` origin, supervised by its
platform (a **remote placement**, DEC-0019).

**Placement**: Where a service runs, as its descriptor declares it: `local`
(`http://127.0.0.1:<port>`, the default) or `remote` (`https://<dns-name>`). It
changes reachability, supervision and the trust anchor, never the objects a
host reads.

**Service descriptor**: The file an installer writes to announce one installed
service instance: identity, origin, token location, supervisor and paths. It
describes an installation, not a run.

**Well-known document**: The answer a running service gives about itself: build,
process, status, degraded sources and surfaces — unauthenticated for a local
placement, behind the service token for a remote one.

**Setup state**: A degraded source whose well-known entry says `setup: true`: it waits for a person to finish
setting it up, such as a key not entered or a model not chosen. It is not an outage, and a watcher does not alert
on it (DEC-0044).

**Server scope**: Where a host starts a declared stdio MCP server: `project` (the sessions of a project that binds
it) or `on-demand` (the one run that binds it, the default), never `session`, every session (LC-19, DEC-0044).

**Activity event**: One record in a service's events feed — when, what kind, which
level, one sentence a person can read, and optionally a subject, a link and a
request to notify the operator.

**Dashboard floor**: The narrowest viewport, in CSS pixels, at which a dashboard page is fully
usable without document-level horizontal scrolling: 360, or the larger `minWidth` it declares
(`fabric-dashboard/0.1`, DEC-0036). The *host floor*, `max(480, minWidth)`, is the width a host
keeps for the page when its own panes grow.

**Appearance carrier**: The cookie `fabric_appearance` (`v=1&scheme=…&theme=…`) a host sets for a
dashboard's host so the page shows the operator's colour scheme and theme (DEC-0036, ED-8). A cookie
is not isolated by port, so it is per host in a shared cookie store and per service where the host
gives each service its own store; a page applies only the fields it declares in `appearance`
(DEC-0059, ED-6). It carries no secret and no identity.

**Operator channel**: An agent's own messenger channel to its operator
(`fabric-operator-channel/0.1`, DEC-0034), first over the Telegram Bot API: it sends the events
the feed asks to notify and the stops awaiting a person, whose buttons run the agent's own
operations. Off until the operator enables it; it names its bot token and never holds it. Not the
Project board's mirror.

**Link code**: The one-time code an agent issues locally and the operator types in the chat, which
binds the chat and the operator's numeric user id to an operator channel (OC-3).

**Addressed message**: In a group, a message meant for one bot: `/command@ThatBot`, a reply to
that bot's own message, or a press of its own button. A bare `/command` in a group is not
addressed. An operator channel answers nothing else in a group (OC-14, OC-15, DEC-0035), except a bare
`/link CODE` that matches its own pending code (OC-15).

**Settings backup**: A checksummed snapshot (`fabric-settings-backup/1`) of a service's
operator decisions and bindings, kept outside its data directory. A restore only adds missing
rows. It names secrets and never holds them (DEC-0025).

**Canonical form**: The bytes a signature or a digest over JSON covers. The contract has two, and each signed or
hashed document names one ([canonical forms](docs/specification/conformance.md#canonical-forms), DEC-0043): the
**settings form** — keys by code point, `", "` and `": "`, integers only, Python's `json.dumps(sort_keys=True,
ensure_ascii=False)` — for settings backups, device policies and key sets and activity ids; and **RFC 8785**
(JCS) — keys by UTF-16 code unit, no whitespace, ECMAScript numbers — for approvals, the board's idempotency
digest and a revision's `contentHash`. They give different bytes for the same value.

**Provider entry**: The file an installer writes to announce an agent that is not
a service (`fabric-provider/0.1`): its id, its manifest and how to reach it over
MCP. Like a service descriptor, it describes an installation and grants nothing.

**Agent directory**: The agents a viewer can find (`agent-directory/1`, DEC-0104): an estate's, read by its owner's
own sessions, or an organization's, its members reading the listed entries. Derived from placements and share
registrations, never authority: calling an agent still takes its grant; `listed` only hides an agent from discovery.

**Call queue**: Jobs waiting at the node that hosts an agent, per agent and context (DEC-0104): a waiting job stays
`working` with `queued <position> of <length>`, the caller running the fewest starts next, and a full queue answers
`queue-full` with when to start again. Its load (`service-load/1`) is counts and durations per window and context.

**Connections**: What an agent uses (other agents, models, connectors, stores, channels) and whether each works,
declared under its well-known document's `extensions/connections/0.1` so a host draws the chain (DEC-0096).

**Coding-agent catalogue**: The contract's one list of coding agents every product reads
(`catalogue/coding-agents.json`, DEC-0093): install, launch, permission evidence and recipes per agent, keyed by the
stable id (the runner kind where the runners page lists one, else a new name); machine state stays with each product.
**Support quality**: One support channel's quality for a closed UTC day (`support-quality-daily/1`, DEC-0095), as an
event's data an agent that answers people publishes: counts and rates in four families, a metric not computed `null`
and named, never `0`.

**Runner**: An installed coding-agent CLI a host can drive (Claude Code, Codex, …),
known from a catalogue entry that names its binaries, its version command and the
modes (drives) it can be run in. A binary no entry names is never executed.

**Runner route**: The project-pinned, ordered preference list of admitted runner
candidates for one capability served by the local-runner profile, with an
attach/spawn session policy per candidate and fallback semantics: attach to a
session the host already holds first, spawn the next available candidate
otherwise, and record every selection and switch as a **Runner route event**. It
selects which runner serves a request; it grants nothing.

**Runner route event**: The record of one walk of a runner route — a selection, a
switch of a conversation to another candidate, or an exhausted route — with the
probe result of every candidate the walk passed over.

**Model catalogue**: Every model the estate may use, one row per `<vendor>/<model>` id, with its **Model classes**,
endpoints, tool use as last measured and a reference into the live price feed (DEC-0046). Fabric publishes it as
`registry/models.json`. A row MAY carry OpenRouter's provider routing, which changes the upstream, never the model.

**Model class**: One word of a closed vocabulary — `frontier`, `strong`, `cheap`, `code`, `vision`,
`chinese-vendor`, `open-vendor` — that the catalogue gives a model and a spend policy allows. A policy restricts by
class and never chooses. `open-vendor` (DEC-0083): the vendor publishes the model's weights openly, independent of
where the vendor is; descriptive, so a policy neither names it nor is checked against it.

**Model profile**: A named, ordered list of catalogue ids with a fallback policy (`none` or `between-turns`), such
as `default` or `cheap`. Resolved in the order request, agent, binding or project, estate default, then restricted by
the project's **Model classes**; an empty result refuses the launch, naming the policy. It MAY declare what its lane
reads (`reads`: `user-content`, `operator`, `web`); a lane that reads `user-content` has an open-vendor route, and its
runner treats a content refusal or an empty answer as a failed turn (DEC-0083, `FAC-SEM-112`).

**Runner profile**: A runner kind, a **Route** and a **Model profile**. **Route** `subscription` is the operator's own
login, only in its vendor's runner and unmetered; `key` is an issued key whose model allow-list is the model profile.

**Activity telemetry**: The `fabric-activity/0.1` protocol (DEC-0030): records of when an
agent session worked, waited or idled and what each model call used, sent by a collector on a
device in batches. It carries no content and no person attribute; a person appears only as an
opaque `user.id`.

**Telemetry event**: One record of activity telemetry (`telemetry-event.schema.json`) — a
`session.interval`, a `usage.line`, a `buffer.overflow`, a `policy.violation` (by UTC day), a `result`, or a
kind the reader does not know — positioned in a stream by `(device.id, collector.id, collector.epoch, seq)`. It
may name its `account.class` and its root `run` (DEC-0052).

**Account class**: The class of the account a session ran on — `organization` (one of the policy's tenants),
`personal` or `unknown`; a statement about an account, never a person (DEC-0052).

**Root run**: `run.root`, the random per-run id every hop of one execution carries, on which usage lines and a
`result` join without naming a person (DEC-0052).

**Collector node**: One sequence-emitting collector instance on a device. With the device it names a
stream; its epoch is issued by the organization server at enrollment, so a reinstall starts a new
stream rather than rewinding the old one.

**Activity summary**: An `activity-summary/1` document a receiver builds from many devices' events:
cells of agent × skill × project × UTC day × outcome, with no person dimension.

**Access log**: An `access-log/1` document: who read which scope of one subject's data — keyed by
their user id or by a device bound to them — when and why, readable by that subject.

**Device**: A computer enrolled with an organization server under `fabric-device/0.1` (DEC-0031):
a key-bound short-lived certificate (the key in hardware, a platform store or a file, as `key.storage` states) that also attributes everything it sends, a server-issued
stream epoch, signed policy layers and periodic check-ins.

**Policy layer**: One `device-policy` document from `mdm`, `server` or `user`; precedence is in that
order, and a locked key is never overridden by a lower layer.

**Interop**: The `fabric-interop/0.1` extension (and `/0.2`, whose readers accept `null` usage, DEC-0087): how agents are called over MCP:
capabilities as tools, jobs, awaiting a choice, trace context and the hub.

**Job**: Work a capability call started that may outlive the request, reached by a
stable job id through an MCP Task or `fabric.job.get` / `fabric.job.cancel`.

**Quota exhausted**: A job a limit (a provider's quota, a subscription's window; a spend window stays `limit-reached`,
DL-19) stopped: it ends
`failed` with the error code `quota-exhausted` and `data: {retryable, resetsAt?}`; a job a limit only paused stays
`working` with a `statusMessage` in the pause grammar, `quota-exhausted until <UTC instant>` (DEC-0087,
[interop](docs/specification/interop.md#limits-and-uncertain-effects)).

**Outcome unknown (job)**: A job whose effect may have happened and that its provider could not observe: it ends
`failed` with `outcome-unknown`, and its caller reconciles, observing whether the effect happened, and never resends
under a new key (DEC-0087). The board's `outcome_unknown` is the same idea for a project comms request (DEC-0022).

**Folder attribution**: Which Project a folder a coding agent works in belongs to, decided by one function over a
snapshot of the facts (`attributeFolder`, the AT table, DEC-0089) that Fabric, Switchboard and Observatory all run; a
tie attributes nothing ([folder attribution](docs/specification/folder-attribution.md)). Fabric's hub is to serve it as
`fabric.project.resolve` (F9, owed), which answers `pending` while the folder's Git facts cannot be read (DEC-0092).

**Partner**: An organization (an integrator, an agency, an agent studio) that builds agents on the platform and sells them
to companies; named by its organization context `org:<partnerOrgId>`. Its publisher key is trusted only in the contexts
the estate record scopes it to, it reads its agents' usage only as sums per agent and day or period, and it acts on a
company's agents only under the owner's partner grant ([the partner channel](docs/specification/partner-channel.md), DEC-0090).

**Repository identity**: A remote's `host/path` with `A` to `Z` lower-cased (a non-ASCII letter keeps its case), credentials and `.git` dropped (`normalizeOrigin`,
DEC-0089): two clones with one identity are one repository, whatever their branch.

**Intent key**: The idempotency key a caller derives from its intent `{agentId, capability, input, request?}`, a UUID of
version 8 over the SHA-256 of its RFC 8785 form (`intentIdempotencyKey`, DEC-0087), so a resend after a restart or on
another machine is the same request; never a clock or a random value. A provider keeps keys per authenticated caller.

**`fabric-interop/0.2`**: The revision whose readers accept `null` and `partial` in a job's `usage`; a caller names it
in its request's `_meta.protocols`, and only toward such a caller does a provider write them (DEC-0087).

**Trace context**: The W3C `traceparent` (and optional `tracestate`) every call
carries in `_meta`, so that all the calls made for one run form one trace.

**Hub**: The host's MCP surface through which one agent reaches another
(`agent.call`); it enforces access, mints the callee's credential and records one
span per hop. Since DEC-0039 it is the estate's only issuer of **Delegation tokens**, not the only
route: a call carrying a token goes direct, and a call the hub forwards carries the token in
`Fabric-Delegation`.

**Pipeline**: A versioned graph of stages, each binding a capability or checking
the one before it (`pipeline/0.1`). A stage names a capability, never an agent.

**Checker stage**: A pipeline stage that judges its upstream output before any
effect; every effectful stage has one on every path from the start.

**Contract pin**: The one record (`fabric-contract.lock.json`) naming the contract
version and commit a consuming repository builds against.

**Relay**: A server that admits machines on their device keys and carries their messages,
sealed **Secret envelopes** and blobs between them (`fabric-relay/0.1`, DEC-0047): an estate's relay, one estate's
machines; an organization's relay admits its members from the signed member list (DEC-0134), and what it carries
between them is not decided (CT-163). It holds no
authority: it reads nothing it carries, decides no trust tier and never reports a queued command done, and until a
caller's signature is proven it tells it nothing it holds (DEC-0066).

**Admission set**: The signing keys a **Relay** admits — the machines of the estate record it holds,
applied only after `verifyEstateRecord`, minus revoked machines and keys (and the revocations of verified delta
entries), minus keys that could never verify; none once the record's window ends, when open sessions close too. It
keeps strangers out of mailboxes and is not authorization: a recipient decides the tier from the signed sender. An
organization's relay takes its set from the organization's member list (`org-authority/1`, DEC-0129) instead, verified
under the organization's key set, and its handshake names the organization in `auth` and the list in `welcome`
(DEC-0134).

**Revocation delta**: The estate record's fast path (`revocation-delta/1`, DEC-0054): an append-only chain of
entries, one revocation each, signed by an **Estate key** and chained by RFC 8785 hash, so its head is
`{sequence, sha256}`: what a machine reports to its hub and an estate's **Relay** carries in its `welcome` (an organization's relay does not, DEC-0134 OR-2). A revision issued after an entry
lists it ([revocation delta](docs/specification/revocation-delta.md)).

**Window lease**: A hub-signed share of one estate window instance for one machine (`window-lease/1`, DEC-0062):
the meter spends within the smaller of its own remainder and the lease's, fails closed at expiry, and reports `spent`
to its hub over the relay ([window lease](docs/specification/window-lease.md)).

**Entitlement**: The issuer's signed record of what one order entitles one subject to (an organization,
`org:<orgId>`, or one person's estate, `personal`) for at most 38 days: a member allowance, a hosting product, a
support tier and the paid agents, never an amount (`entitlement/1`, DEC-0085). Signed by a key the issuer's
**Entitlement key set** lists, which a root key the verifier pins signs; it verifies in `grace` for 14 days after it
expires ([entitlement](docs/specification/entitlement.md)).

**Entitlement key set**: The issuer's signing keys for entitlements under a rising revision, each with a window, and the
kids it revokes (`entitlement-key-set/1`, DEC-0085), signed by the issuer's root key, which a verifier pins at
installation and which signs nothing else ([entitlement](docs/specification/entitlement.md#issuer-keys)).

**Unlinkable enrollment**: An organization enrollment of a machine that shares nothing with the machine's other
enrollments or its estate: its own `device.id`, keys, kids, telemetry key, collector ids and counters, no estate record
in its check-ins and no estate document in their answers, and in its organization's context a hub key and token issuer
of its own (DEC-0128, [devices](docs/specification/devices.md#unlinkable-enrollments)).

**Membership attestation**: What an organization server states about one person's membership of one organization,
for one reader, for at most a day: the organization, a subject pairwise to that reader, a role (`owner`, `admin`,
`member`), `active` or `ended`, and a revision (`org-membership/1`, DEC-0127). Signed by a key of the organization's
`org-key-set/1`, whose root the person pins in their estate record (`organizations`) when they join, with no
administrator's acceptance. Any organization server issues it, so a reader works with any of them
([membership](docs/specification/membership.md)).

**Draft exchange**: How an organization server's unsigned draft of a key set or a member list reaches the person who
signs it and comes back signed (DEC-0131): the server serves a key set's (`org-key-set/1`) draft at a public route and a member list's
draft only to the organization's administrators and its relay (OX-6), the owner's Fabric (a key set, with the root) or
an administrator's (a list, with their passkey) shows its changes, signs it on the person's confirmation and POSTs it,
and the server accepts only the pending draft, signed. Before the first key set the owner's Fabric registers the root
and its own administrator credential with a one-time claim
([membership](docs/specification/membership.md#the-draft-exchange)).

**Member list**: An organization's signed list of admitted members, the source of its relay's admission set
(`org-authority/1`, DEC-0129): each member by a subject pairwise to the relay, a role, its context's token issuer and
its enrollments' `#sig` keys, for at most 7 days. An organization server drafts it; an administrator's signing passkey,
listed by the organization's root in `org-key-set/1`'s `administrators`, signs it; no server does
([membership](docs/specification/membership.md#the-organizations-member-list)).

**Share grant id**: The `meta.id` of a share grant into an organization, `urn:fabric:share:` and 32 lower-case hex
digits from a CSPRNG, which holds no person's name, address or estate id and is compared as written (`FAC-SEM-117`,
DEC-0086, [share registration](docs/specification/share-registration.md#the-share-grant-id)).

**Share registration**: What the sharer's enrolled node tells an organization server about one share grant into it,
over the device transport: the grant's id, revision, context, the one `agentRef` it runs and its window, or that it was
withdrawn (`share-registration/1`, DEC-0086). The server keys it by the member the certificate binds and joins that
member's `grant.usage` to the agent by it ([share registration](docs/specification/share-registration.md)).

**Signing credential**: A passkey registered under the dedicated signing RP `sign.<domain>` and used for nothing else;
it signs the register's statements (`estate-revision/1`, `org-countersign/1`, `share-grant/1`, `limits/1`,
`enroll-token/1`, `org-authority/1`) in a top-level ceremony (DEC-0063, [signing](docs/specification/signing.md)).

**Event data**: An optional `{schema, value}` on a service feed event: machine-readable fields under a schema the service
publishes, bounded, never a secret; `text` stays the event (DEC-0070, [service](docs/specification/service.md#event-data)).

**App descriptor**: The descriptor of an app a person installs and starts (`lifecycle.manager: "person"`): written by its
installer, or by the app on an install or update; it says the app is installed, never that it runs — liveness is the
app's own file (DEC-0069, [service](docs/specification/service.md#an-apps-descriptor)).

**Session annotation**: A surface's event about a session (Fabric's end of a session, Switchboard's launch), written by
the device's collector as `session.annotation` and never counted; the collector alone writes a session's intervals and
usage lines, joined by the runtime's `session.id` (DEC-0068, [activity](docs/specification/activity.md#one-writer-per-session)).

**Consumer agent**: An agent package that serves nothing and only calls MCP servers it names by role and tools
(`kind: agent` without `provider`); a placement checks the roles and tools before it installs (DEC-0071,
[package](docs/specification/package.md#a-consumer-agent)).

**Local channel**: How Fabric's surfaces reach Project Observatory's node on one machine (`fabric-local-channel/0.1`):
a socket or pipe the operating system proves is the same user's, hello first, consent prompts the other way (DEC-0075,
[local channel](docs/specification/local-channel.md)).
**Proposal**: A change proposed to a project's manager or the CEO (`fabric-proposal/1`): a rule, an agent, a skill, a
listing or a fix, with evidence by reference; a rule is approved by a person, nothing applies itself, and nothing
about a private agent leaves (DEC-0072, [proposals](docs/specification/proposals.md)).

**Protocol revision**: `<name>/<revision>`, the version every document names (DEC-0009); a receiver accepts N and N−1
of the contract's register, lists them in `protocols`, and refuses another with `schema-unsupported` (DEC-0067,
[versioning](docs/specification/versioning.md#protocol-revisions)).

**OpenRouter attribution**: The three headers (`HTTP-Referer` = the product page, `X-OpenRouter-Title`,
`X-OpenRouter-Categories`) an organization product adds to a request it originates to `https://openrouter.ai`, never
to forwarded traffic and never over a user's own attribution; off without a setting (DEC-0065,
[OpenRouter attribution](docs/specification/openrouter-attribution.md)).

**Heartbeat**: A signed timestamp (`heartbeat/1`, DEC-0054) committing to the **Revocation delta**'s head and the
estate revision. A machine whose heartbeat is more than 72 hours old, or that has not applied up to it, refuses what
arrives from other machines and keeps the person's own work.

**Secret envelope**: One secret sealed with HPKE to one machine's key-agreement key (`#kem`) and
signed by the machine that holds its slot (`fabric-secret-envelope/1`, DEC-0047); carried by a
**Relay** as a blob and opened only in the target's vault, under a signed `envelopeSequence` the target's mark of the
placement run guards against rollback (DEC-0066).

## Relationships

- A **Host** registers many **Providers**.
- A **Provider** offers one or more **Capabilities**.
- A run pins one **Binding** per required **Capability**.
- An **Execution context** refers to an **Account pool** but never contains its credentials.
- An **Insight** cites **Observations** and **Evidence**.
- The **Memory Kernel** reads canonical revisions from the **Memory ledger** and
  rebuildable candidates from a **Memory backend**.
- A **MemoryPack** cites ledger revisions and produces a **Memory use trace**.
- A **Promotion** points to a project **Insight**; it does not copy the source record.
- A node holds a **Coordination lease** and a declared **Write scope** while it works.
- A **Service descriptor** names one **Service**; the **Service** answers a
  **Well-known document** and publishes **Activity events**. A **Service** may also be a
  **Provider**; being described grants it no project access.
- A **Provider entry** names one **Provider** that is not a **Service**; an id belongs
  to one of the two, never both.
- A **Runner route** orders admitted **Runner** candidates for one **Capability**;
  a run pins one route revision per local-runner binding, and every switch is recorded.
- A **Runner profile** names one **Model profile**, whose models are **Model catalogue** ids; the project's **Spend
  policy** restricts them by **Model class**, and a key route's key admits exactly them.
- A **Device** hosts one or more **Collector nodes**; each emits **Telemetry events** in its own
  stream, and a receiver aggregates many devices' events into an **Activity summary** without a
  person dimension.
- Every read of a subject's raw telemetry is an entry in that subject's **Access log**.
- A **Pipeline** stage binds a **Capability**; the **Provider** serving it is resolved
  to one admitted **Binding** when a run starts.
- Every call routed through the **Hub** carries **Trace context**; a **Job** keeps its
  id across restarts of the agent that owns it.
- The hub issues a **Delegation token** under a **Delegation grant**; the call goes direct to the
  callee, which acts for the token's **Principal** and names the outermost actor of its **Actor
  chain** as its caller. An onward call's token adds one actor and narrows, never widens.

## Flagged ambiguities

- A2A `AgentSkill` is a remote capability advertisement, not an Agent Skills
  `SKILL.md` instruction package. Contract documents must qualify the term.
- `Product manager` replaces Fabric's earlier `project manager` term: exactly one
  product manager owns each project's backlog and execution graph.
- `Runtime` and `model` are separate concerns. Contract `0.1.0` selects a runtime; the agent chooses its model
  within the classes a project allows. Model profiles, runner profiles and the model catalogue are contract objects
  since DEC-0046 ([runners](docs/specification/runners.md#runner-and-model-profiles)).
- `Activity event` (a service's events feed, `fabric-service/0.1`) and **Telemetry event**
  (`fabric-activity/0.1`, schema `telemetry-event`) are different records: the first is one sentence
  a service tells its operator, the second a measured interval or call. Specifications qualify which
  one they mean.
- A **Collector node** is not a work-graph node: `run.task` names the latter.
