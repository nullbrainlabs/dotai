---
title: Compatibility Matrix
description: Feature support across all six target tools.
---

Not all tools support all features. This page shows what's supported where, and what trade-offs are made when dotai emits configuration for tools with a smaller feature surface.

## Feature Support Matrix

| Feature | Claude Code | Cursor | Codex | OpenCode | Copilot | Antigravity |
|---------|:-----------:|:------:|:-----:|:--------:|:-------:|:-----------:|
| Conditional directives | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| Intelligent selection | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ |
| Skills | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sub-agents | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| MCP servers | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lifecycle hooks | ✓ | Partial | ✗ | ✗ | ✓ | ✗ |
| Per-tool permissions | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Ask decision | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Sandbox mode | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Enterprise scope | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| User scope | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Lossy Translations

When dotai emits configuration for a tool that doesn't support a given feature, it either drops the feature or maps it to the closest available equivalent. The table below documents those translation losses.

| What's lost | Affected tool | Workaround |
|-------------|--------------|------------|
| Conditional directive activation | Codex, OpenCode | All directives always apply |
| `ask` permission decision | Cursor | Downgraded to `deny` |
| Per-tool permission rules | Codex, Copilot | Collapsed to global policy / not supported |
| Lifecycle hooks | Codex, OpenCode, Antigravity | Not supported |
| File-edit hooks | Copilot | Not supported |
| File-based agent config | Antigravity | Agents are session-based |
| Agent model override | Copilot | Not supported in file config |
| MCP tool filtering | OpenCode, Copilot, Antigravity | Not supported |
| File-based permissions | Copilot, Antigravity | Not supported |
| File-based settings | Copilot, Antigravity | Not supported |
| Ignore patterns | Copilot, Antigravity | Not supported |

## Scope Limitations

| Tool | Supported scopes |
|------|-----------------|
| Claude Code | Enterprise, project, user |
| Cursor | Project only |
| Codex | Project only |
| OpenCode | Project only |
| GitHub Copilot | Project only |
| Antigravity | Project only |

Entities from enterprise and user scope are merged into project-scoped output with precedence respected for tools that only support project scope.
