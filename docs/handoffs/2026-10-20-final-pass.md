# 2026-10-20: the final pass (DEC-0089 to DEC-0095)

## Objective

The operator asked for one last pass: ask the other projects what they still need from the contract, finish the
critical backlog and land it, so the ecosystem can be used in its final form.

## Done (all merged to `main`)

| Row | Decision | Pull request | Merge |
|---|---|---|---|
| CT-57 | DEC-0089 folder attribution | #124 | `ebfddce` |
| CT-62 | DEC-0091 `unmeasuredCalls` | #127 | `c90e31b` |
| CT-63 | DEC-0092 `fabric.project.resolve` and `pending` | #128 | `0de7640` |
| CT-60 | DEC-0093 the coding-agent catalogue | #131 | `bab2578` |
| CT-65 | DEC-0094 a device key in a file, idempotent rotation | #129 | `de9eae4` |
| CT-61 | DEC-0095 `support-quality-daily/1` | #132 | `43f82c6` |
| CT-58 | DEC-0090 the partner channel | #130 | `3d8cb17` |

Each landed after its own gate (`pnpm run check`, exit 0) and blind unit and product readings, each round's false
statements fixed in the branch. Each decision's own handoff names its readings.

## Open

- Board posts for CT-58 (thread `6e66a023`), CT-60 (thread `617c8cbe`) and CT-65 (Project Observatory and the first
  organization server): Fabric was down for its 0.3.7 release at the merges. Their texts are in this session's
  transcript; the next session sends them with the keys `ct58-merged-6e66a023-20261020`,
  `ct60-merged-617c8cbe-20261020`, `ct65-merged-observatory-orgserver-20261020`.
- The products' adoption: backlog rows CT-58, CT-60 to CT-65.
- New rows from the readings: CT-64, CT-66, CT-67, CT-68, CT-69.
- Not done in this pass: CT-30 and CT-44 (nobody named them blocking).

## Decisions

- The register markers state only the CAS counter's next value.
- A partner grant takes a share grant id (`FAC-SEM-117` holds); a catalogue reader keeps what it ships on its own
  evidence; the support-quality reader keys by service, channel and day.

## Checks

`pnpm run check` exited 0 on each branch's merged head; the gate's output is quoted in each pull request's comment.

## Next task

Send the three board posts above, then take CT-64 (what a collector sends for a session with no Project).
