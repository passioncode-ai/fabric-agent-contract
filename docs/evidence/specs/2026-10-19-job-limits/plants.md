# Plants: jobs under limits and uncertain effects (CT-55, DEC-0087)

Each refusal clause and each branch of `src/job-limits.ts` (`quotaDataOk`, the job reader, `readJobPause`,
`jobCallerAction`, `intentIdempotencyKey`, `usageFindings`, the rules), and the schema clauses of
`interop-common.schema.json` (`error`'s condition, `quotaExhaustedData`, `utcInstant`) and `common.schema.json`
(`usage`) were removed or loosened once, one at a time, and the focused tests were run (`vitest run --bail=1
test/job-limits.test.ts test/fixtures.test.ts`). A plant is killed when that run fails. The file was restored after each
plant.

40 plants; 38 killed on the first pass, 2 survived and were closed:

- **J-06, an unknown status read:** an unknown status without an `error` falls to the `failed` branch and answers
  `invalid` anyway. A caller vector "an unknown status with an error: invalid, never failed" now tells the two apart.
  Re-planted: killed.
- **J-35, quota data open:** the first plant added a property instead of opening the object, so it changed nothing. It
  was planted again as the removal of `additionalProperties: false`. Re-planted: killed.

| Plant | What was removed or loosened | Result |
|---|---|---|
| J-01 | quota data: `retryable`'s type not checked | killed |
| J-02 | quota data: another member admitted | killed |
| J-03 | quota data: a reset with `retryable: false` admitted | killed |
| J-04 | quota data: the reset not read | killed |
| J-05 | a job without an id read | killed |
| J-06 | an unknown status read | killed (after a vector) |
| J-07 | pause: the grammar not checked | killed |
| J-08 | pause: the 500-character bound not checked | killed |
| J-09 | pause: the reset's instant not read | killed |
| J-10 | pause: any status read | killed |
| J-11 | caller: a malformed pause polled | killed |
| J-12 | caller: a reset equal to `now` waited | killed |
| J-13 | caller: a pause without a reset polled | killed |
| J-14 | caller: `input_required` polled | killed |
| J-15 | caller: `cancelled` read as done | killed |
| J-16 | caller: the code's form not checked | killed |
| J-17 | caller: the message not checked | killed |
| J-18 | caller: `outcome-unknown` resent | killed |
| J-19 | caller: not retryable resent | killed |
| J-20 | caller: quota data not checked | killed |
| J-21 | caller: `notBefore` after a reset passed | killed |
| J-22 | caller: `now` not read | killed |
| J-23 | caller: another code answered `invalid` | killed |
| J-24 | key: another member admitted | killed |
| J-25 | key: the request's length not checked | killed |
| J-26 | key: the version not set | killed |
| J-27 | key: the variant not set | killed |
| J-28 | key: the request left out of the form | killed |
| J-29 | usage: `partial: false` beside `null` not flagged | killed |
| J-30 | usage: an absent `partial` read as false | killed |
| J-31 | rule: the reset's day not checked | killed |
| J-32 | rule: the result's usage not read | killed |
| J-33 | rule: the caller's act not compared | killed |
| J-34 | schema: a reset with `retryable: false` | killed |
| J-35 | schema: quota data open | killed (planted again) |
| J-36 | schema: a reset at any offset | killed |
| J-37 | schema: the code's condition removed | killed |
| J-38 | schema: `costUsd` without `null` | killed |
| J-39 | schema: `partial` of any type | killed |
| J-40 | schema: a negative count | killed |

## After the first readings

The fix round's new clauses were planted once each, the same way. 16 plants: 13 killed on the first pass; of the 3 that
survived, two were closed with a vector or a test and one is equivalent:

- **J-47, a message over 2000 code points acted on:** caller vectors "a message of 2000 characters: failed" and "of
  2001 characters: invalid" now tell them apart. Re-planted: killed.
- **J-52, the request's length in UTF-16 units:** a key vector with a request of 256 code points beyond the BMP (512
  UTF-16 units) now gets a key. Re-planted: killed.
- **J-50, an inherited status read in the job reader:** equivalent. `readJobPause` and `jobCallerAction` read the
  status again as an own member, so an inherited one answers `{paused: false}` and `invalid` either way.

| Plant | What was removed or loosened | Result |
|---|---|---|
| J-41 | the pause length in UTF-16 units | killed |
| J-42 | a blank pause text admitted | killed |
| J-43 | more than three fraction digits admitted (code) | killed |
| J-44 | more than three fraction digits admitted (schema) | killed |
| J-45 | an error with another member acted on | killed |
| J-46 | an empty message acted on | killed |
| J-47 | a message over 2000 code points acted on | killed (after a vector) |
| J-48 | `limit-reached` read as failed | killed |
| J-49 | quota data: an inherited `retryable` read | killed |
| J-50 | job: an inherited status read | equivalent |
| J-51 | key: inherited members read | killed |
| J-52 | key: the request's length in UTF-16 units | killed (after a vector) |
| J-53 | reader: `protocols` not read | killed |
| J-54 | reader: an inherited `protocols` read | killed |
| J-55 | rule: a result's usage not read | killed |
| J-56 | pause: an inherited message read | killed |

## After the second reading

| Plant | What was removed or loosened | Result |
|---|---|---|
| J-57 | the pause text's white space read as Unicode `\s` instead of ASCII | killed (the no-break space vector) |
| J-58 | the `limit-reached` vector's data without DL-19's `window` | killed (the DL-19 schema test) |
