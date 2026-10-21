# 2026-10-21: what an agent uses (DEC-0096, CT-70)

## Objective

Fabric Dashboards' proposal (thread `131648c0`): let an agent declare what it uses, so a host draws the chain.

## Done

- `schemas/service-connections-extension.schema.json`, the key in `src/extensions.ts`, `src/connections.ts`
  (`connectionsView`, `FAC-SEM-127`) wired for `service-well-known`.
- Vectors `fixtures/vectors/connections.json` from `tools/vectors/connections.ts`; one positive and two semantic fixtures;
  `test/connections.test.ts`.
- The page `docs/specification/connections.md`, a line in `service.md`, two conformance rows and the register row,
  DEC-0096, DOCMAP, README, CONTEXT, backlog CT-70.

## Also in this change (the post-merge audit of 2026-10-21)

- Documentation fixes from a blind read of `main` `c55f2d5`: stale handoff and backlog states, a duplicated DOCMAP
  row, one Next free ID marker instead of two, worded as when it was written; the access-log scenario, flow and screen
  name a partner's reads (DEC-0090); SCN-018 no longer calls an outside person a partner; a reader row for the usage
  report's lower bounds; CT-44's SEM evidence; MERGES.md marked as not written since 2026-10-11.
- `pin:check` fails a pin that is not a commit of the contract's history (`pinHistory`), which passed an unreachable
  pin before; the folder-attribution growth tests retry up to three times on a loaded machine.
- From the code audit: `partnerUsage` summed a cell's costs by copying its list per row, quadratic in one cell (16 s on
  100 000 rows); now it appends, and a test of one cell with 100 000 rows guards it. The delegation chain and the meter's
  window read a partner actor only as `isPartnerActor` does. `support-quality-daily/1`'s `checks` is never `{}`, and a
  check's pass rate counts as judged under a test. The catalogue's revision test compares with the merge base.
- New rows CT-71; CT-68 widened.
- From the second readings: a credential URL inside prose is found (every URL in a member is read by `secretUrl`), a
  bearer word without a token is prose, every answer is a fresh object, vectors for each detector branch and for
  `failing` by id rather than target; the growth tests time CPU, not the wall clock; the connections user path is
  JTBD-11, JRN-10, ST-026, FLW-21, SCR-24 and SCN-032.
- From the third readings: a neutral example service in the vectors and fixtures (no private agent's name); every
  string member is checked, an `sk-` key holds a digit, a Telegram bot token is a key, and a URL is the whole piece to
  the next space, so a password holding a bracket or a quote is found; the hosted CI checks out the whole history
  (`fetch-depth: 0`), because `pin:check`'s test asks whether a commit is on it; CT-72 records the folder-attribution
  growth tests' slack.
- From the fourth readings: a URL is read from every scheme in a piece, with closing characters put back (one, since the fifth)
  (an IPv6 host, a punctuation-only `api_key`, glued URLs); an `sk-` key and a bot token hold a digit and an upper-case
  letter; the last private name in a vector replaced, and the name added to the operator's private-terms denylist so
  the privacy check catches it; CT-70 measured against the final vectors; CT-73 for the two detectors (DEC-0044).
- Found by the author after the fourth readings: the upper-case rule missed a lower-case OpenRouter key
  (`sk-or-v1-` and 64 hex characters); an `sk-` key now holds a digit and an upper-case letter or 32 or more characters.
- From the fifth readings: a Telegram bot secret is exactly 35 characters, so a ticket id and a title is a name; one
  closing character is put back, not four (no input needs more); vectors for an upper-case scheme, a credential in the
  first of two glued URLs, AWS, GitLab and Slack shapes, and each closing character after an IPv6 host; the page
  summarises the shapes and calls them a variant of DEC-0044's detector, narrower and wider.
- From the sixth readings: the reference `credential` and the vectors define what counts, the page summarises them
  (lower-case prefixes, a Bearer token's 12 characters, the mixed-case condition); a 40-character run mixing cases and
  digits (an AWS secret access key) is refused outside a URL too; a bot secret is 34 or 35 characters; CT-73 lists
  every measured difference from the shared detector.
- From the seventh readings: the long run is looked for per piece and between a path's `/` (`longSecretPiece`, now
  shared with `secretArgument`), so a `provider/Model-Name-32B` model id or a commit URL with an upper-case owner is
  declared; vectors pin each numeric boundary the page states;
  a ticket title of 40 or more mixed characters with a digit is recorded as a long run, not stepped around.
- From the eighth readings: the long run follows the member, not a path guess: it is looked for whole in `label`,
  `purpose`, `reason` and a non-model `target` (an AWS secret with `/` or a lower-case segment is found), never in a
  model's `target` (any `provider/model` id, `NousResearch/…` too), and a URL is read by the shared `secretUrl`;
  `src/secret-shape.ts` is back to its base apart from two exports; SCN-032 gives the recovery for a look-alike;
  50 000 random AWS-shaped keys in a label are all refused; vectors pin the long run's 39/40, 64 connections and the
  `target`, `label`, `purpose` and `reason` lengths.

## Decisions

No call count, no `usedBy`, no `direction` (see DEC-0096's Alternatives refused and the page's Not decided here).

## Checks

`pnpm run check` on each pushed head; the final head's run (exit code, test count, privacy findings) is the PR's gate
comment, posted before the merge.

## Next task

Readings, merge, then post the merge commit on thread `131648c0` for Fabric Dashboards (FD-78) and
fabric-agent-adapter (FAA-62), with CT-70's measured list of where Dashboards' reader differs and a request to replace the private example name in
its service-host README with `example-notifier.default` / `notifier.send`; set CT-70 and this handoff's
row in `README.md` to merged with #135 and the merge commit; update the Contract row of fabric-workspace
`knowledge/roadmap.md` with DEC-0096 and the merge commit, then sync. Dashboards' re-pin (FD-78) lands before any
kit emits the key (FAA-62).
