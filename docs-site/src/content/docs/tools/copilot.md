---
title: GitHub Copilot
description: How dotai generates GitHub Copilot configuration.
---

GitHub Copilot supports rules, skills, agents, MCP servers, and most lifecycle hooks. It does not support file-based permissions, file-based settings, or ignore patterns.

## Generated Files

| dotai Source | Generated File |
|---|---|
| Rules (`alwaysApply: true`) | `.github/copilot-instructions.md` |
| Rules (scoped) | `.github/instructions/*.instructions.md` |
| Skills | `.github/skills/<name>/SKILL.md` |
| Agents | `.github/agents/*.agent.md` |
| Servers | `.vscode/mcp.json` |
| Hooks | `.github/hooks/dotai.hooks.json` |
| Permissions | Not generated (warning) |
| Ignore patterns | Not generated (warning) |
| Settings | Not generated (warning) |

## Entity Details

### Rules

Always-apply rules (`alwaysApply: true`) are concatenated into `.github/copilot-instructions.md`. Scoped rules are emitted as individual files under `.github/instructions/` with an `applyTo` frontmatter field set to comma-separated glob patterns from the rule's `globs` array.

### Agents

Agents are emitted as markdown files with YAML frontmatter using the `.agent.md` extension under `.github/agents/`. Tool names are mapped from dotai's internal names to Copilot's expected values:

| dotai tool | Copilot tool |
|---|---|
| `Read` | `read` |
| `Write`, `Edit` | `edit` |
| `Bash`, `Shell` | `execute` |
| `Search` | `search` |
| `WebSearch`, `WebFetch` | `web` |

Model override is not supported for Copilot agents.

### MCP

MCP servers are written to `.vscode/mcp.json`. An explicit `type` field is required on all entries, including `stdio` servers. Note that this file configures VS Code Copilot Chat. For the Copilot coding agent, MCP servers must be configured in your GitHub repository settings.

### Hooks

Copilot supports 8 of the 10 dotai lifecycle events. The `preFileEdit` and `postFileEdit` events are not generated.

## Known Limitations

- No file-based permissions support.
- No file-based settings support.
- No ignore patterns support.
- Agent model override is not supported.
- The `preFileEdit` and `postFileEdit` hook events are not generated.
- Project scope only.
