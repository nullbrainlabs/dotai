# dotai

Configure once, generate for all AI coding tools.

`dotai` reads a single `.ai/` config directory and emits native configuration files for Claude Code, Cursor, Codex, OpenCode, GitHub Copilot, and Antigravity.

> **Alpha** — this tool is under active development. Expect breaking changes.

## Install

```bash
npm install -g @nullbrain/dotai
```

## Quick start

```bash
# Scaffold a new .ai/ directory
dotai init

# Generate config files for all targets
dotai sync

# Generate for specific targets
dotai sync --target claude cursor

# Check config validity
dotai check

# See what's changed since last sync
dotai status
```

## How it works

You define your AI coding config once in `.ai/`:

```
.ai/
  config.yaml          # MCP servers, permissions, hooks, ignore patterns
  directives/          # Markdown instruction files
    code-style.md
    testing.md
  skills/              # Reusable skill definitions
    commit/SKILL.md
  agents/              # Agent definitions
    reviewer.md
```

Then `dotai sync` generates the native config files each tool expects:

| Target | Output |
|--------|--------|
| Claude Code | `CLAUDE.md`, `.claude/`, `.mcp.json` |
| Cursor | `.cursor/`, `.cursorrules` |
| Codex | `AGENTS.md`, `.codex/` |
| OpenCode | `AGENTS.md`, `opencode.json` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.copilot/` |
| Antigravity | `ANTIGRAVITY.md` |

## Import existing config

Already have config files for one tool? Import them:

```bash
# Import from existing Claude Code config
dotai import --source claude

# Import from Cursor
dotai import --source cursor
```

## Commands

| Command | Description |
|---------|-------------|
| `dotai init` | Scaffold a `.ai/` directory with guided setup |
| `dotai sync` | Generate config files for target tools |
| `dotai check` | Validate config and report compatibility |
| `dotai status` | Show sync state and detect manual edits |
| `dotai import` | Import config from an existing tool |
| `dotai add` | Add a directive, skill, or agent |

## Programmatic usage

```typescript
import { loadConfig, emitAll } from "@nullbrain/dotai";

const config = await loadConfig({ scope: "project" });
const files = emitAll(config);
```

## License

MIT
