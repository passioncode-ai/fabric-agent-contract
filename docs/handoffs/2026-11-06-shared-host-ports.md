# 2026-11-06: several OS accounts on one computer (CT-228, DEC-0154, accepted 2026-11-07)

## Objective

Answer the operator's request of 2026-11-05, relayed on board thread `1fe66e6e`: read the organization's plan for a
shared computer on which several OS accounts work, compare it with the contract, write a spec per gap, file the rows and
close them in waves. This run drafts the first wave's decision (G1 to G3 and the host label the board agreed) as a
Proposed DEC on its own branch, and files the rest.

## Done

- [DEC-0154](../DECISIONS.md), Status Proposed: counted OS accounts (who counts, read at every start); HA-1 (a port
  recorded per counted account: kept, chosen anew and tested free as HA-1 in `service.md` states it; a one-account
  computer keeps its historical default under the same keep rule;
  a claim `.passioncode-ports.<service-id>.<account>.json` naming the account by uid or SID, rewritten at every start,
  not only when it is missing; the port recorded anyway when the claim's path is squatted; at uninstall it rebuilds the claim from what remains,
  granting nothing);
  HA-2 (the listener's owner checked before any credential and before "healthy", the host state `foreign-user` ordered
  before `foreign`, who checks when the client cannot, a server's refusal of another account's peer, rotation, the
  PKCE loopback redirect, the browser-cookie residue); HA-3 (no token-free loopback door on a computer with several counted
  accounts; forwarders are relays; the single-account gap accepted, CT-238); HA-4 (each counted account and each
  virtual machine is its own device; `device.hostLabel`, its secret kept out of backups, its read rule failing closed,
  sent only once a policy member turns it on, CT-239).
- [service.md](../specification/service.md#several-os-accounts-on-one-computer): the new section, the port claim's
  pointer, `FAC-SEM-009`'s neighbour, the threat model and the cookie residue, the trust anchor, the Install,
  Uninstall, One copy and Start rows, the One copy section, the directories table and `FAC-SEM-010`'s register row;
  [provider.md](../specification/provider.md) and [relay.md](../specification/relay.md): a loopback address under
  HA-2; [embedded-dashboard.md](../specification/embedded-dashboard.md): ED-8's cookie scope explained;
  `schemas/service-descriptor.schema.json`: `paths.data`'s description; `src/semantic-rules.ts`: `FAC-SEM-010`'s
  comment. [delegation.md](../specification/delegation.md#trust-tiers): the header, DL-25's T0 row, the relay
  paragraph and the accepted gap. [devices.md](../specification/devices.md#the-host-label): the device definition, the
  host label, UE's linkable list. [contexts.md](../specification/contexts.md): `org.id` with 128 random bits where the
  label is on. [node-summary.md](../specification/node-summary.md): a `foreign` or `foreign-user` service reported
  `down`. [conformance.md](../specification/conformance.md): the reference module's row and eight rows (installer,
  client, host-state reader, receiving surface, host handing a credential, token-free door, node, setup step), the
  connections reader's row (a `foreign` or `foreign-user` connection reported `down`, W83), and the
  rewritten PL-2 and PL-3 row (the row for PL-2 and PL-3: a loopback address opened only after the listener's owner
  check).
- The host label's reference `src/host-label.ts` (`hostLabel`: link, owner per platform, mode, size), its generator
  `tools/vectors/host-label.ts` (Node's own HMAC, not importing the reference), vectors
  `fixtures/vectors/host-label.json` (68 cases), `test/host-label.test.ts` (which also holds `ORG_ID` equal to the
  schema's `opaqueId`), a coverage floor of 100 in `vitest.config.ts`; the optional schema member `device.hostLabel` in
  `schemas/device-enrollment.schema.json` with a positive and a negative fixture; `service.id`'s description in
  `schemas/service-well-known.schema.json`.
- `CONTEXT.md`: Device redefined; Counted OS account, Port claim, `foreign-user` and Host label added; Trust tier
  narrowed. UX: SCN-056 and SCN-044's alt path in `docs/ux/scenarios.md`; SCR-20's and SCR-30's `foreign-user`
  states in `docs/ux/screens.md`; FLW-17 and FLW-30 in `docs/ux/flows.md`; ST-021 and ST-036 in
  `docs/ux/foundation.md`; FL-7 in `docs/specification/fabric-button.md`; the note in
  `docs/guides/connecting-compatible-agents.md`. RFC 8252's row in `docs/evidence/sources.md`, and RFC 6265's existing row read again (its section 8.5 was already pinned for DEC-0059).
- The gap list as a tracked spec: [2026-11-06-shared-host-gaps.md](../evidence/specs/2026-11-06-shared-host-gaps.md),
  the shared computer's accounts by role only.
- Backlog CT-228 (the DEC) and CT-229 to CT-243 (the state-order vector file, G4 to G11, the single-account forwarder
  gap, the policy member, the fixture catalogue, the organization's display, Fabric's link-back screen, two accounts'
  copies of one product in the operations digests).
- Ids: DEC-0154 reserved by compare-and-swap on origin (under this run's own reservation key); no rule code reserved.
  `DECISIONS.md`'s marker reads `DEC-0155`, `conformance.md`'s stays `FAC-SEM-169`, equal to the counters.

## Readings

- Round 1 at `25ba36f7`: not clean. Unit passed (its notes: the read rule fails closed, `ORG_ID` held equal to the
  schema, the docblock's order of reading; a catalogue gap filed as CT-240). Product failed on seven breaks (an
  undefined account count, the clients the contract does not reach, the host label's unlinkability, the secret in
  backups, the UX scenario, the glossary, three rows without acceptance) with risks (system-account listeners,
  single-account forwarders, the claim catch-up, the sending signal, product facts stated as facts, the installer row
  naming Fabric Dashboards, the plan's private details in the spec). Seam failed on one break (the Install and
  Uninstall rows) with risks (`org.id`'s randomness, the watcher, the organization's display, filed as CT-241). The
  coordinator's decisions on all of them are folded in at the next head.
- Round 2 at `cbc425d7`: not clean. Unit passed with one risk (the bytes validated before the metadata: the reference
  now decides by link, owner and mode first, a file up to 1024 bytes is answered by size, above that a fault). Product
  failed on four breaks: "host" in two senses (the new text now says "computer" for the machine, the section is
  renamed "Several OS accounts on one computer", and "host label" is defined once as the computer's label), one UI line
  for two causes (two lines now), the free-port test moving existing ports (an installer now keeps its instance's
  recorded port), and the A2A sentence on loopback reach (rewritten, with `profiles.md`). Seam passed, with follow-ups
  R1 to R7 folded in. The branch merged GitHub main `1c141418` (PR #245) first. The spec and this handoff were renamed
  to `2026-11-06-shared-host-gaps.md` and `2026-11-06-shared-host-ports.md`.
- Round 3 at `feef4e4d`: not clean. Product failed on five breaks: "host" still meaning the computer in `CONTEXT.md`,
  two conformance rows, the backlog rows, this spec and this handoff (now "computer", file names and "host label"
  kept); the display's wording ("these devices share a computer"); HA-1 restated as decided in the spec's G1 and this
  handoff; SCN-056's expected result against the cookie residue (and an open browser tab as an alt path); and the
  account count failing toward fewer (an account that runs Fabric or an agent service, or has a services directory,
  now always counts). Risks folded: the unproven `org_<base32>` parenthesis removed, `foreign` reported `down` on any
  computer, the Linux folder's limits (claims rewritten at every start), the Windows claims folder created by the setup
  step; SCR-20 and FLW-17 retitled; the appearance cookies' write named. Unit passed (39 vectors and 2816 generated
  inputs against an independent model, 27 of 27 mutants killed), with two notes folded: the negative fixture differs
  from the positive only in its padding bits (`...wR`), and the fixture's `org.id` is described as "at least 128
  random bits" with no encoding named. Seam passed with no break; its risks became S1 to S8, folded in.
- Round 4 at `66e44c3d`: not clean. Product failed on V1 (the claim's rewrite at every start stated as "only when
  missing" in the spec, this handoff and a conformance row) and V2 ("host" for the computer in the reference, the
  generator and the vectors; two cases renamed "the same computer in another organization" and "another computer in
  the same organization"); seam failed on V1. Unit passed (38 of 40 mutants killed, one equivalent; the other, the
  hex check moved before the mode check, is now killed by two vectors, V14: "writable by another account, no bytes
  read" (renamed in round 6: "writable by anyone but the platform's administrator, no bytes read") and "a folder not the administrator's, an oversized file"). V3 to V13, the coordinator's decisions, are folded
  in.
- Round 5 at `190ee95e`: not clean. Product failed on three breaks: FLW-17's goal ("never an outage") and ST-021's
  story did not cover another account's listener (ST-021 widened, FLW-17's goal, entry points, success exit, task
  analysis and traces now cover it), SCR-20's elements and resources (the listener's owner decides first, HA-2 named),
  and the guide's note scoped HA-1 and HA-2 to a computer with several accounts (they hold on every computer; HA-3 on
  a shared one). W4 to W8 folded: the positive landing check, a claim rewritten with every instance's ports, the
  Windows folder's report (once for a missing folder or another ACL, in the health report or log), SCN-056's recovery
  for a root or system listener, and "same computer" in the RFC 6265 row. Unit passed (156 mutants, 4 survivors, the
  shape checks moved after the link or the mode; W10 adds four vectors in which a fault outranks every reason for no
  label, and each such move now fails `test/host-label.test.ts`; W11 defines `writableByOthers` as anyone but the
  platform's administrator in the reference, the vectors' about, `devices.md` and DEC item 4). Seam passed (0 breaks,
  the full suite of 10520 tests green; risks closed by W3, W4, W12: the claim's rewrite at start rebuilt from the
  account's descriptors, atomic and after `service.lock`, in HA-1, the Lifecycle table and CT-228; and W13: SHOULD in
  the conformance row). W14, from DEC-0149's seam reading: `foreign` is unavailable too (a watcher counts `foreign`
  and `foreign-user` as unavailable, as node summaries and connections already report both as `down`), in HA-2, DEC
  item 2, the owed Fabric Dashboards row and the landing target.
- Round 6 at `d47295d5`: not clean. Unit passed (65 of 67 mutants killed; the rest closed by W15, two vectors in which
  a flag that is not a boolean is a fault before the link and the owner). Product failed on W16 (PL-3's owner check
  unknown to ST-036, FLW-30, SCN-044 and FL-7) and W17 (the claim's rebuild had no source for an app without a
  descriptor origin or an app's part). Seam failed on the same break as W17 (no `service.lock` for such an app: its
  own single-copy guard instead); the full suite of 10524 tests was green at `d47295d5`. W18 to W26 folded: the landing
  phrase on one line and its two-sentence target with a negative check, "missing or with another ACL" in G1, who
  moves a port in the rotation trigger, only the service itself rewrites the claim (never what starts it), the
  uninstall rebuilds the claim from what remains, `writableByOthers` and `folderOk` as writable by anyone but the
  platform's administrator, the fault's scope, and the relay and conformance check dropped.
- Round 7 at `8a9373a1`: not clean. Product failed on W27 (the negative landing check could never fail: inside
  double quotes the shell ran `down` and `foreign` as commands; both checks are now in a fenced block, the negative
  one with `grep -cF` and escaped backticks, and both were run on trial files) and W28 (the uninstall still read as
  removing an instance's ports in `conformance.md`, the spec's G1, this handoff and `service.md`; it now rebuilds the
  claim from what remains). W29 to W33 folded: DEC-0149's sentence kept whole at landing, the installer's order
  (descriptor, then the claim rebuilt from all descriptors, the short window accepted), the Fabric Dashboards ask for
  its card's line, FLW-30's traces, the account count read by the service, an installer and a door only.
- Round 7's seam reading: failed on the same break as W27, closed at `c77e67f5`. W34 to W37 folded: an app rebuilds
  its claim after writing its new liveness file, and the guard and the source share the wording "an app without a
  descriptor origin, or an app's part"; SCR-30 shows the `foreign-user` line when no card exists (FLW-30 points to it);
  a round-4 vector's later name; DEC-0154 may land first.
- Round 7's unit reading: passed (101 of 107 mutants killed; the rest closed by W39's vectors: a mode flag that is not
  a boolean behind a link, a link and a failing folder, an owner and a failing folder, an organization id starting with
  a digit, and one vector renamed).
- Round 8 at `7fbe27f0`: not clean. Product failed on W40 (PL-3's owner check scoped to a loopback address; a remote
  `https` origin opens as before, as FL-7 says). Seam passed with 0 breaks. Unit did not run, since W39 changes the
  vectors. W38 and W41 to W50 folded: the landing text in full with its second sentence from DEC-0149's CR and checks
  that read the file as one line (run in bash and zsh on four trial files), ST-036's criterion for this account's
  listener, FLW-30's `foreign-user` exit (on SCR-30 through an agent, where Fabric shows the link through FL-7), the
  PL-2 and PL-3 row named in Done, "declares no port for `FAC-SEM-010`", the guard and the port source told apart
  (`service.lock` for a service with a descriptor, an app's own guard; this service's descriptors, or an app's own
  state after its liveness file), the uninstall from the remaining instances' state only, SCR-30's coverage owed by
  CT-229, and "this service's descriptors in the account".
- Round 9 at `7ce5cc67`: not clean. Unit passed (376 mutants: 319 killed, 53 equivalent, the rest closed by W55's
  four vectors: a failing folder with no bytes read, a failing folder before bytes that are not hex, `system` named on
  a POSIX platform, passing metadata and 32 bytes that are not hex; each mutant tried fails `test/host-label.test.ts`:
  `!folderOk` after the hex check, the hex check between the mode flags, the hex pattern after the size, `system` as a
  POSIX administrator). Product failed on W53 (G1's rebuild still in its wording from before W46 and W50) and
  W54 (W40 not in ST-036 and FLW-30: the remote `https` origin opens as before). Seam failed on the same break as W54
  (the full suite of 10530 tests green). W51, W52 and W55 to W62 folded: the landing text with DEC-0149's CV sentence,
  matched byte for byte after `tr '\n' ' ' | tr -s ' '`; the negative check's exit status 1 and no `set -e`; the
  POSIX meaning of `writableByOthers` and `folderOk`; CT-229's PL-3 fallback test; SCR-30's states and elements; an
  app's own guard in One copy; "declaration" for `FAC-SEM-010`; CT-242 for Fabric's link-back screen.
- Round 10 at `23fd509d`: not clean. Unit passed (U1 folded: two vectors, "on Windows, owned by an account: no label"
  and "metadata passes, hex not a string"; the mutants Windows administrators `{administrators, system, other}` and the
  `typeof hex` check after the size check each fail `test/host-label.test.ts`). Seam passed. Product failed on W63 (the
  Lifecycle table's One copy row still bound every service to `service.lock`; it now lets an app or an app's part guard
  with its own single-instance guard, and the directories table and `paths.data` say `service.lock` is there for a
  service that takes it). W64 to W70 folded: the affects and Compatibility lists, the two UI lines in item 2, "computer"
  in FB's and CONTEXT's cookie scope and a comment, HA-2 pointers in `provider.md` and `relay.md`, the CT-232 check
  counting occurrences, both landing orders.
- W71 after round 10: `embedded-dashboard.md`'s open question says "computer-scoped" and "on that computer" (ED-8),
  as W66 did for FB-6; the two landing orders are copied from DEC-0149's handoff at `1bd70e54` (texts and commands
  byte for byte after joining) and run on trial files in bash and zsh, replacing the description written from W70.
- Round 11 at `bbb5b956`: seam failed on one break, W73. In ED-8 and RFC 6265 section 8.5 a cookie's "host" is the
  URL's host, not the machine, so "per computer" is wrong for a remote `https` origin. W66, W71 and W8 are partly
  rolled back: FB-6, ED-8's open question, CONTEXT's Appearance carrier and the RFC 6265 row say "per host" again,
  with "(the URL's host, RFC 6265 section 8.5; for local services, 127.0.0.1 on that computer)" where the scope is
  stated (ED-8 itself too), and `test/delegation-sealed.test.ts` pins "per host" again. The comment in
  `src/semantic-rules.ts` keeps "another computer" (a remote placement's machine). FB-6's bold scope equals ED-8's
  (checked in Python: True). Unit and product of round 11 were still running.
- Round 11's product reading failed on the same break as W73. W74 folded: the cookie-scope exception to "host"
  stated in `service.md` and the DEC; ED-8's bold scope pinned by a test beside FB-6's (it fails when ED-8's scope is
  changed); the DEC-0149 line range; order 2's references made explicit; G10's "per OS account (per data
  directory)"; the Done list for `service.md` and the files around it; One copy's first sentence naming the guard.
- Round 11's unit reading passed (0 breaks; 65 of 69 mutants killed, 3 equivalent). W75 folded: a vector for an
  organization id that is not a string (the `typeof orgId` check removed fails `test/host-label.test.ts`, 2 tests),
  and the Windows owner of the computer's secret set explicitly (Administrators or SYSTEM, for example `icacls
  /setowner`) in `devices.md`, DEC item 4 and the setup step's conformance row.
- Round 12 at `3c1ea1f8`: not clean. Unit passed (86 mutants, 79 killed, 5 equivalent; the rest closed by W76 (g), a
  vector for a link and an organization id that is not a string; moving the `typeof orgId` check after the link fails
  `test/host-label.test.ts`). Product failed on three breaks: `service.md` named one exception to "host means the
  program" where there are two ("host label" and a cookie's "per host"); the guide's wording that a service runs once per machine; line
  numbers in this handoff that had gone stale. Seam failed on three breaks, the same as W76 (a), (c) and (f). W76
  folded all of them, with the cookie note worded as "here 'per host' is the URL's host" in ED-8, FB-6 and the
  RFC 6265 row, the Windows folder `%ProgramData%\PassionCode` given the same explicit owner as the file, the
  knowledge-base step depending on whether DEC-0149's #628 is merged (both orders end with no "proposed for FD" and
  two "owed by FD"), and the round-10 note on the FB-6 test corrected.
- Round 13 at `545ba274`: not clean. Unit passed. Product failed on one break and seam on three: `id.instance`
  "unique on the machine", "once on the machine" in `profiles.md` and `service.md`, and the host vocabulary rule's
  closed set of two exceptions, which made other readings of "host" (an origin's host, a host name, a page's host, a
  cookie's host scope) false. W77 folded: unique within one OS account's services directory; once per OS account on
  the computer; one rule in the same words in `service.md`, the DEC, `CONTEXT.md` and `devices.md` ("host" never the
  computer except in "host label"; a URL's, an origin's or a page's host, a host name, the `Host` header or a cookie's
  host scope named as such), with the lines it covers reworded where needed (`CONTEXT.md`'s Appearance carrier,
  FB-6's "on that host (the page's host)", the RFC 6265 row and `interop.md`'s "host name"); the knowledge-base step
  per the shared rule with DEC-0149 (after DEC-0154's merge, both clauses quoted, the second lander's check, the
  interleavings and the withdrawal); the order 2 reference named by its bullet; five Windows vectors (64 cases), so
  platform-conditional mutants of the link, mode, size and `org.id` checks each fail `test/host-label.test.ts`; the
  "proposed" markers listed for acceptance; `service.id`'s description and the reference-module row.
- Round 14 at `d6138063`: not clean on all three tiers. The host rule listed the forms in which a URL's host is named,
  a closed list that `signing.md`, `estate-record.md`, `entitlement.md` and others broke; a service's `instance`, the
  overview and the stateless-server sentence still spoke of copies "on a machine"; "proposed" markers were split
  across lines, and three citations had none; unit's risk: three posix-only hex mutants survived. W78 folded: the rule
  is purely negative, byte-identical in `service.md`, the DEC, `CONTEXT.md` and `devices.md` ("In this contract
  'host' never means the computer; ..."); the sweep of `hosts?` found one use meaning a machine (`peer-share.md`'s "moves to another
  host", now "another server"; `session-handoff.md`'s "On a POSIX host" stayed, read as the host program on a POSIX
  system, which writes the folder); W79 extended the sweep: `service.md`'s "a `personal` host" is "a service whose
  `custody` is `personal`", `devices.md`'s and `activity.md`'s TLS-terminating hosts are "a TLS-terminating proxy"
  or "a server that terminates TLS (a platform's load balancer)", `session-handoff.md`'s SH-2 reads "When the host
  runs on a POSIX system", FAC-SEM-143's row "an address whose host is a loopback address" and
  `folder-attribution.md`'s "Git hosting services that serve";
  `instance` and the overview per OS account, "the lifecycle broker"; the split markers joined and a multi-line
  finder added; the shared knowledge-base block pasted byte for byte as its own subsection; four Windows hex vectors
  (68 cases; one more than the three asked, since the `typeof hex` mutant needed a Windows case of its own).
- Round 15 at `df98d10c`: not clean (unit passed; product and seam found breaks). The shared knowledge-base block had
  changed (the after-both check by the lander that makes the edit, once its edit is on the knowledge base's main);
  the host rule still said "the computer is called the computer"; "host" still named a computer or a server in
  `service.md`, `devices.md`, `activity.md`, `session-handoff.md`, FAC-SEM-143's row and `folder-attribution.md`;
  a digests collector "on the same machine"; the FAC-SEM-010 comment's "THIS computer"; a multi-line finder that
  missed other splits; the round 13 count; a `relay.md` line that does not exist; the vectors' short path. W79
  folded: the current block pasted byte for byte (from the heading `### The knowledge-base clause rule` on) and the
  acceptance step's bullet agreeing with it, the DEC's summary saying who runs the after-both check; the rule reads
  "In this contract "host" never means the computer. The one exception is the name "host label", which labels a
  computer.", byte-identical in its four copies; the sweep line above extended; a collector in the same OS account
  (`service.md`, OD-9 and its bullets) and CT-243 for two accounts' copies of one product; the comment per OS
  account's services directory; the finder for any split and the re-read list; `(64 cases)` for round 13;
  `packages/service-host/test-vectors/state-precedence.json`.
- Round 16 at `9161796d`: not clean (unit passed; product and seam found breaks). FAC-SEM-143's register row was
  narrower than its check; the readers of a digest collector's scope (the extension schema's title, two conformance
  rows, the specification README, `CONTEXT.md`) still said "machine"; the TLS twins (`CONTEXT.md`'s device request
  signature, `src/http-signature.ts`'s comment) still said "host", so W79's "the remaining hosts reworded" was not
  true; risks: names fixed before the rule (`agent-host`), stale lists in the Consequences, Not decided here and the
  Open list, readers of one copy per computer (`delegation.md`'s meter, `node-summary.md`'s harness, SCN-056's alt
  path) and the FD-158 cases misattributed. W80 folded: the row names PL's list of local hosts as the check writes it
  (and the merge note above for DEC-0149's adjacent `FAC-SEM-142` row); every collector reader says "a collector in
  the same OS account" and OD-9's narrowed lines carry "(DEC-0154, proposed)"; both TLS twins reworded; the host rule
  in its four copies adds "Names and paths already fixed keep their spelling (the enrollment purpose `agent-host`,
  file names such as `docs/handoffs/2026-11-06-shared-host-ports.md`)", CT-231 naming `agent-host`; the DEC's
  Consequences name every page this decision touched (CT-228 to CT-243) and Not decided here CT-243; the Open list
  CT-229 to CT-243; a meter in the hub's OS account, the enrolling account's harness (until CT-232), one counted
  account in SCN-056; `53a62f9` adds three FD-158 cases and the file's older case is the `foreign` one, CT-229's
  acceptance "Fabric Dashboards' file holds these cases"; W79's summary in the DEC names the pages it reworded. The
  W80 addendum: the shared knowledge-base block replaced with its current text (76 lines: PR #628 named without a
  hash, a clause count other than 0 or 2 treated as the mismatch, a re-check at once when the other lander has no
  such PR, an edit from outside the two landers to a knowledge-base row).
- Round 17 at `832dc557`: clean on all three tiers (unit `ad0a8cdd`, product `a70fbc53`, seam `a6a81bde`).
- Round 18 at `832dc557`: not clean (unit and seam passed; product found one break). Open backlog rows still used
  "host" for a server machine (CT-185's mailbox moving "to another host") and for a proxy (CT-04's "TLS-terminating
  host"). W81 folded: CT-185 "another server", CT-04 "a TLS-terminating proxy", CT-70 "an IPv6 address as its host",
  the other open rows' uses read as a program, a URL's host or a verb; the host rule scoped, in the same words in its
  four copies: "In this contract's specification, schemas and glossary, "host" never means the computer. The
  exceptions are the name "host label", which labels a computer, and names and paths already fixed, which keep their
  spelling (...). The registers keep the words they were written in."; the acceptance step's sweep reads the open
  backlog rows too. The risks of rounds 17 and 18: HA-2's order covers the states read from the listener and its
  answer, a host's own states that the listener does not decide may come first with no answer read as the
  service's (Fabric Dashboards at `a0bc160`), and CT-229 names that precedence; the glossary's host label carries
  the devices page's parenthesis; FD-159's Linux part done in 0.8.27 (PR #349); `service-ops-digest-extension`'s
  title among three descriptions; SB-278 waits for the tag, and the acceptance step tags a release and posts it;
  annotated lines for DEC-0015, DEC-0057, DEC-0123 and DEC-0153 with their check; the TLS clause of the
  Consequences; CT-231 names the node and hub readers "on the same machine", CT-232 the whole-harness readers; the
  digest rows cite DEC-0154; `delegation.md`'s meter marked; the gap spec says CT-242 and CT-243 came later.
- Paused 2026-11-06 by the operator's relay (board thread `eefa7959`), resumed 2026-11-07 by the operator's own word.
  W82: the first organization server's 100-bit `org.id` (board message `922e6fed`) and the adapter's T0 reading of a
  token-free loopback door with FAA-227 at P2 (board message `cdf28788`) in the adoption rows.
- Round 19 at `63c622d4`: not clean (unit passed; product two breaks, seam one). Product: CT-228's state cell still
  read paused; CT-231 cited `CONTEXT.md` line 830, which W81's own edit had moved. Seam: the knowledge base's North
  Star page calls DEC-0154 "proposed, paused, not on main" and no step corrected it. W83 folded the three and the
  cheap risks.
- Round 20 at `3db473d0`: not clean (product two breaks, seam two). Product: the text said Fabric Dashboards places a
  supervisor's stop before the order, while it shows that only when nothing answers (its `state.ts` lines 67 to 69,
  its vector "another program answering comes before launchd saying it is off"); the affects list cited `service.md`
  "its line 151", moved to 152 by W83. Seam: further North Star statements (gap row G22, the one-command project
  line) and the release rows the landing makes false; W83's HA-2 pointer split a "proposed" marker across lines. W84
  folded the four, the round's record into the Status, Source, Readings and README row, SCN-056's first step worded as
  precedence, SB-269 reported shipped in 0.7.18, and FD-158's app event in the board step.
- Round 20's unit reading at `3db473d0` found one break, the same split marker as its seam reading; W84 had rejoined it.
- Round 21 at `ea203020`: not clean (product one break, seam one; unit not run). Product: W84 cited Fabric
  Dashboards' `state.ts` lines 31 to 39, which leave out the start in flight (line 40), and said `look.ts` skips the
  probe while a stop or start is in flight, which its monitor does (`src/core/monitor.ts` line 280). Seam: the
  knowledge-base step's list missed `roadmap.md` 64 (SB-278 "waiting for DEC-0154's tag") and `north-star.md` 521
  (G21), and its check could see neither. W85 folded both, made the step follow its grep at landing time with checks
  that read the pages from the knowledge base's main, and folded the risks (CT-228's state, FLW-17's precedence
  wording, the monitor citation pinned, the connections row and the app descriptor's callers in the change lists,
  "Git hosting service" in `coordination.md`, `node-summary.md`'s marker, DEC-0151's three rows in the merge notes,
  the order-1 window's conformance row, the Fabric Dashboards row's silent listener).
- Round 22 at `d4f3300c`: not clean (unit passed; product one break, seam two). Both: the knowledge-base step said
  DEC-0149's lander does the same for DEC-0149, and DEC-0149's handoff has no such step. Seam: once PR #628 merges,
  the step's grep also prints `authority.md`'s clause lines, which the clause rule owns, so a coordinator's edit in
  other words could end with the owed clause 0. W86 states what DEC-0149's handoff carries, leaves the clause lines to
  the clause rule, widens the grep to CT-228 and CT-229, checks the roadmap's tag, writes HA-3's forwarder duty into
  its conformance row, places `duplicate` before the well-known `status`, names `coordination.md` in the
  Consequences, and names a local refusal and an owner a server cannot tell in CT-229.
- Round 23 at `a5308d97`: not clean (unit and product passed; seam one break). The acceptance step left CT-228's
  state cell, this handoff's title marker and its Next task as before acceptance. W87 adds them to the step and
  folds the risks: the knowledge-base post follows the tag; HA-1's free-port test counts this account's claims of
  other services, and a recorded port the instance's own listener holds is kept whatever another account's claim
  says (CT-228's vectors name the case); item 2 states the order's scope as the specification does; the threat model
  puts HA-1 and HA-2 on every computer; Fabric Dashboards' `.mac` line (`i18n.ts:129`) and narrower line ranges
  (`look.ts` 91 to 99, `state.ts` 68 and 69).
- Round 24 at `ab89d8a1`: not clean (product one break, unit two, seam three). The gap spec's G1 still
  gave the free-port test before W87 (no claim of another service in this account). W88 brings G1 to item 1's words
  and folds the risks: the glossary's port claim covers two services in one account; the conformance installer row
  says HA-1's choose and free-port rules word for word; CT-228's "released <tag>" is added after the tag, in the
  release's follow-up change; CT-229's reference places `duplicate` after `foreign`.
- Round 24, unit and seam: CT-228's acceptance check matched "accepted" in the row's description, so it could not
  fail; HA-1's holder list left out this account's claim of another service, which the free-port test counts (seam
  also found the gap spec's G1, already fixed by W88); main's CT-251 and this branch's CT-232 pointed by line number
  into pages the landing moves. W89 anchors the check on the state cell and checks the README row and the title,
  names the claim of another service among HA-1's holders in the specification, item 1, the gap spec and the
  conformance row (with "nothing does" meaning none of them, the historical default port under the same rule, and
  CT-228's vector answering a new port), and names CT-232's conformance row; main's CT-251 names its sections in
  PR #247 (`2966a3a2`).
- Round 25 at `73f5a9ed`: not clean (unit one break, product two). The gap spec's G1 and the conformance installer
  row restated HA-1's holder list and free-port test incompletely. W90 states HA-1 once, in the specification and
  item 1, and makes G1 and the row point to it; the keep rule no longer keeps a port another `id.instance`'s
  descriptor declares; CT-228's state names the W88 gate and the next readings; its acceptance check catches
  "Paused" and any next task; SCR-20 lists `foreign` and `duplicate`; the Checks entry reads in order.
- Round 25, seam: the same G1 break, closed by W90's pointer. W91 folds its risks: annotated lines under DEC-0045
  (item 6's T0 on loopback), DEC-0118 (item 2's mode `A`) and DEC-0122 (item 2's loopback premise), which this
  decision also amends, with the loop extended to them; the README check also catches "not merged" and reads only
  this handoff's row; the knowledge-base pages' window until the coordinator acts is named.
- Round 26 at `647754bf`: not clean (unit one break, product three, seam one). DEC-0122's annotated line named item
  1, while the loopback premise is item 2; the gap spec said the Compatibility kept its list of product rows, which
  has since grown; the handoff's Done restated HA-1's keep rule before W90; and DEC-0128 (item 5's residual
  linkability) and DEC-0031 (what a device is) had no annotated line. W92 fixes the item, adds the two lines with
  the rule for which decisions get one, makes the loop check each line's own text under its own decision (0 nine
  times before, 1 nine times after, in bash and zsh), points the gap spec to the Compatibility and the Done to HA-1,
  and counts a wildcard bind in the free-port test.
- Round 27 at `f78c87c1`: not clean (unit passed; product one break, seam one). The Compatibility says Fabric
  Dashboards is asked about a port that does not answer, and the board step did not ask it; DEC-0044's LC-19 ("one
  copy on the machine") becomes false and had no annotated line. W93 adds the board's third ask; narrows the rule to
  a text made false or a closed list or form changed, and adds lines under DEC-0044 and DEC-0061 (item 5's Install
  and Uninstall forms), with DEC-0040's FL-7 among the decisions that keep their words; makes the conformance client
  row point to HA-2's order; keeps CT-228's Goal tag in its rewritten cell; and names every changed part of
  `service.md` and `profiles.md` in the Consequences.
- The two UI lines of `foreign-user` ("Another account on this computer is using this service's port; nothing was
  sent to it." and "This computer would not say who is using this service's port; nothing was sent to it.") passed
  the operator's copy check (en-US, register ui), report `967586eb-8376-458f-a086-744c9c21b576`, 0 findings.
- Round 28 at `3fb5c12a`: clean on all three tiers. Its risks are folded into W94 or filed.
- Round 29 at `3fb5c12a`: clean on all three tiers, the second clean round in a row, which accepted DEC-0154. Unit
  recomputed the 68 host-label vectors with an independent HMAC and killed 25 mutants; product and seam traced every
  copy of HA-1 and HA-2 and the acceptance checks on probe copies in bash and zsh. Their risks: the Fabric Dashboards
  asks dated to acceptance day and DEC-0019 and DEC-0069 named among the decisions that keep their words (W94);
  FAC-SEM-010's message still saying "claimed" (CT-253); the Open bullet naming CT-251; DEC-0149's landing checking
  `north-star.md` for "DEC-0149 and DEC-0154" (carried to DEC-0149's landing); the product rows framed as the
  readings of 2026-11-06.

## Decisions made in the draft

- No rule code: every new duty is a run-time check of the operating system (who owns a socket, who owns a file) or a
  product's own test; the host label has a reference and vectors, and its shape is the schema's pattern.
- The state order is written in `service.md` because the contract had none; Fabric Dashboards' three cases are cited
  as it reported them, and the contract's own vector file is CT-229.
- The claim file's shape is stated in prose with an example; its schema, and a reference for the port choice, are
  owed under CT-228. The claim's `<account>` is the numeric uid (macOS, Linux) or the SID (Windows), never the login
  name, and the ignore rule compares the file's owner uid (owner SID) with it.
- `device.hostLabel` sits in the request's closed `device` object, so a server pinned before refuses it at its schema
  (as DEC-0094's `file`); a node sends it only once the policy member of CT-239 turns it on.
- Fabric Inbox's row is the coordinator's corrected wording of 2026-11-06 (its PR #421).

## Merge notes, per sibling branch

- CT-227 (`agent/ct219-receipt-20261106`), which lands first so this branch's hosted run is not red for its reason:
  the backlog tail reads CT-227 then CT-228 to CT-243; the handoffs README stays newest first, DEC-0154's row above
  DEC-0153's. Done: main `1c141418` (PR #245) is merged into this branch.
- DEC-0149 (`agent/ct194-source-manifest-v2-20261104`): its landing backlog rows take ids above the highest on
  main and on open branches (DEC-0149 already holds CT-244; main holds CT-250 to CT-252 since `75db14fb`), re-measured at landing; the DECISIONS tail in id order; the next-free markers re-read
  from `refs/agent-sync/ids` at landing; the backlog tail in id order; the handoffs README newest first;
  `vitest.config.ts`'s coverage `include` is the union (`src/host-label.ts` and `src/validator.ts` both); the watcher
  sentence in `service.md`: DEC-0149 rewrites it (its `service.md` line 222), and whichever of DEC-0149 and DEC-0154
  lands second makes it read as below, the same as DEC-0149's CV. The first sentence is DEC-0149's, rewritten: only its
  subject ("Fabric Dashboards' watcher" becomes "A watcher") and its list of states change, and every other part of it
  stays where it is. The second sentence is new and follows it; it describes Fabric Dashboards' released watcher. The
  whole landed text, with no part left out and nothing quoted before it, the same as the block in DEC-0149's handoff
  once both are joined with `tr '\n' ' ' | tr -s ' '` (the target phrase stands on one line of `service.md`, or the
  positive check counts 0):

  ```text
  A watcher messages the operator only when an agent has been unavailable (`down`, `foreign` or `foreign-user`, not merely `degraded`)
  for more than 15 minutes, once per case, and says it is back after 15 minutes well; a `degraded` answer opens no message, so
  setup entries are left out (fabric-dashboards `docs/backlog.md` FD-76, ADR-0010, released in 0.7.15, read at `ebffd16`); a
  watcher MUST NOT message the operator for an entry with `setup: true`. Fabric Dashboards' watcher opens an episode only
  for `down` since FD-76 (0.7.15, `ebffd16`) and keeps it open while a failing source (one not marked `setup: true`)
  outside its start baseline stays, so its failure message at 15 minutes may name that source; counting `foreign` and
  `foreign-user` is owed (DEC-0154).
  ```

  After both land, run in bash or zsh: the first command prints 1 and the second prints 0 (the released watcher
  reports only `down`). The second reads the file as one line, so a line break anywhere in a wrong landing is still
  found. When it prints 0 it also exits with status 1 (`grep -c` with no match), so do not run it under `set -e`:

  ```sh
  grep -c -F 'unavailable (`down`, `foreign` or `foreign-user`, not merely `degraded`)' docs/specification/service.md
  tr '\n' ' ' < docs/specification/service.md | tr -s ' ' | grep -cF "Fabric Dashboards' watcher messages the operator only when"
  ```

  Both were run, in bash and in zsh, on four trial files before they were written here: the landed text above (the
  first prints 1, the second 0 with exit status 1); the forbidden sentence on one line (the second prints 1); the
  forbidden sentence broken before its parenthesis of states (1); and the forbidden sentence broken before
  "unavailable" (1). DEC-0149 points `relay.md` and `conformance.md` to
  `service.md`'s definition of "unavailable", so one edit in `service.md` suffices; when DEC-0149 lands, CT-232 cites its sentence on an OS account an
  organization owns whole (on DEC-0149's branch, `source.md` and `contexts.md`; not cited before it lands). This is a
  landing edit made by whichever of DEC-0149 and DEC-0154 lands second; after both,
  `grep '^| CT-232 ' docs/backlog.md | grep -o source.md | wc -l` prints 1 (it counts occurrences, not lines).
- The two landing orders for the watcher sentence, as DEC-0149's handoff writes them at `1bd70e54`
  (`docs/handoffs/2026-11-03-source-manifest.md`, lines 1523 to 1577); its texts and commands are copied here and
  match byte for byte once both are joined with `tr '\n' ' ' | tr -s ' '`.
  - **Order 1: DEC-0154 lands first, DEC-0149 second.** Until DEC-0149 lands, main keeps the old watcher sentence
    (`degraded`, 5 minutes) beside HA-2, and `conformance.md`'s watcher row (line 147, FD-48's degraded threshold)
    with no row for HA-2's watcher duty; that sentence was false before DEC-0154, and both are closed by DEC-0149's landing,
    and DEC-0154's lander makes no separate edit for it. DEC-0149's landing then writes the landed text above (its
    order 1 text), and the two checks above run after it: 1, then 0.
  - **Order 2: DEC-0149 lands first, DEC-0154 second.** DEC-0149's own landing changes only the first sentence's
    subject ("Fabric Dashboards' watcher" becomes "A watcher"), keeps its list of states "`down`, not merely
    `degraded`" on one line, and adds the second sentence without the clause on `foreign` and `foreign-user`. The
    landed text then:

    ```text
    A watcher messages the operator only when an agent has been unavailable (`down`, not merely `degraded`)
    for more than 15 minutes, once per case, and says it is back after 15 minutes well; a `degraded` answer opens no message, so
    setup entries are left out (fabric-dashboards `docs/backlog.md` FD-76, ADR-0010, released in 0.7.15, read at `ebffd16`); a
    watcher MUST NOT message the operator for an entry with `setup: true`. Fabric Dashboards' watcher opens an episode only
    for `down` since FD-76 (0.7.15, `ebffd16`) and keeps it open while a failing source (one not marked `setup: true`)
    outside its start baseline stays, so its failure message at 15 minutes may name that source.
    ```

    Checks after DEC-0149 lands, which print 1, 0 and 0:

    ```sh
    grep -c -F 'unavailable (`down`, not merely `degraded`)' docs/specification/service.md
    tr '\n' ' ' < docs/specification/service.md | tr -s ' ' | grep -cF "Fabric Dashboards' watcher messages the operator only when"
    tr '\n' ' ' < docs/specification/service.md | tr -s ' ' | grep -cF 'is owed (DEC-0154)'
    ```

    DEC-0154's lander then changes only the list of states (to "`down`, `foreign` or `foreign-user`, not merely
    `degraded`", on one line) and adds "; counting `foreign` and `foreign-user` is owed (DEC-0154)" before the second
    sentence's full stop, which gives order 1's landed text (the `text` block of the DEC-0149 bullet above, the one that
    begins "DEC-0149 (`agent/ct194-source-manifest-v2-20261104`)"), and runs order 1's two checks (the `sh` block of
    that same bullet): 1, then 0.
  - All of these checks were run with `bash -c` and `zsh -c` on trial files built from the two landed texts. Order 1:
    the two checks print 1 and 0 on its text; 1 and 1 on the widened claim (its subject still Fabric Dashboards'
    watcher) on one line; 0 and 1 with a line break before its parenthesis of states; 1 and 1 with one before
    "unavailable". Order 2: the three checks print 1, 0 and 0 on its text; 1, 1 and 0 with the subject still Fabric
    Dashboards' watcher; 1, 0 and 1 with the clause on what DEC-0154 owes added too early; and DEC-0154's later edit
    of order 2's text gives order 1's text word for word once joined, where order 1's checks print 1 and 0.
- DEC-0149 and the rule register in `service.md`: the rows of `FAC-SEM-143` and `FAC-SEM-142` stand next to each
  other and both branches change them, so a merge conflicts there (`git merge-tree` against `b714bceb`). Keep both
  rows: `FAC-SEM-143` as DEC-0154 writes it (a link not a raw address whose host is a local one as PL's check lists
  it), and `FAC-SEM-142` as DEC-0149 writes it (its source hand-over exception, out of the rule until a service pins
  a revision carrying CT-181). Neither row's text is merged into the other.
- DEC-0151 and DEC-0152: the same register rules (DECISIONS tail in id order, markers from the counters, backlog in id
  order, handoffs newest first). DEC-0151's conflict hunks with main hold three of this decision's reworded rows:
  `conformance.md`'s two collector rows and `docs/specification/README.md`'s operations-digests row; keep this
  branch's wording in them. After the merge `grep -c 'collector in the same OS account'` prints 1 on each of the two
  files and `grep -c '(in the same OS account as the product)' docs/specification/conformance.md` prints 1.

## Acceptance step

- **Status.** The Status line is written `- **Status:** Accepted <YYYY-MM-DD>, ...`, as the knowledge-base clause rule
  below requires. Rewrite this handoff's row in the README, its title's marker and its Next task, and CT-228's state
  cell in `docs/backlog.md`: "open: DEC-0154 accepted <YYYY-MM-DD>, merged #<PR>; still owed: the claim file's
  schema and the port-choice reference with vectors. Goal: reliable-work" (the Goal tag kept), with no "Proposed", "Paused" or pre-acceptance next task left
  in it; the release below adds ", released <tag> (main <merge commit>)" after the tag is pushed, in a
  follow-up change on main after the tag, so main never names a tag that does not exist yet. On the landing head `grep '^| CT-228 ' docs/backlog.md | grep -c -E 'Proposed|Paused|Next( task)?:'`
  prints 0 and `grep '^| CT-228 ' docs/backlog.md | grep -c '| open: DEC-0154 accepted [0-9]'` prints 1; `grep '2026-11-06-shared-host-ports.md' docs/handoffs/README.md | grep -c -E 'DEC-0154, proposed|not merged'` and `head -1 docs/handoffs/2026-11-06-shared-host-ports.md | grep -c proposed` print 0.
- **"proposed" markers.** Every "DEC-0154, proposed" (and "DEC-0154 (proposed)", "DEC-0154 item 4, proposed") in the
  specification changes at acceptance. Find them on one line with
  `git grep -n proposed -- docs/specification docs/guides docs/DOCMAP.md CONTEXT.md schemas src tools | grep DEC-0154`,
  and any that a line break splits with
  `perl -0777 -ne 'while(/DEC-0154([\s\S]{0,40}?)proposed/g){ if($1 =~ /\n/){print "$ARGV\n"; last} }' $(git ls-files docs/specification docs/guides docs/DOCMAP.md CONTEXT.md schemas src tools)`
  (it prints nothing at this head). At this head they are in `CONTEXT.md`, `docs/DOCMAP.md`,
  `docs/guides/connecting-compatible-agents.md`, `conformance.md`, `connections.md`, `contexts.md`, `delegation.md`,
  `devices.md`, `fabric-button.md`, `node-summary.md`, `ops-digest.md`, `profiles.md`, `provider.md`, `relay.md`, `service.md`,
  `session-handoff.md`, `schemas/device-enrollment.schema.json`, `schemas/service-well-known.schema.json`,
  `src/host-label.ts` and `tools/vectors/host-label.ts`. The dated spec `docs/evidence/specs/2026-11-06-shared-host-gaps.md`
  keeps its "DEC-0154 (proposed)" as a record of its day.
  Re-read too the citations that carry no marker: `devices.md`'s "a server pinned before DEC-0154", the comments in
  `src/semantic-rules.ts`, `tools/vectors/host-label.ts`'s "DEC-0154's text" (its line 9), and the generator's and
  vectors' "DEC-0154 item 4".
- **Annotated lines.** Each line goes after the last line of the entry's last `- **Annotated` item, or of its Status
  item when it has none, with the acceptance date in place of `<YYYY-MM-DD>`; under DEC-0015, DEC-0057, DEC-0123, DEC-0153, DEC-0045, DEC-0118, DEC-0122, DEC-0128, DEC-0031, DEC-0044 and
  DEC-0061 in turn. A decision gets a line when its own text, read alone, becomes false after DEC-0154, or when it
  fixes a closed list or form that DEC-0154 changes (DEC-0128 item 5's named links, DEC-0031's device object,
  DEC-0061 item 5's Install and Uninstall forms). A decision to which DEC-0154 only adds a duty its own text does not
  deny keeps its words (DEC-0040's FL-7, DEC-0041's meter, DEC-0042's SH-9, DEC-0066's relay, DEC-0069's app
  descriptor callers, DEC-0082's `org.id`, DEC-0096's connections, DEC-0101 and DEC-0102's node summary; DEC-0019's and DEC-0069's FAC-SEM-010 "port claim", read in
  their own sense of a declaration), and DEC-0154's Consequences name the pages that carry the new duty:

  ```text
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (one copy per counted OS account, one `id.instance` in that account's services directory under `service.lock` in its data directory, or an app's own single-instance guard; the port claim, HA-1).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (one copy and `service.lock` per OS account, an app's own single-instance guard in place of the lock, the port claim rebuilt after the guard, HA-1).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (PL-3: the listener's owner is checked before a raw loopback address is opened; another account's, or one that cannot be told, is `foreign-user` and nothing opens, HA-2).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (OD-9: a collector in the same OS account reads the daily digests; CT-243).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (item 6: T0 on loopback needs the peer's OS account checked on a computer with more than one counted account, HA-3).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (item 2: under mode `A` on a shared computer the organization sees the enrolling account's harness, until CT-232).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (item 2's premise: a loopback origin is reachable by every OS account and relayed guest on the computer, HA-2 and HA-3).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (item 5's residual linkability gains the host label: shared by one organization's devices on one computer, and computable for every organization by an organization's code on any counted account or in a virtual machine given the secret; devices.md What stays linkable, HA-4).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (a device is one counted OS account of a computer or a virtual machine; the enrollment's device object gains the optional `hostLabel`, HA-4).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (LC-19: one copy per counted OS account on the computer, not one per machine, HA-1).
  - **Annotated (<YYYY-MM-DD>):** amended by DEC-0154 (item 5's Install and Uninstall forms: the port claim written after the descriptor, the install poll waiting for this account's listener, the claim rebuilt at uninstall, HA-1 and HA-2).
  ```

  Each prints 1, in bash or zsh:

  ```sh
  for p in 'DEC-0015 |service.lock` in its data directory' 'DEC-0057 |the port claim rebuilt after the guard' \
    'DEC-0123:|PL-3: the listener' 'DEC-0153:|OD-9: a collector' 'DEC-0045 |item 6: T0 on loopback' \
    'DEC-0118:|item 2: under mode' 'DEC-0122:|item 2.s premise' 'DEC-0128:|item 5.s residual linkability' \
    'DEC-0031 |a device is one counted OS account' 'DEC-0044 |LC-19: one copy per counted' \
    'DEC-0061 |item 5.s Install and Uninstall forms'; do
    d=${p%%|*}; t=${p#*|}
    awk -v h="### $d" 'index($0, h) == 1 {f=1; next} /^### /{f=0} f' docs/DECISIONS.md \
      | grep '^- \*\*Annotated ([0-9-]*):\*\* amended by DEC-0154 (' | grep -c -e "$t"
  done
  ```

- **Sweep.** Re-read every use of "host" in the specification, the schemas, the glossary and the open backlog rows;
  none may mean the computer or a server machine (the host rule; the registers' done rows and decisions keep their
  words). The lists to read:

  ```sh
  git grep -n -i -w -E 'hosts?' -- docs/specification schemas CONTEXT.md | grep -v -E 'host label|hostLabel|agent-host'
  grep -E '^\| CT-' docs/backlog.md | grep -v -E '\| (done|closed|superseded)[ :,]' | grep -o -i -E '.{0,40}\bhosts?\b.{0,40}'
  ```

- **Adopters.** In `docs/specification/README.md` name the owed adopters on the devices row (Project Observatory's node
  and setup step, the first organization server) and the services row (Fabric, Fabric Dashboards, Switchboard, Fabric
  Inbox, the adapter's kits, the PassionCode launcher, Project Observatory).
- **The knowledge-base step**, right after DEC-0154's contract PR merges, not when the Status is set: as the
  knowledge-base clause rule below says, for DEC-0154's lander. The check after both land runs only once DEC-0154's
  own knowledge-base PR for the clause has merged; when the clause check prints 0, or the PR is closed unmerged, it
  runs nothing.
- **The knowledge base's pages.** Right after the release below (the post needs its tag), post on thread `eefa7959` the corrections of
  fabric-workspace `knowledge/` (the coordinator edits those pages). The pages to read are what this prints on the
  knowledge base's main at that time, every line of it, not a list fixed here:
  `git fetch origin && git grep -n -E 'DEC-0154|CT-22[89]|CT-23[0-9]|CT-24[0-3]' origin/main -- 'knowledge/*.md' | grep -v -e 'proposed for FD' -e "owed by FD's watcher under contract DEC-0154"`
  (in a fabric-workspace clone); `authority.md`'s two clause lines are the knowledge-base clause rule's below, never
  posted here. Each line it prints is made true for the moment after the landing: DEC-0154 accepted, on
  the contract's main, with the date and the tag; a row of CT-228 to CT-243 open on main; a line number into this
  contract replaced by the row's or the section's name; "waits on" or "after" naming only what is not on the
  contract's main at the time of the post. DEC-0149's handoff carries no such step at `0099c4f1`: when DEC-0149 is not
  on main yet, the post also asks the coordinator to drop DEC-0149 from those lines once DEC-0149 lands, the day its
  landing is posted on threads `21ac4057` and `0a8776f2`. At `60c630db`
  it prints six lines: `north-star.md` 262 and 521 (the one-command agent project and gap row G21, after DEC-0149 and
  DEC-0154), 393 and 400 ("proposed, paused, not on main"), 522 (gap row G22: CT-232 "(branch, no PR)",
  `devices.md:414`), and `roadmap.md` 64 (Switchboard's SB-278 "waiting for DEC-0154's tag"). Two more statements
  name no DEC-0154 and are corrected in the same post: `north-star.md` 392 to 393, HA-3 ("on a computer with several
  accounts no door admits a loopback caller without a token unless it checks the peer's OS account, and where guests
  reach loopback through a forwarder none on TCP"), and the contract's release in `products.md` and `roadmap.md` (the
  new tag). Until the coordinator acts, those lines stay false (a named window, closed by the checks below). Check on the knowledge base's main once the coordinator answers, in a fabric-workspace clone after
  `git fetch origin`:
  `git show origin/main:knowledge/north-star.md | grep -c -E 'DEC-0154: proposed, paused|DEC-0154 is proposed, paused|CT-232 \(branch, no PR\)|devices\.md:414'`
  and `git show origin/main:knowledge/roadmap.md | grep -c "waiting for DEC-0154's tag"` print 0;
  `git show origin/main:knowledge/north-star.md | tr '\n' ' ' | tr -s ' ' | grep -c 'loopback caller without a token;'`
  prints 0; `git show origin/main:knowledge/products.md | grep -c '<the tag>'` and the same on `roadmap.md` print at
  least 1; and the lines on the
  one-command project and G21 are read against the contract's main of that day.
- **Release.** Right after the merge, an annotated tag `v0.1.0+<YYYY-MM-DD>` (`.2`, `.3` after the date for a second
  or third release that day) on the merge commit, once its gate and `pnpm vectors:check` passed, with a GitHub release
  whose notes list the decisions since the previous release ([versioning](../specification/versioning.md#releases)).
  Post the tag on thread `1fe66e6e`: Switchboard's SB-278 (the port claim) waits for it. Then a follow-up change on
  main adds ", released <tag> (main <merge commit>)" to CT-228's state cell.
- **The board.** Tell thread `1fe66e6e` the same day (Fabric Dashboards' FD-159 and Fabric's server build on it), and in
  that message ask Fabric Dashboards for a row that its watcher (FD-76's successor) counts `foreign` and
  `foreign-user` as unavailable: FD-76 opens an episode only for `down`, and FD-158 added the state to the card and an
  app event with a desktop notification (its `src/core/monitor.ts` lines 496 to 498 at `a0bc160`), not to the operator channel's watcher.
  Ask in the same message that its card's own `foreign-user` line (its `src/core/i18n.ts:128` and `:129`, the `.mac` variant shown on macOS, its own wording today) use this
  decision's two lines or be checked against them, that a line for an owner that cannot be told be added (part
  of FD-159), and that it ask the owner of a port that does not answer too (its `look.ts` lines 103 to 105 at
  `a0bc160` ask only after an answer), or say why it stays as it is.

### The knowledge-base clause rule (the same block in DEC-0149's and DEC-0154's handoffs)

This block is byte-identical in `docs/handoffs/2026-11-03-source-manifest.md` (DEC-0149) and
`docs/handoffs/2026-11-06-shared-host-ports.md` (DEC-0154); a change to one is made to both.

Rule: each lander checks after its own write, so whichever lander finishes second sees the
other's result; the edit depends on the text, so a second run changes nothing.

The clause sits at `knowledge/authority.md:115` and `:128` (PR #628). From: "counting `foreign`
and `foreign-user` is proposed for FD's watcher in contract DEC-0154". To: "counting `foreign`
and `foreign-user` is owed by FD's watcher under contract DEC-0154" (no inner parentheses: the
clause sits inside a bracket that closes right after it).

Status check, in the contract checkout. It matches any Status line in DEC-0154's block that
starts with `- **Status:** Accepted`, as DEC-0150's (`Accepted, merged <date>, ...`) and
DEC-0153's (`Accepted <date>, ...`) on main both do:

```sh
git fetch origin && git show origin/main:docs/DECISIONS.md \
  | awk '/^### DEC-0154:/{f=1;next} /^### /{f=0} f' \
  | grep -c '^- \*\*Status:\*\* Accepted'
```

Clause check, in the knowledge base checkout. A count other than 0 or 2 means someone else
edited the clause; the lander treats it as the mismatch below:

```sh
git fetch origin && git show origin/main:knowledge/authority.md | grep -c 'proposed for FD'
```

A knowledge-base PR for the clause branches from the knowledge base's main, carries only the
two replacements, and runs `npm test` and `npm run verify:content`. Right before merging it,
the lander runs the clause check again: if it prints 0, the other lander already made the edit,
and the lander closes its PR unmerged.

DEC-0149's lander: step 6 runs the status check before merging PR #628 (1: change both clauses
on PR #628, then merge; 0: merge as is). Step 6b, right after PR #628 merges, runs the status
check and the clause check; 1 and 2: a knowledge-base PR for the clause; otherwise nothing.

DEC-0154's lander: its Status starts with `- **Status:** Accepted`, written
`- **Status:** Accepted <YYYY-MM-DD>, ...`; nothing merges before that Status edit, so its
contract PR merges only once accepted. Right after its contract PR merges it runs the clause
check; 2: a knowledge-base PR for the clause; 0: nothing.

The lander that makes the edit runs the check after both land, as its last step, once its edit
is on the knowledge base's main: DEC-0149's lander after PR #628 merges when step 6 changed it,
or after its knowledge-base PR for the clause merges; DEC-0154's lander after its
knowledge-base PR for the clause merges. A lander that closes its PR unmerged, or makes no
edit, runs nothing. Run it in `bash` and in `zsh`:

```sh
git fetch origin && git show origin/main:knowledge/authority.md | grep -c 'proposed for FD'
git show origin/main:knowledge/authority.md \
  | grep -cF "counting \`foreign\` and \`foreign-user\` is owed by FD's watcher under contract DEC-0154"
```

The first prints 0 and the second prints 2. The first `grep -c` exits 1 when it prints 0, so
these commands are not run under `set -e`. If the check prints anything else, the lander
records the mismatch in its handoff and runs the check again once the other lander's
knowledge-base PR for the clause is merged or closed, or at once when the other lander has no
such PR; an edit from outside the two landers goes to a knowledge-base row.

Interleavings: DEC-0154 merges and its clause check prints 0 (PR #628 not merged); then, if
DEC-0149's step 6 ran before that merge, PR #628 merges with "proposed" and step 6b sees 1 and
2 and edits, and if step 6 ran after it, step 6 changes PR #628 and PR #628 merges already
owed; or PR #628 merges, step 6b sees 0 and does nothing, then DEC-0154 merges and its clause
check sees 2 and edits; or both open a knowledge-base PR at once, and the re-check before
merging closes the second. In any other order, or if both re-checks race and both PRs merge,
the text still ends owed twice, since a second edit changes nothing. Two windows are named and
close: from the later of DEC-0154's contract merge and PR #628's merge until a knowledge-base
PR merges, the knowledge base says "proposed" for an accepted DEC-0154; in the other order the
knowledge base names a DEC-0154 the contract's main does not carry yet.

Withdrawal: if DEC-0154 is withdrawn instead of accepted, its withdrawer files a knowledge-base
row to drop the "proposed for FD" clause from `authority.md:115` and `:128`; neither lander
edits it.

## Open

- CT-228's owed parts: the claim file's schema and a port-choice reference with vectors.
- CT-229 to CT-243 and CT-253, each with its evidence and acceptance in the backlog; G10 is a decision of the second
  wave.
- The landing day's steps above: the release, the knowledge-base clause rule, the knowledge base's pages and the
  board.
- An open question outside DEC-0154, now CT-251 on main: the operator decided on 2026-11-06 (relayed in board thread
  `22876238`, message `433ab602`) that agents of an organization call, and accept calls from, only agents of the same
  organization. It conflicts with [contexts](../specification/contexts.md) lines 10 to 12, DEC-0086 and PS-3 of
  DEC-0142, and waits for the operator's choice between options (a) and (b) as posed in that thread.

## Checks actually run

The full gate `pnpm run check` after round 6's batch (W15 to W26), at this branch's head, under the heavy lock
(free disk 8 GB, 15-minute load 38.1): exit 0, 111 test files, 10526 tests passed and 1 skipped, branches 98.92% (12567 of
12703), 31 vector files matching their generators, the UX lint passed (40 stories, 34 flows, 34 screens, 55
scenarios), documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash on an added line. After
rounds 4 and 5's first batch the gate did not run (7 GB free); targeted checks ran then. W10's mutants (each of the
platform, owner-name and `org.id` checks moved after the link check or after the mode check, six moves) each fail
`test/host-label.test.ts` and were reverted; W15's mutants (the flags' type check moved after the link check or
after the owner check) each fail it too; V14's mutant (the hex check before the mode check) fails it too.

After round 7's batch the full gate did not run (4 GB free, a 15-minute load of 48); `pnpm typecheck`,
`pnpm vectors:check`, `pnpm run docs:check`, `python3 docs/ux/lint.py`, `pnpm privacy:check` (0 findings), the em dash
check (0) and the targeted vitest set (1242 tests) ran with exit 0.
After the seam batch of round 7 (W34 to W37), on the coordinator's instruction no full gate ran (low disk);
`pnpm typecheck`, `pnpm vectors:check`, `pnpm run docs:check`, `python3 docs/ux/lint.py`, `pnpm privacy:check` (0
findings), the em dash check (0) and `pnpm vitest run` over `test/docs-check.test.ts`, `test/consistency.test.ts`,
`test/host-label.test.ts` and `test/fixtures.test.ts` (1198 tests) ran with exit 0.

After round 8's batch (W38 to W50) the full gate did not run: 10 GB were free, but the 15-minute load stood at 47.9,
above 45. `pnpm typecheck`, `pnpm vectors:check` (31 files), `pnpm run docs:check`, `python3 docs/ux/lint.py`,
`pnpm privacy:check` (0 findings), the em dash check (0) and `pnpm vitest run` over `test/host-label.test.ts`,
`test/vectors-runner.test.ts`, `test/sources-ledger.test.ts`, `test/fixtures.test.ts`, `test/consistency.test.ts`,
`test/guide-examples.test.ts`, `test/spec-required-members.test.ts`, `test/docs-check.test.ts` and
`test/descriptor-rules.test.ts` (1336 tests) ran with exit 0. W39's mutants (the mode flag's type check after the
link; `!folderOk` before the link; `!folderOk` before the owner) each fail `test/host-label.test.ts` and were
reverted.

After round 9's batch (W51 to W62) the full gate ran under the heavy lock (11 GB free, a 15-minute load of 39.3):
exit 0, 111 test files, 10534 tests passed and 1 skipped, branches 98.92% (12567 of 12703), 31 vector files matching
their generators, the UX lint passed (40 stories, 34 flows, 34 screens, 55 scenarios), documentation checks passed,
markdownlint 0 errors, privacy 0 findings; no em dash on an added line.

After round 10's batch (W63 to W70) the full gate ran under the heavy lock (9 GB free, a 15-minute load of 34.9):
the first run failed one test, `test/delegation-sealed.test.ts` ("states the scope and the lifetime in FB-6"), which
pinned FB-6's old "per host" wording; the test now pins "per computer" (W66; reverted to "per host" in W73), and the second run exited 0: 111 test
files, 10536 tests passed and 1 skipped, branches 98.92% (12567 of 12703), 31 vector files matching their generators,
the UX lint passed, documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash on an added
line.

After round 11's seam batch (W72, W73) the full gate did not run (7 GB free, under 8 GB). `pnpm typecheck`,
`pnpm run docs:check`, `python3 docs/ux/lint.py`, `pnpm privacy:check` (0 findings), the em dash check (0) and
`pnpm vitest run` over `test/delegation-sealed.test.ts`, `test/embedded-dashboard.test.ts`, `test/docs-check.test.ts`,
`test/consistency.test.ts` and `test/sources-ledger.test.ts` (151 tests) ran with exit 0.
After W74 the full gate did not run either (7 GB free); the same checks ran with exit 0, the vitest set with
`test/service-supervisor.test.ts` added and the new ED-8 test in `test/delegation-sealed.test.ts`, which was seen to
fail when ED-8's bold scope was changed.

After W75 the full gate ran under the heavy lock (10 GB free, a 15-minute load of 35.7): exit 0, 111 test files,
10538 tests passed and 1 skipped, branches 98.92% (12567 of 12703), 31 vector files matching their generators, the UX
lint passed, documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash on an added line.

After W76 the full gate ran under the heavy lock (9 GB free, a 15-minute load of 43.8): exit 0, 111 test files,
10539 tests passed and 1 skipped, branches 98.92% (12567 of 12703), 31 vector files matching their generators, the UX
lint passed, documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash on an added line.

After W77 the full gate ran under the heavy lock (9 GB free, a 15-minute load of 34.8): exit 0, 111 test files,
10544 tests passed and 1 skipped, branches 98.92% (12567 of 12703), 31 vector files matching their generators, the UX
lint passed, documentation checks passed, markdownlint 0 errors, privacy 0 findings; no em dash on an added line. The
knowledge-base step's status check and clause checks were run in bash and zsh on trial files: the status check prints
1 on a DEC-0154 block whose Status is Accepted and 0 on a Proposed one (another block's Accepted line not counted); on
a trial `authority.md` with both clauses proposed the checks print 2 and 0, and with both owed 0 and 2.

After W78 the full gate ran under the heavy lock (8 GB free, a 15-minute load of 42.7): exit 0, 111 test files,
10548 tests passed and 1 skipped, branches 98.92% (12567 of 12703), 31 vector files matching their generators, the UX
lint passed, documentation checks passed, markdownlint 0 errors (the pasted knowledge-base block included), privacy 0
findings; no em dash on an added line. The three posix-only hex mutants at `src/host-label.ts` line 67 (length, pattern
and `typeof hex` checks made posix-only) each fail `test/host-label.test.ts`.

After W79 the full gate ran under the heavy lock (10 GB free, a 15-minute load of 36.8): exit 0, 111 test files,
10548 tests passed and 1 skipped, branches 98.92% (12567 of 12703), 31 vector files matching their generators, the UX
lint passed, documentation checks passed, markdownlint 0 errors over 264 files, privacy 0 findings. One added line
carries U+2014: `session-handoff.md`'s SH-2 line, whose existing bold label (the dashed form of SH-1 to SH-13) is
re-added with the line's new wording; no other added line carries one. The new multi-line finder prints nothing at
that head and names a trial file with a split marker.

After W80 typecheck, documentation checks, the UX lint, vectors (31 files), privacy (0 findings) and the
page-links, ops-digest, http-signature, host-label and delegation-sealed tests (515 tests) passed; with 7 GB free
`pnpm test:fast` ran under the heavy lock (111 files, 10548 passed, 1 skipped), and with 10 GB free and a 15-minute
load of 40.1 the full gate ran under it: exit 0, 111 test files, 10548 tests passed and 1 skipped, branches 98.92%
(12567 of 12703), the UX lint passed, documentation checks passed, markdownlint 0 errors, privacy 0 findings. The
SH-2 line is still the one added line with U+2014. After the addendum replaced the shared block (text only),
markdownlint (0 errors), the documentation checks, privacy (0 findings) and the docs-check, sources-ledger and
consistency tests (47) passed again; the block's Python count is 1. `git grep -n -E "collector on (its|the same) machine|on the product's own machine" -- docs/specification
schemas CONTEXT.md` and `git grep -n -e 'host that terminates TLS' -e 'TLS-terminating host' -- CONTEXT.md
docs/specification src schemas` print nothing; the host rule's four copies hash the same once joined.

After W81 the full gate did not run: the machine's 15-minute load stood at 88 (the threshold is 45). Typecheck, the
documentation checks (markdownlint 0 errors), the UX lint, vectors (31 files), privacy (0 findings), the
delegation-sealed, page-links, ops-digest, host-label, docs-check, sources-ledger and consistency tests (365) and 14
further test files that read the edited pages and rows (2236 tests, among them local-channel, node-summary,
positive-sweep and rule-tolerance) passed. The annotated-line check printed 1 four times in bash and in zsh on a trial
copy of `DECISIONS.md` carrying the four lines, and 0 four times on this head. The four copies of the host rule hash
the same once joined; the split-marker finder prints nothing; the shared block's Python count is 1. The SH-2 line is
still the one added line with U+2014.

After W84 the full gate did not run: the machine's 15-minute load stood near 90 (the threshold is 45). The UX lint,
the documentation checks (markdownlint 0 errors), vectors (31 files), privacy (0 findings) and the docs-check,
consistency, sources-ledger, delegation-sealed, page-links, local-channel and node-summary tests (334) passed. The
split-marker finder prints nothing; `git grep -n proposed -- docs/specification/service.md | grep -c DEC-0154` prints
13; the shared block is in the handoff once, byte for byte. The SH-2 line is still the one added line with U+2014.

After W85 the full gate did not run (15-minute load 60 to 90). The UX lint, the documentation checks (markdownlint 0
errors), vectors (31 files), privacy (0 findings) and the docs-check, consistency, sources-ledger, delegation-sealed,
page-links, local-channel and node-summary tests (334) passed; the split-marker finder prints nothing; the shared block
is in the handoff once, byte for byte; the SH-2 line is still the one added line with U+2014.

After W86 the full gate did not run (load above 45). The UX lint, the documentation checks (markdownlint 0 errors),
vectors (31 files), privacy (0 findings) and the tests that read the edited pages (334) passed; the split-marker
finder prints nothing; the shared block is in the handoff once, byte for byte; the SH-2 line is still the one added
line with U+2014.

After W87 the full gate did not run (load above 45). The UX lint, the documentation checks (markdownlint 0 errors),
vectors (31 files), privacy (0 findings) and the tests that read the edited pages passed; the split-marker finder
prints nothing; the shared block is in the handoff once, byte for byte; the SH-2 line is still the one added line
with U+2014.

When W88 was committed the full gate had not run yet (load above 45). The UX lint, the documentation checks (markdownlint 0 errors),
vectors (31 files), privacy (0 findings) and the tests that read the edited pages passed; the split-marker finder
prints nothing; the shared block is in the handoff once, byte for byte; the SH-2 line is still the one added line
with U+2014.

At W88 (`60b3309e`), with a 15-minute load of 43.9 and 9 GB free, the full gate ran under the heavy lock: typecheck,
111 test files (10548 passed, 1 skipped; branches 98.92%), the UX lint, the documentation checks, vectors and privacy
all exit 0; the one added line with U+2014 is the SH-2 label. After W89 (text only) the UX lint, the documentation
checks, vectors, privacy and the tests that read the edited pages passed again.

After W90 and W91 (text only) the UX lint, the documentation checks (markdownlint 0 errors), vectors (31 files),
privacy (0 findings) and the tests that read the edited pages passed; the split-marker finder prints nothing; the
shared block is in the handoff once, byte for byte.

After W92 and W93 (text only) the UX lint, the documentation checks (markdownlint 0 errors), vectors (31 files),
privacy (0 findings) and the tests that read the edited pages passed; the annotated-line loop prints 0 eleven times at
the head and 1 eleven times on a trial copy carrying the eleven lines, in bash and zsh; the split-marker finder prints
nothing; the shared block is in the handoff once, byte for byte.

The full gate at the landing head (`4812647c`, W94 with main merged), under the heavy lock (free disk 12 GB, 15-minute
load 20.0): typecheck, 111 test files with 10548 tests passed and 1 skipped (branches 98.92%), the UX lint, 31 vector
files matching their generators and the privacy check exited 0; the documentation check found one markdownlint
error (MD018, a line of this handoff starting with `#248`), fixed in the next commit, after which markdownlint
reports 0 errors. The only em dash on an added line is the existing SH-2 label in `session-handoff.md`.

## Next task

Landed 2026-11-07: PR #248 merged (main `18f8d487`, the same tree as the gated head `2636bebf`); annotated tag
`v0.1.0+2026-11-07.1` on it and its GitHub release; the knowledge-base clause check printed 0 on the knowledge base's
main `60c630d` (PR #628 not merged), so this lander edits nothing there; the knowledge base's pages, the six lines its
grep printed plus HA-3's statement and the release in `products.md` and `roadmap.md`, posted on `eefa7959` (message
`f83a171c`), with the ask to drop DEC-0149 from `north-star.md` 262 and 521 once DEC-0149 lands; the tag, SB-278 and
the three Fabric Dashboards asks posted on `1fe66e6e` (message `f6d0a09a`); CT-228's state cell names the release.

Next: once the coordinator answers on `eefa7959`, run the knowledge-base page checks of the acceptance step on its
main. Then CT-228's owed parts (the claim file's schema and a port-choice reference with vectors) and the rows CT-229 to
CT-243 and CT-253 by priority.

The record of the run before acceptance:

The coordinator's next blind readings of DEC-0154 at this branch's head.

Paused 2026-11-06 by the operator's relay in board thread `eefa7959` (about 12:50 UTC, from fabric-workspace session
`74a9440a`: finish the current step, start no new tasks). State: head `c1cd93a2`; round 17 clean at `832dc557`; round
18 not clean, fixed by W81; the full gate not run since W80 because the load was high. Exact next task once the pause
lifts: run the full gate at this head under the heavy lock, then blind readings round 19 (unit, product, seam), then
two clean rounds and the acceptance step.

Resumed 2026-11-07 by the operator's own word in this session («делай автономно до конца», a direct request, one of
the pause's exceptions). W82: the first organization server's row names its 100-bit `org.id` (board message
`922e6fed`) and the adapter's row its T0 reading of a token-free loopback door and FAA-227's priority (board message
`cdf28788`). Next: the full gate at the W82 head, then round 19.

Round 19 at `63c622d4`: unit clean; product not clean (CT-228's state cell still paused, CT-231's stale line number);
seam not clean (the knowledge base's North Star page calls DEC-0154 "proposed, paused, not on main", and no step
corrected it). W83 fixes the three, adds the North Star step to the acceptance step, and folds in the cheap risks
(Fabric Dashboards' line range 31 to 70, "a conflict over an `id.instance` or a port", the two W82 sentences, the
`service.lock` place in DEC-0015's line, the annotation place, the two collector rows marked proposed, HA-2 pointers
from the app descriptor and the connections row, SCR-20's host states first, main's CT-250 to CT-252 in the merge
notes). Held for later rounds or rows: Windows order vectors for the host label, the low-uid sign-in account in the
count, a same-account claim of another product in HA-1's free-port test, row 185's mapping to `down`.

W84 at the next head: round 20's four breaks (a supervisor's stop placed as Fabric Dashboards places it, a named
bullet for `service.md`'s ops-digest pointer, the split marker rejoined, the knowledge base's step widened) and its
risks are folded in. Next: round 21 at that head, the full gate when the load allows.

W85 at the next head: round 21's two breaks (Fabric Dashboards' lines 31 to 40 with its monitor's skip; the
knowledge-base step following its grep at landing time) and its risks are folded in. Next: round 22 at that head, the
full gate when the load allows.

W86 at the next head: round 22's breaks (what DEC-0149's handoff carries; `authority.md`'s clause lines left to the
clause rule) and its risks are folded in. Next: round 23 at that head, the full gate when the load allows.

W87 at the next head: round 23's break (CT-228's state cell, the title and Next task in the acceptance step) and its
risks are folded in. Next: round 24 at that head, the full gate when the load allows.

W88 at the next head: round 24's break (the gap spec's G1) and its risks are folded in. Next: round 25 at that head,
the full gate when the load allows.

W89 at the next head: round 24's unit and seam breaks are folded in, and the full gate passed at W88. Next: round 25
at that head.

W90 at the next head: round 25's breaks (HA-1 restated incompletely in the gap spec and the conformance row, now
pointers) and its risks are folded in. Next: round 26 at that head.

W91 at the next head: round 25's seam risks are folded in. Next: round 26 at that head.

W92 at the next head: round 26's breaks are folded in. Next: round 27 at that head.

W93 at the next head: round 27's breaks are folded in. Next: round 28 at that head.

W94 at the next head: rounds 28 and 29 at `3fb5c12a` were clean on all three tiers, the acceptance edits are made
(Status accepted 2026-11-07, the markers dropped, eleven annotated lines, CT-228's state cell, this title and the
README row) and round 29's risks are folded in or filed (CT-253).
