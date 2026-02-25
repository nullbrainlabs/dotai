---
title: Compatibility Matrix
description: Feature support across all four target tools.
---

Not all tools support all features. This page shows what's supported where, and what trade-offs are made when dotai emits configuration for tools with a smaller feature surface.

## Feature support matrix

| Feature | Claude Code | Cursor | Codex | Copilot |
|---------|:-----------:|:------:|:-----:|:-------:|
| Conditional directives | ✓ | ✓ | ✗ | ✓ |
| Intelligent selection | ✓ | ✓ | ✗ | ✗ |
| Skills (all 11 fields) | ✓ | ✓ | ✓ | ✓ |
| Sub-agents (14+ fields) | ✓ | Partial | Partial | Partial |
| MCP servers | ✓ | ✓ | ✓ | ✓ |
| MCP headers / OAuth | ✓ | ✓ | ✗ | ✓ |
| Lifecycle hooks (20 events) | 17 | 2 | ✗ | 18 |
| Hook types (command/prompt/agent) | ✓ | ✗ | ✗ | ✗ |
| Per-tool permissions | ✓ | ✓ | ✗ | ✗ |
| Ask decision | ✓ | ✗ | ✗ | ✗ |
| Sandbox mode | ✗ | ✗ | ✓ | ✗ |
| Enterprise scope | ✓ | ✗ | ✗ | ✗ |
| User scope | ✓ | ✗ | ✗ | ✗ |

## Hook event coverage

dotai defines 20 lifecycle events. Each tool supports a subset:

| Tool | Supported events | Notable gaps |
|------|-----------------|-------------|
| Claude Code | 17 | `preFileEdit`, `postFileEdit`, `errorOccurred` not supported |
| Cursor | 2 | Only `preFileEdit`, `postFileEdit` (via rules) |
| Codex | 0 | No hook support |
| Copilot | 18 | `preFileEdit`, `postFileEdit` not supported |

## Lossy translations

When dotai emits configuration for a tool that doesn't support a given feature, it either drops the feature or maps it to the closest available equivalent. The table below documents those translation losses.

| What's lost | Affected tool | Workaround |
|-------------|--------------|------------|
| Conditional directive activation | Codex | All directives always apply |
| `ask` permission decision | Cursor | Downgraded to `deny` |
| Per-tool permission rules | Codex, Copilot | Collapsed to global policy / not supported |
| Lifecycle hooks | Codex | Not supported |
| File-edit hooks | Copilot | Not supported |
| Hook event name translation | Claude Code | `userPromptSubmitted` → `UserPromptSubmit`, `agentStop` → `Stop` |
| Hook types (prompt/agent) | Cursor, Codex, Copilot | Only Claude Code supports non-command hook types |
| Hook fields (timeout, once, async, model) | Cursor, Codex, Copilot | Only Claude Code supports these fields |
| Agent model override | Copilot | Not supported in file config |
| Agent advanced fields | Cursor, Codex, Copilot | `permissionMode`, `maxTurns`, `skills`, `memory`, `isolation`, `hooks`, `mcpServers` — Claude Code only |
| MCP tool filtering | Copilot, Codex | Not supported |
| MCP headers / OAuth | Codex | Not supported |
| File-based permissions | Copilot | Not supported |
| File-based settings | Copilot | Not supported |
| Ignore patterns | Copilot | Not supported |

## Scope limitations

| Tool | Supported scopes |
|------|-----------------|
| Claude Code | Enterprise, project, user |
| Cursor | Project only |
| Codex | Project only |
| GitHub Copilot | Project only |

Entities from enterprise and user scope are merged into project-scoped output with precedence respected for tools that only support project scope.
