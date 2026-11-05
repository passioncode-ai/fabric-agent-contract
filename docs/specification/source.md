# Agent source: `fabric-source/1`

DEC-0149 · rule codes `FAC-SEM-156`…`FAC-SEM-160` · schema
[`fabric-source`](../../schemas/fabric-source.schema.json) · code [`src/source-rules.ts`](../../src/source-rules.ts) ·
vectors [`fixtures/vectors/source-tree.json`](../../fixtures/vectors/source-tree.json)

An agent's **source** is what can be handed to someone else: its code, skills, prompts, schemas, tests and the
documents it ships. Its **instance** is what belongs to one installation: its records, logs and keys, the names of the
people and clients it works for, private paths and its configuration. The source manifest, `fabric.source.json` at
the root of the agent's source repository, says which files are source and which slots an installation fills, so an
agent can be handed over as source without its instance.

Sources: the research report [agent portability](../reports/2026-10-27-agent-portability/README.md) (its options §5
and questions §6), and the board threads `21ac4057` and `0a8776f2`, where the options stood for objections until
2026-11-03 18:00 UTC and none was posted.

## Who it applies to

Every kind of agent: a serving agent, a consumer agent and a skill set. A repository with a `fabric.source.json` is held
to this page; one without is not. The Fabric Agent Adapter's templates are to write one for every new agent (owed by
CT-207); requiring it of every agent is a later decision (DEC-0149 item 3).

The manifest is the author's file and travels with the source. It is not a member of `fabric-agent.json` (whose top
level is closed, and which a consumer agent does not have), not a member of `fabric.package.json` (written at pack
time, after the source is known), though a package may carry the file ([the package](#the-package)), and never the
[descriptor](service.md#descriptor), which describes an installation.

## The source manifest

`schemas/fabric-source.schema.json`, closed: a member it does not name is refused. No member holds a value an
installation fills.

| Member | Required | What it says |
|---|---|---|
| `format` | yes | `fabric-source/1` |
| `include` | yes | the source, at least one path; a file inside no `include` path is not source |
| `exclude` | no | holes in `include`: a file inside one of these paths is not source |
| `binaries` | no | the binary files that are source (an icon, a font), each a file inside the source |
| `unchecked` | no | source paths that travel with the source and that the tree check does not read, at most 64, each `{path, reason}` (a file or a folder, the reason 1 to 200 characters): synthetic test vectors, a licence whose copyright line names a holder on the operator's list ([unchecked paths](#unchecked-paths)) |
| `publicAddresses` | no | e-mail addresses the source may carry, such as a support address; at most 32 |
| `slots` | no | what an installation fills, by name ([slots](#slots)) |
| `description` | no | what the agent is, at most 200 characters |

### Paths

A path is the package's path grammar (`fabric-package.schema.json#/$defs/path`), plus a trailing `/` for a folder in
`include` and `exclude`: relative (a leading `/` or `~` is refused), forward slashes, no `.` or
`..` segment, no drive, no control character, no `:`. In `include` and `exclude` a path that ends in `/` names a folder
and everything under it; any other path names one file. There are no globs. An entry outside the grammar (over 256
code points, or with a `\`, a `//` or a `:`) is a schema problem and names, reaches and removes nothing. A file whose
own path is outside the grammar is not source: it is never read and never exported, and no line names it. A `binaries`
path names a file only; a
store slot's `path` is written without a trailing slash and names the file or folder the agent keeps its store in.

- **Default deny.** Only what `include` names is source; `exclude` carves holes in it. A file outside `include` is
  simply not source: it is not a finding, and a source export does not carry it.
- **`.git` is never source**, whatever the lists say: a path with a `.git` segment is not source, and listing one is
  `FAC-SEM-157`.
- **The manifest is source**: `fabric.source.json` travels with the source whatever `include` says.

`isSourcePath(manifest, path)` in `src/source-rules.ts` is the reference reading.

### Unchecked paths

`unchecked` names source that travels with the source and that the tree check does not read: each entry's `path` is a
file of the source or a folder in it (`FAC-SEM-157`, which also refuses one listed twice), and its `reason` says why in
plain words. A file under an `unchecked` path is read by its path only: a home folder, an installation string or a
credential file by its name in that path is still a finding (a credential file is never source, unchecked or not), and
its content is never read, so it holds no line finding, no `binary` finding and no warning. It still counts as present
for `missing` and `no-license`.

The Fabric Agent Adapter retires its `.fabric-source-ignore` when it adopts this decision (CT-207), each entry mapped
as follows: a path of plain source goes to `unchecked` with its reason; a file that is a credential by its name goes to
`exclude` or out of the tree into the instance, never to `unchecked`; a glob line becomes the explicit paths it matched
or a folder entry; a nested repository goes to `exclude` and is checked in its own tree under its own manifest.
`isUncheckedPath(manifest, path)` is the reference reading.

## Slots

Each slot is `{name, kind, purpose, optional?, path?}`. `name` is the package's slot grammar
(`^[A-Z][A-Z0-9_]{0,63}$`), `purpose` says in plain words what it is for (1 to 200 characters), `optional` says the
agent starts and works without it.

| `kind` | What it names | `path` |
|---|---|---|
| `secret` | a key the agent reads by name | none |
| `config` | a non-secret setting: a repository URL, a folder, a supervisor label, the operator's or the publisher's identity | none |
| `store` | a data store, relative to the agent's data folder | required, in the package grammar without a trailing slash: the file or folder the agent keeps its store in |
| `endpoint` | the operator's infrastructure by role: a knowledge base, an analytics service, a board | none |

The schema gives a store slot its `path` and refuses one on any other kind. `FAC-SEM-156` refuses a slot named twice,
a name or purpose shaped like a credential (read both as `FAC-SEM-065` reads a package secret's, the shared detector's
`secretValue`, whole-value `Bearer` included, so a slot's purpose packs cleanly, and as the tree check reads a line, so
whatever `FAC-SEM-158` blocks in `fabric.source.json` this blocks too; once the shared detector's key shapes are bounded
(DEC-0151, in progress), `FAC-SEM-156` is stricter than `FAC-SEM-065`, because it keeps the tree check's unbounded shapes and
the adapter's check reads the manifest as part of the tree), a manifest `description` shaped like
one (read as prose: a provider key as the tree check reads one in a line, its own shapes `KEY_SHAPE_SOURCES` starting a
word and holding no synthetic word, a JWT (with no synthetic-word exception), a long run, or a bearer token inside the text, 12 or more token characters
with a digit, never a whole-value `Bearer` branch, so "Bearer token for the board API" and "desk-booking-service-api"
are prose there; the description and the tree check agree whatever the shared detector's key shapes become)
(at `/description`) and a store path declared twice. A message
of `FAC-SEM-156` or `FAC-SEM-160` names a slot, a secret or a path that holds what the tree check reports (a
credential, a home folder with a name, an e-mail address) by its place (`slots[<index>]`, `slots[<index>].path`,
`secrets[<index>]`, `state[<index>]`), never by its value.

## Installation strings

The operator's own strings (accounts, people, the operator's label, private projects, hosts, chat ids) live on the
operator's machine, outside the source tree, as plain text. They are never in the source and never exported: carrying them would
publish exactly what the check exists to keep home. Keyed digests are not used, because a substring and an encoded
form would need their own tokenization rules.

The contract ships the reference check with the list as an input (`instanceStrings`). Where a tool keeps the list is
the tool's: the adapter's check (`v0.58.0`) reads `--instance-strings FILE`, then the file `FABRIC_INSTANCE_STRINGS`
names, then its configuration folder. `pnpm validate <dir> --kind source-tree` reads no such list (see [the checker](#the-checker)); a
source-tree JSON document passed as a file (`pnpm validate <file> --kind source-tree`) is checked with the
`instanceStrings` it carries.

## The tree check

`checkSourceTree` (kind `source-tree`) reads `{manifest, files: [{path, text?, binary?, nestedRepository?, link?}],
instanceStrings?}`; `nestedRepository: true` marks a folder that holds another repository (a submodule's gitlink, a
folder holding its own `.git`), read by its path only; `link: true` marks a symbolic link, its target as `text`, read with
`link-outside`'s rule and never a licence.
`sourceTreeProblems` gives the same answer as structured problems, which the vectors pin. The caller restricts `files`
to the source; the check also ignores any file that `isSourcePath` does not read as source. A file whose `binary` is
`true` has no text read, and a file under an `unchecked` path is read by its path only.

| Kind | Code | Finding |
|---|---|---|
| `home-path` | `FAC-SEM-158` | a line, or a file's path, holding a home folder with a name ([home folders](#home-folders)) |
| `credential` | `FAC-SEM-158` | a line, or a file's path, holding a credential in the forms the Fabric Agent Adapter's check reads (`fabric_source_check.py` `_secret_in`, `v0.58.0`), listed here: a private key block (`-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----`: PEM, OpenSSH, PGP); a JWK's private `d` of 43 or more base64url characters (JSON, escaped JSON, a Python dict); a JWT; a provider key (the tree check's own shapes, `KEY_SHAPE_SOURCES`, unbounded and with no whole-value `Bearer` branch, kept apart from the shared detector's for parity with the adapter's check and carried in the vectors' `constants` block, matched without regard to ASCII case only, so `ſk-` and a Kelvin sign are not `sk-` or `K`) with no letter or digit of any script before it, read at every start so a synthetic key's run never hides a real key that starts inside it; a bearer token inside a line; an absolute URL (ended by Python's white space: U+001C to U+001F and U+0085 end it, U+FEFF does not) with a password of 8 or more characters mixing letters and digits, or a query or fragment value that, percent-decoded (a byte sequence that is not UTF-8 decoded to U+FFFD, as Python's `unquote`), is a provider key, a JWT, a value the URL rule's own pattern reads (`URL_SECRET_VALUE`: a whole-value `bearer` branch, then the same key shapes, also in the `constants` block), or a long run under a name that can only carry a credential (an inner URL in a parameter read the same way, two levels deep, when the parameter starts with a scheme); a long run mixing upper case, lower case and digits, percent-decoded, assigned to a name that can only carry a credential (an integrity hash is not). A value whose token holds one of the adapter's synthetic words (`SYNTHETIC`: `example`, `not-a-key`, `notakey`, `fake`, `dummy`, `placeholder`, `redacted`, without regard to case) is not a finding, but a private key block always is; a whole Ed25519 signature (86 base64url characters) under a quoted `sig`, `signature` or `signatures` member is public, with or without its closing quote; a line holding a JSON escape of `&`, `=` or `/` is read again unescaped when it shows nothing as written. Or a file that is a credential by its name: `.env` and `.env.*` but `.env.example`, `.env.sample` and `.env.template`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`, `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`, `.npmrc`, `.netrc`, `.pypirc`, `*.token` and `*.credential` (a project `.npmrc` that holds no credential too: it blocks an export until `exclude` names it or it leaves the tree) |
| `binary` | `FAC-SEM-158` | a file the caller marks `binary: true` that `binaries` does not list (Q12) |
| `nested-repository` | `FAC-SEM-158` | a nested repository in the source (a submodule's gitlink in Git mode, a folder holding its own `.git` in a walk): a source export would carry it as a link to another repository, or not at all. `exclude` names it to leave it out, and its own tree is checked as its own source; a `.gitmodules` file in the source is ordinary text |
| `instance-string` | `FAC-SEM-158` | an entry of `instanceStrings` found in a line or a path without regard to case (Unicode simple case folding; the adapter's full `casefold` also matches `straße` with `STRASSE`, a known difference CT-207 records), the entry and the text each also in Unicode NFC: as written, percent-encoded (`encodeURIComponent`), form-encoded (`+` for a space), JSON-escaped, JSON-escaped with `\/` for `/`, or JSON-escaped with every character outside ASCII as `\uXXXX` |
| `missing` | `FAC-SEM-158` | an `include` path, file or folder, with no source file in `files` (a nested repository is no source file: an `include` path naming only one is also `missing`) |
| `short-instance-string` | `FAC-SEM-158` | an entry of `instanceStrings` that is not a well-formed string (no lone surrogate) of at least 3 characters: refused as input, not looked for |
| `no-include` | `FAC-SEM-158` | a manifest with no `include` path |
| `email` | `FAC-SEM-159` | an address matching the e-mail pattern of `src/node-summary.ts` with its local part bounded to 64 characters, read from each `@`, not in `publicAddresses` (compared without regard to case), not at an RFC 2606 name (`example.com`, `example.org`, `example.net` and names under them, or a domain ending `.invalid`, `.test` or `.example`), not followed by `:` (an SSH remote, `git@host:owner/repo`), not ending in an image's extension (`png`, `jpg`, `jpeg`, `gif`, `svg`, `webp`, `ico`: `user@2x.png` is an asset's name) and not inside a URL the `credential` kind reports, as written or once the line's JSON escapes are undone |
| `link-outside` | `FAC-SEM-159` | in a Markdown file (`.md`, `.mdx`, `.markdown`), a relative link `](target)` (a target and a title hold no `]`, and at most 2048 characters each) (no scheme, not `#…`, not `//…`) whose target, resolved against the file's folder (from the root when it starts with `/`, without its `#` or `?` part), is above the root or is neither a source path nor a folder holding a source file; and a symbolic link in the source whose target (its text) is absolute, climbs above the root or is no source path, resolved literally against the link's folder (split on `/`, `#` and `?` kept as path characters, nothing percent-decoded), the root and a folder holding source being inside; said at line 1, column 1, after line 1's other findings in this table's order and once per line (a link whose target holds a Markdown link outside gets one) |
| `no-license` | `FAC-SEM-159` | no source file at the root named `LICENSE`, `LICENCE` or `COPYING`, with an extension or none, in any letter case; a licence that is a symbolic link does not count, since a source export carries the link, not the terms, an `unchecked` link included (it is passed as a link with no text) |

The blocking kinds are `FAC-SEM-158`: a source export refuses on any of them. The warnings are `FAC-SEM-159`,
`accepted`: a note beside the result, never a failure. The contract chooses no licence for an exported agent: a source
export carries the licence files the source has, and `no-license` says when it has none.

An identifier the tree check reads as a `credential` (for example a weak `sk-` project alias, DEC-0151 (in progress))
is renamed, or its file is listed under `unchecked`, which loses that file's check; the alias rule is the operator's
open question in DEC-0151.

A finding never carries the text it found. `instancePath` names the file (`/files/<index>`, or `/files/<index>/path`
for a finding in its path), the tree as a whole (`/files`, for `no-license`), the manifest's path
(`/manifest/include/<index>`, for `missing`), the manifest's `include` itself (`/manifest/include`, for `no-include`)
or the list's entry (`/instanceStrings/<index>`, for `short-instance-string`). The message names the file's path, the line and column and the kind, and for an
instance string the entry's index in the operator's list; a file whose own path holds a finding is named
`files[<index>]`. A finding in a file's own path has no line and no column. A line counts from 1, split at LF with a
trailing CR dropped, as the adapter reads it (a lone CR does not end a line); a column counts from 1 in UTF-16 code units where the match begins (for a home folder, where its name begins; for
an instance string found only in the line's NFC form, its index there; for a credential found only once the line's JSON
escapes are undone, where its first character is written). On each line the kinds come in the order of the table, one
finding per kind (an instance string: one per entry); a file's path comes before its lines; `missing` and `no-license`
come last, the list's refused entries and `no-include` first. That order is the check's result; the
[checker](#the-checker) prints the blocking findings before the warnings.

### Home folders

A home folder is a finding when it carries a person's name, in the forms the Fabric Agent Adapter's check reads
(`fabric_source_check.py` `HOME_PATHS` and `_home_names`, `v0.58.0`), `SOURCE_HOME_PATHS` in `src/source-rules.ts`:

- `/Users/<name>` with a capital U (`/users/…` is a web route), `/home/<name>` and `/var/home/<name>`;
- Git Bash's `/c/Users/<name>` and WSL's `/mnt/c/Users/<name>`;
- `C:\Users\<name>`, with either separator (a JSON-escaped backslash included) and a drive letter in either case;
- the dashed forms a tool makes of a path (DEC-0105): `-Users-<name>`, `-home-<name>`, `-var-home-<name>`,
  `-mnt-c-Users-<name>`, `-c-Users-<name>` and `C--Users-<name>`, never after a dash (`--home-dir` is a flag);
- the URL-encoded `%2FUsers%2F<name>`, `%2Fhome%2F<name>` and `%5CUsers%5C<name>`.

The name is not a finding when it is one character (`/Users/a`, a placeholder) or one of the neutral names
(`NEUTRAL_HOMES`: placeholders such as `example` and `user`, CI runners, the users of container images and cloud
machines; compared without regard to case), which are kept equal to the adapter's. `~` and `~/…` are never a finding:
a path written relative to the user's home is portable by construction. An operator who wants a neutral-looking name
caught lists it among the [installation strings](#installation-strings); the contract does not implement the adapter's
`home: <name>` declaration, and a tool may add it.

This is narrower than `hasHomePath` (`src/activity-rules.ts`), the scanner for values that must hold no path at all,
which reads `~/` and every name: a portable source holds both.

### The checker

`pnpm --silent validate <dir> --kind source-tree` reads `<dir>/fabric.source.json` (a folder without one is a usage
error), validates it and runs its rules, then lists the folder's files. Given a file named `fabric.source.json`, it
checks that file's folder the same way; a file that is a JSON object with neither a `manifest` nor a `files` member (a source manifest under another name,
whatever its `format`, which is not checked, or any other such object) is a usage error (exit 2) that says to name a
source manifest `fabric.source.json` or pass its folder; any other file is a source-tree document named by its basename, never by its path.

- **Which `git`.** Only a `git` (`git.exe` on Windows, never a `.cmd` or `.bat`) found in an absolute folder of PATH,
  never the current folder, an empty or a relative PATH element; with PATH unset, POSIX's `/bin` and `/usr/bin`, and on
  Windows none (the adapter's `_git()`). No `git` found is a walk with no note.
- **Git mode.** In a Git work tree it reads what Git would commit: tracked files and untracked ones not ignored
  (`git -c core.fsmonitor= ls-files -z --cached --others --exclude-standard` run in the folder, with the variables that
  point Git elsewhere removed: the adapter's `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`,
  `GIT_COMMON_DIR`, `GIT_ALTERNATE_OBJECT_DIRECTORIES`, `GIT_NAMESPACE` and `GIT_PREFIX`, and also `GIT_CONFIG*`;
  `GIT_CEILING_DIRECTORIES` is kept, as the adapter keeps it, since it is the caller's fence), as they are in the
  work tree. Only a listed path that is source, or a
  nested repository in the source, is looked at; a path outside the source is never reached. A path under a symbolic
  link is never read;
  a tracked file deleted from the work tree, or under a path that is now a file, is not in it; a path it cannot reach
  for another reason is a usage error naming its path in the folder, or, when that path holds a finding as the tree
  check reads one in a path (a credential, a home folder with a name, a credential file by its name) or an e-mail
  address (no finding in a path, never printed), the folder it is under (`<a path that may hold a finding, under
  src/>`, `<a path whose name holds an e-mail address, under src/>`); a name Git lists that is not UTF-8 is a usage error
  naming its position in Git's list, never the name, only when its leading folders that decode lie in the source as a
  whole: an `include` folder is that folder or holds it, and no `exclude` folder is it or holds it (`src/<bytes>.txt`
  under an `include` of `src/`); any other such name is outside the source and skipped, even one under a folder an
  `include` only reaches into (`src/<bytes>/x.ts` under `src/a/`). A listed path that is a folder on disk is a nested
  repository only when Git listed it with a trailing `/` (an untracked repository), the index records it as a gitlink
  (mode 160000, read by a separate `git ls-files -z --stage`, so an untracked name is never read as an index entry), or
  it holds its own `.git`; otherwise it is a tracked path no longer in the work tree (a file replaced by a folder), and
  Git lists the untracked files under it, which are read. A path the index records as a gitlink is a nested
  repository whatever sits at it or above it now (a folder, a file, a link, or nothing): the index decides, and
  nothing is read. A listed path that is no source path is
  stated only when it may be nested. `fabric.source.json` is read whenever it is a regular file, even when
  `.gitignore` lists it: the manifest is source whatever `include` says. An `include` path Git ignores, beside
  others it lists, reads as `missing`: a source export reads the committed tree, where it is absent too. A staged change that differs from the work tree, or anything
  not yet committed, can still differ from what a source export reads, which is the committed tree at a named commit.
- **Walk mode.** When Git refuses the folder, ignores it (`git check-ignore -q .`), lists no file under any `include`
  path (a file under one, or a nested repository in the source, keeps Git mode), fails its second call (`ls-files
  --stage`, which lists the gitlinks) as it fails its first, does not answer within 60 seconds (a
  `.gitignore` that is a FIFO stalls Git until then, and the run then walks with a note) or
  could not run (the note gives the error's code only, such as `ENOBUFS`), and when no `git` is found, it walks the folder: never into `.git`, into a folder (a dot-folder and
  `node_modules` included) only when an `include` path reaches into it (names it, with or without its trailing `/`, or
  something in it) or covers it, never into a folder outside the path grammar, never into a folder an `exclude` folder
  is or holds unless an `include` path lies under it (so an unreadable excluded folder is no usage error); it reads
  names as bytes, and a name that is not UTF-8 gets Git mode's rule: a usage error naming its folder and no part of the
  name (`cannot read a name in src/: it is not UTF-8`) when that folder lies in the source, otherwise skipped; a folder
  holding its own `.git` a nested
  repository. When Git was there and did not list the folder, a `note/walk` line says why, naming no folder. In Git
  mode a listed path outside the grammar is dropped before any look at the file system, so neither mode reads it or
  stops on it. In Git mode a path Git cannot list (an untracked folder Git cannot open) is not seen, as a source export
  would not see it; only walk mode reports an unreadable folder as exit 2 (a tracked file Git lists that the checker
  cannot reach is a usage error in either mode).

A source check prints no instance data in a schema or parse message. A source check is any run with a `source-` kind
(`--kind source-tree`, on a folder or a document, `--kind source-manifest`, `--kind source-package`), any document
checked against `fabric-source.schema.json` (named with `--schema` or inferred), and any file named
`fabric.source.json` whatever schema reads it. A document whose closest schema is `fabric-source.schema.json` but that
the checker cannot tell (one missing `include`, any name) is a source check for its name: its usage line names it by its
basename. Whatever schema or rule speaks in such a run, every path relative to the
checked folder and every file named outside a folder run passes the place mark below, and every message the masks; a
file named outside a folder run is named by its basename (or its place when the name holds a finding), in its usage
errors too; a folder run with another source kind prints the folder as the ordinary validator does, resolved to an absolute path: a parse error gives its line and column only, found by reading the text again; a schema
error's message is built from its keyword and the schema's own values (allowed values, a pattern, a limit, the names of
members the schema defines), so an extra member reads "has a member the schema does not define" without its name, and a
bad member name is reported at its object; no hint of any kind is printed. A document given with `--kind source-tree`
is named by its basename, or by its place (`<a path that may hold a finding, under .>`, or `... an e-mail address,
under .>`) when the name holds a finding or an address, and its tree's files are labelled as in a folder: a file whose path holds a finding, or an e-mail address
(which is no finding in a path and never printed), is `files[<index>]`. Only `--kind source-tree` hides the checked
folder; a folder run with another source kind or schema prints paths as the ordinary validator does. As a second line
of defence, each value of a
message that the tree check would report (a credential, a home folder, an e-mail address read as the tree check reads
one: not at an RFC 2606 name, not an image's name, not in a reported URL) is named by its place (`<a
value the tree check reads as the instance's, at /path>`), and so is a member name in a problem's path (`<a member
whose name holds a finding>`). A symbolic link is read as the path it names and never followed. It
keeps the source paths, reads an `unchecked` file
by its path only, marks a file binary when its first 8 KiB hold a NUL byte (reading only those bytes, so a large binary is never read
whole), reads text as UTF-8 and reports each
finding on the file it names. A manifest that fails its schema is reported alone: its rules and the tree check run once
it validates. Exit 0: no blocking finding; 1: a blocking finding or a problem in the manifest; 2: a usage error (no `fabric.source.json`, a
source check's named target that is not there, named by its basename such as `cannot read gone.json: ENOENT`, a file
or folder it cannot read, a name Git lists that is not UTF-8 under a folder an `include` path reaches, a file under
`--kind source-tree` that is a JSON object with neither a `manifest` nor a `files` member; a JSON value that is no
object stays a schema finding, `FAC-SEM-000`, exit 1). A usage error names the
checked folder itself as `.`, and tells a folder or manifest it cannot read (`cannot read .: EACCES`, `cannot read
fabric.source.json: EACCES`) from a folder that holds no manifest; a manifest that is not a regular file (a FIFO, a
socket, a device) or that is a symbolic link, a dangling one included, is never opened or read through (`cannot read
fabric.source.json: not a file`; `lstat` is asked first, and only an absent entry is "the folder holds none"; the folder of a
named `fabric.source.json` that does not resolve to a directory, links followed, such as an absent one or a dangling
link, is `cannot read .: ENOENT`, while a link to a real folder that holds no manifest holds none, named directly or
through its manifest's name; a folder named directly that is absent keeps its basename, `cannot read gone: ENOENT`,
and a dangling link named directly reads "not a file"), and neither is any source document
named on its own that is not one. A FIFO, a socket or a device under a source path is not a source file, in Git mode and
in a walk alike, and is never opened; an `include` path naming only such a file reads as `missing`. A source check that
throws anyway (a fault in the checker) ends in a usage error naming the file, or the folder as `.`, and the error's name
only (`cannot check .: RangeError`), so `--json` always prints one document. A folder run under `--kind source-package` or `--kind source-manifest` lists the folder
as the ordinary validator does, and refuses a manifest that is not a regular file (a symbolic link, a FIFO) with that
usage error, exit 2 (a source route asks `lstat` whether its target is there, so a dangling link reads "not a file",
never as absent; a `fabric.source.json` named under `--kind source-tree` is routed to its folder unless `lstat` finds a
real folder there, so a link to a folder reads "not a file", and a manifest whose folder is absent reads `cannot read .:
ENOENT`); a plain folder run, which may walk many agents, skips such a manifest with a note and checks the
rest. A document named on its own and recognised as a source manifest only by its content is read as the ordinary
validator reads a named file: its schema is known only after the read. Outside a source check a
target that is not there, or one it cannot read, is named by its path, as the ordinary validator names it, and a named
file that is not a regular file is read as before.

Nothing the checker itself prints names the checked folder or repeats a value found (`pnpm` without `--silent`
echoes the command line it runs, the folder included, before the checker's output): a file is named by its path relative to the
folder, or as `files[<index>]` when a finding or an e-mail address is in that path (a provider key in the tree check's
own shapes is read anywhere in it, after a letter too, as in `src/xsk-…`; a long run mixing cases and
digits is read in each segment between `/` on its own, so a path of ordinary names such as
`packages/CoreLib2/src/Components/Button3/Index.tsx` is named by its path, while a name printed on its own in a usage
error still hides a run that crosses a `/` from its first part; an address in a path is no finding
and is never printed; it is read as in a line, so an RFC 2606 address and an image's name such as `user@2x.png` are
none, except that an address followed by `:` is still an address, since the path grammar has no `:`), the manifest as `fabric.source.json`, the folder itself
as `.`, in its problems, notes, usage errors and `--json` output alike. `files[<index>]` counts from 0 the files the
checker read and handed to the tree check (the source files, `fabric.source.json` among them, `unchecked` files and
nested repositories in the source; a nested repository outside the source takes no index, in either mode), in the UTF-16 code-unit order of their paths, in Git mode and in a walk alike
(`a-b/k.ts` comes before `a/k.ts`, since `-` sorts before `/`); the checker prints nothing more about that list. It reads no list of installation strings: that
part of the check runs in the operator's own tool, with the operator's list.

`pnpm validate <dir>` checks a folder holding `fabric.source.json` beside `fabric.package.json` as a pair
(`FAC-SEM-160`, [the package](#the-package)); that run is the ordinary validator's and prints as it does, the folder's
path included.

## The package

A [package](package.md#secrets)'s `secrets[]` are the source's `secret` slots, by name and `optional`, always; its
`state[]` paths are the source's `store` slots' paths when `state[]` holds any entry, each compared as a set
(`FAC-SEM-160`, kind `source-package`, `{source, package}`). Its findings' JSON pointers address that pair
(`/package/secrets`, `/package/secrets/<i>/name`, `/package/state/<i>/path`), not `fabric.source.json` on its own,
though a folder run lists them under the manifest's file. An absent or empty `state[]` is a copy packed without state
([a colleague's copy](package.md#state)) and passes. A packer writes them from the source manifest (the adapter's
`pack` is to, CT-207), copying each `secret` slot's purpose unchanged, which `FAC-SEM-156` has read as `FAC-SEM-065`
reads it.

A package may carry `fabric.source.json` as an ordinary file, listed in `files[]` like any other: a packer that packs
in place lists it and reads it for `secrets[]` and `state[]`. `pnpm validate <dir>` pairs a source manifest with a
package only when both sit in the same folder, and checks them as the pair (`FAC-SEM-160`) whatever the manifest's
schema answer, as the validator's other pairs do. It pairs only a package it can read, and tests the entry beside the manifest with
`lstat`: any `fabric.package.json` entry there that was not read as a package (skipped, unreadable, a symbolic link, a
dangling link, not a regular file) prints "the fabric.package.json beside fabric.source.json was not read as a package,
so no pair was checked (FAC-SEM-160)", in a plain folder run and under `--kind source-package` alike. Under `--kind
source-package` the run's exit code follows the entry: a FIFO is skipped with a note (exit 0 with the notes); a
symbolic link or a dangling link is refused by the read as not a file (exit 2); a file that does not parse is a
problem (exit 1); an unreadable file is a usage error naming it by its path in the folder (exit 2). A source kind's run
never reads a package through a link; a plain run follows one, as the ordinary validator does. `--kind source-package` on
a folder checks that same pair too, and a folder with no `fabric.package.json` entry beside its manifest (`lstat`
answers it is absent) prints "the folder
holds no fabric.package.json beside fabric.source.json, so no pair was checked (FAC-SEM-160)". A document, or another
file of a folder, that holds no `{source, package}` prints a note that no pair was checked. Under `--kind
source-package`, exit 0 with such a note does not mean a pair passed: none was checked. `--kind source-tree` takes one
target; under `--kind source-package` a folder is the only target of its run, and documents may be several. A second
target where one is allowed is a usage error (exit 2). A Git source root is not
packed in place, so the usual route to that check is the package folder's own copy of `fabric.source.json` (CT-207).

## Source export

A source export is a local act: it publishes nothing and is always allowed.

1. It reads a committed tree at a named commit, never the working copy, and takes only the source paths; a gitlink (a
   submodule) is never exported, and the check refuses one in the source (`nested-repository`).
2. It runs the tree check with the operator's list and refuses on any blocking finding.
3. It writes a directory holding a new Git repository with exactly one commit and no history: author and committer
   `Fabric source export <source-export@fabric.invalid>`, the commit date the source commit's committer date, the
   message `Source export`. The copy carries no link to the original.
4. It rewrites no file. Cleanup happens at the source, which is then exported again; so the source's identity fields
   name the publisher, never a person or the operator's account (`provider.createdBy`, `provider.identity.subject`).
5. It writes a receipt in the instance, never in the source: the source commit, the manifest's SHA-256, the counts of
   findings by kind and the new commit's id; never a value it found.

A source export does not run the source's tests and does not refuse on them (DEC-0149 item 11, Q9); a tool may offer
a test run of the exported tree beside it. There is no reference export in this repository: the adapter's `export`,
owed by CT-207, is to be it, and the tree check is the contract's part.

## Handing over

Handing a source export to anyone (creating a repository, pushing, sending a file, changing its visibility) is an act of
effect class `publish` (`schemas/common.schema.json`), and a person's act each time, which no standing grant authorises
([external effects](governance-and-roles.md#external-effects)). The hand-over action declares the gate `relayed`
([actions](service.md#actions), DEC-0121).

**The rule.** A hand-over is taken only on the operator's word naming the agent, the source commit and the recipient.
It is one synchronous call, never a job, so a job's step and [MJ-1](delegation.md#the-operators-mandate) do not reach
it; CT-181 may add a job form later. The one period this section specifies runs until a service pins a contract
revision carrying CT-181. In it the word comes from a T0 or T1 caller ([DL-25](delegation.md#trust-tiers)) in one of
two forms, and in no other:

- a valid decision (DEC-0121 AP-2) whose `target` is the one exact string below; or
- the service's own elicitation in the call's form: an MCP `elicitation/create` sent within the hand-over's `tools/call`,
  in form mode, under [C3.3](interop.md#c33-awaiting-a-choice)'s form constraints (`FAC-SEM-018`), never
  `input_required` on a Task or a job, answered by a person and accepted, whose message names the agent, the source
  commit and the recipient. A client that cannot show an elicitation to a person (an SDK handler, a headless session)
  cancels a hand-over elicitation (MCP's dismissal, no choice made) or did not declare the elicitation capability for
  its session (MCP negotiates capabilities per session at `initialize`, [MCP `2026-07-28`](../evidence/sources.md)), and never accepts or declines it (a decline is a person's no only); its outcome is
  `handover-needs-operator`, after which a decision with the exact target may follow in the same task. The service
  records the message it sent and the accept as the operator's word (the record of
  [OA-6](delegation.md#one-approval-binds-all-the-operators-agents)).

Everything else, except an invalid decision (below), is refused `operator-decision-required`: no word, a mandate (which
counts as nothing, [MD-6](delegation.md#the-operators-mandate)), an `approval/1`, a cancelled or unanswered elicitation,
a person's decline (with its own detail, below), anything else. CT-181 defines the approval route (the approver id, the action digest, spending, tiers); until a service pins a
contract revision carrying it, an `approval/1` is not read for a hand-over. A caller that presents a delegation token
reaches the action only under a grant covering `publish`, which is never its authority; a T0 or T1 caller without a
token needs none ([DL-26](delegation.md#trust-tiers)).

- **The target.** The hand-over action's arguments carry the agent's id and the recipient in the form the target
  uses, beside the commit, so a caller builds the exact target from its own arguments. The required `target` is
  `<agent>@<commit>-><recipient>`: the agent's id is its package's `id` (a
  kebab-case name of at most 64 characters; a source not yet packed uses the `id` its package will carry), the commit
  the full source commit, the recipient as the action names it. When that string exceeds the decision schema's 200
  characters, the `target` is `sha256:` and the lowercase hex SHA-256 of its UTF-8 bytes; the action computes the same
  string and compares it exactly. Naming the three in `instruction` is the relaying agent's duty under AP-3, and nothing
  checks it.
- **An invalid decision** from a T0 or T1 caller is refused `decision-invalid`, and the operator is never elicited for
  that call; the refusal carries exactly one `error.data.detail`, the first that applies in this order: (a) a fault AP-2 finds itself (an `at` out of its window, another action's id, a
  schema fault): `decision-ap2`, since AP-2 names no detail of its own; (b) no `target`: `decision-without-target`;
  (c) a `target` other than the exact string: `decision-target-unbound`; (d) a decision already consumed:
  `decision-consumed`. A `decision-consumed` refusal means an effect may have begun under that word: the session
  reports the outcome as unknown and never asks the operator for a new word for the same act.
- **No word.** A T0 or T1 caller with neither form and no decision gets `operator-decision-required` with the detail
  `handover-needs-operator`; a service that can elicit from that caller's client asks the operator instead, once per
  call; a cancelled or unanswered elicitation (a client that cannot show it to a person cancels it) is refused the same
  way (`handover-needs-operator`) and not asked again within that call, and a decision with the exact target may follow
  in the same task. A person who declines gives the operator's no, refused `operator-decision-required` with its own
  detail, `handover-declined`: the caller does not ask again within this task and reports to the coordinator. A T2 caller gets
  `operator-decision-required` with the detail `handover-needs-estate-route` whatever it carries, and is not asked: its decision is no decision (AP-2), and its remedy is that the operator acts through a T0
  or T1 route. A T2 caller that reaches the action has passed DL-13 with a delegation token (a caller no rule places is
  T2 by default, and one the relay cannot place is refused before the action, [DL-28](delegation.md#trust-tiers),
  [machine calls](machine-calls.md#the-t1-binding-over-the-relay)), so the T2 case has this one code for the word; the
  idempotency lookup still runs first, and its in-flight and conflict answers stand. The action checks these refusals before `mandateCovers`, so a mandate gets this rule's detail rather than
  one of MD-4's. The checks run in this order: for a caller that presents a delegation token, the token and the grant
  check (DL-13, DL-21); then the idempotency lookup; then the word.
- **Consumption.** A word is consumed when the hand-over's effect begins, by one atomic check-and-record, never on a
  refusal or on a failure before any effect; a concurrent call that loses that check is refused `decision-invalid` (`decision-consumed`) and
  has no effect. A decision is consumed under the SHA-256 of its action, `target`, `at` and `instruction`; an elicitation
  under the service's own elicitation record id and the action, never its message, so a second, separately authorised
  hand-over of the same three is a new word. The store of consumed words survives a restart and keeps each for at least
  24 hours plus AP-2's 60 seconds. AP-2's window does not cover a second hand-over, not even of the same commit to the
  same recipient, which takes a new word.
- **Idempotency.** Keys are kept per authenticated caller, and a repeated key's arguments are checked first: the same
  key with other arguments is refused `decision-invalid` (`idempotency-conflict`): resend under a new key, do not ask
  the operator. With the same arguments, a key whose call is still in flight is refused `unknown-state` (detail
  `handover-in-flight`: retry the same key; do not ask the operator), and starts no second elicitation and no second
  effect. A key stores a performed hand-over's result, an `outcome-unknown` (an effect that began and was not observed)
  and a failure observed after the effect began, each kept at least as long as the consumed-word store, its word staying
  consumed; a repeat answers it and consumes nothing. A refusal or a failure before any effect is not stored, so the
  same key admits the intent again once the word arrives.
- **The checker.** `--kind action-call` (`FAC-SEM-142`) cannot tell a hand-over from another action and is not run on a
  hand-over's calls until a service pins a contract revision carrying CT-181, which gives `actionDecision` an input that
  marks the hand-over.

**Departures.** AP-2 and the `actionDecision` table apply to a source hand-over except where this section gives another
answer; every such answer is a departure from DEC-0121's readings, and CT-181 owns bringing each into the reference
gate (an `actionDecision` input that requires `target`, and an MD-6 entry once the hand-over has an action id); until a
service pins it, the action's owner enforces them. The departures:

- a decision without `target` is refused, where AP-2 lets a decision that names no target cover any object;
- the `target`'s form is required, one exact string, and only it is checked, where AP-2 checks only that a named target
  is the object acted on;
- an invalid decision answers one detail in a fixed order, where AP-2 answers `decision-invalid` with none;
- a word is consumed once, when the effect begins, where AP-2's 24-hour window covers repeated calls;
- a mandate is never the authority, where `actionDecision` takes one; a T0 or T1 caller's mandate, valid or not, is
  answered as no word, where MD-3 answers an invalid mandate `decision-invalid` with its detail;
- an `approval/1` is not read, where any approver's is the approver's decision (DL-18);
- a T2 caller is refused `operator-decision-required` (`handover-needs-estate-route`),
  where AP-2 and DL-17 answer it `approval-required`;
- a grant that covers `publish`, needed by a caller that presents a delegation token, lets the call reach the action and
  is never its authority;
- a hand-over is one synchronous call, never a job, and its key stores only a performed result, an `outcome-unknown` or
  a failure after the effect began, never a refusal or a failure before any effect, where interop's
  [repeated-key paragraph](interop.md#c32-jobs) answers any ended job's key with that job;
- the detail `idempotency-conflict` names a key's misuse, outside DL-19's scope of authorisation refusals;
- an elicitation is taken only when its accepted message names the agent, the source commit and the recipient, and is
  consumed under its record id.

The line between the two is this. Moving an agent's mechanics into a product, by rewriting or copying them file by
file into that product's own source through the product's own change with the agent's private data stripped, is the
operator's standing permission of 2026-10-12 (recorded in the knowledge base's
[roadmap](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/roadmap.md)) and needs no word per act. Handing over the agent's source as such (handing a source export to
anyone, pushing the agent's tree or a copy of it to another repository, a transfer, a visibility change, a file sent)
needs the operator's word for each act; a local source export needs none. A copy moved within the operator's own estate
to a place that is not public (a deploy to the operator's own placement, a private mirror the operator owns) has no
recipient and is not a source hand-over; a push or copy that is public, or that another owner holds, is one. An
organization's repository is another owner's even when the operator administers it (as the knowledge base's
[rules](https://github.com/passioncode-ai/fabric-workspace/blob/main/knowledge/rules.md) section 9 reads), so a push
into it is a source hand-over.

Every agent follows the same rule, private or not, and a private agent is never handed over on anything less. Under
[one approval for all the operator's agents](delegation.md#one-approval-binds-all-the-operators-agents) (DEC-0126) a
relay carries the operator's words verbatim, and an approval for one hand-over covers that act only (OA-5).
`src/mandate.ts` does not refuse a hand-over by itself: the contract names no hand-over action id, so the rule binds
the action's owner (Fabric's "give as source", owed by CT-208; the adapter's, owed by CT-207), whose action is to refuse a
mandate as its authority. An export tool never creates a repository and never pushes. The hand-over's screens are
Fabric's (CT-208).

## Import

A patch back from an exported copy applies only when every path it touches is a source path; otherwise it is refused
whole. It applies at the source, never at an exported copy. `patchPathsAllowed(manifest, paths)` answers the paths that
are not source.

## Starting without the instance

An agent started with an empty data folder and no slot filled starts. A service answers its
[well-known document](service.md#well-known-document) with `status: degraded` and one `degraded[]` entry per missing
required slot, whose `source` is the slot's name, each with `setup: true` (the setup state of DEC-0044: it waits for a
person), an `endpoint` slot included. A `store` slot is never a setup state: a store absent at the first start is
created, and one the agent cannot create under its data folder is a failure entry. A filled `endpoint` the agent cannot reach is
a failure, an entry without `setup`. A missing slot is always reported by the slot's name with `setup: true`, an
`endpoint` included, so a host never reads a setup state as a failing connection. Only a filled `endpoint` that fails,
when the agent's own code knows it backs a declared [connection](connections.md), is reported under that connection's
id, without `setup`: a real failure of that connection. The agent's code owns that mapping from slot to connection;
no schema member declares it and nothing checks it. A call refused because a slot is missing is a setup answer, not a
failure: the agent's own operations count (DEC-0153, in progress) records it as `unknown`, never `failed`, so it never
makes a rise. A caller or a host that sees only the tool's error cannot tell a setup answer from a failure: by
DEC-0149's choice the refusal carries no machine marker, and a structured one is left open.

`degraded[]` holds at most 64 entries. Every failure entry, from a slot or not, comes before every setup entry, and
truncation drops setup entries first: an agent with more entries than fit keeps its failures, then its missing-slot setup
entries in the manifest's order, up to 63 entries in all, and ends with one more `setup: true` entry whose `source` is
`fabric.source.json#slots` (a `#` is outside both the slot grammar and the connection id grammar, so the entry is never
read as a slot or a connection) and whose reason counts the entries left out. When the failures alone exceed 63, it
keeps 63 of them and that overflow entry.

A capability that needs a missing slot answers, after its gate admitted the call (AP-2), with its tool's own error (an
MCP tool result with `isError: true`, or the surface's ordinary error) whose text names the slot by its name, says a
person must finish the agent's setup and points at the well-known document's setup entry; it never carries a value.
DEC-0149 adds no refusal code for it (a later decision may). The rest work. An agent that is not a service says the same
in its first answer or its doctor command.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-156"></a>`FAC-SEM-156` | `source-manifest` | a slot is named once, and neither its name nor its purpose nor the manifest's description is shaped like a credential; a store path is declared once (DEC-0149) |
| <a id="fac-sem-157"></a>`FAC-SEM-157` | `source-manifest` | a path is listed once in `include`, `exclude`, `binaries` and `unchecked`; none of the first three has a `.git` segment; an `include` path lies inside no `exclude` folder; an `exclude` path lies inside an `include` folder and is not an `include` path; a `binaries` path is a file of the source; an `unchecked` path is a file of the source or a folder in it (DEC-0149) |
| <a id="fac-sem-158"></a>`FAC-SEM-158` | `source-tree` | a source tree holds no home folder with a person's name, no credential (a value in a line or a path, or a file by its name), no binary file `binaries` does not list, no nested repository and no installation string; every `include` path names a file; the list's entries are well-formed strings of at least 3 characters and the manifest names an `include` path (DEC-0149) |
| <a id="fac-sem-159"></a>`FAC-SEM-159` | `source-tree` | accepted: an e-mail address not in `publicAddresses`, a relative Markdown link out of the source, no licence file at the root (DEC-0149) |
| <a id="fac-sem-160"></a>`FAC-SEM-160` | `source-package` | a package's `secrets[]` are the source's `secret` slots by name and `optional`, and, when its `state[]` holds any entry, its `state[]` paths the source's `store` slots' paths, as sets (DEC-0149) |

## Conformance

| Who | Requirement | Checked by |
|---|---|---|
| an agent's source repository with `fabric.source.json` | the manifest validates and passes `FAC-SEM-156` and `FAC-SEM-157`; its tree passes `FAC-SEM-158` | `pnpm --silent validate <dir> --kind source-tree`; the operator's tool with the operator's list |
| a source check (the adapter's check and `export`) | answers the vectors' problems for every case (each kind of the tree check's table, `nested-repository`, `short-instance-string` and `no-include` included; lines split at LF and counted from 1, columns from 1 in UTF-16 code units; a finding in a file's own path with no line and no column), reads the operator's list from outside the tree, never prints a value it found | `fixtures/vectors/source-tree.json`; the tool's own test |
| a source export (the adapter's `export`) | reads a committed tree, exports no gitlink, refuses on a blocking finding, writes one commit by the neutral author with no history and no link back, rewrites no file, writes its receipt in the instance without a found value, creates no repository and pushes nothing, runs no test as a condition | the tool's own test |
| `pack` | writes the package's `secrets[]` from the source's secret slots and, unless it packs a copy without state, `state[]` from its store slots | `FAC-SEM-160`; the tool's own test |
| an import of a patch | refuses the whole patch when a path is not source, applies at the source | `patchPathsAllowed` in the vectors; the tool's own test |
| a hand-over (Fabric's "give as source", any tool) | gated as `publish`, a person's act each time; its action declares `relayed` and takes the hand-over only on the operator's word naming the agent, the source commit and the recipient, from a T0 or T1 caller as a valid decision with the exact `target` or the service's accepted elicitation naming the three, consumed when the effect begins, never by a mandate, as [handing over](#handing-over) specifies | the tool's own test |
| an agent started without its instance | starts, answers `degraded` with one `setup: true` entry per missing required slot (an `endpoint` included), a filled endpoint it cannot reach a failure without `setup`, refuses only what needs a missing slot, with its tool's own error naming the slot and no value | the agent's own test |

## Not decided here

- Requiring a source manifest of every agent (DEC-0149 item 3).
- Globs in `include` and `exclude`.
- A reference export or import in this repository.
