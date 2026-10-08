import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { activityEventId, contiguousAcks, forbiddenKeys } from "../src/activity-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0030: activity telemetry — fabric-activity/0.1 events and batches, activity-summary/1, access-log/1.
type Json = Record<string, any>;
const fixtures = path.join(projectRoot(), "fixtures");
const load = (relative: string) => JSON.parse(readFileSync(path.join(fixtures, relative), "utf8")) as Json;
const validator = await createValidator();
const DOCUMENT_SCHEMA: Record<string, string> = { "activity-event": "activity-event", "activity-batch": "activity-batch", "activity-summary": "activity-summary" };
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const paths = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => `${finding.code} ${finding.instancePath}`);

describe("activity semantic fixtures (FAC-SEM-037…040)", () => {
  const files = readdirSync(path.join(fixtures, "semantic")).filter((name) => name.startsWith("activity-"));

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

describe("FAC-SEM-037: no content and no person field", () => {
  it("accepts the event's own opaque /user and refuses user anywhere else", () => {
    const event = load("positive/activity-event-extension.json");
    expect(codes("activity-event", event)).toEqual([]);
    event.data = { owner: { user: { id: "m-1" } } };
    expect(paths("activity-event", event)).toContain("FAC-SEM-037 /data/owner/user");
  });

  it("reads every event of a batch, nested data included", () => {
    const batch = load("positive/activity-batch.json");
    batch.events[4].data = { detail: { messages: [] } };
    expect(paths("activity-batch", batch)).toContain("FAC-SEM-037 /events/4/data/detail/messages");
  });

  it("matches dotted segments, so an OTel-style user.email or prompt.text is caught", () => {
    const found = forbiddenKeys({ "user.email": "x", "prompt.text": "y", "runtime.name": "claude_code" }, "", new Set());
    expect(found.map((f) => `${f.kind} ${f.key}`)).toEqual(["person user.email", "content prompt.text"]);
  });
});

describe("FAC-SEM-038: an unknown cost is null, never 0", () => {
  it("accepts a priced zero: a price list that says the model is free", () => {
    const event = load("positive/activity-event-usage.json");
    event.data.cost = { usd: 0, basis: "price-list" };
    expect(codes("activity-event", event)).toEqual([]);
  });

  it("refuses two lines of one call that disagree", () => {
    const batch = load("positive/activity-batch.json");
    const copy = structuredClone(batch.events[1]);
    copy.seq = 47;
    copy.event_id = "01K6Z3Z0A1B2C3D4E5F6G7H8JK";
    copy.data.tokens.output = 1;
    batch.events.push(copy);
    expect(paths("activity-batch", batch)).toContain("FAC-SEM-038 /events/5/data/dedupe_key");
  });

  it("refuses a summary with more unpriced lines than lines, and a basis on an unknown cost", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[0].counts.unpriced_lines = 40;
    summary.cells[1].usage.cost.basis = "mixed";
    expect(paths("activity-summary", summary)).toEqual(expect.arrayContaining(["FAC-SEM-038 /cells/0/counts/unpriced_lines", "FAC-SEM-038 /cells/1/usage/cost/basis"]));
  });
});

describe("FAC-SEM-039: event ids, streams and acknowledgements", () => {
  it("derives event_id from the source and its own key, deterministically", () => {
    const id = activityEventId("claude_code.otel", "req_011CTexampleRequest0001");
    expect(id).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(id).toBe(activityEventId("claude_code.otel", "req_011CTexampleRequest0001"));
    expect(id).not.toBe(activityEventId("claude_code.transcript", "req_011CTexampleRequest0001"));
    expect(load("positive/activity-event-usage.json").event_id).toBe(id);
  });

  it("refuses an event whose source_key does not derive its id", () => {
    const event = load("positive/activity-event-usage.json");
    event.event_id = "01K6Z3V8Q4M2N7P5R9T1W3X5Y7";
    expect(paths("activity-event", event)).toContain("FAC-SEM-039 /event_id");
  });

  it("refuses an interval that ends before it starts and an overflow that miscounts", () => {
    const interval = load("positive/activity-event-interval.json");
    interval.data.end = "2026-10-07T09:00:00Z";
    expect(paths("activity-event", interval)).toContain("FAC-SEM-039 /data/end");
    const batch = load("positive/activity-batch.json");
    batch.events[2].data.dropped.events = 3;
    expect(paths("activity-batch", batch)).toContain("FAC-SEM-039 /events/2/data/dropped/events");
  });

  it("refuses one event_id twice in a batch", () => {
    const batch = load("positive/activity-batch.json");
    batch.events[3].event_id = batch.events[0].event_id;
    expect(paths("activity-batch", batch)).toContain("FAC-SEM-039 /events/3/event_id");
  });

  it("acknowledges the highest contiguous seq, counting an overflow's range as delivered", () => {
    const batch = load("positive/activity-batch.json");
    const known = [{ node: { id: "dev-01j9a.cc-otel", epoch: 2 }, seq: 40 }];
    expect(contiguousAcks(known, batch)).toEqual([{ node: { id: "dev-01j9a.cc-otel", epoch: 2 }, seq: 46 }, { node: { id: "dev-01j9a.switchboard", epoch: 1 }, seq: 0 }]);
    batch.events.splice(2, 1);
    expect(contiguousAcks(known, batch)[0]?.seq).toBe(42);
  });

  it("refuses an ack that omits a stream the batch carried", () => {
    const fixture = load("semantic/activity-ack-ok.json");
    fixture.input.ack.acks.pop();
    expect(paths("activity-ack", fixture.input)).toContain("FAC-SEM-039 /ack/acks");
  });
});

describe("FAC-SEM-040: a summary has no person dimension", () => {
  it("refuses a person key even where a reader built the summary outside the schema", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[0].team = "platform";
    summary.cells[1].user = { id: "m-4821" };
    expect(paths("activity-summary", summary)).toEqual(expect.arrayContaining(["FAC-SEM-040 /cells/0/team", "FAC-SEM-040 /cells/1/user"]));
  });

  it("refuses a day outside the range and a range that runs backwards", () => {
    const summary = load("positive/activity-summary.json");
    summary.cells[1].day = "2026-10-09";
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-040 /cells/1/day");
    summary.from = "2026-10-08";
    expect(paths("activity-summary", summary)).toContain("FAC-SEM-040 /to");
  });
});
