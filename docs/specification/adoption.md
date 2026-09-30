# Adoption and consumer synchronization

`covers: REQ-018, REQ-019, REQ-020, REQ-021`

## Repository coordination

This repository uses the same contract it recommends for shared work. Its durable
record plane is Git; its coordination plane is Notion with Git-ref leases. The
generated `docs/AGENT_SYNC.md` snapshot is descriptive, while the live tool is
authoritative. Credentials live only in an ignored `.env.agent-sync` file.

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
