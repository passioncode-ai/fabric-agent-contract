# Acceptance — remote service placement (run 2026-10-02)

Brief: [2026-10-02-remote-service-brief.md](../../specs/2026-10-02-remote-service-brief.md) ·
design: [2026-10-02-remote-service-design.md](../../specs/2026-10-02-remote-service-design.md) ·
graph: [graph.json](graph.json). Closed 2026-10-03.

## Ladder walk — what the REQ table could not have named

The walk went bottom-up from each REQ to a test that actually ran against the real first online
service (a private operator panel on a platform, not named here). It surfaced three absences, all
at the seam between the probe or host and a real platform router. Each became a REQ row below
**before** the table was written.

| Seam | Finding | Became |
|---|---|---|
| probe ↔ platform router | `check_service.py` required the service's own `403` for a foreign `Host`. A platform router answers it with `404` before the process sees it, so every online service behind a router failed. | REQ-R17 |
| host MCP ↔ dashboard path | `link`/`open` without a path returned the origin root as `http_url`; a panel served under a path answers `404` there. Tool descriptions still said "local" only. | REQ-R18 |
| host ADR ↔ Fabric ADR | ADR-0011 claimed Fabric ADR-0083 says «loopback only». It does not: ADR-0083 is scoped to local services and stays true. | REQ-R19 |

## REQ table

| REQ | Status | Evidence |
|---|---|---|
| REQ-R01 | met | `docs/specification/service.md` § *Remote placement*; `pnpm run check` docs gate green at `2ce3922` |
| REQ-R02 | met | `schemas/service-descriptor.schema.json`; positive `service-descriptor-remote.json` and eight negatives; planted remote-`http://` and remote-launchd fixtures seen rejected |
| REQ-R03 | met | FAC-SEM-010 local-only; FAC-SEM-024 remote shape; `test/service-rules.test.ts`, a plant per rule |
| REQ-R04 | met | the full pre-existing fixture catalogue unchanged and green |
| REQ-R05 | met | DEC-0019 under lease; CONTEXT, DOCMAP, README, `docs/evidence/sources.md` updated (`2ce3922`) |
| REQ-R06 | met | `fabric-dashboards` `packages/service-host` 0.2.0: 66 tests, nine new shared vectors, mutations M1–M5 killed |
| REQ-R07 | met | `fabric-dashboards` `test/e2e/remote.test.ts` (real Electron, TLS): Online group, signed in over https, refused token → "Not answering". In production on 2026-10-03 at 08:27 UTC, the installed app logged this chain at the platform router: `POST /fabric/v1/login-code` 200 → `GET /fabric/v1/login` → dashboard 200 → guarded API 200. Pixels of the window were not captured |
| REQ-R08 | met | installed MCP, fresh process, 0.4.1: `list_services`/`service_status` → `placement: remote`, `state: ready`; `link` → the dashboard path (after REQ-R18) |
| REQ-R09 | met, no change needed | Fabric `main` has no consumer of `fabric-service-host` or the services directory: `git grep` for the package, the directory and `fabric-service/0.1` outside `docs/` finds nothing (2026-10-03) |
| REQ-R10 | met | `fabric-agent-adapter` 0.6.0: kits (Node + Python) with `checkRemoteRequest`, `wellKnownAllowed`, `__Host-` cookie, `registerRemote`; `test/fabric-service-remote.test.mjs` with real TLS e2e; probe vs the TLS sample |
| REQ-R11 | met | `test/validate.py` OK, `claude plugin validate --strict` passed; npm `@passioncode-ai/fabric-agent-adapter` 0.6.1, launcher 0.1.21; this machine updated (`fabric-agent-adapter@passioncode 0.6.1`) |
| REQ-R12 | met | `fabric-dashboards` v0.4.0 and v0.4.1: Developer ID, `accepted and stapled`, Gatekeeper `accepted`, feed `currentRelease` 0.4.1, installed `spctl` "Notarized Developer ID" |
| REQ-R13 | met | the first online service, in production: probe from adapter 0.6.1 shows 27 rules, 0 FAIL, 9 NOT_RUN. Without a token the answer is `401` with 0 bytes; `login.single-use` gives 302 then 403; the cookie is `__Host-` + Secure + `Path=/`. The token was set on the platform and the boot log reads `on` |
| REQ-R14 | met | registered on this machine from the credential vault (no value in chat or argv); `list_services` → remote, ready; opened signed in (REQ-R07 evidence) |
| REQ-R15 | met with one incident | `public-name-gate` (`git diff` added lines) chained `&&` before every public push since the incident; it also blocked one push during REQ-R18 (names were scrubbed before anything left). The incident: one private path reached a public branch when a push was chained with `;`. It was squashed out of `main` before merge, and the branch was deleted |
| REQ-R16 | met | `fabric-dashboards` SCN-030/031/032, ST-013, `docs/ux/lint.py` OK |
| REQ-R17 | met | adapter 0.6.1 `guard_verdict`: a router's 400/404/421 on a foreign `Host` passes for a remote placement unless the body is the well-known document; `GuardVerdict` (4 tests), 4 of 4 mutations killed; production 0 FAIL |
| REQ-R18 | met | `fabric-dashboards` 0.4.1 (`75eba78`): `http_url` follows the dashboard surface; tool descriptions name online services; a new test catches a mutation that reverts the fix; `npm run check` 137/137 |
| REQ-R19 | met | ADR-0011 corrected in `fabric-dashboards` `4f91508` |

## Ledgers

| Row | Status | Home |
|---|---|---|
| CO-R1 — the first online service's own UX/UI/MCP review and adaptive layout | open | the owning private repository's backlog (open row); the next run starts there with its scenarios |

No other carry-over is open. The Fabric ADR-0083 question raised during the run was resolved as
REQ-R19 (no Fabric change needed), not carried.

## Gate counts

- The contract `pnpm run check` is green at `2ce3922`.
- The adapter `npm test` is green at `d3a4c67`: validate, 152 Python and 24 Node tests.
- Fabric Dashboards `npm run check` is green at `75eba78` with 137 tests; `test:e2e` passes 5/5.
- The private service passed its five local gates (pytest, 7385 bot tests, 582 panel tests,
  lint, typecheck) and 10 of 10 mutations were killed.

The private repository's hosted CI runs only in the nightly snapshot, so it is not yet observed
for these commits. Green here means the commands above exited 0, not that every hosted gate has run.
