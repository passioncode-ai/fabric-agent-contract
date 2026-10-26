# A node's summary and an organization's repairs (`node-summary/1`, `repair-request/1`)

**Maturity:** specified (DEC-0101, corrected by DEC-0102, narrowed by DEC-0105 and DEC-0118); implemented by Project Observatory's node at contract pin `f33f4d8a` (engine PR #345), the `machine.mode` reach (DEC-0118) owed at its re-pin (OBS-217). Asked by the first organization server for the operator's targets S7,
S8 and S10 (board thread `ba63565c`, items 7 and 8); the summary's first half was DV-CON-01, accepted on 2026-10-12.

An organization sees what each enrolled machine runs (S8), how that differs from what it expects (S10), and can ask
the machine to repair it, only under the machine's own policy and after the person is told. This page fixes three
documents and two rules; how a node gathers its harness, and how a server shows it, are theirs.

## The summary

`node-summary/1`, `repair-request/1` and `repair-result/1` are protocol revisions of their own (DEC-0067), each gated
on the other side's own `protocols` list (DEC-0117, as DEC-0116 gates the credential members): a node sends a summary
only to a server whose response `protocols` (what it accepts from the device, DEC-0094) lists `node-summary/1`, and a
result only to one that lists `repair-result/1`, and a server sends `records.repairs` only to a node whose check-in `protocols`
(what it reads, DEC-0067) lists `repair-request/1`; a node lists `repair-request/1` when it reads repairs and acts on
them.

A node sends `node-summary.schema.json` as a check-in record (`records.nodeSummary`, [devices](devices.md#check-in)) to
each organization it is enrolled in, when it changed and at least once a day. It travels inside the device request
DEC-0056 signs, so it carries no signature of its own. Over the relay it would need one; that is board row CT-90.

| Member | What it says |
|---|---|
| `device`, `context`, `sequence`, `at` | the device, the client certificate's (the enrollment's own `device.id`, DEC-0128 UE-1), which the receiver compares (DEC-0114); the enrollment's own organization, `org:<org.id>` exactly as the certificate binds it, which the receiver compares and refuses when it differs (never `personal`, DEC-0102); a number that rises with every summary of this device and context; the time |
| `harness.codingAgents` | each installed coding agent by its [catalogue](runners.md#the-coding-agent-catalogue-dec-0093) id (DEC-0093) and its version |
| `harness.mcpServers` | each MCP server the coding agents load: `name`, `source` (`user`, `project`, `local`, `plugin`, `managed`, `other`), `transport`, `health` |
| `harness.skills`, `harness.plugins` | each by name and source, a skill's digest, a plugin's version and digest |
| `harness.hooks` | how many hooks the coding agents load, never their commands |
| `services` | the agent services placed in this summary's context, and no other: `key` (`id.instance`), `state`, `protocols`, an A2A card digest, the MCP endpoint as published |
| `drift` | how the harness differs from the organization's baseline, under the policy revision that carried it |

**How much it lists** (DEC-0118, answering CT-92). It follows `machine.mode` ([device policy](devices.md#policy)):

- **`C`**, the default (the organization manages only its own work on the machine, the person's own machine with an
  organization's context beside its others): the summary lists only what belongs to this organization's context. That
  is each coding agent by its catalogue id and version and the hook count (the tools the context's work runs on, no
  name of the person's), and only those MCP servers, skills and plugins that are a package placed in this context, or
  installed in a folder matching the organization's own `workspace.folders` ([device policy](devices.md#policy)), or
  named by its `harness.baseline` (`coding-agent`, `mcp-server`, `skill`, `plugin`), each listed when present. An
  item installed for the person (`source: user`), machine-wide (`source: managed`, which belongs to no one
  organization) or for another context is not listed unless one of those three admits it: no name of another context
  reaches this organization (CX-22). A baseline `service` is judged against this context's services only, so one that
  runs only in another context reads `missing`.
- **`A`** (the organization administers the whole machine, set only from an `mdm` layer): the whole harness of the
  machine, as the operator decided for a work machine that is transparent to its organization (S8; the first
  organization server's ADR-0011).

Under either mode the services are those of the summary's own context only (DEC-0102).

**What it never carries** (`FAC-SEM-128`): a person (no e-mail address), a path (a name holds no slash, backslash, tilde
or space, by schema; no string holds a home directory, the dash forms runtimes write into file names included after
any character that is not an ASCII letter or digit, `x.-Users-<name>` or `p@-Users-<name>`, DEC-0105), a credential, an argument, an environment value, a prompt, an
output or a file's content, and no member that says the summary is withheld (DEC-0105). A personal agent service is
not listed toward an organization; under `machine.mode` `A` the organization sees the machine's harness because the
operator decided work machines are transparent to their organization (S8), named as a purpose in its notice, and under
`C` only its own context's (DEC-0118).

## The baseline and the drift

The organization states what every machine is expected to run as the policy key `harness.baseline`
([device policy](devices.md#policy)): items by `kind` (`coding-agent`, `mcp-server`, `skill`, `plugin`, `service`) and
`name`, with an optional `minVersion` (dotted numbers) for a coding agent or a plugin and an optional `digest` for a
skill or a plugin; the schema refuses either on another kind (DEC-0102). A node reads it, and `repair.packages`, from the
`mdm` and `server` layers only: a person's own `user` layer never sets, widens or empties either (DEC-0102;
`harnessBaseline` and `signedPolicyValue` in `src/node-summary.ts`).

`harnessDrift(baselineItems, summary)` (`src/node-summary.ts`) answers, in the baseline's order, one state per item, the
first that holds:

| State | When |
|---|---|
| `missing` | the harness has no item of that kind and name |
| `stopped` | a service whose state is not `ok` or `degraded`, or an MCP server whose health is `down` |
| `changed` | the baseline names a digest and the item carries another, or none: a skill or a plugin, the only kinds the baseline may give a digest (DEC-0102) |
| `outdated` | the baseline names a `minVersion` and the item's version is below it, compared number by number, or is not dotted numbers: a coding agent or a plugin, the only kinds the baseline may give a `minVersion` (DEC-0102) |

A summary under a policy with a baseline carries `drift` with that policy layer's revision and exactly these items (an
empty list when none); under a policy without one it carries no `drift` (`FAC-SEM-128`).

## Repairs

An organization asks a node to run one package with `repair-request.schema.json`, carried in a check-in response's
`records.repairs` and signed like a policy layer: a key of the organization's current policy key set
([key sets](devices.md#key-sets), `FAC-SEM-046`) over `policySigningInput`. It names the device, a `fabric-package/1`
by `agentRef`, `version` and `digest`, one line the person reads (`task`), and a window of at most 7 days.

`repairDecision` (`src/node-summary.ts`) is the node's decision, in this order (`FAC-SEM-129`). A port runs the shared
vectors [`fixtures/vectors/repair-decision.json`](../../fixtures/vectors/repair-decision.json) (written by
`tools/vectors/repair-decision.ts`, never by hand): requests signed by an Ed25519 test key from a fixed seed, each case
with the answer this table gives, covering the order, the key window and the `org-cloud` exception.

| Refused as | When |
|---|---|
| `already-answered` | this repair `id` was already answered: the node answers again with the stored result, runs nothing, and never sends this reason in a `repair-result/1`; an id is the issuing organization's, so a node keeps results by `org.id` and id, and a server asks again only under a new id (DEC-0102) |
| `bad-signature` | no key of the current set with that `keyId` and algorithm, inside its `notBefore` and `notAfter` at that moment (as `FAC-SEM-041` judges a policy's: an absent bound open, one that does not read closing the window, `keyWindowHolds`, DEC-0115), verifies the signature; a request with no canonical form is refused here, never thrown (DEC-0102) |
| `wrong-device` | the request names another device or organization |
| `expired` | outside `issuedAt` ≤ now < `expiresAt`, or a window longer than 7 days |
| `policy-expired` | the policy expired: remote execution stops with it, exactly as `FAC-SEM-068` decides (a policy with no `expiresAt` does not expire, DEC-0102) |
| `not-allowlisted` | the policy key `repair.packages` does not list the package's `agentRef` and `digest`; absent, no repair runs |
| `person-declined` | the person was not told before it started, or declined. A machine with role `org-cloud` binds no person: the organization's own signed request is its notice (DEC-0102) |

Otherwise it runs. The node keeps one result per request id and sends it with `repair-result.schema.json` in its next check-in
(`records.repairResults`; a redelivered request gets that same stored result again, never a second run, and a receiver
keeps one result per id): `succeeded` with when the person was told (on an `org-cloud` machine, when it verified the signed request) and when it started, or `failed` or `refused` with the
reason. How the person is told, and the package's own run, are the node's.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-128"></a>`FAC-SEM-128` | `node-summary`, `node-summary-document`, `device-check-in` | `{summary, baseline?, org?}`: no string carries a credential, an e-mail address or a home path; no list names an item twice; `context` is `org:` and `org` as written; with a baseline (`{revision, items}`), `drift` names its revision and equals `harnessDrift`, without one there is no `drift`. Kind `node-summary-document` reads a summary alone with the first two clauses (DEC-0102); kind `device-check-in` reads a check-in's `records.nodeSummary` with them, under its member's path, and its `device.id` is the check-in's (DEC-0114) |
| <a id="fac-sem-129"></a>`FAC-SEM-129` | `repair-run` | `{request, keys, device: {id, org, role?}, layers, at, notifiedAt?, declined?, answered?, decision, reason?}`: the node's decision and reason are exactly `repairDecision`'s |

## Not decided here

- The summary's own signature over the relay (CT-90).
- How often a server may ask for a summary, and how long it keeps one: the organization's retention.
- What a server shows, and to whom: its own interface, under its notice.
- Whether a node may withhold its summary from an organization, or leave names out, by the person's choice: until
  DEC-0118 the summary lists what `machine.mode` admits (before it, the whole harness whatever the mode, DEC-0102), and a
  server that has no summary from a node within a day knows it has none (DEC-0105); whether a person may send none is
  CT-92's open half.
