import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { isoWeekMonday } from "../src/support-quality-rules.js";

// DEC-0095: support-quality-daily/1, FAC-SEM-126.
type Json = Record<string, any>;
const dir = path.join(projectRoot(), "fixtures/semantic");
const load = (name: string) => JSON.parse(readFileSync(path.join(dir, name), "utf8")) as Json;
const paths = (value: unknown) => evaluateSemanticRules("support-quality-daily", value).map((f) => `${f.code} ${f.instancePath}`);
const ok = () => structuredClone(load("support-quality-daily-ok.json").input) as Json;

describe("FAC-SEM-126: support-quality-daily/1", () => {
  it.each(readdirSync(dir).filter((name) => name.startsWith("support-quality-daily-")))("%s yields exactly its expected codes", (name) => {
    const fixture = load(name);
    expect([...new Set(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => f.code))]).toEqual(fixture.expect);
  });
  it("names an unmeasured metric and never stands a 0 or a value for it", () => {
    const missing = ok();
    missing.stability.restarts = null;
    expect(paths(missing)).toEqual(["FAC-SEM-126 /stability/restarts"]);
    const stray = ok();
    stray.notMeasured = [...stray.notMeasured, "quality.unknownMetric"];
    expect(paths(stray)).toEqual(["FAC-SEM-126 /notMeasured"]);
  });
  it("keeps the parts within their whole and p50 within p90", () => {
    const value = ok();
    value.stability.recoveredByFallback = 4;
    value.autonomy.toPersonInability = 30;
    value.nobodyDropped.firstReplyP50Ms = 20000;
    expect(paths(value).sort()).toEqual(["FAC-SEM-126 /autonomy", "FAC-SEM-126 /nobodyDropped/firstReplyP50Ms", "FAC-SEM-126 /stability/recoveredByFallback"]);
  });
  it("names the rubric and the judge of a judged sample", () => {
    const value = ok();
    value.judgeModel = null;
    expect(paths(value)).toEqual(["FAC-SEM-126 /judgeModel"]);
    value.quality = { sampled: 0, helpedYes: 0, helpedPartly: 0, helpedNo: 0 };
    value.checks = null;
    value.notMeasured = [...value.notMeasured, "checks"];
    expect(paths(value)).toEqual([]);
  });
  it("names the judge when a verdict shows, even with no sample count, and the rubric too", () => {
    const value = ok();
    value.rubricVersion = null;
    expect(paths(value)).toEqual(["FAC-SEM-126 /judgeModel"]);
    const unsampled = ok();
    unsampled.quality.sampled = null;
    unsampled.notMeasured = [...unsampled.notMeasured, "quality.sampled"];
    unsampled.judgeModel = null;
    expect(paths(unsampled)).toEqual(["FAC-SEM-126 /judgeModel"]);
  });
  it("names checks when nothing was judged, and only then", () => {
    const unnamed = ok();
    unnamed.checks = null;
    expect(paths(unnamed)).toContain("FAC-SEM-126 /checks");
    const named = ok();
    named.notMeasured = [...named.notMeasured, "checks"];
    expect(paths(named)).toEqual(["FAC-SEM-126 /checks"]);
  });
  it("counts a check's pass rate as judged: it names the judge", () => {
    const value = ok();
    value.quality = { sampled: 0, helpedYes: 0, helpedPartly: 0, helpedNo: 0 };
    value.judgeModel = null;
    expect(paths(value)).toEqual(["FAC-SEM-126 /judgeModel"]);
  });
  it("reads a calibration as the judge's (DEC-0144): its helped follows the not-measured rule, its checks stand only beside it", () => {
    const calibrated = (): Json => Object.assign(ok(), { calibration: { week: "2026-W42", labelled: 40, helped: 0.85 as number | null }, calibrationChecks: { addressed: 0.9, policy_safe: 1 } });
    expect(paths(calibrated())).toEqual([]);
    const unlabelled = calibrated();
    unlabelled.calibration.helped = null;
    expect(paths(unlabelled)).toEqual(["FAC-SEM-126 /calibration/helped"]);
    unlabelled.notMeasured = [...unlabelled.notMeasured, "calibration.helped"];
    expect(paths(unlabelled)).toEqual([]);
    const named = calibrated();
    named.notMeasured = [...named.notMeasured, "calibration.helped"];
    expect(paths(named)).toEqual(["FAC-SEM-126 /calibration/helped"]);
    const nameless = ok();
    nameless.notMeasured = [...nameless.notMeasured, "calibration.helped"];
    expect(paths(nameless)).toEqual(["FAC-SEM-126 /notMeasured"]);
    const judgeless = calibrated();
    judgeless.quality = { sampled: 0, helpedYes: 0, helpedPartly: 0, helpedNo: 0 };
    judgeless.checks = null;
    judgeless.notMeasured = [...judgeless.notMeasured, "checks"];
    judgeless.judgeModel = null;
    expect(paths(judgeless)).toEqual(["FAC-SEM-126 /judgeModel"]);
    const both = calibrated();
    both.judgeModel = null;
    expect(paths(both)).toEqual(["FAC-SEM-126 /judgeModel"]);
    const alone = Object.assign(ok(), { calibrationChecks: { addressed: 0.9 } });
    expect(paths(alone)).toEqual(["FAC-SEM-126 /calibrationChecks"]);
  });
  it("reads a calibration's week as a real ISO week no later than the day (DEC-0144)", () => {
    const at = (week: string, day = "2026-10-18"): string[] => paths(Object.assign(ok(), { day, calibration: { week, labelled: 40, helped: 0.85 } }));
    expect(at("2026-W42")).toEqual([]);
    expect(at("2026-W43")).toEqual(["FAC-SEM-126 /calibration/week"]);
    expect(at("2026-W43", "2026-10-19")).toEqual([]);
    expect(at("2025-W53", "2025-12-31")).toEqual(["FAC-SEM-126 /calibration/week"]);
    expect(at("2026-W53", "2026-12-31")).toEqual([]);
    expect(at("2020-W53", "2020-12-31")).toEqual([]);
    expect(at("2026-W00")).toEqual(["FAC-SEM-126 /calibration/week"]);
    expect(isoWeekMonday("2026-W01")).toBe("2025-12-29");
    expect(isoWeekMonday("2020-W53")).toBe("2020-12-28");
    expect(isoWeekMonday("2026-W53")).toBe("2026-12-28");
    expect(isoWeekMonday("2025-W53")).toBeNull();
    expect(isoWeekMonday("week 3")).toBeNull();
    expect(isoWeekMonday("0001-W01")).toBe("0001-01-01");
    expect(isoWeekMonday("9999-W52")).toBe("9999-12-27");
    const numeric = Object.assign(ok(), { calibration: { week: 43, labelled: 40, helped: 0.85 } });
    expect(paths(numeric)).toEqual([]);
  });
  it("travels with a calibration as an event's data.value (DEC-0070's two levels)", async () => {
    const ajv = await createValidator();
    const page = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-events-page-data.json"), "utf8")) as Json;
    const payload = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/support-quality-daily-calibrated.json"), "utf8")) as Json;
    const event = (page.events as Json[]).find((entry) => entry.data) as Json;
    event.data = { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: payload };
    const result = validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-events-page.schema.json`, page);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });
  it("lets the median equal the 90th percentile", () => {
    const value = ok();
    value.nobodyDropped.firstReplyP50Ms = value.nobodyDropped.firstReplyP90Ms;
    expect(paths(value)).toEqual([]);
  });
  it("travels as an event's data.value: the events page accepts it (DEC-0070's two levels)", async () => {
    const ajv = await createValidator();
    const page = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-events-page-data.json"), "utf8")) as Json;
    const payload = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/support-quality-daily.json"), "utf8")) as Json;
    const event = (page.events as Json[]).find((entry) => entry.data) as Json;
    event.data = { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: payload };
    const result = validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-events-page.schema.json`, page);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });
  it("reads a malformed payload without throwing and skips sums it cannot make", () => {
    expect(paths({ notMeasured: 7, nobodyDropped: "x", quality: [1], stability: null, autonomy: 3 })).toEqual([]);
    const partial = ok();
    partial.quality.helpedNo = null;
    partial.quality.helpedYes = 99;
    partial.notMeasured = [...partial.notMeasured, "quality.helpedNo"];
    partial.nobodyDropped.turns = "142";
    // A sum with an unknown part, or a whole that is not a number, is not checked: nothing is claimed about it.
    expect(paths(partial)).toEqual([]);
    const dayless = Object.assign(ok(), { day: 20261018, calibration: { week: "2026-W43", labelled: 40, helped: 0.85 } });
    expect(paths(dayless)).toEqual([]);
  });
  it("finds each new semantic fixture at the path its name says (DEC-0144)", () => {
    expect(paths(load("support-quality-daily-calibration-checks-alone.json").input as Json)).toEqual(["FAC-SEM-126 /calibrationChecks"]);
    expect(paths(load("support-quality-daily-calibration-week-after-day.json").input as Json)).toEqual(["FAC-SEM-126 /calibration/week"]);
  });
});

describe("DEC-0151: the ticket counts of the channel agent standard in support-quality-daily/1", () => {
  const positive = (name: string) => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive", name), "utf8")) as Json;
  const tickets = () => positive("support-quality-daily-tickets.json");
  const schemaId = `${SCHEMA_PREFIX}schemas/support-quality-daily.schema.json`;
  it("accepts every new member, measured, and finds nothing in them", async () => {
    const ajv = await createValidator();
    const value = tickets();
    const result = validateDocument(ajv, schemaId, value);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
    expect(paths(value)).toEqual([]);
    expect(Object.keys(value.open).sort()).toEqual(["awaitingApproval", "awaitingCustomer", "handedOpen", "questionOpen"]);
    expect(Object.keys(value.outcomes).sort()).toEqual(["answeredElsewhere", "customerSilent", "expired", "expiredByDecision", "firstReplyLate", "handoffsClosedByPerson", "noReplyOwed", "promotions", "referred", "unanswered"]);
  });
  it("leaves a payload without them valid and unread, as before DEC-0151", async () => {
    const ajv = await createValidator();
    const result = validateDocument(ajv, schemaId, positive("support-quality-daily.json"));
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
    expect(paths(ok())).toEqual([]);
  });
  it("applies the not-measured rule to each new member, at the top level and in each object", () => {
    const value = tickets();
    value.arrived = null;
    value.open.awaitingApproval = null;
    value.outcomes.expired = null;
    value.autonomy.answered = null;
    value.stability.fallbackTickets = null;
    expect(paths(value).sort()).toEqual(["FAC-SEM-126 /arrived", "FAC-SEM-126 /autonomy/answered", "FAC-SEM-126 /open/awaitingApproval", "FAC-SEM-126 /outcomes/expired", "FAC-SEM-126 /stability/fallbackTickets"]);
    value.notMeasured = [...value.notMeasured, "arrived", "open.awaitingApproval", "outcomes.expired", "autonomy.answered", "stability.fallbackTickets"];
    expect(paths(value)).toEqual([]);
    const zero = tickets();
    zero.notMeasured = [...zero.notMeasured, "notATicket", "outcomes.promotions", "stability.fallbackTurns"];
    expect(paths(zero).sort()).toEqual(["FAC-SEM-126 /notATicket", "FAC-SEM-126 /outcomes/promotions", "FAC-SEM-126 /stability/fallbackTurns"]);
  });
  it("names only what the payload carries: an absent member named not measured is a finding", () => {
    const value = ok();
    value.notMeasured = [...value.notMeasured, "ended", "outcomes.unanswered"];
    expect(paths(value)).toEqual(["FAC-SEM-126 /notMeasured", "FAC-SEM-126 /notMeasured"]);
    const malformed = Object.assign(ok(), { open: "x", outcomes: [1], notMeasured: [...ok().notMeasured, "open.handedOpen"] });
    expect(paths(malformed)).toEqual(["FAC-SEM-126 /notMeasured"]);
  });
  it("says a top-level name that is no metric is not one, and an unknown name is not carried (DEC-0151)", () => {
    const messages = (value: unknown) => evaluateSemanticRules("support-quality-daily", value).map((f) => `${f.instancePath} ${f.message}`);
    for (const name of ["project", "day", "kind", "outcomes", "calibration"]) {
      expect(messages(Object.assign(tickets(), { notMeasured: [...tickets().notMeasured, name] }))).toEqual([`/notMeasured notMeasured names ${name}, which is not a metric`]);
    }
    expect(messages(Object.assign(ok(), { notMeasured: [...ok().notMeasured, "arrived", "lostTickets"] }))).toEqual([
      "/notMeasured notMeasured names arrived, which the payload does not carry",
      "/notMeasured notMeasured names lostTickets, which the payload does not carry"
    ]);
  });
  it("adds no sum the channel agent standard does not state: an outcome count above ended, or an open count above arrived, is no finding", () => {
    const value = tickets();
    value.outcomes.referred = value.ended + 1;
    value.open.handedOpen = value.arrived + 1;
    expect(paths(value)).toEqual([]);
  });
  it("lets notMeasured name a metric with a digit, as FAC-SEM-126 asks of nobodyDropped.firstReplyP50Ms (X-4)", async () => {
    const ajv = await createValidator();
    const value = positive("support-quality-daily-first-reply-unmeasured.json");
    expect(value.notMeasured).toContain("nobodyDropped.firstReplyP50Ms");
    const result = validateDocument(ajv, schemaId, value);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
    expect(paths(value)).toEqual([]);
    for (const name of ["nobody2Dropped.turns", "outcomes.9expired", "outcomes.expired-", "Outcomes.expired", "outcomes."]) {
      const refused = Object.assign(ok(), { notMeasured: [name] });
      expect(validateDocument(ajv, schemaId, refused).valid, name).toBe(false);
    }
  });
  it("maps each of the channel agent standard's seven channel kinds onto one of /1's four channels, adding none", () => {
    const schema = JSON.parse(readFileSync(path.join(projectRoot(), "schemas/support-quality-daily.schema.json"), "utf8")) as Json;
    expect(schema.properties.channel.enum).toEqual(["chat", "mail", "reviews", "community"]);
    const page = readFileSync(path.join(projectRoot(), "docs/specification/support-quality.md"), "utf8");
    const start = page.indexOf("### The channel agent standard's channel kinds");
    expect(start).toBeGreaterThan(0);
    const section = page.slice(start, page.indexOf("## Semantic rules"));
    const rows = [...section.matchAll(/^\| `([a-z_]+)` \| `([a-z]+)` \|/gm)].map((match) => [match[1], match[2]]);
    expect(rows.map(([kind]) => kind).sort()).toEqual(["account", "mail", "public_comment", "store_review", "team_chat", "telegram_dm", "telegram_group"]);
    for (const [, channel] of rows) expect(schema.properties.channel.enum).toContain(channel);
  });
  it("keys two projects' days on one channel apart by project, the registry's project:<slug> (DEC-0151)", async () => {
    const schema = JSON.parse(readFileSync(path.join(projectRoot(), "schemas/support-quality-daily.schema.json"), "utf8")) as Json;
    const common = JSON.parse(readFileSync(path.join(projectRoot(), "schemas/comms-common.schema.json"), "utf8")) as Json;
    // The project registry's alias, project:<slug>, as the channel agent declaration names a project (DEC-0150).
    expect(schema.$defs.projectAlias.pattern).toBe("^project:[a-z0-9][a-z0-9._-]{0,127}$");
    expect(schema.$defs.projectId).toBeUndefined();
    expect(common.$defs.projectId.pattern).not.toBe(schema.$defs.projectAlias.pattern);
    expect(schema.required).not.toContain("project");
    const ajv = await createValidator();
    const page = positive("service-events-page-support-quality-projects.json");
    const pageResult = validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-events-page.schema.json`, page);
    expect(pageResult.valid, JSON.stringify(pageResult.errors)).toBe(true);
    expect(evaluateSemanticRules("service-events-page", page)).toEqual([]);
    const values = (page.events as Json[]).map((event) => event.data.value as Json);
    for (const value of values) {
      const result = validateDocument(ajv, schemaId, value);
      expect(result.valid, JSON.stringify(result.errors)).toBe(true);
      expect(paths(value)).toEqual([]);
    }
    // A reader that adopted DEC-0151 keys by service, channel, day and project: the two days stand side by side.
    const key = (value: Json) => [value.channel, value.day, value.project ?? ""].join(" ");
    expect(values.map((value) => [value.channel, value.day].join(" "))).toEqual(["chat 2026-10-18", "chat 2026-10-18"]);
    expect(new Set(values.map(key)).size).toBe(2);
    for (const project of ["project:alpha support", "alpha", "project:Alpha", "project:", `project:${"a".repeat(129)}`]) {
      expect(validateDocument(ajv, schemaId, Object.assign(tickets(), { project })).valid, project).toBe(false);
    }
    expect(validateDocument(ajv, schemaId, positive("support-quality-daily-project.json")).valid).toBe(true);
    expect(validateDocument(ajv, schemaId, Object.assign(tickets(), { project: `project:${"a".repeat(128)}` })).valid).toBe(true);
  });
  it("refuses a 40-character mixed-case id as a project, the shape FAC-SEM-101 would read as a credential (DEC-0151)", async () => {
    const ajv = await createValidator();
    // Built at run time from a fixed alphabet, so no credential-shaped literal sits in the repository.
    const alphabet = "aB3cD4eF5gH6jK7mN8pQ9rS2tU";
    const id = Array.from({ length: 40 }, (_, index) => alphabet[(index * 7) % alphabet.length]).join("");
    expect(id).toHaveLength(40);
    expect(/[a-z]/.test(id) && /[A-Z]/.test(id)).toBe(true);
    expect(validateDocument(ajv, schemaId, Object.assign(tickets(), { project: id })).valid).toBe(false);
    expect(validateDocument(ajv, schemaId, Object.assign(tickets(), { project: `project:${id}` })).valid).toBe(false);
  });
  it("keeps DEC-0070's bounds: every object of the schema at most 32 members, and the whole payload inside an events page", async () => {
    const schema = JSON.parse(readFileSync(path.join(projectRoot(), "schemas/support-quality-daily.schema.json"), "utf8")) as Json;
    expect(Object.keys(schema.properties)).toHaveLength(19);
    for (const member of Object.values(schema.properties) as Json[]) {
      if (member.properties) expect(Object.keys(member.properties).length).toBeLessThanOrEqual(10);
      if (member.maxProperties !== undefined) expect(member.maxProperties).toBeLessThanOrEqual(16);
    }
    expect(Object.keys(schema.properties.outcomes.properties)).toHaveLength(10);
    // DEC-0151's refused alternative, the outcomes at the top level: 28 members, inside 32 too.
    expect(Object.keys(schema.properties).length - 1 + Object.keys(schema.properties.outcomes.properties).length).toBe(28);
    expect(schema.properties.notMeasured.maxItems).toBe(32);
    const ajv = await createValidator();
    const page = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-events-page-data.json"), "utf8")) as Json;
    const event = (page.events as Json[]).find((entry) => entry.data) as Json;
    event.data = { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: tickets() };
    const result = validateDocument(ajv, `${SCHEMA_PREFIX}schemas/service-events-page.schema.json`, page);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });
});
