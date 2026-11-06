# Several OS accounts on one computer: the contract's gaps

A spec of 2026-11-06 for backlog CT-228 to CT-241 and [DEC-0154](../../DECISIONS.md) (proposed). It answers the
operator's request of 2026-11-05, relayed on board thread `1fe66e6e`: read the organization's plan for a shared computer,
compare it with the contract, and write a spec per gap.

Sources, each at a commit:

- The organization's plan for a shared computer, in the workspace repository at commit `12125977` (its README, access,
  placement and runbook pages), with the knowledge base's plans, integration and rules pages at the same commit. Cited
  as `plan:<page>:<line>`.
- Fabric's hub port per account (its CO-505): fabric commit `9500ed25`, `apps/desktop/src/main/hub.ts:36-77`
  (`userHubPort`, `hubPort`, `checkPortUnclaimed`).
- This contract at `1016f0ec`, cited as `<path>:<line>`.

The computer has three OS accounts, named here by role (`plan:README.md:28`): an administrator's account, holding no
keys; the operator's own account; and an account an organization owns whole, with virtual machines under them.

## What the plan expects of the contract

The plan names no contract row in its owner table (`plan:README.md:169-176`). Its expectations reach the contract
through the products: Fabric, Fabric Dashboards and Switchboard run under each OS account with a port per account
(`plan:README.md:122-128`, CO-505); loopback is one per computer, not one per account, so every account reaches every
service the others listen with on `127.0.0.1` (`plan:access.md:17-19`); Fabric tokens carry what must cross between
accounts (`plan:README.md:87-89`); the organization's account is a machine of that organization, the operator's own
account never is (`plan:README.md:56-58`, `:81-85`); a virtual machine is a machine like any other (`plan:plans.md:21-31`);
services run in each account's container runtime (`plan:README.md:85`); and the contract's full gate runs on the
operator's account of that computer (`plan:placement.md:16`). The contract's local placement assumed one OS account per
loopback; that assumption is the root of G1 to G3.

| # | Gap | Priority | Where it goes |
|---|---|---|---|
| G1 | No rule for ports when several OS accounts share one loopback | high | DEC-0154 HA-1, CT-228 |
| G2 | A client sends a token to `127.0.0.1:<port>` without checking the listener's OS account | high | DEC-0154 HA-2, CT-228, CT-229 |
| G3 | T0 cannot be proved over TCP loopback; forwarders look like loopback | high | DEC-0154 HA-3, CT-228 |
| G4 | POSIX token files and the services directory have no owner check | medium | CT-230 |
| G5 | "Device" and "machine" mean a computer; here they mean an OS account or a virtual machine | medium | DEC-0154 HA-4 (the principle), CT-231 |
| G6 | No `machine.mode` for an OS account an organization owns whole | medium | CT-232 |
| G7 | Nothing says a restore never carries a node's identity to another computer | medium | CT-233 |
| G8 | Supervisor rules assume a person logged in | medium | CT-234 |
| G9 | A service in a per-account container has no descriptor form | low | CT-235, with CT-132 |
| G10 | No estate-level singleton for pollers and schedulers | low | CT-236 |
| G11 | The contract's own gate can pass on a shared computer with the privacy step skipped | medium | CT-237 |

## G1. Ports when several OS accounts share one loopback

- **The plan.** Each account runs its own Fabric, Fabric Dashboards and Switchboard (`plan:README.md:122-128`); the
  hub's port per account is CO-505's formula over the account's uid (`plan:README.md:124-127`, `plan:runbook.md:31`); the
  same agents run as copies in two accounts (`plan:placement.md:40`).
- **Fabric.** `hub.ts:66-77`: an offset from the first ordinary uid on macOS and on Linux, at most 100 accounts, Windows and an unknown uid
  keep 47070; `FABRIC_HUB_PORT` overrides; Fabric refuses a hub port a registered agent claims, but reads only its own
  account's descriptors.
- **The contract before DEC-0154.** A local origin is `http://127.0.0.1:<port>` and a port is a claim: an installer
  reads every descriptor in the directory and refuses a port another `id.instance` declares
  (`docs/specification/service.md:136-139`, `FAC-SEM-010`). The services directory is under the account's home, so
  each account sees only its own claims.
- **The consequence.** Two accounts can claim one port without either installer seeing it; the second fails to bind,
  or a host reaches the other account's copy of the same agent, whose well-known document answers the same
  `id.instance`, so `FAC-SEM-009` passes and the token is sent.
- **Decided in DEC-0154 (proposed), HA-1.** The port is recorded per counted account, in the service's own state and the
  descriptor's `origin`. An installer keeps the port its own `id.instance` records when that instance's listener holds
  it or nothing does; it chooses a new port, free on the computer (not listening, in no other `id.instance`'s
  descriptor, in no other account's claim), only when none is recorded or another holder has it. It writes a claim
  `.passioncode-ports.<service-id>.<account>.json` in the computer's shared sticky folder (`<account>` the numeric uid,
  or the SID on Windows, never a login name that can be renamed), owned by that account, holding only
  `{schema, service, account, ports, updatedAt}`; the installer writes it at install, and the service itself
  rewrites it at every start, not only when it is missing, rebuilt from the account's descriptors and own state after
  its lock. On Windows the claims folder `%ProgramData%\PassionCode\port-claims` is created, with its ACL, by the
  administrator's setup step of a Fabric node's first installation (one elevation); a service that finds it missing or
  with another ACL reports that once and records its port anyway. A claim whose file owner
  uid (owner SID) is not its `account`, or of an account no longer on the computer, is ignored, and a claim grants
  nothing. When the claim's path is held by another owner, the installer records its port anyway and reports the
  squatted path; at uninstall it rebuilds the claim from what remains, deleting the file when no port remains. A computer
  with one counted account keeps its historical default port and writes its claim too; a client reads the port only
  from the descriptor or the service's record; a uid formula is only an allowed default when recorded and checked. The
  first proposal, a reserved band for hubs and one band per account, was not taken: every product would have to
  compute it, and it says nothing about who listens.
- **Acceptance (CT-228).** The claim file's schema and a reference for the choice with vectors (a port kept, a port
  chosen, a squatted path, an absent account's claim, a claim aged out of a temporary folder); the products' rows
  (Fabric CO-513, the adapter FAA-225, Project Observatory OBS-354) green against them.

## G2. The listener's owner, before a token

- **The plan.** Any account reaches every service another listens with on `127.0.0.1` (`plan:access.md:17-19`).
- **The contract before DEC-0154.** A host compares the well-known identity with the descriptor's and refuses a
  `foreign` answer (`service.md:207-209`, `FAC-SEM-009`); the trust anchor is loopback and the Host and Origin guard
  (`service.md:540`); the threat model names only the same user (`service.md:526-528`). The local channel checks the
  peer's uid both ways on its socket (`docs/specification/local-channel.md:16-24`, DEC-0075); the TCP surfaces had no
  equivalent.
- **The consequence.** Another account that holds the port while the service is down, or its own copy of the same
  agent, answers the same identity and receives the token.
- **Decided in DEC-0154 (proposed), HA-2.** Before any credential and before "healthy", the client establishes that the server end
  of its connection is its own account's: from the socket table (macOS `netstat -anv -p tcp` or
  `sysctl net.inet.tcp.pcblist64`, never an own-account `lsof` alone; Linux the `uid` column of `/proc/net/tcp` and
  `tcp6`; Windows `GetExtendedTcpTable` and the owning process's token user), or by the listener's proof of a secret
  only this account reads. No listener is `down`; another account's listener, or an owner that cannot be told, is
  `foreign-user`, ordered before `foreign` and winning over every answer. On a computer with more than one counted account, a server should refuse a peer of another
  account before reading, and must when its clients are other vendors' programs; rotation when a service comes up on
  another port; a PKCE-bound code sent to a loopback redirect is not a credential here.
- **Acceptance (CT-228, CT-229).** The state order's vector file with Fabric Dashboards' three cases at `53a62f9`;
  each client's own test with a listener of a second account.

## G3. T0 over TCP loopback

- **The plan.** Accounts are separated, Fabric tokens carry what crosses (`plan:README.md:87-89`); a guest of a virtual
  machine reaches the computer's loopback through its gateway unless a packet filter closes it (`plan:access.md:27`,
  `:44-52`).
- **The contract before DEC-0154.** T0 is a caller on loopback under the owner's OS account (`delegation.md:470`); a
  callee requires no token from it (DL-26); a loopback caller of another account is T2 (`delegation.md:526`), but the
  local floor (bind `127.0.0.1`, the Host and Origin guard) cannot tell accounts apart.
- **Decided in DEC-0154 (proposed), HA-3.** On a computer with several accounts a token-free loopback door is T0 only when it checks
  the peer's account (Project Observatory's local channel, DEC-0075, is the example); a forwarder of a virtual machine
  or container is a relay and its callers are T2; since it runs as the guest's owner, a computer whose guests reach its
  loopback closes the path or admits no token-free caller on TCP.

## G4. A POSIX owner check of token files (CT-230)

- **The contract.** A token file is mode `0600` (`service.md:520-522`); Windows readers check owner and ACL
  (`FAC-SEM-079`); POSIX readers have no owner rule, and nothing refuses a services directory or descriptor owned by
  another account. `FABRIC_SERVICES_DIR` may point anywhere (`service.md:125`). The grant projection already refuses
  loose modes and a foreign owner (`src/grant-projection.ts:42-47`).
- **The consequence.** With a shared services directory another account can plant a descriptor whose `tokenFile`
  names the reader's own token and whose `origin` is the planter's port.
- **Needed.** A POSIX reader refuses a directory not owned by the current uid or with group or other bits, and a
  descriptor or token file with a foreign owner, those bits or a symlink; a rule code and a reference with vectors.
  The adapter's kit already does it in its token-file reader (reported on the thread).

## G5. A device is an OS account or a virtual machine (CT-231)

- **The plan.** The computer joins the organization only through the organization's account and the virtual machines
  under it (`plan:README.md:56-58`); a virtual machine is a machine like any other (`plan:plans.md:21-22`); one node
  identity per machine (`plan:integration.md:115`).
- **The contract.** A device is a computer (`devices.md:14`); a machine is a device enrolled in the estate
  (`estate-record.md:86`); an agent runs on one machine once per context (`contexts.md:68-80`, `FAC-SEM-074`).
- **Decided in principle in DEC-0154 (proposed), HA-4.** Each counted OS account and each virtual machine is its own device; the
  host label is the only value the contract defines for telling one organization that two of its devices share a computer.
- **Needed.** The estate's definitions, `FAC-SEM-074` per node, whether a virtual machine records its computer beyond the
  label (default: not), a node-summary fixture of a second account that carries nothing of the first.

## G6. A mode for an account an organization owns whole (CT-232)

- **The contract.** `machine.mode` is `A` (the organization administers the whole computer, from an `mdm` layer only,
  `FAC-SEM-042`) or `C` (only its own work) (`devices.md:414`, `node-summary.md:33`, DEC-0118). Under `C` the account's
  own skills and servers, which are the organization's, are left out; `A` needs MDM and claims the whole computer.
- **Needed.** A mode (proposed `B`) for an account the organization owns, under which the summary lists that account's
  whole harness and nothing outside it; an additive enum value and `FAC-SEM-042`'s update; the operator decides what
  the organization may see.

## G7. A restore carries no node identity (CT-233)

- **The plan.** The operator's account is restored from another computer's machine pack as a new machine with its own
  device id (`plan:runbook.md:12`, `:26-27`).
- **The contract.** Adding a machine and replacing a key are ceremonies (`ceremonies.md:105`, `:268-273`); a file-held
  device key is exportable (`devices.md:66-67`); nothing forbids a restore from carrying a node's id, keys, epochs,
  counters or enrollments to another computer, so a restored copy could renew by the key on record while the original
  still runs.
- **Needed.** A restore never carries the machine id, the device keys, enrollment certificates and keys, stream epochs
  and counters, the hub key or the computer's secret; the new computer joins anew; a server that sees two presenters of one
  certificate revokes it. Fabric's CO-515 is the same rule.

## G8. Services of an account with no open session (CT-234)

- **The plan.** The working accounts have no graphical session (`plan:README.md:34`) on an always-on computer.
- **The contract.** launchd with `RunAtLoad` and `KeepAlive`, systemd user units, the Task Scheduler running only when
  the user is logged on (`service.md:684`); no launchd domain, no lingering, no rule for an account not logged in.
- **Needed.** The domain (`gui/<uid>` where a person logs in; otherwise a domain or daemon that runs without a login,
  or the node as supervisor), `loginctl enable-linger` on an always-on computer, and `down` with a named reason when the
  account's domain does not exist. The adapter's FAA-228 waits for it.

## G9. A service in a per-account container (CT-235)

- **The contract.** `lifecycle.manager` is `launchd`, `systemd`, `task-scheduler`, `node`, `person` or `none`
  (`schemas/service-descriptor.schema.json:220-225`); the package has no container image field (CT-132).
- **Needed.** A container runtime as supervisor, where `service.lock` lives, and the origin as the forwarded
  `127.0.0.1` port (the forwarder runs as the owning account, HA-3). Decided with CT-132.

## G10. One computer per singleton (CT-236)

- **The plan.** Every singleton (a bot polling a token, a scheduler, a publisher, a gateway) has exactly one computer
  (`plan:placement.md:3-5`, `:33`); a cutover moves one agent at a time (`plan:runbook.md:61`).
- **The contract.** `service.lock` gives one copy per computer (`service.md:683`); a placement is once per machine and
  context (`FAC-SEM-074`); nothing limits an agent to one machine of the estate.
- **Needed.** Project Observatory's placement record `observatory-placement/1` as a readable norm for singletons, in a
  decision of the second wave; the schema stays `/1`, additive.

## G11. The contract's own gate on a shared computer (CT-237)

- **The contract.** `pnpm check` runs typecheck, test, the UX lint, the docs check and the privacy check; the privacy
  check runs only where the denylist exists and otherwise skips and passes (`src/privacy-check.ts:21-25`,
  `src/privacy-plan.ts:32`); leases and ids are refs on `origin`, while the run journal on the `fs` plane stays on the
  machine that wrote it.
- **Needed.** The gate names the computer that ran it and fails rather than skips on an operator's machine without the
  denylist; the prerequisites (pnpm, python3, the org-index sibling, the denylist restored, `gh` signed in) and the
  journal per machine are written in `AGENTS.md`.

## Filed from the readings of DEC-0154

- CT-238: on a computer with one counted account, a token-free door still admits that account's own guests through a
  forwarder (an accepted gap of HA-3).
- CT-239: the device-policy member that turns the host label on; until it lands a node sends none.
- CT-240: every positive and negative fixture named by exactly one catalogue row (a gap older than DEC-0154).
- CT-241: the organization's "these devices share a computer" display and its scenario.

## Already covered

- An online instance registered as a remote descriptor: [remote placement](../../specification/service.md#remote-placement).
- An app moved to the account's own Applications folder rewrites its descriptor (`service.md:104-108`).
- The local channel checks the peer's uid both ways (DEC-0075).
- One enrollment per organization with its own keys (DEC-0128), renewal by the key on record (DEC-0148): the
  organization's account enrolls anew.
- Moving the hub to an always-on computer: the "Move the hub" ceremony (`ceremonies.md:325`).

## The products' rows

As each product reported them on thread `1fe66e6e` on 2026-11-06 (a reading of the board, not of their code); DEC-0154's
Compatibility keeps the same list: Fabric CO-505, CO-513, CO-514, CO-515; Switchboard SB-269, SB-273, SB-274; Fabric
Dashboards FD-156, FD-158, FD-159; Fabric Inbox B-217; the Fabric Agent Adapter FAA-225 to FAA-228; the first
organization server VES-LOOPBACK-OWNER; the PassionCode launcher PC-152; Project Observatory OBS-354, OBS-355, OBS-357.
