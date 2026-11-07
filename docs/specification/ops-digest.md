# Operations digests and the retro after work

DEC-0153 · rule codes `FAC-SEM-166`, `FAC-SEM-167`, `FAC-SEM-168` · schemas
[`ops-digest-hourly.schema.json`](../../schemas/ops-digest-hourly.schema.json),
[`ops-digest-daily.schema.json`](../../schemas/ops-digest-daily.schema.json),
[`service-ops-digest-extension.schema.json`](../../schemas/service-ops-digest-extension.schema.json) · code
[`src/ops-digest.ts`](../../src/ops-digest.ts) · vectors [`ops-digest.json`](../../fixtures/vectors/ops-digest.json)
(written by [`tools/vectors/ops-digest.ts`](../../tools/vectors/ops-digest.ts)) · tests
[`test/ops-digest.test.ts`](../../test/ops-digest.test.ts) · fixtures `fixtures/positive/ops-digest-*`,
`fixtures/negative/ops-digest-*`, `fixtures/semantic/ops-digest-*`, `fixtures/positive/service-descriptor-ops-digest.json`,
`fixtures/positive/service-ops-digest-extension.json`, `fixtures/negative/service-ops-digest-extension-*`

A product keeps its own operations log on its own machine, and reads it itself: it writes one `ops.digest.hourly@1`
line for each hour it observed itself running in, an empty one included, and folds each closed UTC day that has hourly
lines into one `ops.digest.daily@1` line. No model reads the log; the fold is arithmetic. A failure count that rose
against the hour before is a rise, which a product that shows findings tells its operator. Every agent is asked to
close its work with a retro, `retro-after-work`, which the host asks for and counts. The split of who keeps and reads
what is Fabric's ADR-0188 (commit `0d0e5922`); the shape's origin is Fabric's commit `e1eecec0`, and this page is the
shape every product writes, so one reader reads them all. The reference folds are this contract's
[`src/ops-digest.ts`](../../src/ops-digest.ts) with its vectors; it imports `foldPath` from
[`src/source-rules.ts`](../../src/source-rules.ts), so a copy of it needs `src/source-rules.ts` beside it; their errors on inputs no digest holds (a list that
is not an array, an item that is not an object, a `from` or `day` that is not a string) are the reference's choice,
not this page's rule. This page makes no claim about any product's code; what each product's code was read to do, at a
date, is in the CT-219 handoff.

## The hourly digest, `ops.digest.hourly@1`

| Member | What |
|---|---|
| `schema` | `ops.digest.hourly@1` |
| `from`, `to` | the hour's start and its end (exclusive), whole UTC hours in RFC 3339 with `Z`: `YYYY-MM-DDTHH:00:00Z`, or with the fraction `.000` that `Date.prototype.toISOString` writes; `to` is `from` plus one hour |
| `ops` | each operation recorded in the hour, once: `{op, ok, failed, unknown}`, the counts of its records by outcome |
| `total` | `{ok, failed, unknown}`, each the sum of that counter over `ops` |
| `risen` | each operation whose failures rose against the hour before: `{op, failed, previous}`, `failed` the hour's failures of `op` as `ops` counts them, `previous` those of the hour just before (0 when none were recorded or that hour was not closed) |

## The daily digest, `ops.digest.daily@1`

| Member | What |
|---|---|
| `schema` | `ops.digest.daily@1` |
| `day` | the UTC day, `YYYY-MM-DD` |
| `hours` | how many hourly digests of the day were folded, 1 to 24 (hours folded, never uptime: OD-1) |
| `ops`, `total` | as in the hourly digest, summed over the day's hours |
| `risen` | each operation that rose in some hour of the day: `{op, hours, failed}`, the hours it rose in and the failures of those hours, the most failures first |

Every count is an integer from 0 to 2^53 − 1. Both schemas are closed: a member the schema does not name, a log line's
text among them, fails it.

## Rules

- **OD-1, the window.** An hourly digest covers one whole UTC hour, `to` one hour after `from`; a daily digest one UTC
  day. A product that keeps the log writes one `ops.digest.hourly@1` line for each hour it observed itself running in
  (a tick or a record inside the hour), an empty one included (`ops` empty, every total 0), so the next hour compares
  with zero, and folds each closed UTC day that has hourly lines into one daily line (a day with none has no daily
  digest, OD-5). Filling the hours from the last one written to now without observing them (across a sleep, say) is
  not allowed. A product that keeps its records elsewhere and answers for a day on request (an always-on server)
  writes each hourly line when that hour closes, as any writer does, folding its stored records for that hour, with an
  empty line for an hour it observed itself running in (a tick it records) and no stored record; its answer for a
  closed day folds the lines already written. An hour the product did not run is not written (a gap), and so is an
  hour written as no digest under OD-3; the hour after a gap compares with none. `hours` counts the hourly lines
  folded, never hours the product was up: a reader never infers uptime from it. **The hour a product stops in** is
  kept with its counts and written when it closes, at the next run, compared with the hour just before when that is
  the last hour written, else with none (a gap); a product that cannot keep it writes nothing for that hour, never a
  partial line, since a restart in the same hour would leave two lines and readers keep the first. At start a product
  reads its last hourly line back for `previous`, rebuilds the day's named operations from that day's hourly lines and
  the hour it kept (so a restart never names more than OD-3 allows), and writes every closed hour it kept, the hour it
  stopped in included, before it folds any closed day (OD-5): otherwise that day's daily line loses that hour for
  good.
- **OD-2, an operation's name.** `op` is a short identifier: a lower-case letter, then letters, digits and `_` in
  segments joined by `.`, `:`, `/` or `-` (`board.tick`, `ipc.work:home`, `work.sweep-done-review`, and an MCP method
  as `mcp.<method>`: `mcp.tools/list`, `mcp.notifications/initialized`), at most 64 characters (one copy of the
  grammar, `$defs/op` of the hourly schema, equal to `OP_NAME` and `OP_NAME_MAX`). So no absolute path, URL, space,
  empty segment, `.` or `..` fits it; a home folder the `/` would let through is refused by `FAC-SEM-167`, with the
  home-folder detector other rules use ([`src/activity-rules.ts`](../../src/activity-rules.ts)). `hasHomePath` refuses
  a value in which `home`, `users` or `Users` stands at the start, right after any character that is not an ASCII
  letter or digit (`_`, `-`, `.`, `:` and `/` included) or right after `%2F` or `%252F`, and is followed by `/`, `\`,
  `%2F` or `%252F` (`F` in either case, here and in the `%2F` or `%252F` before) and then an ASCII letter, digit or
  `_`; in which `-home-`, `-users-` or `-Users-` stands at the start or after such a non-alphanumeric character and is
  followed by an ASCII letter or digit; or in which `~` stands at the start or after whitespace as JavaScript's `\s`
  reads it, a double or single quote, `=`, `/` or `\`, followed by an optional name (an ASCII letter or `_`, then
  ASCII letters, digits, `_`, `.` or `-`) and then `/`, `\` or the end. So `api.users/list`, `api.get_users/list`,
  `api.my_users/list` and `ui.home/open` are refused, and `api.user/list` and `api.get_user/list` pass (a dir's
  examples are in OD-9). One refused name fails the whole line, so every reader skips that hour's digest (OD-6): a
  product checks its names against `FAC-SEM-167` before it writes. An operation's name names the operation, never a
  value of it: no identifier, count or credential. `FAC-SEM-167` also refuses a name the shared credential detector
  reads as a credential: a provider key's shape, in either case and anywhere in the name: `sk-` followed by 16 or more
  letters, digits, `_` or `-` (so inside any word ending in sk: `task-`, `risk-`, `mask-` and the like), `gh[pousr]_`
  followed by 20 or more letters or digits, `xox[abposr]-` followed by 10 or more letters, digits or `-`,
  `AKIA` followed by 16 letters or digits, `glpat-` followed by 20 or more letters, digits, `_` or `-`; a JWT (`eyJ`
  and 2 or more letters, digits, `_` or `-`, a `.`, 2 or more of them, a `.`, then any number of them,
  case-sensitive); a value starting with `bearer` in either case, whitespace and one more character other than a line
  break (as JavaScript's `.` reads it); or a run of 40 or more letters, digits, `+`, `/`, `=`, `_` or `-` (so across
  segments joined by `-` or `/`) that mixes upper case, lower case and a digit. `hasJwt`, `SECRET_VALUE` and
  `longSecret` (together `secretValue`) in [`src/secret-shape.ts`](../../src/secret-shape.ts) are the definition. So
  `ops.risk-assessment-completed` and `queue.task-assigned-to-worker` are refused and `work.session-end-task-back`
  passes, until DEC-0151's narrowing of the `sk-` shape lands.
- **OD-3, counting.** Every record the product's log takes is counted, by `op` and outcome, in the hour it happened,
  before the log decides whether to write or only count it (a sampled success is counted too). The outcome `ok` counts
  as `ok`, `failed` as `failed`, any other as `unknown`. A product whose log uses its own outcome words maps each one
  to `ok` (the operation did what it was asked), `failed` (it tried and did not, by a fault) or `unknown` (a setup
  answer, a policy or permission refusal, a skip, a missing slot, or a word it did not place), and publishes that map
  in its own documentation; the map is not in the digest. A product's own call refused because its own source slot is
  missing (DEC-0149: "Starting without the instance", the setup state of DEC-0044) is a setup answer, not
  a failure: it counts as `unknown`, never `failed`, so a person's unfinished setup never makes a rise. A host that
  relays calls counts an error as it sees it: a relayed error cannot tell setup from failure (DEC-0149).
  `total` is each counter's sum over `ops`. Each `op` is named once in `ops` and at most once in `risen`. A count, and
  every sum, is an integer from 0 to 2^53 − 1; a product that would write a larger one writes no digest for that hour
  (the reference folds throw). `ops` and `risen` hold at most 4096 operations each: a product keeps at most 4095 named
  operations per UTC day plus its one fixed overflow name, under which it counts the rest (their counts kept), so both
  its hourly and its daily lines validate; it publishes that overflow name with its outcome map. A day that would fold
  more than 4096 operations, or whose hours hold a name OD-2 refuses (its grammar, or `FAC-SEM-167`), has no daily
  digest, and an hour of more than 4096 operations, or holding a name OD-2 refuses (its grammar, or `FAC-SEM-167`),
  has no hourly digest (the reference `foldDay` and `foldHour` throw), since a line every reader skips is never
  written. A finding or a fold's error names a value shaped like a credential, holding a home folder, or any value
  that is not printable ASCII only by its place, never by the value.
- **The order.** `ops` is sorted by `op` in code-unit order (the order of JavaScript's `<` on strings); an hourly
  `risen` is in the order of `ops`; a daily `risen` is sorted by `failed`, the most first, then by `op` in code-unit
  order. The reference folds write this order and the vectors compare in it. `FAC-SEM-166` does not check order, and a
  reader never depends on it: it reads `ops` and `risen` as sets keyed by `op`.
- **OD-4, a rise.** An operation rose in an hour when its failures in the hour are at least 10 and at least twice its
  failures in the hour just before; an hour before with no failure, or none recorded, counts as one. So 10 failures
  after 0 or 5 is a rise, 10 after 6 is not, 9 is never one. Every operation that rose is in `risen`, and each one
  there rose. A daily digest's rise sums the failures of the hours it rose in, so it is at least 10 an hour and at
  most the day's failures of that operation. A rise missing from `risen` needs the hour before to be seen, so
  `FAC-SEM-166` cannot see it in one digest; the vectors check it.
- **OD-5, the daily fold.** The day's hourly digests are folded once each: a product that finds two lines for one hour
  (a restart that read its own file back) folds the first. `hours` is how many were folded. A day with no hourly
  digest of its own has no daily digest: a product writes none for it, and one that answers for a day over HTTP
  answers that it has none (`404`) rather than a digest of zero hours (`foldDay` returns null). **Catch-up:**
  a product that was not running when a UTC day closed folds that day once, at its next run, reading its hourly file
  back: each closed UTC day that has hourly lines and no daily line gets its daily line then, and no day gets two.
- **OD-6, the files.** A product appends each digest as one line of JSON, ended by a line feed, to
  `hourly-YYYY-MM.jsonl` (the month of `from`) and `daily-YYYY-MM.jsonl` (the month of `day`), in a folder of its own
  on its own machine that only its user reads (files mode `0600` where the system has modes). A digest
  stays on the machine; the daily digest MAY be sent onward as a record (ADR-0188 §3), and how is not this page's.
  A reader reads line by line: it skips a line that is not JSON, that names another `schema` (a later revision
  included) or that fails the schema or a rule, never stopping at one; of two lines for one hour it reads the first,
  and of two daily lines for one day the first. A collector (OD-9) takes the first daily line of a day too.
- **OD-7, nothing but counts.** A digest holds no log line, no path, no identifier (of a session, a request, a person
  or a machine) and no text. What the log's records say stays in the log.
- **OD-8, the operator is told.** A product that shows its operator findings shows each rise of its newest closed hour
  with the operation, the failures and the hour before's (ADR-0188 §2); a rise is never
  told as the cause of a failure, only as its count.

The `@1` names are the ones of the shape's origin, kept as written: they are no `<name>/<revision>` of the protocol revision
register ([versioning](versioning.md#protocol-revisions)), because nothing negotiates them; a reader that meets a line
naming a revision it does not read skips that line (OD-6). `pnpm validate` reads one digest at a time (a line saved as
its own `.json` file) and tells the two apart by `schema`.

## Where a collector reads the daily digests

- **OD-9, the declaration.** A product whose daily digests a collector in the same OS account (DEC-0154)
  reads says where they are in its own [service descriptor](service.md#descriptor), under the extension key
  `https://fabric.passioncode.ai/agent-contract/extensions/ops-digest/0.1` (protocol `fabric-ops-digest/0.1`, named
  in the [register](versioning.md#protocol-revisions) and pinned by no schema): a list of 1 to 8 closed objects
  `{dir, source}` ([`service-ops-digest-extension.schema.json`](../../schemas/service-ops-digest-extension.schema.json)).
  - `dir` is a folder inside the product's data folder (`paths.data`), relative to it: forward slashes, no leading `/`
    or `~`, no drive letter or other `:`, no backslash, no `.` or `..` segment, no C0 control character, no `//` and
    no trailing `/`, at most 256 characters (the grammar of a package path, `fabric-package.schema.json#/$defs/path`,
    which a package's state relative to the data folder also uses). It holds the product's `daily-YYYY-MM.jsonl` files
    (OD-6); a collector reads those files in `<paths.data>/<dir>` and nothing else there. A `dir` segment that is
    empty once every default-ignorable code point (the code points HFS+ ignores among them) and its trailing dots and
    spaces are dropped is refused (`..` + U+2060, `a/..` + U+200B + `/b`, a lone U+2060): a tool that trims or strips
    names (Win32 path handling drops trailing dots and spaces; a reader that strips those code points before joining)
    may read it as empty, `.` or `..`, another folder than the one declared, possibly outside `paths.data`. The fold
    for duplicates below is DEC-0149's (`foldPath` in `src/source-rules.ts`), apart from this check; it drops only the code points
    HFS+ ignores, not every default-ignorable one, for parity with DEC-0149's fold. Each `dir` is named once, compared
    under canonical caseless matching (the code points HFS+ ignores removed, NFD, lower, upper and lower case, NFC,
    Georgian Nuskhuri onto Mkhedruli), trailing dots and spaces dropped, segment by segment (a folder under two labels
    would be sent twice). The home-folder and credential detectors read `dir` four ways: as written, with every
    default-ignorable code point removed (the code points HFS+ ignores among them), and each of those with each
    segment's trailing dots and spaces dropped (so `users./alice`, `Users /Alice`, `x` + U+200E + `users./alice` and
    `users` + U+2060 + `/alice` hold home folders); a run of 40 or more letters, digits, `+`, `/`, `=`, `_` or `-`
    that mixes upper case, lower case and a digit, across segments joined by `/` too
    (`ApplicationSupport/MyProduct/Digests2026`, `Application+Support/MyProduct/Digests2026x`), is refused on purpose,
    since the credential detector's run includes `/` so that a base64 secret holding one is still found; its finding
    says so and that a space or a dot inside a segment (not at its end) breaks the run. A `dir` holding a lone
    surrogate (not well-formed Unicode: `String.prototype.isWellFormed` rejects it) names no folder a file system can
    hold and is refused. For hiding a class of dirs in a message the dir's fold counts too (`USERS/alice` folds to a
    home folder: it is hidden, never refused). The home-folder detector applies to `dir`: `hasHomePath` refuses a
    value in which `home`, `users` or `Users` stands at the start, right after any character that is not an ASCII
    letter or digit (`_`, `-`, `.`, `:` and `/` included) or right after `%2F` or `%252F`, and is followed by `/`,
    `\`, `%2F` or `%252F` (`F` in either case, here and in the `%2F` or `%252F` before) and then an ASCII letter,
    digit or `_`; in which `-home-`, `-users-` or `-Users-` stands at the start or after such a non-alphanumeric
    character and is followed by an ASCII letter or digit; or in which `~` stands at the start or after whitespace as
    JavaScript's `\s` reads it, a double or single quote, `=`, `/` or `\`, followed by an optional name (an ASCII
    letter or `_`, then ASCII letters, digits, `_`, `.` or `-`) and then `/`, `\` or the end. So `users/digests`,
    `my_users/digests`, `my-users/digests` and `a/~b` are refused, and `user-digests` and `a/~1/x` pass (`a/~1/x`
    passes the detector; `~` is outside OD-2's grammar, so it is no operation name).
  - `source` is `^[a-z][a-z0-9-]{0,31}$`: the label the collector sends with each daily digest it reads in `dir`.
    `app` is the conventional label of a product's one folder; each label is named once in the list.
- **Local only.** Only a descriptor whose placement is `local` (an absent `placement` is `local`) carries the key, and
  it names `paths.data`; a remote descriptor has no folder on this machine. A declared `dir` holds only the declaring
  instance's own digests: relaying a remote instance's digests through a local folder (a server's lines fetched by a
  desktop app) is outside this contract. The key in any document other than a service descriptor is unread and
  unreported; on a remote service descriptor it is a `FAC-SEM-168` finding.
- **The digests stay as written.** The declaration only says where a collector in the same OS account
  (DEC-0154) reads the daily lines and which label it sends with them. The lines are read as OD-6 says (a line it cannot read skipped, never
  stopping at one) and sent as they are, with their label, never rewritten; OD-7 holds for everything sent. A
  collector takes each day's first daily line whenever it first appears, a day a product caught up at its next run
  (OD-5) included, and sends it once. Beside `source` it sends which descriptor the line came from (its `id` and
  `instance`), so two products with the label `app` stay apart. A product without a local descriptor is outside this
  declaration (see Not decided here).
- **`FAC-SEM-168`** checks a descriptor that carries the key: a remote placement, or a local one without `paths.data`;
  a value that is not the schema's; a `source` named twice; a `dir` named twice, compared under canonical caseless
  matching (the code points HFS+ ignores removed, NFD, lower, upper and lower case, NFC, Georgian Nuskhuri onto
  Mkhedruli), trailing dots and spaces dropped; a `dir` with a segment that is empty once every default-ignorable code
  point and its trailing dots and spaces are dropped; a `dir` holding a lone surrogate (not well-formed Unicode); a
  `dir` that holds a home folder (`hasHomePath`, the detector `FAC-SEM-167` uses, with the boundary above), and a
  `dir` or `source` shaped like a credential (`secretValue`). One finding refuses the whole declaration: a collector
  treats a declaration with a `FAC-SEM-168` finding as not declared and reports it, as a host treats an invalid load
  key ([agent network](agent-network.md#load), `FAC-SEM-133`), so no folder of it is read. `digestFoldersView` in
  [`src/ops-digest.ts`](../../src/ops-digest.ts) is the reader (`usable` is true only when `digestFoldersRules`, the
  rule, has no finding). A bare declaration checked with `pnpm validate --schema
  service-ops-digest-extension.schema.json` gets the schema check and a `hint/declaration-only` line; check the
  descriptor to run `FAC-SEM-168`.

A product with one folder of digests, `digests` in its data folder, writes in its descriptor:

```json
"extensions": {
  "https://fabric.passioncode.ai/agent-contract/extensions/ops-digest/0.1": [
    { "dir": "digests", "source": "app" }
  ]
}
```

## The retro after work, `retro-after-work`

- **RW-1, when it arises.** A host's obligation `retro-after-work` arises for a session at each release of a claim or
  task that the host records as done (in [coordination](coordination.md) terms, a release with outcome success; each
  host's own claim vocabulary decides which act that is), and when the session ends, only if the session wrote no
  retro since the session began or the obligation last arose, whichever is later; the host judges "wrote no retro" by
  what it observes (RW-4). One retro answers every
  time it arose since the session's last retro.
- **RW-2, how it is asked.** The host serves it among the obligations it hands a session, through each host's own
  channel, naming it `retro-after-work`: write the retro in the same turn as the release, or before the session ends.
  It is advice: it never holds a release or an end back.
- **RW-3, what fulfils it.** Any of: one or more lessons recorded in Project Observatory (`observatory_lesson`, one
  class key per lesson) saying what went wrong and what would have prevented it; one or more `insight/1` lines with
  what the session learned about the product; or one line saying there is nothing worth saying. A retro holds no
  secret, no home path and no log line. A retro the session writes elsewhere still fulfils it, but the host counts only
  what it observes (RW-4). The retro after work is a session's note, not the Memory Kernel's project retrospective
  ([memory and learning](memory-and-learning.md#formation-evolution-use-and-retrospectives), item 5): a lesson recorded
  for it is no learning proposal and changes no revision.
- **RW-4, how it is counted.** The host counts each time the obligation arose as one record of the operation
  `retro-after-work` in its operations digests (OD-3), in the hour the record is resolved (the retro answered, or
  `unknown` at the session's end): `ok` only when it observes a lesson or an `insight/1` line written through a call
  it carries (its own tool call, or a host hook that observes the session's own tool call), `failed` when such a call
  was refused (a lesson the memory refused), `unknown` otherwise: a retro written elsewhere, a line saying there is
  nothing to say, or none, at the session's end. Retros asked are the three counters' sum; `ok` counts the asks
  answered by a retro the host saw written. One retro may answer several asks, so `ok` is not a count of retros and no
  bound on them; counting the retros written is Project Observatory's (Not decided here). Nothing of the retro's text
  enters the digest.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-166"></a>`FAC-SEM-166` | `ops-digest-hourly`, `ops-digest-daily` | an hourly digest's `from` and `to` are whole UTC hours of real days, one hour apart, and a daily digest's `day` a real UTC day; each `op` once in `ops` and at most once in `risen`; `total` each counter's sum over `ops`; every `risen` op counted in `ops`; an hourly rise names the hour's failures of its op and is a rise by OD-4 against its `previous`; a daily rise is in at most the day's `hours`, with at least 10 failures an hour it rose and at most the day's failures of its op (DEC-0153) |
| <a id="fac-sem-167"></a>`FAC-SEM-167` | `ops-digest-hourly`, `ops-digest-daily` | no `op`, in `ops` or in `risen`, is shaped like a credential (`secretValue` of [`src/secret-shape.ts`](../../src/secret-shape.ts), the shared detector: a provider key's shape, in either case and anywhere in the name: `sk-` followed by 16 or more letters, digits, `_` or `-` (so inside any word ending in sk: `task-`, `risk-`, `mask-` and the like), `gh[pousr]_` followed by 20 or more letters or digits, `xox[abposr]-` followed by 10 or more letters, digits or `-`, `AKIA` followed by 16 letters or digits, `glpat-` followed by 20 or more letters, digits, `_` or `-`; a JWT (`eyJ` and 2 or more letters, digits, `_` or `-`, a `.`, 2 or more of them, a `.`, then any number of them, case-sensitive); a value starting with `bearer` in either case, whitespace and one more character other than a line break (as JavaScript's `.` reads it); or a run of 40 or more letters, digits, `+`, `/`, `=`, `_` or `-` (so across segments joined by `-` or `/`) that mixes upper case, lower case and a digit. `hasJwt`, `SECRET_VALUE` and `longSecret` (together `secretValue`) in [`src/secret-shape.ts`](../../src/secret-shape.ts) are the definition. So `ops.risk-assessment-completed` and `queue.task-assigned-to-worker` are refused and `work.session-end-task-back` passes, until DEC-0151's narrowing of the `sk-` shape lands) or holds a home folder (`hasHomePath` of [`src/activity-rules.ts`](../../src/activity-rules.ts)). `hasHomePath` refuses a value in which `home`, `users` or `Users` stands at the start, right after any character that is not an ASCII letter or digit (`_`, `-`, `.`, `:` and `/` included) or right after `%2F` or `%252F`, and is followed by `/`, `\`, `%2F` or `%252F` (`F` in either case, here and in the `%2F` or `%252F` before) and then an ASCII letter, digit or `_`; in which `-home-`, `-users-` or `-Users-` stands at the start or after such a non-alphanumeric character and is followed by an ASCII letter or digit; or in which `~` stands at the start or after whitespace as JavaScript's `\s` reads it, a double or single quote, `=`, `/` or `\`, followed by an optional name (an ASCII letter or `_`, then ASCII letters, digits, `_`, `.` or `-`) and then `/`, `\` or the end. So `api.users/list`, `api.get_users/list`, `api.my_users/list` and `ui.home/open` fail and `api.user/list` and `api.get_user/list` pass. One refused name fails the whole line, which every reader skips (DEC-0153) |
| <a id="fac-sem-168"></a>`FAC-SEM-168` | `service-descriptor` | a descriptor that carries the ops-digest key (`extensions/ops-digest/0.1`) is a `local` one that names `paths.data`; its value is valid against `service-ops-digest-extension.schema.json` (a reader treats an invalid one as not declared and reports it); each `source` is named once and each `dir` once, compared under canonical caseless matching (the code points HFS+ ignores removed, NFD, lower, upper and lower case, NFC, Georgian Nuskhuri onto Mkhedruli), trailing dots and spaces dropped; no `dir` segment is empty once every default-ignorable code point and its trailing dots and spaces are dropped (a tool that trims or strips names may read it as empty, `.` or `..`, another folder than the one declared, possibly outside `paths.data`); no `dir` holds a home folder (`hasHomePath`) and no `dir` or `source` is shaped like a credential (`secretValue`), a `dir` read four ways (as written, with every default-ignorable code point removed, and each of those with each segment's trailing dots and spaces dropped), a run of 40 or more letters, digits, `+`, `/`, `=`, `_` or `-` that mixes cases and a digit, across segments joined by `/` too (`Application+Support/MyProduct/Digests2026x`), refused on purpose with the reason and the remedy in its message (a space or a dot inside a segment, not at its end, breaks the run); no `dir` holds a lone surrogate (not well-formed Unicode). `hasHomePath` refuses a value in which `home`, `users` or `Users` stands at the start, right after any character that is not an ASCII letter or digit (`_`, `-`, `.`, `:` and `/` included) or right after `%2F` or `%252F`, and is followed by `/`, `\`, `%2F` or `%252F` (`F` in either case, here and in the `%2F` or `%252F` before) and then an ASCII letter, digit or `_`; in which `-home-`, `-users-` or `-Users-` stands at the start or after such a non-alphanumeric character and is followed by an ASCII letter or digit; or in which `~` stands at the start or after whitespace as JavaScript's `\s` reads it, a double or single quote, `=`, `/` or `\`, followed by an optional name (an ASCII letter or `_`, then ASCII letters, digits, `_`, `.` or `-`) and then `/`, `\` or the end. So `users/digests`, `my_users/digests`, `my-users/digests` and `a/~b` fail and `user-digests` and `a/~1/x` pass. One finding refuses the whole declaration, which a collector reads as not declared (DEC-0153 OD-9) |

## Not decided here

- The grammar of an `insight/1` line: the obligation names it as Fabric's ADR-0188 does; its shape is a later decision.
- The members ADR-0188 §1 also names for the hourly fold (sessions started and left, board requests waiting): a count
  of events MAY be an operation of `ops` (as RW-4's retros are); a gauge such as requests waiting has no `@1` home (the
  schemas are closed) and needs its own decision.
- How a daily digest travels to Project Observatory (ADR-0188 §3), and how Observatory reads every product's digests:
  OD-9 says only where a collector in the same OS account (DEC-0154) reads the daily lines and which label
  it sends; who collects,
  how often and over which call is the collector's and Observatory's.
- `pnpm validate` reading a `.jsonl` file whole.
- Which act of each host's claim vocabulary is "a release recorded as done" for RW-1: each host names its own.
- Counting the retros written, inside or outside a host (a lesson recorded straight in Project Observatory included):
  Project Observatory's.
- The wire form in which a collector sends the descriptor's `id` and `instance` beside `source` (OD-9): an optional
  `service {id, instance}` beside `source` is announced (board thread `f7758225`, message `1a12d809`); the form is the
  collector's and Project Observatory's.
- How a product without a local descriptor reaches a collector: outside this contract. A product's own folder in its
  own local descriptor is an OD-9 declaration; a folder of a remote instance's digests fetched by a local app is a
  relayed remote instance's, outside this contract.
- The identity a relayed remote instance's lines are sent under, so that N relays are not N counts.
- A `dir` that NFC or NFD grows past 256 code points: a `dir` of 256 precomposed `ä` (U+00E4) passes `FAC-SEM-168`,
  though `inGrammar` (DEC-0149) refuses it (its probe, `test/ops-digest.test.ts` "passes a dir of 256
  precomposed code points that NFD doubles": no finding).
