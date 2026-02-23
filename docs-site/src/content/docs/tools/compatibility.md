---
title: Compatibility Matrix
description: Feature support across all six target tools.
---

Not all tools support all features. This page shows what's supported where, and what trade-offs are made when dotai emits configuration for tools with a smaller feature surface.

## Feature Support Matrix

| Feature | Claude Code | Cursor | Codex | Copilot |
|---------|:-----------:|:------:|:-----:|:-------:|
| Conditional directives | ✓ | ✓ | ✗ | ✓ |
| Intelligent selection | ✓ | ✓ | ✗ | ✗ |
| Skills | ✓ | ✓ | ✓ | ✓ |
| Sub-agents | ✓ | ✓ | ✓ | ✓ |
| MCP servers | ✓ | ✓ | ✓ | ✓ |
| Lifecycle hooks | ✓ | Partial | ✗ | ✓ |
| Per-tool permissions | ✓ | ✓ | ✗ | ✗ |
| Ask decision | ✓ | ✗ | ✗ | ✗ |
| Sandbox mode | ✗ | ✗ | ✓ | ✗ |
| Enterprise scope | ✓ | ✗ | ✗ | ✗ |
| User scope | ✓ | ✗ | ✗ | ✗ |

## Lossy Translations

When dotai emits configuration for a tool that doesn't support a given feature, it either drops the feature or maps it to the closest available equivalent. The table below documents those translation losses.

| What's lost | Affected tool | Workaround |
|-------------|--------------|------------|
| Conditional directive activation | Codex | All directives always apply |
| `ask` permission decision | Cursor | Downgraded to `deny` |
| Per-tool permission rules | Codex, Copilot | Collapsed to global policy / not supported |
| Lifecycle hooks | Codex | Not supported |
| File-edit hooks | Copilot | Not supported |
| Agent model override | Copilot | Not supported in file config |
| MCP tool filtering | Copilot | Not supported |
| File-based permissions | Copilot | Not supported |
| File-based settings | Copilot | Not supported |
| Ignore patterns | Copilot | Not supported |

## Scope Limitations

| Tool | Supported scopes |
|------|-----------------|
| Claude Code | Enterprise, project, user |
| Cursor | Project only |
| Codex | Project only |
| GitHub Copilot | Project only |

Entities from enterprise and user scope are merged into project-scoped output with precedence respected for tools that only support project scope.
