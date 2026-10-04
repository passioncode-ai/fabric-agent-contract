import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

const descriptor = (id: string, instance: string, port: number, extra: Record<string, unknown> = {}) => ({
  protocol: "fabric-service/0.1", id, instance, origin: `http://127.0.0.1:${port}`, ...extra
});
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((finding) => finding.code);

describe("fabric-service/0.1 semantic rules", () => {
  it("FAC-SEM-009 flags a well-known answer from another service", () => {
    const wellKnown = { service: { id: "maker", instance: "default" } };
    expect(codes("service-observation", { descriptor: descriptor("runner", "default", 47187), wellKnown })).toContain("FAC-SEM-009");
  });

  it("FAC-SEM-009 flags another instance of the same service", () => {
    const wellKnown = { service: { id: "maker", instance: "preview" } };
    expect(codes("service-observation", { descriptor: descriptor("maker", "default", 47187), wellKnown })).toContain("FAC-SEM-009");
  });

  it("FAC-SEM-010 flags two descriptors claiming one port", () => {
    const descriptors = [descriptor("maker", "preview", 47191), descriptor("writer", "default", 47191)];
    const findings = evaluateSemanticRules("service-directory", { descriptors });
    expect(findings.map((finding) => finding.code)).toContain("FAC-SEM-010");
    expect(findings[0]?.message).toContain("47191");
  });

  it("FAC-SEM-010 flags one id.instance declared twice", () => {
    const descriptors = [descriptor("plan-board", "default", 47110), descriptor("plan-board", "default", 8711)];
    expect(codes("service-directory", { descriptors })).toContain("FAC-SEM-010");
  });

  it("FAC-SEM-011 flags ready with a degraded source", () => {
    expect(codes("service-well-known", { status: "ready", degraded: [{ source: "llm", reason: "no key" }] })).toContain("FAC-SEM-011");
  });

  it("FAC-SEM-012 flags a command whose executable is not a path", () => {
    expect(codes("service-descriptor", descriptor("plan-board", "default", 47110, { commands: { doctor: ["brandctl", "check"] } }))).toContain("FAC-SEM-012");
  });

  it("FAC-SEM-010 lets a remote service share a port number with a local one (DEC-0019)", () => {
    const remote = { protocol: "fabric-service/0.1", id: "example-agent", instance: "default", placement: "remote", origin: "https://agent.example.com:47191" };
    expect(codes("service-directory", { descriptors: [descriptor("maker", "default", 47191), remote] })).not.toContain("FAC-SEM-010");
  });

  it("FAC-SEM-010 still refuses one id.instance declared twice when one copy is remote", () => {
    const remote = { protocol: "fabric-service/0.1", id: "maker", instance: "default", placement: "remote", origin: "https://agent.example.com" };
    expect(codes("service-directory", { descriptors: [descriptor("maker", "default", 47191), remote] })).toContain("FAC-SEM-010");
  });

  it("FAC-SEM-024 refuses a remote service on a reserved name", () => {
    for (const origin of ["https://agent.localhost", "https://box.local", "https://api.internal", "https://nas.home.arpa"]) {
      expect(codes("service-descriptor", { placement: "remote", origin, lifecycle: { manager: "none" } })).toContain("FAC-SEM-024");
    }
  });

  it("FAC-SEM-024 refuses launchd fields on a remote service", () => {
    const value = { placement: "remote", origin: "https://agent.example.com", lifecycle: { manager: "none", label: "com.example.agent" } };
    expect(codes("service-descriptor", value)).toContain("FAC-SEM-024");
  });

  it("FAC-SEM-024 accepts a remote service on a public name", () => {
    expect(codes("service-descriptor", { placement: "remote", origin: "https://agent.example.com", lifecycle: { manager: "none" } })).toEqual([]);
  });

  it("accepts a consistent machine", () => {
    const a = descriptor("maker", "default", 47187, { commands: { doctor: ["~/.local/bin/foundry", "doctor"] } });
    const b = descriptor("maker", "preview", 47191);
    expect(codes("service-directory", { descriptors: [a, b] })).toEqual([]);
    expect(codes("service-observation", { descriptor: a, wellKnown: { service: { id: "maker", instance: "default" } } })).toEqual([]);
    expect(codes("service-well-known", { status: "degraded", degraded: [{ source: "llm", reason: "no key" }] })).toEqual([]);
    expect(codes("service-well-known", { status: "ready", degraded: [] })).toEqual([]);
    expect(codes("service-descriptor", a)).toEqual([]);
  });

  // DEC-0021: a usage report adds up, and an unknown cost is null — never 0.
  const usage = () => JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-usage.json"), "utf8")) as { days: Record<string, unknown>[] & { byModel: Record<string, unknown>[] }[] };

  it("FAC-SEM-025 accepts the positive usage fixture", () => {
    expect(codes("service-usage", usage())).toEqual([]);
  });

  it("FAC-SEM-025 flags a zero where every call is unpriced", () => {
    const u = usage();
    (u.days[1]!.byModel as Record<string, unknown>[])[1]!.costUsd = 0;
    expect(codes("service-usage", u)).toContain("FAC-SEM-025");
  });

  it("FAC-SEM-025 flags null where calls were priced", () => {
    const u = usage();
    u.days[0]!.costUsd = null;
    expect(codes("service-usage", u)).toContain("FAC-SEM-025");
  });

  it("FAC-SEM-025 flags a day whose tokens or cost are not the sum of its models", () => {
    const u = usage();
    u.days[0]!.inputTokens = 1;
    expect(evaluateSemanticRules("service-usage", u).map((f) => f.instancePath)).toContain("/days/0/inputTokens");
    const v = usage();
    v.days[0]!.costUsd = 9.99;
    expect(evaluateSemanticRules("service-usage", v).map((f) => f.instancePath)).toContain("/days/0/costUsd");
  });

  it("FAC-SEM-025 flags days out of order or repeated", () => {
    const u = usage();
    u.days[1]!.date = "2026-10-03";
    expect(codes("service-usage", u)).toContain("FAC-SEM-025");
  });

  it("FAC-SEM-025 flags more unpriced calls than calls", () => {
    const u = usage();
    (u.days[0]!.byModel as Record<string, unknown>[])[0]!.unpricedCalls = 13;
    expect(codes("service-usage", u)).toContain("FAC-SEM-025");
  });
});
