import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { KIND_OF_SCHEMA } from "../src/semantic-kinds.js";

// Every positive fixture a single-document rule applies to passes the semantic rules: a rule that refused the
// repository's own valid example would otherwise stay green (F-B-201, the 2026-10-11 board run).
const root = projectRoot();
interface Entry { name: string; schema: string; path: string; valid: boolean }
const catalogue = JSON.parse(readFileSync(path.join(root, "fixtures/catalogue.json"), "utf8")) as Entry[];

// The rule kind that reads one document of a schema whole is the registry's (REQ-02, src/semantic-kinds.ts).

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
  "comms-host-wait.schema.json",
  "comms-list.schema.json",
  "comms-message-ref.schema.json",
  "comms-page.schema.json",
  "comms-progress.schema.json",
  "comms-read-ack.schema.json",
  "comms-receipt.schema.json",
  "comms-reconcile.schema.json",
  "comms-refusal.schema.json",
  "comms-reply.schema.json",
  "comms-responder-replace.schema.json",
  "comms-status-args.schema.json",
  "comms-status.schema.json",
  // The coding-agent catalogue (DEC-0093) has no rule kind; test/coding-agents.test.ts reads the real catalogue.
  "coding-agents.schema.json",
  "conformance-report.schema.json",
  "contract-pin.schema.json",
  "delegation-jwks.schema.json",
  "delegation-refusal.schema.json",
  "device-root-certification.schema.json",
  "device-enrollment.schema.json",
  "device-health.schema.json",
  "device-key-set.schema.json",
  "device-organization-closed.schema.json",
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
  "repair-request.schema.json",
  "repair-result.schema.json",
  "runner-route-event.schema.json",
  "service-dashboard-extension.schema.json",
  "service-connections-extension.schema.json",
  "schema-unsupported.schema.json",
  "service-login-code.schema.json",
  "work.schema.json",
  "local-channel.schema.json",
  "learning-note.schema.json",
  "learning-note-answer.schema.json",
  // A pairing message is read by the pairing functions (src/pairing.ts, DEC-0084), against its commitment or the other
  // side's reveal, never whole by a rule kind.
  "pairing-message.schema.json",
  // The agent network (DEC-0104): a directory is checked against what it derives from (kind `agent-directory-view`), the
  // load extension and fabric.job.list are shapes only.
  "agent-directory.schema.json",
  "interop-job-list.schema.json",
  "interop-job-list-request.schema.json",
  "service-load-extension.schema.json"
];

describe("every positive fixture passes the semantic rules", () => {
  const swept = catalogue.filter((entry) => entry.valid && KIND_OF_SCHEMA[entry.schema]);

  it.each(swept)("$name", (entry) => {
    const value = JSON.parse(readFileSync(path.join(root, "fixtures", entry.path), "utf8")) as unknown;
    expect(evaluateSemanticRules(KIND_OF_SCHEMA[entry.schema] as string, value)).toEqual([]);
  });

  it("names only kinds a rule reads and schemas that exist, and sweeps a fixture of each", () => {
    const sources = ["semantic-rules", "job-limits", "registry-rules", "interop-rules", "route-rules", "activity-rules", "device-rules", "delegation-rules", "session-handoff", "profile-rules", "package-rules", "estate-record-rules", "enroll-token", "relay-rules", "revocation-delta-rules", "window-lease", "entitlement", "share-registration", "openrouter-attribution", "core-rules", "protocol-revisions", "feed-data", "proposal-rules", "node-summary", "agent-network"]
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
