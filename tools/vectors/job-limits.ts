/**
 * The generator of the job-limits vectors (DEC-0087): `fixtures/vectors/job-limits.json`, shared by every provider that
 * serves jobs (the pause grammar, `quota-exhausted`, `outcome-unknown`, `usage` with `null`) and every caller of jobs
 * (the next act, the intent's key).
 *
 *   tsx tools/vectors/job-limits.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/job-limits.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/job-limits.test.ts` runs the check.
 * Each expected answer is written below by hand from DEC-0087's items; the only computed value is an intent's key, a
 * UUID of version 8 over the SHA-256 of the intent's RFC 8785 form, which a port reproduces with its own RFC 8785 and
 * SHA-256 (RFC 9562 §5.5, §5.8). Nothing here imports `src/job-limits.ts`, so the gate checks that the reference
 * returns what this file expects.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/job-limits.json";

/** A version 8 UUID from the first 16 bytes of SHA-256 over the RFC 8785 form, written out step by step. */
function uuid8(intent: unknown): string {
  const hex = createHash("sha256").update(Buffer.from(rfc8785(intent), "utf8")).digest("hex").slice(0, 32).split("");
  hex[12] = "8"; // byte 6, high nibble: the version
  hex[16] = "89ab"[parseInt(hex[16] ?? "0", 16) & 0x3] ?? "8"; // byte 8, high bits 10: the variant
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

const NOW = "2026-10-19T10:00:00Z";
const LATER = "2026-10-19T12:00:00Z";
const EARLIER = "2026-10-19T08:00:00Z";
const job = (status: string, extra: Json = {}) => ({ job: { id: "job_7f3a", status, updatedAt: NOW, ...extra } });
const failed = (code: unknown, data?: unknown) => job("failed", { error: data === undefined ? { code, message: "stopped" } : { code, message: "stopped", data } });

// ---- The pause grammar --------------------------------------------------------------------------------------------

function pauseCases(): Json[] {
  const working = (statusMessage: string) => job("working", { statusMessage });
  const cases: Array<[string, unknown, Json]> = [
    ["working without a message", job("working"), { paused: false }],
    ["working with another message", working("rendering frame 3 of 9"), { paused: false }],
    ["paused, no reset known", working("quota-exhausted"), { paused: true }],
    ["paused until a UTC instant", working(`quota-exhausted until ${LATER}`), { paused: true, resetsAt: LATER }],
    ["paused until an instant with milliseconds", working("quota-exhausted until 2026-10-19T12:00:00.250Z"), { paused: true, resetsAt: "2026-10-19T12:00:00.250Z" }],
    ["paused with text", working("quota-exhausted: the subscription's 5-hour window"), { paused: true }],
    ["paused until an instant, with text that holds colons", working(`quota-exhausted until ${LATER}: window 5:00 h`), { paused: true, resetsAt: LATER }],
    ["malformed: an offset other than Z", working("quota-exhausted until 2026-10-19T14:00:00+02:00"), { paused: false, malformed: true }],
    ["malformed: a lower-case z", working("quota-exhausted until 2026-10-19T12:00:00z"), { paused: false, malformed: true }],
    ["malformed: a day that does not exist", working("quota-exhausted until 2026-02-30T12:00:00Z"), { paused: false, malformed: true }],
    ["malformed: a leap second", working("quota-exhausted until 2026-12-31T23:59:60Z"), { paused: false, malformed: true }],
    ["malformed: no space after the colon", working("quota-exhausted:soon"), { paused: false, malformed: true }],
    ["malformed: a colon and nothing after it", working(`quota-exhausted until ${LATER}:`), { paused: false, malformed: true }],
    ["malformed: another word after the code", working("quota-exhausted, retrying"), { paused: false, malformed: true }],
    ["malformed: more than 500 characters", working(`quota-exhausted: ${"x".repeat(484)}`), { paused: false, malformed: true }],
    ["at 500 characters, paused", working(`quota-exhausted: ${"x".repeat(483)}`), { paused: true }],
    ["characters are code points: 277 of them, astral, paused", working(`quota-exhausted: ${"\u{1F600}".repeat(260)}`), { paused: true }],
    ["characters are code points: 501 of them, astral, malformed", working(`quota-exhausted: ${"\u{1F600}".repeat(484)}`), { paused: false, malformed: true }],
    ["malformed: a text of white space only", working("quota-exhausted:    "), { paused: false, malformed: true }],
    ["malformed: a text of a newline only", working("quota-exhausted: \n"), { paused: false, malformed: true }],
    ["malformed: a text of a tab and a carriage return only", working("quota-exhausted: \t\r"), { paused: false, malformed: true }],
    ["white space is ASCII only: a no-break space is text, paused", working("quota-exhausted: \u00a0"), { paused: true }],
    ["white space is ASCII only: a byte-order mark is text, paused", working("quota-exhausted: \ufeff"), { paused: true }],
    ["malformed: four fraction digits", working("quota-exhausted until 2026-10-19T12:00:00.0004Z"), { paused: false, malformed: true }],
    ["the grammar binds a working job only: failed", job("failed", { statusMessage: "quota-exhausted, gave up", error: { code: "other", message: "x" } }), { paused: false }],
    ["not a job answer", { status: "working" }, { paused: false }],
    ["a job without an id", { job: { status: "working", statusMessage: "quota-exhausted" } }, { paused: false }],
    ["null", null, { paused: false }]
  ];
  return cases.map(([name, answer, expected]) => ({ name, answer, expected }));
}

// ---- The caller's next act ----------------------------------------------------------------------------------------

function callerCases(): Json[] {
  const cases: Array<[string, unknown, unknown, Json]> = [
    ["working: poll", job("working"), NOW, { action: "poll" }],
    ["working with another message: poll", job("working", { statusMessage: "step 2" }), NOW, { action: "poll" }],
    ["paused, no reset known: wait", job("working", { statusMessage: "quota-exhausted" }), NOW, { action: "wait" }],
    ["paused until later: wait until then", job("working", { statusMessage: `quota-exhausted until ${LATER}` }), NOW, { action: "wait", notBefore: LATER }],
    ["paused until a reset already passed: poll", job("working", { statusMessage: `quota-exhausted until ${EARLIER}` }), NOW, { action: "poll" }],
    ["paused until now exactly: poll", job("working", { statusMessage: `quota-exhausted until ${NOW}` }), NOW, { action: "poll" }],
    ["a malformed pause: invalid", job("working", { statusMessage: "quota-exhausted, later" }), NOW, { action: "invalid" }],
    ["input_required: answer", job("input_required", { inputRequests: {} }), NOW, { action: "answer" }],
    ["completed: done", job("completed", { result: {} }), NOW, { action: "done" }],
    ["cancelled", job("cancelled"), NOW, { action: "cancelled" }],
    ["quota-exhausted, retryable, reset later: resend then, same key", failed("quota-exhausted", { retryable: true, resetsAt: LATER }), NOW, { action: "resend", notBefore: LATER }],
    ["quota-exhausted, retryable, reset passed: resend, same key", failed("quota-exhausted", { retryable: true, resetsAt: EARLIER }), NOW, { action: "resend" }],
    ["quota-exhausted, retryable, no reset: resend, same key", failed("quota-exhausted", { retryable: true }), NOW, { action: "resend" }],
    ["quota-exhausted, not retryable: a person", failed("quota-exhausted", { retryable: false }), NOW, { action: "person" }],
    ["quota-exhausted without data: invalid", failed("quota-exhausted"), NOW, { action: "invalid" }],
    ["quota-exhausted, retryable a string: invalid", failed("quota-exhausted", { retryable: "true" }), NOW, { action: "invalid" }],
    ["quota-exhausted, a reset without retryable true: invalid", failed("quota-exhausted", { retryable: false, resetsAt: LATER }), NOW, { action: "invalid" }],
    ["quota-exhausted, a reset at an offset: invalid", failed("quota-exhausted", { retryable: true, resetsAt: "2026-10-19T14:00:00+02:00" }), NOW, { action: "invalid" }],
    ["quota-exhausted, another member: invalid", failed("quota-exhausted", { retryable: true, scope: "model" }), NOW, { action: "invalid" }],
    ["outcome-unknown: reconcile, never a new key", failed("outcome-unknown"), NOW, { action: "reconcile" }],
    ["outcome-unknown with data: reconcile", failed("outcome-unknown", { reference: "ch_3Kq" }), NOW, { action: "reconcile" }],
    ["limit-reached (DL-19, a spend window): a person, through its approval request", failed("limit-reached", {"detail": "window-exhausted", "window": "day", "level": "L1", approvalRequest: "urn:fabric:approval-request:7f3c"}), NOW, { action: "person" }],
    ["quota-exhausted, a reset with four fraction digits: invalid", failed("quota-exhausted", { retryable: true, resetsAt: "2026-10-19T10:00:00.0004Z" }), NOW, { action: "invalid" }],
    ["failed, an empty message: invalid", job("failed", { error: { code: "quota-exhausted", message: "", data: { retryable: true } } }), NOW, { action: "invalid" }],
    ["failed, a message of 2000 characters: failed", job("failed", { error: { code: "x-y", message: "m".repeat(2000) } }), NOW, { action: "failed" }],
    ["failed, a message of 2001 characters: invalid", job("failed", { error: { code: "x-y", message: "m".repeat(2001) } }), NOW, { action: "invalid" }],
    ["failed, an error with another member: invalid", job("failed", { error: { code: "x-y", message: "m", hint: "h" } }), NOW, { action: "invalid" }],
    ["another code: failed", failed("upstream-error"), NOW, { action: "failed" }],
    ["queue-full never ends a job (DEC-0104): invalid", failed("queue-full", { retryable: true, retryAfterSeconds: 30 }), NOW, { action: "invalid" }],
    ["an integer code: failed", failed(-32603), NOW, { action: "failed" }],
    ["a code of another form: invalid", failed("Quota_Exhausted"), NOW, { action: "invalid" }],
    ["failed without an error: invalid", job("failed"), NOW, { action: "invalid" }],
    ["failed, an error without a message: invalid", job("failed", { error: { code: "x-y" } }), NOW, { action: "invalid" }],
    ["an unknown status: invalid", job("paused"), NOW, { action: "invalid" }],
    ["an unknown status with an error: invalid, never failed", job("paused", { error: { code: "x-y", message: "m" } }), NOW, { action: "invalid" }],
    ["now at an offset: invalid", job("working"), "2026-10-19T12:00:00+02:00", { action: "invalid" }],
    ["now missing: invalid", job("working"), undefined, { action: "invalid" }],
    ["not a job answer: invalid", "working", NOW, { action: "invalid" }]
  ];
  return cases.map(([name, answer, now, expected]) => {
    const entry: Json = { name, answer };
    if (now !== undefined) entry.now = now;
    entry.expected = expected;
    return entry;
  });
}

// ---- The intent's key ---------------------------------------------------------------------------------------------

function keyCases(): Json[] {
  const base = { agentId: "example-media.default", capability: "media.order", input: { brief: "a 9:16 ad", candidates: 2 } };
  const ok = (name: string, intent: Json) => ({ name, intent, expected: uuid8(intent) });
  const no = (name: string, intent: unknown) => ({ name, intent, expected: null });
  return [
    ok("an intent", base),
    ok("the same intent with its input's members in another order: the same key", { ...base, input: { candidates: 2, brief: "a 9:16 ad" } }),
    ok("another input: another key", { ...base, input: { brief: "a 9:16 ad", candidates: 3 } }),
    ok("the same input asked twice on purpose: the request names it", { ...base, request: "task_51c2" }),
    ok("an input with a nested array and a non-ASCII string", { ...base, input: { brief: "реклама", sizes: [1080, 1920], nested: { a: null } } }),
    ok("a request of 256 characters that are code points beyond the BMP", { ...base, request: "\u{1F600}".repeat(256) }),
    no("a request that is empty", { ...base, request: "" }),
    no("a request of 257 characters", { ...base, request: "r".repeat(257) }),
    no("an input that is an array", { ...base, input: [1] }),
    no("no agentId", { capability: base.capability, input: base.input }),
    no("an empty capability", { ...base, capability: "" }),
    no("another member (a clock)", { ...base, at: NOW }),
    no("not an object", "media.order")
  ];
}

// ---- Usage --------------------------------------------------------------------------------------------------------

function usageCases(): Json[] {
  const cases: Array<[string, Json, string[]]> = [
    ["every number known", { inputTokens: 1200, outputTokens: 300, costUsd: 0.0042, wallMs: 5100 }, []],
    ["a measured zero cost", { inputTokens: 0, outputTokens: 0, costUsd: 0, wallMs: 12 }, []],
    ["unknown counts and cost, partial", { inputTokens: null, outputTokens: null, costUsd: null, wallMs: 5100, partial: true }, []],
    ["unknown cost, partial not stated", { inputTokens: 10, outputTokens: 2, costUsd: null, wallMs: 40 }, []],
    ["a lower bound, partial, nothing null", { inputTokens: 900, outputTokens: 120, wallMs: 3000, partial: true }, []],
    ["partial false beside an unknown cost", { inputTokens: 10, outputTokens: 2, costUsd: null, wallMs: 40, partial: false }, ["FAC-SEM-119 /partial"]],
    ["partial false beside unknown cache counts", { inputTokens: 10, outputTokens: 2, cacheReadTokens: null, cacheWriteTokens: null, wallMs: 40, partial: false }, ["FAC-SEM-119 /partial"]],
    ["partial false, every number known", { inputTokens: 10, outputTokens: 2, wallMs: 40, partial: false }, []]
  ];
  return cases.map(([name, usage, findings]) => ({ name, usage, findings }));
}

// ---- The reader's revision ----------------------------------------------------------------------------------------

function readerCases(): Json[] {
  const cases: Array<[string, unknown, boolean]> = [
    ["a caller that names fabric-interop/0.2 reads null", { traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", protocols: ["fabric-interop/0.2", "fabric-interop/0.1"] }, true],
    ["a caller that names only fabric-interop/0.1 does not", { traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", protocols: ["fabric-interop/0.1"] }, false],
    ["a caller that names no revision reads fabric-interop/0.1", { traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" }, false],
    ["protocols that is no list", { protocols: "fabric-interop/0.2" }, false],
    ["no _meta", null, false]
  ];
  return cases.map(([name, meta, expected]) => ({ name, meta, expected }));
}

/** The vectors as an object. */
export function jobLimitVectors(): Json {
  return {
    about:
      "Vectors for jobs under limits and uncertain effects (DEC-0087), written by tools/vectors/job-limits.ts, never by hand. pause: readJobPause(answer), answer a fabric.job.get answer {job}; the grammar binds a working job whose statusMessage starts quota-exhausted. caller: jobCallerAction(answer, now), now a UTC instant; resend reuses the intent's key, never a new one; a case without now passes none. key: intentIdempotencyKey(intent); expected is a UUID of version 8 from the first 16 bytes of the SHA-256 of the intent's RFC 8785 form, or null when the intent has another shape. usage: the FAC-SEM-119 findings on one usage object, as 'code instancePath'. reader: readsNullUsage(meta), meta a request's _meta; a provider writes null and partial in usage only toward a reader that names fabric-interop/0.2. Instants carry at most three fraction digits; lengths count code points. Every case holds in every time zone.",
    pause: pauseCases(),
    caller: callerCases(),
    key: keyCases(),
    usage: usageCases(),
    reader: readerCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildJobLimitVectors(): string {
  return `${JSON.stringify(jobLimitVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildJobLimitVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}
