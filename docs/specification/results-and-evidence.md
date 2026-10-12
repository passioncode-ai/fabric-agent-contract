# Results, artifacts and evidence

`covers: REQ-005, REQ-006, REQ-014`

## Result envelope

Every completed or stopped invocation produces one result envelope:

- `outcome`: `succeeded`, `partial`, `failed`, `cancelled` or `blocked`;
- `done`: atomic claims about work completed;
- `proof`: evidence references supporting claims;
- `scope`: project, run, node, binding and declared write scope;
- `notVerified`: claims, surfaces or effects that were not independently checked;
- `artifacts`: typed immutable outputs;
- `observations`: optional project-scoped observations;
- `usage`: optional provider-reported metering (`common.schema.json#/$defs/usage`: input,
  output and cache tokens, cost, wall time), explicitly non-authoritative until reconciled.
  A [job result](interop.md#c32-jobs) requires it.
- `output`: the value the capability's `outputSchema` describes, when the result answers a
  capability call; a [job result](interop.md#c32-jobs) requires it (DEC-0017).
- `trace`: `{traceparent, tracestate?}` of the span that produced the result; for a
  stored result it is authoritative over any response's `_meta` (DEC-0017).

The four collections from DEC-0011 are required even when empty. Every claim a result reports is an acceptance claim,
so `succeeded` MUST NOT be used while any claim appears in `notVerified` (`FAC-SEM-001`, DEC-0064).

## Claim and proof relation

Each `done` item has a stable claim ID and statement. Each proof item names one or
more claim IDs, an evidence URI, evidence kind, producer and capture time. A claim
with no independent proof MAY be reported as done by the provider, but it MUST
also be present in `notVerified`, by its claim ID in `claim`, until a checker verifies it; and a proof item names only
claims the result reports as done (`FAC-SEM-093`, DEC-0064).

## Evidence kinds

`test`, `command-output`, `file-revision`, `pull-request`, `runtime-log`,
`metric`, `external-source`, `human-approval`, `protocol-receipt` and namespaced
extensions. Evidence records carry provenance and data classification.

Evidence content MAY live outside the contract store. A proof item references an evidence record by URI; the
evidence record carries the hash, the classification and the authorization boundary, and its retention is resolved
from the project's data-policy rule for that classification ([governance](governance-and-roles.md#data-classification),
DEC-0064).

## Artifacts

Artifacts have media type, URI, content hash, size when known, classification,
producer and optional schema reference. A2A artifacts map directly. MCP or local
providers wrap their outputs into the same artifact descriptor.

## Work graph relationships

A project owns runs; a run owns nodes; nodes reference dependencies by node ID and
pin one binding revision. Observations and evidence reference the node that
produced them. Storage adapters may normalize or embed these objects but MUST
preserve identifiers and lifecycle semantics.

## Partial and failed work

`partial` lists completed claims and remaining or unverified claims. `failed`
still includes useful artifacts and proof. Timeouts, cancellation and claim expiry
are outcomes with evidence; they do not erase provider output. Secret values,
unredacted credentials and private model reasoning MUST NOT appear in any field.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-093` | `result` | every `proof[].claimIds` member names a `done[].claimId`, and every done claim no proof names is listed in `notVerified` by its claim ID (DEC-0011, DEC-0064) |
