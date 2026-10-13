import { describe, expect, it } from "vitest";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// Every activity, device, estate-record, hub-key (FAC-SEM-081), relay, revocation-delta (FAC-SEM-082…084), one-copy, Windows token-file, well-known (FAC-SEM-080), descriptor (FAC-SEM-085, FAC-SEM-086), runner (FAC-SEM-087) peer-request (FAC-SEM-088), window-lease (FAC-SEM-089…091), signing-credential (FAC-SEM-092), the identifier-comparing kinds (DEC-0076), openrouter-attribution (FAC-SEM-098), protocols (FAC-SEM-099), session-join (FAC-SEM-100), directory-page (FAC-SEM-107), comms-transition (FAC-SEM-027, FAC-SEM-109), board-finding (FAC-SEM-108) and grant (FAC-SEM-110) rule kind reads a malformed input — missing members, members of the wrong type — and
// answers with findings or none, never by throwing (CT-25's tolerance, DEC-0052, applied to every input shape).
const KINDS = [
  "telemetry-event", "activity-batch", "activity-ack", "activity-summary", "access-log-disclosure",
  "device-policy-update", "device-policy-resolution", "device-health-observation", "device-enrollment", "device-attribution",
  "device-key-set", "device-action", "device-root-certification", "device-request-signature",
  "estate-record", "estate-record-revision", "estate-placement", "secret-envelope", "relay-frame",
  "revocation-delta", "heartbeat", "delta-freshness", "delta-reconciliation",
  "service-well-known", "service-lock-outcome", "windows-token-file", "delegation-hub-key", "service-descriptor", "service-runner", "service-peer-request",
  "window-lease", "window-lease-division", "lease-reservation", "signing-credential", "openrouter-attribution", "protocols", "device-check-in", "local-channel-session", "session-join", "service-events-page", "proposal", "proposal-transition", "proposal-submit", "learning-rollout",
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
  "grant"
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
  "principalKind", "calls", "unpricedCalls", "costUsd", "grantRef", "day"
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
