# Folder attribution: which Project a coding agent's folder belongs to

DEC-0089 · rule code `FAC-SEM-121` · schema [`folder-attribution.schema.json`](../../schemas/folder-attribution.schema.json)
· code [`src/folder-attribution.ts`](../../src/folder-attribution.ts) · vectors
[`fixtures/vectors/folder-attribution.json`](../../fixtures/vectors/folder-attribution.json), written by
[`tools/vectors/folder-attribution.ts`](../../tools/vectors/folder-attribution.ts) · tests
[`test/folder-attribution.test.ts`](../../test/folder-attribution.test.ts)

A coding agent starts in a folder, and three products attribute that folder to a Project at once: Fabric, Fabric
Switchboard and Project Observatory. Each did it by rules of its own, and on 2026-10-19 they disagreed on a plain
folder, an agent started in a subfolder, an origin owner and work done from inside a Project. This page is the one rule
set (the run's D1 and D2, org-index `docs/runs/2026-10-19-unified-attribution/README.md` at `5fb77fe`). Every product
runs the vectors in its own gate and keeps no rule of its own beside them.

Not here: the canonical Project id (Project Observatory's `project:<slug>`, with the other products' ids as its aliases,
the run's D3), the capability a session calls at its start (`project.attribute` in project-observatory-contract, D4),
and storage (each product writes only its own store, D5). This page decides which Project, not how it is named.

## The snapshot

`attributeFolder(snapshot)` reads no file system. A product gathers the facts and passes them
([`folder-attribution.schema.json#/$defs/snapshot`](../../schemas/folder-attribution.schema.json)):

| Member | What |
|---|---|
| `folder` | the folder the agent works in, absolute and real (symlinks resolved), `/`-separated; a Windows path as `C:/...` |
| `home` | the user's home folder, the same form |
| `tempRoots` | the platform's temporary and cache roots that exist: the OS temp dir, `/tmp`, `/private/tmp`, `/private/var/folders`, `/var/tmp`, `~/.cache`, `~/Library/Caches`, `~/AppData/Local/Temp` |
| `git` | `null` for a folder outside Git; else `{toplevel, commonDir, mainCheckout, origin}`: `git rev-parse --show-toplevel`, the absolute `--git-common-dir`, the common dir's working tree (the main checkout of a worktree), and `remote.origin.url` or `null` |
| `projects` | each Project as `{id, folders: [{path, commonDir, origin}], sources}`; `sources` the repository owners it lists, `host/owner` |
| `work` | optional: `{project, commonDir}`, a coding agent of `project` changed the repository with this common dir from inside that Project's folder |
| `tombstones` | optional: folders a person or agent removed |
| `explicit` | optional: a Project a person or agent attaches the folder to |

Paths compare segment by segment and as written: `/a/bc` is not under `/a/b`, and the product resolves case and links
before it builds the snapshot. A branch is read by no rule: a branch is the same repository.

## The repository identity

`normalizeOrigin(url)` is `host/path` in lower case (DEC-0089 item 2), from a URL whose scheme is `http`, `https`,
`ssh`, `git`, `git+ssh` or `git+https`, or from the scp form `[user@]host:path`. The user, a password or token, the port,
a query, a fragment, the leading and trailing `/` and one trailing `.git` are dropped. The host has a dot, and the path
has at least two segments: `owner/name`, or a group path such as `group/sub/name`. A local path, `file:`, any other scheme
or anything else has no identity. The owner (`ownerOf`) is every segment but the last.

This is not DEC-0076's normal form: that one compares URIs for equality and keeps the path's case. A repository identity
folds case because the hosts that serve these remotes route a path regardless of it, and the three products already
did (Switchboard lower-cased owner and name, Fabric kept group paths).

## The order

`attributeFolder` answers in this order and never throws:

| Row | Answer | When |
|---|---|---|
| AT-0 | `{fault: "input-invalid"}` | the snapshot is not of the schema's shape (a path not in the form above, Git facts whose top level does not hold the folder, two Projects with one id, a work record without a common dir), or `explicit` names no Project |
| AT-1 | attached, `explicit` | `explicit` names a Project, whatever else holds: an explicit attach also clears a tombstone |
| AT-2 | refused, `transient` | the folder is under a temporary or cache root: an agent's scratch worktree or a tool's cache clone comes and goes |
| AT-3 | refused, `tombstoned` | the folder, or the root it would be attached at, is at or under a tombstone; a tombstone keeps its own folder out, not every clone of its remote |
| AT-4 | attached, `folder` | the folder, or its nearest ancestor a Project lists, belongs to that Project; a container is never such an ancestor |
| AT-5 | attached, `worktree` | a Project's folder has the same Git common dir |
| AT-6 | attached, `repository` | a Project's folder has the same repository identity |
| AT-7 | refused, `tool` | the folder or its root is in a tool's own folder: a hidden folder directly in home, `Library` or `AppData` |
| AT-8 | attached, `owner` | the repository's owner is a source a Project lists |
| AT-9 | attached, `work` | a work record names the repository's common dir for a Project |
| AT-10 | refused, `container` | the root is a container: the filesystem or a drive root, home, a folder right under home, or a folder that holds another Project's folder |
| AT-11 | `new`, at the root | otherwise: the root is the main checkout (so a subfolder start and a worktree of an unknown repository are rooted at the repository), or the folder itself without Git |

**A tie attributes nothing.** Two Projects matching at one row answer `{outcome: "ambiguous", rule, projects}` with
both, in the snapshot's order, and the product reports it rather than choosing.

So a tool's folder still joins a known repository (a worktree a coding agent keeps in `~/.codex/worktrees`, a clone in a
plugin folder), but never makes a Project and never joins by owner or work. And a temporary folder joins nothing.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-121` | `folder-attribution` | an implementation's attribution of a snapshot (`{snapshot, answer}`) equals `attributeFolder`'s, row for row of the AT table |

Fixtures: `fixtures/positive/folder-attribution-snapshot.json`, `fixtures/negative/folder-attribution-relative-folder.json`,
`fixtures/semantic/folder-attribution-*`.

## Compatibility

New: no document changes and no product is refused. Each product's attribution changes where its own rules differed
(the run's table): Fabric's owner and work rules and its subfolder start, Switchboard's plain folder, Observatory's
scan by any host. `contractVersion` stays `0.1.0`.

## Who adopts it

- **Fabric** runs the vectors in its gate (CO-331): the subfolder start at the Git top level and the scoped tombstone
  (landed at Fabric `838d4986`), the owner and work rules (CO-329), and a plain folder as its own Project.
- **Fabric Switchboard** runs the vectors in `./scripts/check.sh` (SB-141): a plain folder as its own Project.
- **Project Observatory** runs the vectors in its engine's scan and in `project.attribute` (D4), for any host.
- **fabric-workspace** names this page from the knowledge page that owns the cross-product fact.

The board row is CT-57.

## Not decided here

- The canonical id and the aliases (D3), the session-start capability and its refusals (D4), and storage (D5).
- How a product learns the work records: Switchboard reads them from coding agents' transcripts (SB-131, SB-132).
- Folders on network shares and case-insensitive file systems beyond the product resolving the real path.
