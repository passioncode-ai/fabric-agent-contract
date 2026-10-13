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

**Estate key**: The signing key the estate's hub holds: it signs delegation tokens and approvals, and its
public half is published for callees to verify offline ([delegation](docs/specification/delegation.md),
DEC-0039). The **Estate record** certifies each machine's hub key (`hubKey`, DEC-0055); a verifier that reads it
trusts a `kid` only while the revision it reads certifies it — one `verifyEstateRecord` accepted, not lower than the
highest its machine applied — and refuses otherwise `kid-not-certified`, or `issuer-unavailable` when the revision is at
fault (the meter: `principal-unproven`, with the detail in its reason) (delegation DL-14, DEC-0060). The module is
`src/hub-key-rules.ts`. It also signs
**Revocation delta** entries and **Heartbeats** (DEC-0054).

**Operator session**: The signed-in session of a service's dashboard. It ends 12 hours after its last use and
never later than 7 days after sign-in (`service.md` §The session's lifetime; tightened by DEC-0039).

**Identifier**: A URI naming an agent, a project, a proposal, a setting or an account
(`common.schema.json#/$defs/uri`). Two identifiers are the same when their normal forms are equal — RFC 3986 §6.2.2 for
a URI, RFC 8141 §3.1 for a URN, any other string as it is; writers SHOULD emit the normal form; readers MUST compare by it
([identifiers](docs/specification/identifiers.md), DEC-0076).

**Usage report**: What a service publishes about its own spend at `surfaces.usage`, with every spending limit
it applies, enforced or not (DEC-0021, DEC-0027), and MAY attribute its calls to projects and task runs, never
to a caller (DEC-0065).

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
account (organization-managed or personal), the `residency` (ISO 3166-1 alpha-2 codes) and the `maxDataClass` (public,
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

**Project directory**: What `com.directory` answers: the addressable Projects of the caller's estate, each with its
id, name, listed capabilities and their responder state, and nothing else. Only a managed or enrolled session of a
Project of the same estate reads it (T0 or T1 of the estate's owner); asserted, viewer and share-grant principals and
every other estate are refused `not_authorized`, and the caller's own Project is never listed. An operator may unlist
a Project: that hides it from discovery only, and it stays addressable by id
([project communication](docs/specification/project-comms.md#project-directory), DEC-0073).

**Board receipt**: The one answer of every successful board mutation (`comms-receipt.schema.json`): `ok`,
`repeated`, and the message, request, slot or attempt the call touched; never a sequence number (DEC-0073).

**Board hold**: The operator's hold, set in the host, on a thread, a Project or a (Project, capability) responder slot.
While it lasts the board refuses new work in its scope `held` (retryable), never refuses a cancel or a read, and
never refuses the current responder's calls on started work; if that responder's session ends under a slot or
Project hold, enrollment and replacement wait for the lift, and its accepted work stays held as C4 says. It is not an
authority change and bumps no generation
([project communication](docs/specification/project-comms.md#holds), DEC-0079). Not the C4 sense in which accepted
work is *held* past its deadline.

**Owner settlement**: The estate owner (the estate's operator principal, `trusted`) settling an `outcome_unknown`
request through `com.reconcile` while no responder holds its slot: observed only, with a required summary, never to
`cancelled`; the request then reads `settledBy: "owner"` ([project communication](docs/specification/project-comms.md#owner-settlement),
DEC-0081).

**memory/0.1**: The wire on which agent memory is served, first by Project Observatory
([memory and learning](docs/specification/memory-and-learning.md), DEC-0023).

**Key set**: The device's set of trusted policy keys, signed by the organization's **Policy root key** and
rotated with overlap; a policy counts only when signed by a key of the current set valid when the device verifies (`FAC-SEM-041`, DEC-0053), and the set
itself is checked under the root key (`FAC-SEM-046`) ([devices](docs/specification/devices.md), DEC-0031).

**Policy root key**: The organization's root key, delivered at enrollment, that signs **Key sets** and nothing
else (DEC-0031); Ed25519 or ES256, naming its algorithm, and certified by the offline root an installer pinned when
it pinned one (**Root certification**, `FAC-SEM-069`, DEC-0053).

**Device key**: A device's non-exportable key. Beside DEC-0031's enrollment key, `deviceKeys` lists exactly one signing
key `<device.id>#sig` (ES256 or Ed25519) and at most one key-agreement key `<device.id>#kem` (ECDH over P-256), never
one key in both roles (`FAC-SEM-044`, DEC-0056); a P-256 key is a valid point by SEC 1 §3.2.2 (`isValidP256Key`,
DEC-0053).

**Device request signature**: The HTTP message signature (an RFC 9421 subset, label `fabric-device`) a device puts on
every batch, check-in and rotation request with its `#sig` key, beside mutual TLS, so a receiver behind a host that
terminates TLS still proves the device's key; its `keyid` is the certificate's serial, and a (serial, nonce) pair is
accepted once (`FAC-SEM-077`, [devices](docs/specification/devices.md#transport), DEC-0056).

**Collection start**: When a device starts collecting for the organization: the notice's acknowledgement, or under
device management the earlier of that and the policy's deadline. Nothing that occurred before it is uploaded
(`FAC-SEM-068`, DEC-0053).

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
earlier one nested inside (a token's `act`, RFC 8693), at most four deep.

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
`chinese-vendor` — that the catalogue gives a model and a spend policy allows. A policy restricts by class and never
chooses.

**Model profile**: A named, ordered list of catalogue ids with a fallback policy (`none` or `between-turns`), such
as `default` or `cheap`. Resolved in the order request, agent, binding or project, estate default, then restricted by
the project's **Model classes**; an empty result refuses the launch, naming the policy.

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
a hardware-bound short-lived certificate that also attributes everything it sends, a server-issued
stream epoch, signed policy layers and periodic check-ins.

**Policy layer**: One `device-policy` document from `mdm`, `server` or `user`; precedence is in that
order, and a locked key is never overridden by a lower layer.

**Interop**: The `fabric-interop/0.1` extension: how agents are called over MCP —
capabilities as tools, jobs, awaiting a choice, trace context and the hub.

**Job**: Work a capability call started that may outlive the request, reached by a
stable job id through an MCP Task or `fabric.job.get` / `fabric.job.cancel`.

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
sealed **Secret envelopes** and blobs between them (`fabric-relay/0.1`, DEC-0047). It holds no
authority: it reads nothing it carries, decides no trust tier and never reports a queued command done, and until a
caller's signature is proven it tells it nothing it holds (DEC-0066).

**Admission set**: The signing keys a **Relay** admits — the machines of the estate record it holds,
applied only after `verifyEstateRecord`, minus revoked machines and keys (and the revocations of verified delta
entries), minus keys that could never verify; none once the record's window ends, when open sessions close too. It
keeps strangers out of mailboxes and is not authorization: a recipient decides the tier from the signed sender. An
organization's relay has none of its own until `org-authority/1` (Fabric D8).

**Revocation delta**: The estate record's fast path (`revocation-delta/1`, DEC-0054): an append-only chain of
entries, one revocation each, signed by an **Estate key** and chained by RFC 8785 hash, so its head is
`{sequence, sha256}` — what a check-in reports and a **Relay**'s `welcome` carries. A revision issued after an entry
lists it ([revocation delta](docs/specification/revocation-delta.md)).

**Window lease**: A hub-signed share of one estate window instance for one machine (`window-lease/1`, DEC-0062):
the meter spends within the smaller of its own remainder and the lease's, fails closed at expiry, and reports `spent`
in its check-in ([window lease](docs/specification/window-lease.md)).

**Signing credential**: A passkey registered under the dedicated signing RP `sign.<domain>` and used for nothing else;
it signs the register's statements (`estate-revision/1`, `org-countersign/1`, `share-grant/1`, `limits/1`) in a
top-level ceremony (DEC-0063, [signing](docs/specification/signing.md)).

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
- `Runtime` and `model` are separate concerns. Contract `0.1.0` selects a runtime;
  model selection remains internal to the agent.
- `Activity event` (a service's events feed, `fabric-service/0.1`) and **Telemetry event**
  (`fabric-activity/0.1`, schema `telemetry-event`) are different records: the first is one sentence
  a service tells its operator, the second a measured interval or call. Specifications qualify which
  one they mean.
- A **Collector node** is not a work-graph node: `run.task` names the latter.
