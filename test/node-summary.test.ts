import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { SIGNED_ONLY_KEYS, policySigningInput, resolvePolicy } from "../src/device-rules.js";
import { harnessBaseline, harnessDrift, repairDecision, signedPolicyValue, versionBelow } from "../src/node-summary.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE as REPAIR_VECTORS, buildRepairDecisionVectors } from "../tools/vectors/repair-decision.js";

// DEC-0101: node-summary/1, harnessDrift, and the node's decision on a repair (FAC-SEM-128, FAC-SEM-129).
const root = projectRoot();
const load = (file: string) => JSON.parse(readFileSync(path.join(root, "fixtures", file), "utf8"));
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);
const validator = await createValidator();
const valid = (value: unknown, schema: string) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, value).valid;

describe("node-summary semantic fixtures (FAC-SEM-128)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("node-summary-"));
  it("has its eight fixtures, six refused (two hide a dash-encoded home directory, DEC-0105)", () => {
    expect(files).toHaveLength(8);
    expect(files.filter((name) => load(`semantic/${name}`).expect.length > 0)).toHaveLength(6);
  });
  it("its two dash-encoded home-path fixtures are refused at the name, and for nothing else (DEC-0105)", () => {
    for (const [name, at] of [["node-summary-home-after-dot.json", "/summary/harness/skills/1/name"], ["node-summary-home-after-at.json", "/summary/harness/plugins/1/name"]]) {
      const fixture = load(`semantic/${name}`);
      expect(evaluateSemanticRules(fixture.kind, fixture.input).map((f) => [f.instancePath, f.message]), name).toEqual([[at, "a node summary carries no path"]]);
    }
  });
  it.each(files)("%s", (name) => {
    const fixture = load(`semantic/${name}`);
    expect([...new Set(codes(fixture.kind, fixture.input))]).toEqual(fixture.expect);
  });
});

describe("harnessDrift (DEC-0101)", () => {
  const { summary, baseline } = load("semantic/node-summary-ok.json").input;
  it("reports each baseline item that is missing, stopped, changed or outdated, in the baseline's order", () => {
    expect(harnessDrift(baseline.items, summary)).toEqual([
      { kind: "plugin", name: "switchboard@passioncode", state: "outdated" },
      { kind: "service", name: "inbox-agent.default", state: "missing" }
    ]);
  });
  it("one state per item, the first that holds: missing, stopped, changed, outdated", () => {
    const items = [
      { kind: "service", name: "observatory-node.default" },
      { kind: "mcp-server", name: "fabric", minVersion: "1" },
      { kind: "skill", name: "task-pipeline", digest: `sha256:${"b".repeat(64)}` },
      { kind: "coding-agent", name: "codex", minVersion: "0.48.1" },
      { kind: "coding-agent", name: "claude-code", minVersion: "2.1.296" },
      { kind: "widget", name: "x" },
      { kind: "skill" }
    ];
    const stopped = { ...summary, services: [{ key: "observatory-node.default", state: "stopped" }], harness: { ...summary.harness, mcpServers: [{ ...summary.harness.mcpServers[0], health: "down" }] } };
    expect(harnessDrift(items, stopped)).toEqual([
      { kind: "service", name: "observatory-node.default", state: "stopped" },
      { kind: "mcp-server", name: "fabric", state: "stopped" },
      { kind: "skill", name: "task-pipeline", state: "changed" },
      { kind: "coding-agent", name: "codex", state: "outdated" }
    ]);
    expect(harnessDrift("not a list", summary)).toEqual([]);
    expect(harnessDrift(items, null).map((item) => item.state)).toEqual(["missing", "missing", "missing", "missing", "missing"]);
  });
  it("compares only what a kind carries, and changed comes before outdated (DEC-0102)", () => {
    const items = [
      { kind: "mcp-server", name: "fabric", minVersion: "9", digest: `sha256:${"c".repeat(64)}` },
      { kind: "service", name: "observatory-node.default", minVersion: "9" },
      { kind: "coding-agent", name: "claude-code", digest: `sha256:${"c".repeat(64)}` },
      { kind: "plugin", name: "switchboard@passioncode", minVersion: "9", digest: `sha256:${"c".repeat(64)}` }
    ];
    expect(harnessDrift(items, summary)).toEqual([{ kind: "plugin", name: "switchboard@passioncode", state: "changed" }]);
    const unknownState = { ...summary, services: [{ key: "observatory-node.default", state: "unknown" }] };
    expect(harnessDrift([{ kind: "service", name: "observatory-node.default" }], unknownState)).toEqual([{ kind: "service", name: "observatory-node.default", state: "stopped" }]);
  });

  it("reads the baseline and the allowlist from signed layers only, with the setting layer's revision (DEC-0102)", () => {
    const items = [{ kind: "plugin", name: "x" }];
    const server = { source: "server", revision: 7, keys: { "harness.baseline": { value: { items } }, "repair.packages": { value: [] } } };
    const user = { source: "user", revision: 1, keys: { "harness.baseline": { value: { items: [] } }, "repair.packages": { value: [{ agentRef: "a", digest: "b" }] } } };
    expect(harnessBaseline([server, user])).toEqual({ revision: 7, items });
    expect(harnessBaseline([user])).toBeUndefined();
    expect(harnessBaseline("no")).toBeUndefined();
    // mdm over server unless the server locks the key; the drift's revision is the setting layer's.
    const mdmItems = [{ kind: "skill", name: "y" }];
    const mdm = { source: "mdm", revision: 3, keys: { "harness.baseline": { value: { items: mdmItems } } } };
    expect(harnessBaseline([mdm, server])).toEqual({ revision: 3, items: mdmItems });
    const locked = { ...server, keys: { "harness.baseline": { value: { items }, locked: true } } };
    expect(harnessBaseline([mdm, locked])).toEqual({ revision: 7, items });
    const mdmOther = { source: "mdm", revision: 3, keys: { "repair.packages": { value: [] } } };
    expect(harnessBaseline([mdmOther, server])).toEqual({ revision: 7, items });
    expect(signedPolicyValue([server, user], "repair.packages")).toEqual([]);
  });

  it("compares versions number by number; a version that is not dotted numbers is outdated", () => {
    expect(versionBelow("2.10.0", "2.9")).toBe(false);
    expect(versionBelow("2.9", "2.10")).toBe(true);
    expect(versionBelow("2", "2.0.0")).toBe(false);
    expect(versionBelow("2.0.1-beta", "1")).toBe(true);
    expect(versionBelow(undefined, "1")).toBe(true);
  });
});

describe("FAC-SEM-128 beyond the fixtures", () => {
  const { summary, baseline } = load("semantic/node-summary-ok.json").input;
  it("refuses a credential and a home path in any string, and drift without a baseline or under another revision", () => {
    const withSecret = { ...summary, harness: { ...summary.harness, plugins: [{ name: "ghp_0123456789abcdefghijABCDEFGHIJ", source: "local" }] } };
    expect(codes("node-summary", { summary: withSecret, baseline })).toContain("FAC-SEM-128");
    const withPath = { ...summary, services: [{ ...summary.services[0], mcpEndpoint: "https://host.example/Users/example/x" }] };
    expect(evaluateSemanticRules("node-summary", { summary: withPath, baseline }).map((finding) => finding.instancePath)).toEqual(["/summary/services/0/mcpEndpoint"]);
    expect(codes("node-summary", { summary })).toEqual(["FAC-SEM-128"]);
    expect(codes("node-summary", { summary: { ...summary, drift: { ...summary.drift, policyRevision: 6 } }, baseline })).toEqual(["FAC-SEM-128"]);
    const { drift: _drift, ...undrifted } = summary;
    expect(codes("node-summary", { summary: undrifted, baseline })).toEqual(["FAC-SEM-128"]);
    expect(codes("node-summary", { summary: "no", baseline: "no" })).toEqual([]);
    const twice = { ...summary, harness: { ...summary.harness, plugins: [...summary.harness.plugins, summary.harness.plugins[0]] } };
    expect(evaluateSemanticRules("node-summary", { summary: twice, baseline }).map((finding) => finding.instancePath)).toContain("/summary/harness/plugins/1/name");
    const person = load("semantic/node-summary-person.json").input;
    expect(evaluateSemanticRules("node-summary", person).map((finding) => finding.instancePath)).toEqual(["/summary/harness/plugins/1/name"]);
    // The context is compared as written, and a summary without one is refused.
    expect(codes("node-summary", { summary: { ...summary, context: "org:ORG-7F3A" }, baseline, org: "org-7f3a" })).toEqual(["FAC-SEM-128"]);
    const { context: _context, ...contextless } = summary;
    expect(codes("node-summary", { summary: contextless, baseline, org: "org-7f3a" })).toEqual(["FAC-SEM-128"]);
    // Depth never throws.
    let deep: unknown = "x";
    for (let i = 0; i < 20000; i += 1) deep = [deep];
    expect(() => evaluateSemanticRules("node-summary-document", { ...summary, harness: { ...summary.harness, hooks: deep } })).not.toThrow();
    const services = { ...summary, services: [summary.services[0], summary.services[0]] };
    expect(evaluateSemanticRules("node-summary-document", services).map((finding) => finding.instancePath)).toEqual(["/services/1/key"]);
    // The summary read whole: the clauses that need no policy (DEC-0102).
    expect(codes("node-summary-document", load("positive/node-summary.json"))).toEqual([]);
    expect(codes("node-summary-document", twice)).toEqual(["FAC-SEM-128"]);
    // Each list's duplicates, a credential anywhere, and a pointer that escapes its member names.
    const paths = (value: unknown) => evaluateSemanticRules("node-summary-document", value).map((finding) => finding.instancePath);
    const doubled = (list: "skills" | "mcpServers" | "codingAgents") => ({ ...summary, harness: { ...summary.harness, [list]: [summary.harness[list][0], summary.harness[list][0]] } });
    expect(paths(doubled("skills"))).toEqual(["/harness/skills/1/name"]);
    expect(paths(doubled("mcpServers"))).toEqual(["/harness/mcpServers/1/name"]);
    expect(paths(doubled("codingAgents"))).toEqual(["/harness/codingAgents/1/id"]);
    const keyed = { ...summary, harness: { ...summary.harness, mcpServers: [{ ...summary.harness.mcpServers[0], name: ["ghp", "0123456789abcdefghijABCDEFGHIJ"].join("_") }] } };
    expect(paths(keyed)).toEqual(["/harness/mcpServers/0/name"]);
    expect(paths({ ...summary, "a/b~c": "someone@example.com" })).toEqual(["/a~1b~0c"]);
  });

  it("never takes the baseline or the allowlist from a user layer, in FAC-SEM-042's resolution too (DEC-0102)", () => {
    const server = { source: "server", revision: 7, keys: { "repair.packages": { value: [] } } };
    const user = { source: "user", revision: 1, keys: { "repair.packages": { value: [{ agentRef: "x", digest: "y" }] }, "harness.baseline": { value: { items: [] } }, "x-example.banner": { value: "mine" } } };
    const resolved = resolvePolicy([server, user]);
    expect(resolved["repair.packages"]).toEqual({ value: [], from: "server" });
    expect(resolved["harness.baseline"]).toBeUndefined();
    expect(resolved["x-example.banner"]).toEqual({ value: "mine", from: "user" });
  });

  it("a degraded service is running, not stopped", () => {
    expect(harnessDrift([{ kind: "service", name: "observatory-node.default" }], { ...summary, services: [{ key: "observatory-node.default", state: "degraded" }] })).toEqual([]);
  });
});

describe("the harness name shape, in every list that carries it (CT-100)", () => {
  const summary = load("positive/node-summary.json");
  const policy = load("positive/device-policy-harness-baseline.json");
  // Each list's first name replaced by `name`: the four lists of a summary and a baseline item of each name-free kind.
  const lists: Array<[string, (name: string) => boolean]> = [
    ["mcpServers", (name) => valid({ ...summary, harness: { ...summary.harness, mcpServers: [{ ...summary.harness.mcpServers[0], name }] } }, "node-summary.schema.json")],
    ["skills", (name) => valid({ ...summary, harness: { ...summary.harness, skills: [{ ...summary.harness.skills[0], name }] } }, "node-summary.schema.json")],
    ["plugins", (name) => valid({ ...summary, harness: { ...summary.harness, plugins: [{ ...summary.harness.plugins[0], name }] } }, "node-summary.schema.json")],
    ["drift", (name) => valid({ ...summary, drift: { ...summary.drift, items: [{ ...summary.drift.items[0], name }] } }, "node-summary.schema.json")],
    ...(["skill", "plugin", "mcp-server"] as const).map((kind): [string, (name: string) => boolean] => [`baseline ${kind}`, (name) => valid({ ...policy, keys: { ...policy.keys, "harness.baseline": { value: { items: [{ kind, name }] } } } }, "device-policy.schema.json")])
  ];
  it.each(lists)("%s admits one @ suffix without a dot, and refuses a dotted suffix and a second @", (_list, admits) => {
    expect(admits("switchboard@passioncode")).toBe(true);
    expect(admits("plugin:switchboard:switchboard")).toBe(true);
    expect(admits("Task.Pipeline+2")).toBe(true);
    // A dotted suffix is an e-mail address's domain; a second @ hides one behind a marketplace (DEC-0102).
    expect(admits("tool@example.com")).toBe(false);
    expect(admits("tool@example.")).toBe(false);
    expect(admits("task@pipe@line")).toBe(false);
    expect(admits("tool@@passioncode")).toBe(false);
    expect(admits("tool@")).toBe(false);
    expect(admits("@passioncode")).toBe(false);
  });
  const item = (kind: string, name: string) => valid({ ...policy, keys: { ...policy.keys, "harness.baseline": { value: { items: [{ kind, name }] } } } }, "device-policy.schema.json");
  it("a baseline coding agent's name is a slug, refused for more than a first capital", () => {
    for (const name of ["claude-code", "codex", "c9"]) expect(item("coding-agent", name), name).toBe(true);
    for (const name of ["Claude-Code", "claude_code", "claude.code", "claude-code@passioncode", "9claude", "-claude", "c", "claude code", "c".repeat(64)]) expect(item("coding-agent", name), name).toBe(false);
    // The same names under a kind without the branch take the summary's shape: the branch is the coding agent's alone.
    for (const name of ["Claude-Code", "claude_code", "claude.code"]) expect(item("plugin", name), name).toBe(true);
  });
  it("a baseline service's name is an id.instance key, refused for more than a first capital", () => {
    for (const name of ["inbox-digest.main", "inbox-digest.0", `${"a".repeat(63)}.${"b".repeat(63)}`]) expect(item("service", name), name).toBe(true);
    for (const name of ["Inbox-Digest.Main", "inbox-digest.Main", "inbox-digest", "inbox-digest.main.x", "i.main", "inbox_digest.main", "inbox-digest.-main", "inbox-digest.", "inbox-digest@main", `${"a".repeat(64)}.main`, `inbox.${"b".repeat(64)}`]) expect(item("service", name), name).toBe(false);
    for (const name of ["Inbox-Digest.Main", "inbox_digest.main"]) expect(item("skill", name), name).toBe(true);
  });
});

describe("the signed-only keys have one list (CT-100)", () => {
  const source = readFileSync(path.join(root, "src/node-summary.ts"), "utf8");
  it("SIGNED_ONLY_KEYS names every key the node reads from signed layers, and no other", () => {
    // What signedPolicyValue and harnessBaseline read, by the literal keys in the source: a key read from signed layers
    // that a user layer may still set would be resolved differently by resolvePolicy and by the node.
    const read = new Set([
      ...[...source.matchAll(/signedPolicyValue\([^,]+,\s*"([^"]+)"\)/g)].map((match) => match[1]),
      ...[...source.matchAll(/resolvePolicy\(signed\)\["([^"]+)"\]/g)].map((match) => match[1])
    ]);
    expect([...read].sort()).toEqual([...SIGNED_ONLY_KEYS].sort());
  });
  it.each(SIGNED_ONLY_KEYS)("a user layer's %s is read by none of resolvePolicy, signedPolicyValue and harnessBaseline", (key) => {
    const value = key === "harness.baseline" ? { items: [{ kind: "skill", name: "mine" }] } : [{ agentRef: "mine", digest: `sha256:${"d".repeat(64)}` }];
    const user = { source: "user", revision: 1, keys: { [key]: { value }, "x-example.banner": { value: "mine" } } };
    expect(resolvePolicy([user])[key]).toBeUndefined();
    expect(resolvePolicy([user])["x-example.banner"]).toEqual({ value: "mine", from: "user" });
    expect(signedPolicyValue([user], key)).toBeUndefined();
    expect(harnessBaseline([user])).toBeUndefined();
    // The same key from a signed layer is read by all three.
    const server = { ...user, source: "server", revision: 7 };
    expect(resolvePolicy([server])[key]).toEqual({ value, from: "server" });
    expect(signedPolicyValue([server], key)).toEqual(value);
    expect(harnessBaseline([server]) === undefined).toBe(key !== "harness.baseline");
  });
});

describe("repairDecision (FAC-SEM-129)", () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const raw = (publicKey.export({ format: "der", type: "spki" }) as Buffer).subarray(12).toString("base64");
  const keys = [{ keyId: "org-7f3a.policy-2026-10", alg: "ed25519", publicKey: raw }];
  const signed = (request: Record<string, any>): Record<string, any> => ({ ...request, signature: { ...(request.signature as object), value: sign(null, policySigningInput(request), privateKey).toString("base64") } });
  const request = signed(load("positive/repair-request.json"));
  const layers = [{ source: "server", revision: 7, expiresAt: "2026-10-30T00:00:00Z", keys: { "repair.packages": { value: [{ agentRef: request.package.agentRef, digest: request.package.digest }] } } }];
  const base = { request, keys, device: { id: "dev-01j9a", org: "org-7f3a" }, layers, at: "2026-10-22T10:00:00Z", notifiedAt: "2026-10-22T09:59:00Z" };

  it("runs a signed, current, allowlisted repair the person was told of", () => {
    expect(repairDecision(base)).toEqual({ decision: "run" });
    expect(codes("repair-run", { ...base, decision: "run" })).toEqual([]);
  });
  it("refuses in its order: signature, device, window, policy, allowlist, the person", () => {
    const why = (change: Record<string, unknown>) => repairDecision({ ...base, ...change }).reason;
    expect(why({ request: { ...request, task: "something else" } })).toBe("bad-signature");
    expect(why({ keys: [] })).toBe("bad-signature");
    // DEC-0115: a key window whose bound does not read is closed, never open.
    expect(why({ keys: keys.map((k: Record<string, unknown>) => ({ ...k, notAfter: "next year" })) })).toBe("bad-signature");
    expect(why({ device: { id: "dev-other", org: "org-7f3a" } })).toBe("wrong-device");
    expect(why({ device: { id: "dev-01j9a", org: "org-other" } })).toBe("wrong-device");
    expect(why({ at: "2026-10-23T09:00:00Z" })).toBe("expired");
    expect(why({ request: signed({ ...request, expiresAt: "2026-10-30T09:00:01Z" }) })).toBe("expired");
    expect(why({ layers: [{ ...layers[0], expiresAt: "2026-10-22T09:00:00Z" }] })).toBe("policy-expired");
    expect(why({ layers: [{ ...layers[0], keys: {} }] })).toBe("not-allowlisted");
    expect(why({ notifiedAt: undefined })).toBe("person-declined");
    expect(why({ notifiedAt: "2026-10-22T10:00:01Z" })).toBe("person-declined");
    expect(why({ declined: true })).toBe("person-declined");
    // Boundaries: exactly 7 days, the person told at the very instant, the policy's own expiry instant.
    expect(why({ request: signed({ ...request, expiresAt: "2026-10-29T09:00:00Z" }) })).toBeUndefined();
    expect(why({ notifiedAt: base.at })).toBeUndefined();
    expect(why({ layers: [{ ...layers[0], expiresAt: base.at }] })).toBeUndefined();
    // The allowlist names the digest too: the same agent at another digest is not allowlisted.
    expect(why({ layers: [{ ...layers[0], keys: { "repair.packages": { value: [{ agentRef: request.package.agentRef, digest: `sha256:${"c".repeat(64)}` }] } } }] })).toBe("not-allowlisted");
    // DEC-0102: a key outside its window, a policy with no expiresAt, a user layer, a repeat, no canonical form.
    expect(why({ keys: [{ ...keys[0], notAfter: "2026-10-01T00:00:00Z" }] })).toBe("bad-signature");
    expect(why({ keys: [{ ...keys[0], notBefore: "2026-10-23T00:00:00Z" }] })).toBe("bad-signature");
    const { expiresAt: _never, ...lasting } = layers[0] as (typeof layers)[number];
    expect(why({ layers: [lasting] })).toBeUndefined();
    expect(why({ layers: [] })).toBe("not-allowlisted");
    expect(why({ layers: [{ ...layers[0], keys: {} }, { source: "user", keys: { "repair.packages": { value: (layers[0] as (typeof layers)[number]).keys["repair.packages"].value } } }] })).toBe("not-allowlisted");
    expect(why({ answered: true })).toBe("already-answered");
    expect(why({ answered: true, keys: [] })).toBe("already-answered");
    // The key is judged at `at`, never at the signer's issuedAt (09:00); `at` is 10:00. Its window's own instants admit.
    expect(why({ keys: [{ ...keys[0], notAfter: "2026-10-22T09:30:00Z" }] })).toBe("bad-signature");
    expect(why({ keys: [{ ...keys[0], notBefore: "2026-10-22T09:30:00Z" }] })).toBeUndefined();
    expect(why({ keys: [{ ...keys[0], notAfter: base.at }] })).toBeUndefined();
    expect(why({ keys: [{ ...keys[0], notBefore: base.at }] })).toBeUndefined();
    expect(why({ at: "not a time" })).toBe("bad-signature");
    // An allowlist set only in an mdm layer binds; an org-cloud machine is not stopped by a declined notice.
    expect(why({ layers: [{ source: "mdm", revision: 1, expiresAt: "2026-10-30T00:00:00Z", keys: { "repair.packages": { value: [{ agentRef: request.package.agentRef, digest: request.package.digest }] } } }] })).toBeUndefined();
    expect(why({ declined: true, notifiedAt: undefined, device: { ...base.device, role: "org-cloud" } })).toBeUndefined();
    expect(() => repairDecision({ ...base, request: { ...request, task: "a \ud800 b" } })).not.toThrow();
    expect(why({ request: { ...request, task: "a \ud800 b" } })).toBe("bad-signature");
    // DEC-0102: an org-cloud machine binds no person; the organization's signed request is its notice.
    expect(repairDecision({ ...base, notifiedAt: undefined, device: { ...base.device, role: "org-cloud" } })).toEqual({ decision: "run" });
    expect(repairDecision(null)).toEqual({ decision: "refuse", reason: "bad-signature" });
  });
  it("finds the key by its id and its algorithm, a key without alg being ed25519 (CT-100)", () => {
    const why = (change: Record<string, unknown>) => repairDecision({ ...base, ...change }).reason;
    const { alg: _alg, ...bare } = keys[0] as Record<string, unknown>;
    expect(why({ keys: [bare] })).toBeUndefined();
    expect(why({ keys: [{ ...keys[0], alg: "p256" }] })).toBe("bad-signature");
    expect(why({ keys: [{ ...keys[0], alg: "Ed25519" }] })).toBe("bad-signature");
    // The signature names its algorithm; the signing input leaves the signature out, so the value still verifies.
    expect(why({ request: { ...request, signature: { ...request.signature, alg: "p256" } } })).toBe("bad-signature");
    expect(why({ keys: [bare], request: { ...request, signature: { ...request.signature, alg: "p256" } } })).toBe("bad-signature");
    const { alg: _unnamed, ...anonymous } = request.signature as Record<string, unknown>;
    expect(why({ request: { ...request, signature: anonymous } })).toBe("bad-signature");
    expect(why({ keys: [bare], request: { ...request, signature: anonymous } })).toBe("bad-signature");
    // The matching key is found among others, by both its id and its algorithm.
    expect(why({ keys: [{ ...keys[0], alg: "p256" }, { ...keys[0], keyId: "org-7f3a.other" }, keys[0]] })).toBeUndefined();
  });
  it("a repair answered once is answered again, and only answered: true says so (CT-100)", () => {
    const why = (change: Record<string, unknown>) => repairDecision({ ...base, ...change }).reason;
    for (const answered of ["true", 1, {}, [true], false, null]) expect(why({ answered }), JSON.stringify(answered)).toBeUndefined();
    expect(codes("repair-run", { ...base, answered: true, decision: "refuse", reason: "already-answered" })).toEqual([]);
    expect(codes("repair-run", { ...base, answered: true, decision: "run" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, answered: true, decision: "refuse", reason: "bad-signature" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, answered: "true", decision: "run" })).toEqual([]);
    expect(codes("repair-run", { ...base, answered: "true", decision: "refuse", reason: "already-answered" })).toEqual(["FAC-SEM-129"]);
  });
  it("FAC-SEM-129 holds the node to that decision and its reason", () => {
    expect(codes("repair-run", { ...base, layers: [], decision: "run" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, keys: [], decision: "refuse", reason: "bad-signature" })).toEqual([]);
    expect(codes("repair-run", { ...base, keys: [], decision: "refuse", reason: "expired" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, decision: "refuse", reason: "person-declined" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, decision: "run", reason: "expired" })).toEqual(["FAC-SEM-129"]);
  });
});

describe("the repair-decision vectors (fixtures/vectors/repair-decision.json, FAC-SEM-129)", () => {
  const text = readFileSync(path.join(root, REPAIR_VECTORS), "utf8");
  const vectors = JSON.parse(text) as { keys: { policy: { publicKey: string } }; signingInput: string; cases: Array<{ name: string; input: unknown; expect: unknown }> };
  it("are exactly what the generator writes (tools/vectors/repair-decision.ts)", () => {
    expect(text).toBe(buildRepairDecisionVectors());
  });
  it("name the signing input policySigningInput builds for the first case's request", () => {
    const first = vectors.cases[0]?.input as { request: Record<string, unknown> };
    expect(policySigningInput(first.request).toString("utf8")).toBe(vectors.signingInput);
  });
  it.each(vectors.cases)("$name", ({ input, expect: want }) => {
    expect(repairDecision(input)).toEqual(want);
    // FAC-SEM-129 holds a node to the same answer.
    const decided = want as { decision: string; reason?: string };
    if (input !== null) expect(codes("repair-run", { ...(input as object), ...decided })).toEqual([]);
  });
});
