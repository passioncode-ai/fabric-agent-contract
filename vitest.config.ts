import { defineConfig } from "vitest/config";

// The gate measures this repository only: another session's worktree under `.claude/worktrees/` holds its own copy
// of `test/`, and a run that collected it would report that session's failures as this repository's.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.git/**", ".claude/**"],
    // A ratchet on the rule code's branch coverage (board run 2026-10-11, P1-04): each file's floor is its
    // measured percentage, rounded down; a wave that closes a file's findings raises its floor
    // (docs/evidence/specs/2026-10-11-board-waves/coverage-baseline.md). An uncovered branch is certainly not
    // killed by a test; a covered one is killed only when a planted defect shows it.
    coverage: {
      provider: "v8",
      include: ["src/*-rules.ts", "src/delegation.ts", "src/grant-projection.ts", "src/fabric-links.ts", "src/session-handoff.ts", "src/operator-session.ts"],
      reporter: ["text-summary", "json-summary"],
      reportsDirectory: "coverage",
      thresholds: {
        "src/activity-rules.ts": { branches: 81 },
        "src/delegation-rules.ts": { branches: 80 },
        "src/delegation.ts": { branches: 94 },
        "src/device-rules.ts": { branches: 79 },
        "src/fabric-links.ts": { branches: 93 },
        "src/grant-projection.ts": { branches: 87 },
        "src/interop-rules.ts": { branches: 88 },
        "src/operator-session.ts": { branches: 90 },
        "src/registry-rules.ts": { branches: 90 },
        "src/route-rules.ts": { branches: 92 },
        "src/semantic-rules.ts": { branches: 85 },
        "src/session-handoff.ts": { branches: 88 },
        "src/spend-rules.ts": { branches: 87 }
      }
    }
  }
});
