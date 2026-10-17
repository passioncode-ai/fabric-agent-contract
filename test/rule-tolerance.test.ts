import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// Every activity, device, estate-record, hub-key (FAC-SEM-081), relay, revocation-delta (FAC-SEM-082…084), one-copy, Windows token-file, well-known (FAC-SEM-080), descriptor (FAC-SEM-085, FAC-SEM-086), runner (FAC-SEM-087) peer-request (FAC-SEM-088), window-lease (FAC-SEM-089…091), entitlement (FAC-SEM-115, FAC-SEM-116), signing-credential (FAC-SEM-092), the identifier-comparing kinds (DEC-0076), openrouter-attribution (FAC-SEM-098), protocols (FAC-SEM-099), session-join (FAC-SEM-100), directory-page (FAC-SEM-107), comms-transition (FAC-SEM-027, FAC-SEM-109), board-finding (FAC-SEM-108), grant (FAC-SEM-110) and profile-resolution (FAC-SEM-060, FAC-SEM-112) rule kind reads a malformed input — missing members, members of the wrong type — and
// answers with findings or none, never by throwing (CT-25's tolerance, DEC-0052, applied to every input shape).
const KINDS = [
  "telemetry-event", "activity-batch", "activity-ack", "activity-summary", "access-log-disclosure",
  "device-policy-update", "device-policy-resolution", "device-health-observation", "device-enrollment", "device-attribution",
  "device-key-set", "device-action", "device-root-certification", "device-request-signature",
  "estate-record", "estate-record-revision", "estate-placement", "secret-envelope", "relay-frame",
  "revocation-delta", "heartbeat", "delta-freshness", "delta-reconciliation",
  "service-well-known", "service-lock-outcome", "windows-token-file", "delegation-hub-key", "service-descriptor", "service-runner", "service-peer-request",
  "window-lease", "window-lease-division", "lease-reservation", "entitlement", "entitlement-key-set", "signing-credential", "openrouter-attribution", "protocols", "device-check-in", "local-channel-session", "session-join", "service-events-page", "proposal", "proposal-transition", "proposal-submit", "learning-rollout",
  "result", "learning", "promotion", "versioned-setting", "grant-window", "roles",
  // The kinds whose rules compare identifiers by normal form (DEC-0076).
  "execution-bundle", "service-usage", "runner-route", "route-bundle", "route-event", "provider-observation",
  // A directory page (FAC-SEM-107, DEC-0077), whose ids and capability names compare as written.
  "comms-directory",
  // A request's transition record: the lifecycle table (FAC-SEM-027) and who settled it (FAC-SEM-109, DEC-0081).
  "comms-transition",
  // A submit and a message as read, whose finding's affects items compare as written (FAC-SEM-108, DEC-0080).
  "comms-submit", "comms-message",
  // A standing grant, whose context is never personal for an external principal (FAC-SEM-110, DEC-0082).
  "grant",
  // A recorded profile resolution, whose profiles that read user content have an open-vendor route (FAC-SEM-060, FAC-SEM-112, DEC-0083).
  "profile-resolution"
];
const WRONG: unknown[] = [null, 7, "x", true, [], [null, 3, "y"], { a: null }];
/** An object whose every member named in `names` holds `value`. */
const filled = (names: string[], value: unknown) => Object.fromEntries(names.map((name) => [name, value]));
const MEMBERS = [
  "events", "known", "batch", "ack", "cells", "log", "consents", "current", "next", "trustedKeys", "at", "layers", "effective",
  "checkIn", "health", "request", "response", "enrolled", "token", "proof", "issuedEpochs", "binding", "epochs", "root",
  "action", "decision", "pinned", "certification", "revocations", "data", "collector", "device", "user", "session", "kind",
  "seq", "record", "machine", "package", "parent", "machines", "authorities", "publisherKeys", "shareGrants",
  "revocations", "packages", "secrets", "sourceKey", "source", "eventId", "occurred", "monotonicNs", "acknowledgedAt", "producer", "from", "to", "minPopulation",
  "header", "ct", "sig", "type", "kid", "alg", "protocol", "ttl", "body", "extensions", "status", "degraded",
  "start", "env", "argv", "holderPid", "attempts", "waitedMs", "sideEffects", "outcome", "file", "currentUserSid", "aces", "ownerSid",
  "publicBaseUrl", "certificates", "seen", "answer", "clientCertificateSerial", "headers", "target", "method",
  "head", "entries", "deltaHead", "estateRecord", "applied", "heartbeat", "broken", "revision", "prev", "sequence", "revocation",
  "revokedAt", "estate", "issuedAt", "x",
  "descriptor", "catalogue", "derived", "dataClass", "sent", "peer", "runner", "installedBy", "lifecycle", "commands", "placement", "origin",
  "done", "proof", "notVerified", "outcome", "approvedBy", "state", "meta", "rollbackBasis", "parents", "grant", "startsAt",
  "assignments", "limitUsd", "leases", "reports", "lease", "window", "period", "amount", "expiresAt",
  "leaseId", "scope", "unit", "rpId", "origins", "spentUsd", "amountUsd", "localRemainderUsd",
  "context", "pool", "days", "byProject", "generatedAt", "route", "admissions", "event", "candidates", "project", "capability",
  "entry", "manifest", "projects", "op", "observed", "settledBy", "summary", "principal", "finding", "affects", "thread",
  "principalKind", "calls", "unpricedCalls", "costUsd", "grantId", "day",
  "profiles", "models", "reads", "fallback", "choices", "policy", "resolved", "classes",
  "subject", "order", "notBefore", "licence", "hosting", "support", "agents", "agentRef", "keys", "revoked", "notAfter", "issuer"
];

describe("activity and device rules tolerate malformed input", () => {
  it.each(KINDS)("%s answers every malformed shape without throwing", (kind) => {
    for (const value of WRONG) {
      expect(() => evaluateSemanticRules(kind, filled(MEMBERS, value))).not.toThrow();
      expect(() => evaluateSemanticRules(kind, { ...filled(MEMBERS, value), kind: "buffer.overflow" })).not.toThrow();
    }
    expect(() => evaluateSemanticRules(kind, {})).not.toThrow();
  });

  it("reads nested members of the wrong type without throwing", () => {
    const nested = { log: { subject: 1, entries: [1, { reader: 2 }, { reader: { user: 3 }, scope: "activity.usage" }] }, consents: [1, { kind: "consent" }] };
    expect(() => evaluateSemanticRules("access-log-disclosure", nested)).not.toThrow();
    const device = {
      request: { auth: 1, device: 2, key: 3, deviceKeys: [1, { kid: 2, use: "kem" }] }, response: { certificate: { binding: 4 } }, enrolled: {},
      layers: [1, { source: "server", keys: 2, expiresAt: 3 }], action: { kind: "upload" }, decision: "allow",
      pinned: [1, {}], root: 2, certification: { subject: 3, signature: 4, delegation: { signature: 5 } }, revocations: { signature: 6, revoked: 7 },
      next: { signature: 1, keys: [1, {}], org: 2 }, current: { keys: 3, org: 4 }, trustedKeys: [1, {}],
      known: { streams: [1, { collector: 2, held: 3 }] }, checkIn: { collectors: [1, { collector: 2 }], policy: { layers: [1] }, logging: 3 },
      batch: { events: [1, { collector: 2, user: 3 }] }, epochs: [1, { binding: 2 }], binding: { device: 3 },
      at: "2026-10-12T09:00:00Z", publicBaseUrl: "https://org.example", seen: [1, { serial: 2 }], certificates: [1, { serial: "aa01", key: 2, notBefore: 3 }],
      answer: 4
    };
    // A request whose headers hold every wrong shape still answers with a finding.
    const headers = { "signature-input": ["fabric-device=(", 7, null], signature: { a: 1 }, "content-digest": [] };
    expect(() => evaluateSemanticRules("device-request-signature", { ...device, request: { method: 1, target: 2, headers, body: 3 } })).not.toThrow();
    for (const kind of KINDS) expect(() => evaluateSemanticRules(kind, device), kind).not.toThrow();
    // A division, a reservation and a credential whose members hold every wrong shape still answer with findings.
    const lease = { type: "window-lease/1", window: "month", period: "2026-10", issuedAt: "2026-10-12T09:00:00Z", expiresAt: 4, amount: [] };
    expect(() => evaluateSemanticRules("window-lease-division", { limitUsd: "1000", leases: [1, lease, { ...lease, constructor: 1 }], reports: [1, { leaseId: 2, receivedAt: 3 }] })).not.toThrow();
    expect(() => evaluateSemanticRules("lease-reservation", { lease, request: { at: 1, amountUsd: [], spentUsd: {} }, decision: 2 })).not.toThrow();
    expect(() => evaluateSemanticRules("signing-credential", { rpId: ["sign.example.org"], origins: [1, null, { a: 1 }] })).not.toThrow();
    expect(() => evaluateSemanticRules("window-lease", { window: "__proto__", period: "constructor" })).not.toThrow();
    // An entitlement and a key set whose members hold every wrong shape, prototype names among them (DEC-0085).
    for (const value of WRONG) {
      expect(() => evaluateSemanticRules("entitlement", { subject: "personal", estate: value, licence: value, hosting: { product: value, constructor: 1 }, agents: [value, { agentRef: value }, { agentRef: { toString: 1 } }], issuedAt: value })).not.toThrow();
      expect(() => evaluateSemanticRules("entitlement-key-set", { kid: value, revoked: value, keys: [value, { kid: "__proto__", x: value, notBefore: value, notAfter: value }, { kid: "constructor", x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }] })).not.toThrow();
    }
    expect(() => evaluateSemanticRules("entitlement", { subject: "__proto__", agents: [{ agentRef: "__proto__" }, { agentRef: "__proto__" }], issuedAt: 9007199254740993, expiresAt: 1e308 })).not.toThrow();
    const dashboard = "https://fabric.passioncode.ai/agent-contract/extensions/dashboard/0.1";
    for (const value of WRONG) expect(() => evaluateSemanticRules("service-well-known", { extensions: { [dashboard]: value, constructor: value } })).not.toThrow();
  });
  it("reads a descriptor, a runner record and a peer request with nested members of the wrong type without throwing (DEC-0061)", () => {
    const descriptor = { runner: { kind: 1, credentialKind: {}, constructor: "x" }, peer: { maxDataClass: {}, endpoint: 5 }, installedBy: { by: [], tool: null, __proto__: 1 } };
    for (const value of WRONG) {
      expect(() => evaluateSemanticRules("service-descriptor", { ...descriptor, runner: value, installedBy: value, peer: { endpoint: value } })).not.toThrow();
      expect(() => evaluateSemanticRules("service-runner", { descriptor: { ...descriptor, runner: value }, catalogue: [1, { kind: 2 }, value], derived: value })).not.toThrow();
      expect(() => evaluateSemanticRules("service-peer-request", { descriptor: { peer: { maxDataClass: value } }, dataClass: value, sent: true })).not.toThrow();
    }
    expect(() => evaluateSemanticRules("service-peer-request", { descriptor: { peer: { maxDataClass: "toString" } }, dataClass: "valueOf", sent: true })).not.toThrow();
  });
});

// DEC-0082 review: a member that is an object whose toString is not a function (valid JSON) reaches no String() call.
describe("members shaped {toString: 1} answer with findings, never a throw (DEC-0082)", () => {
  const bad = { toString: 1 };
  it("reads nested placements and secrets of that shape", () => {
    const record = {
      machines: [{ id: bad, deviceKeys: [{ kid: bad, use: bad, publicKey: "AA" }], hubKey: { kid: bad, x: "AA" },
        packages: [{ agentRef: bad, digest: bad, publisherKid: bad, context: bad, grant: bad }, { agentRef: bad, context: bad, grant: "urn:g" }],
        secrets: [{ agentRef: bad, slot: bad, from: bad, context: bad }, { agentRef: bad, slot: bad, from: bad, context: bad }] }],
      publisherKeys: [{ kid: bad }, { kid: bad }], shareGrants: [{ meta: { id: bad }, principalKind: "external", context: bad }],
      revocations: [{ kind: bad, ref: bad }, { kind: "grant", ref: bad }], authorities: [{ credentialId: bad, alg: bad }],
      issuedAt: bad, validUntil: bad, revision: bad
    };
    expect(() => evaluateSemanticRules("estate-record", record)).not.toThrow();
    expect(() => evaluateSemanticRules("estate-record-revision", { parent: record, next: record })).not.toThrow();
    for (const context of [undefined, bad, "org:a"]) {
      expect(() => evaluateSemanticRules("estate-placement", { record, machine: bad, package: { agentRef: bad, secrets: [{ name: bad }] }, context })).not.toThrow();
    }
    expect(() => evaluateSemanticRules("grant", { principalKind: "external", context: bad })).not.toThrow();
  });
  it("reads grant.usage events whose members are objects", () => {
    const event = (data: unknown) => ({ kind: "grant.usage", eventId: bad, occurred: bad, collector: { id: bad, epoch: bad }, seq: bad, data });
    const shapes = [{ day: bad, grantId: bad, calls: bad, unpricedCalls: bad, costUsd: bad }, { day: "2026-10-12", grantId: bad, calls: 2, unpricedCalls: 3, costUsd: bad }, bad];
    for (const data of shapes) {
      expect(() => evaluateSemanticRules("telemetry-event", event(data))).not.toThrow();
      expect(() => evaluateSemanticRules("activity-batch", { device: { id: bad }, events: [event(data), event(data)] })).not.toThrow();
    }
  });
});

// DEC-0082 review, final round: every rule kind of the register, fed {"toString": 1} members, answers with findings or
// none, never a throw. Three feeds: every member this file names holding it; every leaf and node of every semantic
// fixture replaced by it, one at a time; and every positive fixture of a swept schema, the same way.
describe("every rule kind tolerates {toString: 1} members (DEC-0082)", () => {
  const root = projectRoot();
  const BAD = { toString: 1 };
  const register = readFileSync(path.join(root, "docs/specification/conformance.md"), "utf8");
  const ALL_KINDS = [...new Set(register.split("\n").flatMap((line) => {
    const match = /^\| `FAC-SEM-\d+` \| (.*?) \|/.exec(line);
    return match ? [...(match[1] as string).matchAll(/`([a-z][a-z0-9-]*)`/g)].map((m) => m[1] as string) : [];
  }))].sort();
  type Path = Array<string | number>;
  function* nodes(value: unknown, at: Path = []): Generator<Path> {
    yield at;
    if (value !== null && typeof value === "object") for (const [key, child] of Object.entries(value)) yield* nodes(child, [...at, Array.isArray(value) ? Number(key) : key]);
  }
  const replaced = (input: unknown, at: Path): unknown => {
    if (at.length === 0) return BAD;
    const copy = structuredClone(input) as Record<string | number, unknown>;
    let node: Record<string | number, unknown> = copy;
    for (const key of at.slice(0, -1)) node = node[key] as Record<string | number, unknown>;
    node[at[at.length - 1] as string | number] = BAD;
    return copy;
  };
  const poisonEach = (kind: string, input: unknown) => {
    for (const at of nodes(input)) expect(() => evaluateSemanticRules(kind, replaced(input, at)), `${kind} at /${at.join("/")}`).not.toThrow();
  };

  it("reads every kind of the register", () => {
    expect(ALL_KINDS.length).toBeGreaterThanOrEqual(90);
    expect(ALL_KINDS).toContain("grant");
  });

  it.each(ALL_KINDS)("%s: every named member, and every member of a nested object, holding {toString: 1}", (kind) => {
    expect(() => evaluateSemanticRules(kind, filled(MEMBERS, BAD))).not.toThrow();
    const nested = Object.fromEntries(MEMBERS.map((name) => [name, [BAD, { ...filled(MEMBERS, BAD) }]]));
    expect(() => evaluateSemanticRules(kind, nested)).not.toThrow();
    expect(() => evaluateSemanticRules(kind, Object.fromEntries(MEMBERS.map((name) => [name, filled(MEMBERS, BAD)])))).not.toThrow();
  });

  const semantic = readdirSync(path.join(root, "fixtures/semantic")).flatMap((name) => {
    const fixture = JSON.parse(readFileSync(path.join(root, "fixtures/semantic", name), "utf8")) as { kind?: unknown; input?: unknown };
    return typeof fixture.kind === "string" ? [[name, fixture.kind, fixture.input] as const] : [];
  });
  it.each(semantic)("semantic fixture %s: each leaf and node replaced in turn", (_name, kind, input) => poisonEach(kind, input));

  const SCHEMA_KIND: Readonly<Record<string, string>> = {
    "approval.schema.json": "approval-claims", "delegation-token.schema.json": "delegation-claims", "governance.schema.json": "grant",
    "fabric-package.schema.json": "package", "versioned-setting.schema.json": "versioned-setting", "result.schema.json": "result",
    "roles.schema.json": "roles", "coordination.schema.json": "coordination", "comms-directory.schema.json": "comms-directory",
    "comms-message.schema.json": "comms-message", "comms-submit.schema.json": "comms-submit", "fabric-proposal.schema.json": "proposal",
    "service-events-page.schema.json": "service-events-page", "service-usage.schema.json": "service-usage", "settings-backup.schema.json": "settings-backup",
    "session-handoff.schema.json": "session-handoff", "runner-route.schema.json": "runner-route", "runners.schema.json": "runner-catalogue",
    "openrouter-attribution.schema.json": "openrouter-attribution", "device-check-in.schema.json": "device-check-in", "manifest.schema.json": "manifest",
    "provider.schema.json": "provider-entry", "service-descriptor.schema.json": "service-descriptor", "service-well-known.schema.json": "service-well-known",
    "telemetry-event.schema.json": "telemetry-event", "activity-batch.schema.json": "activity-batch", "estate-record.schema.json": "estate-record",
    "window-lease.schema.json": "window-lease", "entitlement.schema.json": "entitlement", "entitlement-key-set.schema.json": "entitlement-key-set", "revocation-delta.schema.json": "revocation-delta", "heartbeat.schema.json": "heartbeat",
    "relay-frame.schema.json": "relay-frame", "secret-envelope.schema.json": "secret-envelope", "spend-policy.schema.json": "spend-policy",
    "model-profile.schema.json": "model-profiles", "registry-models.schema.json": "model-catalogue", "runner-profile.schema.json": "runner-profile",
    "activity-summary.schema.json": "activity-summary"
  };
  const catalogue = JSON.parse(readFileSync(path.join(root, "fixtures/catalogue.json"), "utf8")) as Array<{ schema: string; path: string; valid: boolean }>;
  const positive = catalogue.filter((entry) => entry.valid && SCHEMA_KIND[entry.schema]).map((entry) => [entry.path, SCHEMA_KIND[entry.schema] as string] as const);
  it.each(positive)("positive fixture %s: each leaf and node replaced in turn", (file, kind) => {
    const input = JSON.parse(readFileSync(path.join(root, "fixtures", file), "utf8")) as unknown;
    poisonEach(kind, input);
    if (kind === "grant") poisonEach("grant-window", input);
    if (kind === "grant") poisonEach("grant-spend", input);
  });
});
