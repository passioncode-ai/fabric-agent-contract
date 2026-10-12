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
      include: ["src/*-rules.ts", "src/canonical.ts", "src/comms-digest.ts", "src/delegation.ts", "src/ed25519.ts", "src/grant-projection.ts", "src/fabric-links.ts", "src/secret-shape.ts", "src/session-handoff.ts", "src/operator-session.ts", "src/p256.ts", "src/relay.ts", "src/secret-envelope.ts", "src/webauthn.ts", "src/dashboard-declaration.ts", "src/service-supervisor.ts", "src/windows-token.ts", "src/http-signature.ts", "src/revocation-delta.ts", "src/rfc3339.ts", "src/hub-key-rules.ts", "src/window-lease.ts", "src/signing-challenges.ts", "src/core-rules.ts", "src/openrouter-attribution.ts", "src/protocol-revisions.ts", "src/local-channel.ts", "src/session-join.ts", "src/app-descriptor.ts", "src/relay-vectors.ts", "src/schema-closure.ts", "src/feed-data.ts", "src/identifiers.ts"],
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: {
        // The whole set: a new rule file is measured from its first commit, before it has its own floor.
        branches: 86.85,
        "src/activity-rules.ts": { branches: 91.54 },
        "src/canonical.ts": { branches: 100 },
        "src/comms-digest.ts": { branches: 100 },
        "src/dashboard-declaration.ts": { branches: 100 },
        "src/delegation-rules.ts": { branches: 100 },
        "src/descriptor-rules.ts": { branches: 100 },
        "src/delegation.ts": { branches: 100 },
        "src/device-rules.ts": { branches: 97.35 },
        "src/device-transport-rules.ts": { branches: 100 },
        "src/ed25519.ts": { branches: 100 },
        "src/estate-record-rules.ts": { branches: 100 },
        "src/p256.ts": { branches: 100 },
        "src/relay.ts": { branches: 100 },
        "src/relay-rules.ts": { branches: 100 },
        "src/relay-vectors.ts": { branches: 100 },
        "src/revocation-delta.ts": { branches: 100 },
        "src/revocation-delta-rules.ts": { branches: 100 },
        "src/core-rules.ts": { branches: 100 },
        "src/usage-rules.ts": { branches: 100 },
        "src/openrouter-attribution.ts": { branches: 100 },
        "src/window-lease.ts": { branches: 100 },
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
        "src/interop-rules.ts": { branches: 88.46 },
        "src/operator-session.ts": { branches: 100 },
        "src/package-rules.ts": { branches: 100 },
        "src/profile-rules.ts": { branches: 100 },
        "src/registry-rules.ts": { branches: 90.54 },
        "src/route-rules.ts": { branches: 92.8 },
        "src/secret-shape.ts": { branches: 100 },
        "src/semantic-rules.ts": { branches: 90.95 },
        "src/service-supervisor.ts": { branches: 100 },
        "src/session-handoff.ts": { branches: 88.91 },
        "src/spend-rules.ts": { branches: 87.09 },
        "src/webauthn.ts": { branches: 100 },
        "src/windows-token.ts": { branches: 100 }
      }
    }
  }
});
