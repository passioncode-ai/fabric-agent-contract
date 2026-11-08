import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { ACCOUNT, BUNDLE_ID, PORT_CLAIM_SCHEMA, SERVICE_ID, UTC_INSTANT, choosePort, claimFileName, isPortClaim, readClaims, rebuildClaim, type ChooseInput, type ClaimFile } from "../src/port-claim.js";
import { createValidatorSync, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildPortClaimVectors } from "../tools/vectors/port-claim.js";

type Json = Record<string, any>;
const root = projectRoot();
const read = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8")) as Json;
const vectors = read(VECTOR_FILE);

describe("the port claim and the port choice (DEC-0154 HA-1, DEC-0160)", () => {
  it("the vectors are the generator's output", () => {
    expect(buildPortClaimVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });
  it.each(vectors.fileName as Json[])("file name: $name", (entry) => {
    expect(claimFileName(entry.input.service, entry.input.account)).toBe(entry.expected);
  });
  it.each(vectors.read as Json[])("read: $name", (entry) => {
    expect(readClaims(entry.input.files as ClaimFile[], entry.input.presentAccounts)).toEqual(entry.expected);
  });
  it.each(vectors.choose as Json[])("choose: $name", (entry) => {
    const { files, presentAccounts, ...rest } = entry.input;
    const input = { ...rest, claims: readClaims(files as ClaimFile[], presentAccounts).claims } as ChooseInput;
    expect(choosePort(input)).toEqual(entry.expected);
  });
  it.each(vectors.rebuild as Json[])("rebuild: $name", (entry) => {
    expect(rebuildClaim(entry.input as Parameters<typeof rebuildClaim>[0])).toEqual(entry.expected);
  });
  it("covers every case CT-228 lists", () => {
    const names = (vectors.choose as Json[]).map((entry) => entry.name as string).join("\n");
    for (const words of ["no port recorded", "the recorded port free", "held by its own listener", "another id.instance's descriptor", "another account's claim", "another account's listener", "an absent account", "owner is not its account", "held by another owner", "aged out", "an app with no descriptor origin", "names a candidate", "one restarts", "no free port", "holder order", "two parts of one app"]) {
      expect(names, words).toContain(words);
    }
    const rebuilt = (vectors.rebuild as Json[]).map((entry) => entry.name as string).join("\n");
    for (const words of ["uninstall of the last instance", "two parts of one app", "65 ports", "port 0"]) expect(rebuilt, words).toContain(words);
    expect((vectors.fileName as Json[]).find((entry) => (entry.name as string).includes("longest"))?.expected).toHaveLength(255);
  });
  it("every rebuilt claim is a valid claim, and every kept claim was one", () => {
    for (const entry of vectors.rebuild as Json[]) if (!entry.expected.delete && !entry.expected.fault) expect(isPortClaim(entry.expected), entry.name).toBe(true);
    for (const entry of vectors.read as Json[]) for (const kept of entry.expected.claims as Json[]) expect(isPortClaim(kept), entry.name).toBe(true);
  });
  it("reads the claim with the schema's own constants and patterns", () => {
    const schema = read("schemas/port-claim.schema.json");
    expect(schema.title).toBe(PORT_CLAIM_SCHEMA);
    expect(schema.properties.schema.const).toBe(PORT_CLAIM_SCHEMA);
    expect(schema.properties.account.pattern).toBe(ACCOUNT.source);
    expect(schema.$defs.bundleId.pattern).toBe(BUNDLE_ID.source);
    expect(read("schemas/service-common.schema.json").$defs.serviceId.pattern).toBe(SERVICE_ID.source);
    expect(read("schemas/interop-common.schema.json").$defs.utcInstant.pattern).toBe(UTC_INSTANT.source);
    // The file name is 25 characters besides the service and the account; together they stay at or under 255 bytes.
    expect(claimFileName("", "").length + schema.$defs.bundleId.maxLength + schema.properties.account.maxLength).toBe(255);
    expect(schema.required).toEqual(["schema", "service", "account", "ports", "updatedAt"]);
  });
  it("agrees with the schema on every catalogued fixture", () => {
    const catalogue = read("fixtures/catalogue.json") as unknown as Array<{ schema: string; path: string; valid: boolean; name: string }>;
    const entries = catalogue.filter((entry) => entry.schema === "port-claim.schema.json");
    expect(entries.length).toBeGreaterThanOrEqual(10);
    for (const entry of entries) expect(isPortClaim(read(path.join("fixtures", entry.path))), entry.name).toBe(entry.valid);
  });
  it("the Windows claims folder's degraded entry in HA-1 is a valid degraded item, its reason the one DEC-0160 records", () => {
    const service = readFileSync(path.join(root, "docs/specification/service.md"), "utf8");
    const line = service.split("\n").find((text) => text.includes('"source": "port-claims-folder"')) as string;
    const entry = JSON.parse(line.trim()) as { source: string; setup: boolean; reason: string };
    const result = validateDocument(createValidatorSync(), `${SCHEMA_PREFIX}schemas/service-well-known.schema.json#/properties/degraded/items`, entry);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
    expect(entry).toMatchObject({ source: "port-claims-folder", setup: true });
    expect(entry.reason.length).toBeLessThanOrEqual(300);
    expect(readFileSync(path.join(root, "docs/DECISIONS.md"), "utf8")).toContain(entry.reason);
  });
  it("never reads the old claim when it rebuilds, and never throws on what a reader finds", () => {
    expect(rebuildClaim.length).toBe(1);
    for (const bad of [null, undefined, 7, "x", [], {}, { schema: PORT_CLAIM_SCHEMA }]) {
      expect(() => readClaims([{ name: "x", owner: "501", json: bad }], ["501"])).not.toThrow();
      expect(isPortClaim(bad)).toBe(false);
    }
  });
});
