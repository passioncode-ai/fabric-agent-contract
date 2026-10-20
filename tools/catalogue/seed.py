"""The seed of catalogue/coding-agents.json: Switchboard's agent list of 2026-10-19 (switchboard_agents, schema 1,
revision c23b83f814c04379), catalogue fields only. Machine state (installed, enabled, default, paths) and the operator's
model choices are dropped: a launch argv names no model, and openrouter.modelArgv carries {model}. Permissions are
added in permissions.json, each with its evidence: the maker's documentation (source) or the installed agent's output
(measured)."""
import json, sys

# Raised by one on every change of catalogue/coding-agents.json (DEC-0093).
REVISION = 1

# id, name, maker, url, install (via, package-or-script), launch argv, mcp, openrouter model argv (None: no OpenRouter route)
SEED = [
  ("hermes", "Hermes Agent", "Nous Research", "https://github.com/NousResearch/hermes-agent", ("script", "https://hermes-agent.nousresearch.com/install.sh"), ["hermes"], True, ["--provider", "openrouter", "-m", "{model}"]),
  ("kilo", "Kilo Code + Kilo CLI", "Kilo-Org", "https://github.com/Kilo-Org/kilocode", ("npm", "@kilocode/cli"), ["kilo"], True, ["-m", "openrouter/{model}"]),
  ("claude-code", "Claude Code", "Anthropic", "https://code.claude.com/docs/en/setup", ("script", "https://claude.ai/install.sh"), ["claude"], True, None),
  ("cline", "Cline + Cline CLI", "Cline", "https://github.com/cline/cline", ("npm", "cline"), ["cline"], True, None),
  ("freebuff", "Freebuff", "Codebuff", "https://github.com/CodebuffAI/freebuff", ("npm", "freebuff"), ["freebuff"], True, None),
  ("omp", "omp (oh-my-pi)", "can1357", "https://github.com/can1357/oh-my-pi", ("brew", "can1357/tap/omp"), ["omp"], True, ["--model", "openrouter/{model}"]),
  ("codex", "Codex CLI", "OpenAI", "https://github.com/openai/codex", ("brew-cask", "codex"), ["codex"], True, None),
  ("command-code", "Command Code", "Command Code (commandcode.ai)", "https://commandcode.ai/docs", ("npm", "command-code"), ["cmd"], True, None),
  ("pi", "pi", "Earendil (earendil-works)", "https://github.com/earendil-works/pi", ("script", "https://pi.dev/install.sh"), ["pi"], True, ["--provider", "openrouter", "--model", "{model}"]),
  ("deepseek-harness", "DeepSeek Harness", "DeepSeek", "https://github.com/deepseek-ai/deepseek-harness", None, ["dsh"], True, None),
  ("openclaw", "OpenClaw", "OpenClaw", "https://github.com/openclaw/openclaw", ("script", "https://openclaw.ai/install.sh"), ["openclaw"], True, None),
  ("openhands", "OpenHands CLI", "OpenHands", "https://github.com/OpenHands/OpenHands-CLI", ("uv", "openhands"), ["openhands"], True, None),
  ("zcode", "ZCode", "Z.ai", "https://github.com/zai-org/ZCode", None, ["zcode"], True, None),
  ("kimi-code", "Kimi Code CLI", "Moonshot AI", "https://github.com/MoonshotAI/kimi-code", ("script", "https://code.kimi.com/kimi-code/install.sh"), ["kimi"], True, None),
  ("auggie", "Auggie CLI", "Augment Code", "https://github.com/augmentcode/auggie", ("npm", "@augmentcode/auggie"), ["auggie"], True, None),
  ("aider", "Aider", "Aider-AI", "https://github.com/Aider-AI/aider", ("script", "https://aider.chat/install.sh"), ["aider"], False, ["--model", "openrouter/{model}"]),
  ("opencode", "OpenCode", "anomalyco (formerly sst)", "https://github.com/anomalyco/opencode", ("brew", "anomalyco/tap/opencode"), ["opencode"], True, ["-m", "openrouter/{model}"]),
  ("continue", "Continue + cn", "Continue (continuedev)", "https://github.com/continuedev/continue", ("npm", "@continuedev/cli"), ["cn"], True, None),
  ("goose", "Goose", "aaif-goose (formerly Block)", "https://github.com/aaif-goose/goose", ("brew", "block-goose-cli"), ["goose"], True, None),
  ("gemini-cli", "Gemini CLI", "Google", "https://github.com/google-gemini/gemini-cli", ("brew", "gemini-cli"), ["gemini"], True, None),
  ("qwen-code", "Qwen Code", "QwenLM", "https://github.com/QwenLM/qwen-code", ("brew", "qwen-code"), ["qwen"], True, None),
  ("crush", "Crush", "Charm", "https://github.com/charmbracelet/crush", ("brew", "charmbracelet/tap/crush"), ["crush"], True, None),
  ("zed", "Zed agent", "Zed Industries", "https://github.com/zed-industries/zed", ("brew-cask", "zed"), ["zed"], True, None),
  ("amp", "Amp", "Sourcegraph", "https://ampcode.com", ("script", "https://ampcode.com/install.sh"), ["amp"], True, None),
  ("cursor-agent", "Cursor CLI", "Cursor", "https://cursor.com/docs/cli/installation.md", ("script", "https://cursor.com/install"), ["agent"], True, None),
  ("copilot-cli", "GitHub Copilot CLI", "GitHub", "https://github.com/github/copilot-cli", ("brew", "copilot-cli"), ["copilot"], True, None),
  ("factory-droid", "Factory Droid", "Factory", "https://docs.factory.com/droid-cli/quickstart.md", ("script", "https://app.factory.ai/cli"), ["droid"], True, None),
  ("warp", "Warp", "Warp", "https://github.com/warpdotdev/Warp", ("brew-cask", "warp"), ["warp"], True, None),
  ("kiro", "Kiro CLI", "AWS (Kiro)", "https://kiro.dev/docs/getting-started/installation.md", ("script", "https://cli.kiro.dev/install"), ["kiro-cli"], True, None),
  ("devin", "Devin Desktop / Devin CLI (formerly Windsurf/Cascade)", "Devin (formerly Windsurf)", "https://docs.devin.ai/desktop/getting-started.md", ("script", "https://cli.devin.ai/install.sh"), ["devin"], True, None),
]

# The runner kind the runners page's C2 lists (DEC-0016, DEC-0029, DEC-0046) is the id; Switchboard's earlier name for it is an alias.
ALIASES = {"cursor-agent": ["cursor-cli"], "kiro": ["kiro-cli"]}

def entry(row, permissions):
    id_, name, maker, url, install, argv, mcp, model_argv = row
    out = {"id": id_, "name": name, "maker": maker, "url": url}
    if id_ in ALIASES: out["aliases"] = ALIASES[id_]
    if install:
        via, what = install
        out["install"] = [{"via": via, "script": what} if via == "script" else {"via": via, "package": what}]
    out["launch"] = {"argv": argv}
    if id_ in permissions: out["permissions"] = permissions[id_]
    out["mcp"] = mcp
    if model_argv: out["openrouter"] = {"modelArgv": model_argv}
    source = permissions.get(id_, {}).get("source")
    sources = [url] + ([source] if source and source != url else [])
    out["sources"] = sources
    return out

if __name__ == "__main__":
    permissions = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
    doc = {"schema": "coding-agents/1", "revision": REVISION, "agents": [entry(r, permissions) for r in SEED]}
    print(json.dumps(doc, indent=2, ensure_ascii=False))
