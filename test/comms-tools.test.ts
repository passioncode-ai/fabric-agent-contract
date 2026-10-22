import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { type Mutant, killers } from "./schema-mutants.js";

// fabric-project-comms/0.1, the tools' arguments and answers (DEC-0073): the table in the specification names a schema
// for every tool, every argument schema is closed, the directory carries no content, and every refusal a new schema
// makes is a constraint some negative fixture proves (a mutant that removes it is killed).
const root = projectRoot();
const read = (file: string) => readFile(path.join(root, file), "utf8");
const spec = await read("docs/specification/project-comms.md");
const schema = async (name: string) => JSON.parse(await read(`schemas/${name}`)) as Record<string, any>;

/** The rows of the markdown table that follows `heading`, as cell arrays. */
function rows(heading: string): string[][] {
  const start = spec.indexOf(heading);
  expect(start, `section ${heading}`).toBeGreaterThanOrEqual(0);
  const lines = spec.slice(start).split("\n");
  const table = lines.slice(lines.findIndex((line) => line.startsWith("|")));
  const body = table.slice(0, table.findIndex((line) => !line.startsWith("|")));
  return body.slice(2).map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
}
const ticked = (cell: string) => [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1] as string);

const TOOLS = rows("## Tools, arguments and answers");
const GROUPS = rows("## Capability negotiation and host health");

describe("fabric-project-comms/0.1 tools (DEC-0073)", () => {
  it("lists seventeen tools once each, the same set as the capability groups", () => {
    const tools = TOOLS.map((row) => ticked(row[0] as string)[0]);
    expect(tools).toHaveLength(17);
    expect(new Set(tools).size).toBe(17);
    const grouped = GROUPS.flatMap((row) => ticked(row[1] as string));
    expect([...grouped].sort()).toEqual([...tools].sort());
    expect(tools).toContain("com.directory");
  });

  it("names an argument and an answer schema for each tool, and each exists", () => {
    for (const row of TOOLS) {
      const [args, answer] = [ticked(row[1] as string), ticked(row[2] as string)];
      expect(args, row[0]).toHaveLength(1);
      expect(answer[0], row[0]).toMatch(/^comms-.*\.schema\.json$/);
      for (const name of [args[0], answer[0]]) expect(existsSync(path.join(root, "schemas", name as string)), name).toBe(true);
    }
  });

  it("closes every argument schema: an unknown member is refused before anything is stored", async () => {
    for (const name of new Set(TOOLS.map((row) => ticked(row[1] as string)[0] as string))) {
      const value = await schema(name);
      const branches: Record<string, any>[] = value.oneOf ?? [value];
      for (const branch of branches) expect(branch.additionalProperties, name).toBe(false);
    }
  });

  it("makes every mutation but a read mark carry an idempotency key or a fence", async () => {
    const mutations = TOOLS.filter((cells) => cells[3] !== "— (a read)" && ticked(cells[0] as string)[0] !== "com.read_ack");
    expect(mutations).toHaveLength(12);
    for (const row of mutations) {
      const value = await schema(ticked(row[1] as string)[0] as string);
      for (const branch of (value.oneOf ?? [value]) as Record<string, any>[]) {
        expect(branch.required.some((member: string) => member === "idempotency" || member === "fence"), row[0]).toBe(true);
      }
    }
  });

  it("answers a mutation with the one receipt, which names no sequence number", async () => {
    const receipt = await schema("comms-receipt.schema.json");
    expect(Object.keys(receipt.properties).sort()).toEqual(["alreadyRead", "at", "attempt", "marked", "message", "more", "noResponder", "ok", "repeated", "request", "slot", "thread", "transferred"]);
    for (const row of TOOLS.filter((cells) => cells[3] !== "— (a read)")) expect(ticked(row[2] as string)[0], row[0]).toBe("comms-receipt.schema.json");
  });

  it("DEC-0078: a replacement's receipt gives each transferred request the attempt in the shape of `attempt`, and nothing else", async () => {
    const receipt = await schema("comms-receipt.schema.json");
    const item = receipt.properties.transferred.items;
    expect(Object.keys(item.properties).sort()).toEqual(["attempt", "request", "revision"]);
    expect(item.additionalProperties).toBe(false);
    expect(item.properties.attempt).toEqual({ $ref: "#/properties/attempt" });
    expect(receipt.properties.transferred.maxItems).toBe(64);
  });

  it("DEC-0081: the message view and the receipt name only an owner settlement, and only once the request is settled", async () => {
    const common = await schema("comms-common.schema.json");
    // A board sends settledBy on an owner settlement and on nothing else: absent means the responder settled it.
    expect(common.$defs.settledBy).toMatchObject({ const: "owner" });
    expect(common.$defs.settledBy.enum).toBeUndefined();
    const message = await schema("comms-message.schema.json");
    const receipt = await schema("comms-receipt.schema.json");
    for (const request of [message.properties.request, receipt.properties.request]) {
      expect(request.properties.settledBy).toEqual({ $ref: "comms-common.schema.json#/$defs/settledBy" });
      expect(request.required).not.toContain("settledBy");
      expect(request.then.properties.state.enum).toEqual(["completed", "failed_known"]);
    }
    // com.status reports responders and health, never a request, so it carries no settledBy.
    expect(JSON.stringify(await schema("comms-status.schema.json"))).not.toContain("settledBy");
    // The owner calls com.reconcile with the same closed arguments: no caller, role or principal member.
    const reconcile = await schema("comms-reconcile.schema.json");
    expect(Object.keys(reconcile.properties).sort()).toEqual(["digest", "expectedRevision", "idempotency", "outcome", "request"]);
    expect(reconcile.properties.outcome.required).toEqual(["state", "observed"]);
  });

  it("DEC-0081: states who may reconcile, the owner's conditions and the absent abandon path", () => {
    const flat = spec.replace(/\s+/g, " ");
    const lifecycle = rows("## Request lifecycle").find((row) => row[0] === "`com.reconcile`");
    expect(lifecycle?.[1]).toContain("the current responder, or the estate owner when no responder holds the slot (DEC-0081)");
    const section = flat.slice(flat.indexOf("### Owner settlement"), flat.indexOf("## Responders and fences"));
    const phrases = [
      "`trusted`", "No Project grant makes", "`outcome_unknown`", "the slot is absent", "no current enrollment",
      "`not_authorized`", "the current responder settles it", "`observed: true`", "1–2,000 characters", "`observation_required`",
      "No abandon path", "never fakes knowledge", "`settledBy`", "`invalid_transition`", "never reopened", "`FAC-SEM-109`",
      // The owner's review (PR #102): only the target Project's owner, the real paths in, a late responder's refusals,
      // and a settling record that names its settler.
      "owns the request's target Project", "another member's operator included", "the sender's `com.cancel` after the effect began",
      "This decision adds no transition", "`fenced` / `revision_conflict`", "never committed", "on nothing else",
      "Every `complete` and `reconcile` record carries `settledBy`"
    ];
    for (const phrase of phrases) expect(section, phrase).toContain(phrase);
  });

  it("DEC-0080: a finding is four members, links a row by repository, path and id, and adds no evidence member", async () => {
    const common = await schema("comms-common.schema.json");
    const finding = common.$defs.finding;
    expect(Object.keys(finding.properties).sort()).toEqual(["affects", "consequence", "dedupeKey", "severity"]);
    expect([...finding.required].sort()).toEqual(["affects", "consequence", "dedupeKey", "severity"]);
    expect(finding.additionalProperties).toBe(false);
    expect(common.$defs.findingSeverity.enum).toEqual(["info", "warning", "blocking"]);
    expect(Object.keys(common.$defs.affectedRow.properties).sort()).toEqual(["id", "path", "repository"]);
    expect(common.$defs.affectedTask.properties.task).toEqual({ $ref: "#/$defs/hostTaskId" });
    // A task is the host's task in a delegation token's grammar (DEC-0041), not a board-issued opaque id.
    const delegation = await schema("delegation-token.schema.json");
    expect(common.$defs.hostTaskId.pattern).toBe(delegation.$defs.task.pattern);
    expect(common.$defs.affectedRedacted.properties).toEqual({ redacted: { const: true } });
    expect(common.$defs.messageKind.enum).toContain("finding");
    const [submit, message] = [await schema("comms-submit.schema.json"), await schema("comms-message.schema.json")];
    expect(submit.properties.finding.$ref).toBe("comms-common.schema.json#/$defs/finding");
    expect(submit.properties.finding.properties.affects.items).toEqual({ not: { $ref: "comms-common.schema.json#/$defs/affectedRedacted" } });
    expect(message.properties.finding).toMatchObject({ $ref: "comms-common.schema.json#/$defs/finding" });
    expect(message.properties.finding.properties).toBeUndefined();
    // A moderator's redaction removes the finding with the body; a finding's submit key holds 128 random bits.
    expect(message.then.properties).toEqual({ body: false, finding: false });
    const keyRule = (submit.allOf as Record<string, any>[]).find((branch) => branch.if?.required?.includes("finding"));
    expect(keyRule?.then.properties.idempotency.properties.key.minLength).toBe(22);
    expect(Math.floor(22 * Math.log2(66))).toBeGreaterThanOrEqual(128);
    expect(Math.floor(21 * Math.log2(66))).toBeLessThan(128);
    // The limits table states the schema's bounds.
    const limits = new Map(rows("## Limits").map((cells) => [cells[0], cells[1]]));
    expect(finding.properties.affects.maxItems).toBe(16);
    expect(limits.get("Items a finding affects")).toBe("16");
    expect(finding.properties.consequence.maxLength).toBe(500);
    expect(limits.get("A finding's consequence")).toBe("500 characters (code points)");
    expect(common.$defs.dedupeKey.pattern).toBe("^[A-Za-z0-9._:-]{8,128}$");
    expect(limits.get("A finding's `dedupeKey`")).toBe("8–128 characters `[A-Za-z0-9._:-]`");
  });

  it("keeps the directory to ids, names, capabilities, responder state and the operator's hold", async () => {
    const directory = await schema("comms-directory.schema.json");
    const entry = directory.properties.projects.items;
    expect(Object.keys(entry.properties).sort()).toEqual(["capabilities", "id", "name"]);
    expect(entry.additionalProperties).toBe(false);
    const item = entry.properties.capabilities.items;
    expect(Object.keys(item.properties).sort()).toEqual(["capability", "held", "responder"]);
    expect(item.additionalProperties).toBe(false);
    expect(Object.keys(directory.properties).sort()).toEqual(["cursor", "projects", "protocol", "snapshot"]);
    const status = await schema("comms-status.schema.json");
    expect(item.properties.responder.enum).toEqual(status.properties.responders.items.properties.state.enum);
  });

  it("DEC-0079: shows a hold as one optional boolean per capability, in com.status and the directory alike", async () => {
    const directory = await schema("comms-directory.schema.json");
    const status = await schema("comms-status.schema.json");
    const item = directory.properties.projects.items.properties.capabilities.items;
    const responder = status.properties.responders.items;
    for (const member of [item.properties.held, responder.properties.held]) expect(member.type).toBe("boolean");
    expect(item.required).not.toContain("held");
    expect(responder.required).not.toContain("held");
    expect(directory.properties.projects.items.properties).not.toHaveProperty("held");
    const refusal = await schema("comms-refusal.schema.json");
    expect(refusal.properties.error.if.properties.code).toEqual({ const: "held" });
    expect(refusal.properties.error.then.properties.retryable).toEqual({ const: true });
  });

  it("states the directory's boundary: same estate and owner, no content, operator opt-out that is discovery only", () => {
    const section = spec.slice(spec.indexOf("## Project directory"), spec.indexOf("## Transport mirror")).replace(/\s+/g, " ");
    const phrases = [
      "Never across estates", "Never content", "Opt-out", "no tool sets", "`not_authorized`",
      "a managed session", "an enrolled session", "a viewer principal", "share-grant principal (T2)",
      "another owner's Project", "Unlisting is discovery only", "already knows its id", "survives a restore",
      "ordered by name and then id", "the restore epoch"
    ];
    for (const phrase of phrases) expect(section, phrase).toContain(phrase);
  });
});

const responderBranch = (s: Record<string, any>) => s.oneOf.find((branch: Record<string, any>) => branch.required.includes("fence"));
const participantBranch = (s: Record<string, any>) => s.oneOf.find((branch: Record<string, any>) => branch.required.includes("replyTo"));
const without = (list: string[], member: string) => list.filter((name) => name !== member);

const common = (s: Record<string, any>) => s.$defs as Record<string, any>;
const findingOf = (s: Record<string, any>) => common(s).finding as Record<string, any>;
const finding = (s: Record<string, any>) => s.properties.finding as Record<string, any>;
const findingRule = (s: Record<string, any>) => (s.allOf as Record<string, any>[]).findIndex((branch) => branch.if?.properties?.kind?.const === "finding");
const C = "comms-common.schema.json";
const SUBMIT = "comms-submit.schema.json";
const MESSAGE = "comms-message.schema.json";

/**
 * Each refusal of a new schema, the mutant that removes it, and the negative fixture that must kill the mutant. A plant
 * with `fixtures` mutates a shared definition and is proven by the fixtures of the schema that refers to it.
 */
const PLANTS: Array<{ schema: string; killer: string; fixtures?: string } & Mutant> = [
  // DEC-0080: the structured finding.
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-with-evidence", name: "finding open", mutate: (s) => { findingOf(s).additionalProperties = true; } },
  ...["severity", "consequence", "affects", "dedupeKey"].map((member) => ({ schema: C, fixtures: SUBMIT, killer: `comms-submit-finding-without-${member === "dedupeKey" ? "dedupe-key" : member}`, name: `${member} optional`, mutate: (s: Record<string, any>) => { findingOf(s).required = without(findingOf(s).required, member); } })),
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-bad-severity", name: "severity any string", mutate: (s) => { common(s).findingSeverity = { type: "string" }; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-consequence-too-long", name: "consequence unbounded", mutate: (s) => { delete findingOf(s).properties.consequence.maxLength; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-consequence-empty", name: "consequence may be empty", mutate: (s) => { delete findingOf(s).properties.consequence.minLength; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-affects-over-limit", name: "affects unbounded", mutate: (s) => { delete findingOf(s).properties.affects.maxItems; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-affects-empty", name: "affects may be empty", mutate: (s) => { delete findingOf(s).properties.affects.minItems; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-row-copied", name: "a row reference copies the row", mutate: (s) => { common(s).affectedRow.additionalProperties = true; } },
  ...["repository", "path", "id"].map((member) => ({ schema: C, fixtures: SUBMIT, killer: `comms-submit-finding-row-without-${member}`, name: `row ${member} optional`, mutate: (s: Record<string, any>) => { common(s).affectedRow.required = without(common(s).affectedRow.required, member); } })),
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-task-open", name: "task reference open", mutate: (s) => { common(s).affectedTask.additionalProperties = true; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-repository-url", name: "repository any owner/name-ish string", mutate: (s) => { common(s).repositoryName.pattern = "^.+/.+$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-repository-dot", name: "repository name may be . or ..", mutate: (s) => { common(s).repositoryName.pattern = "^[A-Za-z0-9][A-Za-z0-9-]{0,38}/[A-Za-z0-9._-]{1,100}$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-path-traversal", name: "path segment may be ..", mutate: (s) => { common(s).repositoryPath.pattern = "^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-path-hidden", name: "path segment may start with a dot", mutate: (s) => { common(s).repositoryPath.pattern = "^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)*$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-path-absolute", name: "path may start with a slash", mutate: (s) => { common(s).repositoryPath.pattern = "^/?[A-Za-z0-9_-][A-Za-z0-9._-]*(/[A-Za-z0-9_-][A-Za-z0-9._-]*)*$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-path-empty-segment", name: "path may hold an empty segment", mutate: (s) => { common(s).repositoryPath.pattern = "^[A-Za-z0-9_-][A-Za-z0-9._-]*(/[A-Za-z0-9._-]*)*$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-path-too-long", name: "path unbounded", mutate: (s) => { delete common(s).repositoryPath.maxLength; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-row-id-too-long", name: "row id unbounded", mutate: (s) => { common(s).backlogRowId.pattern = "^[A-Za-z0-9][A-Za-z0-9._-]*$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-row-id-space", name: "row id may hold a space", mutate: (s) => { common(s).backlogRowId.pattern = "^[A-Za-z0-9][A-Za-z0-9._ -]{0,63}$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-dedupe-key-short", name: "dedupeKey below 8", mutate: (s) => { common(s).dedupeKey.pattern = "^[A-Za-z0-9._:-]{1,128}$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-dedupe-key-long", name: "dedupeKey above 128", mutate: (s) => { common(s).dedupeKey.pattern = "^[A-Za-z0-9._:-]{8,}$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-dedupe-key-slash", name: "dedupeKey any character", mutate: (s) => { common(s).dedupeKey.pattern = "^.{8,128}$"; } },
  { schema: SUBMIT, killer: "comms-submit-finding-duplicate-affects", name: "a submit may repeat an item", mutate: (s) => { delete finding(s).properties.affects.uniqueItems; } },
  { schema: SUBMIT, killer: "comms-submit-finding-redacted-item", name: "a submit may carry a redacted item", mutate: (s) => { delete finding(s).properties.affects.items; } },
  { schema: SUBMIT, killer: "comms-submit-finding-on-message", name: "finding on any kind of submit", mutate: (s) => { s.allOf[findingRule(s)] = true; } },
  { schema: MESSAGE, killer: "comms-message-finding-on-message", name: "finding on any kind of message", mutate: (s) => { s.allOf[findingRule(s)] = true; } },
  { schema: C, fixtures: MESSAGE, killer: "comms-message-finding-redacted-false", name: "redacted any boolean", mutate: (s) => { common(s).affectedRedacted.properties.redacted = { type: "boolean" }; } },
  { schema: C, fixtures: MESSAGE, killer: "comms-message-finding-redacted-with-row", name: "a redacted item keeps what it names", mutate: (s) => { common(s).affectedRedacted.additionalProperties = true; } },
  { schema: MESSAGE, killer: "comms-message-finding-redacted-message", name: "a redacted message keeps its finding", mutate: (s) => { delete s.then.properties.finding; } },
  { schema: SUBMIT, killer: "comms-submit-finding-key-short", name: "a finding's key any length", mutate: (s) => { s.allOf[(s.allOf as Record<string, any>[]).findIndex((branch) => branch.if?.required?.includes("finding"))] = true; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-task-too-long", name: "task id unbounded", mutate: (s) => { common(s).hostTaskId.pattern = "^[A-Za-z0-9._:-]{1,}$"; } },
  { schema: C, fixtures: SUBMIT, killer: "comms-submit-finding-task-slash", name: "task id any character", mutate: (s) => { common(s).hostTaskId.pattern = "^.{1,128}$"; } },

  { schema: "comms-receipt.schema.json", killer: "comms-receipt-with-seq", name: "receipt open to unknown members", mutate: (s) => { s.additionalProperties = true; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-not-ok", name: "ok any boolean", mutate: (s) => { s.properties.ok = { type: "boolean" }; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-without-ok", name: "ok optional", mutate: (s) => { s.required = without(s.required, "ok"); } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-without-repeated", name: "repeated optional", mutate: (s) => { s.required = without(s.required, "repeated"); } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-request-with-seq", name: "request open", mutate: (s) => { s.properties.request.additionalProperties = true; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-slot-with-holder", name: "slot open", mutate: (s) => { s.properties.slot.additionalProperties = true; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-attempt-with-seq", name: "attempt open", mutate: (s) => { s.properties.attempt.additionalProperties = true; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-transferred-with-holder", name: "transferred item open", mutate: (s) => { s.properties.transferred.items.additionalProperties = true; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-transferred-over-limit", name: "transferred unbounded", mutate: (s) => { delete s.properties.transferred.maxItems; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-transferred-without-attempt", name: "transferred attempt optional", mutate: (s) => { s.properties.transferred.items.required = ["request", "revision"]; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-transferred-attempt-with-seq", name: "transferred attempt not the attempt shape", mutate: (s) => { s.properties.transferred.items.properties.attempt = { type: "object" }; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-transferred-empty", name: "transferred may be empty", mutate: (s) => { delete s.properties.transferred.minItems; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-transferred-without-request", name: "transferred request optional", mutate: (s) => { s.properties.transferred.items.required = ["revision", "attempt"]; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-transferred-without-revision", name: "transferred revision optional", mutate: (s) => { s.properties.transferred.items.required = ["request", "attempt"]; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-settled-by-unknown", name: "settledBy any string", mutate: (s) => { s.properties.request.properties.settledBy = { type: "string" }; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-settled-while-unknown", name: "settledBy on any state", mutate: (s) => { delete s.properties.request.if; delete s.properties.request.then; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-settled-cancelled", name: "settledBy on any terminal state", mutate: (s) => { s.properties.request.then.properties.state.enum = ["completed", "failed_known", "cancelled", "expired"]; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-settled-by-responder", name: "settledBy names the responder too", mutate: (s) => { s.properties.request.properties.settledBy = { enum: ["responder", "owner"] }; } },
  { schema: "comms-message.schema.json", killer: "comms-message-settled-by-responder", name: "message settledBy names the responder too", mutate: (s) => { s.properties.request.properties.settledBy = { enum: ["responder", "owner"] }; } },
  { schema: "comms-message.schema.json", killer: "comms-message-settled-by-unknown", name: "message settledBy any string", mutate: (s) => { s.properties.request.properties.settledBy = { type: "string" }; } },
  { schema: "comms-message.schema.json", killer: "comms-message-settled-while-unknown", name: "message settledBy on any state", mutate: (s) => { delete s.properties.request.if; delete s.properties.request.then; } },
  { schema: "comms-message.schema.json", killer: "comms-message-settled-expired", name: "message settledBy on any terminal state", mutate: (s) => { s.properties.request.then.properties.state.enum = ["completed", "failed_known", "cancelled", "expired"]; } },
  { schema: "comms-reply.schema.json", killer: "comms-reply-fence-and-replyto", name: "responder reply open", mutate: (s) => { responderBranch(s).additionalProperties = true; } },
  { schema: "comms-reply.schema.json", killer: "comms-reply-fence-and-replyto", name: "participant reply open", mutate: (s) => { participantBranch(s).additionalProperties = true; } },
  { schema: "comms-reply.schema.json", killer: "comms-reply-neither", name: "responder reply without fence", mutate: (s) => { responderBranch(s).required = ["body"]; } },
  { schema: "comms-reconcile.schema.json", killer: "comms-reconcile-unobserved", name: "observed any boolean", mutate: (s) => { s.properties.outcome.properties.observed = { type: "boolean" }; } },
  { schema: "comms-reconcile.schema.json", killer: "comms-reconcile-without-digest", name: "digest optional", mutate: (s) => { s.required = without(s.required, "digest"); } },
  { schema: "comms-claim.schema.json", killer: "comms-claim-forged-project", name: "claim open", mutate: (s) => { s.additionalProperties = true; } },
  { schema: "comms-claim.schema.json", killer: "comms-claim-without-idempotency", name: "claim without key", mutate: (s) => { s.required = without(s.required, "idempotency"); } },
  { schema: "comms-enroll.schema.json", killer: "comms-enroll-forged-principal", name: "enroll open", mutate: (s) => { s.additionalProperties = true; } },
  { schema: "comms-cancel.schema.json", killer: "comms-cancel-forged-sender", name: "cancel open", mutate: (s) => { s.additionalProperties = true; } },
  { schema: "comms-cancel.schema.json", killer: "comms-cancel-reason-too-long", name: "reason unbounded", mutate: (s) => { delete s.properties.reason.maxLength; } },
  { schema: "comms-list.schema.json", killer: "comms-list-limit-over-page", name: "limit above a page", mutate: (s) => { delete s.properties.limit.maximum; } },
  { schema: "comms-message-ref.schema.json", killer: "comms-message-ref-without-message", name: "message optional", mutate: (s) => { s.required = []; } },
  { schema: "comms-status-args.schema.json", killer: "comms-status-args-forged-estate", name: "status arguments open", mutate: (s) => { s.additionalProperties = true; } },
  { schema: "comms-fenced.schema.json", killer: "comms-fenced-without-fence", name: "fence optional", mutate: (s) => { s.required = []; } },
  { schema: "comms-progress.schema.json", killer: "comms-progress-note-too-long", name: "note unbounded", mutate: (s) => { delete s.properties.note.properties.text.maxLength; } },
  { schema: "comms-effect-begin.schema.json", killer: "comms-effect-begin-without-fence", name: "effect without fence", mutate: (s) => { s.required = []; } },
  { schema: "comms-responder-replace.schema.json", killer: "comms-responder-replace-duplicate-transfer", name: "transfer repeats a request", mutate: (s) => { s.properties.transfer.properties.requests.uniqueItems = false; } },
  { schema: "comms-status.schema.json", killer: "comms-status-epoch-zero", name: "epoch zero", mutate: (s) => { s.properties.idempotency.properties.epoch.minimum = 0; } },
  { schema: "comms-directory-args.schema.json", killer: "comms-directory-args-forged-estate", name: "directory arguments open", mutate: (s) => { s.additionalProperties = true; } },
  { schema: "comms-directory-args.schema.json", killer: "comms-directory-args-limit-over-page", name: "limit above a directory page", mutate: (s) => { delete s.properties.limit.maximum; } },
  { schema: "comms-directory.schema.json", killer: "comms-directory-snapshot-with-count", name: "snapshot open", mutate: (s) => { s.properties.snapshot.additionalProperties = true; } },
  { schema: "comms-directory.schema.json", killer: "comms-directory-over-page", name: "page unbounded", mutate: (s) => { delete s.properties.projects.maxItems; } },
  { schema: "comms-directory.schema.json", killer: "comms-directory-entry-with-content", name: "entry open", mutate: (s) => { s.properties.projects.items.additionalProperties = true; } },
  { schema: "comms-directory.schema.json", killer: "comms-directory-entry-with-generation", name: "capability item open", mutate: (s) => { s.properties.projects.items.properties.capabilities.items.additionalProperties = true; } },
  { schema: "comms-directory.schema.json", killer: "comms-directory-with-count", name: "directory open", mutate: (s) => { s.additionalProperties = true; } },
  { schema: "comms-directory.schema.json", killer: "comms-directory-held-not-boolean", name: "held any value", mutate: (s) => { s.properties.projects.items.properties.capabilities.items.properties.held = {}; } },
  { schema: "comms-directory.schema.json", killer: "comms-directory-entry-held", name: "held on the Project entry", mutate: (s) => { s.properties.projects.items.properties.held = { type: "boolean" }; } },
  { schema: "comms-status.schema.json", killer: "comms-status-held-not-boolean", name: "responder held any value", mutate: (s) => { s.properties.responders.items.properties.held = {}; } },
  { schema: "comms-refusal.schema.json", killer: "comms-refusal-held-not-retryable", name: "held may be final", mutate: (s) => { delete s.properties.error.if; delete s.properties.error.then; } },
  // DEC-0098: Fabric 0.3.9's board additions and the typed reaction.
  { schema: "comms-list.schema.json", killer: "comms-list-unread-string", name: "unread any value", mutate: (s) => { s.properties.unread = {}; } },
  { schema: "comms-read-ack.schema.json", killer: "comms-read-ack-too-many", name: "named messages unbounded", mutate: (s) => { delete s.oneOf[1].properties.messages.maxItems; } },
  { schema: "comms-read-ack.schema.json", killer: "comms-read-ack-repeated-message", name: "a message named twice", mutate: (s) => { delete s.oneOf[1].properties.messages.uniqueItems; } },
  { schema: "comms-read-ack.schema.json", killer: "comms-read-ack-two-forms", name: "named messages open", mutate: (s) => { s.oneOf[1].additionalProperties = true; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-more-false", name: "more any value", mutate: (s) => { s.properties.more = { type: "boolean" }; } },
  { schema: "comms-receipt.schema.json", killer: "comms-receipt-no-responder-without-message", name: "noResponder without its sentence", mutate: (s) => { s.properties.noResponder.required = ["target", "capability"]; } },
  { schema: C, fixtures: "comms-reply.schema.json", killer: "comms-reply-reaction-row-without-due", name: "row without a day", mutate: (s) => { common(s).reaction.allOf[1].then.required = []; } },
  { schema: C, fixtures: "comms-reply.schema.json", killer: "comms-reply-reaction-due-on-adapted", name: "a day on any reaction", mutate: (s) => { delete common(s).reaction.allOf[1].else; } },
  { schema: C, fixtures: "comms-reply.schema.json", killer: "comms-reply-reaction-adapted-without-ref", name: "adapted without a ref", mutate: (s) => { common(s).reaction.allOf[0].then.required = []; } },
  { schema: C, fixtures: "comms-reply.schema.json", killer: "comms-reply-reaction-unknown-type", name: "reaction any type", mutate: (s) => { common(s).reaction.properties.type = { type: "string" }; } },
  { schema: SUBMIT, killer: "comms-submit-reaction-on-message", name: "reaction on any kind", mutate: (s) => { s.allOf = (s.allOf as Record<string, any>[]).filter((branch) => !(branch.if?.properties?.kind?.const === "reply" && branch.else)); } },
  { schema: "comms-host-wait.schema.json", killer: "comms-host-wait-unknown-code", name: "code any string", mutate: (s) => { s.properties.code = { type: "string" }; } },
  { schema: "comms-host-wait.schema.json", killer: "comms-host-wait-not-retryable", name: "retryable any boolean", mutate: (s) => { s.properties.retryable = { type: "boolean" }; } },
  { schema: "comms-read-ack.schema.json", killer: "comms-read-ack-empty", name: "an empty list of messages", mutate: (s) => { s.oneOf[1].properties.messages.minItems = 0; } }
];

describe("every refusal of DEC-0073 and its amendments (DEC-0078, DEC-0079, DEC-0080) is killed by its fixture", () => {
  it.each(PLANTS)("$schema: $name → $killer", async ({ schema: file, killer, name, mutate, fixtures }) => {
    expect(await killers(file, { name, mutate }, fixtures)).toContain(killer);
  });

  // One compilation of the whole catalogue per schema: slower than vitest's 5 s default on a loaded machine.
  it("an unchanged schema accepts none of its negative fixtures", { timeout: 60_000 }, async () => {
    for (const pair of new Set(PLANTS.map((plant) => `${plant.schema} ${plant.fixtures ?? plant.schema}`))) {
      const [file, fixtures] = pair.split(" ") as [string, string];
      expect(await killers(file, { name: "identity", mutate: () => {} }, fixtures), pair).toEqual([]);
    }
  });
});
