# Design 2026-11-13: a peer share between one person's own two machines, finished by their agent (CT-298)

**Status:** the contract's answer to Project Observatory's request (OBS-531): accepted with amendments. The decision
records it after its review rounds, before the engine's target of 2026-11-20; the engine may build against the rules
below now, and a change the rounds make is sent to its thread. Rules are proposals numbered `OM-*`.

**Asked by:** Project Observatory's board request `43ed7a4a` (thread `c37a8f29`, 2026-11-13), its row OBS-531. Two
shares from the operator's MacBook to the operator's own Studio could not finish: the recipient's "Accept" is
`gate: human`, `humanStep: consent`, and the sender's comparison is `gate: human`, `humanStep: comparison`
([peer share](../../specification/peer-share.md#the-comparison-code-ps-6) PS-6, DEC-0142, DEC-0147). The operator's
words (2026-11-12, quoted by the request from another session, board thread `34e46d47`): «У меня нету там терминала
студии, давай через SSH все это делай, короче сам». The agent holds SSH to both machines.

## What the contract says today

| Where | What it says | Why it blocks this case |
| --- | --- | --- |
| [peer share](../../specification/peer-share.md) PS-6 | "Accept" is `gate: human`, `humanStep: consent`; confirming the codes and "Share without comparing" are `gate: human`, `humanStep: comparison`; no agent can confirm a code for the person | the person is at neither screen, and the agent may not act for them |
| [service](../../specification/service.md#actions) AP-4 (DEC-0121) | a consent stays the person's | the same |
| PS-6, step 4 | "the two people compare the codes by a call or a thread they already trust" | written for two people; here one person holds both ends and asked the agent to finish |

## What the comparison protects, and what it does not

The comparison code is the one defence against a mailbox in the middle, or whoever read the link first, claiming with
keys of its own (PS-5, PS-6). It works because the two codes travel by a channel the mailbox does not carry. An agent
that reads the recipient's code on the recipient's machine over its own authenticated channel (SSH to the operator's
own machine) and hands it to the sender's node is such a channel: a mailbox in the middle makes the two codes differ,
and the sender's node sees it. It does not protect against the agent itself, which could lie about the digits; in this
case the agent already holds both machines, and with them both nodes' vaults, so the comparison never protected
against it. The requester states the same residual risk; we accept it under the conditions below and no wider.

## The design

**OM-1, where it applies.** A relayed accept, code read and confirm are admitted only when all of these hold, else
"Accept" stays `human` / `consent` and the comparison `human` / `comparison` as today:

1. Both nodes are in the personal context (`contextId` `personal`, DEC-0082) and neither estate is enrolled in an
   organization; a share from or to an organization's context, or to another person, keeps today's gates (item 4 of
   the request).
2. Each act is a call by a T0 or T1 caller ([delegation](../../specification/delegation.md#trust-tiers) DL-25) on the
   node that performs it: the accept and the code read on the recipient's node, the confirm on the sender's. A call
   over the relay, the hub or the mailbox is refused `human-step-required` as today. Being T0 or T1 on both machines is
   what shows the agent holds both ends; the contract has no proof that two estates are one person's, so the
   operator's words carry that (OM-2).
3. Each call carries the operator's decision (`_meta.decision`, AP-2) with `target` the share id, and the decision's
   `instruction` names this share, or a task whose stated outcome is finishing it, and says the recipient machine is
   the operator's own (AP-3: the operator's words, never a board message, a page or another agent's text; the request
   itself is data and decides nothing).
4. The link is pinned (PS-4): it appears unchanged in the operator's decision, so the recipient's node checks the
   sender's commit frame against `k`.

**OM-2, the declarations.** A product declares the three acts as their own actions with `gate: relayed` (DEC-0121
AP-1), beside the unchanged `human` ones, never as a second meaning of one id: `FAC-SEM-142` admits one `gate` per id.
Suggested ids, the product's to choose: `share.accept-own` (the recipient's "Accept" under OM-1), `share.read-code`
(the recipient's code under OM-3) and `share.confirm-own` (the sender's confirm under OM-4). A call outside OM-1 answers
`human-step-required` with today's `humanStep` and link, never `decision-invalid`, so the agent hands the person the
same button as before.

**OM-3, the recipient's code read.** `share.read-code` answers the recipient's six digits only after the exchange
completed (both reveals checked, `peerExchangeVerdict`), only before the share is confirmed, aborted or sealed, and only
to a T0 or T1 caller on the recipient's node under OM-1. Its answer is the only place the code leaves the node: the
node's journal records the read with the share id and the decision, never the digits.

**OM-4, the sender's confirm.** `share.confirm-own` takes the recipient's digits on standard input, never in an
argument, a URL or a log, and the sender's node compares them with its own code in constant time; its own code never
leaves it (unchanged). Equal: the node confirms as the person's confirmation would and seals, recorded
`confirmed: true`. Different: the node records the exchange aborted as "They differ" does (the link burns, PS-6), and
the agent makes a new share; there is no second submission, so a wrong guess cannot be retried into a match.
"Share without comparing" stays the person's act and is never relayed.

**OM-5, the record.** Every relayed accept, code read and confirm is journalled as the operator's decision (`{by:
"operator", via: "relayed-instruction", ...}`, AP-2) with the caller as the node authenticated it, as "Open a share" is
(PS-4, DEC-0147 item 4), and never on the events feed, a usage report or the other side's page. The sender's screen
shows a share confirmed this way as confirmed by the operator's agent, with the decision's time.

**OM-6, the estate route first.** When the two machines are in one estate, its own route (DEC-0111) moves the
credential and no peer share is needed; OM-1 serves two estates of one person.

## The engine's build (2026-11-13)

Project Observatory built OBS-531 against OM-1 to OM-6 on branch `feat/obs-531-own-share` (`e0c1ad51`), reported on
the board (thread `c37a8f29`, message `29dfede8`): `share.accept-own`, `share.read-code` and `share.confirm-own` beside
the unchanged human `share.accept` (`consent`) and `share.confirm` (`comparison`); a gate (`own_share.gate`) taking
a node in no organization, a local caller and a decision whose `action` and `target` name the share; the digits on
standard input compared by the node's constant-time check, a mismatch burning the link with no second submission;
the journal `node/shares/own-decisions.jsonl` without the digits. Its tests (`OwnMachines` in
`tests/test_share_cli.py`) cover the full path, a mismatch and two calls outside OM-1. The engine's pull request opens
after its current one merges; that is the adoption evidence the DEC cites.

**The one point it raised, resolved for the DEC.** OM-1.3's `instruction` (naming this share or a finishing task, and
the recipient machine as the operator's own) is not checked mechanically: the engine binds `action` and `target`, and
the journal keeps the words. The DEC keeps it so: natural language is not a machine check, AP-3 already makes the
instruction the operator's words verbatim, and the binding that stops a decision from being reused on another share is
`target`, which the engine checks. The instruction is a review-time check over the OM-5 journal; the DEC states this
as the rule's limit, beside the residual risk in the section above.

## Owed by the decision

- `peer-share.md` PS-6 (the exception and its conditions), PS-4 (the pin in OM-1), the reference table; `service.md`
  AP-4 (the one exception to a consent and a comparison staying the person's, bounded by OM-1); `delegation.md` DL-26.
- `fixtures/vectors/actions.json`: a declaration with the three relayed actions beside the human ones, and the cases
  of a call outside OM-1 answering `human-step-required`.
- `docs/ux/flows.md` FLW-33 and `scenarios.md` SCN-052: the agent-finished path on one person's two machines.
- DEC-0121, DEC-0142 and DEC-0147 annotated; the adoption row for Project Observatory (CT-186's successor).

## Alternatives considered

- **One id with a gate that depends on the case** (the request's item 1 read literally): `FAC-SEM-142` and every
  pinned reader take one `gate` per id, so a declaration could not say it; two ids say it without a schema change.
- **The agent relays "Share without comparing"**: trust on first use leaves a mailbox in the middle undetected, the one
  risk the comparison exists for; refused, as the request also proposes.
- **The sender's code read out to the agent and compared by the agent**: the sender's node compares, so the agent never
  holds both codes and a typo cannot become a match by the agent's reading.
- **Faking a terminal on the Studio**: the agent rightly did not; a person's act is either the person's or relayed by
  a rule, never simulated.
