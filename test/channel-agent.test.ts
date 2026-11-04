import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ValidateFunction } from "ajv/dist/2020.js";
import { CHANNEL_AGENT_PATHS, MESSAGE_ERRORS, readAsUrl, schemaLine, PATH_DEPTH, PIECE_COST, SECRET_BUDGET, SECRET_FINDINGS, VISIT_COST, codePoints, detectorCost, TOKEN_SLOT, TOO_LARGE, channelAgentRules, channelAgentView, placed, schemaErrors } from "../src/channel-agent.js";
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

// Time is the test thread's own processor time (process.threadCpuUsage, Node 23.9 and later; process.cpuUsage where it
// is not available), the least of three runs after a warm one, held against prose read to the budget in the same run: a
// ratio, so a loaded machine or the coverage run slows both sides alike.
const threadClock = (previous?: NodeJS.CpuUsage): NodeJS.CpuUsage => {
  const threaded = (process as unknown as { threadCpuUsage?: (previous?: NodeJS.CpuUsage) => NodeJS.CpuUsage }).threadCpuUsage;
  return threaded === undefined ? process.cpuUsage(previous) : threaded.call(process, previous);
};
const cpuMs = (work: () => unknown): number => {
  const started = threadClock();
  work();
  const spent = threadClock(started);
  return (spent.user + spent.system) / 1000;
};
const least = (work: () => unknown): number => {
  work();
  return Math.min(cpuMs(work), cpuMs(work), cpuMs(work));
};
const PROSE = "the quick brown fox jumps over the lazy dog ".repeat(100).slice(0, 4096);
/** 245 strings of prose, about SECRET_BUDGET code points: a document read to the budget. */
const proseBaseline = (): number => {
  const doc = { extensions: { [KEY]: { ...value, extra: Array.from({ length: 245 }, () => PROSE) } } };
  return least(() => channelAgentRules(doc, "well-known"));
};

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
    expect(view).toMatchObject({ declared: true, standard: "channel-agent-standard/1" });
    expect(view.declared && view.projects[0]?.project).toBe("project:example-support");
    expect(channelAgentView({ provider: { extensions: { [KEY]: {} } } })).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /: required (standard)", "FAC-SEM-162 at /: required (projects)"] });
    expect(channelAgentView({ provider: { extensions: null } })).toEqual({ declared: false, reported: false });
    expect(channelAgentView("x")).toEqual({ declared: false, reported: false });
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
    const doc = many(200_000);
    const found = channelAgentRules(doc);
    expect(found.map(({ code, instancePath }) => ({ code, instancePath }))).toEqual([{ code: "FAC-SEM-162", instancePath: CHANNEL_AGENT_PATHS.manifest }]);
    expect(found[0]?.message).toMatch(/^the channel-agent declaration fails its schema: maxItems at \/projects \(at most 64 items\); a reader treats it as not declared/);
    expect(found[0]?.message).toContain("channel-agent.md#the-declaration");
    // The probe: 200000 items cost the walk, never the schema's errors per item.
    expect(least(() => channelAgentRules(doc))).toBeLessThan(2 * proseBaseline() + 20);
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
    expect(named?.[1]?.match(/ at \//g)?.length).toBe(MESSAGE_ERRORS);
    expect(Number(named?.[3])).toBeGreaterThan(0);
    const map = Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`l${i}`, "x"]));
    const texts = { ...value.projects[0], channels: [{ ...value.projects[0].channels[0], texts: { holding: map, final: map } }] };
    expect(channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [texts] } } } })).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/channels/0/texts/holding: maxProperties (at most 64 members)", "FAC-SEM-162 at /projects/0/channels/0/texts/final: maxProperties (at most 64 members)"] });
    const codes = { ...value.projects[0], taxonomy: { version: "1", codes: Array.from({ length: 513 }, (_, i) => ({ code: `c${i}`, label: "C" })) } };
    expect(channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [codes] } } } })).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/taxonomy/codes: maxItems (at most 512 items)"] });
    const noTexts = { ...value.projects[0], channels: [{ ...value.projects[0].channels[0], texts: 5 }] };
    expect(channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [noTexts] } } } })).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/channels/0/texts: type (object)"] });
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
      expect(view.reported && view.errors.some((error) => error.startsWith(`FAC-SEM-162 at /projects/0/channels/0/texts/holding/*: ${keyword}`))).toBe(true);
      expect(JSON.stringify(view)).not.toMatch(/[0-9]{7}/);
    }
    const final = { ...p0.channels[0], texts: { holding: p0.channels[0].texts.holding, final: { [digits]: "" } } };
    const late = channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [final, p0.channels[1]] }] } } } });
    expect(late.reported && late.errors).toContain("FAC-SEM-162 at /projects/0/channels/0/texts/final/*: minLength (at least 1 code point)");
    // Places the schema never reports today, read the same way: a number after no declared array, an undeclared name.
    expect(placed({ keyword: "type", instancePath: `/projects/0/sources/0/${digits}/x~1y/3` })).toBe("type at /projects/0/sources/0/*/*/*");
    const extra = channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, [digits]: { [digits]: 1 } }] } } } });
    expect(extra.reported && extra.errors).toEqual(["FAC-SEM-162 at /projects/0: maxProperties (more members than the schema declares)"]);
    const long = `en${"-abcdefgh".repeat(9)}`;
    const longChannel = { ...p0.channels[0], texts: { holding: { [long]: "Checking." }, final: p0.channels[0].texts.final } };
    const longView = channelAgentView({ provider: { extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [longChannel, p0.channels[1]] }] } } } });
    expect(longView.reported && longView.errors).toEqual(["FAC-SEM-162 at /projects/0/channels/0/texts/holding: maxLength (at most 35 code points)", "FAC-SEM-162 at /projects/0/channels/0/texts/holding: propertyNames"]);
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
    expect(channelAgentView({ extensions: { [KEY]: "x".repeat(5000) } }, "well-known")).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /: maxLength (at most 4096 code points)"] });
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
      expect(channelAgentView({ extensions: { [KEY]: declared } }, "well-known"), place).toEqual({ declared: false, reported: true, errors: [`FAC-SEM-162 at ${place}: maxProperties (more members than the schema declares)`, "FAC-SEM-165 at /"] });
    }
  });
  it("reads at most SECRET_BUDGET code points for credentials, then says the rest was not read, in little time", () => {
    const opening = ["e", "y", "J"].join("");
    const strings = Array.from({ length: 488 }, () => opening.repeat(1366).slice(0, 4096));
    const timed = () => channelAgentRules({ extensions: { [KEY]: { ...value, extra: strings } } }, "well-known");
    expect(least(timed)).toBeLessThan(2 * proseBaseline() + 20);
    const found = timed();
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => [f.instancePath, f.message.includes(`more than ${SECRET_BUDGET}`)])).toEqual([[CHANNEL_AGENT_PATHS["well-known"], true]]);
  });
  it("counts what the detector reads: a string once, and again after each eyJ to the end of its run", () => {
    expect(detectorCost("")).toBe(0);
    expect(detectorCost("plain text")).toBe(10);
    expect(detectorCost("eyJab.cd")).toBe(8 + 8);
    expect(detectorCost("x eyJeyJ y")).toBe(10 + 6 + 3);
    expect(detectorCost("eyJ".repeat(1000))).toBeGreaterThan(SECRET_BUDGET);
  });
  it("counts the square of an upper-case run after ?, & or # as read, so a query name cannot slow the detector", () => {
    // Not a URL: the query terms are not counted, since the detector reads no query in it.
    expect(detectorCost("a?BC=x")).toBe(6);
    expect(detectorCost("https://a.example/?aBC=x")).toBe(24 + PIECE_COST + 3 + 1 + 6);
    expect(detectorCost("https://a.example/#&?")).toBe(20 + PIECE_COST + 1);
    const strings = Array.from({ length: 245 }, () => `https://a.example/?${"Q".repeat(4060)}=x`);
    const timed = () => channelAgentRules({ extensions: { [KEY]: { ...value, extra: strings } } }, "well-known");
    expect(least(timed)).toBeLessThan(2 * proseBaseline() + 20);
    const found = timed();
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.message.includes("was not read"))).toEqual([true]);
  });
  it("shares one reading budget across every copy of the declaration in a manifest", () => {
    const opening = ["e", "y", "J"].join("");
    const heavy = { ...value, extra: Array.from({ length: 300 }, () => opening.repeat(1366).slice(0, 4096)) };
    const manifest = { provider: { extensions: { [KEY]: value } }, extensions: { [KEY]: heavy }, capabilities: [0, 1, 2].map(() => ({ extensions: { [KEY]: heavy } })) };
    const timed = () => channelAgentRules(manifest);
    expect(least(timed)).toBeLessThan(2 * proseBaseline() + 20);
    const found = timed();
    expect(found.filter((f) => f.code === "FAC-SEM-162").length).toBe(4);
  });
  it("finds a channel id the shared detector reads as a credential", () => {
    const id = "sk-support-desk-faq-answers-2026-v2";
    expect(id.length - "sk-".length).toBeGreaterThanOrEqual(32);
    const channel = { ...value.projects[0].channels[0], id };
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], channels: [channel, value.projects[0].channels[1]] }] } } }, "well-known");
    // A valid id: exactly one finding, FAC-SEM-165 at the channel id, and no FAC-SEM-162.
    expect(found.map((f) => `${f.code} ${f.instancePath}`)).toEqual([`FAC-SEM-165 ${CHANNEL_AGENT_PATHS["well-known"]}/projects/0/channels/0/id`]);
  });
  it("names the schema's allowed values beside an enum, a const or a pattern place, never the instance's", () => {
    const route = { ...value.projects[0].question_route, capability: "support.ask" };
    const view = channelAgentView({ extensions: { [KEY]: { ...value, standard: "channel-agent-standard/2", projects: [{ ...value.projects[0], side: "Side", question_route: route }] } } }, "well-known");
    expect(view.reported && view.errors).toEqual(expect.arrayContaining(["FAC-SEM-162 at /standard: const (channel-agent-standard/1)", "FAC-SEM-162 at /projects/0/question_route/capability: enum (one of team.ask, operator.ask)", "FAC-SEM-162 at /projects/0/side: pattern (pattern ^(?![a-z0-9-]*[0-9]{7})[a-z0-9-]{1,32}$)"]));
    expect(JSON.stringify(view)).not.toMatch(/support\.ask|Side"|\/2/);
  });
  it("counts every query or fragment name with an upper-case letter or a %, wherever the run starts", () => {
    const n = 1000;
    const square = (n * (n + 1)) / 2;
    expect(detectorCost(`https://a.example/?a${"Q".repeat(n)}=x`)).toBeGreaterThanOrEqual(square);
    expect(detectorCost(`https://a.example/?${"%41".repeat(n)}=x`)).toBeGreaterThanOrEqual(square);
    expect(detectorCost(`https://a.example/#a${"Q".repeat(n)}=x`)).toBeGreaterThanOrEqual(square);
    expect(detectorCost("https://a.example/?q=a%20b")).toBe(26 + PIECE_COST + 1 + 3);
    // A value that does not decode (a lone %) is read raw.
    expect(detectorCost("https://a.example/?q=a%zz")).toBe(25 + PIECE_COST + 1 + 4);
    const shapes = [`https://a.example/?a${"Q".repeat(4000)}=x`, `https://a.example/?${"%41".repeat(1350)}=x`, `https://a.example/#a${"Q".repeat(4000)}=x`];
    const extra = shapes.flatMap((shape) => Array.from({ length: 300 }, () => shape));
    const timed = () => channelAgentRules({ provider: { extensions: { [KEY]: { ...value, extra } } } });
    expect(least(timed)).toBeLessThan(2 * proseBaseline() + 20);
  });
  it("charges up to 255 after every sk- at a boundary, so a run of them is not read past the budget", () => {
    const text = "-sk".repeat(1366).slice(0, 4096);
    const boundaries = (text.match(/-sk-/g) ?? []).length;
    expect(detectorCost(text)).toBeGreaterThanOrEqual(text.length + boundaries * 255);
    expect(detectorCost("xsk-a")).toBe(5);
    expect(detectorCost("%2Fsk-a")).toBe(7 + 4);
    expect(detectorCost("\\nsk-a")).toBe(6 + 4);
    const doc = { extensions: { [KEY]: { ...value, extra: Array.from({ length: 246 }, () => text) } } };
    const timed = () => channelAgentRules(doc, "well-known");
    expect(least(timed)).toBeLessThan(2 * proseBaseline() + 20);
    const found = timed();
    expect(found.some((f) => f.message.includes("was not read"))).toBe(true);
  });
  it("charges each name or string its call, so two million empty strings are not read past the budget", () => {
    expect(VISIT_COST).toBe(16);
    const doc = { extensions: { [KEY]: { ...value, extra: Array(2_000_000).fill("") } } };
    const timed = () => channelAgentRules(doc, "well-known");
    expect(least(timed)).toBeLessThan(5 * proseBaseline() + 20);
    const found = timed();
    expect(found.filter((f) => f.message.includes("was not read")).length).toBe(1);
  });
  it("says the rest was not read once per document, however many copies of the declaration it holds", () => {
    const opening = ["e", "y", "J"].join("");
    const heavy = { ...value, extra: [opening.repeat(1366).slice(0, 4096)] };
    const manifest = { provider: {}, capabilities: Array.from({ length: 1000 }, () => ({ extensions: { [KEY]: heavy } })) };
    const found = channelAgentRules(manifest);
    expect(found.filter((f) => f.message.includes("was not read")).length).toBe(1);
    expect(found.filter((f) => f.code === "FAC-SEM-162").length).toBe(1000);
  });
  it("keeps FAC-SEM-162's message short when every project fails", () => {
    const broken = { ...value.projects[0], side: "Bad Side", channels: [{ ...value.projects[0].channels[0], final_limit: "P1M", kind: "sms" }] };
    const [finding] = channelAgentRules({ extensions: { [KEY]: { ...value, projects: Array.from({ length: 64 }, () => broken) } } }, "well-known").filter((f) => f.code === "FAC-SEM-162");
    expect(finding?.message.length).toBeLessThan(1500);
    expect(finding?.message).toContain("(pattern as above)");
    // At most eight enum values are named, the rest counted; a pattern is cut to 80 characters.
    expect(placed({ keyword: "enum", instancePath: "/projects/0/channels/0/kind", params: { allowedValues: Array.from({ length: 10 }, (_, i) => `k${i}`) } })).toBe("enum at /projects/0/channels/0/kind (one of k0, k1, k2, k3, k4, k5, k6, k7 and 2 more)");
    expect(placed({ keyword: "pattern", instancePath: "/projects/0/side", params: { pattern: "x".repeat(100) } })).toBe(`pattern at /projects/0/side (pattern ${"x".repeat(80)}\u2026)`);
  });
  it("counts the JWT shape's second segment after a dot", () => {
    expect(detectorCost(`${"eyJ".repeat(52)}.${"a".repeat(3940)}`)).toBeGreaterThanOrEqual(52 * 3940);
    expect(detectorCost("https://a.example/?q=%65yJ%2Eab")).toBeGreaterThanOrEqual(29 + PIECE_COST + 7 + 6);
  });
  it("counts an sk- after each escape a provider-key reading takes for a boundary", () => {
    const kinds = ["%41", "%2541", "\\x41", "\\u0041", "\\12", "\\123", "\\n", "\u001b[31m", "\\x1b[31m", "\\033[1;31m", "\\u001b[0m", "\\e[31m"];
    for (const escape of kinds) {
      const text = `${escape}sk-${"a".repeat(260)}`.repeat(5);
      expect(detectorCost(text), escape).toBeGreaterThanOrEqual(text.length + 5 * 255);
    }
    expect(detectorCost(`a1sk-${"a".repeat(300)}`)).toBe(305);
  });
  it("reads a query of many pieces about as fast as prose of the same size", () => {
    const query = `https://a.example/?${"a=b&".repeat(1100)}`.slice(0, 4096);
    const prose = "the quick brown fox jumps over the lazy dog ".repeat(100).slice(0, 4096);
    // The test thread's own processor time, so another file's work does not count.
    const thread = (process as unknown as { threadCpuUsage?: (previous?: NodeJS.CpuUsage) => NodeJS.CpuUsage }).threadCpuUsage;
    const clock = (previous?: NodeJS.CpuUsage): NodeJS.CpuUsage => (thread === undefined ? process.cpuUsage(previous) : thread.call(process, previous));
    const time = (text: string) => {
      const started = clock();
      channelAgentRules({ extensions: { [KEY]: { ...value, extra: Array.from({ length: 300 }, () => text) } } }, "well-known");
      const spent = clock(started);
      return (spent.user + spent.system) / 1000;
    };
    time(prose);
    time(query);
    const baseline = Math.min(time(prose), time(prose), time(prose));
    expect(Math.min(time(query), time(query), time(query))).toBeLessThan(2 * baseline + 20);
  });
  it("charges a member's name once, so the budget's edge falls where the count says", () => {
    const bearer = ["Bearer", "z".repeat(24)].join(" ");
    const fixed = VISIT_COST + "last".length + VISIT_COST + bearer.length;
    const each = VISIT_COST + 6;
    const under = Math.floor((SECRET_BUDGET - fixed) / each);
    const declaration = (n: number) => {
      const members: Json = {};
      for (let i = 0; i < n; i += 1) members[`n${String(i).padStart(5, "0")}`] = [];
      members.last = [bearer];
      return members;
    };
    const at = (n: number) => channelAgentRules({ extensions: { [KEY]: declaration(n) } }, "well-known").filter((f) => f.code === "FAC-SEM-165");
    expect(at(under).map((f) => [f.instancePath, f.message.includes("was not read")])).toEqual([[`${CHANNEL_AGENT_PATHS["well-known"]}/*/*`, false]]);
    expect(at(under + 1).map((f) => f.message.includes("was not read"))).toEqual([true]);
  });
  it("counts the URL terms on the names and values a WHATWG URL parse yields", () => {
    const tab = `https://a.example/?q=${"ey\tJ".repeat(1000)}`;
    expect(detectorCost(tab)).toBeGreaterThanOrEqual(1_500_000);
    const sk = `https://a.example/?q=${"-%73k-".repeat(600)}`;
    expect(detectorCost(sk)).toBeGreaterThanOrEqual(sk.length + 500 * 255);
    const thread = (process as unknown as { threadCpuUsage?: (previous?: NodeJS.CpuUsage) => NodeJS.CpuUsage }).threadCpuUsage;
    const clock = (previous?: NodeJS.CpuUsage): NodeJS.CpuUsage => (thread === undefined ? process.cpuUsage(previous) : thread.call(process, previous));
    const time = (text: string) => {
      const started = clock();
      channelAgentRules({ extensions: { [KEY]: { ...value, extra: Array.from({ length: 300 }, () => text) } } }, "well-known");
      const spent = clock(started);
      return (spent.user + spent.system) / 1000;
    };
    const prose = "the quick brown fox jumps over the lazy dog ".repeat(100).slice(0, 4096);
    const shapes = [tab.slice(0, 4096), `https://a.example/#q=${"ey\rJ".repeat(1000)}`.slice(0, 4096), `https://a.example/#q=${"ey\nJ".repeat(1000)}`.slice(0, 4096), sk.slice(0, 4096)];
    time(prose);
    const baseline = Math.min(time(prose), time(prose), time(prose));
    for (const shape of shapes) {
      time(shape);
      expect(Math.min(time(shape), time(shape), time(shape)), JSON.stringify(shape.slice(0, 30))).toBeLessThan(2 * baseline + 20);
    }
  });
  it("counts code points, not UTF-16 units, so astral text is not read past the budget early", () => {
    const astral = "\u{1F600}".repeat(2000);
    expect(detectorCost(astral)).toBe(2000);
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, extra: Array.from({ length: 300 }, () => astral) } } }, "well-known");
    expect(found.some((f) => f.message.includes("was not read"))).toBe(false);
  });
  it("finds sk- in any case and colour sequences of any length, in either case of their hex digits", () => {
    const tail = "a".repeat(300);
    for (const before of ["-SK-", "\\x1B[31m", "\\u001B[31m", "\u001b[1;2;3;4;5;6;7;8;9;10;11;12m", "\\x1b[38;5;196;48;5;21;1;4m"]) {
      const text = before.toLowerCase().endsWith("sk-") ? `${before}${tail}` : `${before}sk-${tail}`;
      expect(detectorCost(text), before).toBeGreaterThanOrEqual(text.length + 255);
    }
  });
  it("names the schema's limit beside a length, a count, a bound or a format", () => {
    expect(placed({ keyword: "maxItems", instancePath: "/projects", params: { limit: 64 } })).toBe("maxItems at /projects (at most 64 items)");
    expect(placed({ keyword: "maxProperties", instancePath: "/projects/0/channels/0/texts/holding", params: { limit: 1 } })).toBe("maxProperties at /projects/0/channels/0/texts/holding (at most 1 member)");
    expect(placed({ keyword: "minProperties", instancePath: "/projects/0/channels/0/texts/holding", params: { limit: 1 } })).toBe("minProperties at /projects/0/channels/0/texts/holding (at least 1 member)");
    expect(placed({ keyword: "uniqueItems", instancePath: "/projects", params: { limit: 1 } })).toBe("uniqueItems at /projects");
    expect(codePoints("\uD83Da")).toBe(2);
    const p0 = value.projects[0];
    const broken = { ...p0, adopted_at: "2026-13-45", taxonomy: { version: "1", codes: [{ code: "a", label: "x".repeat(121) }] }, question_route: { ...p0.question_route, daily_cap: 0 }, sources: [] };
    const view = channelAgentView({ extensions: { [KEY]: { ...value, projects: [broken] } } }, "well-known");
    expect(view.reported && view.errors).toEqual(expect.arrayContaining(["FAC-SEM-162 at /projects/0/taxonomy/codes/0/label: maxLength (at most 120 code points)", "FAC-SEM-162 at /projects/0/question_route/daily_cap: minimum (>= 1)", "FAC-SEM-162 at /projects/0/sources: minItems (at least 1 item)", "FAC-SEM-162 at /projects/0/adopted_at: format (format date)"]));
    const high = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, question_route: { ...p0.question_route, daily_cap: 1001 } }] } } }, "well-known");
    expect(high.reported && high.errors).toEqual(["FAC-SEM-162 at /projects/0/question_route/daily_cap: maximum (<= 1000)"]);
  });
  it("reads a valid declaration as a reader does: a credential or a repeated id is not declared, an obligation is shown", () => {
    const p0 = value.projects[0];
    const key = ["sk", "-", "Q7r2".repeat(5)].join("");
    const withKey = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, taxonomy: { version: "1", codes: [{ code: "a", label: key }] } }] } } }, "well-known");
    expect(withKey).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-165 at /projects/0/taxonomy/codes/0/label"] });
    expect(JSON.stringify(withKey)).not.toContain(key);
    const twice = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [p0.channels[0], p0.channels[1], p0.channels[0]] }] } } }, "well-known");
    expect(twice).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-163 at /projects/0/channels/2/id"] });
    const repeated = channelAgentView({ extensions: { [KEY]: { ...value, projects: [p0, p0] } } }, "well-known");
    expect(repeated.reported && repeated.errors).toEqual(["FAC-SEM-163 at /projects/1/project"]);
    const owed = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, handoff_queues: [{ id: "owner-dm", owner: "owner", limit: "P2D", answered_signal: "none" }] }] } } }, "well-known");
    expect(owed).toMatchObject({ declared: true, obligations: ["FAC-SEM-164 at /projects/0/handoff_queues/0/recommendation"] });
    const opening = ["e", "y", "J"].join("");
    const read = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, taxonomy: { version: "1", codes: [{ code: "a", label: opening.repeat(40) }] } }] } } }, "well-known");
    expect(read.declared).toBe(true);
    const heavy = { ...p0.channels[0], texts: { holding: { en: opening.repeat(1365) }, final: p0.channels[0].texts.final } };
    const unread = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [heavy, p0.channels[1]] }] } } }, "well-known");
    expect(unread).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-165 at /"] });
  });
  it("reads a string as a URL only when its head, tab and line breaks removed, is ASCII with no high escape and opens with a scheme", () => {
    expect(readAsUrl("https://a.example/?q=1")).toBe(true);
    expect(readAsUrl("mailto:someone")).toBe(true);
    expect(readAsUrl("https://a.example")).toBe(true);
    expect(readAsUrl("https://h\u00e9.example/x")).toBe(false);
    expect(readAsUrl("https://a.example/\u00e9")).toBe(false);
    expect(readAsUrl("a.example/?q=1")).toBe(false);
    expect(readAsUrl(" https://a.example/")).toBe(false);
    expect(readAsUrl("x")).toBe(false);
    expect(readAsUrl("ht\ttps://a.example/")).toBe(true);
    expect(readAsUrl("https://a.example/%41")).toBe(true);
    expect(readAsUrl("https://a.example/%c3%a9")).toBe(false);
    expect(readAsUrl("https://a.example/%7f%80")).toBe(false);
    expect(readAsUrl(`https://a.example/${"a".repeat(4100)}\u00e9`)).toBe(true);
    const cjk = Array.from({ length: 4080 }, (_, i) => String.fromCodePoint(0x4e00 + i)).join("");
    const host = `http://${cjk}/`;
    expect(readAsUrl(host)).toBe(false);
    expect(detectorCost(host)).toBe(4088);
    // A scheme that does not parse (an invalid port) is read by the other shapes only.
    expect(detectorCost("http://a.example:99999/?q=a")).toBe(27);
    const thread = (process as unknown as { threadCpuUsage?: (previous?: NodeJS.CpuUsage) => NodeJS.CpuUsage }).threadCpuUsage;
    const clock = (previous?: NodeJS.CpuUsage): NodeJS.CpuUsage => (thread === undefined ? process.cpuUsage(previous) : thread.call(process, previous));
    const time = (text: string) => {
      const started = clock();
      channelAgentRules({ extensions: { [KEY]: { ...value, extra: Array.from({ length: 300 }, () => text) } } }, "well-known");
      const spent = clock(started);
      return (spent.user + spent.system) / 1000;
    };
    const prose = "the quick brown fox jumps over the lazy dog ".repeat(100).slice(0, 4096);
    time(prose);
    const baseline = Math.min(time(prose), time(prose), time(prose));
    // A special scheme takes a host without `//`, and a percent-escaped host is decoded before host processing: none is parsed.
    const wide = Array.from({ length: 4091 }, (_, i) => String.fromCodePoint(0x4e00 + i)).join("");
    const special = ["http:", "http:/", "http:\\\\", "https:/\t/", "HTTP:", "ws:"].map((scheme) => `${scheme}${wide}`);
    const escaped = `http://a.${Array.from({ length: 453 }, (_, i) => encodeURIComponent(String.fromCodePoint(0x4e00 + i))).join("")}`;
    for (const text of [...special, escaped]) expect(readAsUrl(text), text.slice(0, 9)).toBe(false);
    for (const text of [host, "x", ...special, escaped]) {
      time(text);
      expect(Math.min(time(text), time(text), time(text)), text.slice(0, 12)).toBeLessThan(2 * baseline + 20);
    }
  });
  it("answers no key as connectionsView does: not declared and not reported", () => {
    expect(channelAgentView({ extensions: {} }, "well-known")).toEqual({ declared: false, reported: false });
    expect(channelAgentView(valid)).toMatchObject({ declared: true, reported: false, obligations: [] });
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
    expect(channelAgentView({ extensions: { [KEY]: { ...value, ...wide } } }, "well-known")).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /: maxProperties (more members than the schema declares)", "FAC-SEM-165 at /"] });
    const long = channelAgentRules({ extensions: { [KEY]: { ...value, extra: Array(200_000).fill(1) } } }, "well-known");
    expect(long.map((f) => f.code)).toEqual(["FAC-SEM-162"]);
    const channel = { ...value.projects[0].channels[0], extra: 1 };
    expect(channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], channels: [channel] }] } } }, "well-known")).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/channels/0: maxProperties (more members than the schema declares)"] });
  });
  it("counts the digits of a name with its hyphens and underscores left out", () => {
    const bearer = ["Bearer", "v".repeat(24)].join(" ");
    const name = ["491", "511", "234", "5678"].join("-");
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, extra: { [name]: bearer } } } }, "well-known");
    expect(found.filter((f) => f.code === "FAC-SEM-165").map((f) => f.instancePath)).toEqual([`${CHANNEL_AGENT_PATHS["well-known"]}/*`]);
  });
  it("reads a time zone of one segment or Area/Location", () => {
    const zone = createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-channel-agent-extension.schema.json#/$defs/questionRoute/properties/tz`);
    for (const ok of ["UTC", "GMT", "CET", "Etc/UTC", "Europe/Warsaw", "America/Argentina/Buenos_Aires", "Etc/GMT+3"]) expect(zone?.(ok), ok).toBe(true);
    for (const bad of ["", "Europe/", "/UTC", "a/b/c/d", "Europe Warsaw", "+03:00"]) expect(zone?.(bad), bad).toBe(false);
  });
  it("points the narrowings at the grammar, whose every line is this contract's", () => {
    const page = read("docs/specification/channel-agent.md");
    const section = page.slice(page.indexOf("### Narrowings against the standard"), page.indexOf("The first consumer is owed"));
    expect(section).toContain("](#grammar)");
    expect(page).toContain("### Grammar");
    expect(section).toContain("1 000 000");
  });
  it("names the expected type alone, and a nullable member's types and null on its oneOf line", () => {
    const p0 = value.projects[0];
    const broken = { ...p0, evals: { ...p0.evals, spend_record: "Support" }, channels: [{ ...p0.channels[0], holding_reply: "yes" }, p0.channels[1]] };
    const view = channelAgentView({ extensions: { [KEY]: { ...value, projects: [broken] } } }, "well-known");
    expect(view).toEqual({ declared: false, reported: true, errors: [
      "FAC-SEM-162 at /projects/0/channels/0/holding_reply: type (boolean)",
      "FAC-SEM-162 at /projects/0/evals/spend_record: pattern (pattern ^[a-z0-9][a-z0-9._:-]{0,63}$)",
      "FAC-SEM-162 at /projects/0/evals/spend_record: oneOf (a string or null)"
    ] });
    expect(JSON.stringify(view)).not.toContain("not null");
    expect(JSON.stringify(view)).not.toContain("(null)");
    const message = channelAgentRules({ extensions: { [KEY]: { ...value, projects: [broken] } } }, "well-known")[0]?.message ?? "";
    expect(message).toContain("type at /projects/0/channels/0/holding_reply (boolean)");
    expect(message).not.toContain("null, not null");
    expect(placed({ keyword: "oneOf", instancePath: "/projects/0/evals/spend_record", schema: [{ type: "object" }, { type: "null" }] })).toBe("oneOf at /projects/0/evals/spend_record (an object or null)");
    expect(placed({ keyword: "oneOf", instancePath: "/projects/0/evals/spend_record", schema: [{ type: "string" }, { type: "integer" }] })).toBe("oneOf at /projects/0/evals/spend_record");
    expect(placed({ keyword: "oneOf", instancePath: "/projects/0/evals/spend_record", schema: [{ $ref: "#/$defs/nowhere" }, { type: "null" }] })).toBe("oneOf at /projects/0/evals/spend_record");
    expect(placed({ keyword: "oneOf", instancePath: "/projects/0/evals/spend_record", schema: [1, { type: "null" }] })).toBe("oneOf at /projects/0/evals/spend_record");
    expect(placed({ keyword: "oneOf", instancePath: "/projects/0/evals/spend_record" })).toBe("oneOf at /projects/0/evals/spend_record");
    expect(placed({ keyword: "oneOf", instancePath: "/projects/0/evals/spend_record", schema: [{}, { type: "null" }] })).toBe("oneOf at /projects/0/evals/spend_record");
    expect(schemaLine(TOO_LARGE)).toBe(`FAC-SEM-162 at /: ${TOO_LARGE}`);
    expect(schemaLine("maxItems at /projects (at most 64 items)")).toBe("FAC-SEM-162 at /projects: maxItems (at most 64 items)");
  });
  it("names the rule and the place on every line of the view: an invalid declaration's schema and credential places, and a misplaced copy", () => {
    const opening = ["e", "y", "J"].join("");
    const label = `${opening}${"a".repeat(20)}.${opening}${"b".repeat(20)}.${"c".repeat(20)}`;
    const p0 = value.projects[0];
    const broken = { ...p0, side: "Side", taxonomy: { ...p0.taxonomy, codes: [{ ...p0.taxonomy.codes[0], label }] } };
    expect(channelAgentView({ extensions: { [KEY]: { ...value, projects: [broken] } } }, "well-known")).toEqual({ declared: false, reported: true, errors: [
      "FAC-SEM-162 at /projects/0/side: pattern (pattern ^(?![a-z0-9-]*[0-9]{7})[a-z0-9-]{1,32}$)",
      "FAC-SEM-165 at /projects/0/taxonomy/codes/0/label"
    ] });
    const misplaced = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, taxonomy: { ...p0.taxonomy, codes: [{ ...p0.taxonomy.codes[0], label }] } }] } } });
    expect(misplaced).toEqual({ declared: false, reported: true, errors: [`FAC-SEM-162 at /extensions/${KEY.replace(/\//g, "~1")}`, `FAC-SEM-165 at /extensions/${KEY.replace(/\//g, "~1")}/projects/0/taxonomy/codes/0/label`] });
    expect(channelAgentView({ extensions: {} })).toEqual({ declared: false, reported: false });
    expect(channelAgentView("x")).toEqual({ declared: false, reported: false });
    expect(channelAgentView({ extensions: { [KEY]: "x".repeat(5000) } }, "well-known")).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /: maxLength (at most 4096 code points)"] });
  });
  it("names at most SECRET_FINDINGS places for FAC-SEM-164 and counts the rest, in the rules and the view", () => {
    const p0 = value.projects[0];
    const blank = (count: number) => Object.fromEntries(Array.from({ length: count }, (_, i) => [`en-x${i}`, " "]));
    const channel = { ...p0.channels[0], texts: { holding: blank(40), final: blank(30) } };
    const doc = { extensions: { [KEY]: { ...value, projects: [{ ...p0, channels: [channel, p0.channels[1]] }] } } };
    const found = channelAgentRules(doc, "well-known").filter((f) => f.code === "FAC-SEM-164");
    expect(found).toHaveLength(SECRET_FINDINGS + 1);
    expect(found[SECRET_FINDINGS]).toMatchObject({ instancePath: CHANNEL_AGENT_PATHS["well-known"], message: expect.stringContaining("and 6 more places") });
    const view = channelAgentView(doc, "well-known");
    expect(view.declared && view.obligations).toHaveLength(SECRET_FINDINGS + 1);
    expect(view.declared && view.obligations.at(-1)).toBe("FAC-SEM-164 at /");
  });
  it("takes the standard's none form at its four members, read and named as the schema says", () => {
    const p0 = value.projects[0];
    const replying = p0.channels.find((channel: Json) => channel.replies_enabled === true);
    const formed = { ...p0, question_route: { none: "not_yet", until: "2027-01-15" }, gap_registry: { none: "not_used" }, tickets: { ...p0.tickets, pd_check: { none: "not_used" } }, channels: p0.channels.map((channel: Json) => (channel === replying ? { ...channel, texts: { ...channel.texts, final: { none: "not_used" } } } : channel)) };
    const view = channelAgentView({ extensions: { [KEY]: { ...value, projects: [formed] } } }, "well-known");
    expect(view.declared && view.obligations).toEqual([]);
    const late = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, gap_registry: { none: "not_used", until: "2027-01-15" } }] } } }, "well-known");
    expect(late).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/gap_registry: not (no until here)"] });
    const wide = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, gap_registry: { none: "not_used", until: "2027-01-15", a: 1 } }] } } }, "well-known");
    expect(wide).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/gap_registry: maxProperties (more members than the schema declares)"] });
    const missing = channelAgentView({ extensions: { [KEY]: { ...value, projects: [{ ...p0, question_route: { none: "not_yet" } }] } } }, "well-known");
    expect(missing).toEqual({ declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/question_route: required (until)"] });
  });
  it("reads no value once its member's name has spent the budget", () => {
    const names = Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`k${i}${"a".repeat(4000)}`, "v"]));
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, extra: names } } }, "well-known");
    expect(found.filter((f) => f.message.includes("was not read"))).toHaveLength(1);
  });
  it("tells the author of an id that starts with sk- to rename it", () => {
    const id = "sk-support-desk-faq-answers-2026-v2";
    const channel = { ...value.projects[0].channels[0], id };
    const found = channelAgentRules({ extensions: { [KEY]: { ...value, projects: [{ ...value.projects[0], channels: [channel, value.projects[0].channels[1]] }] } } }, "well-known");
    expect(found[0]?.message).toContain("an id that starts with sk- is read as a key; rename it");
    expect(found[0]?.message).not.toContain(id);
  });
  it("states every limit of the schema in the page's grammar, so the two cannot drift", () => {
    const page = read("docs/specification/channel-agent.md");
    const section = page.slice(page.indexOf("## The declaration"), page.indexOf("## What is checked"));
    const lines = new Map(section.split("\n").filter((line) => line.startsWith("- `")).map((line) => [line.slice(3, line.indexOf("`", 3)), line]));
    const defs = schema.$defs as Json;
    // A member that also takes the none form is read through its `else`, the member itself; the form has its own line.
    const resolve = (node: Json): Json => (typeof node.$ref === "string" ? resolve(defs[node.$ref.split("/").pop() as string] as Json) : node.else !== undefined && node.properties === undefined ? resolve(node.else as Json) : node);
    let checked = 0;
    const walk = (node: Json, at: string) => {
      const here = resolve(node);
      const forms = Array.isArray(here.oneOf) ? (here.oneOf as Json[]).map(resolve) : [here];
      if (at !== "") {
        const line = lines.get(at);
        expect(line, at).toBeDefined();
        for (const form of forms) {
          for (const limit of ["pattern", "minLength", "maxLength", "minItems", "maxItems", "minimum", "maximum", "minProperties", "maxProperties"]) {
            if (form[limit] !== undefined) {
              expect(line, `${at} ${limit}`).toContain(String(form[limit]));
              checked += 1;
            }
          }
          for (const inner of [form.propertyNames, form.additionalProperties]) {
            if (inner && typeof inner === "object") for (const limit of ["pattern", "minLength", "maxLength"]) if ((inner as Json)[limit] !== undefined) expect(line, `${at} ${limit}`).toContain(String((inner as Json)[limit]));
          }
          if (Array.isArray(form.enum)) for (const allowed of form.enum) expect(line, at).toContain(`\`${String(allowed)}\``);
        }
      }
      for (const [name, member] of Object.entries((here.properties ?? {}) as Json)) walk(member as Json, at === "" ? name : `${at}.${name}`);
      if (here.items !== undefined) walk(here.items as Json, `${at}[]`);
    };
    walk(schema, "");
    expect(checked).toBeGreaterThan(60);
    const none = lines.get("none");
    expect(none).toBeDefined();
    for (const allowed of (defs.none as Json).properties.none.enum as string[]) expect(none).toContain(`\`${allowed}\``);
    for (const member of ["projects[].question_route", "projects[].gap_registry", "projects[].tickets.pd_check", "projects[].channels[].texts.final"]) expect(lines.get(member), member).toContain("none form");
  });
  it("keeps the patterns it repeats from the schemas they come from", () => {
    const other = (file: string) => JSON.parse(read(`schemas/${file}`)) as Json;
    const defs = schema.$defs as Json;
    expect(defs.project.properties.evals.properties.spend_record.oneOf[0].pattern).toBe(other("service-usage.schema.json").$defs.limit.properties.id.pattern);
    expect(defs.questionRoute.properties.target.pattern).toBe(other("comms-common.schema.json").$defs.projectId.pattern);
    expect(defs.gapRegistry.properties.capability.pattern).toBe(other("common.schema.json").$defs.capabilityName.pattern);
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
    for (const ok of ["evals/support", "ticket_outbox", "a..b/c", "tickets/db:main"]) expect(relative?.(ok), ok).toBe(true);
    for (const bad of ["/abs", "~/x", "C:/x", "file:///srv/outbox", "db:/srv/tickets", "db:tickets", "a+b.c-d:x", "../x", "a/../b", "a/..", "a b", "a\\b", ""]) expect(relative?.(bad), bad).toBe(false);
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
