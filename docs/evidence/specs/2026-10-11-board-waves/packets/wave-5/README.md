# Wave 5 packets — the 0.1.0 core and interop and usage

Wave 5 of the [plan](../../plan.md): nodes N10, N11 and N19 of the [canvas](../../canvas.md). The rules are
[wave 4's](../wave-4/README.md) and those it links. These are added:

- **The owner session builds.** Subagents are at their weekly limit until 2026-10-17, so the owner session writes the
  packets, runs the gate and records the three readings as owed (row W4-READINGS-OWED in N19) instead of claiming them.
- **A promise either gets a rule or is worded as the host's.** Where a spec says something no schema field or rule
  checks, the packet adds a rule a fixture fails, or rewords the sentence to what the schema carries and names the rest
  as a host-side record.
- **Reserved ids that end unused are written down** in the register they were reserved for (see `FAC-SEM-095`).

| Packet | Node | Owns | Order |
|---|---|---|---|
| [P5-01 the 0.1.0 core](P5-01-core.md) | N10 | `src/core-rules.ts` (new), `FAC-SEM-001`/`006` corrections, results, governance, versioning, memory, coordination, execution-context and profiles wording | first |
| [P5-02 interop and usage](P5-02-interop-usage.md) | N11 | DEC-0021 usage receipts and `FAC-SEM-025`'s window, interop.md C3.2, provider.md, the memory pilot's references, the comms comments, adoption statuses, OpenRouter attribution | after P5-01 (both edit the registers) |

N19 is not a packet: it is the owner's queue (the relay audit pull request from Project Observatory's session, the owed
readings of #63–#65, and the agent-sync id receipts report).
