# Codex (OpenAI) Configuration Capabilities — Complete Reference

> Source: OpenAI Codex docs + dotai emitter code
> Last Researched Version: Codex CLI 0.1
> Date: 2026-03-05

## Table of Contents

1. [Rules (Instructions)](#1-rules-instructions)
2. [Agents](#2-agents)
3. [Skills](#3-skills)
4. [MCP Servers](#4-mcp-servers)
5. [Permissions & Settings](#5-permissions--settings)
6. [Ignore Patterns](#6-ignore-patterns)
7. [Hooks](#7-hooks)
8. [dotai Entity Coverage](#8-dotai-entity-coverage)

---

## 1. Rules (Instructions)

### 1a. Project Instructions — `AGENTS.md`

| Property | Value |
|----------|-------|
| **File** | `AGENTS.md` (project root or any subdirectory) |
| **Format** | Plain Markdown |
| **Size limit** | 32 KiB (`project_doc_max_bytes` default) |
| **Subdirectory** | `subdir/AGENTS.md` — loaded when working in `subdir/` |

Content is structured Markdown with `## Section` headers. Nearest-directory file takes precedence.

### 1b. Override Instructions — `AGENTS.override.md`

| Property | Value |
|----------|-------|
| **File** | `AGENTS.override.md` |
| **Format** | Plain Markdown |
| **Purpose** | Higher-priority instructions that override `AGENTS.md` |

### 1c. Scope Limitations

- **No enterprise or user scope** — Codex only supports project-level instructions
- **No file-scoped rules** — `appliesTo` patterns are included as informational notes but not enforced by Codex
- **No frontmatter** — `AGENTS.md` is plain Markdown, rules are separated by `---` dividers

### Rule Format in AGENTS.md

```markdown
# Project Instructions

## Rule Name

> Applies to: **/*.ts, **/*.tsx

Rule content here.

---

## Another Rule

More content.
```

---

## 2. Agents

### Configuration

Agents are defined in `.codex/config.toml` (role entries) with per-agent config files.

| Property | Value |
|----------|-------|
| **Registry** | `.codex/config.toml` under `[agents.<name>]` sections |
| **Per-agent config** | `.codex/agents/<name>.toml` |
| **Format** | TOML |

### config.toml Agent Entry

```toml
[agents.test-runner]
description = "Runs tests and reports failures"
config_file = "agents/test-runner.toml"
```

### Per-Agent Config File

```toml
model = "o4-mini"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
developer_instructions = """
Agent behavioral instructions go here.
Multi-line TOML strings are supported.
"""
```

### Field Reference

| Field | Type | Location | Notes |
|-------|------|----------|-------|
| `description` | string | config.toml | Agent purpose |
| `config_file` | string | config.toml | Path to per-agent TOML file |
| `model` | string | agent.toml | Full model ID |
| `model_reasoning_effort` | string | agent.toml | `low`, `medium`, `high` |
| `sandbox_mode` | string | agent.toml | `read-only` for restricted access |
| `developer_instructions` | string | agent.toml | Multi-line agent instructions |

### Unsupported Fields (vs Claude Code)

The following agent fields are NOT supported by Codex:
- `tools` / `disallowedTools`
- `permissionMode`
- `maxTurns`
- `skills`
- `memory`
- `background`
- `isolation`
- `hooks`
- `mcpServers`

---

## 3. Skills

| Property | Value |
|----------|-------|
| **Directory** | `.codex/skills/<name>/SKILL.md` |
| **Format** | Markdown with YAML frontmatter |

Codex skills use the same SKILL.md format as Claude Code, including all frontmatter fields.

---

## 4. MCP Servers

### Configuration Location

`.codex/config.toml` under `[mcp_servers.<name>]` sections.

### Format

```toml
[mcp_servers.my-server]
type = "stdio"
command = "npx"
args = ["-y", "@some/mcp-server"]

[mcp_servers.my-server.env]
API_KEY = "value"
```

### Transport Types

#### stdio

```toml
[mcp_servers.local-server]
type = "stdio"
command = "node"
args = ["server.js"]

[mcp_servers.local-server.env]
KEY = "value"
```

#### HTTP / SSE

```toml
[mcp_servers.remote-server]
type = "http"
url = "https://api.example.com/mcp"
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | Yes | `stdio`, `http`, `sse` |
| `command` | string | stdio | Startup command |
| `args` | string[] | No | Command arguments |
| `url` | string | non-stdio | Server endpoint |
| `env` | table | No | Nested TOML table for env vars |

### Limitations

- `enabledTools` / `disabledTools` filtering is NOT supported
- MCP config shares `.codex/config.toml` with other Codex settings — dotai merges these

---

## 5. Permissions & Settings

### Configuration Location

`.codex/config.toml` (top-level keys)

### Format

```toml
approval_policy = "unless-allowed"
sandbox_mode = "read-only"
```

### Approval Policies

| Policy | Behavior |
|--------|----------|
| `unless-allowed` | Require approval except for allowed actions |
| `on-failure` | Only require approval after failures |

### Notes

- **Lossy mapping** — Claude Code's per-tool/pattern permissions are reduced to a single `approval_policy`
- Additional settings are emitted as top-level TOML key-value pairs
- No equivalent to Claude Code's `allow`/`deny`/`ask` granularity

---

## 6. Ignore Patterns

### Configuration Location

`.codex/config.toml` under `protected_paths`.

### Format

```toml
protected_paths = ["node_modules/**", ".env", "dist/**"]
```

Protected paths prevent Codex from modifying matching files.

---

## 7. Hooks

Codex does **not** support hooks. Hook configuration in dotai will produce a warning and be skipped for the Codex target.

---

## 8. dotai Entity Coverage

### Current Emitter Status

| Entity | Emitter | Output Path(s) | Status |
|--------|---------|----------------|--------|
| Rules | rulesEmitter | `AGENTS.md`, `AGENTS.override.md` | Complete |
| Agents | agentsEmitter | `.codex/config.toml` + `.codex/agents/<name>.toml` | Complete (limited fields) |
| Skills | skillsEmitter | `.codex/skills/<name>/SKILL.md` | Complete |
| Hooks | hooksEmitter | `.codex/config.toml` (ignore only) | Hooks unsupported |
| MCP Servers | mcpEmitter | `.codex/config.toml` (mcp_servers) | Complete |
| Permissions | permissionsEmitter | `.codex/config.toml` (approval_policy) | Complete (lossy) |
| Ignore | hooksEmitter | `.codex/config.toml` (protected_paths) | Complete |

### Known Gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| No file-scoped rules | Medium | `appliesTo` is informational only — Codex loads all of AGENTS.md |
| Permissions are lossy | Medium | Per-tool granularity lost — single approval_policy |
| No hooks | Low | Codex may add hooks in future |
| Agent fields limited | Low | Many Claude Code agent features unavailable |
| 32 KiB size limit | Medium | Large projects may exceed AGENTS.md limit — emitter warns |

### Areas to Monitor

- OpenAI frequently updates Codex — config format may change significantly
- TOML config schema may gain new fields (agent tools, hooks, etc.)
- `AGENTS.md` format may gain frontmatter or file-scoping support
