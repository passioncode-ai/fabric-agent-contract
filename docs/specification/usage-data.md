# Anonymous usage and error data

A product the operator's estate ships to people (an app, an agent, a service) may collect anonymous data about how it is
used and about its errors, to improve that product and, when it sends an installation id several products share, to
count one installation once across them; a product may also collect none. The second purpose is DEC-0157's reading of
the operator's words, pending his answer (open question [OQ-0013](../OPEN_QUESTIONS.md)), so the notice wording that
follows from it (UD-1) is provisional. The operator
decided on 2026-11-04 that this is on by default, told once at the first start by a notice that is not a question, and
switched off per product in its settings (DEC-0157; the knowledge base's roadmap RM-13 and plans.md item D). What the data
is, where it goes and how it is read stay each product's; the rules below are what every such product shares. A service
the estate hosts, which people reach over the network and which installs nothing on their machine or in an account or
server of theirs, is outside this page (DEC-0157's reading of the operator's "every product", pending his answer,
OQ-0013); a hosted service that ships an installed product (an app, an agent, a command
line tool) is under it for that product, and a component the estate ships to run on the person's own server (such as
Fabric Inbox's server, whose counts its notice names, `desktop/main.cjs` line 937 at `1395416`) is under it for that
component; where an organization deploys such a component on its own server for its members, the switch is the
deploying organization's, and its members are told by the component's notice (UD-1).
The key words MUST, MUST NOT, SHOULD and MAY are used as in RFC 2119.

- **UD-1, on by default, told once.** A product that collects usage or error data collects it from its first start, for
  a new install and for an install that never answered its switch and never declined it (UD-2); a person answers a
  switch by setting it under a prompt or in a product's settings. It MUST NOT send any of it before its notice has been
  shown once where the person reads it: at the first start that opens its window, or for a product without one (an
  agent, a command line tool, a service) or one that starts without opening it (at login, in the background, by a silent
  update) its first output to the person (a command line tool's first run in a terminal the person reads, an agent's
  first answer in the person's chat, the installer's output, a service's page on its first open; a line only an agent's
  tool reads is not that place); for an existing install, the first such place after the version that turns it on. What
  it collected before that is sent only after the notice, or dropped, and the notice says so when it may be sent at
  once. The notice says what it collects and for which purposes (to improve the product, and counting one installation
  once across the products that share its installation id, when it sends a shared one, the second being DEC-0157's
  reading of the operator's words, pending his answer, OQ-0013), and, when it sends an
  installation id, that id, whether it is shared and with which products, that it ties this install's events together
  (and, when shared, to those products' events) even though no person is named, and that turning the switch back on
  resumes a shared id; when it sends a session id (UD-3), that it does and that the session id ties one session's
  events together; where the data is sent (naming the organization that receives it meets this, its usage data page
  naming the host, UD-5), or a link to that page, which says; and where the switch
  is. The products that share the id are named as of the product's version,
  with a link to one maintained list of them. Where that list lives is the sharing products' owners' choice: the
  estate's privacy page on passioncode.ai (the launcher's PC-137 in the knowledge base's plans.md, its launcher row at
  `c84c7a40`, asked and not yet published) would be one home for every product; until one home exists, each product
  keeps its own copy on its usage data page (UD-5) and updates it in the version that re-shows the notice. When what the notice states changes
  (a new purpose, or a new product sharing the id, which the notice states from the product's next version that ships
  the updated list), the product MUST show it again, once, where the person reads it, before it sends data under the
  change, as a device policy's `noticeVersion` marks a new notice ([devices](devices.md#policy)). The notice is a
  notice, not a question (the operator's decision as the knowledge base records it: roadmap RM-13, which replaces the
  earlier answer-first rule, and plans.md item D, "a notice at first start (not a question)"): the product holds its
  first send until the notice has been shown where the person reads it and MUST NOT hold it until the notice is
  answered; a person who does not answer it is on. An acknowledgement (an OK) MAY be offered, but nothing waits on it
  beyond the notice having been shown (the operator's «чтобы подтвердить», quoted in DEC-0157's Why, read under RM-13's
  "not a question"). Where the platform's own consent (such as Firefox's built-in data consent) or the product's privacy
  review for a market (UD-3) requires an answer first, the product asks there, sends nothing until it is answered, and
  treats no answer as off in that place; that is not a UD-1 debt, pending the operator's answer on the EU's ePrivacy
  rule (the knowledge base's roadmap RM-13; okolos B-216).
- **UD-2, the switch is the product's own.** Each product has its switch in its own settings, and that switch governs
  that product alone. Off MUST stop that product's collection of both usage and error data from then on and MUST drop
  what waits to be sent; off does not remove data already sent (UD-5). An installation id the product owns MUST be
  deleted at off, and turning the switch on again MUST make a new one; a shared installation id (one several products
  read) MUST NOT be deleted or rotated by any one of them: the product stops sending it, and a reset of the shared id is
  a decision for the products that share it together, none of which offers one today. A person who declined stays off:
  the default does not reverse their answer (the knowledge base's roadmap RM-13, "an explicit earlier «no» stays off";
  board reply `cbea0b76`, a reading of the operator's decision). A decline is an off the person set under a prompt or in
  a setting that said it governed this product: the product's own switch, whenever it was set; or a shared switch's off
  (an `analytics: false` written in a shared file under a prompt or a setting that said it governed every app reading
  that file) given before this product first sends, which is an earlier no and stays off for it. Since the shared file records
  neither who wrote an off nor under what words, a product treats any shared `analytics: false` present before its
  first send as that earlier no. For an install that sent before the product's version that meets this rule, the first
  run of that version stands in for the first send: a shared `analytics: false` present then, on an install whose own
  switch the person never set, is read as the earlier no. After a product's first send (for such an install, after
  that first run), its own switch alone governs it, and an off written in the shared file later does not turn it off
  (plans.md item D, "one product's switch never turns another off"). A shared file that exists but cannot be read
  when the product reads it before its first send (or at that first run) is no answer: the product MUST send nothing
  in that run and reads it again at its next run. A product's own switch MUST NOT write the shared
  file's `analytics` field; a product whose switch wrote it under words that governed every reader stops writing it
  from the version whose switch governs it alone, and leaves an off already written there, which stays the earlier no
  for products that have not yet sent. Fabric's live setting says its switch governs every
  app ("One switch for every PassionCode app on this computer", its `en.ts` line 864 at `eafcf2e4`): for a product that
  has already sent, that is a false promise, which the person reads until Fabric's switch for Fabric alone ships (its
  CO-496).
- **UD-3, anonymous.** "Anonymous" here means the data names no person; it is not unlinkable: an installation id ties
  one install's events together, and a shared one ties together the events of every product on that machine that sends
  it, which the notice (UD-1) and the privacy text (UD-5) say. The data MUST NOT carry a person (a name, an email
  address, a phone number, an account, billing or store id, an IP address kept with the data, a hardware or advertising
  id), a credential, a path or a file name from the person's machine or data, or any content or text a person wrote or
  received. A product that creates an installation id, its own or the shared file's, MUST make it a random UUID for
  analytics only, never derived from another id, and the installation id a product sends MUST be of that form. A
  product MAY also send a session id: random (it MAY carry the session's start time, as the Aptabase SDKs' ids do),
  never derived from another id, kept only in memory and renewed no later than after an idle hour; it is no
  installation id and ties together only one session's events. Neither id is a
  user identifier in the sense of [data classification](governance-and-roles.md#data-classification), and data that
  meets UD-3 is `confidential`: install and active counts and error counts of the estate's products are the table's
  "private metrics", so an insight from them is promoted only anonymized and after policy review. It differs from activity telemetry's `user.id` ([activity](activity.md)), which
  names an organization membership or a local profile and makes the events that carry it personal data; a random
  installation id bound to no account names no one, and a product that binds either id to an account leaves UD-3
  (below). Whether a stored random id needs prior consent in a given market
  (the EU's ePrivacy rule, which the knowledge base's RM-13 records as the operator's open question) is a product's
  privacy review, not this rule's. The product, every service it sends the data to, and every service that reads it there, MUST NOT
  join either id with an account, purchase, billing or advertising record; data so joined, or bound to an account, is no longer anonymous
  under these rules, is `personal`, or `regulated` where the product's privacy review finds it legally controlled,
  needs its own consent and is never described to the person as anonymous. Properties are facts about the
  product (a version, a kind, a count). Error data names an error's kind, its place in the product's own code and the
  version; a message or a stack frame that may carry a person's content, a path from their machine or a credential is
  left out or cleared of it before it leaves.
- **UD-4, the switch is the person's.** An agent MUST NOT turn on a product's switch a person turned off, except on that
  person's own word for that switch; it MUST NOT send usage or error data around a switch that is off. An agent takes
  that word only when the person is its operator, as AP-3 admits ([service](service.md#actions)): a decision the
  operator gave that names the switch, the operator's answer to the product's own elicitation (AP-2), or an
  `approval/1` the operator gave for that switch ([delegation](delegation.md#approval-approval1) DL-18);
  never a mandate (the switch is a
  `change-policy` effect, which no mandate covers, [delegation](delegation.md#the-operators-mandate) MD-3), never an
  `approval/1` of another approver and never a standing rule. Any other person turns their switch on in the product's
  settings, and the agent says so. An agent does not decline a person who asks it to turn their switch off: the
  operator's own switch it turns off on the operator's word, relayed under AP-2 (the product's own checks still apply,
  so a T2 caller (any caller the callee cannot place in T0 or T1) brings an `approval/1`, [delegation](delegation.md#trust-tiers) DL-17, DL-18
  and DL-25), and anyone else it points to the setting, since off only protects them. Where the notice is not a
  question (UD-1), turning a product's usage data on or off is a `relayed` action under AP-2 and AP-3, not AP-4's
  consent (a human gate, DEC-0121). Where UD-1's ask-first branch applies (the platform's own consent or a market's
  privacy review needs an answer first), turning the switch on is AP-4's consent, which no agent gives: its action has
  `gate: human` and `humanStep` `consent`, and the agent hands the person the link to that step
  ([service](service.md#actions) AP-4; [delegation](delegation.md#trust-tiers) DL-26); turning it off there stays
  `relayed`, through an off action of its own, since one action that turns the switch both ways there would be
  `gate: human` both ways. On the product's side, a service whose app or page offers its switch offers it on its agent
  surface, as AP-1 requires, and MUST declare it as an action whose tool declares the effect `change-policy`, with
  `gate: relayed`; where UD-1's ask-first branch applies, the action that turns it on has `gate: human` with
  `humanStep` `consent`, and a separate action that turns it off has `gate: relayed`. The action is declared in the
  service's actions extension (AP-1), and the effect on its tool's manifest capability
  ([interop](interop.md#c31-capabilities) C3.1; a `fabric-service/0.1` well-known document lists capability names
  only, `surfaces.mcp.capabilities` in [`service-well-known.schema.json`](../../schemas/service-well-known.schema.json)), so a service that offers its switch to agents and ships no manifest owes one for that tool. A product outside
  `fabric-service/0.1` (such as the launcher) that offers its switch on an agent surface declares it the same way. So
  `actionDecision` takes a relayed
  one only as its table takes a `relayed` action ([service](service.md#actions)), never under a mandate (MD-3), and a
  standing rule is never a decision (AP-3); a switch reachable through an action whose gate is `none` is nonconformant.
  An accepted `approval/1` still decides that relayed action at any tier (AP-2; `actionDecision`'s row for a `relayed` action with an accepted approval; DL-18), so the
  agent-side limit above is the only bar on that form: the contract adds no product-side refusal, since an approval is
  a signed decision of an approver the product trusts for that action's digest (DL-17, DL-18), and refusing it for one
  action would split AP-2's single table.
- **UD-5, no machine declaration yet.** A product MUST state in its own documentation (its privacy text and a page on
  its usage data) what it collects, the installation id it sends (when it sends one) and whether it is shared, where it
  sends the data (the organization that receives it and its host), where the switch is, how long the data is kept, the version that turned collection on by default, and
  whether data already sent can be erased and how. Where erasure needs an installation id, the product either shows that
  id beside the switch before off deletes it and keeps its erasure route working with it, or says beside the switch that
  turning off ends erasure of what was sent. A product whose uninstall deletes its installation id says in its privacy
  text whether erasure of what was sent survives the uninstall; erasure under a shared id needs every sharing product's
  agreement (as a reset does, UD-2), and the product says so where it describes erasure. The contract defines no
  well-known member for it: no host reads one today. A host that wants to show it asks for one, and a later decision
  adds it.
- **UD-6, not activity telemetry, not operations digests.** [Activity telemetry](activity.md) (`fabric-activity/0.1`,
  DEC-0030) is an organization's record of its people's agent sessions, sent by an enrolled device
  ([devices](devices.md), DEC-0031) to that organization's receiver under its own notice and consent (DEC-0030,
  DEC-0052). UD-1 to UD-5 do not govern it, and data of one kind MUST NOT travel in the other's channel. A product's
  [operations digest](ops-digest.md) (DEC-0153) is its own record of counts on the machine where it runs, read by a
  collector in the same OS account (OD-9). Sending a digest, in this rule, is sending it to anyone but the person (a
  product owner or another party), the operator reading his own machines counting as the person. A digest that is not
  sent (it stays on its machine, or reaches only the person) is not usage data under this page, so a product's OD-9
  declaration stands whatever its switch says, and a product that collects no usage data may declare one. The condition
  is on sending: a collector that sends a product's digests MUST send them only for a product whose switch is on and
  whose notice (UD-1) was shown, and never for a product that has no switch; digests sent, by whoever sends them, are
  usage and error data under that product's switch (UD-1 to UD-5). A collector that cannot read a product's switch and
  notice state (UD-5 declares none on the machine) sends none of that product's digests; a host that wants to send them
  asks for the UD-5 member. A collector that hands digests to a store on the same machine does not send them, and a
  store that later sends them is such a collector. A read of a product's or a component's digests by the person, or by
  an agent acting for them, on machines or accounts of theirs, where no product owner receives the data, is not
  sending; an encrypted backup a store makes to the person's own storage, readable only with a key the person holds, is
  such a case. The condition binds the products under this page (its scope above); a hosted service's digests on its
  own server are its own.

Practice in the estate, read on 2026-11-07 and 2026-11-08 (DEC-0157's Compatibility is the full account, product by
product): Fabric Switchboard, Fabric Inbox and Fabric Dashboards collect and send from their first start, a background
or hidden start included, before their notice is shown, and owe UD-1's "nothing before the notice". They also owe UD-2's kept decline, reading an earlier shared no before their first send (and, at the first run of
their conforming version, a shared off on an install whose own switch was never set, though it already sent): Switchboard and Fabric Inbox read the shared
`analytics: false` only for an install that answered under their earlier rule (Switchboard's
`crates/switchboard-runtime/src/analytics.rs` lines 315 to 322 at `405b789` and its test
`an_install_whose_shared_file_says_off_still_sends_when_never_answered_here`; Fabric Inbox's `desktop/analytics.cjs`
line 295 at `1395416`), and Fabric Dashboards never reads it (`src/core/analytics.ts` lines 9 to 11 at `d43c94e`), so
each sends for an install whose person said no under Fabric's shared switch before it first sent. Fabric Inbox also
sends a baseline without an id when the shared file cannot be read (`desktop/analytics.cjs` lines 307 to 310 at
`1395416`), and owes UD-2's sending nothing in that run. Their notices owe
UD-1's contents: Fabric Dashboards' (`src/core/i18n.ts` lines 86 to 88 at `d43c94e`) names no installation id though
every event carries the shared `install_id`, and no purpose of counting once, so it owes the id, that it is shared and
with which products, that it ties events together, that turning back on resumes it, and that purpose; Fabric Inbox's
(`desktop/main.cjs` line 937 at `1395416`, "an id shared by the PassionCode apps") owes naming those products, the tying of events and the resume; Switchboard's (`src/main.ts` line 109 at `c762821`)
owes naming them, the tying of events and the resume. Switchboard, Fabric Inbox, Fabric Dashboards, the launcher
and Fabric send a session id whose form UD-3 admits (the Aptabase SDKs' form, Unix seconds times 10^8 plus 8 random
digits, kept in memory). Switchboard's (`crates/switchboard-runtime/src/analytics.rs` lines 415 to 424 at `405b789`)
and Fabric Inbox's (`desktop/analytics.cjs` lines 184 to 191 at `1395416`) are renewed after an idle hour and meet
UD-3's session-id rule; Fabric Dashboards' (`src/core/analytics.ts` line 128 at `d43c94e`) and Fabric's
(`apps/desktop/src/main/analytics.ts` line 192 at `eafcf2e4`, made once, since `createAnalytics` runs once,
`apps/desktop/src/main/index.ts` line 1311) last one process and are never renewed after an idle hour, so both owe
UD-3's renewal; the launcher's (`lib/analytics.js` line 244 at `ad978a6`) is made at each run's one send, which
carries that run's events in one request at its end (`after`, line 192), so no idle hour passes within it and it
meets UD-3's session-id rule. Fabric's notice names "a
session id" (`i18n/en.ts` line 864 at `eafcf2e4`), and the other four owe naming it (UD-1). Fabric Dashboards' MCP
`settings` tool, declared with gate `none` (FD-175), lets any agent turn its switch on with no operator decision (its
switch's own action refuses `operator-decision-required` without a decision, AP-2, rather than take the path its
dispatcher keeps for other relayed calls, which runs one without a decision as the caller's own act, `src/mcp/server.ts`
lines 332 to 333 at `d43c94e`), and
Switchboard's agent door (`switchboard_analytics`, `crates/switchboard-cli/src/mcp.rs` line 72, SB-299) takes no
decision; both owe UD-4, and since neither ships a manifest and Switchboard declares no actions extension,
Switchboard owes an action for its switch and both owe a manifest capability for that tool with the effect
`change-policy`. Fabric Inbox's desktop copy, a `fabric-service/0.1` service by its descriptor
(`desktop/fabric-descriptor.cjs` at `1395416`, serving no agent surface yet), offers its switch in its menu
(Share Usage Details, its notice at `desktop/main.cjs` line 937) with no agent twin, and Fabric offers its switch only to its own window
(`analyticsSetEnabled`, `apps/desktop/src/main/index.ts` line 4201 at `eafcf2e4`) and declares no action for it; both
owe UD-4's product side, an action for the switch whose tool's effect is `change-policy`, with `gate: relayed`
(Fabric at CO-496). The products read send it to PassionCode.ai's own self-hosted analytics host, `analytics.passioncode.ai`
(passioncode-platform PLAT-019, live since 2026-10-17, and PLAT-132; Switchboard's
`crates/switchboard-runtime/src/analytics.rs` line 30 at `b99a17b`). Fabric Inbox's notice names that receiving
organization ("Fabric Inbox sends PassionCode.ai anonymous usage and error data", `desktop/main.cjs` line 937), which
meets UD-1's "where"; the other notices read (Switchboard's, which says its counts help PassionCode.ai without saying
who receives them, Fabric Dashboards', Fabric's and the launcher's, each cited in DEC-0157's Compatibility) neither say
where the data is sent nor link a usage data page, so each owes that (UD-1). The host's owner (PassionCode.ai
Platform) keeps the data 730 days (PLAT-132), the retention each product's usage data page states (UD-5), and owns any erasure
route by installation id UD-5 asks a product about (not read here); it admits a reader of the raw events, the shared
installation id included (PLAT-133), which as a service that reads the data there owes UD-3's join rule; where the counts are read
there, each product's conforming version is marked (below). PassionCode.ai's public privacy page (the
organization's site repository `passioncode-ai.github.io`, `privacy/index.html` line 60 at `8c517867`) names only Switchboard and Fabric as sending and says
the switch applies to every PassionCode.ai app on that computer: its owner owes UD-2's switch for each product alone
and, for every product that sends, what UD-5 asks of its privacy text. Fabric sends nothing before the person has answered its question (its ADR-0127, its SCN-134,
"Usage counts: share them?" and "Nothing more is sent until you answer", `i18n/en.ts` lines 868 to 870 at
`eafcf2e4`), which is a UD-1 debt: the notice is not a question and no answer means on. Its notice and settings also
say its switch governs every PassionCode app on the computer and give no purpose, so it owes UD-1's purpose, naming
the sharing products, that the id ties events together and the resume (lines 864, 869 and 870), and UD-2's own
switch; line 864's "One switch for every PassionCode app on this computer" is a false promise for every product that
has already sent, which the person reads until its own record of the operator's decision (its on-demand sessions
specification §8, rewriting CO-496) ships a switch for Fabric alone. Fabric's switch also writes the shared `analytics`
field both ways (`writeAnalyticsSwitch`, `apps/desktop/src/main/analytics.ts` lines 88 to 96, called by `setEnabled`
at lines 305 to 308, at `eafcf2e4`), so under UD-2's earlier-no reading its off decides for every product that has
not yet sent and its on erases a person's earlier no; CO-496 owes UD-2's rule on writing: Fabric stops writing the
field from the version whose switch governs Fabric alone and leaves an off already written there. Fabric Inbox exports
a writer for the shared field that nothing calls (`writeSwitch`, `desktop/analytics.cjs` lines 96 to 103 at
`1395416`), so it writes nothing there today, and under UD-2 it stays uncalled. The consent rules of the estate's growth and
experiments service have a baseline tier (no id) and an identity tier (the random id), both stopped by the switch, and
owe UD-1's notice contents, UD-3's paths and received content, UD-2's shared id kept at off (they delete it) and at
re-enable and their no-switch exception, and UD-3's join rule for the service's revenue attribution. The adapter (FAA-202, open, its target 0.64.0 passed)
owes UD-2 and UD-4 in its kits. The PassionCode launcher sends nothing before its notice and reads a shared "no" at
every run until it first counts (`lib/analytics.js` lines 148 to 155 and `docs/analytics-events.md` lines 57 to 64 at
`ad978a6`), which meets UD-1's timing and UD-2's kept decline; it owes UD-1's notice contents and a notice where the
person reads it (its doc lets another tool show the notice to its agent only, line 50). Okolos turned it on by default
on 2026-11-05 in Chrome and Edge, and its Firefox build follows Firefox's built-in data consent, which UD-1 admits
pending the operator's ePrivacy answer (the knowledge base's roadmap RM-13, okolos ADR-0021 and B-216); the rest of its
practice was not read against these rules. The estate's hosted workspace product is outside the page as a hosted
service; its self-hosted image, a component an organization deploys on its own server for its members, is under it
with that organization's switch (its owner and administrators turn the counting off or on, its ADR-0014 item 3), and
owes UD-3's session id, random per server process per UTC day today rather than renewed after an idle hour (its
ADR-0014 line 24 at `43f04f15`); no self-hosted instance of it runs yet (line 37). A product's install and active counts move at the version that meets UD-1
and UD-2: they drop where the product sent before its notice or past an earlier no (Switchboard, Fabric Inbox, Fabric
Dashboards), and rise where it waited for an answer (Fabric, whose never-answered installs send nothing today and come
on after its notice at CO-496); an installation id a product owns, made anew at re-enable (UD-2), counts that install
again. That version should be marked where its counts are read.
Fabric, the operations digests' collector (its CO-503), sends only its own daily lines, to the local Project
Observatory's `ops.digest.record` (OBS-330) over local stdio, so it sends none of them (UD-6;
`apps/desktop/src/main/opsDigestSend.ts` lines 45 to 47 at `eafcf2e4`); its planned path for other services' lines,
through Observatory's HTTP door with a delegation token (lines 10 to 12), owes UD-6's condition and a test before it
sends them. Observatory stores them (OBS-330) and sends none of them outward, its encrypted workspace snapshot to the
person's own storage being no sending if its key is the person's, which is Observatory's to confirm. Fabric Inbox
writes its OD-9 declaration whatever its switch says (B-210), which UD-6 allows, and its server's `get_ops_digest` tool
(`GET /api/ops-digest`, its `docs/agents/mcp.md` line 278 at `1395416`, B-205) answers the person's own agent from the
server the person deploys, a read UD-6 allows since no product owner receives the data.
