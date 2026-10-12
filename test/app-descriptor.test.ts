import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { appDescriptorAction, appDescriptorStale } from "../src/app-descriptor.js";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0069 (Fabric CO-263): an app's own descriptor.
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, "fixtures/vectors/app-descriptor.json"), "utf8")) as {
  action: Array<{ name: string; existing: unknown; tool: string; expect: string }>;
  stale: Array<{ name: string; descriptor: unknown; appPresent: boolean; expect: boolean }>;
};
const read = (name: string) => JSON.parse(readFileSync(path.join(root, "fixtures/positive", name), "utf8"));

describe("app-descriptor vectors", () => {
  it.each(vectors.action.map((c) => [c.name, c] as const))("action %s", (_n, c) => expect(appDescriptorAction(c.existing, c.tool)).toBe(c.expect));
  it.each(vectors.stale.map((c) => [c.name, c] as const))("stale %s", (_n, c) => expect(appDescriptorStale(c.descriptor, c.appPresent)).toBe(c.expect));
  it("reads the fixture app's descriptor as kept on the same version and stale once its app is gone", () => {
    const app = read("service-descriptor-person-app.json");
    expect(appDescriptorAction(app, app.installedBy.tool)).toBe("keep");
    expect(appDescriptorStale(app, false)).toBe(true);
    expect(appDescriptorStale({ lifecycle: "person" }, false)).toBe(false);
  });
});

describe("FAC-SEM-010 with apps", () => {
  const app = read("service-descriptor-person-app.json");
  const service = read("service-descriptor.json");
  it("lets two apps without an origin sit beside each other and a service: none claims a port", () => {
    const other = { ...app, id: "other-app" };
    expect(evaluateSemanticRules("service-directory", { descriptors: [app, other, service] })).toEqual([]);
  });
  it("still finds two services on one port", () => {
    expect(evaluateSemanticRules("service-directory", { descriptors: [service, { ...service, id: "twin" }] }).map((f) => f.code)).toEqual(["FAC-SEM-010"]);
  });
});
