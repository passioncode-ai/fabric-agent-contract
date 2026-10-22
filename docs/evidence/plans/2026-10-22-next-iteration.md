# The contract's next iteration (2026-10-22)

The contract's own plan for the PassionCode iteration the operator opened on 2026-10-22
(fabric-workspace `knowledge/plans.md`, "The next iteration", row 10, which named no date until this page).
Status lives in [the backlog](../../backlog.md); this page holds the order and the reasons for it.

## Where the contract stands

- `main` `40eb352` (2026-10-22): the contract review merged ([handoff](../../handoffs/2026-10-21-contract-review.md),
  #137 `ec21af7`, #138); the last decision is DEC-0096 (#135 `bbebae6`); `pnpm run check` exit 0 on `05b19d9`
  with 7 732 tests (the handoff's "Checks actually run").
- The contract carries no tags; consumers pin commits. The pin to take is still `63bb296` or later
  (thread `43d85238`), with `common.schema.json` copied from the same commit since #137.
- Open on the board before this page: four asks addressed to the contract with no answer (below), the roll call of
  2026-10-21 (thread `1316a045`) and the status of 2026-10-22, both unanswered.

## The asks this iteration answers

| Ask | Thread | Who waits | Row |
|---|---|---|---|
| Fabric 0.3.9's board additions (`answered`, default deadline, `noResponder`, `com.list` `unread`/`since`/`read`, bulk `com.read_ack`, the hub's 503 body) | `a5969ac5` | Fabric (ships 0.3.9 on 2026-10-23), every board reader | CT-81 |
| A typed reaction on a reply to an announcement (`adapted`, `row`, `not-affected`) | fabric-workspace plans row 10; thread `c430513b` | fabric-workspace (who has not answered), Fabric CO-377 | CT-81 |
| A-3: an enrollment token role `org-cloud` and `custody: processor-hosted` for `peer` | `348467e5` | the first organization server's VES-REC by 2026-10-31, the platform's claim ceremony | CT-82 |
| S7, S8, S10: `node-summary/1` (harness per context, drift against a baseline) and the repair action | `ba63565c` items 7, 8 | the first organization server's VES-HARNESS, VES-INTEGRITY, VES-REMEDIATE; Project Observatory's node | CT-83 |
| S4: directory and visibility, the call queue at the hosting node, the load section in `fabric-service/0.1` | `ba63565c` items 1 to 3; `b2511678` | Fabric CO-376 (2026-11-07), Fabric Dashboards' load panels, Observatory | CT-84 |
| S1: `agent.call` over the relay and the T1 binding of an operator's own machines; A-6 trust profile per machine; A-7 the call rule | `ba63565c` item 4; `348467e5` items 1, 2 | the two-Mac test (S1), relay RLY-05/07, Fabric's hub issuer | CT-85 |
| S5, S6: the credential request and its envelope; the call record; the envelope between one person's own machines and the estate key | `ba63565c` items 5, 6; `21684886` | Project Observatory (issuing, OBS-191, OBS-194), Fabric (call records), the first organization server | CT-86 |
| A `purpose` rejection reason, a share-registration refusal the node retries, the renewal of a recently expired device certificate | `ba63565c` items 9, 10 | the first organization server, Project Observatory's node | CT-88 |
| The hub moved to another machine; passkey recovery | `b2511678` (readiness review, 2026-10-22) | Fabric's ceremonies (CO-320), the two-Mac test | CT-89 |
| A package path and a device's free text cut short by U+2028 and U+2029 | `de8834d8` | every installer, every reader of device check-ins | DEC-0097 (done), CT-87 |

**Done first, outside the order:** DEC-0097, an open security hole found on 2026-10-22 (a package path that
traversed after U+2028); fixed the day it was found, CT-87 for its adoption.

## Order and dates

Each row is one decision (one `DEC`), taken through the task pipeline with blind readings as before; a date is the
day the decision is merged on `main`, after which each consumer adopts at its next pin.

| # | Row | Why in this place | Merged by |
|---|---|---|---|
| 1 | CT-81 | Fabric already serves these bytes; until the contract carries them every pinned reader of `comms-*` schemas refuses or misreads `answered` and `noResponder` | 2026-10-24 |
| 2 | CT-82 | small, additive, and the first organization server's VES-REC has a date | 2026-10-26 |
| 2a | CT-88 | small, and the first organization server misreads a refusal today | 2026-10-27 |
| 3 | CT-83 | the first organization server's three rows are blocked on it now (roll call line 4) | 2026-10-28 |
| 4 | CT-84 | Fabric starts CO-376 after 0.3.10 and needs the wire first | 2026-10-31 |
| 5 | CT-85 | the two-Mac test needs it, and it waits on nothing the contract does not own except the relay's deploy, which can follow | 2026-11-04 |
| 5a | CT-89 | the ceremonies' two missing texts, before the two-Mac test is accepted | 2026-11-05 |
| 6 | CT-86 | builds on CT-84's queue and CT-85's call; Observatory's issuing doors come first | 2026-11-07 |

Between them, as slack: CT-75 (the author documents' open definitions), then CT-80, CT-78, CT-77, CT-79 and CT-76
from the review, in that order.

## What the contract does not take

- Building anything: the hub, the node, the queue's storage and the panels belong to their products.
- Deciding the relay's deployment (RLY-05, RLY-07) or the order of Fabric's S1 rows; the contract writes the wire
  and states what a reader may assume.
