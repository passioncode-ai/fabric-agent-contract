# Design — online services (`placement: "remote"`), 2026-10-02

Brief: [2026-10-02-remote-service-brief.md](2026-10-02-remote-service-brief.md). Stage 2 of the
run; approved by the operator before stage 3.

## Docs study (stage 1)

| Contract the design locks | Grounded on | Retrieved |
|---|---|---|
| A host trusts a test certificate only inside the test service's own session partition; production keeps Chromium's verification | Electron `session.setCertificateVerifyProc((request, callback) => callback(0 \| -2 \| -3))` — `docs/breaking-changes.md`, `shell/browser/net/cert_verifier_client.cc` (−3 = default verification) | 2026-10-02 (context7, electron/electron main) |
| Host probes use `node:https`; no redirect is followed; tests pass their own CA | Node `doc/api/https.md` (`ca`, `rejectUnauthorized`, `servername` accepted); core `http`/`https` never follow redirects (`test/internet/test-inspector-help-page.js`) | 2026-10-02 (context7, nodejs/node main) |
| The remote session cookie is `__Host-` prefixed, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain` | MDN *Set-Cookie* (last modified 2026-09-01) | 2026-10-02 |
| Behind a PaaS router TLS ends at the load balancer; `Host` is preserved; the scheme arrives in `X-Forwarded-Proto` | Heroku Dev Center *HTTP Routing* (last updated 2026-08-24) | 2026-10-02 |

## The model

`placement` divides one protocol into two transports. **Everything a host learns about a service
— well-known document, events, login code — is the same object in both**; only reachability,
supervision and the trust anchor change.

| | `local` (unchanged) | `remote` (new) |
|---|---|---|
| origin | `http://127.0.0.1:<port>` | `https://<host>[:<port>]`, no path/query/userinfo, not a loopback or private address |
| trust anchor | loopback + Host/Origin guard | TLS certificate of the origin + the service token |
| supervisor | launchd (`lifecycle.manager: "launchd"` or `"none"`) | none — `lifecycle.manager: "none"`, no launchd fields |
| well-known | unauthenticated, <100 ms | **token required**; `401` with an empty body otherwise |
| port claim (FAC-SEM-010) | yes | no (`id.instance` uniqueness still applies) |
| commands | `doctor`, `update` | `doctor` only (a local probe); `update` refused |
| host controls | start/stop/restart via launchd | none |
| host probe | 2 s timeout | 8 s timeout; ADR-0008 holds — a missed probe is not an outage |
| session cookie | `HttpOnly; SameSite=Strict` | `__Host-` name, `Secure; HttpOnly; SameSite=Strict; Path=/` |
| behind a TLS proxy | — | `Host` must equal the origin host; a platform-set `X-Forwarded-Proto` other than `https` is refused |

## Modules (build order — walking skeleton first)

| # | Module | Repository | REQs | Done when |
|---|---|---|---|---|
| M1 | **Contract** — spec text, `placement` + conditional origin in the descriptor schema, token-gated well-known for remote, semantic rules (FAC-SEM-010 local-only, FAC-SEM-022 remote shape), fixtures incl. planted incompatible ones, DEC-0019 | fabric-agent-contract | R01–R05 | `pnpm run check` green; plants seen rejected; merged |
| M2 | **Kits + probe** — Python and Node kits: `check_request_remote`, `build_well_known` behind the token, `__Host-` cookie, `write_remote_descriptor`; `check_service.py` probes a remote origin; a remote sample served over TLS in tests; skill text (boundary, a remote Step) | fabric-agent-adapter | R10, R11 | kit tests + probe PASS against the TLS sample; validator green; released to npm; local copies updated |
| M3 | **Host** — `service-host`: descriptor validation, `https` request with token and timeout, remote state precedence, vectors; Fabric Dashboards: global group, open via login code, no controls, MCP `placement`, `open?url=` for a registered https origin; UX scenarios + copy | fabric-dashboards (+ Fabric runs the vectors) | R06–R09, R12, R16 | `npm run check` + e2e against the TLS sample; MCP real-client call; released, installed |
| M4 | **First online service** — the operator's existing dashboard serves the four routes, token on its platform, deployed; registered by a local descriptor on this machine | the operator's private repository | R13, R14 | probe PASS against production; visible and opening signed in |
| — | R15 (no operator name in public artifacts) is a gate on every public PR of M1–M3 | all public | R15 | grep gate exit 1 on each public diff |

**Walking skeleton:** M1's schema accepts one remote fixture → M2's Node kit serves it over TLS →
M3's `service-host` reads it as `ready`. Each later step widens that one path.

## Failure behaviour (what each side does when something is wrong)

| Situation | Service | Host |
|---|---|---|
| no / wrong token on well-known | `401`, empty body, constant-time compare | state `down`, reason «the service refused the token» — never `foreign` (nothing was disclosed) |
| identity in the answer differs from the descriptor | — | `foreign`; token not sent again until the descriptor changes |
| TLS invalid / name mismatch | — | `down`, reason names TLS; no retry without verification |
| redirect | — | not followed; `down`, reason «the service answered with a redirect» |
| `http://` in a remote descriptor | — | `invalid` (schema), never contacted |
| timeout / network | — | ADR-0008: last state kept until the missed-probe threshold, then `down` |
| old host (≤0.3.4) reads a remote descriptor | — | `invalid` «origin must be http://127.0.0.1:<port>» — safe, already in the vectors |
| platform says `X-Forwarded-Proto: http` | `403` one sentence | `down` with that sentence |

## UI verdict

User-facing: yes (Fabric Dashboards). Stage 3 runs the UX track in fabric-dashboards
`docs/ux/scenarios.md` (super-ux), the copy track for the group title, card reasons and empty
state, and the visual track on the existing card — text-only design surface (D-11).
