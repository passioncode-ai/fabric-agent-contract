# Handoff: the repository standard and the organization's licence (2026-09-30)

## Objective

Bring the contract repository onto the PassionCode.ai repository standard (fabric-workspace
`knowledge/repository-standard.md`, rules F1–F11) and the licence of Fabric ADR-0092
(`AGPL-3.0-only OR LicenseRef-PassionCode-Commercial`). No normative text, schema, fixture or
check changes.

## Done

- `LICENSE` (unmodified AGPL-3.0), `COMMERCIAL-LICENSE.md` and `CLA.md`, byte for byte the
  knowledge base templates; `package.json` `license` set, its description no longer calls the
  contract private architecture (the repository stays private).
- README: the first heading stays `# Fabric Agent Contract` under the logo; the first paragraph
  says what the contract is, in the knowledge base's terms; `## Quick start for a new teammate`
  (Install / Configure / MCP — none, the contract is what MCP surfaces are checked against — /
  Develop) replaces "Validate"; `## License` in the licensing wording, with the unlicensed history
  and the operator's open question CO-KB-02.
- AGENTS.md: *Read first*, *What this repository is*, *Commands*, *Local rules* (the existing
  coordination text), the org-index back-link, *After work*.
- `.markdownlint-cli2.jsonc`: MD034 (bare URL) off, with the reason in the file — the templates,
  the licensing wording and the read-first block carry bare addresses and are copied byte for
  byte; with MD034 on, `pnpm run check` failed on exactly those four places.
- No guarded file was edited (`docs/DECISIONS.md`, `docs/OPEN_QUESTIONS.md`, `*-modules.md`), so no
  lease was taken; `agent_sync.py status`: lease git (exclusive across machines), record plane fs,
  no leases held, none by other runs.

## Checks run

| Command | Exit |
|---|---|
| `pnpm run check` on `main` before the change | 0 |
| `pnpm run check` after | 0 |
| org-index `check_format.py --offline --repo fabric-agent-contract` | 0 (before, on `main`: 8 findings — F2 F3 F4 F5 F7 F8 F9 F11) |
| org-index `check_names.py --offline` | 0 |

Hosted CI (`.github/workflows/ci.yml`) is not a result: Actions for the organization's private
repositories is held by the spending cap.

## Open

- CO-KB-02 (knowledge base `licensing.md`): keep the schemas AGPL, as decided, or give them a
  permissive exception so a closed-source host can implement them. The operator's call.
- The consumer pins (adapter `2ea54f7`) do not move: this commit changes no schema.

## Next task

None in this repository for the standard. The next contract change starts from the knowledge
base read-first block in `AGENTS.md`.
