import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const provider = (id: string, revision = 1) => ({ id, revision, contentHash: `sha256:${revision.toString(16).padStart(64, "0")}` });
const candidate = (runnerKind: string, session: Record<string, string> = { attach: "preferred", spawn: "allowed" }, id = `urn:fabric:provider:${runnerKind}-local`) =>
  ({ runnerKind, provider: provider(id), session });
const route = (candidates: unknown[]) => ({ kind: "runner-route", project: "urn:project:a", capability: "urn:fabric:capability:agent-chat", candidates });
const fixture = async (name: string) => JSON.parse(await readFile(path.join(projectRoot(), "fixtures", name), "utf8")) as Record<string, unknown>;
const clone = <T>(value: T): T => structuredClone(value);

describe("runner-route semantic rules (DEC-0026)", () => {
  it("FAC-SEM-028 flags a runner kind that appears twice", () => {
    expect(codes("runner-route", route([candidate("claude-code"), candidate("codex"), candidate("claude-code")]))).toContain("FAC-SEM-028");
  });

  it("FAC-SEM-028 accepts distinct kinds in preference order", () => {
    expect(codes("runner-route", route([candidate("claude-code"), candidate("codex"), candidate("hermes")]))).toEqual([]);
  });

  it("FAC-SEM-029 flags a candidate that can neither attach nor spawn", () => {
    expect(codes("runner-route", route([candidate("claude-code", { attach: "never", spawn: "never" })]))).toContain("FAC-SEM-029");
    expect(codes("runner-route", route([candidate("claude-code", { attach: "never", spawn: "allowed" })]))).toEqual([]);
  });

  it("the operator's scenario fixture passes: a held Claude Code session first, then Hermes starts", async () => {
    expect(codes("runner-route", await fixture("positive/runner-route.json"))).toEqual([]);
  });
});

describe("route-bundle semantic rules (DEC-0026, DEC-0029)", () => {
  const capability = "urn:fabric:capability:agent-chat";
  const admitted = (ref: ReturnType<typeof provider>, overrides: Record<string, unknown> = {}) => ({ provider: ref, capability, state: "admitted", ...overrides });
  const admissions = [admitted(provider("urn:fabric:provider:claude-code-local")), admitted(provider("urn:fabric:provider:hermes-local"))];

  it("FAC-SEM-030 flags a candidate whose provider revision is not admitted", () => {
    const bundle = (candidates: unknown[]) => ({ route: route(candidates), admissions: admissions.slice(0, 1) });
    expect(codes("route-bundle", bundle([candidate("claude-code"), candidate("hermes")]))).toContain("FAC-SEM-030");
    expect(codes("route-bundle", bundle([candidate("claude-code")]))).toEqual([]);
  });

  it("FAC-SEM-030 matches the admitted revision, not just the provider id", () => {
    const later = [admitted(provider("urn:fabric:provider:claude-code-local", 2))];
    expect(codes("route-bundle", { route: route([candidate("claude-code")]), admissions: later })).toContain("FAC-SEM-030");
  });

  it("FAC-SEM-030 compares the content hash: same id and number, other bytes, is another revision", () => {
    const forged = [admitted({ ...provider("urn:fabric:provider:claude-code-local"), contentHash: `sha256:${"f".repeat(64)}` })];
    expect(codes("route-bundle", { route: route([candidate("claude-code")]), admissions: forged })).toContain("FAC-SEM-030");
  });

  it("FAC-SEM-030 needs the admission for the route's capability and in state admitted", () => {
    const elsewhere = [admitted(provider("urn:fabric:provider:claude-code-local"), { capability: "urn:fabric:capability:repository-change" })];
    const suspended = [admitted(provider("urn:fabric:provider:claude-code-local"), { state: "suspended" })];
    expect(codes("route-bundle", { route: route([candidate("claude-code")]), admissions: elsewhere })).toContain("FAC-SEM-030");
    expect(codes("route-bundle", { route: route([candidate("claude-code")]), admissions: suspended })).toContain("FAC-SEM-030");
  });

  const meta = { id: "urn:route:project-a:agent-chat", revision: 1, contentHash: `sha256:${"6".repeat(64)}` };
  const pinned = { ...route([candidate("claude-code"), candidate("hermes")]), meta };
  const binding = {
    project: "urn:project:a",
    capability,
    profileKind: "local-runner",
    provider: provider("urn:fabric:provider:claude-code-local"),
    runnerRoute: meta
  };

  it("FAC-SEM-032 accepts a binding that agrees with the route it pins", () => {
    expect(codes("route-bundle", { route: pinned, admissions, binding })).toEqual([]);
  });

  it.each([
    ["project", { project: "urn:project:b" }],
    ["capability", { capability: "urn:fabric:capability:repository-change" }],
    ["profile", { profileKind: "mcp" }],
    ["provider outside the candidates", { provider: provider("urn:fabric:provider:codex-local") }],
    ["another route revision", { runnerRoute: { ...meta, revision: 2 } }]
  ])("FAC-SEM-032 flags a binding that disagrees on its %s", (_label, change) => {
    expect(codes("route-bundle", { route: pinned, admissions, binding: { ...binding, ...change } })).toContain("FAC-SEM-032");
  });

  const catalogue = [
    { kind: "claude-code", drives: { "claude-headless": { argv: ["-p"] } } },
    { kind: "hermes", drives: { acp: { argv: ["acp"] } } }
  ];

  it("FAC-SEM-033 accepts candidates whose kinds and drives the catalogue offers", () => {
    const withDrive = { ...pinned, candidates: [candidate("claude-code"), { ...candidate("hermes"), drive: "acp" }] };
    expect(codes("route-bundle", { route: withDrive, admissions, catalogue })).toEqual([]);
  });

  it("FAC-SEM-033 flags an uncatalogued kind and a drive the entry does not offer", () => {
    const uncatalogued = { ...pinned, candidates: [candidate("claude-code"), candidate("kimi", undefined, "urn:fabric:provider:hermes-local")] };
    const wrongDrive = { ...pinned, candidates: [{ ...candidate("claude-code"), drive: "acp" }, candidate("hermes")] };
    expect(codes("route-bundle", { route: uncatalogued, admissions, catalogue })).toContain("FAC-SEM-033");
    expect(codes("route-bundle", { route: wrongDrive, admissions, catalogue })).toContain("FAC-SEM-033");
  });
});

describe("route-event semantic rules (DEC-0029)", async () => {
  const pinned = await fixture("positive/runner-route.json");
  const selected = await fixture("positive/runner-route-event-selected.json");
  const switched = await fixture("positive/runner-route-event-switched.json");
  const exhausted = await fixture("positive/runner-route-event-exhausted.json");
  const check = (event: unknown, routeValue: unknown = pinned) => codes("route-event", { route: routeValue, event });

  it("accepts the positive selection, switch and exhaustion fixtures against their route", () => {
    expect(check(selected)).toEqual([]);
    expect(check(switched)).toEqual([]);
    expect(check(exhausted)).toEqual([]);
  });

  it("FAC-SEM-034 flags an event that names another route revision, project or capability", () => {
    for (const [key, value] of [["route", { ...(selected.route as object), revision: 2 }], ["project", "urn:project:b"], ["capability", "urn:fabric:capability:other"]] as const) {
      expect(check({ ...clone(selected), [key]: value })).toContain("FAC-SEM-034");
    }
  });

  it("FAC-SEM-034 flags a selection that is not that position of the route", () => {
    const event = clone(selected) as { selected: { index: number } };
    event.selected.index = 2;
    expect(check(event)).toContain("FAC-SEM-034");
  });

  it("FAC-SEM-034 flags a walk that skips a higher-preference candidate without a probe", () => {
    const event = clone(selected) as { probes: unknown[] };
    event.probes.splice(1, 1);
    expect(check(event)).toContain("FAC-SEM-034");
  });

  it("FAC-SEM-034 flags an attach or spawn the candidate's session policy forbids", () => {
    const attachedKimi = clone(switched) as { selected: { session: string } };
    attachedKimi.selected.session = "attached";
    expect(check(attachedKimi)).toContain("FAC-SEM-034");
    const spawnedClaude = clone(selected) as { selected: Record<string, unknown>; probes: unknown[] };
    spawnedClaude.selected = { index: 0, runnerKind: "claude-code", provider: (pinned.candidates as Array<{ provider: unknown }>)[0]?.provider, session: "spawned", executionContext: spawnedClaude.selected.executionContext };
    spawnedClaude.probes = [];
    expect(check(spawnedClaude)).toContain("FAC-SEM-034");
  });

  it("FAC-SEM-034 flags no-held-session for a candidate that could have spawned", () => {
    const event = clone(selected) as { probes: Array<{ result: string }> };
    const target = event.probes[1];
    if (target) target.result = "no-held-session";
    expect(check(event)).toContain("FAC-SEM-034");
  });

  it("FAC-SEM-034 requires an exhausted walk to probe every candidate, and held only under exhausted: hold", () => {
    const short = clone(exhausted) as { probes: unknown[] };
    short.probes.pop();
    expect(check(short)).toContain("FAC-SEM-034");
    const held = { ...clone(exhausted), answer: "held" };
    expect(check(held)).toContain("FAC-SEM-034");
    expect(check(held, { ...pinned, exhausted: "hold" })).toEqual([]);
  });

  it("FAC-SEM-034 lets preferred-available move a conversation up only under recovery: reprobe", () => {
    const back = clone(switched) as Record<string, unknown> & { from: Record<string, unknown>; selected: Record<string, unknown> };
    back.reason = "preferred-available";
    expect(check(back)).toContain("FAC-SEM-034");
    expect(check(back, { ...pinned, recovery: "reprobe" })).toEqual([]);
    back.from = { index: 1, runnerKind: "codex", provider: (pinned.candidates as Array<{ provider: unknown }>)[1]?.provider };
    expect(check(back, { ...pinned, recovery: "reprobe" })).toContain("FAC-SEM-034");
  });

  it("FAC-SEM-034 flags a switch that stays on the same candidate", () => {
    const same = clone(switched) as { from: Record<string, unknown>; selected: Record<string, unknown> };
    same.from = { index: same.selected.index, runnerKind: same.selected.runnerKind, provider: same.selected.provider };
    expect(check(same)).toContain("FAC-SEM-034");
  });
});
