# Handoff — embedded dashboard profile (`fabric-dashboard/0.1`, DEC-0036)

## Objective

Give every agent dashboard one set of rules for living inside a host pane (Fabric Dashboards with
the agent console beside it): width, navigation, scrolling and appearance, plus a carrier for the
operator's theme. Requested by the operator on 2026-10-11 after the brand agent's board lost its
navigation in a narrowed pane.

## Done

- DEC-0036 in `docs/DECISIONS.md`; the profile `docs/specification/embedded-dashboard.md`
  (ED-1…ED-10): 360 px page floor, sideways scroll below it, reachable navigation, wide content in
  its own box, one vertical scroller, the host floor `max(480, minWidth)`, the cookie
  `fabric_appearance`, the well-known declaration and the seven reference themes.
- `schemas/service-dashboard-extension.schema.json`, six fixtures (three positive, three negative),
  the `dashboard` extension key in `src/extensions.ts`, `test/embedded-dashboard.test.ts`.
- Links from `service.md` (*Well-known document*, *Surfaces*), `docs/DOCMAP.md`, `README.md`,
  `CONTEXT.md` (dashboard floor, appearance carrier).

## Checks run

- `pnpm run check` → exit 0 (typecheck, 598 tests, UX lint, docs check, markdownlint).
- Planted defect: swapping two theme ids in ED-10 turns `lists the same reference themes in ED-10
  and the schema` red; restored, 7/7 green.

## Open

- Fabric Dashboards: ED-7 (the console stops at the host floor) and ED-8 (the carrier and the
  operator's picker). Tracked in its own backlog.
- fabric-agent-adapter: the dashboard kit (tokens, layout, the seven themes), the layout check that
  measures ED-1/3/4/5, the `check_service.py` rule for ED-9, and the upgrade notice for agents
  adapted before this decision; then a repin to this change's merge commit.

## Next task

Repin fabric-agent-adapter to the merge commit of this change in the release that ships the
dashboard kit.
