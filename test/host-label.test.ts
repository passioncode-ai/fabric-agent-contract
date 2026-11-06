import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { HOST_LABEL, ORG_ID, hostLabel } from "../src/host-label.js";
import { VECTOR_FILE, buildHostLabelVectors } from "../tools/vectors/host-label.js";

type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;

describe("the host label (DEC-0154 item 4)", () => {
  it("the vectors are the generator's output", () => {
    expect(buildHostLabelVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });
  it.each(vectors.cases as Json[])("$name", (entry) => {
    expect(hostLabel(entry.input)).toEqual(entry.expected);
  });
  it("every label the vectors hold is the schema's shape, and two organizations never share one", () => {
    const labels = (vectors.cases as Json[]).flatMap((entry) => (entry.expected.hostLabel ? [entry.expected.hostLabel as string] : []));
    expect(labels.length).toBeGreaterThan(3);
    for (const label of labels) expect(label).toMatch(HOST_LABEL);
    const schema = JSON.parse(readFileSync(path.join(root, "schemas/device-enrollment.schema.json"), "utf8")) as Json;
    expect(schema.$defs.request.properties.device.properties.hostLabel.pattern).toBe(HOST_LABEL.source);
    const byOrg = (orgId: string) => hostLabel({ platform: "posix", secret: { link: false, owner: "root", writableByOthers: false, folderOk: true, hex: "ab".repeat(32) }, orgId });
    expect(byOrg("org-a")).not.toEqual(byOrg("org-b"));
  });
  it("reads org.id with the schema's own pattern", () => {
    const common = JSON.parse(readFileSync(path.join(root, "schemas/activity-common.schema.json"), "utf8")) as Json;
    expect(ORG_ID.source).toBe(common.$defs.opaqueId.pattern);
  });
  it("never throws", () => {
    for (const bad of [undefined, 1, "", [], {}, { secret: null }, { secret: [] }, { platform: "posix", secret: { link: false, owner: 1, writableByOthers: false, folderOk: true, hex: "" }, orgId: "o" }, { platform: "posix", secret: { link: false, owner: "root", writableByOthers: false, folderOk: true, hex: 7 }, orgId: "o" }, { platform: "posix", secret: { link: false, owner: "root", writableByOthers: false, folderOk: true, hex: "" }, orgId: 7 }, { platform: "posix", secret: { link: false, owner: "root", writableByOthers: 0, folderOk: true, hex: "" }, orgId: "o" }]) {
      expect(() => hostLabel(bad)).not.toThrow();
      expect(hostLabel(bad)).toEqual({ fault: "input-invalid" });
    }
  });
});
