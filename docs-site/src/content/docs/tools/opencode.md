---
title: OpenCode
description: How dotai generates OpenCode configuration.
---

OpenCode uses a combination of markdown files and a central `opencode.json` config file. Directives are stored as individual markdown files and also referenced in `opencode.json`, while MCP servers, permissions, ignore patterns, and settings all live in `opencode.json`.

## Generated Files

| dotai Source | Generated File |
|---|---|
| Directives | `.opencode/instructions/*.md` + `opencode.json` (`instructions`) |
| Skills | `.opencode/skills/<name>/SKILL.md` |
| Agents | `.opencode/agents/*.md` |
| Servers | `opencode.json` (`mcp`) |
| Hooks | Not generated |
| Permissions | `opencode.json` (`permission`) |
| Ignore patterns | `opencode.json` (`watcher.ignore`) |
| Settings | `opencode.json` (top-level keys) |

## Entity Details

### Directives

All directives are always applied — OpenCode does not support conditional directive activation based on globs. Each directive is emitted as a markdown file under `.opencode/instructions/` and its path is listed in the `instructions` array of `opencode.json`.

### Agents

Agents are emitted as markdown files with YAML frontmatter under `.opencode/agents/`. In addition to the standard fields, OpenCode agents support the following additional properties: `mode`, `temperature`, `top_p`, `steps`, `color`, `hidden`, and `disable`.

### MCP

MCP servers are written to the `mcp` section of `opencode.json`. Both HTTP and SSE transports map to OpenCode's `"remote"` transport type. Tool filtering is not supported.

### Permissions

OpenCode supports all three permission decisions: `allow`, `deny`, and `ask`. Permissions are written to the `permission` section of `opencode.json` using a nested format: tool name maps to an object of pattern-to-decision entries.

### Ignore Patterns

Ignore patterns are written as an array to `opencode.json` under `watcher.ignore`.

## Known Limitations

- No conditional directive support — all directives are always applied regardless of `alwaysApply` or `globs` settings.
- No hooks support.
- HTTP and SSE transports both map to `"remote"` — they cannot be distinguished in the output.
- No MCP tool filtering support.
- Project scope only.
