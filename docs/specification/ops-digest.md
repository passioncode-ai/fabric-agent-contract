# Operations digests and the retro after work

DEC-0153 · rule codes `FAC-SEM-166`, `FAC-SEM-167` · schemas
[`ops-digest-hourly.schema.json`](../../schemas/ops-digest-hourly.schema.json),
[`ops-digest-daily.schema.json`](../../schemas/ops-digest-daily.schema.json) · code
[`src/ops-digest.ts`](../../src/ops-digest.ts) · vectors [`ops-digest.json`](../../fixtures/vectors/ops-digest.json)
(written by [`tools/vectors/ops-digest.ts`](../../tools/vectors/ops-digest.ts)) · tests
[`test/ops-digest.test.ts`](../../test/ops-digest.test.ts) · fixtures `fixtures/positive/ops-digest-*`,
`fixtures/negative/ops-digest-*`, `fixtures/semantic/ops-digest-*`

A product keeps its own operations log on its own machine, and reads it itself: every hour it folds the hour's records
into one `ops.digest.hourly@1` line, and every UTC day the day's hourly lines into one `ops.digest.daily@1` line.
No model reads the log; the fold is arithmetic. A failure count that rose against the hour before is a rise, which the
product tells its operator. Every agent closes its work with a retro, `retro-after-work`, which the host asks for and
counts. The split of who keeps and reads what is Fabric's ADR-0188 (commit `0d0e5922`); Fabric writes these digests
since commit `e1eecec0` (`apps/desktop/src/shared/opsDigest.ts`, `apps/desktop/src/main/opsDigestRun.ts`), and this
page is the shape every other product writes too, so one reader reads them all.

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
| `hours` | how many hourly digests of the day were folded, 1 to 24 (24 when the product ran all day) |
| `ops`, `total` | as in the hourly digest, summed over the day's hours |
| `risen` | each operation that rose in some hour of the day: `{op, hours, failed}`, the hours it rose in and the failures of those hours, the most failures first |

Every count is an integer from 0 to 2^53 − 1. Both schemas are closed: a member the schema does not name, a log line's
text among them, fails it.

## Rules

- **OD-1, the window.** An hourly digest covers one whole UTC hour, `to` one hour after `from`; a daily digest one
  UTC day. An hour the product ran through is closed and written even when nothing was recorded (`ops` empty, every
  total 0), so the next hour compares with zero; an hour the product did not run is not written (a gap), and the hour
  after a gap compares with none. A daily digest folds the hourly digests whose hour starts on its day.
- **OD-2, an operation's name.** `op` is a short identifier: a lower-case letter, then letters, digits and `_` in
  segments joined by `.`, `:` or `-` (`board.tick`, `ipc.work:home`, `work.sweep-done-review`), at most 64
  characters. So no path, URL, space or home folder fits it. It names the operation, never a value of it: no
  identifier, count or credential (`FAC-SEM-167` refuses one shaped like a credential).
- **OD-3, counting.** Every record the product's log takes is counted, by `op` and outcome, in the hour it happened,
  before the log decides whether to write or only count it (a sampled success is counted too). The outcome `ok` counts
  as `ok`, `failed` as `failed`, any other as `unknown`. `total` is each counter's sum over `ops`. Each `op` is named
  once in `ops` and once in `risen`.
- **OD-4, a rise.** An operation rose in an hour when its failures in the hour are at least 10 and at least twice its
  failures in the hour just before; an hour before with no failure, or none recorded, counts as one. So 10 failures
  after 0 or 5 is a rise, 10 after 6 is not, 9 is never one. Every operation that rose is in `risen`, and each one
  there rose. A daily digest's rise sums the failures of the hours it rose in, so it is at least 10 an hour and at
  most the day's failures of that operation.
- **OD-5, the daily fold.** The day's hourly digests are folded once each: a product that finds two lines for one hour
  (a restart that read its own file back) folds the first. `hours` is how many were folded.
- **OD-6, the files.** A product appends each digest as one line of JSON, ended by a line feed, to
  `hourly-YYYY-MM.jsonl` (the month of `from`) and `daily-YYYY-MM.jsonl` (the month of `day`), in a folder of its own
  on its own machine that only its user reads (Fabric's: `digests` in its data folder, files mode `0600`). A digest
  stays on the machine; the daily digest MAY be sent onward as a record (ADR-0188 §3), and how is not this page's.
  A reader reads line by line: it skips a line that is not JSON, that names another `schema` (a later revision
  included) or that fails the schema or a rule, never stopping at one, and of two lines for one hour reads the first.
- **OD-7, nothing but counts.** A digest holds no log line, no path, no identifier (of a session, a request, a person
  or a machine) and no text. What the log's records say stays in the log.
- **OD-8, the operator is told.** A product that shows its operator findings shows each rise of its newest closed hour
  with the operation, the failures and the hour before's (Fabric's review queue, ADR-0188 §2); a rise is never
  told as the cause of a failure, only as its count.

The `@1` names are the ones Fabric writes, kept as written: they are no `<name>/<revision>` of the protocol revision
register ([versioning](versioning.md#protocol-revisions)), because nothing negotiates them; a reader that meets a line
naming a revision it does not read skips that line (OD-6). `pnpm validate` reads one digest at a time (a line saved as
its own `.json` file) and tells the two apart by `schema`.

## The retro after work, `retro-after-work`

- **RW-1, when it arises.** A host's obligation `retro-after-work` arises for a session each time it releases a claim
  as `done`, and when the session ends. One retro answers every time it arose since the session's last retro.
- **RW-2, how it is asked.** The host serves it among the obligations it hands a session (Fabric: in `fabric_whoami`'s
  answer), naming it `retro-after-work`: write the retro in the same turn as the release, or before the session ends.
  It is advice: it never holds a release or an end back.
- **RW-3, what fulfils it.** Any of: one or more lessons recorded in Project Observatory (`observatory_lesson`, one
  class key per lesson) saying what went wrong and what would have prevented it; one or more `insight/1` lines with
  what the session learned about the product; or one line saying there is nothing worth saying. A retro holds no
  secret, no home path and no log line.
- **RW-4, how it is counted.** The host counts each time the obligation arose as one record of the operation
  `retro-after-work` in its operations digests (OD-3): `ok` when a retro answered it, `failed` when the session's
  attempt to write one was refused (a lesson the memory refused), `unknown` when the session ended or moved on with
  none the host observed. Retros asked are the three counters' sum, retros written are `ok`. Nothing of the retro's
  text enters the digest.

## Semantic rules

| Code | Kind | Rule |
|---|---|---|
| <a id="fac-sem-166"></a>`FAC-SEM-166` | `ops-digest-hourly`, `ops-digest-daily` | an hourly digest's `from` and `to` are whole UTC hours of real days, one hour apart, and a daily digest's `day` a real UTC day; each `op` once in `ops` and once in `risen`; `total` each counter's sum over `ops`; every `risen` op counted in `ops`; an hourly rise names the hour's failures of its op and is a rise by OD-4 against its `previous`; a daily rise is in at most the day's `hours`, with at least 10 failures an hour it rose and at most the day's failures of its op (DEC-0153) |
| <a id="fac-sem-167"></a>`FAC-SEM-167` | `ops-digest-hourly`, `ops-digest-daily` | no `op`, in `ops` or in `risen`, is shaped like a credential (`secretValue` of [`src/secret-shape.ts`](../../src/secret-shape.ts)) (DEC-0153) |

## Not decided here

- The grammar of an `insight/1` line: the obligation names it as Fabric's ADR-0188 does; its shape is a later decision.
- The members ADR-0188 §1 also names for the hourly fold (sessions started and left, board requests waiting): a count
  of events MAY be an operation of `ops` (as RW-4's retros are); a gauge such as requests waiting has no `@1` home (the
  schemas are closed) and needs its own decision.
- How a daily digest travels to Project Observatory (ADR-0188 §3), and how Observatory reads every product's digests.
- `pnpm validate` reading a `.jsonl` file whole.
