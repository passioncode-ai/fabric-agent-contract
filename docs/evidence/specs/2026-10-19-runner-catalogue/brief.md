# CT-60: the coding-agent catalogue as data in the contract (brief)

Board row CT-60. Asked by Fabric (the operator's walk, OF-11) on thread `617c8cbe` (message `f63e1f06`, 2026-10-19);
accepted on the same thread (`6ffee284`); Switchboard agreed to read the contract's list (`41e010ab`) and asked for
two optional recipes (`ea29f0a8`).

## What changes

DEC-0046 made the runner catalogue's *shape* the contract's (`runners.schema.json`) and its *contents* each host's
(Fabric's `registry/runners.json`). The operator wants one list for every product, so the contents move here:

- `catalogue/runners.json`: one entry per coding agent, validated by `runners.schema.json`, versioned with the contract,
  read by Fabric (which presents and launches from it), Switchboard (accounts and continuation) and any other product.
- Machine state stays with each product: installed, enabled, default, accounts, keys per project.

## New optional members of a runner entry (all additive)

| Member | What |
|---|---|
| `maker` | who makes it, as written by its maker |
| `url` | its documentation or repository, `https` |
| `install` | `[{platform, argv}]`: how to install it, per platform (`macos`, `linux`, `windows`), as argv, never a shell line |
| `launch` | `{argv}`: the interactive launch |
| `permissions` | `{skip: {argv?, env?}, source}`: the argument or environment that skips the agent's permission prompts, and the URL of the agent's own documentation that names it |
| `mcp` | `true` when the agent loads MCP servers (`mcpConfig` says how) |
| `openrouter` | `{baseUrlEnv?, modelEnv?, keyEnv, homeEnv?}`: environment variable names to run it on an OpenRouter key; never a value |
| `proxy` | `{baseUrlEnv, keyCommand?}`: a local proxy's base-URL variable and the command that prints its key; never a value |
| `sources` | every URL an entry's argv came from |

## Rules

- A permission-skipping argv or env is recorded only with a `source` that names it; an entry without one has no
  `permissions` (the product then offers manual approval only).
- Environment members are names (`^[A-Z][A-Z0-9_]{0,63}$`), never values; no member holds a credential (`secretArgument`).
- `kind` is the stable id every product keys its machine state by; a removed agent keeps its id retired, never reused.

## Seed and order

Switchboard's 30 entries (`switchboard_agents`, 2026-10-19) are the seed; each permission argv is checked against the
agent's own documentation, Orca's list as a cross-check only. Order: after CT-57 (DEC-0089) and CT-62 (DEC-0091).
