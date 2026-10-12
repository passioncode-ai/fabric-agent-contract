# Adoption of the contract — measured pins

What each organization repository that pins the contract pins, read from its default branch. A decision's
*Status* line says "consumer adoption pending" when it was written; this page says what was measured since, and links
from those *Status* lines (DEC-0065, inventory F-A-029). **A pin that contains a decision is not proof that the consumer
implements it.** It is the precondition: a consumer cannot implement a decision its pinned commit does not contain. Proof
of implementation is the consumer's own test, named on the [board](../backlog.md).

## 2026-10-12

Method: for every repository of the organization, and for Project Observatory's node, which lives in a private
repository and is named here only as the product, `gh api repos/<owner>/<repo>/contents/fabric-contract.lock.json`
on the default branch (schema [`contract-pin.schema.json`](../../schemas/contract-pin.schema.json)), then
`git show <pin>:docs/DECISIONS.md` in this repository for the decisions that commit holds. Repositories without the file do not pin
the contract. Private agents of the operator that pin the contract are not named in this public repository.

| Consumer | Pinned commit | Commit date | Decisions in the pinned `docs/DECISIONS.md` | Contains DEC-0020…DEC-0029 |
|---|---|---|---|---|
| Fabric Agent Adapter | `b291bf0` | 2026-10-12 | DEC-0001…DEC-0055 | yes |
| the relay | `51719e4` | 2026-10-12 | DEC-0001…DEC-0059 | yes |
| Project Observatory (node) | `20a818e` | 2026-08-27 | DEC-0001…DEC-0014 | **no**: it predates `memory/0.1` (DEC-0023), whose first provider it is named |

The Project Observatory dashboard's lock file is the earlier `observatory-local-mcp` profile, which pins schema files of
its own release rather than a contract commit, so it is not a contract pin. The Observatory node's re-pin is owed on
board row CT-20.
