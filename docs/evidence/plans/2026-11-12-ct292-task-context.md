# Design 2026-11-12: the context of a task, settled before an agent acts (CT-292)

**Status:** design; the decision (one DEC with its schema, resolver and vectors) follows after its review rounds. Rules
are proposals numbered `TC-*`.

**Asked by:** the operator, 2026-11-12, in this repository's session `7c9eb2c2`, as typed: «важное правило пероработать
что если есть нексколько агентов в разныз организация в доступе то для решения задачи если не понятно из окнтекста
проекта то надо явно уточнчить к какому флоу/организауциям обращаземся», then «это не правило а надо все сделать в
скилах ... на уровне протокола». In plain words: when an agent can reach agents of several organizations and the
project's context does not make clear which organization or flow a task is for, it asks explicitly; and this belongs
in the protocol and in the skills, not in one agent's instructions.

Line numbers in this design cite the repository at `8dec888e` (main on 2026-11-12); read each citation by its rule id
or section first.

## What the contract says today

| Where | What it says | What is missing |
| --- | --- | --- |
| [contexts](../../specification/contexts.md) *The context id* (DEC-0082) | a person works in `personal` and in each `org:<orgId>`; ids compare as written | which context a *task* is in |
| [contexts](../../specification/contexts.md) *The grant's context*, *Routing* | a share grant carries its organization; a session's events go by `routeTarget(sessionContext, ...)`, the collector's own record of the session | where the session's context comes from, and what an agent does when it cannot tell |
| [folder attribution](../../specification/folder-attribution.md) AT-0 to AT-15 (DEC-0089) | which Project a folder belongs to, one rule set for Fabric, Switchboard and Observatory | which organization that Project works for |
| [project comms](../../specification/project-comms.md) (DEC-0098, DEC-0152) | a board request names its target Project; a session asks the operator through `fabric_question_ask` or the host's equal | a request from one organization's Project to an agent reached in another |
| the operator's word rules on branch `agent/ct220-operators-word-v2` (DEC-0156, OW-1 to OW-6, proposed) | the operator's word is carried out the first time; a question only where a step waits (OW-3) | that an unsettled organization is such a step |

So the contract can route data by context but never says how an agent learns the context of the work in front of it.
An agent that can reach several organizations (an operator's personal estate and two organizations on one machine is
RM-28's pilot) then guesses, and a wrong guess spends one organization's keys, writes to its board or sends its data for
another's task: the harm unlinkable memberships exist to prevent (the RM-28 report's CX-22).

## The design

**TC-1, every task has one context before an act that crosses.** Before an agent acts on a resource that belongs to a
context (an account, a key, a grant, a board, another agent, a data store, a repository of an organization), the task it
serves has exactly one context (`common.schema.json#/$defs/contextId`). A task never acts in two contexts; work that
needs two is two tasks, each with its own context. Reading the agent's own working folder needs no context.

**TC-2, how a context is settled.** The agent reads these sources; each that names a context is a *claim*:

1. the operator's words for this task that name an organization, its product or its flow (as the agent reads the
   operator's word, OW-1; a relayed word as DEC-0126 accepts it);
2. the board request the task serves: its requesting Project's context (the registry's organization of that Project);
3. the folder's Project by [folder attribution](../../specification/folder-attribution.md) (DEC-0089) and that
   Project's organizations in the registry; a Project with no organization claims `personal`;
4. the grant the act runs under, when it states `context` (DEC-0082);
5. the place, when the place belongs to one organization (an organization's space, VM or cloud; CT-285's place).

The context is **settled** when at least one source claims and every claim names the same context. A Project listed for
two organizations claims both, which settles nothing. Sources are read, never written: TC-2 adds no field to them.

**TC-3, unsettled: ask once, explicitly.** When no source claims and the agent can reach resources of more than one
context, or two claims differ, the context is **unsettled**. The agent then asks the operator once, before any act that
crosses: the question names each candidate context (and the organization's own name where the person knows it by
name), the flow or product in each, and what the task would do there, and it offers each candidate as an option. It
never guesses, never picks the safest candidate, and never splits the task between candidates. The question is a step
that waits (OW-3): the rest of the task, and every part whose context is settled, goes on meanwhile. This is the one
question the operator's word rules leave to an agent here; an agent that reaches only one context, or whose context is
settled, asks nothing.

**TC-4, where the question goes.** With a person in the session, the agent asks in the chat. In a session with no
person (a dispatched run, a headless place), it asks through the host's question surface (`fabric_question_ask` or the
host's equal) and names the open step in its report; a board request it cannot place is answered with a `com.reply`
naming the step, never settled in a guessed context. A place profile (CT-285) never settles a context by itself: it
says how far an agent goes, not for whom.

**TC-5, the answer is recorded.** The operator's answer is recorded with the task (the execution context, the session
hand-over and the board thread it serves, each by its own record) as `{context, by: "operator", at, source}`, so the
next agent and the next session read a settled context and do not ask again. An answer applies to that task, or to the
Project when the operator says so; it changes no registry record by itself (a Project's organization is changed where
the registry is changed).

**TC-6, contexts stay apart.** A question, its options and its answer go only to the person in the operator's own
session or question surface: never to a board thread of either organization, never to another organization's agent,
since naming one membership to another links them (CX-22). An answer joins no two contexts: the credentials, data and
grants of one are never used for a task settled in another (contexts *Routing*, [peer share](../../specification/peer-share.md)
PS-3).

## What the DEC owes

- **Code and vectors:** `resolveTaskContext(claims, reachable)` in `src/`, total and never throwing, answering
  `{settled: contextId, by: [sources]}`, `{ask: [candidates]}` (no claim, several reachable) or `{conflict: [{source,
  context}]}` (claims differ); `fixtures/vectors/task-context.json` written by `tools/vectors/task-context.ts`: one
  reachable context, claims that agree, a Project of two organizations, the operator's words against the folder's
  Project, a grant's context against the place's, `personal` against an organization, ids compared as written.
- **Schemas:** an optional `context` beside `project` in `execution-context.schema.json`, and the recorded answer's
  shape (TC-5) in the session hand-over's.
- **Rules:** one `FAC-SEM` code (reserved with the DEC): a recorded answer's `context` is a context id and its `by`
  names who answered; conformance rows for an agent that reaches more than one context and for a host's question
  surface.
- **Pages:** [contexts](../../specification/contexts.md) gains *The context of a task*; the operator's word rules (OW-3)
  name TC-3 as a step that waits; CONTEXT gains *Context of a task*.

## Who adopts it

- **The agents' skills** (the Fabric Agent Adapter's kit, its working-with-Fabric skill and the session start of every
  agent built from the agents database): read TC-2's sources at session start, ask per TC-3 and TC-4, record per TC-5.
- **Fabric:** the session's start answer (`fabric_whoami`) names the contexts the session can reach and the settled one
  when the place or the request settles it; its question surface carries TC-3's options.
- **Fabric Switchboard:** a group's organizations are TC-2's claim for its folders (its organizations per group).
- **Project Observatory:** `project.resolve` answers a Project's organizations, the claim TC-2 item 3 reads.

## Not decided here

- How a Project is recorded under two organizations, and whether it should be (the registry's).
- Whether an organization's administrator may settle a context for the organization's members (CT-250's levels).
- The question's wording in each product (each product's own copy).
