import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { buildFabricLink, parseFabricLink } from "../src/fabric-links.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0040 (Fabric 0.4.0 REQ-42): Fabric's button in a product, and the fabric:// links it opens.
const root = projectRoot();
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Record<string, unknown>;
const spec = readFileSync(path.join(root, "docs/specification/fabric-button.md"), "utf8");
const validator = await createValidator();
const valid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/fabric-link.schema.json`, value).valid;
const problems = (url: string) => {
  const parsed = parseFabricLink(url);
  return parsed.ok ? [] : parsed.problems;
};

describe("fabric:// links (DEC-0040, FL-1…FL-6)", () => {
  it("parses a chat link and a session link into the schema's shape", () => {
    const chat = parseFabricLink("fabric://chat?service=example-agent.default&project=project-a");
    expect(chat).toEqual({ ok: true, link: { action: "chat", service: "example-agent.default", project: "project-a" }, ignored: [] });
    const session = parseFabricLink("fabric://session/new?project=urn%3Aproject%3Aa&runner=claude-code");
    expect(session).toEqual({ ok: true, link: { action: "session.new", project: "urn:project:a", runner: "claude-code" }, ignored: [] });
    for (const parsed of [chat, session]) if (parsed.ok) expect(valid(parsed.link)).toBe(true);
    expect(valid(load("positive/fabric-link-chat.json"))).toBe(true);
  });

  it("ignores and lists unknown parameters, a trailing slash and a fragment; the scheme's case does not matter", () => {
    expect(parseFabricLink("fabric://chat/?project=project-a&utm_source=dashboard&theme=ocean#top")).toEqual({ ok: true, link: { action: "chat", project: "project-a" }, ignored: ["utm_source", "theme"] });
    expect(parseFabricLink("FABRIC://chat?service=example-agent").ok).toBe(true);
  });

  it("refuses the whole link for an unknown action, a missing or repeated parameter, a bad id, or an overlong link", () => {
    expect(problems("fabric://CHAT?service=example-agent")).toEqual(["not fabric://chat or fabric://session/new"]);
    expect(problems("fabric://tasks/new?project=a")).toEqual(["not fabric://chat or fabric://session/new"]);
    expect(problems("fabric://user@chat?service=example-agent")).toEqual(["not fabric://chat or fabric://session/new"]);
    expect(problems("fabric://chat")).toEqual(["a chat link names a service, a project or both"]);
    expect(problems("fabric://session/new?runner=codex")).toEqual(["a session link names its project"]);
    expect(problems("fabric://chat?service=example-agent&service=other-agent")).toEqual(["service is given 2 times"]);
    expect(problems("fabric://chat?service=Example%20Agent")).toEqual(["service is not a valid agent id"]);
    expect(problems("fabric://session/new?project=..%2Fetc")).toEqual(["project is not a valid project id or slug"]);
    expect(problems("fabric://session/new?project=a&runner=Claude")).toEqual(["runner is not a valid runner kind"]);
    expect(problems(`fabric://chat?service=example-agent&x=${"a".repeat(2048)}`)).toEqual(["a link is at most 2048 characters"]);
  });

  it("never carries a secret: a credential's name or shape refuses the link even as an unknown parameter (FL-4)", () => {
    const jwt = "eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ4In0.c2ln";
    for (const url of [
      "fabric://chat?service=example-agent&token=abc",
      "fabric://chat?service=example-agent&access_token=abc",
      "fabric://session/new?project=a&code=f3a9c1",
      "fabric://session/new?project=a&api_key=abc",
      "fabric://chat?service=example-agent&session_id=abc",
      `fabric://chat?service=example-agent&ref=${jwt}`,
      "fabric://chat?service=example-agent&note=Bearer%20abc"
    ]) expect(problems(url).some((p) => p.includes("could carry a credential")), url).toBe(true);
    expect(parseFabricLink("fabric://chat?service=example-agent&zipcode=1").ok).toBe(true);
  });

  it("builds only links it can read back", () => {
    const url = buildFabricLink({ action: "session.new", project: "urn:project:a", runner: "codex" });
    expect(url).toBe("fabric://session/new?project=urn%3Aproject%3Aa&runner=codex");
    expect(parseFabricLink(url)).toMatchObject({ ok: true, link: { action: "session.new", project: "urn:project:a", runner: "codex" } });
    expect(() => buildFabricLink({ action: "chat", service: "Not An Id" })).toThrow();
    expect(() => buildFabricLink({ action: "chat" })).toThrow();
    // Each optional parameter left out (P2-02: the branches the detector's move to src/secret-shape.ts left uncovered).
    expect(buildFabricLink({ action: "chat", project: "urn:project:a" })).toBe("fabric://chat?project=urn%3Aproject%3Aa");
    expect(buildFabricLink({ action: "session.new", project: "urn:project:a" })).toBe("fabric://session/new?project=urn%3Aproject%3Aa");
    expect(parseFabricLink("fabric://session/new?project=a")).toEqual({ ok: true, link: { action: "session.new", project: "a" }, ignored: [] });
  });

  it("FAC-SEM-052 reads a missing or non-string url as an empty link", () => {
    expect(evaluateSemanticRules("deep-link", { url: 42 }).map((f) => f.message)).toEqual(["not fabric://chat or fabric://session/new"]);
  });

  it("FAC-SEM-052: the semantic fixtures", () => {
    const codes = (name: string) => evaluateSemanticRules("deep-link", load(`semantic/${name}.json`)).map((f) => f.code);
    expect(codes("deep-link-ok")).toEqual([]);
    expect(codes("deep-link-with-login-code")).toEqual(["FAC-SEM-052"]);
    expect(codes("deep-link-bad-service")).toEqual(["FAC-SEM-052"]);
  });
});

describe("Fabric's button (DEC-0040, FB-1…FB-8)", () => {
  it("states the absent-Fabric message, the accessible name and the placement once, in the specification", () => {
    expect(spec).toContain("> Fabric is not installed — get it at passioncode.ai/fabric");
    expect(spec).toContain("`https://passioncode.ai/fabric`");
    expect(spec).toMatch(/accessible name is \*\*Open Fabric\*\*/);
    expect(spec).toMatch(/bottom-right corner of the viewport/);
    for (const rule of ["FB-1", "FB-2", "FB-3", "FB-4", "FB-5", "FB-6", "FB-7", "FB-8", "FL-1", "FL-2", "FL-3", "FL-4", "FL-5", "FL-6", "FL-7"]) {
      expect(spec.match(new RegExp(`\\*\\*${rule} — `, "g")), rule).toHaveLength(1);
    }
  });

  it("keeps the host's cookie apart from the appearance carrier", () => {
    const dashboard = readFileSync(path.join(root, "docs/specification/embedded-dashboard.md"), "utf8");
    expect(dashboard).toMatch(/a host MUST NOT put anything else in it/);
    expect(spec).toMatch(/The appearance cookie `fabric_appearance` is unchanged/);
  });
});
