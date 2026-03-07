# Cursor Configuration Capabilities — Complete Reference

> Source: Cursor docs + dotai emitter code
> Last Researched Version: Cursor 0.48
> Date: 2026-03-05

## Table of Contents

1. [Rules](#1-rules)
2. [Agents](#2-agents)
3. [Skills](#3-skills)
4. [MCP Servers](#4-mcp-servers)
5. [Permissions & Settings](#5-permissions--settings)
6. [Ignore Patterns](#6-ignore-patterns)
7. [Hooks](#7-hooks)
8. [dotai Entity Coverage](#8-dotai-entity-coverage)

---

## 1. Rules

### Format

Each rule is a separate `.mdc` (or `.md`) file in `.cursor/rules/`.

| Property | Value |
|----------|-------|
| **Directory** | `.cursor/rules/` (subdirectories supported) |
| **Naming** | `<slug>.mdc` (preferred) or `<slug>.md` |
| **Format** | Markdown with YAML frontmatter |

Supported extensions are `.md` and `.mdc`. dotai emits `.mdc` (preferred format).

### Frontmatter Schema

```yaml
---
description: Brief description of when this rule applies
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `description` | string | No | Describes the rule's purpose |
| `globs` | array | No | Array of glob patterns for file scoping |
| `alwaysApply` | boolean | No | `true` = always active, `false` = only when matching files |

### Rule Behavior

- `alwaysApply: true` + no `globs` = always loaded (like CLAUDE.md)
- `alwaysApply: false` + `globs` = loaded only when matching files are in context
- `alwaysApply: true` + `globs` = always loaded, globs are informational
- `alwaysApply: false` + no `globs` = available but not auto-loaded (manual reference only)

### Subdirectory Support

Rules can be placed in `<outputDir>/.cursor/rules/` to scope them to subdirectories.

### AGENTS.md Alternative

Cursor also supports `AGENTS.md` files as a simplified markdown alternative to `.mdc` rules — no frontmatter required. These can be nested in subdirectories for directory-scoped instructions, with more specific files taking precedence over parent-level ones. dotai does not currently emit `AGENTS.md` files (tracked as a known gap).

---

## 2. Agents

| Property | Value |
|----------|-------|
| **Directory** | `.cursor/agents/` |
| **Naming** | `<name>.md` |
| **Format** | Markdown with YAML frontmatter |

### Frontmatter Schema

```yaml
---
name: test-runner
description: Runs tests and reports failures
model: claude-sonnet-4-6
readonly: true
is_background: true
---

Agent behavioral instructions go here.
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Agent identifier |
| `description` | string | No | Purpose description |
| `model` | string | No | Full model ID (not aliases) |
| `readonly` | boolean | No | Read-only file access |
| `is_background` | boolean | No | Run as background agent |

### Unsupported Fields (vs Claude Code)

The following agent fields are NOT supported by Cursor:
- `tools` / `disallowedTools`
- `permissionMode`
- `maxTurns`
- `skills`
- `memory`
- `isolation`
- `hooks`
- `mcpServers`
- `modelReasoningEffort`

---

## 3. Skills

| Property | Value |
|----------|-------|
| **Directory** | `.cursor/skills/<name>/SKILL.md` |
| **Format** | Markdown with YAML frontmatter |

Cursor skills use the same SKILL.md format as Claude Code, including all frontmatter fields:
- `name`, `description`, `disable-model-invocation`, `argument-hint`
- `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, `hooks`

---

## 4. MCP Servers

### Configuration Location

`.cursor/mcp.json`

### Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@some/mcp-server"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

Uses the same `mcpServers` key and format as Claude Code's `.mcp.json`.

### Transport Types

Same as Claude Code — stdio (default), HTTP, SSE.

---

## 5. Permissions & Settings

### Configuration Location

`.cursor/cli.json`

### Format

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Read"
    ],
    "deny": [
      "Bash(rm -rf *)"
    ]
  }
}
```

### Notes

- Uses same `ToolName(pattern)` format as Claude Code
- Only `allow` and `deny` decisions — no `ask` decision
- Additional settings can be added as top-level key-value pairs

---

## 6. Ignore Patterns

Cursor supports two ignore files at the project root:

### `.cursorignore`

Blocks file access from semantic search, Tab, Agent tools, and `@` mentions entirely.

### `.cursorindexingignore`

Excludes files from codebase indexing only. Files are still accessible by the Agent (useful for large generated/vendored files that shouldn't pollute semantic search but may still be needed at runtime).

### Format

Both files use `.gitignore` syntax — one pattern per line, comments with `#`:

```
# gitignore-style patterns
node_modules/**
dist/**
.env
.env.*
```

### Additional Options (User Settings)

- **Hierarchical ignore**: Optional setting to traverse parent directories for `.cursorignore` files
- **Global ignore**: User-level ignore patterns via `Cursor Settings > Features > Editor`

These are user settings, not emitter-generated files.

---

## 7. Hooks

Cursor does **not** have a file-based hooks system. Hooks configured in dotai will produce a warning and be skipped for the Cursor target.

---

## 8. dotai Entity Coverage

### Current Emitter Status

| Entity | Emitter | Output Path(s) | Status |
|--------|---------|----------------|--------|
| Rules | rulesEmitter | `.cursor/rules/<slug>.mdc` | Complete |
| Agents | agentsEmitter | `.cursor/agents/<name>.md` | Complete (limited fields) |
| Skills | skillsEmitter | `.cursor/skills/<name>/SKILL.md` | Complete |
| Hooks | hooksEmitter | `.cursorignore` (ignore only) | Hooks unsupported |
| MCP Servers | mcpEmitter | `.cursor/mcp.json` | Complete |
| Permissions | permissionsEmitter | `.cursor/cli.json` | Complete (no `ask`) |
| Ignore | hooksEmitter | `.cursorignore` | Complete |

### Known Gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Agent fields limited | Low | Cursor agents support fewer fields — correct behavior to warn |
| No hooks support | Medium | Cursor may add hooks in future — monitor docs |
| No `ask` permission | Low | Only `allow`/`deny` — lossy but acceptable |
| No `.cursorindexingignore` output | Low | Requires domain model to distinguish indexing-only vs full ignore patterns |
| No `AGENTS.md` output | Low | Alternative rule format; `.mdc` is preferred and fully supported |

### Areas to Monitor

- Cursor frequently updates its agent/rules format — check docs regularly
- Skills support may evolve (Cursor skills are relatively new)
- MCP format may diverge from Claude Code's `.mcp.json` format
