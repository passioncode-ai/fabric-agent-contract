import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { activityEventId, contiguousAcks, forbiddenKeys, keyWords } from "../src/activity-rules.js";
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

  it("acks the highest consumed seq, counting an overflow's ranges, and keys streams by device", () => {
    const batch = load("positive/activity-batch.json");
    const known = [{ collector: { id: "cc-otel", epoch: 2 }, seq: 37 }];
    expect(contiguousAcks(known, batch)).toEqual([{ collector: { id: "cc-otel", epoch: 2 }, seq: 44 }, { collector: { id: "switchboard", epoch: 2 }, seq: 0 }]);
    batch.events.splice(3, 1);
    expect(contiguousAcks(known, batch)[0]?.seq).toBe(37);
  });

  it("refuses an ack that omits a stream or names another device", () => {
    const fixture = load("semantic/activity-ack-ok.json");
    fixture.input.ack.acks.pop();
    fixture.input.ack.device.id = "dev-other";
    expect(paths("activity-ack", fixture.input)).toEqual(expect.arrayContaining(["FAC-SEM-039 /ack/acks", "FAC-SEM-039 /ack/device/id"]));
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
    expect(Date.now() - started).toBeLessThan(100);
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

  it("refuses a day outside the range and a range that runs backwards", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[1].day = "2026-10-09";
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-040 /cells/1/day");
    summary.from = "2026-10-08";
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-040 /to");
  });
});
