import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { dashboardsLink, isLoopbackPageUrl, parseDashboardsLink, pageLinkRules } from "../src/page-link-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { buildPageLinkVectors } from "../tools/vectors/page-links.js";

// DEC-0123: a person opens a service's page through Fabric Dashboards' open_link; a raw loopback address is not the action.
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const vectors = JSON.parse(read("fixtures/vectors/page-links.json")) as { builds: Json[]; links: Json[]; requests: Json[] };
const paths = (kind: string, value: Json) =>
  evaluateSemanticRules(kind, value).filter((finding) => finding.code === "FAC-SEM-143").map((finding) => finding.instancePath);
const built = (service: string, instance: string, page: string) => {
  try {
    return dashboardsLink(service, instance, page);
  } catch {
    return null;
  }
};

describe("the page-link vectors (DEC-0123)", () => {
  it("are what the generator writes", () => {
    expect(read("fixtures/vectors/page-links.json")).toBe(buildPageLinkVectors());
  });

  it.each(vectors.builds.map((vector) => [vector.name, vector] as const))("dashboardsLink: %s", (_name, vector) => {
    expect(built(vector.input.service, vector.input.instance, vector.input.path)).toBe(vector.expected);
  });

  it.each(vectors.links.map((vector) => [vector.name, vector] as const))("kind page-link: %s", (_name, vector) => {
    expect(paths("page-link", vector.input)).toEqual(vector.expected);
  });

  it.each(vectors.requests.map((vector) => [vector.name, vector] as const))("kind interop-input-requests: %s", (_name, vector) => {
    expect(paths("interop-input-requests", vector.input)).toEqual(vector.expected);
  });
});

describe("open_link round trip and edges (DEC-0123 PL-1)", () => {
  it("reads back what it builds, path included", () => {
    for (const vector of vectors.builds.filter((item) => item.expected !== null)) {
      expect(parseDashboardsLink(vector.expected)).toEqual({ ok: true, ...vector.input });
    }
  });

  it("refuses an overlong link and an overlong build", () => {
    const long = `/${"a".repeat(2100)}`;
    expect(parseDashboardsLink(`fabric-dashboards://service/example-agent.default?path=${long}`)).toEqual({ ok: false, problems: ["an open_link is at most 2048 characters"] });
    expect(() => dashboardsLink("example-agent", "default", long)).toThrow("at most 2048");
  });

  it("names every problem of a link at once", () => {
    expect(parseDashboardsLink("fabric-dashboards://service/Bad?path=x")).toEqual({
      ok: false,
      problems: ["the service is not a service id", "the instance is not an instance name", "the path is not a path on the service origin"]
    });
  });

  it("refuses a credential in a fragment and a secret-shaped value, keeps an ordinary query", () => {
    expect(built("example-agent", "default", `/dashboard#access_token=abc`)).toBeNull();
    expect(built("example-agent", "default", `/dashboard?next=${["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiJ4In0", "c2lnbmF0dXJl"].join(".")}`)).toBeNull();
    expect(built("example-agent", "default", "/dashboard?tab=log#top")).toBe("fabric-dashboards://service/example-agent.default?path=%2Fdashboard%3Ftab%3Dlog%23top");
    expect(built("example-agent", "default", "/fabric/v1/login")).toBeNull();
    expect(built("example-agent", "default", "/fabric/v1/logins")).not.toBeNull();
  });

  it("tells a loopback page from anything else", () => {
    expect(isLoopbackPageUrl("not a url")).toBe(false);
    expect(isLoopbackPageUrl("ftp://127.0.0.1/x")).toBe(false);
    expect(isLoopbackPageUrl("http://127.0.0.1.example/x")).toBe(false);
    expect(isLoopbackPageUrl("http://LOCALHOST/x")).toBe(true);
  });

  it("answers only its own kind and ignores a url that is not a string", () => {
    expect(pageLinkRules("deep-link", { url: "http://127.0.0.1/" })).toBeUndefined();
    expect(pageLinkRules("page-link", { url: 42 })).toEqual([]);
    expect(paths("interop-input-requests", { inputRequests: { a: "x", b: { params: "y" } } })).toEqual([]);
    expect(paths("interop-input-requests", {})).toEqual([]);
  });
});
