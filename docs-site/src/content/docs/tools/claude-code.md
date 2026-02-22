---
title: Claude Code
description: How dotai generates Claude Code configuration.
---

Claude Code has the richest configuration surface of any supported tool. It supports all 8 entity types and all scope tiers (enterprise, project, and user) — the only exception is local settings files, which are intentionally excluded from dotai management.

## Supported Features

- Conditional directives with intelligent selection
- Skills
- Sub-agents
- MCP servers
- Full lifecycle hooks (all 10 events)
- Per-tool permissions with `allow`, `deny`, and `ask` decisions
- Enterprise, project, and user scope

## Generated Files

| dotai Source | Generated File |
|---------------|---------------|
| Directives (`alwaysApply: true`) | `CLAUDE.md` |
| Directives (`alwaysApply: false`) | `.claude/rules/*.md` |
| Skills | `.claude/skills/<name>/SKILL.md` |
| Agents | `.claude/agents/*.md` |
| Servers | `.mcp.json` |
| Hooks | `.claude/settings.json` (hooks) |
| Permissions | `.claude/settings.json` (permissions) |
| Ignore patterns | `.claude/settings.json` (deny rules) |

## Entity Details

### Directives

Directives with `alwaysApply: true` are concatenated and written to `CLAUDE.md` at the project root. Directives with `alwaysApply: false` are written as individual markdown files under `.claude/rules/`, each with a YAML frontmatter block that carries the directive's `description` and any glob patterns used for intelligent selection.

### Agents

Each agent is written as a markdown file under `.claude/agents/` with YAML frontmatter. The frontmatter carries the agent's `name`, `description`, `model`, `readonly` flag, and any `tools` restrictions. The markdown body contains the agent's system prompt.

### MCP Servers

MCP servers are written to `.mcp.json` under the `mcpServers` key. Each entry is keyed by server name and includes the server's `command`, `args`, `env`, and optionally `enabledTools` or `disabledTools` for tool filtering.

### Hooks

Claude Code supports 10 lifecycle events: `PreToolUse`, `PostToolUse`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `UserPromptSubmit`, `UserPromptSubmitComplete`, `Start`, and `AgentStart`. Hooks are written to `.claude/settings.json` under the `hooks` key. Each hook entry includes the event name, the matcher (tool name or glob), and the command to run.

### Permissions

Permissions are written to `.claude/settings.json` under the `permissions` key. Rules can be scoped per tool and include argument pattern matching. Each rule carries an `allow`, `deny`, or `ask` decision. Ignore patterns are expressed as `deny` rules on the `Edit` and `Write` tools with glob path matchers.
