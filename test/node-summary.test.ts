import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { policySigningInput } from "../src/device-rules.js";
import { harnessDrift, repairDecision, versionBelow } from "../src/node-summary.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0101: node-summary/1, harnessDrift, and the node's decision on a repair (FAC-SEM-128, FAC-SEM-129).
const root = projectRoot();
const load = (file: string) => JSON.parse(readFileSync(path.join(root, "fixtures", file), "utf8"));
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);

describe("node-summary semantic fixtures (FAC-SEM-128)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("node-summary-"));
  it("has its five fixtures, three refused", () => {
    expect(files).toHaveLength(5);
    expect(files.filter((name) => load(`semantic/${name}`).expect.length > 0)).toHaveLength(3);
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
    expect(repairDecision(null)).toEqual({ decision: "refuse", reason: "bad-signature" });
  });
  it("FAC-SEM-129 holds the node to that decision and its reason", () => {
    expect(codes("repair-run", { ...base, layers: [], decision: "run" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, keys: [], decision: "refuse", reason: "bad-signature" })).toEqual([]);
    expect(codes("repair-run", { ...base, keys: [], decision: "refuse", reason: "expired" })).toEqual(["FAC-SEM-129"]);
    expect(codes("repair-run", { ...base, decision: "refuse", reason: "person-declined" })).toEqual(["FAC-SEM-129"]);
  });
});
