---
title: Importing Existing Configs
description: How to import existing AI tool configurations into .ai/ format.
---

Already using Claude Code, Cursor, Codex, or GitHub Copilot? The `import` command scans your existing configuration and converts it to `.ai/` format.

## Usage

```bash
dotai import
```

The command auto-detects which tools have configuration in your project and imports from all of them.

To import from a specific tool:

```bash
dotai import --from claude-code
dotai import --from cursor
dotai import --from codex
```

## What Gets Imported

### From Claude Code

| Source | Imported as |
|--------|-----------|
| `CLAUDE.md` | Rule (alwaysApply: true) |
| `.claude/rules/*.md` | Rule (with frontmatter) |
| `.claude/skills/*/SKILL.md` | Skill |
| `.claude/agents/*.md` | Agent |
| `.mcp.json` | ToolServer entries |
| `.claude/settings.json` (permissions) | Permission entries |
| `.claude/settings.json` (hooks) | Hook entries |

### From Cursor

| Source | Imported as |
|--------|-----------|
| `.cursor/rules/*.mdc` | Rule (`globs` → `appliesTo`) |
| `.cursor/skills/*/SKILL.md` | Skill |
| `.cursor/agents/*.md` | Agent |
| `.cursor/mcp.json` | ToolServer entries |
| `.cursorignore` | IgnorePattern entries |

### From Codex

| Source | Imported as |
|--------|-----------|
| `AGENTS.md` | Rule (alwaysApply: true) |
| `.codex/skills/*/SKILL.md` | Skill |
| `.codex/config.toml` (agents) | Agent entries |
| `.codex/config.toml` (mcp_servers) | ToolServer entries |
| `.codex/config.toml` (approval_policy) | Permission entries |

## After Import

After importing, review the generated `.ai/` directory:

```bash
dotai status    # See what was imported
dotai check     # Validate the configuration
dotai sync      # Generate output for all tools
```

:::tip
Import is non-destructive — it creates `.ai/` files but does not modify your existing tool configs. Run `dotai sync` when you're ready to regenerate from the unified source.
:::
