import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { contextRules, grantContextFindings } from "../src/context-rules.js";
import { estateRecordDigest, placementTrust } from "../src/estate-record-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0082, the RM-28 pilot slice of N20: a context id (personal or org:<orgId>), a grant's context (FAC-SEM-110), and
// one agent placed on one machine once per context, an organization's instance under its context's share grant
// (FAC-SEM-074 and FAC-SEM-075 amended, FAC-SEM-111).
type Json = Record<string, any>;
const root = projectRoot();
const readText = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const load = (relative: string) => JSON.parse(readText(`fixtures/${relative}`)) as Json;
const validator = await createValidator();
const valid = (value: unknown, schema: string) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const at = (kind: string, value: unknown, code: string) => evaluateSemanticRules(kind, value).filter((finding) => finding.code === code).map((finding) => finding.instancePath);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seal = (record: Json): Json => ({ ...record, digest: estateRecordDigest(record) });

const contexts = load("positive/estate-record-contexts.json");
const first = load("positive/estate-record-first.json");
const agentPkg = load("positive/fabric-package-agent.json");
const ORG_A = "org:org_7kq2m4xw";
const ORG_B = "org:org_3fh9p1zc";
const AGENT = String(agentPkg.agentRef);
const grantA = contexts.shareGrants[1] as Json;
const estateSpec = readText("docs/specification/estate-record.md");
const contextsSpec = readText("docs/specification/contexts.md");
/** The contexts record with one change, its digest recomputed so only the change is under test. */
const changed = (edit: (record: Json) => void): Json => {
  const record = clone(contexts);
  edit(record);
  return seal(record);
};

describe("the schemas (DEC-0082)", () => {
  const common = JSON.parse(readText("schemas/common.schema.json")) as Json;
  const estate = JSON.parse(readText("schemas/estate-record.schema.json")) as Json;
  const governance = JSON.parse(readText("schemas/governance.schema.json")) as Json;

  it("define one context id and refer to it from the grant, the placement and the secret placement", () => {
    expect(common.$defs.contextId.pattern).toBe("^(?:personal|org:[A-Za-z0-9_-]{1,128})$");
    expect(governance.$defs.grant.properties.context.$ref).toBe("common.schema.json#/$defs/contextId");
    const machine = estate.$defs.machine.properties;
    expect(machine.packages.items.properties.context.$ref).toBe("common.schema.json#/$defs/contextId");
    expect(machine.packages.items.properties.grant.$ref).toBe("common.schema.json#/$defs/uri");
    expect(machine.secrets.items.properties.context.$ref).toBe("common.schema.json#/$defs/contextId");
  });

  it("require none of the new members, so every grant and record written before stays valid", () => {
    expect(governance.$defs.grant.required).not.toContain("context");
    expect(estate.$defs.machine.properties.packages.items.required).toEqual(["agentRef", "digest", "publisherKid"]);
    expect(estate.$defs.machine.properties.secrets.items.required).toEqual(["agentRef", "slot", "from"]);
    for (const file of ["positive/estate-record-first.json", "positive/estate-record-second.json"]) expect(valid(load(file), "estate-record.schema.json"), file).toBe(true);
    expect(valid(load("positive/governance-grant.json"), "governance.schema.json")).toBe(true);
  });

  it("accept the record with contexts and a share grant into an organization, and refuse a malformed context or grant", () => {
    expect(valid(contexts, "estate-record.schema.json")).toBe(true);
    expect(valid(load("positive/governance-grant-share-context.json"), "governance.schema.json")).toBe(true);
    for (const file of ["negative/estate-record-placement-context-too-long.json", "negative/estate-record-placement-grant-not-uri.json", "negative/estate-record-secret-context-malformed.json"]) {
      expect(valid(load(file), "estate-record.schema.json"), file).toBe(false);
    }
    for (const file of ["negative/governance-grant-context-capitalized.json", "negative/governance-grant-context-empty-org.json"]) expect(valid(load(file), "governance.schema.json"), file).toBe(false);
  });

  it("keep the share grant's context inside the estate record's closed share-grant shape", () => {
    expect(estate.properties.shareGrants.items.allOf[0].$ref).toBe("governance.schema.json#/$defs/grant");
    expect(valid(changed((record) => { record.shareGrants[1].context = "Org:org_7kq2m4xw"; }), "estate-record.schema.json")).toBe(false);
  });
});

describe("the semantic fixtures (FAC-SEM-110, FAC-SEM-111)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("grant-context-"));
  it.each(files)("%s yields exactly its expected codes and is schema-valid", (name) => {
    const fixture = load(`semantic/${name}`);
    expect(fixture.kind).toBe("grant");
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
    expect(valid(fixture.input, "governance.schema.json"), name).toBe(true);
  });

  it("covers FAC-SEM-110 refusing and passing", () => {
    const expected = files.map((name) => (load(`semantic/${name}`).expect as string[]).join(","));
    expect(expected).toContain("FAC-SEM-110");
    expect(expected.filter((entry) => entry === "").length).toBeGreaterThanOrEqual(3);
  });

  it("passes every positive grant fixture under kind grant", () => {
    const grants = readdirSync(path.join(root, "fixtures/positive")).filter((name) => name.startsWith("governance-grant"));
    expect(grants.length).toBeGreaterThanOrEqual(6);
    for (const name of grants) expect(codes("grant", load(`positive/${name}`)), name).toEqual([]);
  });
});

describe("FAC-SEM-110: a grant to an outside principal is never personal", () => {
  const share = load("positive/governance-grant-share-context.json");
  it("refuses a share grant whose context is personal, and names the member", () => {
    expect(at("grant", { ...share, context: "personal" }, "FAC-SEM-110")).toEqual(["/context"]);
  });
  it("allows an organization's context, an absent context, and personal for a grant to an agent or a session", () => {
    expect(codes("grant", share)).toEqual([]);
    const { context: _context, ...absent } = share;
    expect(codes("grant", absent)).toEqual([]);
    for (const principalKind of ["agent", "session", undefined]) expect(codes("grant", { ...share, principalKind, context: "personal" }), String(principalKind)).toEqual([]);
  });
  it("compares as written: only the exact personal is refused (a malformed one is the schema's)", () => {
    for (const context of ["Personal", "personal ", "org:personal", ORG_B]) expect(codes("grant", { ...share, context }), context).toEqual([]);
  });
  it("is checked on every share grant of an estate record, at its index", () => {
    const record = changed((r) => { r.shareGrants[2].context = "personal"; });
    expect(at("estate-record", record, "FAC-SEM-110")).toEqual(["/shareGrants/2/context"]);
  });
  it("reads a grant of the wrong shape without throwing", () => {
    for (const value of [null, 7, "x", [], { principalKind: ["external"], context: "personal" }]) expect(grantContextFindings(value, "")).toEqual([]);
    expect(contextRules("grant-window", share)).toBeUndefined();
  });
});

describe("FAC-SEM-074 and FAC-SEM-075 amended: once per context", () => {
  it("place one agent on one machine once per context, and pass", () => {
    const placed = contexts.machines[0].packages as Json[];
    expect(placed.map((entry) => entry.agentRef)).toEqual([AGENT, AGENT, AGENT]);
    expect(placed.map((entry) => entry.context)).toEqual([undefined, ORG_A, ORG_B]);
    expect(codes("estate-record", contexts)).toEqual([]);
  });
  it("refuse two placements in one context, an absent context and personal being one", () => {
    expect(at("estate-record", changed((r) => { r.machines[0].packages.push(clone(r.machines[0].packages[2])); }), "FAC-SEM-074")).toEqual(["/machines/0/packages/3/agentRef"]);
    expect(at("estate-record", changed((r) => { r.machines[0].packages.push({ ...r.machines[0].packages[0], context: "personal" }); }), "FAC-SEM-074")).toEqual(["/machines/0/packages/3/agentRef"]);
    // A record with no context anywhere is read as before: each placement personal.
    expect(codes("estate-record", first)).toEqual([]);
  });
  it("refuse one slot twice in one context, and a slot for an instance not placed in its context", () => {
    expect(at("estate-record", changed((r) => { r.machines[0].secrets.push(clone(r.machines[0].secrets[2])); }), "FAC-SEM-075")).toEqual(["/machines/0/secrets/3/slot"]);
    expect(at("estate-record", changed((r) => { r.machines[1].secrets[0].context = ORG_B; r.machines[1].secrets[0].from = "m-9a07"; }), "FAC-SEM-075")).toEqual(["/machines/1/secrets/0/agentRef"]);
    // A personal slot with context personal spelled out fills the personal instance.
    expect(codes("estate-record", changed((r) => { r.machines[0].secrets[0].context = "personal"; }))).toEqual([]);
  });
  it("never take a secret placement's context shaped like a credential, and never repeat it", () => {
    const shaped = `org:${["AK", "IA"].join("")}IOSFODNN7EXAMPLE`;
    const findings = evaluateSemanticRules("estate-record", changed((r) => { r.machines[0].secrets[1].context = shaped; }));
    expect(findings.filter((finding) => finding.code === "FAC-SEM-075").map((finding) => finding.instancePath)).toContain("/machines/0/secrets/1/context");
    expect(JSON.stringify(findings)).not.toContain(shaped);
  });
});

describe("FAC-SEM-111: an organization's instance runs under its context's share grant", () => {
  const at111 = (record: Json) => evaluateSemanticRules("estate-record", record).filter((finding) => finding.code === "FAC-SEM-111");
  it("refuses an organization's placement with no grant, or a grant that is not a string", () => {
    expect(at111(changed((r) => { delete r.machines[0].packages[1].grant; })).map((finding) => finding.instancePath)).toEqual(["/machines/0/packages/1/grant"]);
    expect(at111(changed((r) => { r.machines[0].packages[1].grant = 7; })).map((finding) => finding.message)).toEqual([expect.stringMatching(/names the share grant it runs under/)]);
  });
  it("refuses a grant the record does not list, and one of another context", () => {
    expect(at111(changed((r) => { r.machines[0].packages[1].grant = "urn:grant:estate:not-listed"; }))[0]?.message).toMatch(/has no share grant/);
    expect(at111(changed((r) => { r.machines[0].packages[1].grant = r.shareGrants[2].meta.id; }))[0]?.message).toMatch(/is not for the context org:org_7kq2m4xw/);
  });
  it("compares contexts as written: a grant whose context differs in case, or is absent, is another context", () => {
    expect(at111(changed((r) => { r.shareGrants[1].context = "org:ORG_7KQ2M4XW"; }))).toHaveLength(1);
    expect(at111(changed((r) => { delete r.shareGrants[1].context; }))).toHaveLength(1);
    expect(at111(changed((r) => { r.machines[0].packages[1].context = "org:org_7kq2m4"; }))).toHaveLength(1);
  });
  it("matches the grant's id by normal form (DEC-0076), and a revocation of it in any spelling", () => {
    expect(at111(changed((r) => { r.machines[0].packages[1].grant = String(grantA.meta.id).replace(/^urn:/, "URN:"); }))).toEqual([]);
    const revoked = changed((r) => { r.revocations = [{ kind: "grant", ref: String(grantA.meta.id).replace(/^urn:/, "URN:"), revokedAt: "2026-10-12T10:00:00Z" }]; });
    expect(at111(revoked).map((finding) => finding.message)).toEqual([expect.stringMatching(/revokes the share grant/)]);
    // A revocation of another kind with the same text, or of another grant, revokes nothing here.
    expect(at111(changed((r) => { r.revocations = [{ kind: "package", ref: grantA.meta.id, revokedAt: "2026-10-12T10:00:00Z" }]; }))).toEqual([]);
    expect(at111(changed((r) => { r.revocations = [{ kind: "grant", ref: 7, revokedAt: "2026-10-12T10:00:00Z" }]; }))).toEqual([]);
  });
  it("refuses a personal placement, absent or spelled out, that names a grant", () => {
    expect(at111(changed((r) => { r.machines[0].packages[0].grant = grantA.meta.id; })).map((finding) => finding.instancePath)).toEqual(["/machines/0/packages/0/grant"]);
    expect(at111(changed((r) => { r.machines[0].packages[0] = { ...r.machines[0].packages[0], context: "personal", grant: grantA.meta.id }; }))).toHaveLength(1);
  });
  it("fails closed on a context that is not personal: it needs a grant for exactly that context", () => {
    expect(at111(changed((r) => { r.machines[1].packages[0].context = 7; })).map((finding) => finding.instancePath)).toEqual(["/machines/1/packages/0/grant"]);
    expect(at111(changed((r) => { r.machines[1].packages[0].context = "Personal"; }))).toHaveLength(1);
  });
  it("skips share grants of the wrong shape when it looks one up", () => {
    expect(at111(changed((r) => { r.shareGrants = [1, { meta: 2 }, { meta: { id: 3 } }, ...r.shareGrants]; }))).toEqual([]);
  });
});

describe("estate-placement and placementTrust take the context (DEC-0082)", () => {
  it("default to personal, so an existing caller is unchanged", () => {
    expect(placementTrust(contexts, "m-4c1e", AGENT)).toEqual(placementTrust(first, "m-4c1e", AGENT));
    expect(placementTrust(contexts, "m-4c1e", AGENT, "personal")?.publisher).toEqual([contexts.publisherKeys[0]]);
    expect(codes("estate-placement", { record: contexts, machine: "m-4c1e", package: agentPkg })).toEqual([]);
  });
  it("find an organization's instance only in its context", () => {
    expect(placementTrust(contexts, "m-4c1e", AGENT, ORG_A)?.publisher).toEqual([contexts.publisherKeys[0]]);
    expect(placementTrust(contexts, "m-9a07", AGENT, ORG_A)).toBeUndefined();
    expect(placementTrust(contexts, "m-4c1e", AGENT, "org:ORG_7KQ2M4XW")).toBeUndefined();
    expect(codes("estate-placement", { record: contexts, machine: "m-4c1e", package: agentPkg, context: ORG_B })).toEqual([]);
    expect(at("estate-placement", { record: contexts, machine: "m-9a07", package: agentPkg, context: ORG_A }, "FAC-SEM-074")).toEqual(["/package/agentRef"]);
  });
  it("check the organization's instance's grant and its own slots", () => {
    const noGrant = changed((r) => { delete r.machines[0].packages[1].grant; });
    expect(at("estate-placement", { record: noGrant, machine: "m-4c1e", package: agentPkg, context: ORG_A }, "FAC-SEM-111")).toEqual(["/record/machines/0/packages/1/grant"]);
    // The personal instance on the same machine is not touched by the organization's placement.
    expect(codes("estate-placement", { record: noGrant, machine: "m-4c1e", package: agentPkg })).toEqual([]);
    const slot = changed((r) => { r.machines[0].secrets[2].slot = "UNDECLARED_SLOT"; });
    expect(at("estate-placement", { record: slot, machine: "m-4c1e", package: agentPkg, context: ORG_B }, "FAC-SEM-075")).toEqual(["/record/machines/0/secrets/2/slot"]);
    expect(codes("estate-placement", { record: slot, machine: "m-4c1e", package: agentPkg, context: ORG_A })).toEqual([]);
  });
});

describe("the specifications", () => {
  it("restate FAC-SEM-074 and FAC-SEM-075 per context and define FAC-SEM-111 in the estate record", () => {
    const row = (code: string) => estateSpec.split("\n").find((line) => line.startsWith(`| \`${code}\``)) ?? "";
    expect(row("FAC-SEM-074")).toMatch(/once per machine and context/);
    expect(row("FAC-SEM-075")).toMatch(/once per \(machine, agent, slot, context\)/);
    expect(row("FAC-SEM-111")).toMatch(/`estate-record`, `estate-placement`/);
    expect(estateSpec).not.toMatch(/placed once\s+per machine under/);
  });
  it("define FAC-SEM-110 and the context id in contexts.md", () => {
    expect(contextsSpec).toMatch(/\| `FAC-SEM-110` \| `grant`, `estate-record` \|/);
    expect(contextsSpec).toContain("common.schema.json#/$defs/contextId");
  });
});

describe("grant.usage: one grant's usage for one UTC day (DEC-0082)", () => {
  const usage = load("positive/telemetry-event-grant-usage.json");
  const telemetry = JSON.parse(readText("schemas/telemetry-event.schema.json")) as Json;
  const EXT_DATA = `${SCHEMA_PREFIX}schemas/activity-common.schema.json#/$defs/extData`;
  const extData = (value: unknown) => validateDocument(validator, EXT_DATA, value).valid;

  it("is a core kind with its own data, a day and no finer time, and nothing that ties it to a session or a person", () => {
    const known = (telemetry.allOf as Json[]).find((branch) => Array.isArray(branch.if?.properties?.kind?.enum))?.if.properties.kind.enum as string[];
    expect(known).toContain("grant.usage");
    const branch = (telemetry.allOf as Json[]).find((entry) => entry.if?.properties?.kind?.const === "grant.usage") as Json;
    for (const member of ["user", "session", "run", "task", "git", "skill", "launch"]) expect(branch.then.properties[member], member).toBe(false);
    expect(branch.then.properties.monotonicNs).toEqual({ const: "0" });
    expect(Object.keys(telemetry.$defs.grantUsage.properties).sort()).toEqual(["calls", "costUsd", "day", "grantId", "unpricedCalls"]);
    expect(telemetry.$defs.grantUsage.properties.grantId).toMatchObject({ format: "uri", minLength: 1, maxLength: 256 });
    expect(valid(usage, "telemetry-event.schema.json")).toBe(true);
    expect(codes("telemetry-event", usage)).toEqual([]);
  });

  it("holds the grant id's bounds: a URI of 1 to 256 characters, never 0 or 257", () => {
    const withId = (grantId: string) => valid({ ...usage, data: { ...usage.data, grantId } }, "telemetry-event.schema.json");
    expect([withId("u:g"), withId(`urn:g:${"g".repeat(250)}`), withId(""), withId(`urn:g:${"g".repeat(251)}`), withId("not a uri")]).toEqual([true, true, false, false, false]);
  });

  it("carries a cost that is null exactly when no call was priced, never more unpriced calls than calls (FAC-SEM-038)", () => {
    const cost = (calls: number, unpricedCalls: number, costUsd: number | null) => at("telemetry-event", { ...usage, data: { ...usage.data, calls, unpricedCalls, costUsd } }, "FAC-SEM-038");
    expect(cost(3, 3, null)).toEqual([]);
    expect(cost(3, 0, 0)).toEqual([]);
    expect(cost(3, 2, 0.1)).toEqual([]);
    expect(cost(3, 3, 0)).toEqual(["/data/costUsd"]);
    expect(cost(3, 2, null)).toEqual(["/data/costUsd"]);
    expect(cost(3, 4, null)).toEqual(["/data/unpricedCalls"]);
    // Counts of the wrong type are the schema's; the rule answers nothing rather than throwing.
    expect(at("telemetry-event", { ...usage, data: { ...usage.data, calls: "3" } }, "FAC-SEM-038")).toEqual([]);
  });

  it("is one per day and grant in one stream of a batch, and its occurred is the day it names (FAC-SEM-039)", () => {
    const batch = load("semantic/activity-batch-grant-usage-twice.json").input;
    expect(at("activity-batch", batch, "FAC-SEM-039")).toEqual(["/events/1/data/grantId"]);
    // Another stream may report the same grant and day: the rule is per stream.
    const otherStream = { ...batch, events: [batch.events[0], { ...batch.events[1], collector: { id: "other-collector", epoch: 1 }, seq: 1 }] };
    expect(at("activity-batch", otherStream, "FAC-SEM-039")).toEqual([]);
    expect(at("telemetry-event", { ...usage, occurred: "2026-10-11T00:00:00Z" }, "FAC-SEM-039")).toEqual(["/occurred"]);
  });

  it("reads to a receiver pinned before DEC-0082 as an unknown kind's data exactly when its grantId satisfies extScalar's string branch", () => {
    // The documented condition (contexts.md, DEC-0082 compatibility item 5): at most 64 characters, no whitespace, no
    // leading / ~ \\ or drive prefix, no /Users/, /home/ or \\Users\\ anywhere.
    const documented = (id: string) => id.length <= 64 && !/\s/.test(id) && !/^[/~\\]/.test(id) && !/^[A-Za-z]:[\\/]/.test(id)
      && !id.includes("/Users/") && !id.includes("/home/") && !id.includes("\\Users\\");
    const samples = [
      String(usage.data.grantId), "urn:grant:x", `urn:g:${"g".repeat(58)}`, `urn:g:${"g".repeat(59)}`, "urn:grant:a b", "urn:grant:a\tb",
      "/grant/x", "~grant", "\\grant", "C:\\grants\\x", "c:/grants/x", "https://host/Users/x", "file:/home/x", "urn:x:\\Users\\y",
      "https://example.org/grants/x", "urn:grant:C:/x"
    ];
    for (const grantId of samples) expect(extData({ ...usage.data, grantId }), grantId).toBe(documented(grantId));
    expect(samples.filter(documented).length).toBeGreaterThanOrEqual(4);
    expect(samples.filter((id) => !documented(id)).length).toBeGreaterThanOrEqual(8);
    expect(extData({ ...usage.data, costUsd: null })).toBe(true);
    const flat = contextsSpec.replace(/\s+/g, " ");
    for (const phrase of ["at most 64 characters", "no whitespace", "drive prefix", "`/Users/`", "FAC-SEM-037"]) expect(flat, phrase).toContain(phrase);
  });
});

describe("the fix round's hardening (DEC-0082 review)", () => {
  it("FAC-SEM-111 refuses a malformed context even when the grant carries the same malformed one", () => {
    const record = changed((r) => { r.machines[0].packages[1].context = "Personal"; r.shareGrants[1].context = "Personal"; });
    expect(at("estate-record", record, "FAC-SEM-111")).toEqual(["/machines/0/packages/1/context"]);
  });

  it("FAC-SEM-075 fills an organization's slot only from its own machine", () => {
    expect(at("estate-record", changed((r) => { r.machines[0].secrets[1].from = "m-9a07"; }), "FAC-SEM-075")).toEqual(["/machines/0/secrets/1/from"]);
    expect(at("estate-record", changed((r) => { r.machines[0].secrets[0].from = "m-9a07"; }), "FAC-SEM-075")).toEqual([]);
  });

  it("reads a parent's revision as Number() did, without its throw: a numeric string as its number, an object as no number", () => {
    const second = load("positive/estate-record-second.json");
    const revisionAt = (revision: unknown) => at("estate-record-revision", { parent: { ...first, revision }, next: second }, "FAC-SEM-072");
    expect(revisionAt("1")).not.toContain("/next/revision");
    expect(revisionAt({ toString: 1 })).toContain("/next/revision");
    expect(revisionAt(1)).not.toContain("/next/revision");
  });

  it("keeps the array index in every instancePath when a non-object comes first", () => {
    const grantFirst = changed((r) => { r.shareGrants = [7, ...r.shareGrants]; r.shareGrants[2] = { ...r.shareGrants[2], context: "personal" }; });
    expect(at("estate-record", grantFirst, "FAC-SEM-110")).toEqual(["/shareGrants/2/context"]);
    const twice = changed((r) => { r.shareGrants = [null, r.shareGrants[0], r.shareGrants[0]]; });
    expect(at("estate-record", twice, "FAC-SEM-076")).toEqual(["/shareGrants/2/meta/id"]);
    const revoked = changed((r) => { r.revocations = ["x", { kind: "grant", ref: r.shareGrants[0].meta.id, revokedAt: "2026-10-12T10:00:00Z" }]; });
    expect(at("estate-record", revoked, "FAC-SEM-076")).toEqual(["/revocations/1/ref"]);
    const install = changed((r) => {
      r.machines = [1, ...r.machines];
      r.machines[1].packages = [null, ...r.machines[1].packages];
      r.machines[1].secrets = ["s", ...r.machines[1].secrets];
      delete r.machines[1].packages[2].grant;
      r.machines[1].secrets[2].slot = "UNDECLARED_SLOT";
    });
    const findings = evaluateSemanticRules("estate-placement", { record: install, machine: "m-4c1e", package: agentPkg, context: ORG_A });
    expect(findings.map((finding) => `${finding.code} ${finding.instancePath}`).sort()).toEqual([
      "FAC-SEM-075 /record/machines/1/secrets/2/slot", "FAC-SEM-111 /record/machines/1/packages/2/grant"
    ]);
  });
});
