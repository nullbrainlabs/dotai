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
7. [Exec Policy Rules (Not Yet Emitted)](#7-exec-policy-rules-not-yet-emitted)
8. [Hooks](#8-hooks)
9. [dotai Entity Coverage](#9-dotai-entity-coverage)

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

### 1c. Scope

- **Global scope** — `~/.codex/AGENTS.md` is the global fallback; project `.ai/` rules are emitted to project-level `AGENTS.md`
- **Discovery order** — global (`~/.codex/AGENTS.md`) → git root → intermediate directories → cwd
- **`project_doc_fallback_filenames`** — config key for alternative filenames (e.g. `README.md`)
- **No enterprise or user scope** — dotai emits project-level only; user-scope rules are skipped with a warning
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
| **Registry** | `.codex/config.toml` under `[[skills.config]]` array of tables |

Codex skills use the same SKILL.md format as Claude Code, including all frontmatter fields. Skills must also be registered in `config.toml`.

### config.toml Skills Registration

```toml
[[skills.config]]
path = ".codex/skills/refactor/SKILL.md"
enabled = true

[[skills.config]]
path = ".codex/skills/debug/SKILL.md"
enabled = true
```

### Optional: `agents/openai.yaml`

An optional `agents/openai.yaml` file alongside `SKILL.md` adds UI/policy settings:

```yaml
display_name: "Refactor Code"
brand_color: "#4A90E2"
allow_implicit_invocation: true
dependencies: []
```

> dotai does not currently emit `agents/openai.yaml` — this is documented as a known gap.

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
| `type` | string | Yes | `stdio`, `http` (Streamable HTTP), `sse` |
| `command` | string | stdio | Startup command |
| `args` | string[] | No | Command arguments |
| `url` | string | non-stdio | Server endpoint |
| `env` | table | No | Nested TOML table for env vars |
| `enabled_tools` | string[] | No | Only expose these tools from the server |
| `disabled_tools` | string[] | No | Hide these tools from the server |

### New Fields (not yet emitted — requires domain type extension)

| Field | Type | Notes |
|-------|------|-------|
| `startup_timeout_sec` | int | Max seconds to wait for server startup |
| `tool_timeout_sec` | int | Max seconds per tool call |
| `enabled` | bool | Disable server without deleting config |
| `required` | bool | Fail on init error if true |
| `cwd` | string | Working directory for stdio servers |
| `env_vars` | string[] | Forward named env vars from host |
| `bearer_token_env_var` | string | Env var name for HTTP bearer token |
| `http_headers` | table | Static HTTP headers |
| `env_http_headers` | table | HTTP headers sourced from env vars |

### Notes

- HTTP transport is now called **Streamable HTTP** in Codex docs
- MCP config shares `.codex/config.toml` with other Codex settings — dotai merges these

---

## 5. Permissions & Settings

### Configuration Location

`.codex/config.toml` (top-level keys)

### Format

```toml
approval_policy = "untrusted"
sandbox_mode = "read-only"
```

### Approval Policies

| Policy | Behavior |
|--------|----------|
| `untrusted` | Require approval for most actions (most restrictive) |
| `on-request` | Ask for approval only when the tool requests it |
| `never` | Never require approval (least restrictive) |

Granular reject objects are also supported by the live API (not currently emitted by dotai).

### dotai Mapping

| dotai permissions | Codex `approval_policy` |
|-------------------|-------------------------|
| has `deny` rules | `untrusted` |
| allow-only rules | `on-request` |

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

## 7. Exec Policy Rules (Not Yet Emitted)

Codex supports fine-grained shell command approval via Starlark `.rules` files in `.codex/rules/`.

### Format

```starlark
# .codex/rules/allow-npm.rules
prefix_rule(
    pattern = "npm *",
    decision = "allow",
    justification = "npm commands are safe for development",
)

prefix_rule(
    pattern = "rm -rf *",
    decision = "forbidden",
    justification = "destructive deletions require manual approval",
)
```

### Field Reference

| Field | Values | Notes |
|-------|--------|-------|
| `pattern` | string | Shell command prefix to match |
| `decision` | `allow`, `prompt`, `forbidden` | Approval decision |
| `justification` | string | Human-readable reason |
| `match` | string[] | Additional positive matchers |
| `not_match` | string[] | Negative matchers |

> dotai does not currently emit exec policy rules — this would require a new emitter and domain type.

---

## 8. Hooks

Codex does **not** support hooks. Hook configuration in dotai will produce a warning and be skipped for the Codex target.

---

## 9. dotai Entity Coverage

### Current Emitter Status

| Entity | Emitter | Output Path(s) | Status |
|--------|---------|----------------|--------|
| Rules | rulesEmitter | `AGENTS.md`, `AGENTS.override.md` | Complete |
| Agents | agentsEmitter | `.codex/config.toml` + `.codex/agents/<name>.toml` | Complete (limited fields) |
| Skills | skillsEmitter | `.codex/skills/<name>/SKILL.md` + `config.toml [[skills.config]]` | Complete |
| Hooks | hooksEmitter | `.codex/config.toml` (ignore only) | Hooks unsupported |
| MCP Servers | mcpEmitter | `.codex/config.toml` (mcp_servers) | Complete (incl. enabled/disabled tools) |
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
| MCP new fields not emitted | Low | `startup_timeout_sec`, `tool_timeout_sec`, `enabled`, `required`, `cwd`, `env_vars`, `bearer_token_env_var`, `http_headers`, `env_http_headers` require domain type extension |
| Exec policy rules not emitted | Medium | Starlark `.rules` files in `.codex/rules/` — requires new emitter and domain type |
| `agents/openai.yaml` not emitted | Low | Optional UI/policy settings alongside `SKILL.md` |

### Areas to Monitor

- OpenAI frequently updates Codex — config format may change significantly
- TOML config schema may gain new fields (agent tools, hooks, etc.)
- `AGENTS.md` format may gain frontmatter or file-scoping support
- New config capabilities: `features.*`, `profiles`, `model_providers`, `shell_environment_policy`, `tui.*`, `history.*`, `agents.job_max_runtime_seconds`, built-in roles
