import { describe, expect, it } from "vitest";
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
});
