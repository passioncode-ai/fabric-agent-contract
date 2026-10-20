# Adoption and consumer synchronization

`covers: REQ-018, REQ-019, REQ-020, REQ-021`

## Repository coordination

This repository uses the same contract it recommends for shared work. Its durable
record plane is Git; its coordination plane is Notion with Git-ref leases. The
generated `docs/AGENT_SYNC.md` snapshot is descriptive, while the live tool is
authoritative. Credentials live only in an ignored `.env.agent-sync` file.

## Measured pins

Which commit each organization repository pins, and which decisions that commit holds, is measured, not assumed:
[adoption](../evidence/adoption.md) (DEC-0065). A pin that contains a decision is a precondition of adopting it, not
proof; the consumer's own test is the proof.

## Vendoring schemas

A consumer that copies schemas into its own repository copies the `$ref` closure of each schema it validates — the
schema and every file its references reach — never a list of name prefixes: a later decision may make a schema refer to
a new file (a device check-in refers to `heartbeat`, `revocation-delta` and `window-lease` since DEC-0053 and
DEC-0054), and a missing file fails every document. [`schemaClosure`](../../src/schema-closure.ts) lists the closure;
`test/schema-closure.test.ts` checks that every schema's closure resolves. A consumer that vendors this repository's
reference code does the same with a module's import closure ([`sourceClosure`](../../src/schema-closure.ts)): a module
may import a file a later decision added (`device-rules.ts` imports `protocol-revisions.ts` since DEC-0067). The
closure covers static imports and re-exports of sibling modules (`from "./x.js"`); a module that loads another
through a variable at run time, as `session-handoff.ts` loads its validator, names it in its own comment. (Reported by the first organization
server's session on 2026-10-12, after its prefix copy refused every check-in.)

A data file is vendored the same way: a consumer copies `catalogue/coding-agents.json` at its pin with
`coding-agents.schema.json`'s closure (which reaches `runners.schema.json`), and compares its `revision` to tell a
stale copy (DEC-0093).

## Fabric consumer

Fabric consumes this repository by canonical private Git URL and release/commit,
not by copying normative text. Its glossary and architecture docs explain where
the boundary sits; a new Fabric ADR records the product-manager rename and the
external contract ownership.

## Knowledge graph consumer

The Obsidian wiki contains navigation and a short relationship note linking the
Fabric architecture and this contract. It MUST NOT become another editable copy
of schemas or normative behavior. Only merged committed revisions are indexed as
canonical knowledge.

## Closeout

Acceptance records local and remote commit identities, green CI receipts,
coordination reconciliation, repository cleanliness, planted-failure evidence and
the retrospective. A missing credential or unavailable external system is named
as a blocker with its exact remaining action; it is not represented as verified.
