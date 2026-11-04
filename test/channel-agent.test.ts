import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ValidateFunction } from "ajv/dist/2020.js";
import { CHANNEL_AGENT_PATHS, MESSAGE_ERRORS, PATH_DEPTH, SECRET_BUDGET, SECRET_FINDINGS, detectorCost, TOKEN_SLOT, TOO_LARGE, channelAgentRules, channelAgentView, placed, schemaErrors } from "../src/channel-agent.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS } from "../src/extensions.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidatorSync } from "../src/validator.js";
import { buildChannelAgentVectors } from "../tools/vectors/channel-agent.js";

// DEC-0150: extensions/channel-agent/0.1, an agent that answers people on a channel (FAC-SEM-162 to FAC-SEM-165).
type Json = Record<string, any>;
const root = projectRoot();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const vectors = JSON.parse(read("fixtures/vectors/channel-agent.json")) as { key: string; declarations: Array<{ name: string; site: "manifest" | "well-known"; input: unknown; findings: Array<{ code: string; instancePath: string }> }> };
const schema = JSON.parse(read("schemas/service-channel-agent-extension.schema.json")) as Json;
const KEY = EXTENSION_KEYS.channelAgent;
const valid = vectors.declarations.find((v) => v.name === "one project, every member")?.input as Json;
const value = valid.provider.extensions[KEY] as Json;

describe("extensions/channel-agent/0.1 (DEC-0150)", () => {
  it("the vector file is the generator's output", () => {
    expect(read("fixtures/vectors/channel-agent.json")).toBe(buildChannelAgentVectors());
  });
  it("names the key with the contract's other extension keys, once", () => {
    expect(KEY).toBe("https://fabric.passioncode.ai/agent-contract/extensions/channel-agent/0.1");
    expect(vectors.key).toBe(KEY);
  });
  it.each(vectors.declarations)("$name", ({ site, input, findings }) => {
    const found = channelAgentRules(input, site);
    expect(found.map(({ code, instancePath }) => ({ code, instancePath }))).toEqual(findings);
    for (const finding of found) expect(finding.message.length).toBeGreaterThan(10);
  });
  it("covers every code it allocates, and a valid declaration", () => {
    const codes = new Set(vectors.declarations.flatMap((v) => v.findings.map((finding) => finding.code)));
    expect([...codes].sort()).toEqual(["FAC-SEM-162", "FAC-SEM-163", "FAC-SEM-164", "FAC-SEM-165"]);
    expect(vectors.declarations.filter((v) => v.findings.length === 0).length).toBeGreaterThan(5);
  });
  it("reads a valid declaration's projects, and names an invalid one's errors", () => {
    const view = channelAgentView(valid);
    expect(view).toMatchObject({ declared: true, valid: true, standard: "channel-agent-standard/1" });
    expect(view.declared && view.valid && view.projects[0]?.project).toBe("project:example-support");
    expect(channelAgentView({ provider: { extensions: { [KEY]: {} } } })).toEqual({ declared: true, valid: false, errors: ["required at / (standard)", "required at / (projects)"] });
    expect(channelAgentView({ provider: { extensions: null } })).toEqual({ declared: false });
    expect(channelAgentView("x")).toEqual({ declared: false });
  });
  it("finds a provider key shape built at run time, anywhere in the value", () => {
    const key = ["sk", "-", "A1b2".repeat(6)].join("");
    const manifest = { provider: { extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], taxonomy: { version: "1", codes: [{ code: "a", label: key }] } }] } } } };
    expect(channelAgentRules(manifest).map((finding) => finding.instancePath)).toEqual([`/provider/extensions/${KEY.replace(/\//g, "~1")}/projects/0/taxonomy/codes/0/label`]);
  });
  it("still reads a token slot outside its grammar as a value", () => {
    const tickets = { ...value.projects[0].tickets, token_slot: ["Bearer", "x".repeat(30)].join(" ") };
    const manifest = { provider: { extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], tickets }] } } } };
    expect(channelAgentRules(manifest).map((finding) => finding.code)).toEqual(["FAC-SEM-165", "FAC-SEM-162"]);
  });
  it("reads a token slot of its grammar segment by segment (each shape built at run time)", () => {
    const at = (slot: string) => {
      const tickets = { ...value.projects[0].tickets, token_slot: slot };
      return channelAgentRules({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], tickets }] } } } }).map((finding) => `${finding.code} ${finding.instancePath.split("/").slice(-2).join("/")}`);
    };
    const aws = ["AK", "IA", "Q".repeat(4), "7".repeat(12)].join("");
    const openai = ["sk", "-", "Q7r2".repeat(5)].join("");
    const slack = ["xo", "xb-", "1".repeat(11), "-", "2".repeat(11)].join("");
    expect(at(`example-support/prod/${aws}`)).toEqual(["FAC-SEM-165 tickets/token_slot"]);
    // A key with an upper-case letter is outside the slot's grammar: read whole, and the schema refuses it.
    expect(at(`${openai}/prod/KEY`)).toEqual(["FAC-SEM-165 tickets/token_slot", "FAC-SEM-162 extensions/https:~1~1fabric.passioncode.ai~1agent-contract~1extensions~1channel-agent~10.1"]);
    expect(at(`${slack}/prod/KEY`)).toEqual(["FAC-SEM-165 tickets/token_slot"]);
    expect(at("example-support-project/prod/SUPPORT_TOKEN_V2")).toEqual([]);
  });
  it("carries no declared value in any message or path (each value built at run time)", () => {
    const github = ["gh", "p_", "Ab1".repeat(12)].join("");
    const slack = ["xo", "xb-", "1".repeat(11), "-", "2".repeat(11)].join("");
    const address = ["someone", "example.com"].join("@");
    const p0 = value.projects[0];
    const cases: Json[] = [
      { ...p0, sources: [{ ...p0.sources[0], id: github }, { ...p0.sources[0], id: github }] },
      { ...p0, channels: [{ ...p0.channels[0], id: "dm" }, { ...p0.channels[0], id: "dm" }] },
      { ...p0, channels: [p0.channels[0], { ...p0.channels[1], decision: slack.replace(/-/g, "_") }] },
      { ...p0, handoff_queues: [{ id: github, owner: "support-team", limit: "P2D", answered_signal: "none" }] },
      { ...p0, channels: [{ ...p0.channels[0], texts: { holding: { [address]: 5, [github]: "x" }, final: p0.channels[0].texts.final } }, p0.channels[1]] },
      { ...p0, sources: [{ ...p0.sources[0], owner: address }] },
      { ...p0, lead_agent: slack }
    ];
    for (const project of cases) {
      const found = channelAgentRules({ provider: { extensions: { [KEY]: { ...value, projects: [project] } } } });
      expect(found.length).toBeGreaterThan(0);
      const text = JSON.stringify(found);
      for (const secret of [github, slack, slack.replace(/-/g, "_"), address, "someone"]) expect(text, secret).not.toContain(secret);
    }
  });
  it("walks a 100000-deep value with no throw, and reports it invalid", () => {
    let deep: unknown = "end";
    for (let i = 0; i < 100_000; i += 1) deep = [deep];
    const found = channelAgentRules({ provider: { extensions: { [KEY]: { standard: "channel-agent-standard/1", projects: [deep] } } } });
    expect(found.map((finding) => finding.code)).toEqual(["FAC-SEM-162"]);
  });
  it("refuses an array longer than its schema allows before the schema runs, with a short message", () => {
    const many = (n: number) => ({ provider: { extensions: { [KEY]: { standard: "channel-agent-standard/1", projects: Array.from({ length: n }, (_, i) => i) } } } });
    const started = performance.now();
    const found = channelAgentRules(many(200_000));
    const huge = performance.now() - started;
    expect(found.map(({ code, instancePath }) => ({ code, instancePath }))).toEqual([{ code: "FAC-SEM-162", instancePath: CHANNEL_AGENT_PATHS.manifest }]);
    expect(found[0]?.message).toMatch(/^the channel-agent declaration fails its schema: maxItems at \/projects; a reader treats it as not declared/);
    expect(found[0]?.message).toContain("channel-agent.md#the-declaration");
    const small = performance.now();
    channelAgentRules(many(65));
    // The probe: 200000 items cost about what 65 do, plus the walk, never the schema's errors per item.
    expect(huge).toBeLessThan(Math.max(2000, (performance.now() - small) * 2000));
    const inner = { ...value.projects[0], channels: Array.from({ length: 33 }, () => value.projects[0].channels[0]), sources: Array.from({ length: 65 }, () => value.projects[0].sources[0]) };
    const [finding] = channelAgentRules({ provider: { extensions: { [KEY]: { ...value, projects: [inner] } } } });
    expect(finding?.message).toContain("maxItems at /projects/0/channels");
    expect(finding?.message).toContain("maxItems at /projects/0/sources");
  });
  it("names at most ten failed keywords in its message and counts the rest", () => {
    const broken = Object.fromEntries(Object.keys(value.projects[0]).map((name) => [name, 7]));
    const [finding] = channelAgentRules({ provider: { extensions: { [KEY]: { ...value, projects: [broken] } } } });
    expect(finding?.code).toBe("FAC-SEM-162");
    const named = /fails its schema: (.*?)( and (\d+) more)?; /.exec(finding?.message ?? "");
    expect(named?.[1]?.split(", ").length).toBe(MESSAGE_ERRORS);
    expect(Number(named?.[3])).toBeGreaterThan(0);
    const map = Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`l${i}`, "x"]));
    const texts = { ...value.projects[0], channels: [{ ...value.projects[0].channels[0], texts: { holding: map, final: map } }] };
    expect(channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [texts] } } } })).toEqual({ declared: true, valid: false, errors: ["maxProperties at /projects/0/channels/0/texts/holding", "maxProperties at /projects/0/channels/0/texts/final"] });
    const codes = { ...value.projects[0], taxonomy: { version: "1", codes: Array.from({ length: 513 }, (_, i) => ({ code: `c${i}`, label: "C" })) } };
    expect(channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [codes] } } } })).toEqual({ declared: true, valid: false, errors: ["maxItems at /projects/0/taxonomy/codes"] });
    const noTexts = { ...value.projects[0], channels: [{ ...value.projects[0].channels[0], texts: 5 }] };
    expect(channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [noTexts] } } } })).toEqual({ declared: true, valid: false, errors: ["type at /projects/0/channels/0/texts"] });
  });
  it("finds a member name shaped like a credential and keeps it out of the path", () => {
    const name = ["sk", "-", "C3".repeat(12)].join("");
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, [name]: { note: ["Bearer", "y".repeat(24)].join(" ") } } } }, "well-known");
    expect(found.map((finding) => `${finding.code} ${finding.instancePath}`)).toEqual([`FAC-SEM-165 ${CHANNEL_AGENT_PATHS["well-known"]}`, `FAC-SEM-165 ${CHANNEL_AGENT_PATHS["well-known"]}`, `FAC-SEM-162 ${CHANNEL_AGENT_PATHS["well-known"]}`]);
    expect(JSON.stringify(found)).not.toContain(name);
  });
  it("places a text whose language is not a plain name, or is shaped like a credential, at its map (each built at run time)", () => {
    const keys = [["sk", "-Ab12Cd34", "-Ef56Gh78", "-Ij90Kl12"].join(""), ["en", "491", "511", "234", "5678"].join("-")];
    const p0 = value.projects[0];
    for (const key of keys) {
      for (const text of [["a", "\u2014", "b"].join(" "), "   ", "\u200b"]) {
        const channel = { ...p0.channels[0], texts: { holding: { [key]: text }, final: p0.channels[0].texts.final } };
        const found = channelAgentRules({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [channel, p0.channels[1]] }] } } } });
        expect(found.filter((f) => f.code === "FAC-SEM-164").map((f) => f.instancePath), `${key.length} ${JSON.stringify(text)}`).toEqual([`${CHANNEL_AGENT_PATHS.manifest}/projects/0/channels/0/texts/holding`]);
        expect(JSON.stringify(found)).not.toContain(key);
      }
    }
  });
  it("writes * for a text's language and for a number that is no index, in FAC-SEM-162", () => {
    const p0 = value.projects[0];
    const digits = ["49", "1511234"].join("");
    for (const [text, keyword] of [["", "minLength"], [5, "type"]] as const) {
      const channel = { ...p0.channels[0], texts: { holding: { [digits]: text }, final: p0.channels[0].texts.final } };
      const view = channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [channel, p0.channels[1]] }] } } } });
      expect(view.declared && !view.valid && view.errors).toContain(`${keyword} at /projects/0/channels/0/texts/holding/*`);
      expect(JSON.stringify(view)).not.toMatch(/[0-9]{7}/);
    }
    const final = { ...p0.channels[0], texts: { holding: p0.channels[0].texts.holding, final: { [digits]: "" } } };
    const late = channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [final, p0.channels[1]] }] } } } });
    expect(late.declared && !late.valid && late.errors).toContain("minLength at /projects/0/channels/0/texts/final/*");
    // Places the schema never reports today, read the same way: a number after no declared array, an undeclared name.
    expect(placed({ keyword: "type", instancePath: `/projects/0/sources/0/${digits}/x~1y/3` })).toBe("type at /projects/0/sources/0/*/*/*");
    const extra = channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, [digits]: { [digits]: 1 } }] } } } });
    expect(extra.declared && !extra.valid && extra.errors).toEqual(["maxProperties at /projects/0"]);
    const long = `en${"-abcdefgh".repeat(9)}`;
    const longChannel = { ...p0.channels[0], texts: { holding: { [long]: "Checking." }, final: p0.channels[0].texts.final } };
    const longView = channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [longChannel, p0.channels[1]] }] } } } });
    expect(longView.declared && !longView.valid && longView.errors).toEqual(["maxLength at /projects/0/channels/0/texts/holding", "propertyNames at /projects/0/channels/0/texts/holding"]);
    expect(JSON.stringify(longView)).not.toContain("abcdefgh");
  });
  it("places a member whose name holds a run of 7 digits at its parent, and reads only the first 4097 code points", () => {
    const bearer = ["Bearer", "z".repeat(24)].join(" ");
    const name = ["n", "1234567"].join("");
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, extra: { [name]: bearer } } } }, "well-known");
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.instancePath)).toEqual([`${CHANNEL_AGENT_PATHS["well-known"]}/*`]);
    const key = ["sk", "-", "D4".repeat(12)].join("");
    const late = channelAgentRules({ extensions: { [KEY]: { ...value, extra: `${"a ".repeat(2100)}${key}` } } }, "well-known");
    expect(late.filter((f) => f.code === "FAC-SEM-165")).toEqual([]);
    const early = channelAgentRules({ extensions: { [KEY]: { ...value, extra: `${key}${"a ".repeat(2100)}` } } }, "well-known");
    expect(early.filter((f) => f.code === "FAC-SEM-165").length).toBe(1);
  });
  it("names at most SECRET_FINDINGS places and a path at most PATH_DEPTH deep, in time linear in the input", { timeout: 60_000 }, () => {
    const bearer = ["Bearer", "w".repeat(24)].join(" ");
    const key = ["sk", "-", "E5".repeat(12)].join("");
    const valueChain = (depth: number) => {
      let node: Json = { s: bearer };
      for (let i = 1; i < depth; i += 1) node = { s: bearer, a: node };
      return node;
    };
    const nameChain = (depth: number) => {
      let node: Json = { s: 1 };
      for (let i = 1; i < depth; i += 1) node = { [key]: node };
      return node;
    };
    // The test's own thread's processor time (process.threadCpuUsage, Node 23.9 and later), so the collector's helper
    // threads and other files' work do not count; process.cpuUsage where the thread's is not available.
    const clock = (previous?: NodeJS.CpuUsage): NodeJS.CpuUsage => {
      const threaded = (process as unknown as { threadCpuUsage?: (previous?: NodeJS.CpuUsage) => NodeJS.CpuUsage }).threadCpuUsage;
      return threaded === undefined ? process.cpuUsage(previous) : threaded.call(process, previous);
    };
    const run = (chain: Json) => {
      const doc = { extensions: { [KEY]: { standard: "channel-agent-standard/1", projects: [chain] } } };
      const before = clock();
      const found = channelAgentRules(doc, "well-known");
      const spent = clock(before);
      return { found, micros: spent.user + spent.system };
    };
    // Five runs at each size after one warm run of each, summed, so a moment of another process does not read as growth.
    const total = (chain: Json) => {
      const runs = [run(chain), run(chain), run(chain), run(chain), run(chain)];
      return { found: runs[0]?.found ?? [], micros: runs.reduce((sum, r) => sum + r.micros, 0) };
    };
    for (const build of [valueChain, nameChain]) {
      const smallChain = build(8000);
      const largeChain = build(32000);
      run(smallChain);
      run(largeChain);
      const small = total(smallChain);
      const large = total(largeChain);
      const secret = large.found.filter((f) => f.code === "FAC-SEM-165");
      // The places, the count of the rest, and, past SECRET_BUDGET code points, the finding that the rest was not read.
      expect(secret.slice(0, SECRET_FINDINGS + 1).at(-1)?.message).toMatch(/^and [0-9]+ more /);
      expect(secret.length - SECRET_FINDINGS - 1).toBe(secret.at(-1)?.message.includes("was not read") ? 1 : 0);
      const characters = large.found.reduce((sum, f) => sum + f.instancePath.length, 0);
      expect(characters).toBeLessThan((SECRET_FINDINGS + 2) * (CHANNEL_AGENT_PATHS["well-known"].length + 2 * PATH_DEPTH + 16));
      expect(Math.max(...large.found.map((f) => f.instancePath.split("/").length))).toBeLessThanOrEqual(CHANNEL_AGENT_PATHS["well-known"].split("/").length + PATH_DEPTH);
      // A 4x step in size costs about 4x in time: never the quadratic 16x.
      const ratio = large.micros / Math.max(small.micros, 1);
      expect(ratio).toBeLessThan(6);
    }
  });
  it("refuses a string or a name over 4096 code points before the schema runs, with no run of it in the finding", { timeout: 60_000 }, () => {
    const base = JSON.parse(read("fixtures/positive/service-well-known-channel-agent.json")) as Json;
    const declared = base.extensions[KEY] as Json;
    const p0 = declared.projects[0];
    const suite = { ...base, extensions: { ...base.extensions, [KEY]: { ...declared, projects: [{ ...p0, evals: { ...p0.evals, suite: `x${"a/".repeat(4_000_000)}` } }] } } };
    const language = `en${"-a".repeat(3_000_000)}`;
    const texts = { ...base, extensions: { ...base.extensions, [KEY]: { ...declared, projects: [{ ...p0, channels: [{ ...p0.channels[0], texts: { holding: { [language]: "Checking." }, final: p0.channels[0].texts.final } }, p0.channels[1]] }] } } };
    for (const [doc, place] of [[suite, "maxLength at /projects/0/evals/suite"], [texts, "maxLength at /projects/0/channels/0/texts/holding"]] as const) {
      const found = evaluateSemanticRules("service-well-known", JSON.parse(JSON.stringify(doc)));
      expect(found.map((f) => f.code)).toEqual(["FAC-SEM-162"]);
      expect(found[0]?.message).toContain(place);
      expect(JSON.stringify(found)).not.toMatch(/(a\/){4}|(-a){4}/);
    }
  });
  it("refuses a declaration that is itself a string over 4096 code points at its root", () => {
    expect(channelAgentView({ extensions: { [KEY]: "x".repeat(5000) } }, "well-known")).toEqual({ declared: true, valid: false, errors: ["maxLength at /"] });
  });
  it("writes * for a numeric key of an object, whether the object is unknown or stands where an array is declared", () => {
    const digits = ["491", "511", "234"].join("");
    const long = "x".repeat(5000);
    const p0 = value.projects[0];
    const docs = [
      { ...value, extra: { [digits]: long } },
      { ...value, projects: [{ ...p0, extra: { [digits]: long } }] },
      { ...value, projects: [{ ...p0, channels: { [digits]: long } }] }
    ];
    for (const declared of docs) {
      const found = channelAgentRules({ extensions: { [KEY]: declared } }, "well-known");
      expect(found.map((f) => f.code)).toEqual(["FAC-SEM-162"]);
      expect(JSON.stringify(found)).not.toMatch(/[0-9]{7}/);
    }
  });
  it("refuses every closed object wider than the schema declares, its members counted from the schema", { timeout: 120_000 }, () => {
    const wide = Object.fromEntries(Array.from({ length: 100_000 }, (_, i) => [`w${i}`, 1]));
    const p0 = value.projects[0];
    const ch = p0.channels[0];
    const places: Array<[string, Json]> = [
      ["/", { ...value, ...wide }],
      ["/projects/0", { ...value, projects: [{ ...p0, ...wide }] }],
      ["/projects/0/taxonomy", { ...value, projects: [{ ...p0, taxonomy: { ...p0.taxonomy, ...wide } }] }],
      ["/projects/0/taxonomy/codes/0", { ...value, projects: [{ ...p0, taxonomy: { ...p0.taxonomy, codes: [{ ...p0.taxonomy.codes[0], ...wide }] } }] }],
      ["/projects/0/tiers/0", { ...value, projects: [{ ...p0, tiers: [{ ...p0.tiers[0], ...wide }] }] }],
      ["/projects/0/question_route", { ...value, projects: [{ ...p0, question_route: { ...p0.question_route, ...wide } }] }],
      ["/projects/0/gap_registry", { ...value, projects: [{ ...p0, gap_registry: { ...p0.gap_registry, ...wide } }] }],
      ["/projects/0/sources/0", { ...value, projects: [{ ...p0, sources: [{ ...p0.sources[0], ...wide }] }] }],
      ["/projects/0/declined_sources/0", { ...value, projects: [{ ...p0, declined_sources: [{ ...p0.declined_sources[0], ...wide }] }] }],
      ["/projects/0/handoff_queues/0", { ...value, projects: [{ ...p0, handoff_queues: [{ ...p0.handoff_queues[0], ...wide }] }] }],
      ["/projects/0/evals", { ...value, projects: [{ ...p0, evals: { ...p0.evals, ...wide } }] }],
      ["/projects/0/tickets", { ...value, projects: [{ ...p0, tickets: { ...p0.tickets, ...wide } }] }],
      ["/projects/0/recorded_decisions/0", { ...value, projects: [{ ...p0, recorded_decisions: [{ ...p0.recorded_decisions[0], ...wide }] }] }],
      ["/projects/0/channels/0", { ...value, projects: [{ ...p0, channels: [{ ...ch, ...wide }] }] }],
      ["/projects/0/channels/0/texts", { ...value, projects: [{ ...p0, channels: [{ ...ch, texts: { ...ch.texts, ...wide } }] }] }]
    ];
    for (const [place, declared] of places) {
      expect(channelAgentView({ extensions: { [KEY]: declared } }, "well-known"), place).toEqual({ declared: true, valid: false, errors: [`maxProperties at ${place}`] });
    }
  });
  it("reads at most SECRET_BUDGET code points for credentials, then says the rest was not read, in little time", () => {
    const opening = ["e", "y", "J"].join("");
    const strings = Array.from({ length: 488 }, () => opening.repeat(1366).slice(0, 4096));
    const started = performance.now();
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, extra: strings } } }, "well-known");
    expect(performance.now() - started).toBeLessThan(500);
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => [f.instancePath, f.message.includes(`more than ${SECRET_BUDGET}`)])).toEqual([[CHANNEL_AGENT_PATHS["well-known"], true]]);
  });
  it("counts what the detector reads: a string once, and again after each eyJ to the end of its run", () => {
    expect(detectorCost("")).toBe(0);
    expect(detectorCost("plain text")).toBe(10);
    expect(detectorCost("eyJab.cd")).toBe(8 + 5);
    expect(detectorCost("x eyJeyJ y")).toBe(10 + 6 + 3);
    expect(detectorCost("eyJ".repeat(1000))).toBeGreaterThan(SECRET_BUDGET);
  });
  it("counts the square of an upper-case run after ?, & or # as read, so a query name cannot slow the detector", () => {
    expect(detectorCost("a?BC=x")).toBe(6 + 3);
    expect(detectorCost("#&?")).toBe(3);
    const strings = Array.from({ length: 245 }, () => `https://a.example/?${"Q".repeat(4060)}=x`);
    const started = performance.now();
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, extra: strings } } }, "well-known");
    expect(performance.now() - started).toBeLessThan(500);
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.message.includes("was not read"))).toEqual([true]);
  });
  it("shares one reading budget across every copy of the declaration in a manifest", () => {
    const opening = ["e", "y", "J"].join("");
    const heavy = { ...value, extra: Array.from({ length: 300 }, () => opening.repeat(1366).slice(0, 4096)) };
    const manifest = { provider: { extensions: { [KEY]: value } }, extensions: { [KEY]: heavy }, capabilities: [0, 1, 2].map(() => ({ extensions: { [KEY]: heavy } })) };
    const started = performance.now();
    const found = channelAgentRules(manifest);
    expect(performance.now() - started).toBeLessThan(2000);
    expect(found.filter((f) => f.code === "FAC-SEM-162").length).toBe(4);
  });
  it("finds an id that starts with sk- and holds a mixed run, as the page warns", () => {
    const channel = { ...value.projects[0].channels[0], id: "sk-Support-Desk-2026-v2" };
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], channels: [channel, value.projects[0].channels[1]] }] } } }, "well-known");
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.instancePath)).toEqual([`${CHANNEL_AGENT_PATHS["well-known"]}/projects/0/channels/0/id`]);
  });
  it("names the schema's allowed values beside an enum, a const or a pattern place, never the instance's", () => {
    const route = { ...value.projects[0].question_route, capability: "support.ask" };
    const view = channelAgentView({ extensions: { [KEY]: { ...value, standard: "channel-agent-standard/2", projects: [{ ...value.projects[0], side: "Side", question_route: route }] } } }, "well-known");
    expect(view.declared && !view.valid && view.errors).toEqual(expect.arrayContaining(["const at /standard (channel-agent-standard/1)", "enum at /projects/0/question_route/capability (one of team.ask, operator.ask)", "pattern at /projects/0/side (pattern ^(?![a-z0-9-]*[0-9]{7})[a-z0-9-]{1,32}$)"]));
    expect(JSON.stringify(view)).not.toMatch(/support\.ask|Side"|\/2/);
  });
  it("places every descendant of a member that is not plain at the nearest plain ancestor, declared names and all", () => {
    const name = ["sk", "-", "Zx9Q".repeat(5)].join("");
    const bearer = ["Bearer", "q".repeat(24)].join(" ");
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], [name]: { standard: bearer, side: { lead_agent: bearer } } }] } } }, "well-known");
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.instancePath)).toEqual(Array(3).fill(`${CHANNEL_AGENT_PATHS["well-known"]}/projects/0`));
  });
  it("reads a recommendation outside its grammar whole (a password built at run time)", () => {
    const url = ["postgres://app:", "Pw7q".repeat(4), "@db.example/support"].join("");
    const queue = { id: "support-mail", owner: "support-team", limit: "P2D", answered_signal: "none", recommendation: url };
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], handoff_queues: [queue] }] } } }, "well-known");
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.instancePath)).toEqual([`${CHANNEL_AGENT_PATHS["well-known"]}/projects/0/handoff_queues/0/recommendation`]);
    expect(JSON.stringify(found)).not.toContain("Pw7q");
  });
  it("answers a schema that cannot run on a value with one fixed error, and lets any other failure through", () => {
    const throwing = (error: Error) => (() => { throw error; }) as unknown as ValidateFunction;
    expect(schemaErrors({}, throwing(new RangeError("Maximum call stack size exceeded")))).toEqual([TOO_LARGE]);
    expect(() => schemaErrors({}, throwing(new TypeError("broken")))).toThrow(TypeError);
  });
  it("refuses a declaration with more members than its schema declares before the schema runs", () => {
    const wide = Object.fromEntries(Array.from({ length: 100_000 }, (_, i) => [`m${i}`, 1]));
    expect(channelAgentView({ extensions: { [KEY]: { ...value, ...wide } } }, "well-known")).toEqual({ declared: true, valid: false, errors: ["maxProperties at /"] });
    const long = channelAgentRules({ extensions: { [KEY]: { ...value, extra: Array(200_000).fill(1) } } }, "well-known");
    expect(long.map((f) => f.code)).toEqual(["FAC-SEM-162"]);
    const channel = { ...value.projects[0].channels[0], extra: 1 };
    expect(channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], channels: [channel] }] } } }, "well-known")).toEqual({ declared: true, valid: false, errors: ["maxProperties at /projects/0/channels/0"] });
  });
  it("counts the digits of a name with its hyphens and underscores left out", () => {
    const bearer = ["Bearer", "v".repeat(24)].join(" ");
    const name = ["491", "511", "234", "5678"].join("-");
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, extra: { [name]: bearer } } } }, "well-known");
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.instancePath)).toEqual([`${CHANNEL_AGENT_PATHS["well-known"]}/*`]);
  });
  it("reads a time zone of one segment or Area/Location", () => {
    const zone = createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-channel-agent-extension.schema.json#/$defs/project/properties/question_route/properties/tz`);
    for (const ok of ["UTC", "GMT", "CET", "Etc/UTC", "Europe/Warsaw", "America/Argentina/Buenos_Aires", "Etc/GMT+3"]) expect(zone?.(ok), ok).toBe(true);
    for (const bad of ["", "Europe/", "/UTC", "a/b/c/d", "Europe Warsaw", "+03:00"]) expect(zone?.(bad), bad).toBe(false);
  });
  it("keeps the patterns it repeats from the schemas they come from", () => {
    const other = (file: string) => JSON.parse(read(`schemas/${file}`)) as Json;
    const defs = schema.$defs as Json;
    expect(defs.project.properties.evals.properties.spend_record.oneOf[0].pattern).toBe(other("service-usage.schema.json").$defs.limit.properties.id.pattern);
    expect(defs.project.properties.question_route.properties.target.pattern).toBe(other("comms-common.schema.json").$defs.projectId.pattern);
    expect(defs.project.properties.gap_registry.properties.capability.pattern).toBe(other("common.schema.json").$defs.capabilityName.pattern);
    expect(defs.project.properties.handoff_queues.items.properties.recommendation.pattern).toBe(other("comms-common.schema.json").$defs.opaqueId.pattern);
    // The standard's patterns, each with an id's lookahead for a run of 7 digits (CA-2).
    const digits = "(?![a-z0-9_-]*[0-9]{7})";
    expect(defs.channel.properties.id.pattern).toBe(`^${digits}[a-z0-9][a-z0-9_-]{0,63}$`);
    expect(defs.project.properties.taxonomy.properties.codes.items.properties.code.pattern).toBe("^(?![a-z0-9_.]*[0-9]{7})[a-z0-9_.]{1,64}$");
    expect(defs.project.properties.side.pattern).toBe("^(?![a-z0-9-]*[0-9]{7})[a-z0-9-]{1,32}$");
    expect(defs.project.properties.tickets.properties.token_slot.pattern).toBe(TOKEN_SLOT.source.replace(/\\\//g, "/"));
  });
  it("is a schema with no reference to another file, so a kit vendors one file", () => {
    expect(read("schemas/service-channel-agent-extension.schema.json")).not.toMatch(/"\$ref":\s*"[^#]/);
  });
  it("reads a duration in days, hours, minutes and seconds only, and a relative reference inside the repository", () => {
    const check = createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-channel-agent-extension.schema.json#/$defs/duration`);
    const relative = createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-channel-agent-extension.schema.json#/$defs/relativeRef`);
    for (const ok of ["P7D", "PT1H", "PT10M", "P1DT12H", "PT30S", "P2D", "P0DT1H", "PT0H1M", "P01D"]) expect(check?.(ok), ok).toBe(true);
    for (const bad of ["P", "PT", "P1M", "P1W", "P1Y", "7D", "PT1.5H", "P1DT", "pt1h", "P0D", "PT0S", "PT0H0M", "P00DT0H", "P0DT0H0M0S"]) expect(check?.(bad), bad).toBe(false);
    for (const ok of ["evals/support", "ticket_outbox", "a..b/c", "db:tickets"]) expect(relative?.(ok), ok).toBe(true);
    for (const bad of ["/abs", "~/x", "C:/x", "../x", "a/../b", "a/..", "a b", "a\\b", ""]) expect(relative?.(bad), bad).toBe(false);
  });
  it("runs inside kind manifest and kind service-well-known, beside their other rules", () => {
    const dir = path.join(root, "fixtures/semantic");
    const fixtures = readdirSync(dir).filter((name) => name.startsWith("manifest-channel-agent-")).map((name) => ({ name, ...(JSON.parse(readFileSync(path.join(dir, name), "utf8")) as { kind: string; expect: string[]; input: Json }) }));
    expect(fixtures.length).toBeGreaterThanOrEqual(5);
    const wellKnown = readdirSync(dir).filter((name) => name.startsWith("service-well-known-channel-agent-")).map((name) => ({ name, ...(JSON.parse(readFileSync(path.join(dir, name), "utf8")) as { kind: string; expect: string[]; input: Json }) }));
    expect(wellKnown.length).toBeGreaterThanOrEqual(2);
    for (const fixture of wellKnown) {
      expect(fixture.kind, fixture.name).toBe("service-well-known");
      expect(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => f.code), fixture.name).toEqual(fixture.expect);
    }
    expect(new Set(fixtures.flatMap((f) => f.expect))).toEqual(new Set(["FAC-SEM-162", "FAC-SEM-163", "FAC-SEM-164", "FAC-SEM-165"]));
    for (const fixture of fixtures) {
      expect(fixture.kind, fixture.name).toBe("manifest");
      expect(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => f.code), fixture.name).toEqual(fixture.expect);
    }
  });
});
