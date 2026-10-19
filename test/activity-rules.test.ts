import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createHash } from "node:crypto";
import { activityEventId, contiguousAcks, forbiddenKeys, hashedBranch, keyWords, mergeStreams, pathSourceKey, tenantRef } from "../src/activity-rules.js";
import { contiguousFrom, mergeRanges, uncovered } from "../src/seq-ranges.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0030: activity telemetry — fabric-activity/0.1 telemetry events and batches, activity-summary/1, access-log/1.
type Json = Record<string, any>;
const fixtures = path.join(projectRoot(), "fixtures");
const load = (relative: string) => JSON.parse(readFileSync(path.join(fixtures, relative), "utf8")) as Json;
const validator = await createValidator();
const DOCUMENT_SCHEMA: Record<string, string> = { "telemetry-event": "telemetry-event", "activity-batch": "activity-batch", "activity-summary": "activity-summary" };
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => `${finding.code} ${finding.instancePath}`);

describe("activity semantic fixtures (FAC-SEM-037…040)", () => {
  const files = readdirSync(path.join(fixtures, "semantic")).filter((name) => /^(activity|telemetry)-/.test(name));

  it("has a passing and a failing input for each rule", () => {
    const expected = new Set(files.flatMap((name) => load(`semantic/${name}`).expect as string[]));
    expect([...expected].sort()).toEqual(["FAC-SEM-037", "FAC-SEM-038", "FAC-SEM-039", "FAC-SEM-040"]);
    expect(files.some((name) => (load(`semantic/${name}`).expect as string[]).length === 0)).toBe(true);
  });

  it.each(files)("%s yields exactly its expected codes, and a document input is schema-valid", (name) => {
    const fixture = load(`semantic/${name}`);
    expect([...new Set(codes(fixture.kind, fixture.input))]).toEqual(fixture.expect);
    const schema = DOCUMENT_SCHEMA[fixture.kind];
    if (schema) {
      const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, fixture.input);
      expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
    }
  });
});

describe("FAC-SEM-037: no content, no person, no home path", () => {
  it("closes the re-review's gaps and spares measurements and counts", () => {
    const caught = { fullname: 1, owner: 1, query: 1, searchTerms: 1, nickName: 1, assignee: 1 };
    expect(forbiddenKeys(caught, "", new Set()).map((f) => f.key)).toEqual(Object.keys(caught));
    expect(forbiddenKeys({ performanceMs: 12, reviewCount: 3, durationMs: 4, focused: true }, "", new Set())).toEqual([]);
  });

  it("finds tilde-user, double-encoded and lowercase relative home directories", () => {
    for (const value of ["~example/x", "~example", "%252FUsers%252Fexample", "%2fusers%2fexample", "users/example/notes", "home/example", "C:\\Users\\example"]) {
      expect(forbiddenKeys({ v: value }, "", new Set()).map((f) => f.kind), value).toEqual(["path"]);
    }
  });

  it("requires the user-name segment form, so Users-guide and its kin are not flagged", () => {
    for (const value of ["Users-guide", "/Users-guide", "docs/Users-guide.md", "%2FUsers-guide", "my-home-page", "homework", "x~y"]) {
      expect(forbiddenKeys({ v: value }, "", new Set()), value).toEqual([]);
    }
  });

  it("keeps the sourceKey schema in step: Users-guide passes, a dash-encoded home directory does not", () => {
    const event = load("positive/telemetry-event-usage.json");
    const valid = (key: string) => {
      event.sourceKey = key;
      event.eventId = activityEventId(event.source, key);
      return validateDocument(validator, `${SCHEMA_PREFIX}schemas/telemetry-event.schema.json`, event).valid;
    };
    expect(valid("Users-guide-17")).toBe(true);
    expect(valid("C--Users-example-work.jsonl:4")).toBe(false);
    expect(valid("proj--home-example-x:4")).toBe(false);
  });

  it("finds a home directory in the encoded forms runtimes write into file names, and not in an ordinary branch", () => {
    for (const value of ["projects/-Users-ivan-DATA-secret-proj/5d1e.jsonl", "C--Users-ivan-work", "%2FUsers%2Fivan", "/home/example/x", "-home-ivan-proj", "~/notes"]) {
      expect(forbiddenKeys({ v: value }, "", new Set()).map((f) => f.kind), value).toEqual(["path"]);
    }
    for (const value of ["feature/home-page", "homework-17", "users-guide", "req_011CT"]) expect(forbiddenKeys({ v: value }, "", new Set()), value).toEqual([]);
  });

  it("splits keys at camelCase, underscores, hyphens and dots", () => {
    expect(keyWords("displayName")).toEqual(["display", "name"]);
    expect(keyWords("user_id")).toEqual(["user", "id"]);
    expect(keyWords("prompt.text")).toEqual(["prompt", "text"]);
    expect(keyWords("HTTPStatus")).toEqual(["http", "status"]);
  });

  it("catches every spelling the review probed, and none of the contract's own fields", () => {
    const probe = { displayName: 1, userEmail: 1, promptText: 1, user_id: 1, author: 1, employerRef: 1, productivity: 1, "window-title": 1 };
    expect(forbiddenKeys(probe, "", new Set()).map((f) => f.key)).toEqual(Object.keys(probe));
    for (const name of ["positive/telemetry-event-interval.json", "positive/telemetry-event-usage.json", "positive/activity-batch.json"]) {
      const value = load(name);
      expect(forbiddenKeys(value, "", new Set(["", ...((value.events as unknown[] | undefined) ?? []).map((_, i) => `/events/${i}`)]))).toEqual([]);
    }
  });

  it("accepts the event's own opaque /user and refuses user anywhere else", () => {
    const event = load("positive/telemetry-event-extension.json");
    expect(codes("telemetry-event", event)).toEqual([]);
    event.data = { owner: { user: "m-1" } };
    expect(paths("telemetry-event", event)).toContain("FAC-SEM-037 /data/owner/user");
  });

  it("flags a home path in any value", () => {
    const event = load("positive/telemetry-event-extension.json");
    event.data = { where: "C:\\Users\\example" };
    expect(paths("telemetry-event", event)).toContain("FAC-SEM-037 /data/where");
  });

  it("does not read an overflow's byKind kind names as keys", () => {
    const overflow = load("positive/telemetry-event-overflow.json");
    expect(overflow.data.dropped.byKind.map((entry: Json) => entry.kind)).toContain("x-example.review_marker");
    expect(codes("telemetry-event", overflow)).toEqual([]);
  });
});

describe("FAC-SEM-038: an unknown cost is null, never 0", () => {
  it("accepts a priced zero: a price list that says the model is free", () => {
    const event = load("positive/telemetry-event-usage.json");
    event.data.cost = { usd: 0, basis: "price-list" };
    expect(codes("telemetry-event", event)).toEqual([]);
  });

  it("refuses two lines of one call that disagree", () => {
    const batch = load("positive/activity-batch.json");
    const copy = structuredClone(batch.events[1]);
    copy.data.tokens.output = 1;
    batch.events.push({ ...copy, seq: 45 });
    expect(paths("activity-batch", batch)).toContain("FAC-SEM-038 /events/5/data/dedupeKey");
  });

  it("refuses a summary with more unpriced lines than lines", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[0].counts.unpricedLines = 40;
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-038 /cells/0/counts/unpricedLines");
  });
});

describe("FAC-SEM-039: event ids, streams and acknowledgements", () => {
  it("derives eventId from the source and its own key, deterministically", () => {
    const id = activityEventId("claude_code.otel", "req_011CTexampleRequest0001");
    expect(id).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(id).not.toBe(activityEventId("claude_code.transcript", "req_011CTexampleRequest0001"));
    expect(load("positive/telemetry-event-usage.json").eventId).toBe(id);
  });

  it("hashes path-derived keys and branches under the device's telemetry key, so they pass the schema and differ per device", () => {
    const deviceA = new Uint8Array(32).fill(7), deviceB = new Uint8Array(32).fill(9);
    const path = "projects/-Users-ivan-DATA-secret-proj/5d1e.jsonl";
    const keyA = pathSourceKey(deviceA, path, 1024);
    expect(keyA).toMatch(/^hmac-sha256:[a-f0-9]{64}$/);
    expect(keyA).toBe(pathSourceKey(deviceA, path, 1024));
    expect(keyA).not.toBe(pathSourceKey(deviceB, path, 1024));
    expect(keyA).not.toContain("Users");
    const event = load("positive/telemetry-event-usage.json");
    event.sourceKey = keyA;
    event.eventId = activityEventId(event.source, keyA);
    event.git = { branch: hashedBranch(deviceA, "fix/ivan-login") };
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/telemetry-event.schema.json`, event).valid).toBe(true);
    expect(codes("telemetry-event", event)).toEqual([]);
  });

  it("refuses an event whose sourceKey does not derive its id", () => {
    const event = load("positive/telemetry-event-usage.json");
    event.eventId = `sha256:${"0".repeat(64)}`;
    expect(paths("telemetry-event", event)).toContain("FAC-SEM-039 /eventId");
  });

  it("refuses an interval that ends before it starts and an overflow that miscounts or overlaps", () => {
    const interval = load("positive/telemetry-event-interval.json");
    interval.data.end = "2026-10-07T09:00:00Z";
    expect(paths("telemetry-event", interval)).toContain("FAC-SEM-039 /data/end");
    const overflow = load("positive/telemetry-event-overflow.json");
    overflow.data.dropped.events = 4;
    expect(paths("telemetry-event", overflow)).toContain("FAC-SEM-039 /data/dropped/events");
    overflow.data.dropped.ranges = [{ fromSeq: 38, toSeq: 40 }, { fromSeq: 40, toSeq: 41 }];
    expect(paths("telemetry-event", overflow)).toContain("FAC-SEM-039 /data/dropped/ranges");
  });

  it("refuses one eventId twice in a batch", () => {
    const batch = load("positive/activity-batch.json");
    batch.events[2].eventId = batch.events[0].eventId;
    expect(paths("activity-batch", batch)).toContain("FAC-SEM-039 /events/2/eventId");
  });

  it("acks the highest consumed seq over all batches, counting an overflow's ranges, and names held ranges above it", () => {
    const batch = load("positive/activity-batch.json");
    const known = [{ collector: { id: "cc-otel", epoch: 2 }, held: [[1, 37]] as Array<[number, number]>, accounted: [] }];
    expect(contiguousAcks(known, batch)).toEqual([
      { collector: { id: "cc-otel", epoch: 2 }, seq: 44, held: [] },
      { collector: { id: "switchboard", epoch: 2 }, seq: 0, held: [[7, 7]] }
    ]);
    batch.events.splice(3, 1);
    expect(contiguousAcks(known, batch)[0]).toMatchObject({ seq: 37, held: [[41, 43]] });
  });

  it("jumps the ack when a later overflow accounts for the head of the stream (the review's probe)", () => {
    const batch = load("positive/activity-batch.json");
    batch.events = [{ ...batch.events[3], seq: 1005, data: { dropped: { events: 4, ranges: [{ fromSeq: 1, toSeq: 4 }] } } }];
    expect(contiguousAcks([{ collector: { id: "cc-otel", epoch: 2 }, held: [[5, 1004]], accounted: [] }], batch)[0]?.seq).toBe(1005);
  });

  it("refuses an ack that omits a stream or names another device", () => {
    const fixture = load("semantic/activity-ack-ok.json");
    fixture.input.ack.acks.pop();
    fixture.input.ack.device.id = "dev-other";
    expect(paths("activity-ack", fixture.input)).toEqual(expect.arrayContaining(["FAC-SEM-039 /ack/acks", "FAC-SEM-039 /ack/device/id"]));
  });
});

// F-B-102: the four FAC-SEM-038/039 clauses the spec states and no test killed, each on an input where it alone fires.
describe("F-B-102: every activity clause the spec states has a test that fails without it", () => {
  const exactly = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => `${f.code} ${f.instancePath} ${f.message}`);

  it("FAC-SEM-039 refuses an overflow that names a seq at or above its own", () => {
    const overflow = load("positive/telemetry-event-overflow.json");
    const [range] = overflow.data.dropped.ranges;
    overflow.seq = range.toSeq;
    expect(exactly("telemetry-event", overflow)).toEqual(["FAC-SEM-039 /data/dropped/ranges an overflow names only seqs assigned before its own"]);
  });

  it("FAC-SEM-039 refuses a dropped range that runs backwards", () => {
    const overflow = load("positive/telemetry-event-overflow.json");
    overflow.data.dropped.ranges = [{ fromSeq: 40, toSeq: 38 }];
    expect(exactly("telemetry-event", overflow)).toContain("FAC-SEM-039 /data/dropped/ranges a dropped range runs forward");
  });

  it("FAC-SEM-039 refuses a rejection that names an event the batch did not carry", () => {
    const fixture = load("semantic/activity-ack-ok.json").input;
    fixture.ack.accepted -= 1;
    fixture.ack.rejected = [{ eventId: "01K6Z3ZZZZZZZZZZZZZZZZZZZZ", reason: "schema" }];
    expect(paths("activity-ack", fixture)).toEqual(["FAC-SEM-039 /ack/rejected/0/eventId"]);
  });

  it("FAC-SEM-038 refuses a summary cell with priced lines whose cost is null", () => {
    const summary = load("positive/activity-summary.json");
    const cell = summary.cells.find((c: Json) => c.counts.usageLines > c.counts.unpricedLines);
    cell.usage.cost = { usd: null };
    const at = summary.cells.indexOf(cell);
    expect(exactly("activity-summary", summary)).toEqual([`FAC-SEM-038 /cells/${at}/usage/cost/usd priced lines carry a cost; null is only for a cell with no priced line`]);
  });
});

describe("batch size", () => {
  it("refuses a batch of 1001 events (generated here rather than kept as a fixture)", () => {
    const batch = load("positive/activity-batch.json");
    const event = load("positive/telemetry-event-extension.json");
    batch.events = Array.from({ length: 1001 }, (_, i) => ({ ...event, seq: i + 1 }));
    const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/activity-batch.schema.json`, batch);
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "maxItems")).toBe(true);
    batch.events = batch.events.slice(0, 1000);
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/activity-batch.schema.json`, batch).valid).toBe(true);
  });
});

describe("seq ranges: coverage by interval arithmetic", () => {
  it("merges, finds gaps and reads the contiguous position", () => {
    expect(mergeRanges([[5, 7], [1, 2], [3, 3], [9, 9]])).toEqual([[1, 3], [5, 7], [9, 9]]);
    expect(uncovered([[1, 3], [5, 7]], 1, 9)).toEqual([[4, 4], [8, 9]]);
    expect(contiguousFrom([[1, 3], [5, 7]], 0)).toBe(3);
  });

  it("answers for a range of 2^53 seqs at once", () => {
    const huge = Number.MAX_SAFE_INTEGER;
    const started = Date.now();
    expect(uncovered([[1, huge - 1]], 1, huge)).toEqual([[huge, huge]]);
    expect(contiguousFrom([[1, huge]], 0)).toBe(huge);
    // Walking 2^53 seqs one by one would take years; 2 s leaves room for a loaded machine and still proves it.
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe("FAC-SEM-040: a summary has no person dimension", () => {
  it("refuses a person key even where a reader built the summary outside the schema, and a device producer", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[0].teamName = "platform";
    summary.cells[1].user = { id: "m-4821" };
    summary.producer.kind = "device";
    expect(paths("activity-summary", summary)).toEqual(expect.arrayContaining(["FAC-SEM-040 /cells/0/teamName", "FAC-SEM-040 /cells/1/user", "FAC-SEM-040 /producer/kind"]));
  });

  it("counts a population as distinct users, falling back to sessions", async () => {
    const { population } = await import("../src/activity-rules.js");
    expect(population([{ user: { id: "a" }, session: { id: "s1" } }, { user: { id: "a" }, session: { id: "s2" } }, { session: { id: "s3" } }, { session: { id: "s3" } }])).toBe(2);
  });

  it("refuses a population above the session count, and a summary that lowers the minimum below 3", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[0].counts.population = 7;
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-040 /cells/0/counts/population");
    const lowered = load("positive/activity-summary.json");
    lowered.minPopulation = 2;
    expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/activity-summary.schema.json`, lowered).valid).toBe(false);
  });

  it("refuses a day outside the range and a range that runs backwards", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[1].day = "2026-10-09";
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-040 /cells/1/day");
    summary.from = "2026-10-08";
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-040 /to");
  });
});

// F-B-108 (DEC-0052): one definition of consumed — held, rejected or accounted for by an overflow event. A check-in's
// dropped ranges are pending and never move an ack.
describe("F-B-108: a check-in's dropped ranges never move an ack", () => {
  it("acks only up to the first seq neither held nor accounted for by an overflow event", () => {
    const collector = { id: "cc-otel", epoch: 2 };
    const known = [{ collector, held: [[1, 37]] as [number, number][], accounted: [], pending: [[38, 40]] as [number, number][] }];
    const batch = { device: { id: "dev-01j9a" }, events: [41, 42].map((seq) => ({ collector, seq, kind: "session.interval" })) };
    expect(contiguousAcks(known, batch)).toEqual([{ collector, seq: 37, held: [[41, 42]] }]);
    const overflow = { collector, seq: 43, kind: "buffer.overflow", data: { dropped: { events: 3, ranges: [{ fromSeq: 38, toSeq: 40 }] } } };
    expect(contiguousAcks(known, { ...batch, events: [...batch.events, overflow] })).toEqual([{ collector, seq: 43, held: [] }]);
  });

  it("keeps the ranges a check-in reports apart from what an overflow accounts for", () => {
    const collector = { id: "cc-otel", epoch: 2 };
    const checkIn = { collectors: [{ collector, lastSeq: 44, bufferedFrom: 41, dropped: [{ fromSeq: 38, toSeq: 40 }] }] };
    const [state] = mergeStreams([{ collector, held: [[1, 37]], accounted: [] }], null, checkIn);
    expect(state).toMatchObject({ accounted: [], pending: [[38, 40]], bufferedFrom: 41 });
  });
});

describe("F-B-107: a clause no rule checks is not attributed to one", () => {
  it("names the summary's mixed basis a receiver duty, not FAC-SEM-038, which never reads a cell's lines", () => {
    const spec = readFileSync(path.join(projectRoot(), "docs/specification/activity.md"), "utf8");
    const clause = spec.split("\n\n").find((block) => block.includes("`mixed` when its lines differ") || block.includes("is `mixed` when its lines differ"));
    expect(clause).toBeDefined();
    expect(clause).toContain("receiver's duty");
    expect(clause).not.toContain("FAC-SEM-038");
    expect(readFileSync(path.join(projectRoot(), "src/activity-rules.ts"), "utf8")).not.toMatch(/["']mixed["']/);
  });
});

// CT-25 (DEC-0052): the settings form refuses a lone surrogate, and the activity rule refuses the event rather than throw.
describe("CT-25: an event whose sourceKey has no canonical form is refused, not thrown", () => {
  it("flags the sourceKey of a usage line with a lone surrogate", () => {
    const event = load("positive/telemetry-event-usage.json");
    event.sourceKey = "req\ud800";
    expect(() => evaluateSemanticRules("telemetry-event", event)).not.toThrow();
    expect(paths("telemetry-event", event)).toContain("FAC-SEM-039 /sourceKey");
  });
});

// DEC-0052 (CON-OE-01): account class, policy violations by UTC day, neutral notice and consent messages, and OD-1 in
// neutral form over the access log (FAC-SEM-067).
describe("FAC-SEM-067: OD-1 in neutral form over the access log", () => {
  const files = readdirSync(path.join(fixtures, "semantic")).filter((name) => name.startsWith("access-log-"));

  it("has a passing and a failing input", () => {
    expect([...new Set(files.flatMap((name) => load(`semantic/${name}`).expect as string[]))].sort()).toEqual(["FAC-SEM-067", "FAC-SEM-123"]);
    expect(files.some((name) => (load(`semantic/${name}`).expect as string[]).length === 0)).toBe(true);
  });

  it.each(files)("%s yields exactly its expected codes, and its log is schema-valid", (name) => {
    const fixture = load(`semantic/${name}`);
    expect([...new Set(codes(fixture.kind, fixture.input))]).toEqual(fixture.expect);
    const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/access-log.schema.json`, fixture.input.log);
    expect(result.valid, JSON.stringify(result.errors, null, 2)).toBe(true);
  });

  it("refuses a person's usage served to another person without a step, and narrows nothing the subject reads", () => {
    const fixture = load("semantic/access-log-disclosure-ok.json").input;
    delete fixture.log.entries[0].step;
    expect(paths("access-log-disclosure", fixture)).toEqual(["FAC-SEM-067 /log/entries/0/step"]);
    const self = load("semantic/access-log-disclosure-ok.json").input;
    self.consents = [];
    self.log.entries = self.log.entries.filter((entry: Json) => entry.reader.user?.id !== "m-0031");
    self.log.entries.push({ ...self.log.entries[0], reader: { user: { id: "m-4821" }, role: "self" }, step: "event" });
    expect(paths("access-log-disclosure", self)).toEqual([]);
  });

  it("reads a consent at the read's time: given after the read does not count, the latest message before it does", () => {
    const fixture = load("semantic/access-log-disclosure-ok.json").input;
    fixture.consents[0].at = "2026-10-07T19:00:00Z";
    expect(paths("access-log-disclosure", fixture)).toEqual(["FAC-SEM-067 /log/entries/2/purposeId"]);
    const again = load("semantic/access-log-disclosure-withdrawn.json").input;
    again.consents.push({ ...again.consents[0], state: "given", at: "2026-10-07T18:54:00Z" });
    expect(paths("access-log-disclosure", again)).toEqual([]);
  });
});

describe("CON-OE-01 (DEC-0052): account class and policy violations", () => {
  it("derives a tenant reference from the RFC 8785 form of {provider, tenant}", () => {
    expect(tenantRef("anthropic", "org-0b6c1f2e-acme")).toBe(`sha256:${createHash("sha256").update('{"provider":"anthropic","tenant":"org-0b6c1f2e-acme"}', "utf8").digest("hex")}`);
    expect(load("positive/telemetry-event-organization-account.json").account.tenantRef).toBe(tenantRef("anthropic", "org-0b6c1f2e-acme"));
  });

  it("passes a violation on its own day and refuses one whose occurred is another day", () => {
    const violation = load("positive/telemetry-event-policy-violation.json");
    expect(codes("telemetry-event", violation)).toEqual([]);
    violation.occurred = "2026-10-06T00:00:00Z";
    expect(paths("telemetry-event", violation)).toEqual(["FAC-SEM-039 /occurred"]);
  });
});

// v4 (DEC-0052): a `result` kind and a root `run` that a usage line and a result join on, with no person dimension.
describe("DEC-0052: results and the root run", () => {
  it("passes a result and a usage line that carry the same root run", () => {
    const result = load("positive/telemetry-event-result.json");
    const usage = load("positive/telemetry-event-usage-run.json");
    expect(codes("telemetry-event", result)).toEqual([]);
    expect(codes("telemetry-event", usage)).toEqual([]);
    expect(result.run.root).toBe(usage.run.root);
    expect(result.user).toBeUndefined();
  });
});

describe("review of DEC-0052: no scope sidesteps OD-1", () => {
  it("refuses an unnamed activity scope and any results scope served to a person other than the subject", () => {
    const base = load("semantic/access-log-disclosure-ok.json").input;
    const withEntry = (entry: Json) => ({ ...base, log: { ...base.log, entries: [{ ...base.log.entries[0], ...entry }] } });
    expect(paths("access-log-disclosure", withEntry({ scope: "activity.cost", step: "event" }))).toContain("FAC-SEM-067 /log/entries/0/scope");
    expect(paths("access-log-disclosure", withEntry({ scope: "activity.results", step: "day" }))).toContain("FAC-SEM-067 /log/entries/0/scope");
    expect(paths("access-log-disclosure", withEntry({ scope: "activity.usage", step: "day" }))).toEqual([]);
  });
});


// DEC-0082 review: an instancePath names the item by its index in the array as written, a non-object before it included.
describe("activity rules number items by their raw array index", () => {
  const paths = (kind: string, value: unknown, code: string) => evaluateSemanticRules(kind, value).filter((finding) => finding.code === code).map((finding) => finding.instancePath);
  const withLeading = (fixture: string, member: (input: Record<string, any>) => unknown[]): Record<string, any> => {
    const input = structuredClone(load(`semantic/${fixture}`).input) as Record<string, any>;
    member(input).unshift(7);
    return input;
  };
  it("keeps a summary cell's index", () => {
    const original = paths("activity-summary", load("semantic/activity-summary-small-cell.json").input, "FAC-SEM-040");
    const shifted = paths("activity-summary", withLeading("activity-summary-small-cell.json", (input) => input.cells), "FAC-SEM-040");
    expect(original.length).toBeGreaterThan(0);
    expect(shifted).toEqual(original.map((at) => at.replace(/^\/cells\/(\d+)/, (_m, n) => `/cells/${Number(n) + 1}`)));
  });
  it("keeps an access-log entry's index", () => {
    const original = paths("access-log-disclosure", load("semantic/access-log-disclosure-unconfirmed.json").input, "FAC-SEM-067");
    const shifted = paths("access-log-disclosure", withLeading("access-log-disclosure-unconfirmed.json", (input) => input.log.entries), "FAC-SEM-067");
    expect(original.length).toBeGreaterThan(0);
    expect(shifted).toEqual(original.map((at) => at.replace(/^\/log\/entries\/(\d+)/, (_m, n) => `/log/entries/${Number(n) + 1}`)));
  });
  it("keeps an event's index in a batch, and lets a user stand only on its own event", () => {
    const usage = load("positive/telemetry-event-grant-usage.json");
    const batch = { protocol: "fabric-activity/0.1", device: { id: "dev-01j9a" }, sent: "2026-10-13T00:05:00Z", events: [7, usage, { ...usage, eventId: "01K7GV0A1B2C3D4E5F6G7H8J9M", seq: 42, data: { ...usage.data, calls: 1, unpricedCalls: 2, costUsd: null } }] };
    expect(paths("activity-batch", batch, "FAC-SEM-038")).toEqual(["/events/2/data/unpricedCalls"]);
    const usageLine = load("positive/telemetry-event-usage.json");
    expect(paths("activity-batch", { ...batch, events: [null, usageLine] }, "FAC-SEM-037")).toEqual([]);
  });
});
