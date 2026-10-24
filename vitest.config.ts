import { defineConfig } from "vitest/config";

// The gate measures this repository only: another session's worktree under `.claude/worktrees/` holds its own copy
// of `test/`, and a run that collected it would report that session's failures as this repository's.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.git/**", ".claude/**"],
    // A ratchet on the rule code's branch coverage (board run 2026-10-11, P1-04): each file's floor is its
    // measured percentage, to two decimals; a wave that closes a file's findings raises its floor
    // (docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md). An uncovered branch is certainly not
    // killed by a test; a covered one is killed only when a planted defect shows it.
    coverage: {
      provider: "v8",
      include: ["src/*-rules.ts", "src/canonical.ts", "src/hub-move.ts", "src/credentials.ts", "src/machine-call.ts", "src/comms-digest.ts", "src/delegation.ts", "src/ed25519.ts", "src/grant-projection.ts", "src/fabric-links.ts", "src/secret-shape.ts", "src/session-handoff.ts", "src/operator-session.ts", "src/p256.ts", "src/relay.ts", "src/secret-envelope.ts", "src/webauthn.ts", "src/dashboard-declaration.ts", "src/connections.ts", "src/actions.ts", "src/agent-network.ts", "src/service-supervisor.ts", "src/windows-token.ts", "src/http-signature.ts", "src/revocation-delta.ts", "src/rfc3339.ts", "src/hub-key-rules.ts", "src/window-lease.ts", "src/entitlement.ts", "src/share-registration.ts", "src/job-limits.ts", "src/partner-usage.ts", "src/folder-attribution.ts", "src/signing-challenges.ts", "src/core-rules.ts", "src/openrouter-attribution.ts", "src/protocol-revisions.ts", "src/local-channel.ts", "src/session-join.ts", "src/app-descriptor.ts", "src/relay-vectors.ts", "src/schema-closure.ts", "src/feed-data.ts", "src/privacy-plan.ts", "src/identifiers.ts", "src/comms-hold.ts", "src/comms-finding.ts", "src/context-route.ts", "src/findings.ts", "src/pairing.ts", "src/enroll-token.ts", "src/docs-check.ts", "src/rule-codes.ts", "src/pipeline-check.ts", "src/tracked-files.ts", "src/seq-ranges.ts", "src/service-feed.ts", "src/settings-backup.ts", "src/pin-check.ts", "src/semantic-kinds.ts", "src/validate-cli.ts"],
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: {
        // The whole set: a new rule file is measured from its first commit, before it has its own floor. 86.85 until
        // the contract review of 2026-10-21 (REQ-15) measured the set with the gate's own checkers in it: 98.36
        // (8384 of 8523 branches), floored at 98.3.
        branches: 98.3,
        // 97.16 until DEC-0083 moved the shared `indexed` helper, with its two covered branches, to src/findings.ts:
        // the same nine branches stay uncovered, out of 314 in place of 316.
        "src/activity-rules.ts": { branches: 97.13 },
        "src/canonical.ts": { branches: 100 },
        "src/privacy-plan.ts": { branches: 100 },
        "src/comms-digest.ts": { branches: 100 },
        "src/comms-hold.ts": { branches: 100 },
        "src/comms-finding.ts": { branches: 100 },
        "src/context-route.ts": { branches: 100 },
        "src/context-rules.ts": { branches: 100 },
        "src/dashboard-declaration.ts": { branches: 100 },
        "src/connections.ts": { branches: 100 },
        "src/actions.ts": { branches: 100 },
        "src/agent-network.ts": { branches: 100 },
        "src/machine-call.ts": { branches: 100 },
        "src/hub-move.ts": { branches: 100 },
        "src/credentials.ts": { branches: 100 },
        "src/delegation-rules.ts": { branches: 100 },
        "src/descriptor-rules.ts": { branches: 100 },
        "src/delegation.ts": { branches: 100 },
        "src/device-rules.ts": { branches: 98.87 },
        "src/device-transport-rules.ts": { branches: 100 },
        "src/ed25519.ts": { branches: 100 },
        "src/enroll-token.ts": { branches: 100 },
        "src/estate-record-rules.ts": { branches: 100 },
        "src/findings.ts": { branches: 100 },
        "src/semantic-kinds.ts": { branches: 100 },
        // REQ-01: every branch but the process entry (`if (process.argv[1] && ...)`), which only a spawned run takes and
        // a spawned process is not measured; test/validate-cli.test.ts runs it once as a command.
        "src/validate-cli.ts": { branches: 99.4 },
        "src/p256.ts": { branches: 100 },
        "src/pairing.ts": { branches: 100 },
        // The contract review of 2026-10-21 (REQ-07) brought the pin:check CLI under the ratchet, its main() included.
        "src/pin-check.ts": { branches: 100 },
        "src/relay.ts": { branches: 100 },
        "src/relay-rules.ts": { branches: 100 },
        "src/relay-vectors.ts": { branches: 100 },
        "src/revocation-delta.ts": { branches: 100 },
        "src/revocation-delta-rules.ts": { branches: 100 },
        "src/core-rules.ts": { branches: 100 },
        "src/usage-rules.ts": { branches: 100 },
        "src/openrouter-attribution.ts": { branches: 100 },
        "src/window-lease.ts": { branches: 100 },
        "src/entitlement.ts": { branches: 100 },
        "src/share-registration.ts": { branches: 100 },
        "src/job-limits.ts": { branches: 100 },
        "src/folder-attribution.ts": { branches: 100 },
        "src/support-quality-rules.ts": { branches: 100 },
        "src/partner-usage.ts": { branches: 100 },
        "src/schema-closure.ts": { branches: 100 },
        "src/signing-challenges.ts": { branches: 100 },
        "src/protocol-revisions.ts": { branches: 100 },
        "src/local-channel.ts": { branches: 100 },
        "src/session-join.ts": { branches: 100 },
        "src/app-descriptor.ts": { branches: 100 },
        "src/feed-data.ts": { branches: 100 },
        "src/identifiers.ts": { branches: 100 },
        "src/rfc3339.ts": { branches: 100 },
        "src/secret-envelope.ts": { branches: 100 },
        "src/fabric-links.ts": { branches: 97.61 },
        "src/grant-projection.ts": { branches: 87.8 },
        "src/http-signature.ts": { branches: 100 },
        "src/hub-key-rules.ts": { branches: 100 },
        "src/interop-rules.ts": { branches: 93.26 },
        "src/operator-session.ts": { branches: 100 },
        "src/package-rules.ts": { branches: 100 },
        "src/profile-rules.ts": { branches: 100 },
        "src/registry-rules.ts": { branches: 98.64 },
        "src/route-rules.ts": { branches: 98.44 },
        "src/secret-shape.ts": { branches: 100 },
        "src/semantic-rules.ts": { branches: 98.49 },
        "src/service-supervisor.ts": { branches: 100 },
        "src/session-handoff.ts": { branches: 93.51 },
        "src/spend-rules.ts": { branches: 100 },
        "src/webauthn.ts": { branches: 100 },
        "src/windows-token.ts": { branches: 100 },
        // The gate's own checkers (REQ-15 of the contract review, 2026-10-21), each at its measured value. Below 100:
        // docs-check (checkMermaid, the repository-wide run and its command line, which the gate runs as
        // `pnpm docs:check`, not in a test), pipeline-check and rule-codes (branches no test reaches yet). A test that
        // reaches one raises the floor.
        "src/docs-check.ts": { branches: 67.81 },
        "src/pipeline-check.ts": { branches: 84.02 },
        "src/proposal-rules.ts": { branches: 100 },
        "src/rule-codes.ts": { branches: 76.92 },
        "src/seq-ranges.ts": { branches: 100 },
        "src/service-feed.ts": { branches: 100 },
        "src/settings-backup.ts": { branches: 100 },
        "src/tracked-files.ts": { branches: 100 }
      }
    }
  }
});
