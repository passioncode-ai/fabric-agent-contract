import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { CREDENTIAL_KINDS, PEER_DATA_CLASSES, RESERVED_HOST, SUBSCRIPTION_RUNNERS, peerRefusal } from "../src/descriptor-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { type Mutant, killers } from "./schema-mutants.js";

// DEC-0061 (board run P4-02, V4-DESCRIPTOR): the descriptor for listings — a service offered to others (`peer`), the
// kind of its runner's sign-in (`runner.credentialKind`), who installed it (`installedBy`) and the node as supervisor.
const root = projectRoot();
const validator = await createValidator();
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as any;
const descriptorSchema = `${SCHEMA_PREFIX}schemas/service-descriptor.schema.json`;
const valid = (doc: unknown) => validateDocument(validator, descriptorSchema, doc);
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const peer = read("fixtures/positive/service-descriptor-peer.json");
const fake = ["Ex4mpleN0tARealKey", "ButShapedLikeOne", "AbCdEf012345"].join("");

interface Case { description: string; schema?: string; schemaKeyword?: string; kind: string; document: unknown; findings: Array<{ code: string; instancePath: string }> }
const cases = readdirSync(path.join(root, "fixtures/semantic"))
  .filter((name) => /^service-(peer|runner)-|^service-descriptor-credential-/.test(name))
  .sort()
  .map((name) => [name, read(`fixtures/semantic/${name}`) as Case] as const);

describe("semantic fixtures of DEC-0061", () => {
  it("covers each refusal and its passing neighbour", () => {
    expect(cases.map(([name]) => name)).toEqual([
      "service-descriptor-credential-in-installed-by.json",
      "service-descriptor-credential-in-runner.json",
      "service-peer-endpoint-reserved.json",
      "service-peer-request-above.json",
      "service-peer-request-declined.json",
      "service-peer-request-not-offered.json",
      "service-peer-request-ok.json",
      "service-peer-request-unknown-class.json",
      "service-runner-derived-disagrees.json",
      "service-runner-ok.json",
      "service-runner-peer-subscription.json",
      "service-runner-peer-usage-subscription.json",
      "service-runner-subscription-wrong-runner.json",
      "service-runner-unknown-kind.json"
    ]);
  });

  it.each(cases)("%s answers exactly its findings, at the named place", (_, fixture) => {
    if (fixture.schema) {
      const result = validateDocument(validator, `${SCHEMA_PREFIX}schemas/${fixture.schema}`, fixture.document);
      if (fixture.schemaKeyword) expect(result.errors.some((error) => error.keyword === fixture.schemaKeyword), JSON.stringify(result.errors)).toBe(true);
      else expect(result.valid, JSON.stringify(result.errors)).toBe(true);
    }
    const found = evaluateSemanticRules(fixture.kind, fixture.document);
    expect(found.map(({ code, instancePath }) => ({ code, instancePath }))).toEqual(fixture.findings);
  });

  it("FAC-SEM-086 names the place and never the value", () => {
    for (const [, fixture] of cases.filter(([name]) => name.startsWith("service-descriptor-credential-"))) {
      const serialised = JSON.stringify(evaluateSemanticRules(fixture.kind, fixture.document));
      expect(serialised).toContain("FAC-SEM-086");
      expect(serialised).not.toContain(fake);
      expect(serialised).not.toContain("Ex4mple");
    }
  });

  it("FAC-SEM-086 reads every string member of runner and installedBy, and nothing else", () => {
    const at = (doc: unknown) => evaluateSemanticRules("service-descriptor", doc).filter((finding) => finding.code === "FAC-SEM-086").map((finding) => finding.instancePath);
    expect(at({ ...peer, runner: { kind: fake, credentialKind: "key" } })).toEqual(["/runner/kind"]);
    expect(at({ ...peer, installedBy: { by: "organization", tool: `install ${fake}` } })).toEqual(["/installedBy/tool"]);
    expect(at({ ...peer, installedBy: { by: "organization", tool: "x", "a/b~c": fake } })).toEqual(["/installedBy/a~1b~0c"]);
    expect(at({ ...peer, installedBy: `Bearer ${fake}` })).toEqual(["/installedBy"]);
    expect(at({ ...peer, summary: fake })).toEqual([]);
    expect(at({ ...peer, runner: { kind: "codex", credentialKind: 7 }, installedBy: 7 })).toEqual([]);
    // An ordinary installer line, with a path and a version, passes.
    expect(at({ ...peer, installedBy: "~/Code/example-agent/.venv/bin/example-agent service install 0.2.0" })).toEqual([]);
  });

  it("FAC-SEM-085 refuses each reserved name and passes a public one, and FAC-SEM-024 shares the list", () => {
    const at = (endpoint: unknown) => codes("service-descriptor", { ...peer, peer: { ...peer.peer, endpoint } });
    for (const host of ["localhost", "box.local", "agents.corp.internal", "nas.home.arpa", "pc.lan", "pc.localdomain"]) expect(at(`https://${host}/mcp`), host).toContain("FAC-SEM-085");
    for (const host of ["agents.example.com", "internal.example.com", "local.example.org", "lan.example.net"]) expect(at(`https://${host}/mcp`), host).not.toContain("FAC-SEM-085");
    expect(at("not a url")).not.toContain("FAC-SEM-085");
    expect(at(7)).not.toContain("FAC-SEM-085");
    expect(codes("service-descriptor", { ...peer, peer: "x" })).not.toContain("FAC-SEM-085");
    expect(RESERVED_HOST.test("agent.internal")).toBe(true);
    const remote = read("fixtures/positive/service-descriptor-remote.json");
    expect(codes("service-descriptor", { ...remote, origin: "https://agent.internal" })).toContain("FAC-SEM-024");
  });
});

describe("FAC-SEM-087: what a node placing a service checks of its runner", () => {
  const catalogue = read("fixtures/positive/runners-catalogue.json") as Array<{ kind: string }>;
  const check = (descriptor: unknown, derived?: unknown, entries: unknown = catalogue) =>
    evaluateSemanticRules("service-runner", derived === undefined ? { descriptor, catalogue: entries } : { descriptor, catalogue: entries, derived }).map((finding) => finding.instancePath);

  it("passes each credential kind the node derives the same, and each vendor's subscription in its runner", () => {
    for (const kind of CREDENTIAL_KINDS.filter((name) => name !== "subscription")) expect(check({ ...peer, runner: { credentialKind: kind } }, kind), kind).toEqual([]);
    const own = read("fixtures/positive/service-descriptor-subscription.json");
    for (const runner of SUBSCRIPTION_RUNNERS.keys()) expect(check({ ...own, runner: { kind: runner, credentialKind: "subscription" } }, "subscription"), runner).toEqual([]);
  });

  it("tells a malformed runner kind from one missing in the catalogue, even when the catalogue lists it", () => {
    const messages = (kind: unknown, entries: unknown) => evaluateSemanticRules("service-runner", { descriptor: { ...peer, runner: { kind, credentialKind: "key" } }, catalogue: entries }).map((finding) => finding.message);
    expect(messages("Bad Kind", [...catalogue, { kind: "Bad Kind" }])).toContain("the runner kind is not a runner kind's name");
    expect(messages("absent-kind", catalogue)).toContain("the runner kind is not in the runner catalogue");
  });

  it("never echoes a runner kind missing from the catalogue, since a provider key can match the kind pattern", () => {
    const key = ["sk", "abcdefghijklmnopqrstuvwx12"].join("-");
    const findings = evaluateSemanticRules("service-runner", { descriptor: { ...peer, runner: { kind: key, credentialKind: "key" } }, catalogue });
    expect(findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(findings)).not.toContain(key);
  });

  it("refuses a kind that is not a runner kind's name, without echoing it", () => {
    const findings = evaluateSemanticRules("service-runner", { descriptor: { ...peer, runner: { kind: fake, credentialKind: "key" } }, catalogue });
    expect(findings.map((finding) => finding.instancePath)).toEqual(["/descriptor/runner/kind"]);
    expect(JSON.stringify(findings)).not.toContain(fake);
    expect(check({ ...peer, runner: { kind: 7, credentialKind: "key" } })).toEqual(["/descriptor/runner/kind"]);
  });

  it("refuses an undeclared, unknown or credential-shaped kind, and an unreadable derived one, without echoing either", () => {
    expect(check({ ...peer, runner: {} })).toEqual(["/descriptor/runner/credentialKind"]);
    expect(check({ ...peer, runner: { credentialKind: "api-org" } })).toEqual(["/descriptor/runner/credentialKind"]);
    const findings = evaluateSemanticRules("service-runner", { descriptor: { ...peer, runner: { credentialKind: fake } }, catalogue, derived: "key" });
    expect(findings.map((finding) => finding.instancePath)).toEqual(["/descriptor/runner/credentialKind", "/derived"]);
    expect(JSON.stringify(findings)).not.toContain(fake);
    expect(findings[1]?.message).toContain("an unreadable kind");
    expect(check({ ...peer, runner: { credentialKind: "key" } }, fake)).toEqual(["/derived"]);
    // A derived value that is not a kind is reported as unreadable, never echoed.
    const derived = evaluateSemanticRules("service-runner", { descriptor: { ...peer, runner: { credentialKind: "key" } }, catalogue, derived: fake });
    expect(JSON.stringify(derived)).not.toContain(fake);
    expect(derived[0]?.message).toContain("is not one of");
    expect(check({ ...peer, runner: { credentialKind: "key" } }, null)).toEqual(["/derived"]);
  });

  it("a subscription without a runner kind, or in another vendor's runner, is refused", () => {
    expect(check({ ...peer, peer: undefined, runner: { credentialKind: "subscription" } })).toEqual(["/descriptor/runner/kind"]);
    expect(check({ ...peer, peer: undefined, runner: { kind: "pi", credentialKind: "subscription" } })).toEqual(["/descriptor/runner/kind"]);
  });

  it("reads the usage report only for a service offered to others, row by row, and tolerates a malformed one", () => {
    const usage = { days: [1, { byModel: 2 }, { byModel: [1, { route: "key" }, { route: "subscription" }] }] };
    const at = (descriptor: unknown, report: unknown) => evaluateSemanticRules("service-runner", { descriptor, catalogue, derived: "key", usage: report }).map((finding) => finding.instancePath);
    expect(at(peer, usage)).toEqual(["/usage/days/2/byModel/2/route"]);
    expect(at({ ...peer, peer: undefined }, usage)).toEqual([]);
    expect(at(peer, { days: "x" })).toEqual([]);
    expect(at(peer, [usage])).toEqual([]);
  });

  it("an empty or missing catalogue holds no kind, and a descriptor without a runner declares nothing", () => {
    expect(check({ ...peer, runner: { kind: "codex", credentialKind: "key" } }, undefined, [])).toEqual(["/descriptor/runner/kind"]);
    expect(check({ ...peer, runner: { kind: "codex", credentialKind: "key" } }, undefined, "codex")).toEqual(["/descriptor/runner/kind"]);
    expect(check({ ...peer, runner: undefined })).toEqual(["/descriptor/runner/credentialKind"]);
    expect(check(null)).toEqual(["/descriptor/runner/credentialKind"]);
  });
});

describe("peerRefusal and FAC-SEM-088: the host's check before it routes a request to a peer", () => {
  const vectors = read("fixtures/vectors/service-peer.json") as {
    dataClasses: string[]; refusals: string[];
    cases: Array<{ name: string; descriptor: unknown; dataClass: unknown; refusal: string | null }>;
    residency: { accepted: string[]; refused: string[] };
  };

  it("the vectors' classes are the module's and the schema's, in that order", () => {
    expect(vectors.dataClasses).toEqual([...PEER_DATA_CLASSES]);
    const schema = read("schemas/service-descriptor.schema.json");
    expect(schema.properties.peer.properties.maxDataClass.enum).toEqual([...PEER_DATA_CLASSES]);
    // The same four, in the same order, as device policy's organization API keys (DEC-0053).
    const enums: string[][] = [];
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === "object") {
        const object = node as Record<string, any>;
        if (object.dataClasses?.items?.enum) enums.push(object.dataClasses.items.enum);
        Object.values(object).forEach(walk);
      }
    };
    walk(read("schemas/device-policy.schema.json"));
    expect(enums).toEqual([[...PEER_DATA_CLASSES]]);
  });

  it.each(vectors.cases)("$name", ({ descriptor, dataClass, refusal }) => {
    expect(peerRefusal(descriptor, dataClass)).toBe(refusal);
    // The rule agrees with the function on the same input: a host that sent it conforms exactly when it may.
    const found = codes("service-peer-request", { descriptor, dataClass, sent: true });
    expect(found).toEqual(refusal === null ? [] : ["FAC-SEM-088"]);
    expect(codes("service-peer-request", { descriptor, dataClass, sent: false })).toEqual([]);
  });

  it("covers every refusal, a pass at each boundary and one above it", () => {
    const seen = new Set(vectors.cases.map((item) => item.refusal));
    for (const refusal of vectors.refusals) expect(seen.has(refusal), refusal).toBe(true);
    expect(seen.has(null)).toBe(true);
    for (const [index, max] of PEER_DATA_CLASSES.entries()) {
      const at = { peer: { ...peer.peer, maxDataClass: max } };
      expect(peerRefusal(at, max), max).toBeNull();
      const above = PEER_DATA_CLASSES[index + 1];
      if (above) expect(peerRefusal(at, above), `${above} over ${max}`).toBe("above-max-data-class");
    }
  });

  it("a record that does not say whether the host sent the request is refused", () => {
    for (const sent of [undefined, "true", 1, null]) expect(codes("service-peer-request", { descriptor: peer, dataClass: "public", sent }), String(sent)).toEqual(["FAC-SEM-088"]);
  });

  it("peer.residency accepts and refuses the vectors' codes", () => {
    const at = (code: string) => valid({ ...peer, peer: { ...peer.peer, residency: [code] } }).valid;
    for (const code of vectors.residency.accepted) expect(at(code), code).toBe(true);
    for (const code of vectors.residency.refused) expect(at(code), code).toBe(false);
  });
});

describe("the descriptor schema of DEC-0061: every refusal has a fixture that kills it", () => {
  const D = "service-descriptor.schema.json";
  /** A pattern edit that must change the pattern: a no-op edit would pass as a killed mutant. */
  const edit = (pattern: string, from: string, to: string): string => {
    if (!pattern.includes(from)) throw new Error(`the mutant's edit does not apply: ${from}`);
    return pattern.replace(from, to);
  };
  const MUTANTS: Array<Mutant & { killer: string; schema?: string }> = [
    { name: "label and plist beside the node", killer: "service-descriptor-node-with-label", mutate: (s) => { s.properties.lifecycle.allOf[1].if.properties.manager.enum = ["systemd", "task-scheduler"]; } },
    { name: "an endpoint of any shape", killer: "service-descriptor-peer-endpoint-ip", mutate: (s) => { delete s.properties.peer.properties.endpoint.pattern; } },
    { name: "an http endpoint", killer: "service-descriptor-peer-endpoint-http", mutate: (s) => { s.properties.peer.properties.endpoint.pattern = edit(s.properties.peer.properties.endpoint.pattern, "^https://", "^https?://"); } },
    { name: "an endpoint with a query", killer: "service-descriptor-peer-endpoint-query", mutate: (s) => { s.properties.peer.properties.endpoint.pattern = edit(s.properties.peer.properties.endpoint.pattern, "%/-]*)?$", "%/?=-]*)?$"); } },
    { name: "an endpoint with userinfo", killer: "service-descriptor-peer-endpoint-userinfo", mutate: (s) => { s.properties.peer.properties.endpoint.pattern = edit(s.properties.peer.properties.endpoint.pattern, "^https://(", "^https://([^@/]+@)?("); } },
    { name: "an endpoint with a fragment", killer: "service-descriptor-peer-endpoint-fragment", mutate: (s) => { s.properties.peer.properties.endpoint.pattern = edit(s.properties.peer.properties.endpoint.pattern, "%/-]*)?$", "%/-]*)?(#.*)?$"); } },
    { name: "a port of any size", killer: "service-descriptor-peer-endpoint-port", mutate: (s) => { s.properties.peer.properties.endpoint.pattern = edit(s.properties.peer.properties.endpoint.pattern, "(:([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5]))?", "(:[0-9]+)?"); } },
    { name: "a peer without its endpoint", killer: "service-descriptor-peer-without-endpoint", mutate: (s) => { s.properties.peer.required = ["custody", "residency", "maxDataClass"]; } },
    { name: "a peer without its custody", killer: "service-descriptor-peer-without-custody", mutate: (s) => { s.properties.peer.required = ["endpoint", "residency", "maxDataClass"]; } },
    { name: "a peer without its residency", killer: "service-descriptor-peer-without-residency", mutate: (s) => { s.properties.peer.required = ["endpoint", "custody", "maxDataClass"]; } },
    { name: "any custody", killer: "service-descriptor-peer-custody-unknown", mutate: (s) => { s.properties.peer.properties.custody = { type: "string" }; } },
    { name: "residency of any shape", killer: "service-descriptor-peer-residency-lowercase", mutate: (s) => { delete s.properties.peer.properties.residency.items.pattern; } },
    { name: "residency admits a user-assigned code", killer: "service-descriptor-peer-residency-user-assigned", mutate: (s) => { s.properties.peer.properties.residency.items.pattern = "^[A-Z]{2}$"; } },
    { name: "residency may be empty", killer: "service-descriptor-peer-residency-empty", mutate: (s) => { delete s.properties.peer.properties.residency.minItems; } },
    { name: "a residency code twice", killer: "service-descriptor-peer-residency-repeated", mutate: (s) => { s.properties.peer.properties.residency.uniqueItems = false; } },
    { name: "any data class", killer: "service-descriptor-peer-data-class-contract-vocabulary", mutate: (s) => { s.properties.peer.properties.maxDataClass = { type: "string" }; } },
    { name: "a peer without its maximum", killer: "service-descriptor-peer-without-max-data-class", mutate: (s) => { s.properties.peer.required = ["endpoint", "custody", "residency"]; } },
    { name: "a peer with unknown members", killer: "service-descriptor-peer-extra-member", mutate: (s) => { s.properties.peer.additionalProperties = true; } },
    { name: "a peer without a runner", killer: "service-descriptor-peer-without-runner", mutate: (s) => { delete s.allOf[1].then.required; } },
    { name: "a peer on a subscription", killer: "service-descriptor-peer-subscription", mutate: (s) => { s.allOf[1].then.properties = { runner: true }; } },
    { name: "a subscription in any runner", killer: "service-descriptor-runner-subscription-wrong-runner", mutate: (s) => { s.properties.runner.allOf[0].then.properties = { kind: true }; } },
    { name: "a subscription without its runner", killer: "service-descriptor-runner-subscription-without-kind", mutate: (s) => { delete s.properties.runner.allOf[0].then.required; } },
    { name: "any credential kind", killer: "service-descriptor-runner-credential-kind-unknown", mutate: (s) => { s.properties.runner.properties.credentialKind = { type: "string" }; } },
    { name: "a runner without its credential kind", killer: "service-descriptor-runner-without-credential-kind", mutate: (s) => { s.properties.runner.required = []; } },
    { name: "a runner with unknown members", killer: "service-descriptor-runner-extra-member", mutate: (s) => { s.properties.runner.additionalProperties = true; } },
    { name: "a person without a role", killer: "service-descriptor-installed-by-person-without-role", mutate: (s) => { delete s.properties.installedBy.anyOf[1].allOf[0].then; } },
    { name: "a role beside the node", killer: "service-descriptor-installed-by-node-with-role", mutate: (s) => { delete s.properties.installedBy.anyOf[1].allOf[0].else; } },
    { name: "any installer", killer: "service-descriptor-installed-by-unknown", mutate: (s) => { s.properties.installedBy.anyOf[1].properties.by = { type: "string" }; } },
    { name: "an installer without its tool", killer: "service-descriptor-installed-by-without-tool", mutate: (s) => { s.properties.installedBy.anyOf[1].required = ["by"]; } },
    { name: "installedBy with unknown members", killer: "service-descriptor-installed-by-extra-member", mutate: (s) => { s.properties.installedBy.anyOf[1].additionalProperties = true; } },
    { name: "a remote placement under the node", killer: "service-descriptor-remote-under-node", mutate: (s) => { delete s.allOf[0].then.properties.lifecycle; } },
    { name: "a usage row on any route", killer: "service-usage-route-unknown", schema: "service-usage.schema.json", mutate: (s) => { s.$defs.model.properties.route = { type: "string" }; } }
  ];

  it.each(MUTANTS)("a fixture kills the mutant: $name", async (mutant) => {
    expect(await killers(mutant.schema ?? D, mutant)).toContain(mutant.killer);
  });

  it("the unchanged schemas accept no negative fixture (the identity mutant)", async () => {
    expect(await killers(D, { name: "identity", mutate: () => {} })).toEqual([]);
    expect(await killers("service-usage.schema.json", { name: "identity", mutate: () => {} })).toEqual([]);
  });

  it("the node is a supervisor with no file here: unit, task, label and plist are each refused beside it", () => {
    const node = read("fixtures/positive/service-descriptor-node.json");
    expect(valid(node).valid).toBe(true);
    for (const [field, value] of [["label", "com.example.report-writer"], ["plist", "~/Library/LaunchAgents/x.plist"], ["unit", "x.service"], ["task", "\\PassionCode\\x"]] as const) {
      expect(valid({ ...node, lifecycle: { manager: "node", [field]: value } }).valid, field).toBe(false);
    }
  });

  it("installedBy keeps its string form, and an object names a role only for a person", () => {
    const node = read("fixtures/positive/service-descriptor-node.json");
    expect(valid({ ...node, installedBy: "example-agent service install 0.2.0" }).valid).toBe(true);
    expect(valid({ ...node, installedBy: "" }).valid).toBe(false);
    for (const role of ["operator", "administrator"]) expect(valid({ ...node, installedBy: { by: "person", role, tool: "x 1.0" } }).valid, role).toBe(true);
    expect(valid({ ...node, installedBy: { by: "person", role: "owner", tool: "x 1.0" } }).valid).toBe(false);
    expect(valid({ ...node, installedBy: { by: "organization", role: "administrator", tool: "x 1.0" } }).valid).toBe(false);
  });

  it("a subscription stays valid for the operator's own service and is refused once the service is offered to others", () => {
    const own = read("fixtures/positive/service-descriptor-subscription.json");
    expect(valid(own).valid).toBe(true);
    expect(valid({ ...own, peer: peer.peer }).valid).toBe(false);
    expect(valid({ ...own, peer: peer.peer, runner: { kind: "claude-code", credentialKind: "key" } }).valid).toBe(true);
  });
});

describe("service.md states DEC-0061 where a reader looks for it", () => {
  const spec = readFileSync(path.join(root, "docs/specification/service.md"), "utf8");

  it("the Supervisor row admits the node in the descriptor, and every lifecycle row has the node's form", () => {
    const lifecycle = spec.slice(spec.indexOf("## Lifecycle"), spec.indexOf("### Directories per system"));
    expect(lifecycle).not.toContain("admits `node` by a later change");
    for (const row of ["Install", "Off", "Code", "Uninstall"]) {
      const line = new RegExp(`^\\| ${row} \\|(.*)$`, "m").exec(lifecycle)?.[1] ?? "";
      expect(line, row).toMatch(/[Nn]ode/);
    }
  });

  it("the semantic-rules table defines the four codes with their kinds", () => {
    expect(spec).toMatch(/^\| <a id="fac-sem-085"><\/a>`FAC-SEM-085` \| `service-descriptor` \|/m);
    expect(spec).toMatch(/^\| <a id="fac-sem-086"><\/a>`FAC-SEM-086` \| `service-descriptor` \|/m);
    expect(spec).toMatch(/^\| <a id="fac-sem-087"><\/a>`FAC-SEM-087` \| `service-runner` \|/m);
    expect(spec).toMatch(/^\| <a id="fac-sem-088"><\/a>`FAC-SEM-088` \| `service-peer-request` \|/m);
  });
});
