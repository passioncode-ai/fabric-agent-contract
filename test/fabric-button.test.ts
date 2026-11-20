import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { SESSION_ID, buildFabricLink, parseFabricLink } from "../src/fabric-links.js";
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
    expect(problems("fabric://CHAT?service=example-agent")).toEqual(["not fabric://chat, fabric://session/new, fabric://session/open or fabric://session/continue"]);
    expect(problems("fabric://tasks/new?project=a")).toEqual(["not fabric://chat, fabric://session/new, fabric://session/open or fabric://session/continue"]);
    expect(problems("fabric://user@chat?service=example-agent")).toEqual(["not fabric://chat, fabric://session/new, fabric://session/open or fabric://session/continue"]);
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
    expect(evaluateSemanticRules("deep-link", { url: 42 }).map((f) => f.message)).toEqual(["not fabric://chat, fabric://session/new, fabric://session/open or fabric://session/continue"]);
  });

  it("FAC-SEM-052: the semantic fixtures", () => {
    const codes = (name: string) => evaluateSemanticRules("deep-link", load(`semantic/${name}.json`)).map((f) => f.code);
    expect(codes("deep-link-ok")).toEqual([]);
    expect(codes("deep-link-with-login-code")).toEqual(["FAC-SEM-052"]);
    expect(codes("deep-link-bad-service")).toEqual(["FAC-SEM-052"]);
  });
});

describe("session links: from, session/open and session/continue (DEC-0189, SL-1…SL-5)", () => {
  const id = "3f2b8c1e-9a47-4d2e-b5c6-0e1f2a3b4c5d";

  it("parses `from` on session/new and the two new actions into the schema's shape", () => {
    const fresh = parseFabricLink("fabric://session/new?project=project-a&runner=claude-code&from=fabric-dashboards");
    expect(fresh).toEqual({ ok: true, link: { action: "session.new", project: "project-a", runner: "claude-code", from: "fabric-dashboards" }, ignored: [] });
    const open = parseFabricLink(`fabric://session/open?session=${id}&from=observatory`);
    expect(open).toEqual({ ok: true, link: { action: "session.open", session: id, from: "observatory" }, ignored: [] });
    const move = parseFabricLink(`fabric://session/continue/?session=${id}&from=switchboard.default`);
    expect(move).toEqual({ ok: true, link: { action: "session.continue", session: id, from: "switchboard.default" }, ignored: [] });
    expect(parseFabricLink(`fabric://session/open?session=${id}`)).toEqual({ ok: true, link: { action: "session.open", session: id }, ignored: [] });
    for (const parsed of [fresh, open, move]) if (parsed.ok) expect(valid(parsed.link), JSON.stringify(parsed.link)).toBe(true);
    for (const name of ["positive/fabric-link-session-open.json", "positive/fabric-link-session-continue.json"]) expect(valid(load(name)), name).toBe(true);
    for (const name of ["negative/fabric-link-session-open-not-uuid.json", "negative/fabric-link-chat-with-from.json"]) expect(valid(load(name)), name).toBe(false);
  });

  it("reads a UUID in either case and returns it in lower case (SL-2)", () => {
    expect(SESSION_ID.test(id.toUpperCase())).toBe(true);
    expect(parseFabricLink(`fabric://session/open?session=${id.toUpperCase()}`)).toMatchObject({ ok: true, link: { session: id } });
    for (const bad of ["my-session", `${id}0`, id.replaceAll("-", ""), `{${id}}`, `urn:uuid:${id}`, "", "3f2b8c1e-9a47-4d2e-b5c6-0e1f2a3b4c5g"]) {
      expect(problems(`fabric://session/open?session=${encodeURIComponent(bad)}`), bad).toEqual(["session is not a valid session id (a UUID)"]);
    }
  });

  it("refuses a missing or repeated session, a bad `from`, and keeps `from` an unknown parameter of chat", () => {
    expect(problems("fabric://session/open")).toEqual(["a session/open link names its session"]);
    expect(problems("fabric://session/continue?from=switchboard")).toEqual(["a session/continue link names its session"]);
    expect(problems(`fabric://session/open?session=${id}&session=${id}`)).toEqual(["session is given 2 times"]);
    expect(problems(`fabric://session/open?session=${id}&from=Switch%20Board`)).toEqual(["from is not a valid agent id"]);
    expect(problems("fabric://session/new?project=a&from=x")).toEqual(["from is not a valid agent id"]);
    expect(parseFabricLink("fabric://chat?project=project-a&from=fabric-dashboards")).toEqual({ ok: true, link: { action: "chat", project: "project-a" }, ignored: ["from"] });
    expect(problems(`fabric://session/open?project=project-a&session=${id}&utm_source=x`)).toEqual([]);
    expect(problems("fabric://session/Open?session=" + id)).toEqual(["not fabric://chat, fabric://session/new, fabric://session/open or fabric://session/continue"]);
    expect(problems("fabric://session/close?session=" + id)).toEqual(["not fabric://chat, fabric://session/new, fabric://session/open or fabric://session/continue"]);
  });

  it("lets the name `session` through only where an action defines it, with a UUID; FL-4 holds everywhere else (SL-3)", () => {
    for (const url of [
      `fabric://chat?service=example-agent&session=${id}`,
      `fabric://session/new?project=a&session=${id}`,
      `fabric://session/open?session=${id}&session_id=${id}`,
      `fabric://session/open?session=${id}&sessionToken=abc`,
      `fabric://session/continue?session=${id}&token=abc`,
      `fabric://session/open?session=${id}#access_token=abc`
    ]) expect(problems(url).some((p) => p.includes("could carry a credential")), url).toBe(true);
    expect(problems(`fabric://session/open?session=${id}&prompt=continue`)).toEqual(["the parameter prompt carries words to act on; a link carries ids only"]);
    expect(problems("fabric://session/open?session=eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ4In0.c2ln")).toEqual(["the parameter session could carry a credential; a link never does"]);
    expect(problems("fabric://session/continue?session=abc")).toEqual(["session is not a valid session id (a UUID)"]);
  });

  it("builds the new links and only links it can read back", () => {
    expect(buildFabricLink({ action: "session.new", project: "project-a", runner: "codex", from: "inbox" })).toBe("fabric://session/new?project=project-a&runner=codex&from=inbox");
    expect(buildFabricLink({ action: "session.open", session: id, from: "observatory" })).toBe(`fabric://session/open?session=${id}&from=observatory`);
    expect(buildFabricLink({ action: "session.continue", session: id })).toBe(`fabric://session/continue?session=${id}`);
    expect(() => buildFabricLink({ action: "session.open", session: "not-a-uuid" })).toThrow();
    expect(() => buildFabricLink({ action: "session.continue", session: id, from: "Not An Id" })).toThrow();
  });

  it("FAC-SEM-052 reads the new actions: the semantic fixtures", () => {
    const codes = (name: string) => evaluateSemanticRules("deep-link", load(`semantic/${name}.json`)).map((f) => f.code);
    expect(codes("deep-link-session-open")).toEqual([]);
    expect(codes("deep-link-session-on-chat")).toEqual(["FAC-SEM-052"]);
  });
});

describe("Fabric's button (DEC-0040, FB-1…FB-8)", () => {
  it("states the absent-Fabric message, the accessible name and the placement once, in the specification", () => {
    expect(spec).toContain("> Fabric is not installed. Get it at passioncode.ai/fabric");
    expect(spec).toContain("`https://passioncode.ai/fabric`");
    expect(spec).toMatch(/accessible name is \*\*Open Fabric\*\* in the page's language/);
    expect(spec).toMatch(/bottom-right corner of the viewport/);
    for (const rule of ["FB-1", "FB-2", "FB-3", "FB-4", "FB-5", "FB-6", "FB-7", "FB-8", "FL-1", "FL-2", "FL-3", "FL-4", "FL-5", "FL-6", "FL-7", "SL-1", "SL-2", "SL-3", "SL-4", "SL-5"]) {
      expect(spec.match(new RegExp(`\\*\\*${rule} — `, "g")), rule).toHaveLength(1);
    }
  });

  it("keeps the host's cookie apart from the appearance carrier", () => {
    const dashboard = readFileSync(path.join(root, "docs/specification/embedded-dashboard.md"), "utf8");
    expect(dashboard).toMatch(/a host MUST NOT put anything else in it/);
    expect(spec).toMatch(/The appearance cookie `fabric_appearance` is unchanged/);
  });
});
