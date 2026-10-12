# P4-01 — services on every system: CT-01 decided, lifecycle per system, the descriptor's hygiene

- **Node:** N08 · **Wave:** 4 · **Closes:** CT-01, F-A-027, F-B-211, F-D-008 (all four are CT-01), F-B-202, F-A-013,
  F-B-206, F-B-207, F-B-208, F-B-209, F-B-210, CON-OE-11. Read every receipt in [inventory.json](../../inventory.json).

## Agreed (2026-10-12)

- **Fabric (CO-238):** points 1–5 below as written; 300 s is enough. Fabric is not a supervisor today (its one
  background job is `ai.passioncode.fabric-workspace-sync` under launchd); when it starts services it sets the marker for
  a supervised start and not for a manual one; Windows uses Task Scheduler, Linux `systemd --user`.
- **Fabric Dashboards (FD-37):** an outage is only state `down` (no health answer for 15 s local, 60 s remote); a copy
  waiting for the lock shows `duplicate`, not an outage, **provided the holder keeps answering `/fabric/v1/health` for the
  whole wait**. Off macOS, supervision goes through Project Observatory's node (`node.lifecycle`, the first organization
  server's target architecture v4 §5), which honours the same wait and exit.
- **The adapter (kits 0.18.0+):** already behaves so under launchd and systemd (back-off from 0.5 s doubling to 30 s,
  at most 300 s, touching nothing, taking the lock over when the holder leaves, then exit 75 naming the holder's pid).
  Task Scheduler cannot set an environment variable in its task XML, so the owner session ruled: **the marker is the
  environment variable `FABRIC_SERVICE_SUPERVISOR=<manager>` or the argument `--fabric-supervisor <manager>`**; if both are
  present and differ, the copy is unsupervised and exits 75 at once naming the conflict; `MultipleInstancesPolicy
  IgnoreNew` stays recommended for Task Scheduler.

## What to build (one decision)

1. **One copy (CT-01).** No side effect without the lock and exit 75 naming the holder stay. A copy started by a
   supervisor — marked as above with `launchd`, `systemd` or `task-scheduler` — MAY wait in-process for up to 300 s,
   touching nothing (no port, no file but reading the lock), then exits 75 naming the holder; a copy started by hand exits
   75 at once. The holder keeps answering health during the wait. Close CT-01 with the decision as receipt.
2. **Supervisors per system (CON-OE-11).** Amend DEC-0015's "launchd only" as DEC-0032 began: launchd, `systemd --user`,
   Task Scheduler, and `node` (Project Observatory's `node.lifecycle`) named as the manager that supervises on another
   system; the Supervisor row lists the marker for each.
3. **Lifecycle rows per system (F-B-202, F-A-013, F-B-208):** Install, Code, State, Uninstall for launchd, systemd and
   Task Scheduler, with data, log and cache locations (macOS `~/Library/...`, XDG on Linux, `%LOCALAPPDATA%` on Windows);
   retitle `service.md` to cover local and remote placements; reword FAC-SEM-024's row and the diagram as the receipts
   say.
4. **Descriptor hygiene:** killing fixtures for the DEC-0032 rules (F-B-206); refuse a forward-slash UNC path `//server`
   in `localPath` (F-B-207); refuse launchd `label`/`plist` beside `systemd` or `task-scheduler` (F-B-209).
5. **Windows token files (F-B-210):** `src/windows-token.ts` `windowsTokenAclProblem(...)` as the receipt sketches, with
   vectors (Administrators owner accepted, an Everyone ACE refused, a deny ACE ignored, CREATOR OWNER refused), a rule
   code and a row in `conformance.md` *Clients and readers*.

## Proof

A fixture per refusal; the marker's three forms (variable, argument, both differing) as vectors a kit runs; the reader
function's vectors; plants; floors. Consumer rows: the adapter implements the argument in both kits and writes it from
`task_xml`/`taskXml`; Fabric sets the marker when it supervises; Project Observatory's node honours the wait; Fabric
Dashboards reads `duplicate` during the wait (no change).
