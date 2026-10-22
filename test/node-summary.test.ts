import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { policySigningInput } from "../src/device-rules.js";
import { harnessBaseline, harnessDrift, repairDecision, signedPolicyValue, versionBelow } from "../src/node-summary.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0101: node-summary/1, harnessDrift, and the node's decision on a repair (FAC-SEM-128, FAC-SEM-129).
const root = projectRoot();
const load = (file: string) => JSON.parse(readFileSync(path.join(root, "fixtures", file), "utf8"));
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);

describe("node-summary semantic fixtures (FAC-SEM-128)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("node-summary-"));
  it("has its six fixtures, four refused", () => {
    expect(files).toHaveLength(6);
    expect(files.filter((name) => load(`semantic/${name}`).expect.length > 0)).toHaveLength(4);
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
  it("FAC-SEM-129 holds the node to that decision and its reason", () => {
    expect(codes("repair-run", { ...base, layers: [], decision: "run" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, keys: [], decision: "refuse", reason: "bad-signature" })).toEqual([]);
    expect(codes("repair-run", { ...base, keys: [], decision: "refuse", reason: "expired" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, decision: "refuse", reason: "person-declined" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, decision: "run", reason: "expired" })).toEqual(["FAC-SEM-129"]);
  });
});
