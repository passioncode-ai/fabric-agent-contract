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
| `projects` | each Project as `{id, folders: [{path, commonDir, origin, toplevel}], sources}`: each folder's Git common dir, raw origin and Git top level (`null` outside Git), and `sources` the repository owners it lists, `host/owner` |
| `work` | optional: `{project, commonDir, origin?}`, a coding agent of `project` changed the repository with this common dir (and this raw `origin`, when it has one) from inside that Project's folder |
| `tombstones` | optional: folders a person or agent removed |
| `explicit` | optional: a Project a person or agent attaches the folder to |

Paths compare segment by segment and as written: `/a/bc` is not under `/a/b`, and the product resolves case and links
before it builds the snapshot. A branch is read by no rule: a branch is the same repository. Gathering it:

- **A Git probe that fails or times out is not "no Git".** A product that cannot read the Git facts does not attribute
  the folder (it tries again later); passing `git: null` would make a subfolder of a repository a plain-folder Project.
- **`origin` is the raw `remote.origin.url`.** A stored identity (`host/owner/name`) is not a URL and has no identity
  here, so a product that kept only its own key re-reads the remote or keeps the raw URL beside it.
- **A worktree of a bare repository** has no working tree of its own: its `mainCheckout` is the bare repository's folder
  (the common dir), and the container and tombstone rows read that folder.
- **A Project folder's `toplevel`** places it in its repository: a folder at `mono/pkg` under the top level `mono` is
  at `pkg`. AT-6 and AT-7 read it, so a worktree or a clone of the outer of two nested Projects joins the outer one and
  a folder inside the inner one the inner one. A folder in Git without it counts as at the top, so a product gives it for
  every folder in Git; a nested Project without it ties with the outer one.
- **Work records** carry the repository's common dir and, when it has one, its raw `origin`, so a second clone of a
  repository a Project's agent worked in joins by work too.

## The repository identity

`normalizeOrigin(url)` is `host/path` in lower case (DEC-0089 item 2), from a URL whose scheme is `http`, `https`,
`ssh`, `git`, `git+ssh` or `git+https`, or from the scp form `[user@]host:path`. The user, a password or token, the port,
a query, a fragment, the leading and trailing `/` and one trailing `.git` are dropped, and surrounding whitespace is
trimmed. The host is a DNS name of letters, digits, `.` and `-` with a dot (so `git_host.example.com` has no identity, and
an SSH alias such as `github.com-work` is an identity of its own), and the path has at least two segments: `owner/name`, or a group path such as `group/sub/name`. A local path, `file:`, any other scheme
or anything else has no identity. The owner (`ownerOf`) is every segment but the last.

This is not DEC-0076's normal form: that one compares URIs for equality and keeps the path's case. A repository identity
folds case because GitHub, GitLab and Bitbucket route a path regardless of it, so `Example-Org/Fabric` and
`example-org/fabric` are one repository there. Of the three products only Switchboard folded case (owner and name);
Fabric folds the host only and keeps group paths, and Observatory keeps case. The cost is accepted: on a server whose
paths are case-sensitive, two repositories that differ only in case read as one. A product that stored a key in another
form normalizes it again when it adopts this decision.

## The order

`attributeFolder` answers in this order and never throws. The *root* is the folder a new Project would start at: the
main checkout, or the folder itself without Git.

| Row | Answer | When |
|---|---|---|
| AT-0 | `{fault: "input-invalid"}` | the snapshot is not of the schema's shape (a path not in the form above, a Project id or `explicit` of more than 256 characters, an empty source, an origin of more than 4096, all counted in code points; Git facts, or a Project folder's `toplevel`, that do not hold the folder; two Projects with one id; a work record without a Project or a common dir), or `explicit` names no Project |
| AT-1 | attached, `explicit` | `explicit` names a Project, whatever else holds: an explicit attach also clears a tombstone |
| AT-2 | refused, `tombstoned` | the folder is at or under a tombstone |
| AT-3 | attached, `folder` | the folder, or its nearest ancestor a Project lists, or the folder itself if a Project lists it, belongs to that Project; a filesystem or drive root, home or an ancestor of home is never so listed (the outer of two nested Projects keeps its folders outside the inner one; a folder right under home a Project lists is its folder) |
| AT-4 | refused, `transient` | the folder or its root is under a temporary or cache root |
| AT-5 | refused, `container` | the root is a filesystem or drive root, home, an ancestor of home, or a folder right under home that no Project lists |
| AT-6 | attached, `worktree` | a Project's folder has the same Git common dir, or is the main checkout, and holds the folder's place in the repository (the nearest such place wins) |
| AT-7 | attached, `repository` | a Project's folder has the same repository identity and holds the folder's place (the nearest wins) |
| AT-8 | attached, `owner` | the repository's owner is a source a Project lists |
| AT-9 | refused, `tool` | the folder or its root is in a tool's own folder: a hidden folder directly in home, `Library` or `AppData` |
| AT-10 | attached, `work` | a work record names this repository (its common dir, or its identity) for a Project |
| AT-11 | refused, `tombstoned` | the root is at or under a tombstone: no new Project is made there |
| AT-12 | refused, `container` | the root holds another Project's folder: no Project is made around another |
| AT-13 | `new`, at the root | otherwise: so a subfolder start and a worktree of an unknown repository are rooted at the repository, and a folder without Git at itself |

**A tie attributes nothing.** Two Projects matching at one row answer `{outcome: "ambiguous", rule, projects}` with
both, in the order of `projects`, and the product reports it rather than choosing.

**Where the order departs from D2's list, and why** (each a choice of DEC-0089):

- **The folder's own Project first, then the temporary refusal (AT-3, AT-4).** D2 ranks "already belongs to a Project"
  first, as Switchboard does: a Project that lives under a temporary root keeps working. A folder nobody lists there
  joins nothing, a worktree whose main checkout is there neither.
- **Broad containers before every attach row (AT-5), a holder only before creation (AT-12).** D2 refuses them and never
  creates them, and Fabric and Switchboard both refuse them when attaching today: a home that is a clone of a Project's
  repository is not attached. A folder right under home is a container only when no Project lists it, so a Project
  kept there keeps its folders and worktrees. A root that holds another Project's folder is refused only when nothing
  attached the folder: a worktree of the outer of two nested Projects joins it, and the root of a repository whose only
  Project is a subfolder of it is not made a Project around that one.
- **A worktree or clone is the same tree (AT-6, AT-7).** Its folder joins the Project whose folder holds the same place
  in the repository, the nearest first, as AT-3 does by path.
- **A tombstone is scoped to its folder (AT-2, AT-11).** It keeps the folder and its subfolders out of every row, and
  keeps a new Project from starting at a tombstoned root; it does not keep out a worktree of a Project that keeps the
  repository (D2: "scoped to the folder, not to every clone").
- **A tool's folder after the owner row (AT-9).** As Switchboard's SB-131: a tool's folder joins a known repository by
  worktree, repository or owner, but never by work and never as a new Project.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-121` | `folder-attribution` | an implementation's attribution of a snapshot (`{snapshot, answer}`) equals `attributeFolder`'s, row for row of the AT table |

Fixtures: `fixtures/positive/folder-attribution-snapshot.json`, `fixtures/negative/folder-attribution-relative-folder.json`,
`fixtures/semantic/folder-attribution-*`.

## Compatibility

New: no document changes and no product is refused. Each product's answers change where its rules differed from the
table, and each adopts by running the vectors; the rows below are the changes measured on 2026-10-19 (the run index and
the products' code). `contractVersion` stays `0.1.0`.

## Who adopts it

- **Fabric** (CO-331, CO-329) runs the vectors in its gate. Owed: a tombstone that covers subfolders (today an exact
  path, so it fails "AT-2: a subfolder of a tombstoned folder") and that does not refuse an attach by worktree; the
  temporary (AT-4) and tool (AT-9) refusals; the owner and work rows (AT-8, AT-10); each folder's `toplevel` and the
  nearest place (AT-6, AT-7); the repository identity folding the whole path's case, read from the raw remote (a stored
  `remote_key` is not a URL: re-read the remote, or keep the raw URL beside the key); not attributing when its Git probe
  times out. Its plain folder as its own Project and its subfolder start at the Git top level already match (CO-330,
  `f7c71cba`). Projects it stored at a subfolder before CO-330 hold their repository's root as a container (AT-12)
  until they are moved to the top level.
- **Fabric Switchboard** (SB-141) runs the vectors in `./scripts/check.sh`. Owed: a plain folder as its own Project;
  group paths of three or more segments; the ancestors of home refused, and a folder right under home refused unless a
  Project lists it; the nearest of nested Project folders and their ties (AT-3), and by place for worktrees and clones
  (AT-6, AT-7); its `dismissed` and `gone` rows read as tombstones; its CLI text on containers updated with them.
- **Project Observatory** (the engine) runs the vectors in its scan and in `project.attribute` (D4). Measured against
  the table: it has no work row (AT-10) and reads owners only indirectly (AT-8); it scans only the children of its data
  root, so a subfolder start is not rooted at the repository (AT-13) and a remoteless worktree joins only on its tip
  (AT-6); its `_*` folders and `folder_exclusions.json` become containers and tool folders read through AT-5 and AT-9,
  and `denied_links.json` becomes tombstones (AT-2, AT-11), with no rule of its own left beside the vectors; plain
  folders, group paths, any host, the identity's case, temporary roots (AT-4) and ties.
- **Every product** that attaches explicitly over a tombstone removes the tombstone it overrode: the function only lets
  the explicit attach win.
- **fabric-workspace** names this page from the knowledge page that owns the cross-product fact.

The board row is CT-57.

## Not decided here

- The canonical id and the aliases (D3), the session-start capability and its refusals (D4), and storage (D5).
- How a product learns the work records: Switchboard reads them from coding agents' transcripts (SB-131, SB-132).
- Folders on network shares and case-insensitive file systems beyond the product resolving the real path.
- Hosts that serve one repository under two URL shapes (Azure DevOps: `dev.azure.com/org/proj/_git/repo` and
  `ssh.dev.azure.com/v3/org/proj/repo`): today they are two identities, and the owner of the first reads as
  `org/proj/_git`.
- A state for "not attributable yet" (the Git probe failed): the function is never called then, and
  `project.attribute` (D4) names it in project-observatory-contract.
- A user-facing scenario: the contract has no interface here; each product's scenarios own how a session's Project,
  a tie or a refusal is shown.
