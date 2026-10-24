// #region semantic-kinds (docs: docs/specification/conformance.md#semantic-rule-codes)
/**
 * REQ-02 (contract review 2026-10-21): every kind `evaluateSemanticRules` dispatches, with the input it reads.
 *
 * - `document`: one document, read whole. `schema` names the schema it validates against, a file under `schemas/`,
 *   with a `#/$defs/…` pointer when the document is one definition of that file; a kind without `schema` reads a
 *   record the contract publishes no schema for.
 * - `wrapper`: an object whose `members` hold the documents (and the facts, such as a clock) the rule reads
 *   together, as `{descriptor, wellKnown}` for `service-observation`.
 *
 * `test/semantic-kinds.test.ts` reads the dispatch in `src/` and fails when a kind is dispatched and not listed here,
 * or listed here and dispatched by no rule; it also holds the semantic fixtures to the members listed. A kind this
 * table does not name is refused by the checker (`pnpm validate --kind`), while `evaluateSemanticRules` keeps
 * answering an unknown kind with no finding, because consumers vendor it and read that answer.
 */
export type SemanticKind =
  | { readonly input: "document"; readonly schema?: string }
  | { readonly input: "wrapper"; readonly members: readonly string[] };

const doc = (schema?: string): SemanticKind => (schema === undefined ? { input: "document" } : { input: "document", schema });
const wrap = (...members: string[]): SemanticKind => ({ input: "wrapper", members });

export const SEMANTIC_KINDS: Readonly<Record<string, SemanticKind>> = Object.freeze({
  "access-log-disclosure": wrap("log", "consents"),
  "action-call": wrap("action", "tier", "caller", "decision", "target", "elicited", "approval", "actionDigest", "humanStepUrl", "now", "answer"),
  "activity-ack": wrap("known", "batch", "ack"),
  "activity-batch": doc("activity-batch.schema.json"),
  "activity-summary": doc("activity-summary.schema.json"),
  "agent-directory-view": wrap("source", "record", "orgId", "held", "own", "unlisted", "viewer", "at", "directory"),
  "approval-claims": doc("approval.schema.json"),
  "binding-bundle": wrap("binding", "admission"),
  "call-record": doc("call-record.schema.json"),
  "credential-decision": wrap("request", "decision"),
  "credential-envelope-check": wrap("envelope", "context", "answer"),
  "credential-exchange": wrap("sent", "response"),
  "credential-request": wrap("request", "org"),
  "credential-request-document": doc("credential-request.schema.json"),
  "comms-directory": doc("comms-directory.schema.json"),
  "comms-message": doc("comms-message.schema.json"),
  "comms-submit": doc("comms-submit.schema.json"),
  "comms-transition": doc(),
  coordination: doc("coordination.schema.json"),
  "deep-link": wrap("url"),
  "delegation-claims": doc("delegation-token.schema.json"),
  "delegation-hub-key": wrap("record", "kid", "x", "at", "answer", "applied"),
  "delegation-mint": wrap("grant", "token", "parent", "meter"),
  "delta-freshness": wrap("at", "applied", "heartbeat", "broken", "answer"),
  "delta-reconciliation": wrap("revision", "entries"),
  "device-action": wrap("layers", "at", "action", "decision", "acknowledgedAt"),
  "device-attribution": wrap("binding", "epochs", "batch", "checkIn"),
  "device-check-in": doc("device-check-in.schema.json"),
  "device-enrollment": wrap("request", "response", "issuedEpochs", "proof", "enrolled", "token"),
  "device-health-observation": wrap("known", "batch", "effective", "health", "checkIn"),
  "device-key-set": wrap("root", "current", "next"),
  "device-policy-resolution": wrap("layers", "effective"),
  "device-policy-update": wrap("current", "next", "trustedKeys", "at", "rootKeyId"),
  "device-request-signature": wrap("request", "publicBaseUrl", "certificates", "at", "answer", "clientCertificateSerial", "seen"),
  "device-root-certification": wrap("pinned", "root", "certification", "revocations", "at"),
  "device-rotation": wrap("answered", "request", "response"),
  "enroll-token": doc("enroll-token.schema.json"),
  entitlement: doc("entitlement.schema.json"),
  "entitlement-key-set": doc("entitlement-key-set.schema.json"),
  "estate-placement": wrap("record", "machine", "package", "context"),
  "estate-record": doc("estate-record.schema.json"),
  "estate-record-revision": wrap("parent", "next"),
  "execution-bundle": wrap("context", "pool"),
  "folder-attribution": wrap("snapshot", "answer"),
  grant: doc("governance.schema.json#/$defs/grant"),
  "grant-spend": doc("governance.schema.json"),
  "grant-usage-join": wrap("event", "binding", "registrations", "answer"),
  "grant-window": wrap("grant", "at"),
  heartbeat: doc("heartbeat.schema.json"),
  "interop-input-requests": wrap("inputRequests"),
  "interop-job": doc("interop-job.schema.json"),
  "interop-job-trace": wrap("job", "meta"),
  "interop-result-trace": wrap("result", "meta"),
  "interop-tool": wrap("capability", "schemas", "tool"),
  "interop-tool-list": wrap("tools"),
  "job-caller": wrap("answer", "now", "action"),
  learning: doc(),
  "learning-rollout": wrap("note", "rollout"),
  "lease-reservation": wrap("lease", "request", "decision"),
  "local-channel-session": wrap("requests"),
  "machine-call": wrap("caller", "target", "capability", "effect", "answer"),
  manifest: doc("manifest.schema.json"),
  "model-catalogue": doc("registry-models.schema.json"),
  "model-profiles": doc("model-profile.schema.json"),
  "node-summary": wrap("summary", "baseline", "org"),
  "node-summary-document": doc("node-summary.schema.json"),
  "openrouter-attribution": doc("openrouter-attribution.schema.json"),
  "org-share-grants": wrap("record", "parent"),
  package: doc("fabric-package.schema.json"),
  "profile-resolution": wrap("catalogue", "profiles", "choices", "resolved", "policy"),
  promotion: doc(),
  proposal: doc("fabric-proposal.schema.json"),
  "proposal-submit": wrap("proposal", "to"),
  "proposal-transition": wrap("from", "to", "type"),
  protocols: wrap("protocols"),
  "provider-directory": wrap("services", "providers"),
  "provider-entry": doc("provider.schema.json"),
  "provider-observation": wrap("file", "entry", "manifest"),
  "relay-caller": wrap("applied", "self", "from", "at", "freshness", "revocations", "answer"),
  "relay-frame": doc("relay-frame.schema.json"),
  "job-queue": wrap("queue", "running", "limits", "started"),
  "repair-run": wrap("request", "keys", "device", "layers", "at", "notifiedAt", "declined", "answered", "decision", "reason"),
  result: doc("result.schema.json"),
  "revocation-delta": doc("revocation-delta.schema.json"),
  roles: doc("roles.schema.json"),
  "route-bundle": wrap("admissions", "binding", "catalogue"),
  "route-event": wrap("route", "event"),
  runner: doc("runners.schema.json#/$defs/runner"),
  "runner-catalogue": doc("runners.schema.json"),
  "runner-profile": doc("runner-profile.schema.json"),
  "runner-route": doc("runner-route.schema.json"),
  "secret-envelope": doc("secret-envelope.schema.json"),
  "service-descriptor": doc("service-descriptor.schema.json"),
  "service-directory": wrap("descriptors"),
  "service-events-page": doc("service-events-page.schema.json"),
  "service-feed-request": wrap("descriptor", "token", "request"),
  "service-lock-outcome": doc(),
  "service-manifest": wrap("descriptor", "manifest"),
  "service-observation": wrap("descriptor", "wellKnown"),
  "service-peer-request": wrap("sent", "descriptor", "dataClass"),
  "service-runner": wrap("descriptor", "catalogue", "derived", "usage"),
  "service-load": doc("service-load.schema.json"),
  "service-usage": doc("service-usage.schema.json"),
  "service-well-known": doc("service-well-known.schema.json"),
  "session-handoff": doc("session-handoff.schema.json"),
  "session-handoff-folder": wrap("path", "mode", "kind", "permissions", "repository", "entries"),
  "session-join": wrap("events"),
  "settings-backup": doc("settings-backup.schema.json"),
  "share-registration": doc("share-registration.schema.json"),
  "share-registration-derive": wrap("record", "entries", "orgId", "previouslyRegistered", "answer"),
  "share-registration-intake": wrap("held", "registration", "binding", "answer"),
  "signing-credential": doc(),
  "spend-policy": doc("spend-policy.schema.json"),
  "support-quality-daily": doc("support-quality-daily.schema.json"),
  "telemetry-event": doc("telemetry-event.schema.json"),
  usage: doc("common.schema.json#/$defs/usage"),
  "versioned-setting": doc("versioned-setting.schema.json"),
  "window-lease": doc("window-lease.schema.json"),
  "window-lease-division": wrap("limitUsd", "leases", "reports"),
  "windows-token-file": wrap("file", "currentUserSid")
});

/** True for a kind a rule owns; an inherited member name (`toString`) is not a kind. */
export const isSemanticKind = (kind: string): boolean => Object.hasOwn(SEMANTIC_KINDS, kind);

/** The schema a kind's document validates against, or undefined for a wrapper, a record without a schema, or an unknown kind. */
export function schemaOfKind(kind: string): string | undefined {
  const entry = isSemanticKind(kind) ? SEMANTIC_KINDS[kind] : undefined;
  return entry?.input === "document" ? entry.schema : undefined;
}

/** The kinds that read one whole document of `schema` (a file name under `schemas/`). */
export const documentKindsOf = (schema: string): string[] => Object.keys(SEMANTIC_KINDS).filter((kind) => schemaOfKind(kind) === schema);

/** Each published schema that a kind reads whole, with that kind: the table the positive sweep runs (test/positive-sweep.test.ts). */
export const KIND_OF_SCHEMA: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(Object.keys(SEMANTIC_KINDS).flatMap((kind) => {
    const schema = schemaOfKind(kind);
    return schema !== undefined && !schema.includes("#") ? [[schema, kind]] : [];
  }))
);
// #endregion semantic-kinds
