# 2026-11-04: an agent that answers people on a channel (DEC-0150, CT-209)

## Objective

The board request `437c404b` (thread `b6820b97`): an extension key under which an agent that answers people on a
channel (mail, Telegram, store reviews) declares what `channel-agent-standard/1` asks, with the schema in this contract
and the checks the standard's section 11 makes statically, for the Fabric Agent Adapter's service check (its row
FAA-197, on the adapter's main).

## Done

- The key `https://fabric.passioncode.ai/agent-contract/extensions/channel-agent/0.1` (`EXTENSION_KEYS.channelAgent`),
  read under a manifest's `provider.extensions` or, for a service with no manifest, a well-known answer's `extensions`.
- [`schemas/service-channel-agent-extension.schema.json`](../../schemas/service-channel-agent-extension.schema.json):
  section 13.6's members, one file with no reference to another.
- [`src/channel-agent.ts`](../../src/channel-agent.ts) (`channelAgentView`, `channelAgentRules`, kinds `manifest` and
  `service-well-known`): `FAC-SEM-162` (misplaced, oversize or invalid), `FAC-SEM-163` (ids once, decisions named),
  `FAC-SEM-164` (a channel's, a queue's and the budgets' obligations), `FAC-SEM-165` (no credential-shaped name or
  value, a token slot read segment by segment). No message carries a declared value; the walk keeps an explicit stack;
  an oversize array or map is refused before the schema runs; at most ten failed keywords are named.
- Vectors [`fixtures/vectors/channel-agent.json`](../../fixtures/vectors/channel-agent.json), each case with its
  `site`, written by [`tools/vectors/channel-agent.ts`](../../tools/vectors/channel-agent.ts) and registered in
  `tools/vectors/run.ts`; positive, negative and semantic fixtures with their catalogue rows;
  [`test/channel-agent.test.ts`](../../test/channel-agent.test.ts).
- The page [channel agent](../specification/channel-agent.md); rows in the specification index, the extension keys
  (interop.md), support-quality.md's pointer, conformance.md (register, reference modules, the channel agent's row),
  DOCMAP, CONTEXT (Channel agent); DEC-0150 (Proposed); CT-209; the standard's copy
  [`docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`](../evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md)
  (the standard owner's neutral copy, round 4, kept byte for byte) and its row in
  `docs/evidence/sources.md`.
- Round 1 of the readings: four unit breaks (the slot exception, values in messages, recursion depth, the schema on huge
  arrays), one product break (section 5.1's payload) and the seam's and product's risks, all fixed.
- Round 2 of the readings: three unit breaks (a text's language in a path, a number that is no index in FAC-SEM-162's
  places, FAC-SEM-165's quadratic walk), the seam break (null members: the contract stays as written, a fixture
  documents the boundary) and the product break (the branch's history), all fixed; FAC-SEM-165 names at most 64
  places and a path at most 64 levels deep, the detector reads 4097 code points, a blank text strips `\p{Cf}` and
  `\p{Z}` (widened in rounds 3 and 4), a misplaced declaration is read for credentials, and `rawValues` appends in
  place (CT-194's lines).
- Round 3 of the readings: one unit break (Ajv's patterns throwing on strings of several megabytes) and two product
  breaks (a present-tense claim about DEC-0151, in progress, and a withdrawn commit named here), all fixed. Before the
  schema runs, a string or a name over 4096 code points (`maxLength`) and a declaration, project or channel with more
  members than the schema declares (`maxProperties`) are refused (widened in round 4 to every closed object), and a
  schema that still throws is one fixed finding; the walk keeps one frame per container and builds a place only for a
  finding; a plain name counts digits without `-` and `_`; ids, the side and the codes refuse a run of 7 digits; a blank
  text also strips `\p{Cc}` and the fillers; tier labels are read like texts; the time zone takes one-segment IANA
  names; FAC-SEM-162 names a missing member; a bare declaration gets `hint/declaration-only`. Superseded by later
  rounds: the suite's and outbox's paths read segment by segment (round 4: by the path-aware detector); the
  recommendation read by key shapes only whatever it holds (round 5: only for a value of its own grammar); the
  project's slug refusing a run of 7 digits (round 4: `project` keeps the registry alias pattern); zero allowed for a
  source's `max_age` (round 5: only its `cadence` may be zero).
- Round 4 of the readings: two unit breaks (a numeric object key echoed in a place, the width guard on three objects
  only) and two product breaks (the project grammar, the history), fixed: a numeric key of an object is `*`; every
  closed object's width, every array's `maxItems` and every map's `maxProperties` are read from the schema before it
  runs; `project` keeps the registry alias pattern; the suite's and outbox's paths are read by the path-aware detector;
  a blank text also strips default-ignorable code points and U+FFFC; service.md, identifiers.md and SCN-002 name the
  declaration; the branch was rebuilt on `origin/main`. Superseded: FAC-SEM-162's pointer to `pnpm validate --schema`
  (round 6: the place names the schema's allowed values instead).
- Round 5 of the readings: one unit break (a finding below a member that is not plain placed at an innocent declared
  member) and one product break (DEC-0151, in progress, presented as fact), fixed: a member that is not plain, or past
  64 levels, collapses its place for every member below it; every place writes `*` for an undeclared name, a numeric
  object key and a text's language, in all three rules; the narrow readings apply only at their place and only to a
  value of their own grammar; FAC-SEM-165 reads at most 1 000 000 code points, counting the JWT shape's rereads after
  each `eyJ`; a source's `max_age` is above zero again; the reading of earlier declarations and the shared-channel
  quality check are stated. `src/secret-shape.ts` keeps only CT-194's `rawValues` lines.
- Round 6 of the readings: one product break (this list described a history that was no longer true), fixed by this
  list. Also: the reading budget is one per document, shared by every copy of the declaration, and counts the square of
  an upper-case run after `?`, `&` or `#`; FAC-SEM-162 names the schema's own allowed values beside a failed `enum`,
  `const` or `pattern` and no longer suggests `pnpm validate --schema`; `daily_cap`'s meaning and projects on several
  sides are to be asked of the standard's owner at merge; a valid declaration in both places is stated; the page's
  `sk-` example is one both detectors find, pinned by a test; `taxonomy.version` is "a version"; the specification
  index says the declaration is written by adopting agents and has no reader yet; DEC-0150's Source names each
  reservation.
- Round 7 of the readings: one unit break (the reading budget under-counted query names and percent-encoded ones) and
  three product breaks (the in-progress `sk-` rule stated as current, the schema's `daily_cap` description, the null
  rule), fixed: `detectorCost` charges every query or fragment name holding an upper-case letter or a `%`, a
  %-holding value's decoded `eyJ` term, 16 per name or string and up to 255 after each `sk-` at a boundary; a spent
  budget collapses every further member; the "not read" finding and the 64 places are once per document; FAC-SEM-162
  names at most 8 enum values and cuts a pattern to 80 characters, each spelled once; the null rule names its members;
  the bare `--schema` check is described as the generic one.
- Round 8 of the readings: one unit break (a name charged two or three times when its value is an object or array)
  and one product break (a channel's id and a tier code called the standard's own patterns), fixed: a name is charged
  once, by its visit, which keeps whether it is plain for the member's place; the JWT shape's second segment after a
  dot, 128 per query or fragment piece (a piece costs the detector about what 100 code points of prose do, measured
  under the coverage run) and the escapes the in-progress DEC-0151 takes for a boundary before `sk-` are
  counted; a channel's id and a tier code are this contract's grammars, and those and the other narrowings are listed
  for the standard's owner; vectors at the budget's edge.
- Round 9 of the readings: one unit break (the URL terms counted on the raw text where the detector reads a URL parse's
  names and values) and three product breaks (FAC-SEM-162's pointer to a grammar that lacked limits, three narrowing
  lists that disagreed, a merge plan that rewrote DEC-0150's body), fixed: the URL terms are counted on what a WHATWG
  URL parse yields; the budget counts code points; `sk-` is found in any case and colour sequences of any length;
  FAC-SEM-162 names the schema's limit beside each failed keyword, and the page's grammar lists every limit, held to the
  schema by a test; one narrowing list, on the page; the change of DEC-0151 (in progress) annotates DEC-0150; `channelAgentView` answers
  as a reader does (FAC-SEM-165 and FAC-SEM-163 not declared, FAC-SEM-164 shown).
- Round 10 of the readings: unit, seam and product findings, fixed: a string is read as a URL only when it opens with a
  scheme and its authority is ASCII only (a long host outside ASCII made the WHATWG parse grow with its square; 300
  such strings now run within twice prose's thread time plus 20 ms, and edge vectors pin the rule); a place's member
  name is built only when a finding is reported; the read declaration is walked before its misplaced copies, so a heavy
  copy cannot spend the budget first (a vector pins it), and the walk stops descending once the budget is spent;
  `channelAgentView` is shaped as `connectionsView` (`declared`, `reported`, `errors`); FAC-SEM-162 says `code points`
  for a length and `(object)` or `not null` for a type; the page's Narrowings list is rewritten against the grammar it
  links, four members keep another owner's grammar (`gap_registry.capability` added), and the join and alias
  sentences say when a reader joins and what an agent leaves out; the adapter reports, never fails, a declaration
  written before this revision while live producers still publish one.
- Round 11 of the readings: one unit break (a special scheme takes a host without `//`, and a non-ASCII
  percent-escape in an ASCII authority goes through host processing) and three product breaks (a path behind a scheme
  passed `relativeRef`, the view's errors did not name the rule, the type wording read `null, not null`), fixed: a
  string is read as a URL only when its head, ASCII tab, line feed and carriage return removed, is ASCII, holds no
  percent-escape of a byte at or above 0x80 and opens with a scheme (300 strings of each of `http:`, `http:/`,
  `http:\\`, a tab-split `https:/`, `HTTP:` and `ws:` before 4091 CJK code points, and `http://a.` before 453
  percent-encoded CJK characters, run within twice prose's thread time plus 20 ms; vectors at the edge); the gap this
  leaves is named on the page, in CA-5 and in the conformance row; `afford` refuses at once once the budget is spent;
  FAC-SEM-164 names at most 64 places and counts the rest; `relativeRef` refuses any leading scheme (`file:///...`,
  `db:/...`, with negative vectors); every line of the view names the rule and the place (`FAC-SEM-162 at <place>:
  <keyword> (<limit>)`, `FAC-SEM-165 at <place>`, a misplaced-only manifest reported where its copy stands); a failed
  type names the type alone and a nullable member's `oneOf` its type and null; a Narrowings bullet states the
  1 000 000 code points; "Not checked here" names only references the agent declares, the desk caps of 10 and 15 move
  to the `daily_cap` bullet; the finding on an id that starts with `sk-` asks for a rename; Compatibility says `/1`
  names no ticket unit.
- The standard's owner answered on thread `b6820b97` (round 4 of section 13.6; the coordinator accepted it there), in a
  second commit on the round 11 branch: the schema takes the standard's none form, `{"none": "not_yet", "until":
  "YYYY-MM-DD"}` or `{"none": "not_used"}`, closed, `until` a full date with `not_yet` only, at four members only (the
  question route, the gap registry, `tickets.pd_check` and a channel's `texts.final`), through `if`/`then`/`else` so
  an author reads only the branch the value takes; `null` stays exactly at `decision`, `quiet_window`,
  `late_answer_window` and `spend_record`; a text's language is never named `none`, so the form cannot pass for a
  holding text: a holding text in the none form is refused (`FAC-SEM-162`, not declared), a narrowing of round 4's
  "a text of `channels[].texts`" that the merge post sends, while leaving the holding text out is accepted, which is
  looser; a final text in the none form owes nothing, while an absent one is still found; a recommendation on a
  queue with an answered signal other than `none` is a non-blocking `FAC-SEM-164`; "Not checked here" names a past
  `until` (the check does not read today's date) and the question route's agreement with the side (FAA-197).
  Fixtures `service-channel-agent-extension-none-form` (positive), `-none-without-until` and `-none-at-decision`
  (negative), and vectors pin it.
- The owner posted round 4's neutral copy on thread `b6820b97` (44 662 bytes, SHA-256 `f854a8fc...8c791`, the
  coordinator verified it): it replaces the copy at the same path byte for byte, with no header of ours, and its row in
  `docs/evidence/sources.md` says so. Re-read against it: the none form (section 13.6 names "a text of
  `channels[].texts`"; here only the final text takes it, a holding text being optional, a narrowing the page names),
  `recommendation` only with `answered_signal: "none"` (the non-blocking finding), and section 7.1's age from the last
  successful read, now in `max_age`'s description and on the page.
- The timing tests measure the test thread's processor time against prose read to the budget in the same run (a
  ratio), never a fixed number of milliseconds, so a loaded machine slows both sides alike.
- Round 12 of the readings (on `08fd8ccf`): unit pass, seam pass, three product breaks and unit risks, fixed: the
  credential gap is stated in full (every string not read as a URL, a sentence that holds a URL included, is read for
  key shapes only; a vector pins `Please write to https://u:p@help.example/` as not found); the read declaration is
  judged only by the findings under its own path, and the closing "rest not read" finding stands at the copy where the
  budget ran out, with three vectors (four from round 13, the gap's included) carrying the view's answer and a test deriving the view from the findings for
  every vector; every keyword the schema can fail on names its limit (`additionalProperties`, `propertyNames`, `not`,
  any `oneOf`), with a pointer for the none form at a holding text or a `texts` object, held by a test over the
  schema's keywords; `holding_reply` with a final text `{"none": "not_used"}` is a non-blocking `FAC-SEM-164`; a
  nullable member of the wrong type gets one line; `channelAgentView` always carries `errors` (`[]` when there are
  none), so a port matching on the view's shape follows it; the Narrowings scope the budget bullet to the read
  declaration and name two places looser than the standard; the summary table names the none form; a URL is read
  after leading C0 controls and spaces, as the parser does; every provider prefix's near miss is charged up to its
  floor; `FAC-SEM-163` and the view's `FAC-SEM-162` are capped at 64 with a closing count, and `FAC-SEM-164` builds no
  place past 64.
- Round 13 of the readings (on `9a953847`): unit pass, one product break and its risks, fixed: the pointer "only
  texts.final takes the none form" is added only at a channel's `texts` or `texts/holding` (a test shows none at the
  evals); at the four none-form members a failed type, a `null` included, names the none form beside the type; every
  line of the view is `<code> at <place>: <reason>`, the reason the finding's message without the decision it cites,
  identical lines once, and the derivation test holds the view to the rules' findings with reasons; a nullable
  member's failure is one line, its value branch's, ending in ", or null"; `sk-` away from a boundary is charged up to
  15 code points; the advice to rename an `sk-` id is given only at member names and id members; the Narrowings'
  looser bullet adds the members that may be absent; the page tells a host that shows the view to run the rules too;
  CONTEXT.md lists every channel kind; the conformance row names the holding-reply obligation and the tier-label check;
  an `additionalProperties` line says "only declared members are taken".
- Round 14 of the readings (on `1ccfbf87`): one unit break, fixed: `FAC-SEM-165`'s closing count is per copy (the 64
  named places stay a cap per document; past it the read declaration's "and N more" at its key counts only its own
  places, and a misplaced copy's overflow is closed at that copy), reversing round 13's sentence that the read
  declaration's count held later copies' places; a vector with 70 places in the read declaration and 80 in a misplaced
  copy carries the view's answer, and the derivation test passes on it. The advice to rename an `sk-` id goes by role:
  never under a channel's `texts` or a language-keyed map. A message spells a pattern once even across a nullable
  place's ", or null". A final text's none form writes `none` and `until` in places. The page says a floor counts the
  run a shape needs, not the character that ends it.
- Round 14's product and seam readings, folded into the same batch: a nullable member's failure is described as one
  line everywhere (page item 1, SCN-002, the decisions above); the Objective names FAA-197; the Narrowings' looser
  bullet names an absent final or holding text and a holding reply beside a final text not used, and the holding-text
  sentence of the `null` bullet says looser, not narrower; a channel with replies off owes no texts, whatever its
  `holding_reply` (a vector pins it); the line that the rest was not read says the reader treats the declaration as not
  declared and that fewer or shorter texts or names fix it; the view is described as having the same `declared`,
  `reported` and `errors` as `connectionsView`; the width line of a channel's `texts` in the none form carries the
  pointer to `texts.final`; SCN-002 says a `FAC-SEM-164` line makes `pnpm validate` exit 1 while a reader keeps the
  declaration declared; the budget's prefix terms are worded as bounds any detector may need; the `sk-` keys of the
  rename tests are ones both detectors find.
- Round 15 of the readings (on `b57df67a`): unit pass, seam pass, two product breaks (docs) and unit risks, fixed:
  the Narrowings' `null` bullet states both halves of the none form at a holding text (refused, a narrowing the merge
  post sends; leaving it out accepted, looser); item 1's pointer comes on the `additionalProperties`, `propertyNames`
  and width lines only; `tiers` may be absent (looser); a draft scenario, SCN-055, follows the reader path, traced to
  FAA-197; the page and CA-1 say how a reader knows a service has a manifest; a member name's own failures are stated
  by its `propertyNames` line alone; the budget line says reading takes more than 1000000 code points of reading; the
  rename advice follows the role down the walk (any frame at or below a channel's `texts`); `SK_FLOOR` is 16; the
  boundary `sk-` charge is described from its `s`, with an exact test and a vector at the budget's edge; a test checks
  the boundary forms both ways; a well-known declaration shares the answer's size with its host's readers.
- From DEC-0151's round 13 seam: the cost model's boundary now takes a colour sequence with `:` parameters
  (`ESC[38:5:1m`) and the escaped ESC `\33`, as DEC-0151's detector does, so the full 255 is charged after those heads;
  the boundary-forms test holds them, and an exact test pins the 255 for `ESC[38:5:1m`, `\x1b[38:5:1m`, `\33[1m` and
  `\033[1m`.
- Round 16 of the readings (on `004ee025`): one unit break, fixed: the page quoted the budget line from before round
  15; it now quotes it exactly as the view prints it, and a test holds the quote to the view's error on the vector "a
  read declaration whose own read runs out". The page and CA-5 scope the 255 charge to the boundary forms they list:
  any other form before an `sk-` (`\E`, `\x{1b}`, U+009B, a CSI with a private parameter or another final,
  `\U00000041`, `%u0041`) is charged as a non-boundary, and a port that decodes one before a boundary-bound reading is
  outside the bound (DEC-0151 lists them as knowingly not found).
- Round 16's product and seam readings, folded into the same batch: SCN-055's recovery drops moving the declaration
  to the manifest (the budget counts names and strings wherever it stands; the 2 MiB answer size is its own line,
  cited in `docs/evidence/sources.md` from Fabric Dashboards' `health.ts` at `8062869`); item 4 writes DEC-0149's tree
  check as in progress; the budget paragraph and CA-5 reproduce `detectorCost` term by term (the walk's 16 beside it,
  from each `eyJ` its run with `eyJ`, a query name's triangular number), held by an exact test and a URL vector at the
  budget's edge; `\E`, `\x{1b}` and U+009B are boundaries, and the non-boundary examples end in a letter or a digit,
  each list pinned by exact tests; the `not_used` exception holds when replies are on (a vector pins replies off); at
  a misplaced copy the budget line says the copy is not read and should be removed; the merge notes name the
  specification README, SCR-03's four scenarios, main `7213463f`, every vendored protocol table, and the live
  manifest's third failing place.
- Round 17, the coordinator's decision on thread `b6820b97` (message `5a1334d1`), answering a producer who asked
  whether the declaration needs an `untrusted_input` field: it gains none. Instead a new item, DEC-0150 CA-8, and a
  section of the page, [Text from a channel is data](../specification/channel-agent.md#text-from-a-channel-is-data),
  state a duty of every channel agent: text from a channel (a message, a caption, a file name, a link, a quoted reply)
  is data, and the agent takes no action because a channel message asks for it, acting on its own task and its
  operator's word (and the reply path the operator configured). A flag whose `false` is valid would be false. The
  conformance page gains a row for it, checked by the agent's own test.
- Round 17's readings (on `45d741b5`: unit pass with one risk and one note, product two breaks), with the
  coordinator's decisions applied: CA-8 is bounded, not an override of the standard's section 4.10 and section 10's
  `account` row: a channel message is the operator's word only when the transport identifies its sender as the
  operator (an allowlisted numeric user id as OC-3 binds it, or the account's owner on an `account` channel), never by
  a name, a display name or text in the message; that word is carried out as section 4.10 says and recorded as AP-3
  says, and quoted or forwarded text stays data; it agrees with CT-220 and is no narrowing. The page adds that a member
  such as `untrusted_input` makes the declaration not declared (`FAC-SEM-162`, closed objects). The page's intro, the
  specification README row, the DOCMAP row, CONTEXT.md's "Channel agent" and CT-209 name CA-8; the merge post below
  carries CA-8 and the `autonomy.answeredTickets` ask; the adoption paragraph names each producer's own test of CA-8;
  the merge notes name both conformance rows and DEC-0152 and DEC-0153. A new vector, a manifest with no
  `provider.extensions` and only a heavy misplaced copy, pins its view: not declared, the copy's `FAC-SEM-162` line and
  the `FAC-SEM-165` line asking for its removal. The seam reading of round 17 failed on the same CA-8 and section 4.10 break, already bounded: CA-8, item 8 and the
  conformance row now name section 4.10 and cite DEC-0121 AP-3 for where the operator's word comes from; the merge
  post asks the owner to fold CA-8 and its bound into section 4; the sibling notes give the schema count with
  DEC-0149, DEC-0150 and DEC-0153 (150) and the merge steps for DEC-0153 and DEC-0152; main is `ed4d6aa7`. Superseded by round 21.
- Round 18 of the readings (on `25e68f25`: unit pass with one note, product one break), with the coordinator's
  decisions applied, the safest reading, which keeps AP-3's prompt-injection boundary closed: CA-8 adds no source to
  DEC-0121 AP-3. A word recognised in a chat is not one of AP-3's sources: it acts only inside that chat, lifting the
  agent's holding rules there as section 4.10 says, never sets `_meta.decision` for a service action (AP-2), never
  starts a mandate (MD-1) and never reaches an action outside that chat; a decision beyond the chat comes through
  AP-3's own routes, and DEC-0121 is not annotated. On an `account` channel a message is the owner's word only when
  the owner is the operator and the session owner's send record shows it neither sent by an agent nor relayed from the
  ticket board. A request inside the agent's own task is the task; what stays data is text that tries to change the
  task, its tools, recipients, spend or access. CT-220 is cited as open. The page, item 8 and the conformance row say
  the same; the merge post asks the standard's owner the `account` question. Superseded by round 21.
- Round 18's seam reading (on `25e68f25`: one merged-tree break), with the coordinator's decisions applied: once
  DEC-0149 lands, a non-blocking line exits 0 (`severity: "accepted"` only), and `FAC-SEM-164` sets no severity and
  exits 1, so the behaviour stays and the words change: wherever this branch called `FAC-SEM-164` non-blocking (the
  page's item 4 and narrowings, DEC-0150's CA-4, the conformance row, the vectors' text) it now says the reader keeps
  the declaration declared and `pnpm validate` still reports it and exits 1. A chat word is recorded in the agent's own
  audit, quoting the message and its sender id, since it sets no AP-3 decision record. The merge notes add DEC-0149's
  exit contract, the schema counts (147, 147, 148; 150 set by hand by the last lander), CAS at landing for the next
  free ids, and `test/support-quality.test.ts` reading the channel kinds from the schema's enum.
- Round 19 of the readings (on `b3f14717`: unit pass with one risk and one note, product one break), with the
  coordinator's decisions applied: CA-8's channels are those the agent answers people on, the ones its declaration
  names; the operator channel is not one of them, a word there stays one of DEC-0121 AP-3's sources (AP-3, OC-1,
  OC-5), and where one bot serves both only the operator channel's bound chat is the operator channel; OC-3 is the
  binding method CA-8 borrows. The page states the response to the operator's out-of-chat word (answered in the chat,
  without acting, naming the route), SCN-043 gains it and a customer's injected request as alternative paths, and the
  merge post asks the standard's owner to fold it in. CT-220 is "to be read with" CA-8 when it is drafted. DEC-0150's
  Source names rounds 1 to 19 and round 18's decision. The vectors' text says a reader does not read the
  recommendation, and the renamed vector pins its view (declared, with its `FAC-SEM-164` obligation). Superseded by round 21.
- Round 20 of the readings (on `5a68ce3a`: unit pass with one risk, product three breaks), with the coordinator's
  decisions applied, round 19's response corrected: the out-of-chat response sends nothing in a chat another person can
  read; the agent tells the operator where only the operator reads it (the operator channel when bound, else its own
  session or its daily report), and answers in the chat only when it is the operator's own private chat with the agent.
  The page, CA-8, the conformance row and SCN-043 carry that sentence in one wording (`git grep -n 'outside the chat'`
  prints one line in each). CA-8's scope is the channels the agent answers people on, declared or not; one wording for a
  bot that serves both; a word in a customer chat is carried out there only and is no AP-3 source, which CT-220 keeps
  when drafted; a chat word is no OA-2 relay source (delegation.md unchanged); the operator's chat word is no customer
  ticket and is not counted in section 5.1's figures; OC-7 is cited beside OC-5. The page drops the count of vectors
  that carry a view. SCN-043's Coverage says each producer's own test is owed, and FLW-29's rejected shape gains the
  chat word. The vectors' text gives both holding-reply clauses of `FAC-SEM-164` with its replies on. DEC-0150's
  Source names rounds 1 to 20 and the decisions of rounds 19 and 20. Superseded by round 21.
- Round 20's seam reading (on `5a68ce3a`: the scope break, already fixed at `a6f5ec10`), with the coordinator's
  additions: the operator channel's page says that when the agent's bot also answers people, OC-3, OC-7, OC-12 and
  OC-14 to OC-16 bind only the operator channel's bound chat, and every other chat is bounded by CA-8 and the standard
  (staff messages read for the quiet window, the answer under the asked message, sections 4.8 and 10); the adoption
  paragraph's test names the private response; FLW-29 gains the chat word as an entry point and a branch. Superseded by round 21.
- Round 21 of the readings (on `62ec2364`: unit pass, product two breaks from clauses added in rounds 19 and 20),
  with the coordinator's decision: CA-8 shrinks to what the standard and AP-3 already support, in one wording on the
  page, in DEC-0150's item 8 and in the conformance row: text from a channel is data and a request inside the task is
  the task; CA-8's channels, declared or not, with the operator channel kept an AP-3 source; the operator's word only
  when the transport identifies the sender, acting only inside that chat as section 4.10 says, no AP-3 or OA-2 relay
  source, the customer ticket keeping its ticket, outcome and counts; the audit quote; `untrusted_input` not declared.
  Removed: the private out-of-chat response, the "not a customer ticket" sentence and "no narrowing" (the
  identification bound is sent to the standard's owner). The merge post gathers the questions for the standard's owner
  in one item. The operator channel's page keeps OC-12 in every chat, scopes only OC-3, OC-7 and OC-14 to OC-16 to the
  bound chat, gives OC-17's figures to a shared receiver, leaves the update order open, and names DEC-0150 in its
  header. SCN-043's alternative path and FLW-29 (node W now connected) match; the adoption test follows CA-8.
- Round 21's seam reading (on `62ec2364`: the shared-bot scoping left binding with no defined chat and DEC-0034 and
  DEC-0035 unannotated), with the coordinator's decision: DEC-0150 does not amend the operator channel's rules. The
  paragraph after OC-2 and DEC-0150 in the page's header are removed, so `operator-channel.md` is main's text again
  (`git diff origin/main -- docs/specification/operator-channel.md` prints nothing). CA-8 (b) says the operator channel
  is not one of CA-8's channels and stays a DEC-0121 AP-3 source (AP-3's own sentence; OC-5 and OC-7 for its form),
  without OC-1; one bot serving both is not covered and keeps every operator-channel rule in every chat as written, and
  the case joins the merge post's questions. A landing note appends CA-8's bound to CT-220's row after merging main.
- Round 22 of the readings (on `873208a5`: unit pass with one risk and one note, product one break), with the
  coordinator's decisions: the merge post's section 5.1 item names DEC-0151's ask (CT-210 (d): `autonomy.answeredTickets`,
  `stability.safeReplyTurns`, `stability.safeReplyTickets`, deferred), posted once, and the landing list names all
  three; CA-8 adds that until the owners answer a bot that serves both cannot answer people in a group as the standard
  asks (the operator channel gets its own bot, OC-2), and that the ticket stays a customer ticket, its outcome set and
  counted as sections 3 and 5.1 say; SCN-043's Anna path is a private chat, the hold that agent's own (section 4.10) or
  its approval-held draft (section 3), while a service's hold behind `approve-reply` waits for AP-3's sources; the Done
  entries of rounds 17 to 20 whose clauses were removed say so; the vectors' text and a stale comment and test title
  follow the nullable member's one-line failure and the none form. Superseded by round 23.
- Round 22's seam reading (on `873208a5`: a widened quote), with the coordinator's decisions: the page, DEC-0150 item
  8 and the conformance row quote section 4.10 exactly ("outranks every holding rule of the agent for that chat") and
  add that a send held by the transport's owner (section 9) or behind a service's relayed action stays held until a
  decision comes from AP-3's sources; a sibling note keeps DEC-0151's and DEC-0153's support-quality rows at the
  DEC-0153 step. Superseded by round 23.
- Round 23 of the readings (on `7a0b05b6`: unit pass with a risk and notes, product and seam one break each), with the
  coordinator's decisions: the held-send sentence is scoped to the chat word (a section 9 hold ends under the owner's
  approval rules; AP-1 and AP-2 still take the service's page, an accepted elicitation and the host's click); the
  shared-bot sentence rests on OC-3, OC-4 and OC-14 and asks for a bot of the operator channel's own, and the merge
  post's question adds OC-3 and OC-4; SCN-043 and FLW-29 name the chat as an `account` channel, the operator's own
  account, whose session owner's hold stays under the owner's approval rules; three vectors pin `untrusted_input` at the
  top, in a project and in a channel; stale comments in `src/channel-agent.ts` are reworded. From DEC-0151's round-16
  product reading, the merge post drops two daily-payload items the standard owner's commit `86c49ec` answered (the
  section 5.1 names, applied, board message `b840a16b`; the unit of `toPerson*`, turns), and the shared-channel quality
  hold now lasts until the standard's section 11 accepts by period what DEC-0151's withholding list names, not until
  DEC-0151 lands (round 24 quotes that list in the post).
- Round 24 of the readings (on `8ad595b9`: unit notes, product one break, seam passed with risks), with the
  coordinator's decisions: the merge post's shared-channel item cited `support-quality.md`'s observed-check paragraph,
  which only DEC-0151's branch has; the post now quotes the list itself, citing DEC-0151 in progress at
  `agent/sqd-fields-20261104` `69db2177` (chosen over posting the item with DEC-0151's landing). The page's and DEC-0150's
  Compatibility state round 4's section 5.1 as round 4's beside the owner's master since `86c49ec`, and say a shared
  channel stays withheld after DEC-0151 lands until its readers adopt, so the observed check reads missing until section
  11 accepts that by period; the Open list follows. The merge post asks whether section 10's `account` row "holding
  rules" include the session owner's section 9 hold. FLW-29's node W branches to an account channel and to the agent's
  own customer bot. DEC-0150's Consequences add SCN-055 and SCR-03; the round-22 entries are marked superseded; a
  sibling note tells CT-218's drafter that an agent with a manifest declares only there; a vector pins `untrusted_input`
  in the sparse reviews channel.
- Round 25 of the readings (on `d5fad236`) was clean; its landing edits were deferred. Round 26 (on `d5fad236`: seam
  one break, product and unit notes) was not clean: the DEC-0153 sibling line went stale when DEC-0153 moved to
  `ada7c23d` (OD-9: the descriptor extension `ops-digest/0.1`, a ninth extension key, a third schema, `FAC-SEM-168`).
  With the coordinator's decisions: the merge notes give the schema count 151 with all three branches, both extension
  constants and interop rows with "nine extension keys", `NOT_SWEPT`, `FAC-SEM-166` to `FAC-SEM-168`, and the next free
  ids from CAS; the `keyShaped` step drops `JWT_SHAPE` from its import. Round 25's deferred edits: the merge post quotes
  DEC-0151's observed-check sentence verbatim from `69db2177` (round 24's paraphrase was not a quote), re-taken at
  posting time with a substring check; the CT-218 note keeps the page's condition; SCN-043 gains the bot case and
  FLW-29's edge to node B says it is not the operator channel's bot; the Compatibility names the renames member by
  member and says a shared channel is withheld from DEC-0151's landing until its readers adopt; the FAA-197 item asks the
  adapter to re-quote CA-8. Round 26's notes: SCN-055 step 3 lists `FAC-SEM-164`'s findings; the merge post asks whether
  the operator's chat decision on an `account` channel is meant to be read by the customer; the page warns about `sk-`
  language tags (a test pins `sk-SK` and `sk-Latn-SK-u-ca-gregory`); the walk order is stated and a vector pins an
  integer-like key read before a heavy member; `roleOf` uses `Object.hasOwn`.
- Round 27 (on `ee163e5b`) was clean; its findings, deferred to landing, are folded in now. Round 28 (on `ee163e5b`:
  product one break) was not clean: SCN-043 and FLW-29 put the operator in Anna's private chat with a bot, where only she
  and the bot write; the path is now a group the agent's own bot answers (`telegram_group`), and the merge post asks
  whether the group reading the operator's word is intended and whether the ticket ends `answered` or
  `answered_elsewhere`. CA-8, on the page, in item 8 and in the conformance row, adds that the operator is a person's own
  user id and a message with `sender_chat` set never is, that an unattributable `account` message stays data, the wider
  list of channel text, the customer identified by the channel, and the cases a producer's test covers at least.
  `detectorCost` charges the shared detector's long-run near miss (min(length, 39) per code point of each base64 run
  shorter than 40), named beside the provider prefixes on the page and in CA-5, with exact tests, a timing case and the
  budget-edge vectors recounted; the timing baseline's prose is now run-free (its letters outside ASCII), since ASCII
  words now cost about four times as much and the budget would stop the baseline after about 57 strings.
  `hint/declaration-only` stands at `/` and says a bare declaration's lines may name members as written; a landing step
  runs that path instance-free after DEC-0149. Round 27's findings: the `sk-` tag advice stays under DEC-0151 (a tag with
  a digit stays a key; a test pins four tags); the quote ends with a full stop; the walk-order vector carries
  `inputText`, and the order is written with array-index keys; the stale branch count in `vitest.config.ts` is dropped;
  the schema count names its three places; the adoption covers every producer declaring the key and asks about
  `first_reply_from`; the sibling lines name the auto-merging files and the one CT-217 row. From round 28's seam reading:
  the reserved-codes sentence is dropped outright, with a line for PR #235's lander; the DEC-0151 list says what happens
  if DEC-0151 lands first; the schema-count conflict at the DEC-0153 step is textual; the installation-valued row has
  one filer; the live manifest producer fails at one place. Superseded by round 29 for that producer's count, which
  was false.
- Round 29 of the readings (on `34f9f6ba`: unit pass, product and seam one break each) was not clean: the adoption
  paragraph paraphrased the page's minimum cases, and the bare-path landing step was incomplete. With the coordinator's
  decisions: adoption rows quote the page's minimum-cases sentence verbatim at posting time; the landing step keeps a
  reworded second hint sentence (map keys) and names every dependent it changes, with its check; `runRereads` charges
  the three partitions the shared detector's readings split a string into (the class; without `=`; without `=` and `/`),
  so a near miss split at `=` is bounded, with an exact test and a timing case; the producer's failing places are read
  at posting time, with no count; the minimum cases add the headline case and a chat word never setting
  `_meta.decision` or an OA-2 relay, and make the operator-channel case conditional; the task is what sections 4 and 6
  ask, its list an example; "cannot attribute" is the send-record test; SCN-043's group bot receives every message and
  the out-of-chat example is Bob's review in another chat; the conformance row carries the bound sentence; the timing
  baseline's note says its prose is Cyrillic; the DEC-0153 line is re-measured at `be737b89` and splits auto-merging
  from pairwise-conflicting files. The local ASCII prose baselines in the timing tests now use the same run-free prose.
- Round 30 of the readings (on `6998c611`: unit and seam pass, product one break) was not clean: the page named OA-2
  and `_meta.decision` without defining or linking them. With the coordinator's decisions: both are linked and defined
  in one clause each, the same in the page, item 8 and the conformance row; on an `account` channel the word counts only
  where every other session of the account is the operator's own (a send record shows only "not sent through the
  session owner"), on the page, item 8, the row, SCN-043 and FLW-29's node K; the merge post's identification question
  says so and adds that mail, store reviews, public comments and team chats have no operator identification yet; the
  operator's user id is bound in a private chat with the agent's own bot; the Bot API row in `docs/evidence/sources.md`
  adds `sender_chat` and the privacy-mode rule (10.3, re-read 2026-11-05). Unit: `detectorCost` charges 4
  (`ARG_PIECE_COST`) for each white space, `=`, `/` and `\` of a string not read as a URL (the argument reading's
  pieces), with timing cases for 4096 separators and the budget-edge vectors recounted; the split case asserts the stop
  on the budget; the scaling and URL timing tests take the least of several runs; the baseline comment gives the prose
  costs. The bare-path landing step names where the switch goes.

## The branch and its history

The work is on `agent/channel-agent-ext-v3-20261104`, built on `origin/main`; the earlier branches were deleted, and
the pull request comes from the v3 branch only.

## Decisions taken in this run beyond the request

- The declaration is reported, never refused with the manifest or the well-known answer: their schemas keep the key
  open, and an invalid value is a finding a reader treats as not declared (as the actions and load keys are).
- The patterns of the usage report's limit id, the board's project id and a capability name are repeated, not
  referenced, so a kit vendors one schema file; a test holds them equal.
- Grammars the standard leaves open: a tier code `^[a-z0-9_]{1,32}$` and a channel id `^[a-z0-9][a-z0-9_-]{0,63}$`,
  each with no run of 7 digits; an id admits no `@`, slash, space or run of 7 digits; `suite` and `outbox` are paths
  relative to the agent's repository; durations in days, hours, minutes and seconds only, above zero except a source's
  `cadence`; `days` as days and ranges; `tz` as an IANA name of one to three segments; texts 1 to 4096 code points,
  keyed by BCP 47 tags of at most 35 characters; `read` a word. `tiers`, `declined_sources` and
  `recorded_decisions` are optional; `handoff_queues` is required and may be empty; `spend_record` optional and
  nullable.
- A final text is owed by a channel that replies, and an em dash or a blank text in a declared text is a finding, from
  section 2.4's send checks.
- FAC-SEM-162 names failed keywords with their places (member names the schema does not declare written `*`) and,
  beside each failed keyword, the schema's limit (values, pattern, length in code points, count, bound, format, the
  type alone for a failed type, and a nullable member's failure as one line, its value branch's, ending ", or null",
  with no `oneOf` line and no line for the `null` branch), not Ajv's schema paths, which are relative to a `$ref`'s target.
- Four members keep another owner's grammar, repeated in the schema: `question_route.target` (the board's project id),
  `gap_registry.capability` (a capability name), `evals.spend_record` (the usage report's limit id) and a queue's
  `recommendation` (the board's `opaqueId`).
- `channelAgentView` answers as `connectionsView` does: `declared: false, reported: false` with no key,
  `declared: false, reported: true` with the findings (FAC-SEM-162, FAC-SEM-165, FAC-SEM-163, or the rest not read),
  `declared: true` with the obligations FAC-SEM-164 found; every line names the rule and the place
  (`FAC-SEM-162 at <place>: <keyword> (<limit>)`, `FAC-SEM-165 at <place>`), and a manifest whose only copy is
  misplaced is reported where that copy stands, with document places.
- An oversize or schema-invalid declaration is still walked for credentials within the budget, in the view as in the
  rules, so a 100 000-member object reports `FAC-SEM-165 at /` (the rest not read) beside its `FAC-SEM-162` line.
- `channel-agent-standard/1` joins the protocol register (`src/protocol-revisions.ts`), since the schema pins it.
- Credential shapes for the slot cases a provider might scan for (an AWS or Slack key) are built at run time in
  `test/channel-agent.test.ts`; the vector file carries only `sk-` shapes of repeated or made-up characters.
- The detector stays shared and by shape: an ordinary hyphenated id that starts with `sk-` and holds a mixed run
  (the valid channel id `sk-support-desk-faq-answers-2026-v2`) is a `FAC-SEM-165` finding; the page says not to start an id with `sk-`.

## Open

- Section 5.1's daily payload: until DEC-0151 (in progress on CT-210, branch `agent/sqd-fields-20261104`) lands, an
  agent following round 4's section 5.1 emits `support-quality-daily/1` payloads this contract refuses; DEC-0151, in
  progress, proposes how the seven channel kinds map to `/1`'s four. The owner's master since `86c49ec` renames
  `autonomy.answered` to `autonomy.answeredTickets`, and `stability.fallbackTurns` and `fallbackTickets` to
  `stability.safeReplyTurns` and `safeReplyTickets`, and takes `toPerson*` in turns. Under DEC-0151's rule 1 a shared
  channel is withheld from DEC-0151's landing until its feed's readers adopt, so the observed per-project check reads
  missing until the standard's section 11 accepts that by period.
- What section 11 asks and no declaration can show (DEC-0150 CA-6): the side among the standard's sides, the route's
  capability for the side's kind, a tier's fact among the customer facts, the existence of the named agents,
  capabilities, desk and limit, a working-time limit's calendar, and everything the signal server observes.
- The adoption, owed by the Fabric Agent Adapter, its row FAA-197 on its main: its
  `check_service.py` vendors the schema and the vectors and reports, never fails, a declaration it reads as not
  declared while live producers still publish declarations written before this revision (each producer's own row is
  filed before the adapter re-pins); at its re-pin both register twins, `fabric_protocols.py` and
  `fabric-protocols.mjs` (held equal by its feed-protocols twin test), gain `channel-agent-standard` `['1']`, the
  feed-protocols vectors are vendored again, and the Fabric Dashboards sample service's protocol table is updated (or
  recorded as not held equal to the register). Then a later decision moves the key to version 1 (CA-7).

## Merging beside the branch of CT-194 and the other open branches

With DEC-0149's branch, now `origin/agent/ct194-source-manifest-v2-20261104` (the earlier name is deleted from
origin), whichever lands second:

- sets the schema count in `test/schema-compilation.test.ts` to 148: the count merges silently at 147 and must be set by
  hand (DEC-0149 and DEC-0150 write 147, DEC-0153 149; with all three on main the last lander sets 151 by hand in the
  title, `toHaveLength` and `toBe`, the Set size; check: `grep -c 151 test/schema-compilation.test.ts` prints 3);
- reads the CLI's "blocking" as DEC-0149's exit contract: after DEC-0149 lands, a non-blocking line is one with
  `severity: "accepted"`, which exits 0; `FAC-SEM-164` sets no severity, so `pnpm validate` reports it and exits 1
  (SCN-002), while a reader keeps the declaration declared; this branch's text says so and never calls it
  non-blocking;
- puts the register in code order: `FAC-SEM-155`, `156` to `160`, then `162` to `165`;
- reads the next-free markers (DEC and SEM) from the CAS refs at landing (when last read, DEC next 154 and FAC-SEM next
  169), not from either branch, and keeps one "Next free ID" line in `docs/DECISIONS.md` and one "Next free rule code"
  line in conformance.md;
- adds the comma at the end of the catalogue's last row before the other branch's rows;
- resolves the `vitest.config.ts` include line, which conflicts textually (git 2.55), into one coverage `include` line
  holding both branches' lists (two `include` keys would let the later one drop `src/validator.ts`), and keeps
  `src/channel-agent.ts`, `src/source-rules.ts` and `src/validator.ts` at a branch floor of 100; check:
  `grep -c 'include: \["src/' vitest.config.ts` prints 1 and `grep -c '^\*\*Next free rule code'
  docs/specification/conformance.md` prints 1;
- on conformance.md's clients table keeps CT-194's text for the actions row and appends this branch's two rows (the
  channel agent's declaration and CA-8); check: `grep -c '^| an agent that answers people on a channel'
  docs/specification/conformance.md` prints 2;
- finds `rawValues` in `src/secret-shape.ts` already the same lines on both branches, and on the merged tree runs
  `pnpm vectors:check` and `test/channel-agent.test.ts` against CT-194's `secret-shape.ts`;
- keeps both branches' rows in `docs/backlog.md` and in `docs/handoffs/README.md`;
- DEC-0149 holds SCN-054 ("Check an agent's source before handing it over"); this branch's reader scenario is SCN-055
  (SCR-03 then lists "SCN-001, SCN-002, SCN-054, SCN-055"); check: `grep -c '^### SCN-05[45]' docs/ux/scenarios.md` prints 2 on the
  merged tree;
- whichever of DEC-0149 and DEC-0150 lands second states DEC-0149's source tree check as current where this branch
  writes it in progress (item 4's `sk-` sentence, `FAC-SEM-158`);
- at this branch's landing, if main then holds DEC-0149's one-pass `hasJwt`, the landing step switches `keyShaped` in
  `src/channel-agent.ts` from `JWT_SHAPE.test` to `hasJwt`; if DEC-0149 lands after this branch, its lander does; and
  drops `JWT_SHAPE` from the import of `./secret-shape.js` (`noUnusedLocals`; without it `tsc` fails with TS6133);
  CT-212 is left unchanged (once switched, `keyShaped` is no `JWT_SHAPE` caller);
- at landing, the DEC-0150 lander files (its one filer; the DEC-0149 lander only confirms the row exists; check: `grep
  -c 'installation-valued' docs/backlog.md` prints 1) the backlog row DEC-0149 owes at the DEC-0150 step, at the next
  free CT id then: a source export's installation-valued members of a channel-agent declaration (`tickets.token_slot`'s
  vault project and env, `evals.spend_record`, the per-project entries), checked against the source slots;
- after DEC-0149 lands (its `formatSchemaErrors(errors, { instanceFree: true })`), runs the bare `--schema
  service-channel-agent-extension.schema.json` path instance-free (the switch ORs the schema into `formatSchemaErrors`'
  `instanceFree` option only, never into `sourceCheck`, which returns before every hint) and rewords the second sentence
  of `hint/declaration-only` to "A bare declaration's lines may name a map key as written (a language tag shaped like a
  credential included) and print one line per item, since widths are not checked first here.", changing in the same step
  every dependent: `readerHints`' text in `src/validate-cli.ts`, the 'may name its members as written' assertion in
  `test/validate-cli.test.ts`, the page's paragraph on a bare declaration (`channel-agent.md`, "Where it is declared"),
  SCN-002's errors line in `docs/ux/scenarios.md`, and CT-209's "Owed as a follow-up" text in `docs/backlog.md`; check:
  a declaration with `texts.final["sk-Latn-150-u-ca-gregory"] = 5` prints a hint naming map keys, and `grep -n 'as
  written'` on the page and in the scenarios matches the landed output;
- leaves `detectorCost` normative: once DEC-0149's one-pass `hasJwt` lands, the `eyJ` term no longer describes this
  repository's detector, and stays as a bound any port's detector may need (the page and CA-5 already say so).

DEC-0150's lander drops the conformance.md sentence "`FAC-SEM-155` to `FAC-SEM-161` are reserved by open branches
(CT-194 and PR #235)" outright, whichever of PR #235 and CT-194 lands first: the register rows and the CAS counter carry
the reservation, and a rewritten sentence would survive PR #235's merge unseen by the docs check. It keeps CT-194's own
sentence that `FAC-SEM-161` is unused. For PR #235's lander: keep DEC-0148's body in id order and drop any sentence
reserving `FAC-SEM-155`. Check, on main with DEC-0149, DEC-0150 and PR #235: `grep -c 'reserved by an open
branch\|reserved by open branches' docs/specification/conformance.md` prints 0, and the DEC headings stand in id order.

The conflict between CT-194 and DEC-0151 (in progress) in `src/secret-shape.ts`, and the source-rules tests, are those
two branches' to settle; DEC-0150 is not party to them: this branch changes only `rawValues` there, in CT-194's lines.

One line per sibling and per file it shares with this branch:

- DEC-0151 (in progress, branch `agent/sqd-fields-20261104`): `docs/DECISIONS.md`; `docs/DOCMAP.md`, where DEC-0151's support quality
  row comes first and this branch's channel agent row after it; `docs/backlog.md`; `docs/handoffs/README.md`;
  `docs/specification/support-quality.md`; `docs/specification/README.md`; `docs/specification/identifiers.md`, where both add a bullet under "Compared
  as written" for `project:<slug>` and the second lander merges them into one. On the merged tree, run
  `pnpm vectors:check` and `test/channel-agent.test.ts` against the in-progress DEC-0151's final `src/secret-shape.ts` (no `/i`,
  provider prefixes in their canonical case, a strength rule for `sk-`).
- DEC-0152 (branch `agent/ct217-board-same-turn-20261104`): the registers only (`docs/DECISIONS.md`, `docs/DOCMAP.md`,
  `docs/backlog.md` with its row CT-217, a different row of `docs/specification/conformance.md`) and
  `docs/handoffs/README.md`, where both branches add a top row and both are kept; `docs/backlog.md` keeps one CT-217
  row, DEC-0152's.
- DEC-0153 (branch `agent/ct219-ops-digest-20261104`, re-measured at `be737b89` (149 schemas, "eight extension keys" on
  its side, `FAC-SEM-166` to `FAC-SEM-168`), with OD-9: the descriptor extension `ops-digest/0.1`, a ninth extension
  key, a third schema and `FAC-SEM-168`): `docs/DECISIONS.md`; `docs/DOCMAP.md`; `docs/backlog.md`;
  `docs/handoffs/README.md`; `docs/specification/conformance.md`; `docs/specification/README.md`;
  `docs/specification/interop.md`; `CONTEXT.md`; `fixtures/catalogue.json`; `src/extensions.ts`;
  `test/consistency.test.ts`; `test/positive-sweep.test.ts`; `vitest.config.ts`; `test/schema-compilation.test.ts`;
  auto-merging: `src/protocol-revisions.ts`, `docs/specification/service.md`, `src/semantic-rules.ts` and
  `tools/vectors/run.ts`; `CONTEXT.md`, conformance.md and `fixtures/catalogue.json` conflict pairwise (`CONTEXT.md`
  auto-merges only in the chain after DEC-0149 and DEC-0151). With DEC-0149, DEC-0150 and DEC-0153 all on main the
  schema count is 151: each side writes 147 or 149, and at the DEC-0153 step the lines conflict textually (they do not
  merge silently), so the last lander sets 151 by hand in the title, `toHaveLength` and `toBe` (the Set size) of
  `test/schema-compilation.test.ts` (`grep -c 151` prints 3). The second of DEC-0150 and DEC-0153 to land keeps both
  constants (`channelAgent` and `opsDigest`) in `src/extensions.ts` and in `test/consistency.test.ts` (its title naming
  both keys), keeps both rows in interop.md's table, and writes "nine extension keys" there: the count line merges
  silently as "eight", and no check catches it. `NOT_SWEPT` in `test/positive-sweep.test.ts` keeps both extension
  schemas. The merged tree keeps one coverage `include` line holding every branch's list, with `src/ops-digest.ts`'s
  floor beside the others; `test/positive-sweep.test.ts`'s `sources` holds both `source-rules` and `ops-digest`;
  `test/rule-tolerance.test.ts`, where either branch adds a kind, holds both, with a comma between them; the catalogue's
  last row before the other branch's rows gains its comma; and conformance.md's register adds `FAC-SEM-166` to
  `FAC-SEM-168` after `165`, the next free `FAC-SEM-169` and `DEC-0154` read from the CAS refs at landing. Checks on the
  merged tree: `grep -c 'nine extension keys' docs/specification/interop.md` prints 1, `grep -c 'toHaveLength(151)'
  test/schema-compilation.test.ts` prints 1, `grep -c 151 test/schema-compilation.test.ts` prints 3, and `channelAgent`
  and `opsDigest` both stand in `src/extensions.ts`.
- At the DEC-0153 step: keep DEC-0151's support-quality rows (conformance.md's clients table, `docs/DOCMAP.md`, the
  specification README) and DEC-0153's new rows, never main's older support-quality rows; check: `grep -c '^| an agent
  that answers people, publishing its support quality' docs/specification/conformance.md` prints 1 on the merged tree.
- For CT-218's drafter: the page's condition holds (CA-1): a service with a manifest declares only there, and a reader
  that knows the manifest (its descriptor's `fabricManifest` or the registry's provider entry) ignores a declaration in
  the well-known answer, while a reader holding only the well-known answer reads it. CT-218's drafter decides which of
  the two a remote instance's readers get.
- PR #235: `docs/DECISIONS.md`; `docs/backlog.md`; conformance.md's next-free line; conformance.md's register, the
  `FAC-SEM-155` row before `156`.
- Main moves while this branch waits (it is `ed4d6aa7` after PR #241, with CT-219 and CT-220 at the backlog's tail,
  when this was written): the lander re-measures main at landing and merges or rebases over it; `docs/backlog.md`
  conflicts only at the tail, where the rows stay in id order (`CT-204`, `CT-205`, `CT-206`, then this branch's
  `CT-209`, then `CT-215` to `CT-220`), and any row an open branch adds takes its place by id.
- for CT-220's drafter (the coordinator owns CT-220): CT-220, when drafted, is to keep CA-8's bound (the
  coordinator's decision of round 20): a word recognised in a customer chat acts only inside that chat and is not a
  DEC-0121 AP-3 source;
- after merging main, the lander appends to CT-220's row in `docs/backlog.md` "keeps DEC-0150 CA-8's bound: a word in a
  customer chat acts only there and is no AP-3 or OA-2 source"; check: `grep '^| CT-220' docs/backlog.md | grep -c
  'CA-8'` prints 1;
- CT-220, which the page and DEC-0150's CA-8 cite as open: the landing confirms that the CT-220 row resolves in
  `docs/backlog.md` after merging main (it is on main at `ed4d6aa7`, not on this branch).
- `docs/DECISIONS.md` keeps a blank line before each DEC heading (markdownlint MD022);
- `docs/DECISIONS.md` keeps one "Next free ID" line, equal to the CAS counter at the merge, and each DEC body in id
  order after the bodies already on main: `grep -c '^\*\*Next free ID' docs/DECISIONS.md` prints 1. (On main, the
  heading order already holds one exception, DEC-0047 after DEC-0055; a merge adds none.)

## When DEC-0150 and DEC-0151 (in progress) land

The gate of DEC-0151 (in progress) puts DEC-0150 on main first. If DEC-0151 is on main first instead, this branch's lander does every item of the list below, restates the `sk-` tag sentence and its test under DEC-0151's detector, and annotates nothing. Once DEC-0150 is on main, that change annotates DEC-0150's CA-2, CA-5,
Compatibility and Source sentences that name DEC-0151 as in progress (an annotation under DEC-0150, never a rewrite of
its body: `docs/DECISIONS.md` is append-only), and rewrites these sentences outside the register. Where this list and
DEC-0151's meeting list (its handoff, "When DEC-0150 and DEC-0151 meet on main") differ, DEC-0151's governs: its
annotate-not-rewrite instruction, the alias entry (an agent whose project's registry alias the detector reads as a
credential leaves that project's entry out until the registry changes the alias; it never renames the alias itself),
and the join sentence, worded in both lists with the adoption condition. Where DEC-0151's list quotes DEC-0150's
sentences from an older head, this list locates them on the landing head: CA-5's annotation (its `sk-` parenthesis,
"DEC-0151, in progress, proposes to narrow that ...") in `docs/DECISIONS.md`, and item 4's in-progress `sk-`
sentence on the page ("DEC-0151, in progress, proposes to narrow that to a digit with an upper-case letter and 16, or
a digit and 32"); the lander re-quotes them from the landing head. The page's budget sentences (item 4: after every other
provider prefix "anywhere and in any case", and after an `sk-` away from a boundary) are worded as a bound any detector
may need, so they stay true under DEC-0151's word-start boundary and canonical case; `keyRereads` changed after
`cd350f47`, in `fc78b510` (the other prefixes' floors) and `c201208a` (`sk-` away from a boundary), so DEC-0151's
lander compares against the landing head, not `cd350f47`. The budget comparison is the exception where DEC-0150's
landing-head reading holds over DEC-0151's quotation. The `sk-` sentence the DEC-0151 lander rewrites (item 4) keeps
the advice not to start an id with `sk-` and its second reason: a source export's tree check (`FAC-SEM-158`,
DEC-0149) still reads any `sk-` followed by 16 or more name characters in any case. The test "charges a boundary sk-
after every form the cost model recognises, and the detector finds a key after each" lists the boundary forms both
ways; the DEC-0151 lander adds every boundary form its detector's comment lists and runs it against that detector. Beside the `sk-` test named above, the tests "asks for a
rename only at a member name or an id, never at a text" and "asks for a rename by role: a text keyed id gets none, a
channel id keeps it" build their key as `sk-` and `support-desk-faq-answers-2026-v2` (32 name characters with a
digit), so both detectors find it. The join sentence keeps its condition (a
reader joins on `project:<slug>` once the feed's readers have adopted it). The list:

- the "Not decided here" bullet in `docs/specification/support-quality.md` that names DEC-0151 (CT-210) in progress:
  removed, since DEC-0151's section answers it;
- the daily quality payload bullet in `channel-agent.md#compatibility` (with the shared-channel quality check and the
  unit of `toPerson*`): a pointer to DEC-0151 and to the support quality page's channel kinds table and per-project
  keying, naming the three new rows `autonomy.answeredTickets`, `stability.safeReplyTurns` and
  `stability.safeReplyTickets`;
- "(the memory capability's pattern; DEC-0151, in progress on CT-210, proposes the same `projectAlias`)" in
  `channel-agent.md` (what the members mean), which becomes a statement that the two patterns are one;
- the sentence in `channel-agent.md` (what the members mean) that names DEC-0151 in progress and says when a reader
  joins a declaration to the payloads that carry `project:<slug>`: it states that `support-quality-daily` payloads
  carry the same alias, that a reader joins on it once the feed's readers have adopted it, and that a payload with no
  project is attributed to none;
- the sentence in `channel-agent.md` (What is checked, item 4) and the comment on `shaped` in `src/channel-agent.ts`
  that state today's `sk-` rule (16 or more letters, digits, `_` or `-`, any case) and what DEC-0151, in progress,
  proposes: they state its rule as current (a word-start boundary, the `sk-` strength, canonical case), and the `sk-`
  test re-checks whether `sk-support-desk-faq-answers-2026-v2` is still found; the advice not to start an id with
  `sk-` stays;
- the "(DEC-0151, in progress)" text in the channel agent standard's row of `docs/evidence/sources.md`, and the copy's
  path there and in DEC-0151's Context and the support quality page, which becomes a link;
- DEC-0150's Source counter sentence: annotated, so that it agrees with DEC-0151's Source and with DEC-0149's
  reservation `e27a5441` (key `ct194-source-manifest`);
- `docs/DECISIONS.md`'s next-free line: the maximum of the branches' values and the CAS counter at the merge;
- CT-209's sentences that name DEC-0151 as in progress, and its Source cell's "DEC-0151 (in progress)", in
  `docs/backlog.md`;
- the two "Compared as written" bullets for `project:<slug>` in `docs/specification/identifiers.md`, merged into one;
- an assertion in `test/channel-agent.test.ts` that the declaration's `project` pattern equals
  `support-quality-daily.schema.json` `$defs/projectAlias` (S3);
- the page's sentence on a language tag that starts with `sk-`: DEC-0151's narrowing clears a long tag only when it
  holds no digit, so the advice to write `sk` or `sk-SK` stays; the lander restates the test under DEC-0151's detector
  (`sk-Latn-SK-u-ca-gregory` then passes, `sk-Latn-150-u-ca-gregory` stays a key);
- for whichever of DEC-0150 and DEC-0151 lands second: `test/support-quality.test.ts` reads the channel kinds from
  `service-channel-agent-extension.schema.json` `$defs/channel/properties/kind`'s `enum` instead of a literal list.

## Checks actually run

On round 30's change, each exit code read separately: `pnpm typecheck` 0; `pnpm vitest run --testTimeout=60000
test/channel-agent.test.ts test/consistency.test.ts test/operator-channel.test.ts test/validate-cli.test.ts` 0 (2116
passed); `pnpm vectors:check` 0 (29 vector files match their generators, after the channel-agent generator's `--write`);
`pnpm run docs:check` 0 (markdownlint 0 errors); `python3 docs/ux/lint.py` 0; `pnpm run privacy:check` with the
organization index 0 (0 findings); no U+2014 in the added lines; `operator-channel.md` matches main. With `ARG_PIECE_COST` 4, a one-off script
read 4096 spaces, `=` or `/` at 0.71 to 0.93 of the prose baseline. The coverage run is owed: the 15-minute load was 54.55 (free disk 21 GB).

On round 29's change, each exit code read separately: `pnpm typecheck` 0; `pnpm vitest run --testTimeout=60000
test/channel-agent.test.ts test/consistency.test.ts test/operator-channel.test.ts test/validate-cli.test.ts` 0 (2115
passed); `pnpm vectors:check` 0 (29 vector files match their generators, after the channel-agent generator's `--write`);
`pnpm run docs:check` 0 (markdownlint 0 errors); `python3 docs/ux/lint.py` 0; `pnpm run privacy:check` with the
organization index 0 (0 findings); no U+2014 in the added lines; `operator-channel.md` matches main. The coverage run
is owed: the 15-minute load was 39.53, but free disk was 4.2 GB, under 8 GB.

On round 28's change (with round 27's findings and round 28's seam items), each exit code read separately: `pnpm
typecheck` 0; `pnpm run docs:check` 0 (markdownlint 0 errors); `python3 docs/ux/lint.py` 0; `pnpm run privacy:check` 0
(0 findings); `pnpm vectors:check` 0 (29 vector files match their generators, after the channel-agent generator's
`--write`); `pnpm vitest run test/channel-agent.test.ts test/consistency.test.ts test/operator-channel.test.ts
test/validate-cli.test.ts` 0 (2115 passed; `test/channel-agent.test.ts` 364). `grep -c sender_chat
docs/specification/channel-agent.md` prints 2; `git grep` of this handoff for a schema count of 150 prints nothing; the
DEC-0151 quote ends with a full stop; `operator-channel.md` matches main. The two-million-strings timing case failed
against the ASCII prose baseline once the long-run term made that prose about four times as costly (the budget stopped
the baseline after about 57 strings, so the baseline fell from about 23 ms to about 6.5 ms); with the run-free baseline
prose it passes. The coverage run is owed: the 15-minute load was 49.48 and free disk 7.2 GB.

On round 26's change (with round 25's deferred edits), each exit code read separately: `pnpm typecheck` 0; `pnpm run
docs:check` 0 (markdownlint 0 errors); `python3 docs/ux/lint.py` 0; `pnpm run privacy:check` 0 (0 findings); `pnpm
vectors:check` 0 (29 vector files match their generators, after the channel-agent generator's `--write`); `pnpm vitest
run test/channel-agent.test.ts test/consistency.test.ts test/operator-channel.test.ts` 0 (419 passed); the merge
post's DEC-0151 sentence is a substring of `69db2177`'s `support-quality.md` with line breaks read as spaces (checked
by a short script); `git grep` of this handoff for a schema count of 150 prints nothing; `operator-channel.md` matches
main. The coverage run is owed (it would also confirm `roleOf`'s new branches): the 15-minute load was 55.88 and free
disk 7.0 GB.

On round 24's change, each exit code read separately: `pnpm typecheck` 0; `pnpm run docs:check` 0 (markdownlint 0
errors); `python3 docs/ux/lint.py` 0; `pnpm run privacy:check` 0 (0 findings); `pnpm vectors:check` 0 (29 vector files
match their generators, after the channel-agent generator's `--write`); `pnpm vitest run test/channel-agent.test.ts
test/consistency.test.ts test/operator-channel.test.ts` 0 (416 passed); `operator-channel.md` matches main. The
coverage run is owed: the 15-minute load was 112.97 and free disk 7.4 GB.

On round 23's change, each exit code read separately: `pnpm typecheck` 0; `pnpm run docs:check` 0 (markdownlint 0
errors); `python3 docs/ux/lint.py` 0; `pnpm run privacy:check` 0 (0 findings); `pnpm vectors:check` 0 (29 vector files
match their generators, after the channel-agent generator's `--write`); `pnpm vitest run test/channel-agent.test.ts
test/consistency.test.ts test/operator-channel.test.ts` 0 (414 passed). Outside the handoffs, the old held-send wording
stands only in DEC-0150's Source as round 22's history, and the old shared-bot wording nowhere in the specification or
the register; `operator-channel.md` matches main. The coverage run is owed: the 15-minute load was 122.98 and free disk
5.8 GB.

On round 22's seam change (documents only), each exit code read separately: `pnpm run docs:check` 0 (markdownlint 0
errors); `pnpm ux:lint` 0; `pnpm run privacy:check` 0 (0 findings); `pnpm vectors:check` 0; `pnpm vitest run
test/channel-agent.test.ts test/consistency.test.ts test/operator-channel.test.ts` 0 (408 passed); the old, widened
section 4.10 quote is gone from the three files, and the exact quote stands once in each.

On round 22's change, each exit code read separately: `pnpm typecheck` 0; `pnpm run docs:check` 0 (markdownlint 0
errors); `pnpm ux:lint` 0; `pnpm run privacy:check` 0 (0 findings); `pnpm vectors:check` 0 (29 vector files match their
generators, after `pnpm vectors:write`); `pnpm vitest run test/channel-agent.test.ts test/consistency.test.ts
test/operator-channel.test.ts` 0 (408 passed); a `git grep` of this handoff for the old name of the stability
turns row prints nothing.

On round 21's seam change, each exit code read separately: `pnpm typecheck` 0; `pnpm run docs:check` 0 (markdownlint 0
errors); `pnpm ux:lint` 0; `pnpm run privacy:check` 0 (0 findings); `pnpm vectors:check` 0 (29 vector files match their
generators); `pnpm vitest run test/channel-agent.test.ts test/consistency.test.ts test/operator-channel.test.ts` 0 (408
passed); `git diff origin/main -- docs/specification/operator-channel.md` prints nothing.

On round 21's change, each exit code read separately: `pnpm typecheck` 0; `pnpm run docs:check` 0 (markdownlint 0
errors); `pnpm ux:lint` 0; `pnpm run privacy:check` 0 (0 findings); `pnpm vectors:check` 0 (29 vector files match their
generators); `pnpm vitest run test/channel-agent.test.ts test/consistency.test.ts test/operator-channel.test.ts` 0 (408
passed). The coverage run is still owed.

On round 20's change, and before it on round 19's (`5a68ce3a`), each exit code read separately, the same on both:
`pnpm typecheck` 0; `pnpm run docs:check` 0 (markdownlint 0 errors); `pnpm ux:lint` 0; `pnpm run privacy:check` 0 (0
findings); `pnpm vectors:check` 0 (29 vector files match their generators, after `pnpm vectors:write`); `pnpm vitest run
test/channel-agent.test.ts test/consistency.test.ts` 0 (373 passed); `git grep -n 'outside the chat'` prints one line in
each of the page, `docs/DECISIONS.md`, conformance.md and `docs/ux/scenarios.md` on round 20's change. The coverage run
is still owed.

On round 18's change (the readings of rounds 17 and 18, its seam reading included, folded in), each exit code read separately: `pnpm typecheck`
0; `pnpm run docs:check` 0 (markdownlint 0 errors); `pnpm ux:lint` 0; `pnpm run privacy:check` 0 (0 findings);
`pnpm vectors:check` 0 (29 vector files match their generators); `pnpm vitest run test/channel-agent.test.ts
test/consistency.test.ts` 0 (373 passed). On round 17's committed change, `25e68f25`, `pnpm test:fast` 0 (109 files,
10170 tests passed and 1 skipped). A declaration with an `untrusted_input` member, in a project or at the top, reads
`FAC-SEM-162` (`channelAgentRules`, run once by hand). The coverage run is owed: the 15-minute load stayed above the
heavy-run threshold of 45 (86.72, then 66.70). No U+2014 in the added text.

On the change after round 16's fixes and its product and seam folds, each exit code read separately:
`pnpm exec tsc --noEmit -p .` 0; `pnpm vitest run --coverage` 0 under the session's heavy-run lock, started at a
15-minute load of 44.43 with 11 GB free (109 files, 10168 tests passed and 1 skipped, branches 98.89 %, 12222 of
12359; `src/channel-agent.ts` 511 of 511, `src/secret-shape.ts` 47 of 47); `python3 docs/ux/lint.py` 0;
`pnpm run docs:check` 0 (markdownlint 0 errors); `pnpm privacy:check` with the organization index 0 (0 findings);
`pnpm exec tsx tools/vectors/run.ts` 0 (29 vector files match their generators); `grep -n 'the document holds more
than\|the rest was not read for credentials' docs/specification/channel-agent.md` prints nothing, and
`git grep -n 'FAC-SEM-158' docs/specification` prints one line, which says in progress. The timing tests hold the test thread's processor time against prose read to the budget in the same run. The URL-shaped strings (a tab, a carriage return or a line feed inside `eyJ`, `-%73k-` in a query) and a query of many
pieces each run within twice prose's thread time plus 20 ms; 300 strings of 2000 astral code points are read whole;
the budget's edge falls where the count says, in plain and in astral names. The organization's privacy check over the
standard's copy alone: 0 findings. A `git grep` of the change for the three terms of the product described before
neutralisation prints nothing. No U+2014 in the added text.

## Next task

The coordinator's blind readings of branch `agent/channel-agent-ext-v3-20261104` after the fixes of rounds 1 to 30 (unit, seam,
product), until two consecutive rounds are clean, as DEC-0150's Status asks; fix what blocks, as ordinary commits on that branch. Then open the pull request
and merge it, which accepts DEC-0150, and post the merge on thread `b6820b97` (the coordinator posts it). The post
quotes, at posting time, the page's [grammar](../specification/channel-agent.md#grammar) and the one list of
narrowings in [channel agent](../specification/channel-agent.md#narrowings-against-the-standard) (not copies kept
here), and adds:

- the owner's round 4 (the none form at four members in section 13.6, a source's age from its last successful read in
  section 7.1) is taken, and its neutral copy is kept byte for byte at
  `docs/evidence/specs/2026-11-04-channel-agent-standard-v1-rc.md`; one narrowing of round 4 is sent with it: a
  holding text in the none form is refused (`FAC-SEM-162`); leave the holding text out instead, which is accepted;

- only a manifest's `provider.extensions` is read: a declaration under the manifest's top-level `extensions` is
  `FAC-SEM-162` and not read;
- `channel-agent-standard/2` is refused until a contract revision;
- CA-8, the contract's own duty, for the standard's owner to fold into section 4 or reject (quoting [the
  section](../specification/channel-agent.md#text-from-a-channel-is-data) at posting time), with its identification
  bound, and one item of questions for the standard's owner: how the agent tells the operator about a request from the
  operator's word in a customer chat for an action outside that chat (CA-8 says only that it causes none); whether the
  operator's own message in a customer chat is ingested and counted (section 8.3's `items_seen` against
  `items_ingested`); in a group, whether the group (the customer included) reading the operator's word is intended, and
  whether that ticket's outcome is `answered` or `answered_elsewhere` (sections 3 and 4.8); whether `first_reply_from`
  (F-4) joins section 13.6 (until it does, the closed channel object refuses it); whether privacy deletion (section
  13.5) reaches the agent's audit quotes of the operator's words in a customer's chat; whether on an `account` channel a
  message is the owner's word only when the account's owner is the operator, the send record of section 9's one session
  owner shows it was not sent through that session owner (a send record can show only "not sent through the session
  owner", not which session sent it), and every other session of the account is the operator's own; that `mail`,
  `store_review`, `public_comment` and `team_chat` have no operator identification yet, so section 4.10 does not apply
  on them until the owner answers; whether section 10's `account` row "holding rules" include the session owner's
  section 9 hold or only the agent's own (CA-8 reads them as the agent's own, per section 4.10); whether the standard
  intends the operator's chat decision on an `account` channel to be a message the customer reads; and one bot serving
  both an operator channel and channels the agent answers people on, for the standard's and the operator channel's
  owners: where a binding code is accepted, how OC-3, OC-4, OC-12 and OC-14 to OC-16 apply to customer chats, whether
  OC-3 also refuses a message sent on behalf of a chat (`sender_chat` set, a shared placeholder sender), and the shared
  receiver's order of updates and its status (OC-17); until they answer, such a bot keeps every operator-channel rule in
  every chat as written;
- a budget above 0 without a spend record is `FAC-SEM-164`;
- to be confirmed with the standard's owner: that `question_route.daily_cap` is the agent's per-project cap, below
  the desk's side-wide cap of section 6.4, which still binds;
- to be asked of the standard's owner: whether one declaration may hold projects on several sides;
- posted on the board at landing, for FAA-197 (the adapter's adoption row, on its main), what that row lacks: both
  `PROTOCOL_REVISIONS` twins with `channel-agent-standard` `['1']` and the feed-protocols vectors vendored again; the
  check reports, never fails, a declaration it reads as not declared while live producers still fail; and the well-known
  site (`extensions` of a well-known answer) beside `fabric-agent.json`'s `provider.extensions`; and, since the
  adapter's `practices.md` (released 0.63.0) restates CA-8 as "acts on its own task and its operator's word", that it
  re-quotes CA-8 from the landed page, including the identification bound, "acts only inside that chat as section 4.10
  says" and "no AP-3 or OA-2 source";
- for Fabric Dashboards, an adoption item: its sample service's `fabric_protocols.py` register gains the
  `channel-agent-standard` row at its next pin;
- to be asked of the standard's owner: the page's "Not checked here" list names section 11 checks no declaration can
  show (the side among the standard's sides (section 14 of its master), `team.ask` against `operator.ask` as the route's capability for the side, a
  tier's fact among the customer facts, an `until` date already past); would the owner move them to the signal
  server's data or to the adapter's read-token check, quoting that list at posting time;
- to be asked of the standard's owner: a string is read as a URL only when its head opens with a scheme and passes the
  ASCII and percent rules; every other string, a sentence that holds a URL included ("Please write to
  https://u:p@help.example/"), is read for key shapes only, so a password there is not found: is that gap acceptable
  for the standard's section 11 check;
- the coordinator asks the standard's owner to hold the observed per-project quality check for shared channels until the
  standard's section 11 accepts what DEC-0151 (in progress, branch `agent/sqd-fields-20261104`, head `69db2177`)
  withholds, in DEC-0151's words (its `support-quality.md`), verbatim: "by period, the period being the event's day: a
  producer's adoption is marked by its first published day that names `project` (a project under rule 9 never names one
  and stays in the pre-adoption form). Until that day, a day without `project`, a withheld channel, and a producer whose
  only named project is alias-withheld at adoption (it has no first named day); from adoption on, a project withheld
  because its alias is read as a credential, until the registry renames it, and then that project's kept days, published
  late under the new alias". At posting time the coordinator re-takes the sentence from DEC-0151's head and checks that
  it is a substring of that head's `support-quality.md` with its line breaks read as spaces; posted with DEC-0150's
  landing;
- for each live producer, the members its current declaration fails (`FAC-SEM-162`'s places), read again with
  `pnpm validate` on its manifest or well-known answer at posting time.

At merge, one adoption row is filed for every producer declaring the key (five on 2026-11-05), each in that producer's
own backlog with its `FAC-SEM-162` places (the coordinator files them on the board), the places read again at posting
time. Each row also names the producer's own test of CA-8 by quoting, verbatim and re-taken from the landed page at
posting time, the page's sentence listing the minimum cases that test covers (never a paraphrase). Each producer's
failing places are read at posting time with `pnpm validate` on its manifest or well-known answer (no count is kept
here); earlier readings found, among others: one well-known builder with no `question_route` and a recommendation
holding a colon; one well-known builder with `null` for `question_route`, `gap_registry`, a channel's texts, a queue's
recommendation and `pd_check` (the question route, the gap registry and `pd_check` may now take the none form instead; a
`null` there is still refused). The adapter's row names the update of both `PROTOCOL_REVISIONS` twins
(`channel-agent-standard` `['1']`) with the feed-protocols vectors vendored again, and the Fabric Dashboards sample
service's copy of the protocol table (or records that it is not held equal to the register). The merge post asks every
vendored protocol table that re-pins to add `channel-agent-standard` `['1']` together with `fabric-source`: the
adapter's two twins, the Fabric Dashboards sample service's table, a product's vendored `protocol-revisions.ts`,
deployment templates' `fabric-protocols.mjs` and kit copies of `fabric_protocols.py` in agent repositories.
