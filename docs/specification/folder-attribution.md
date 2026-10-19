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

Not here: how Projects are named across the products, the capability a session calls at its start, and storage. The
operator corrected D3 and D4 later on 2026-10-19 (Fabric ADR-0166, amendment "Fabric is the core", on the board thread
`617c8cbe`): the canonical Project id is **Fabric's**, and Observatory's `project:<slug>` and Switchboard's pool are
recorded against it as aliases (`observatory:<slug>`, `switchboard:<pool>`); the session-start capability is Fabric's,
served by its hub, and Observatory and Switchboard ask it (the board message adds that they apply these rules locally
while Fabric is not running and reconcile later; the ADR's amendment states only the asking). Each product writes only its own store (D5). This page decides which Project, not how it is
named or served.

## The snapshot

`attributeFolder(snapshot)` reads no file system. A product gathers the facts and passes them
([`folder-attribution.schema.json#/$defs/snapshot`](../../schemas/folder-attribution.schema.json)):

| Member | What |
|---|---|
| `folder` | the folder the agent works in, absolute and real (symlinks resolved), `/`-separated; a Windows path as `C:/...`, its drive letter upper case |
| `home` | the user's home folder, the same form |
| `tempRoots` | the platform's temporary and cache roots that exist: the OS temp dir, `/tmp`, `/private/tmp`, `/private/var/folders`, `/var/tmp`, `~/.cache`, `~/Library/Caches`, `~/AppData/Local/Temp` |
| `git` | `null` for a folder outside Git; else `{toplevel, commonDir, mainCheckout, origin}`: `git rev-parse --show-toplevel`, the absolute `--git-common-dir`, the main checkout (the first entry of `git worktree list --porcelain`; for a bare repository, the common dir), and `remote.origin.url` or `null` |
| `projects` | each Project as `{id, folders: [{path, commonDir, origin, toplevel}], sources}`: each folder's Git common dir, origin (as its record kept it, without credentials) and Git top level (`null` outside Git), and `sources` the repository owners it lists, `host/owner`, compared with `A` to `Z` folded as the identity is (a non-ASCII letter as written) and a trailing `/` ignored |
| `work` | optional: `{project, commonDir, origin?}`, a coding agent of `project` changed the repository with this common dir (and this `origin` without credentials, when it has one) from inside that Project's folder |
| `tombstones` | optional: folders a person or agent removed |
| `containers` | optional: folders a person declared containers, such as the folder that holds agent worktrees: never a Project, never listed, never an ancestor a folder joins |
| `explicit` | optional: a Project a person or agent attaches the folder to |

Paths compare segment by segment and as written: `/a/bc` is not under `/a/b`, and the product resolves case and links
before it builds the snapshot. A branch is read by no rule: a branch is the same repository. Gathering it:

- **A Git probe that fails or times out is not "no Git".** A product that cannot read the Git facts does not attribute
  the folder (it tries again later); passing `git: null` would make a subfolder of a repository a plain-folder Project.
- **`origin` is the raw `remote.origin.url`.** A stored identity (`host/owner/name`) is not a URL and has no identity
  here, so a product that kept only its own key re-reads the remote or keeps the URL beside it. What a product stores is
  the URL without credentials (`recordOrigin`, [recording the answer](#recording-the-answer)): it names the same
  repository, and no product's store holds a token from a remote.
- **A worktree of a bare repository** has no working tree of its own: its `mainCheckout` is the bare repository's folder
  (the common dir), and the container and tombstone rows read that folder.
- **Every Project folder in Git carries its `commonDir` and `toplevel`.** A folder without a common dir is read only by
  path (AT-3, AT-8), so it loses AT-6 to a folder that has one.
- **A home kept under Git** (a dotfiles repository whose top level is home or an ancestor of it) is not a repository
  folders belong to: a product passes `git: null` for a folder whose top level is broad, so a plain folder below home is
  still its own Project.
- **Project ids compare as written.** `id`, `explicit` and `work[].project` are each product's own opaque keys, matched
  byte for byte; the canonical id is Fabric's and the others are its aliases (D3 as the operator corrected it,
  [identifiers](identifiers.md#where-identifiers-are-compared)).
- **A Project folder's `toplevel`** places it in its repository: a folder at `mono/pkg` under the top level `mono` is
  at `pkg`. AT-6 and AT-7 read it, so a worktree or a clone of the outer of two nested Projects joins the outer one and
  a folder inside the inner one the inner one. A folder in Git without it counts as at the top: a nested Project without
  it ties with the outer one.
- **Work records** carry the repository's common dir and, when it has one, its `origin` without credentials, so a second clone of a
  repository a Project's agent worked in joins by work too.

## The repository identity

`normalizeOrigin(url)` is `host/path` with `A` to `Z` lower-cased (DEC-0089 item 2; a non-ASCII letter keeps its case), from a URL whose scheme is `http`, `https`,
`ssh`, `git`, `git+ssh` or `git+https`, or from the scp form `[user@]host:path`. The user, a password or token, the port,
a query, a fragment, the leading and trailing `/` and then one trailing `.git` are dropped (so a path ending in `/.git`
keeps an empty segment and has no identity), and surrounding whitespace is
trimmed. The host is a DNS name of ASCII letters, digits, `.` and `-` with a dot, after the same `A` to `Z` folding (so
`git_host.example.com` has no identity, nor has a host with a non-ASCII letter such as the Kelvin sign U+212A, and
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
main checkout, or the folder itself without Git. A folder is *broad* when it is a filesystem or drive root, home, an
ancestor of home or a declared container. A Project folder's *place* is its path below its Git top level (`""` at the
top), and the folder's place is its path below `git.toplevel`.

| Row | Answer | When |
|---|---|---|
| AT-0 | `{fault: "input-invalid"}` | the snapshot is not of the schema's shape (a path not in the form above, a Project id or `explicit` of more than 256 characters, an empty source, an origin of more than 4096, all counted in code points; a work record with no `project` or no common dir), or it breaks a condition across members that the schema cannot state (Git facts, or a Project folder's `toplevel`, that do not hold the folder; two Projects with one id; `explicit` naming no Project). A work record naming a Project the snapshot does not hold is no fault: it matches nothing |
| AT-1 | attached, `explicit` | `explicit` names a Project, whatever else holds: an explicit attach wins over a tombstone, and over a broad folder |
| AT-2 | refused, `tombstoned` | the folder is at or under a tombstone, and no Project lists a folder, not broad, strictly below that tombstone which holds the folder (so a folder attached explicitly below a removed parent stays attached, and its siblings stay out) |
| AT-3 | attached, `folder` | a folder a Project lists, not broad, holds the folder with no declared container between them (a container inside a Project's folder ends that folder's reach): when one in the folder's own repository holds it, the nearest place among that repository's Project folders decides, by common dir or by identity, the same common dir at equal depth, as AT-6 and AT-7 do; else the nearest listed folder by path (the outer of two nested Projects keeps its folders outside the inner one; a folder right under home a Project lists is its folder) |
| AT-4 | refused, `transient` | the folder or its root is at or under a temporary or cache root |
| AT-5 | refused, `container` | the folder or its root is broad; or the folder is right under home and listed by no Project; or a worktree's own top level is; or the root is, and no Project folder of its repository lies in it (for a worktree, none anywhere), so a start in any folder of a checkout right under home is refused as the checkout is |
| AT-6 | attached, `worktree` | a Project's folder, not broad, has the same Git common dir or is the main checkout, at a place that holds the folder's (the nearest such place wins), and no folder of the same repository identity holds a nearer place |
| AT-7 | attached, `repository` | a Project's folder, not broad, has the same repository identity, at a place that holds the folder's and is nearer than any AT-6 would take (the nearest wins). AT-6 and AT-7 weigh the places as AT-3 does, so an answer and the answer after its record is applied name one Project |
| AT-8 | attached, `worktree` | the root lies in a folder a Project lists (AT-3's search on the root): a worktree goes where its main checkout goes |
| AT-9 | refused, `container` | the repository has Project folders (by common dir or identity, not broad), but none at a place that holds the folder's: the root of a repository whose only Project is a subfolder of it, by worktree or by clone |
| AT-10 | attached, `owner` | the repository's owner is a source a Project lists |
| AT-11 | refused, `tool` | the folder or its root is in a tool's own folder: a hidden folder directly in home, `Library` or `AppData` |
| AT-12 | attached, `work` | a work record names this repository (its common dir, or its identity) for a Project the snapshot holds |
| AT-13 | refused, `tombstoned` | the root is at or under a tombstone: no new Project is made there |
| AT-14 | refused, `container` | the root holds another Project's folder: no Project is made around another |
| AT-15 | `new`, at the root | otherwise: so a subfolder start and a worktree of an unknown repository are rooted at the repository, and a folder without Git at itself |

**A tie attributes nothing.** Two Projects matching at one row answer `{outcome: "ambiguous", rule, projects}` with
both, in the order of `projects`, and the product reports it rather than choosing.

**Where the order departs from D2's list, and why** (each a choice of DEC-0089):

- **The folder's own Project first, then the temporary refusal (AT-3, AT-4).** D2 ranks "already belongs to a Project"
  first, as Switchboard does: a Project that lives under a temporary root keeps working. A folder nobody lists there
  joins nothing, a worktree whose main checkout is there neither.
- **Broad containers before every Git row (AT-5), the holders only after them (AT-9, AT-14).** D2 refuses containers
  and never creates them. Fabric and Switchboard both refuse a broad folder they would create, but neither refuses one
  by worktree today (Fabric matches a worktree before its breadth check; Switchboard's attach has no home check): the
  contract chooses to refuse home, a root or a folder right under home for every Git row, as a worktree or as a clone
  alike, and both products owe it. A folder right under home that a Project lists is that Project's (Switchboard offers
  its worktrees), and so is a worktree of a repository whose Project lives there. A repository root holding a Project's
  subfolder is refused only when nothing attached the folder (AT-9 for the repository, AT-14 for a plain root). A
  declared container is broad wherever it lies: one inside a Project's folder ends that folder's reach (AT-3), so the
  container itself is refused (AT-5) and what it holds goes by its own rows, as a worktree there joins its repository's
  Project (AT-6). DEC-0089 item 3 holds for every row: a broad folder is attached only explicitly.
- **A worktree or clone is the same tree (AT-6 to AT-9).** Its folder joins the Project whose folder holds the same
  place in the repository, the nearest first, as AT-3 does by path; else the Project its main checkout lies in; and when
  the repository's Projects all sit deeper, it is a container of them, never a second Project for the same repository.
- **A tombstone is scoped to its folder (AT-2, AT-13).** It keeps the folder and its subfolders out of every row, and
  keeps a new Project from starting at a tombstoned root; it does not keep out a worktree of a Project that keeps the
  repository (D2: "scoped to the folder, not to every clone"). A folder a Project lists below the tombstone is the
  Project's, so an explicit attach below a removed parent lasts.
- **What follows from D2 against the operator's literal words** (in the run index: a worktree or a branch goes to the
  existing Project, a new folder makes a new one), recorded so the operator can correct them on the board. The list is
  by row, so it is whole: the operator's words hold exactly where the row they name decides, and every row that can
  decide first departs from them.
  - *A worktree or clone of a known repository* joins its Project exactly when AT-6, AT-7 or AT-8 decides. It does not
    when an earlier row decides: an explicit attach elsewhere (AT-1); a tombstone on the folder (AT-2); another
    Project's folder that holds it, unless a declared container lies between (AT-3); a temporary root that holds the
    folder or its main checkout (AT-4), so a worktree in an ordinary folder whose main checkout is kept under a
    temporary root is refused while a clone of it joins; a broad folder, or a checkout right under home, from any
    folder of it (AT-5). Nor when no row can see it: a repository whose Projects all sit in its subfolders (AT-9), and a
    clone the identity cannot match, which is a new Project (AT-15): one through an SSH alias (`github.com-work`), with
    a local path or no origin, or of a repository whose Project folders were stored without one.
  - *A new folder* makes a new Project exactly when AT-15 decides. It does not inside another Project's folder (AT-3,
    a repository cloned into a plain-folder Project included), under a temporary root (AT-4), when broad or right under
    home (AT-5), in a tool's own folder (AT-11), at a tombstoned root (AT-13), or at a root that holds another
    Project's folder (AT-14).
- **A tool's folder after the owner row (AT-11).** As Switchboard's SB-131: a tool's folder joins a known repository by
  worktree, repository or owner, but never by work and never as a new Project.

## Recording the answer

The next folder's answer reads what the products recorded, so each records the same: `explainFolder(snapshot)` answers
`{answer, row, record}`, and `record` is the Project folder to add, `{path, commonDir, origin, toplevel}`, or `null`
(the vectors' `record` cases hold one of each):

| Answer | `record` |
|---|---|
| attached, `folder` | `null`: the folder is already the Project's |
| attached, `worktree` or `repository` at AT-6 or AT-7 | the matched Project folder's place in this checkout: `git.toplevel` joined with that place (the top level itself at place `""`), with `toplevel` the checkout's top level and the snapshot's `commonDir` and `origin` as `recordOrigin` keeps it |
| attached, `worktree` at AT-8, `owner` or `work` | `git.toplevel`, its own top level |
| attached, `explicit` | the folder (with its Git facts when in Git), or `null` for a broad folder: an explicit attach of home holds for that call only. The product removes a tombstone at the folder itself, never one above it (AT-2 lets the recorded folder through) |
| `new` | the root, with `toplevel` the root itself (`null` for a bare repository's folder, which has no working tree) and the snapshot's `commonDir` and `origin` as `recordOrigin` keeps it; `null` members without Git |
| refused, `ambiguous`, fault | `null` |

A product adds `record` to the attached Project (or the new one) and nothing else; the tests apply each vector's
record that attaches or creates (an explicit one asked again without `explicit`, the tombstone at the folder removed)
and ask again, and the Project stays. So after one worktree of a Project is recorded under `~/work/_worktrees`, that
folder holds a Project's folder and is never made a Project itself (AT-14). The other order is the trap: a session
started in an undeclared `~/work/_worktrees` itself makes it a plain-folder Project (AT-15), and every later worktree
placed in it joins that Project (AT-3). A folder that holds agent worktrees is declared a container before its first
session (Observatory's `_*` folders are, below).

The record's `origin` is the remote without what can carry a credential (`recordOrigin`): an `http` or `https` URL
loses its user information, any URL its password, query and fragment, the scp form `user:secret@host:path` its
`:secret` up to the host's last `@`; a local path is kept; `null` for a URL with no repository identity (its authority
cannot be read reliably) and when what is left still has the shape of a secret (`secretUrl`). A record whose path is
broad (a declared container at the matched place) is `null`, as an explicit attach of a broad folder is. An explicit
attach of a folder another Project already holds at the same place ties at AT-3 when asked again, until the product
removes the other Project's folder (D5). It names the
same repository (`normalizeOrigin` of both is one identity), and the vectors' `record` cases hold one of each form.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| `FAC-SEM-121` | `folder-attribution` | an implementation's attribution of a snapshot (`{snapshot, answer}`) equals `attributeFolder`'s, row for row of the AT table |

Fixtures: `fixtures/positive/folder-attribution-snapshot.json`, `fixtures/negative/folder-attribution-relative-folder.json`,
`fixtures/semantic/folder-attribution-*`.

## Compatibility

New: no document changes and no product is refused. Each product's answers change where its rules differed from the
table, and each adopts by running the vectors; the rows below are the changes measured on 2026-10-19 (the run index and
the products' code). `contractVersion` stays `0.1.0`. Project counts move on adoption: plain folders become Projects in
Switchboard and Observatory, subfolder starts merge into their repository's Project, and stored Projects that differ
only in the case or depth of their remote's path now tie at AT-7. The product that holds two such Projects merges them
in its own store (D5) and reports the tie until then (DEC-0076 item 5). Sessions that a product attributed before can be
refused after it adopts: a worktree or clone under a temporary root or right under home, and a repository root whose
Projects sit deeper. Per-Project numbers move with the Projects: the activity summary cells keyed by `project.id`
([activity](activity.md)) and a service's usage `byProject` (FAC-SEM-025). A refused or tied session carries no
`project.id`; events recorded before adoption keep their old ids until the product merges its Projects (D5).

## Who adopts it

Every product shows its own text for each refusal reason (`transient`, `tombstoned`, `container`, `tool`) and for a tie,
naming the rule and the Projects; the reasons are the schema's.

- **Fabric** (CO-331, CO-329) runs the vectors in its gate. Owed: a tombstone that covers subfolders (today an exact
  path, so it fails "AT-2: a subfolder of a tombstoned folder") and that does not refuse an attach by worktree; the
  temporary (AT-4) and tool (AT-11) refusals; the owner and work rows (AT-10, AT-12); each folder's `toplevel`, the
  nearest place and the main checkout's Project (AT-6 to AT-9); the main checkout from `git worktree list --porcelain`,
  so a bare repository, a submodule and a separate Git dir are read alike (today it takes the common dir's parent); the
  repository identity folding the whole path's case, read from the raw remote (a stored `remote_key` is not a URL:
  re-read the remote, or keep the raw URL beside the key); not attributing when its Git probe times out; a worktree or
  clone at home, an ancestor of home, a declared container or right under home refused (AT-5), where today its worktree
  match comes first; a home kept under Git passed as `git: null`; recording by `explainFolder`'s `record`; its container
  message naming the ancestors of home; its scenarios that show attribution (SCN-033's detach and undo) updated in the
  adoption change. Its plain folder as its own Project (`8bdad97c`) and its subfolder start at the
  Git top level (`f7c71cba`, CO-331, ADR-0166) already match. Projects it stored at a subfolder before `f7c71cba` make
  their repository a container (AT-9, AT-14) until they are moved to the top level.
- **Fabric Switchboard** (SB-141) runs the vectors in `./scripts/check.sh`; at a session's start it asks Fabric's
  capability (D4 as corrected), applying the vectors itself only while Fabric is not running. Owed: a plain folder as its own Project;
  group paths of three or more segments; the ancestors of home refused, and a folder right under home refused unless a
  Project lists it; the nearest of nested Project folders and their ties (AT-3), and by place for worktrees and clones
  (AT-6 to AT-9); its `dismissed` rows read as tombstones (a `gone` row, a folder that vanished, is no tombstone: a
  re-clone at the path is new); its work path (`record_worked`) feeding the snapshot's `work` records through
  `attributeFolder` rather than recording a repository itself, and its `shared` and contested states replaced by the
  tie it reports; a worktree right under home refused at attach as at creation; recording by `record`; its CLI text on
  containers and its scenarios (SCN-055, SCN-063) updated with them.
- **Project Observatory** (the engine) runs the vectors in its scan and in its local answer while Fabric is not
  running; at a session's start it asks Fabric's capability (D4 as corrected) rather than serving one. Measured against
  the table: it has no work row (AT-12) and reads owners only indirectly (AT-10); it scans only the children of its data
  root, so a subfolder start is not rooted at the repository (AT-15) and a remoteless worktree joins only on its tip
  (AT-6); its `folder_exclusions.json` and `_*` folders become the snapshot's `containers` (the folder that holds agent
  worktrees among them; its names and prefixes expanded to the matching paths under its data root), its
  `denied_links.json` becomes tombstones (AT-2, AT-13), and no rule of its own stays beside the vectors; recording by
  `record`; plain folders, group paths, any host, the identity's case, temporary roots (AT-4) and ties.
- **fabric-workspace** names this page from the knowledge page that owns the cross-product fact.

The board row is CT-57.

## Not decided here

- How Fabric records an alias and its evidence (D3 as corrected), the wire of Fabric's session-start capability and
  its refusals (D4 as corrected), and storage (D5).
- How a product learns the work records: Switchboard reads them from coding agents' transcripts (SB-131, SB-132).
- Folders on network shares and case-insensitive file systems beyond the product resolving the real path.
- Hosts that serve one repository under two URL shapes (Azure DevOps: `dev.azure.com/org/proj/_git/repo` and
  `ssh.dev.azure.com/v3/org/proj/repo`): today they are two identities, and the owner of the first reads as
  `org/proj/_git`.
- One store of tombstones and containers. Until every product asks Fabric's capability (D4), each reads its own (Fabric's
  detach, Switchboard's dismissed rows, Observatory's `denied_links.json` and `folder_exclusions.json`), so one folder can
  still answer differently in two products; Fabric and Switchboard read Observatory's declared containers where they
  can reach them.
- Decided limits, not open questions: an origin that is a local path has no identity, so such a clone joins by work or
  as a new Project; an unknown bare repository's Project starts at the bare folder, and each product names it.
- A state for "not attributable yet" (the Git probe failed): the function is never called then, and Fabric's
  session-start capability (D4) names it.
- A user-facing scenario: the contract has no interface here; each product's scenarios own how a session's Project,
  a tie or a refusal is shown.
