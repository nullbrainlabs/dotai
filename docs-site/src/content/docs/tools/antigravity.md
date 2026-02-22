---
title: Antigravity
description: How dotai generates Antigravity configuration.
---

Antigravity supports directives (with conditional activation), skills, and MCP servers. It does not support agents, hooks, permissions, settings, or ignore patterns.

## Generated Files

| dotai Source | Generated File |
|---|---|
| Directives (`alwaysApply: true`) | `.agent/rules/*.md` (with `alwaysApply: true` frontmatter) |
| Directives (scoped) | `.agent/rules/*.md` (with `globs` frontmatter) |
| Skills | `.agent/skills/<name>/SKILL.md` |
| Agents | Not generated (warning) |
| Servers | `mcp_config.json` |
| Hooks | Not generated (warning) |
| Permissions | Not generated (warning) |
| Ignore patterns | Not generated (warning) |
| Settings | Not generated (warning) |

## Entity Details

### Directives

Directives are emitted as markdown files with YAML frontmatter under `.agent/rules/`. Always-apply directives include `alwaysApply: true` in their frontmatter. Scoped directives include a `globs` array for conditional activation. Antigravity also supports intelligent directive selection via the `description` frontmatter field.

### Skills

Skills are emitted in the standard format at `.agent/skills/<name>/SKILL.md`, identical to the output produced for all other tools.

### MCP

MCP servers are written to `mcp_config.json` with an `mcpServers` top-level key in JSON format. Tool filtering is not supported.

## Known Limitations

- No file-based agent support — Antigravity agents are session-based only and cannot be defined via config files.
- No hooks support.
- No file-based permissions support.
- No file-based settings support.
- No ignore patterns support.
- No MCP tool filtering support.
- Project scope only.
