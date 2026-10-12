import { describe, expect, it } from "vitest";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// Every activity, device and estate-record rule kind reads a malformed input — missing members, members of the wrong type — and
// answers with findings or none, never by throwing (CT-25's tolerance, DEC-0052, applied to every input shape).
const KINDS = [
  "telemetry-event", "activity-batch", "activity-ack", "activity-summary", "access-log-disclosure",
  "device-policy-update", "device-policy-resolution", "device-health-observation", "device-enrollment", "device-attribution",
  "device-key-set", "device-action", "device-root-certification",
  "estate-record", "estate-record-revision", "estate-placement"
];
const WRONG: unknown[] = [null, 7, "x", true, [], [null, 3, "y"], { a: null }];
/** An object whose every member named in `names` holds `value`. */
const filled = (names: string[], value: unknown) => Object.fromEntries(names.map((name) => [name, value]));
const MEMBERS = [
  "events", "known", "batch", "ack", "cells", "log", "consents", "current", "next", "trustedKeys", "at", "layers", "effective",
  "checkIn", "health", "request", "response", "enrolled", "token", "proof", "issuedEpochs", "binding", "epochs", "root",
  "action", "decision", "pinned", "certification", "revocations", "data", "collector", "device", "user", "session", "kind",
  "seq", "record", "machine", "package", "parent", "machines", "authorities", "publisherKeys", "shareGrants",
  "revocations", "packages", "secrets", "sourceKey", "source", "eventId", "occurred", "monotonicNs", "acknowledgedAt", "producer", "from", "to", "minPopulation"
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
      batch: { events: [1, { collector: 2, user: 3 }] }, epochs: [1, { binding: 2 }], binding: { device: 3 }
    };
    for (const kind of KINDS) expect(() => evaluateSemanticRules(kind, device), kind).not.toThrow();
  });
});
