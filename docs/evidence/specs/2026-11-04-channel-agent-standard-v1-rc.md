<!--
A neutralised copy of the channel agent standard, `channel-agent-standard/1`, v1 release candidate: the neutral copy its
owner published on 2026-11-04, received through the Fabric project board (request 437c404b, thread b6820b97). Kept as
the evidence behind DEC-0150 and docs/specification/channel-agent.md. Neutralised here: the examples that described one
product (its business, a customer fact and a tier's name) read as a product with orders, the fact `open_orders` and a
premium customer and tier. Nothing else is changed. The standard's sections 0 and 14 and the texts of its decisions (D-1, D-2 and the rest) are
the owner's and are not in the neutral copy. In the review log,
"this repository" means the standard's owner, not this contract. The standard is owned outside this repository; this
copy is not edited, and a later revision is a new copy beside it.
-->

# Standard: an agent on a channel people write to

`channel-agent-standard/1`, the neutral copy, made from the master by its owner. Do not edit the copy: send changes on the Fabric-board thread the copy came with.

## 1. Sides and projects

1. Every project has a **side**. The operator sets it in the signal server's project table (section 13.1); an agent
   declares the side it expects, and the server refuses a write whose declared side differs (`side_mismatch`). Section
   14 lists the sides.
2. **Nothing is composed across sides**: no row, page section, report, message, digest, summary, question or keyboard
   holds two sides, and an agent of one side never names a product of another. The estate dashboard is the only page
   that shows both, as separate sections, and only to the operator's session.
3. **Inside a side, projects stay separate too**: one ticket board, one gap registry, one question route and one daily
   report block per project; a question message, a digest line or a desk's message never holds two projects.
4. A **project** may have several agents (a support bot, a group bot, a mail agent, a review agent). They feed the same
   board, registry, route and report. **One ticket has exactly one writing agent**: the agent of the channel where it
   arrived.
5. An agent that serves several projects (a mail runtime, a review agent) keeps each project's tickets, gaps and
   questions apart, with a separate credential per project (section 2.6).
6. **Each side has its own data agent** (one that answers facts and keeps the gap registry). A project whose side
   has none gets one recommended (section 7.3); until then its lead agent keeps the gap registry, and nothing is asked
   of another side's data agent.

## 2. Tickets: the ticket board and the estate dashboard (D-3, D-4)

1. **The unit is the ticket.** Where a ticket starts and ends is a rule per channel, never the model's judgement:

   | Channel | One ticket is |
   |---|---|
   | private chat (bot or account) | the messages until 24 hours of silence on both sides, or until the ticket ended |
   | group | one root message asked, with the replies under it |
   | mail | one thread (`References`, `In-Reply-To`) |
   | store review | one review |
   | public comment | one comment and its replies |

   A message that arrives after a ticket ended opens a **new ticket**, linked to the old one (`conversation_id`, and
   `reopens`); the old outcome stays. A second question in the same ticket is counted on it (`questions`), not split.
   Automated notices (listings, receipts, alerts, newsletters) are **not tickets**: counted as `not_a_ticket` volume,
   with no outcome.
2. **Every ticket has a status and an outcome.** The status is the column it is in on the ticket board (section 3.3);
   the outcome is section 3's. Every ticket shows its age, the step it waits on, what the agent did and the customer's
   **tier** (2.3). No message a person wrote is handled outside a ticket.
3. **Customer context.** The ticket board shows who the customer is (the identity the channel gives, joined to the
   product's account where one is linked) and the facts that matter for helping (for a product with orders:
   how many open orders the customer has). A project may declare **tiers** (a code, a label, a rule over those facts, such as the
   open order count). A tier sets the badge on the card and the order of work: the ladder (section 6) and the board sort
   by tier, then by waiting time. Under D-5 a tier also changes two things the customer sees: the agent tells the
   customer their status (for example "as a premium customer"), and when the agent cannot resolve the question, it calls
   a person **at once and with priority** (`handed_open`, the hand-off marked with the tier, ahead of the queue)
   instead of waiting on the ladder's people rung. A tier never changes the facts of an answer. The tier code travels
   to the signal server; the facts behind it do not.
4. **The project's ticket board** shows the whole thread and lets a person **reply in it**. A person's reply is sent
   through the channel where the thread lives (the mailbox, the bot, the account), by the transport's owner (section
   9), once per press, through the same checks as the agent's sends (no em dash, nothing empty, the customer still the
   same). A reply a person sent closes the ticket as `closed_by_person` unless the person keeps it open. Nothing reaches
   a customer from the estate dashboard.
5. **The signal server keeps every project's tickets** as their own resource, not as signals
   (`PUT /v1/tickets/{ticket_id}`, `support-ticket/1`, section 13.2). Ticket writes never create a signal and never
   enter a digest. The estate dashboard shows all projects for the operator, a section per side, filterable by project,
   channel, outcome, tier and age, open and over-limit first; each row links to the ticket on the project's ticket board
   where there is one, and always to the server's page for that project. A project without a ticket board of its own
   uses that page, which then shows its tickets' metadata, outcomes and steps (no thread: the thread never leaves the
   project).
6. **Credentials and isolation.** One token per (agent, project), kept by name in the operator's secret vault, with only the
   scopes it needs (`tickets.write`, `notes.write`). The server takes the project and the agent from the token, refuses
   a body that names another project (`project_mismatch`) and a ticket another agent of the project wrote (`not_owner`).
   Only the operator's session reads every project.
7. **What travels to the server is metadata only**: an opaque ticket id (an HMAC of the channel's own id with the
   project's key; the server refuses an id that looks like an address, a phone or a mail Message-ID), project, channel,
   times truncated to the minute (to the hour on a channel with fewer than 30 tickets in 30 days), outcome, step, ages,
   language, tier code, a **category code** from the project's declared taxonomy, and at most an 80-character
   paraphrase that passed a deterministic personal-data check **run inside the agent's own side** (a vendored rule set,
   never a call to another side's service); when the check fails, only the category travels. The server runs the same rule on `paraphrase` and refuses a hit
   (`400 paraphrase_looks_personal`); the agent's check stays first. Never a message body, a
   customer's identity or a reply's text.
8. **Privacy deletion** of a customer deletes their tickets on the server (`POST /v1/tickets:delete`), which keeps a
   tombstone for 30 days that refuses the same id again (`410 deleted`), so an outbox cannot bring a ticket back. The
   same request reaches the gap registry's paraphrases, the questions on the Fabric board and the desks' messages
   (section 13.5).
9. **Delivery.** The agent keeps unsent ticket writes in an outbox under their idempotency key and resends them for up
   to 7 days, then opens one alert episode. A project whose writes stopped is shown as stale, never as "no tickets".
   Tickets are kept on the server 90 days after `ended_at` (open ones until they end); daily notes and composed reports
   400 days, as counts.

## 3. The outcome of every ticket

Every ticket has one **outcome**, which its writing agent sets. An open outcome changes as the ticket moves; once the
ticket ended, the outcome stays, except that within 30 days a late signal from a hand-off queue may turn `referred` or
`expired` into `closed_by_person` (a **promotion**, marked as such).

| Outcome | Means | Kind |
|---|---|---|
| `answered` | the agent answered from its knowledge and the checks passed (also: an approved draft was sent) | closed |
| `answered_after_question` | held, then answered by the agent once the missing fact arrived (section 6) | closed |
| `closed_by_person` | a person answered or acted (a reply from the ticket board, a hand-off queue's signal) | closed |
| `answered_elsewhere` | someone answered before the agent acted (a team reply in the store console, staff in the group) | closed |
| `no_reply_owed` | written by a person, needs nothing: a seller of services, the owner's own comment, small talk | closed |
| `customer_silent` | the agent asked the customer one question and no answer came within 7 days | closed |
| `referred` | the customer was told where to write and no signal from there reaches the agent; counts as a hand-off with signal "none" | ended, not closed |
| `expired_by_decision` | a channel held by a recorded decision passed its limit without a person's answer | ended, not a defect |
| `expired` | the customer got something (a holding reply) but no final answer by the final limit; the final reply was sent where the channel allows | ended, a defect |
| `unanswered` | the final limit passed with nothing the customer saw (in a group: also a late answer the window no longer allows) | ended, a defect |
| `received` | arrived, the agent has not acted yet (its column is Agent is on it) | open |
| `handed_open` | handed to a person through a queue, not answered yet | open |
| `question_open` | held while the agent climbs the question ladder (section 6) | open |
| `awaiting_customer` | the agent asked the customer one question and waits | open |
| `awaiting_approval` | a draft waits for a person's or a transport's approval before it is sent | open |

Rules that make two agents count alike:

1. If the agent handed off first and the team then answered, it is `closed_by_person`; if the team answered before the
   agent acted, `answered_elsewhere`.
2. A redirect to our own queue is `handed_open` while that queue has an answered signal, `referred` while it has none
   (the missing signal is a recommendation, section 7.5). A redirect to another company's service is `answered`.
3. `awaiting_customer` ends as `customer_silent` after 7 days, and that wins over `expired`.
4. **Approval-held sends** (a reply in a person's name, a transport that holds sends) are `awaiting_approval`, not a
   hand-off: approved and sent is `answered`; rejected and answered by the person is `closed_by_person`; neither by the
   final limit is `expired`.
5. **Decision-held channels** (replies off by a recorded decision) hand every ticket on arrival to the declared team
   (`handed_open`); at the limit it is `expired_by_decision`.
6. **First reply.** Apart from the outcome, each ticket records whether its first reply came within the channel's
   first-reply limit (reference: chats 1 hour, mail and reviews 24 hours); `firstReplyLate` counts the ones that did not.

### 3.3 Status: the ticket board's columns

| Column | Outcomes |
|---|---|
| Agent is on it | received, not run yet; `question_open`; `awaiting_customer` |
| Needs a person | `handed_open` not taken yet; `awaiting_approval`; any open ticket past a limit |
| With people | `handed_open` taken by a person or sent on to a queue |
| Answered, to review | `answered`, `answered_after_question` of the last 7 days not reviewed |
| Closed | every other ended outcome, folded, with its outcome as the card mark |

## 4. Autonomy: the agent finishes the work, a person is the exception

1. **Answer, do not route.** When the knowledge has steps the person can take, give them. Hand to a person only what
   only a person may do (money, access to an account, legal, privacy, partnerships, a decision) and what the checks the
   agent already gave did not fix. "A person will reply" inside an ordinary answer is a defect.
2. **The product's own checks first, then a person.** "It does not work" gets the checks the product shows (states,
   reasons, the control that fixes each). "I already tried, still does not work" goes to a person at once, by a
   deterministic rule (a literal topic, a flag), not the model's judgement.
3. **A complaint without a question is a question**: find what the person needs and answer that.
4. **Repair before hand-off.** A draft the checker refuses is rewritten once with the refusal's reason; a second refusal
   is a fallback.
5. **Never hand over what a person cannot fix either** (another company's service, an unrelated request): say what can
   be said, or that it is outside the product.
6. **Never claim what the agent cannot see** (an account's state, a payment, a refund done); a code check blocks it. Where
   the agent can read the customer's own account through the product's data (with the customer identified by the
   channel), it answers from it and says so.
7. **At most one clarifying question, never two in a row.** A bare "can I reach the owner?" gets "what is it about?"
   where the channel has a dialogue; a public one-shot reply (a store review) answers what it can or says where to
   write.
8. **No reply where none is owed** (section 3, `no_reply_owed`, and automated notices). In a group, while staff is
   answering, wait the quiet window (reference 10 minutes) and answer under the message asked.
9. **No approval queue for what the agent can ground.** A checker from another vendor gates the answer; where a person
   wants a chance to stop it, a cancel window before publishing replaces a queue. Recorded exceptions stand (section 0).
10. **The operator's decision given in a chat outranks every holding rule** of the agent for that chat: it is carried out,
    not held again. Images and files from the operator's private messages are private by default.

## 5. The improvement loop: every day, and on request (D-2)

**Daily**, per project, after the day closes (UTC):

1. Count the tickets of both cohorts of section 8.1 and publish `support.quality_daily` (schema
   `support-quality-daily/1`, the new fields optional by DEC-0151 of the agent contract; publish them once every
   reader of the feed takes that schema) over the **ending cohort**; anything not measured goes in `notMeasured`, never 0:

   | Field | Counts |
   |---|---|
   | `arrived`, `ended` (new) | tickets that arrived on the day; tickets that ended on it |
   | `open.handedOpen`, `open.questionOpen`, `open.awaitingCustomer`, `open.awaitingApproval` (new) | open tickets at the cutoff |
   | `autonomy.answered` | `answered` + `answered_after_question` |
   | `toPersonPolicy`, `toPersonInability` | tickets ever handed to a person, by reason (only a person may / the agent could not), `referred` included, approval-held sends excluded |
   | `outcomes.handoffsClosedByPerson` (new) | hand-offs that ended `closed_by_person` |
   | `outcomes.referred`, `.answeredElsewhere`, `.noReplyOwed`, `.customerSilent`, `.expiredByDecision`, `.expired`, `.unanswered`, `.firstReplyLate`, `.promotions` (new) | those outcomes and marks |
   | `stability.fallbackTurns`; `stability.fallbackTickets` (new) | checker refusals twice in a row: turns, and tickets with at least one |
   | `notATicket` (new) | automated notices |

   The **four numbers** of every summary are shares of the ended tickets, and they overlap (one ticket may be handed
   off and then closed by a person): answered (`autonomy.answered`), to a person (both hand-off fields), fallback
   (`fallbackTickets`), unanswered (`unanswered` + `expired`). The server computes the same counts from the ticket
   resource; the report uses the server's (section 8.1), the agent's feed is the check against it.
2. A judge of another vendor scores up to 20 of the day's sent answers (helped, partly, no), unhelpful ones first, within
   the project's `judge_budget_usd`; without a spend record that budget is 0 and the judge does not run (`degraded`).
3. Every ticket that ended wrong (judged unhelpful, `unanswered`, `expired`, a hand-off the knowledge could have
   answered) becomes an **invented eval ticket** (no customer words) and its cause is fixed at the root: the
   instruction, the policy, the knowledge at its source, or the code; never a one-off answer by hand.
4. Each fix is measured by its question's `meaning` key over 7 days before and after, where the side's data agent has
   `meaning` keys; elsewhere by the eval tickets it added.
5. Walk the open tickets (section 6): chase what is late, answer what can now be answered.
6. Send the day's note to the signal server (section 8.3).

**On request** (the operator, the project's agent or the measuring layer asks): the whole daily loop runs at once for
the asked project and period, with a **replay**: real tickets of the last 30 days through the current definition,
judged by the strongest model the budget allows, with the four numbers before and after.

**A replay also runs** after a change to the instructions or the policy, after a knowledge change that alters an answer
(a new or changed fact; a rebuild with the same content hash is not a change), and weekly. Each run stays inside the
project's `replay_budget_usd` per month with the spend record it cites; without one the budget is 0 and only the eval
suite runs. Over budget it samples the 30 days by outcome and says so in `degraded`. The eval suite runs after every
change; a failure notifies the project's owner once per episode, and once on recovery.

**Context budget.** The checker sees a fixed window; a longer prompt hides the knowledge. The gate measures the room
left; text is cut before text is added.

## 6. No question left unanswered: the ladder (D-2)

A question the knowledge cannot answer climbs this ladder. The ticket is `question_open`; where the channel allows and
the answer can still come within the channel's final limit, the customer gets a holding reply ("I am checking this and
will write back"), which obliges a final reply (6.6). A conditional promise ("I will write if the answer appears") obliges
nothing and is not a holding reply. A group gets no holding reply unless the answer is due within its
window.

1. **Search the knowledge again**, with the question rephrased.
2. **Research it the same day**: the product's code and strings (states, buttons, error texts), the side's data agent
   through its capability (take its `answer` flag and its abstention, not a threshold of your own), the product's docs,
   FAQ and release notes, the project's record in the project registry.
3. **Record the gap** in the project's **gap registry**, with a paraphrase that passed the personal-data check, a
   `meaning` key where the registry has one, and the tickets attached. One gap per question, not per ticket. The
   registry's owner adds the fact at its source.
4. **Ask a person, in parallel with 3**, by the project's declared route (never waiting on a weekly curation):

   | Side kind | Route | Who answers |
   |---|---|---|
   | a product team's project | a Fabric-board request to the side's **team desk** (capability `team.ask`) | the desk finds the person who knows, asks within its working hours, follows up, routes "not mine" to the next person, and replies on the thread |
   | the operator's project | a Fabric-board request to the **operator desk** (capability `operator.ask`) | the operator, in his Telegram, one message per question; his answer comes back as the reply on the thread |

   Each question is **one** request (`support-question/1`, section 13.3), with `expires_at` (reference 7 days) as its
   deadline; the answer is the reply on that thread (`support-answer/1`), **the only answer path**: the report and any
   digest show question ids and link to the desk's message, where the person answers.
   **Pacing.** The desk declares its daily cap across its side (reference: a team desk 15, the operator desk 10) and its
   send time (reference 09:00 Europe/Warsaw on its working days); requesters rank their questions within it (tier,
   then waiting customers). A question found after the send time waits for the next one; a question is sent at once
   only when a held customer has waited more than one working day. Over the cap the desk answers `cap_reached` with the
   next slot.
   **Sides and personal data.** The desk takes the side from the requesting project's record on the signal server,
   never from the body; a mismatch, or a question for another side, is `out_of_scope`. A body carrying a phone, an
   address, a wallet, a Telegram id or payment details is refused before it is sent (`out_of_scope`, `reason:
   personal_data`): the requester cleans it, the desk never does. The answer is the person's words as they are, with
   `answered_at` and `by`; the requester keeps it, the desk keeps only message to request until the deadline.
   **Until the desk holds `board.respond`** for its capability (the operator's grant in Fabric), it answers as the
   request's target with `com.reply`, which answers the request.
   **People.** A team desk asks within its working window, reminds after 2 working hours, goes to the next person after
   4, routes "not mine" to the next person and the team lead last; a person it cannot reach is asked through the lead.
   **Isolation.** A desk keeps each project's questions in separate messages, never a keyboard over two projects or two
   sides, and never uses one project's questions in another's work.
   **Endings.** Only the desk's final `unknown` or `out_of_scope` declines a gap. A question that expires is asked once
   more; a second expiry declines the gap, and it is not asked again for 30 days unless its waiting tickets double.
5. **When the answer arrives**, the agent puts the fact into the gap registry (so it reaches its source) and answers
   every held ticket on that gap, after checking that the ticket is still `question_open`, that nothing was sent to the
   customer since the hold, and that the key (ticket, gap, answer `rev`) is unused; otherwise it records whatever
   outcome happened. **One sender per ticket**: a runtime that re-answers held tickets on a knowledge change uses the
   same key, so the customer gets one answer.
6. **Limits.** Age runs from the ticket's first message; each rung has its own age from entering it. Reference limits:
   research the same day; a person's answer 2 working days; a hand-off queue 2 working days; the whole ticket 7 days;
   a group 6 hours (its late-answer window). At its final limit the ticket gets the final reply where the channel
   allows ("we could not confirm this; please write to ..."), and its outcome is `expired` or `unanswered` (section 3);
   a declined gap does the same at once.
7. **Alerts open once per episode**, when an item passes a limit, and close when it is back within it. The daily report
   shows one aggregated line per kind (count, oldest age), not one per item. The step's owner is notified once at the
   limit and then weekly, at most four times per episode; after that the item stays only on the weekly list.

## 7. Data: every source named, owned, fresh

1. Each source the agent reads is **declared** with its owner, how it is read, its cadence and its **maximum age**
   (where a source's own freshness contract names the job that reads it, that job stands for "how it is read"). The
   ticket board and the daily report show each source's age; a source older than its limit opens an alert episode
   (6.7), never a silent stale answer.
2. **Knowledge comes from production**, rebuilt on a schedule (reference hourly for docs), never copied by hand; numbers
   only from the source that owns them.
3. **A missing source is a recommendation, not a guess**: the data that is missing, who owns it, how to connect it
   (capability, API, export), which questions it would answer; filed once on the owner's Fabric board and never filed
   again. It is listed daily in the report for 7 days, then on the weekly list until the owner connects or declines it.
4. A source that fails keeps its last good version and says so (`degraded`); a second failure in a row notifies the
   owner once per episode.
5. **The signal that a hand-off was answered is a source too.** Each queue a hand-off goes to (a support mailbox, a
   group, a manager's account) is declared with that signal, or with "none" and a recommendation to the queue's owner.
   A channel whose hand-offs mostly go to a queue without a signal reports many `referred` tickets; that is the missing
   signal showing, not a regression.

## 8. The daily report to the operator (D-2)

1. **Days are UTC.** The report for day D covers the **tickets that arrived on D** with their outcomes as of the
   cutoff, and the **tickets from earlier days that ended on D**, by outcome. The signal server computes both from the
   ticket resource. A channel whose data arrives late (store reports) is recounted in the next report, marked revised.
2. **For each project** of a side: what came (tickets by channel and tier, volume and `not_a_ticket` beside), how they
   ended (each outcome, the closed share, the four numbers of section 5: answered, to a person, fallback,
   unanswered, each a share of the ended tickets), the causes of `referred` and `expired` by category, the top
   closed topics with their outcome, what is still open (oldest first, with the step each waits on; alert episodes
   first), the questions asked of people (asked, answered, waiting, with their ids and links), what the loop changed
   (fixes, eval tickets added, the judge's helped / partly / no), and data (sources over their limit, recommendations
   open). No customer text and no personal data.
3. **Completeness.** Each agent of a project sends a mandatory `support-daily-note/1` per day (section 13.4): per channel
   its `last_read_at`, what the channel's own API says arrived (`items_seen`), how many of those it ingested
   (`items_ingested`) and the outbox watermark (`events_flushed_through`), plus what only the agent knows (fixes,
   recommendations, the judge). The server knows which agents a project expects (section 13.1). "0 tickets" is written
   only from notes that say 0; with no note the report says "no data from <agent>"; `items_seen` minus `items_ingested`
   is listed as "not ingested: N".
4. **Delivery.** The signal server composes the report once at the cutoff (reference 09:00 Europe/Warsaw; it waits for
   the notes until 10:00, then sends with "incomplete: <agents>") and sends it through the operator's bot **per side**:
   messages of at most 4096 characters, cut between project blocks into numbered parts. A project with no open item,
   alert or question joins one line ("quiet: <project> <tickets>, <closed share>"). Each block carries the project's report and board as a
   `fabric-dashboards://service/<signal server service key>?path=...` address in text (agent pages open only in Fabric
   Dashboards; the server's https answers 401 without a session); a clickable https link is the operator's choice. Sent once per (side, day) under an
   idempotency key; at most one addendum per (side, day), only if a count changed.
5. A measuring layer may add a summary across the projects of **one side**, never across sides and never in place of the
   per-project blocks.

## 9. Transports

- A bot on its own Bot API token sends directly. An agent that answers from a person's Telegram account (MTProto) goes
  through the account's one session owner, under that owner's approval rules; a held send is `awaiting_approval`
  (section 3).
- A person's reply from the ticket board (section 2.4) goes through the same owner of the thread's channel.
- A send the owner holds for approval is a job still working; that is `awaiting_approval`. It ends sent, refused or
  expired (the owner's limit), or with an unknown outcome after a timeout, which is never retried blindly. A press on
  the ticket board is not the owner's approval until the owner says it accepts one.
- An account's private chats may carry an allowlist: a send to a person outside it is refused by the owner, not
  retried.
- One transport owner per channel; a new channel is a connection to its owner, never a second path.

## 10. Per-channel adjustments

| Channel | Final limit (reference) | First reply | What differs |
|---|---|---|---|
| Mail | 7 days (a runtime that holds 30 days declares its own) | 24 hours | the runtime holds, re-answers held mail on a knowledge change under the ticket's key, sends a holding reply after 24 hours, checks a letter's safety before the agent reads it, answers once a letter sent to several addresses |
| Private chat (bot or account) | 7 days | 1 hour | a dialogue: one clarifying question allowed; a manager's account is a queue that needs an answered signal |
| Group | 6 hours | 1 hour | the staff's quiet window; answer under the message asked; no late answer after the window |
| Store review | 7 days | 24 hours | one public reply; a team reply in the console is `answered_elsewhere`; no clarifying question; a cancel window instead of an approval queue |
| Public comment in a person's name | 7 days | 24 hours | `awaiting_approval` until a standing approval exists; the person's own comment is `no_reply_owed` |
| A team's internal chat | 2 working days | 1 working hour | the agent informs and routes; decisions, work and priorities stay the team lead's |
| A person's own account answering customers | 7 days | 1 hour | the operator's chat decisions outrank holding rules; money decisions stay his |

## 11. What each agent declares, and what is observed

**Declared** in the service's `fabric-agent.json`, or in its well-known `extensions` when it has no manifest (a cloud
bot), under the extension key
`https://fabric.passioncode.ai/agent-contract/extensions/channel-agent/0.1` (section 13.6; the schema lives in the agent
contract, version 1 once a consumer passes its vectors), one entry per project
the agent serves. fabric-agent-adapter's check validates it against the schema:

| Declared | Checked |
|---|---|
| the standard's version, the project (its project registry id), the expected side, the lead agent, the adoption date | present; the side one of section 14's |
| the ticket taxonomy (version, category codes) and the tiers (code, label, rule) | present; codes match the pattern |
| the question route (desk capability and target, cap, days, time zone, send time, expiry) | present; `team.ask` exactly for a product team's side, `operator.ask` for the operator's |
| the gap registry (owner, capability) | named |
| each channel: kind, replies on or off (with the decision), limits, holding and final texts per language, the unit of `items_seen` | present; durations in ISO 8601 |
| each source: owner, how read, cadence, maximum age; each declined source with its decision | present |
| each hand-off queue: owner, limit, answered signal or "none" with its recommendation | present |
| the eval suite, `judge_budget_usd`, `replay_budget_usd` and their spend records | present; a budget without a record reads 0 |
| the ticket outbox, the token's vault slot by name, the personal-data check with its version | present |
| recorded decisions (id, date, effect) | present for every channel held by one |

**Observed** by the signal server per project (the adapter's check may read it with a read token): the last ticket
write and the last daily note younger than a day, every source within its limit, no gap older than 7 days, the eval
suite's last run within 7 days, the daily `support.quality_daily`, and one gap registry per project. For the first 30
days after an agent adopts the standard, the observed checks report but do not fail; its backlog before the adoption
date is counted once in the first report as a backlog figure, then aged only on the weekly list.

## 12. Who is bound, and how

| Kind of agent | Binds |
|---|---|
| answers people (support bots, mail agents, group bots, review responders, comment responders, a team's assistant, a person's account answering customers) | everything |
| a runtime for such agents (a mail runtime) | offers sections 2.9, 3, 5.1, 6.5 and 7.1 and the ticket writes as features its agents use; the agent keeps its policy and declaration |
| the signal server | sections 1.1, 1.2, 2.5 to 2.9, 8 and 13: the project table, the ticket resource, the estate dashboard, the server's project pages, the daily notes and reports, per-side digests and alerts |
| a team desk | the `team.ask` route of section 6.4 for every project of its side |
| the operator desk | the `operator.ask` route of section 6.4 for every operator project |
| a data agent | sections 6.2 and 6.3 (gives `answer` and abstention, keeps the gap registry), section 7 for its own sources |
| a measuring layer | reads tickets, reports and each agent's `support-daily-note/1` (no note is "no data", never 0), never replaces them; asks for replays; summaries inside one side |
| a transport (a session owner) | section 9 |

## 13. Wire contracts

All bodies are JSON; times RFC 3339 UTC; durations ISO 8601; ids opaque. A write is idempotent: the same key and body
answer as before, the same key with another body is refused.

### 13.1 The signal server's project table

`projects(id, side, label, lead_agent)`, `sides(code, chat)` (each side's report chat, the operator's chat by
default; side codes `^[a-z0-9-]{1,32}$` live only in this data, never in the server's code), `project_agents(project, agent)`, `sources.project_id`; `id` is the project registry's
project id (`project:<slug>`). The operator adds them (`scripts/project.mjs add <id> --side <side>`, `agent add`); an
agent's token belongs to one (agent, project). Scopes: `tickets.write`, `notes.write`, `tickets.read` (the operator and
read checks). **Alerts** of this standard are signals `support.alert.<code>` with severity `normal` and the episode key
as `idempotency_key`; recovery resolves them. The hourly digest and urgent pushes are composed **per side**, from each
signal's source project.

### 13.2 `support-ticket/1`

`PUT /v1/tickets/{ticket_id}`, at most 8 KB. A field not in this table is `400 schema`: an unknown field may carry
personal data.

| Field | Required | Value |
|---|---|---|
| `schema` | yes | `support-ticket/1` |
| `ticket_id` | yes | `^t_[A-Za-z0-9_-]{16,64}$` (path and body) |
| `rev` | yes | integer: max(previous `rev` + 1, change time in Unix milliseconds), so a lost counter never stalls |
| `conversation_id`, `reopens` | first yes, second no | opaque ids, same pattern |
| `channel` | yes | a declared channel id |
| `project`, `side` | no | the project and side the agent expects (1.1); a mismatch is `403 project_mismatch` or `side_mismatch` |
| `opened_at`, `updated_at` | yes | times |
| `ended_at` | when ended | time |
| `outcome` | yes | section 3 |
| `promotion` | no | `true` on a section 3 promotion |
| `step`, `step_entered_at` | yes | `agent`, `awaiting_customer`, `question`, `handoff`, `approval`, `none` |
| `final_limit_at`, `first_reply_late` | yes | time; boolean |
| `language`, `category`, `tier` | yes, yes, no | BCP 47; `^[a-z0-9_.]{1,64}$` from the declared taxonomy; a declared tier code |
| `questions` | no | integer, default 1 |
| `paraphrase`, `pd_check` | no, with each other | at most 80 characters; `{name, version, passed: true}` |
| `handoff` | no | `{reason: policy or inability, queue_id, handed_at}` |
| `question_id`, `gap_id` | no | opaque ids |
| `board_url` | no | https or `fabric-dashboards://`, carrying only the opaque id |
| `revised` | no | boolean |

Answers: `201` created; `200` same `rev` and body; `200 {stale: true, rev}` for a lower `rev`; `409 rev_conflict` same
`rev`, another body; `403 project_mismatch`, `403 not_owner`, `403 side_mismatch`, `403 project_unknown` (a project the operator removed;
the outbox stops and alerts); `400 schema`; `400 paraphrase_looks_personal`; `400
id_looks_personal` (an `@`, or a run of 7 or more digits); `410 deleted`; `413` over 8 KB.

### 13.3 `support-question/1` and `support-answer/1`

A question is a `com.submit` of `kind: request`, `capability` `team.ask` or `operator.ask`, `deadline` = `expires_at`,
in a new thread per question, body `text/markdown` with a fenced JSON block:

`{schema: "support-question/1", question_id, rev, project, paraphrase, searched: [...], needs: "fact" | "decision" |
"yes_no", waiting_customers, top_tier, gap_id, expires_at}`

The answer is a reply on that thread with a fenced `{schema: "support-answer/1", question_id, rev, result: "answered" |
"unknown" | "out_of_scope" | "cap_reached", reason, value, next_slot, answered_at, by: "operator" | "person"}`, `value`
verbatim. The operator desk sends one Telegram message
per question (id, project, paraphrase; buttons **Yes** and **No** for `yes_no`, **Unknown**, **Skip**; otherwise a
reply to the message is the answer), keeps message to request, posts `support-answer/1` and edits the message to
answered or expired. Batching is a send schedule, never one request holding many questions.

### 13.4 `support-daily-note/1`

`PUT /v1/daily-notes/{day}` (project and agent from the token, with `rev`):

`{schema, day, agent, adopted_at, channels: [{id, last_read_at, items_seen: {unit: "mails" | "updates" | "messages" |
"reviews", count, from, to}, items_ingested, not_a_ticket, events_flushed_through}], judge: {sampled, helped, partly,
no}, fixes: [{kind: "instruction" | "policy" | "knowledge" | "code", ref}], evals_added, eval_last_run_at, sources:
[{id, age_s, max_age_s, status}], recommendations: [{id, thread}], notMeasured: [...]}`

`events_flushed_through` is the time T such that every ticket write changed at or before T has a 2xx from the server.

### 13.5 Deletion

`POST /v1/tickets:delete {ticket_ids, reason: "privacy"}` deletes and tombstones (30 days, `410`). The writing agent then
removes the same tickets' paraphrases from the gap registry and asks each desk that holds a question on them to delete
its message (`support-question/1` with `deleted: true` on the same thread). Quotes a data agent keeps in its own
digests pass its own personal-data filter and are deleted by the data agent's owner, not by the writing agent.

### 13.6 The declaration (`https://fabric.passioncode.ai/agent-contract/extensions/channel-agent/0.1`)

```json
{"standard":"channel-agent-standard/1","projects":[{
 "project":"project:<slug>","side":"<side>","lead_agent":"<agent>","adopted_at":"2026-11-10",
 "taxonomy":{"version":"2026-11-04","codes":[{"code":"payments.refund","label":"..."}]},
 "tiers":[{"code":"premium","label":"Premium","rule":"open_orders > 10","escalate":"at_once"}],
 "question_route":{"capability":"operator.ask","target":"<fabric project id>","daily_cap":10,
   "days":"mon-fri","tz":"Europe/Warsaw","send_at":"09:00","expires":"P7D"},
 "gap_registry":{"owner":"<agent>","capability":"<capability>"},
 "channels":[{"id":"tg-dm","kind":"telegram_dm","replies_enabled":true,"decision":null,
   "final_limit":"P7D","first_reply_limit":"PT1H","holding_reply":true,"clarifying_question":true,
   "quiet_window":"PT10M","late_answer_window":null,"items_seen_unit":"updates",
   "texts":{"holding":{"en":"..."},"final":{"en":"..."}}}],
 "sources":[{"id":"docs","owner":"...","read":"url","cadence":"PT1H","max_age":"PT2H"}],
 "declined_sources":[{"id":"...","decision":"..."}],
 "handoff_queues":[{"id":"...","owner":"...","limit":"P2D","answered_signal":"none","recommendation":"<thread>"}],
 "evals":{"suite":"<path>","judge_budget_usd":0,"replay_budget_usd":0,"spend_record":"<usage limit id>"},
 "tickets":{"outbox":"<table or path>","token_slot":"<project>/prod/<NAME>","pd_check":"<name>@<version>"},
 "recorded_decisions":[{"id":"...","date":"...","effect":"replies_off"}]}]}
```

Rules for the fields: `tiers[].rule` is `<fact> > <integer>` or `<fact> >= <integer>`, the fact a declared customer
fact (`open_orders`, `paid_total_usd`, ...); `escalate` is `at_once` or `ladder`. Budgets are numbers in USD typed as
the usage report's spend limits (DEC-0027) and `spend_record` is that report's limit id. `token_slot` is
`<project>/<env>/<NAME>` with `NAME` matching `^[A-Z][A-Z0-9_]{0,63}$`. Sources and hand-off queues carry ids and ages
only: no person's address, no private path.

Channel kinds: `telegram_dm`, `telegram_group`, `mail`, `store_review`, `public_comment`, `team_chat`, `account`.

## Review log

| Round | When | By | Result |
|---|---|---|---|
| 0 | 2026-11-04 | this repository | draft from v0, D-1, D-2 and ten self-reports |
| 0b | 2026-11-04 | this repository | D-3: tickets on the ticket board and the estate dashboard; one bot dropped (the operator removed it) |
| 1 | 2026-11-04 | two blind reviewers (fidelity; operability) | 18 and 25 findings, 13 blocking. Fixed: the ticket as the unit; outcomes `customer_silent`, `referred`, `expired` and precedence rules; the field map of `support.quality_daily`; UTC days with arrival and ending cohorts; rung ages; the whole loop on request; replays on real changes under a budget; asking people the same day in parallel with the gap; one question path; safe late answers; sides and per-(agent, project) tokens; tickets as a server resource; metadata with a personal-data check; daily notes and completeness; one report per side; alerts once per episode; recorded decisions stand; transports; declared and observed checks |
| 2 | 2026-11-04 | two blind reviewers (consistency; implementers: the signal server, the desks, channel agents, the adapter's check) | 24 and 36 findings, 9 blocking. Fixed: the master and neutral copies (sections 14, 15); the ticket split per channel and reopening as a linked ticket; outcomes `awaiting_customer`, `awaiting_approval`, `expired_by_decision` and `firstReplyLate`; immutable ended outcomes with a 30-day promotion; overlapping shares and `fallbackTickets`; open counts; the group's 6-hour final limit; the board's columns; one writer per ticket; per-project isolation at the desks; "not mine" routed, only `unknown` declines, expiry asked once more; a data agent per side; budgets 0 without a record, the judge at 20 a day; the wire contracts (project table, `support-ticket/1`, `support-question/1` and `support-answer/1`, `support-daily-note/1`, deletion with tombstones, `extensions/channel-agent/1`); `rev` that survives a lost counter; per-side digests and alerts; report parts within 4096 characters with https links; answers only on the desk's message; desk-wide caps; the personal-data check inside its side; times truncated on small channels; reminders capped at four; one addendum a day; retention. D-4 added: statuses, customer context and tiers, a person's reply from the ticket board into the thread's channel |
| 3 | 2026-11-04 | the roles: the signal server, the operator desk, the team desk, the agent contract, the adapter, the Telegram transport | edits applied: report links as `fabric-dashboards://` text; the server checks `paraphrase` (`paraphrase_looks_personal`), `project_unknown`, side codes only in data with `sides(code, chat)`; the desk takes the side from the project record, refuses personal data, keeps answers verbatim with `by`, answers with `com.reply` until it holds `board.respond`, people's reminders 2 and 4 working hours; the declaration's key is the contract's full URL at 0.1, slot names, typed budgets with a limit id, a grammar for tier rules, ids and ages only. D-6: adopt now |
