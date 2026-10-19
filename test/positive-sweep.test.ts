import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// Every positive fixture a single-document rule applies to passes the semantic rules: a rule that refused the
// repository's own valid example would otherwise stay green (F-B-201, the 2026-10-11 board run).
const root = projectRoot();
interface Entry { name: string; schema: string; path: string; valid: boolean }
const catalogue = JSON.parse(readFileSync(path.join(root, "fixtures/catalogue.json"), "utf8")) as Entry[];

/** The rule kind that reads one document of a schema whole. */
export const KIND_OF_SCHEMA: Readonly<Record<string, string>> = {
  "comms-directory.schema.json": "comms-directory",
  "interop-job.schema.json": "interop-job",
  "comms-message.schema.json": "comms-message",
  "activity-batch.schema.json": "activity-batch",
  "fabric-proposal.schema.json": "proposal",
  "versioned-setting.schema.json": "versioned-setting",
  "service-events-page.schema.json": "service-events-page",
  "device-check-in.schema.json": "device-check-in",
  "openrouter-attribution.schema.json": "openrouter-attribution",
  "approval.schema.json": "approval-claims",
  "delegation-token.schema.json": "delegation-claims",
  "estate-record.schema.json": "estate-record",
  "enroll-token.schema.json": "enroll-token",
  "fabric-package.schema.json": "package",
  "governance.schema.json": "grant-spend",
  "activity-summary.schema.json": "activity-summary",
  "comms-submit.schema.json": "comms-submit",
  "coordination.schema.json": "coordination",
  "manifest.schema.json": "manifest",
  "model-profile.schema.json": "model-profiles",
  "provider.schema.json": "provider-entry",
  "registry-models.schema.json": "model-catalogue",
  "relay-frame.schema.json": "relay-frame",
  "revocation-delta.schema.json": "revocation-delta",
  "heartbeat.schema.json": "heartbeat",
  "result.schema.json": "result",
  "roles.schema.json": "roles",
  "runner-profile.schema.json": "runner-profile",
  "runner-route.schema.json": "runner-route",
  "runners.schema.json": "runner-catalogue",
  "secret-envelope.schema.json": "secret-envelope",
  "service-descriptor.schema.json": "service-descriptor",
  "service-usage.schema.json": "service-usage",
  "support-quality-daily.schema.json": "support-quality-daily",
  "service-well-known.schema.json": "service-well-known",
  "session-handoff.schema.json": "session-handoff",
  "settings-backup.schema.json": "settings-backup",
  "spend-policy.schema.json": "spend-policy",
  "telemetry-event.schema.json": "telemetry-event",
  "window-lease.schema.json": "window-lease",
  "entitlement.schema.json": "entitlement",
  "entitlement-key-set.schema.json": "entitlement-key-set",
  "share-registration.schema.json": "share-registration"
};

/**
 * Schemas with positive fixtures and no rule that reads one of their documents whole. Their rules, where they have
 * any, take a wrapped input — a request with its response (`device-enrollment`), a set with the root key it is
 * checked under (`device-key-set`), a batch with its acknowledgement, the interop, route and delegation bundles —
 * and are exercised by their semantic fixtures. A schema with positive fixtures is on one list or the other.
 */
export const NOT_SWEPT: readonly string[] = [
  "access-log.schema.json",
  "activity-batch-ack.schema.json",
  "activity-notice.schema.json",
  "admission.schema.json",
  "binding.schema.json",
  "comms-cancel.schema.json",
  "comms-claim.schema.json",
  "comms-complete.schema.json",
  "comms-directory-args.schema.json",
  "comms-effect-begin.schema.json",
  "comms-enroll.schema.json",
  "comms-fence.schema.json",
  "comms-fenced.schema.json",
  "comms-list.schema.json",
  "comms-message-ref.schema.json",
  "comms-page.schema.json",
  "comms-progress.schema.json",
  "comms-receipt.schema.json",
  "comms-reconcile.schema.json",
  "comms-refusal.schema.json",
  "comms-reply.schema.json",
  "comms-responder-replace.schema.json",
  "comms-status-args.schema.json",
  "comms-status.schema.json",
  "conformance-report.schema.json",
  "contract-pin.schema.json",
  "delegation-jwks.schema.json",
  "delegation-refusal.schema.json",
  "device-root-certification.schema.json",
  "device-enrollment.schema.json",
  "device-health.schema.json",
  "device-key-set.schema.json",
  "device-policy.schema.json",
  "execution-context.schema.json",
  "fabric-link.schema.json",
  "folder-attribution.schema.json",
  "grant-check-request.schema.json",
  "grant-check.schema.json",
  "interop-agent-call.schema.json",
  "interop-capability.schema.json",
  "interop-job-handle.schema.json",
  "interop-job-request.schema.json",
  "interop-job-tool-output.schema.json",
  "interop-request-meta.schema.json",
  "interop-result.schema.json",
  "memory-capability.schema.json",
  "memory.schema.json",
  "operator-channel-status.schema.json",
  "pipeline.schema.json",
  "runner-route-event.schema.json",
  "service-dashboard-extension.schema.json",
  "schema-unsupported.schema.json",
  "service-login-code.schema.json",
  "work.schema.json",
  "local-channel.schema.json",
  "learning-note.schema.json",
  "learning-note-answer.schema.json",
  // A pairing message is read by the pairing functions (src/pairing.ts, DEC-0084), against its commitment or the other
  // side's reveal, never whole by a rule kind.
  "pairing-message.schema.json"
];

describe("every positive fixture passes the semantic rules", () => {
  const swept = catalogue.filter((entry) => entry.valid && KIND_OF_SCHEMA[entry.schema]);

  it.each(swept)("$name", (entry) => {
    const value = JSON.parse(readFileSync(path.join(root, "fixtures", entry.path), "utf8")) as unknown;
    expect(evaluateSemanticRules(KIND_OF_SCHEMA[entry.schema] as string, value)).toEqual([]);
  });

  it("names only kinds a rule reads and schemas that exist, and sweeps a fixture of each", () => {
    const sources = ["semantic-rules", "job-limits", "registry-rules", "interop-rules", "route-rules", "activity-rules", "device-rules", "delegation-rules", "session-handoff", "profile-rules", "package-rules", "estate-record-rules", "enroll-token", "relay-rules", "revocation-delta-rules", "window-lease", "entitlement", "share-registration", "openrouter-attribution", "core-rules", "protocol-revisions", "feed-data", "proposal-rules"]
      .map((name) => readFileSync(path.join(root, "src", `${name}.ts`), "utf8"))
      .join("\n");
    for (const [schema, kind] of Object.entries(KIND_OF_SCHEMA)) {
      expect(sources, kind).toContain(`kind === "${kind}"`);
      expect(catalogue.some((entry) => entry.schema === schema && entry.valid), schema).toBe(true);
    }
    expect(swept.length).toBeGreaterThan(50);
    // A schema with positive fixtures is either swept or listed as having no single-document rule.
    const withFixtures = [...new Set(catalogue.filter((entry) => entry.valid).map((entry) => entry.schema))].sort();
    const placed = withFixtures.filter((schema) => schema in KIND_OF_SCHEMA || NOT_SWEPT.includes(schema));
    expect(placed).toEqual(withFixtures);
    expect(Object.keys(KIND_OF_SCHEMA).filter((schema) => NOT_SWEPT.includes(schema))).toEqual([]);
  });
});
