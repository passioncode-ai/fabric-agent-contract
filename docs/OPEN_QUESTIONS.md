# Open questions

Append-only register. Status vocabulary: `Open`, `Resolved→DEC-####`, or
`Dropped (<reason>)`.

No open questions remain from stage 0. Later stages reserve `OQ-####` before adding
an entry. The coordination config declares no `OQ` id register, so an id is taken
under the lease on this file, from the line below.

**Next free ID:** `OQ-0008`

The seven questions below were raised by module AR-1 (DEC-0016) about the contracts
Fabric locked on 2026-09-29. Each names the part that is implemented and the part that
waits. The owner of the answer is the operator; all seven were ruled on 2026-09-30 and are
resolved by DEC-0017. Each "Meanwhile" line below records what AR-1 did before the
ruling; DEC-0017 states what holds now.

### OQ-0001 — What does "the manifest's `provider.id` equals the entry's `id`" compare?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (FAC-SEM-014)
- **Question:** `manifest.schema.json` makes `provider.id` an absolute URI; a provider
  entry's `id` is a slug (`^[a-z][a-z0-9-]{1,62}$`). The two can never be equal. Options:
  (a) the manifest names its entry in an extension block, as a service manifest names its
  descriptor; (b) `provider.id` must be `urn:fabric:provider:<id>`; (c) the last path
  segment of `provider.id` equals the entry id.
- **Meanwhile:** FAC-SEM-014 enforces the resolvable half only (the manifest resolves to a
  provider manifest).

### OQ-0002 — Is a job result a full result envelope?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (C3.2)
- **Question:** C3.2 lists `{done, proof, scope, notVerified, output, usage}`; the full
  result (DEC-0011) also requires `id`, `contractVersion`, `outcome`, `artifacts`,
  `createdAt` and `producer`, and its `scope` requires `project`, `run`, `node` and
  `binding`, which an agent called through the hub knows only if the hub passes them.
- **Meanwhile:** `interop-result.schema.json` requires exactly the listed members, reuses
  the full result's item shapes, and admits `outcome` and `artifacts` as optional.

### OQ-0003 — Where does a job result carry its trace id?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (FAC-SEM-019)
- **Question:** C3.2's job shape has no trace field, yet FAC-SEM-019 speaks of "a job result
  without a trace id". Options: the `_meta.traceparent` of the answer that delivers the
  result, or a `traceId`/`spanId` pair inside `job`.
- **Meanwhile:** the rule reads the answer's `_meta.traceparent`.

### OQ-0004 — Which "secret patterns" does FAC-SEM-015 apply to an env value?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (FAC-SEM-015)
- **Question:** the adapter's existing patterns are secret *names* (password, API key,
  access token, client secret, private key). Applied to a value they refuse
  `secret-ref:EXAMPLE_API_KEY`, which is a correct reference.
- **Meanwhile:** the rule refuses a value that is not `secret-ref:…` and a reference whose
  body has a credential's *shape* (token prefix, PEM key, JWT, long mixed-case key run).

### OQ-0005 — How does PL-1 read a checker stage and a join?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (PL-1)
- **Question:** a checker stage without a capability has no schemas, so the locked example's
  `check → publish` edge cannot be checked literally; and "for each edge" makes every
  producer of a join provide all of the consumer's required properties.
- **Meanwhile:** a capability-less checker passes its inputs through (its outgoing edges are
  checked against the stages feeding it), and PL-1 is applied per edge as locked.

### OQ-0006 — What does a job-capable tool declare as its `outputSchema`?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (C3.1 with C3.2)
- **Question:** C3.1 serves the capability's `outputSchema` on the tool, and MCP requires
  `structuredContent` to conform to a declared `outputSchema`; C3.2 has a job-capable tool
  return `{job: {...}}` in `structuredContent`, which does not conform. Options: the tool
  declares `oneOf` of the output and the job handle; the handle travels outside
  `structuredContent`; or a job-capable tool declares no `outputSchema` and the manifest
  keeps it.
- **Meanwhile:** FAC-SEM-017 compares schemas exactly as locked; the Fabric Agent Adapter's
  kit serves the job tool's `outputSchema` as the capability's and says so.

### OQ-0007 — Which events must carry `traceId` and `spanId`?

- **Status:** Resolved→DEC-0017
- **Raised:** 2026-09-30, AR-1 (C3.4 c)
- **Question:** C3.4 says "every event"; a service also publishes events no traced request
  caused (it started, a schedule fired).
- **Meanwhile:** the pair is optional in the events schema and required, as a pair, on an
  event about traced work.

