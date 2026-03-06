# GitHub Copilot Configuration Capabilities — Complete Reference

> Source: [GitHub Copilot Official Docs](https://docs.github.com/en/copilot)
> Last Researched Version: GitHub Copilot (Coding Agent, Feb 2026)
> Date: 2026-02-24 (last verified)
> See also: `.ai/research/copilot-capabilities.md` (detailed research with gap analysis)

## Table of Contents

1. [Rules (Instructions)](#1-rules-instructions)
2. [Agents](#2-agents)
3. [Skills](#3-skills)
4. [Hooks](#4-hooks)
5. [MCP Servers](#5-mcp-servers)
6. [Permissions & Settings](#6-permissions--settings)
7. [Ignore Patterns](#7-ignore-patterns)
8. [Additional Concepts](#8-additional-concepts)
9. [dotai Entity Coverage](#9-dotai-entity-coverage)

---

## 1. Rules (Instructions)

### 1a. Repository-Wide — `.github/copilot-instructions.md`

| Property | Value |
|----------|-------|
| **File** | `.github/copilot-instructions.md` |
| **Format** | Plain Markdown (no frontmatter) |
| **Support** | All IDEs, GitHub.com Chat, Coding Agent, Code Review, CLI |

### 1b. Path-Specific — `.github/instructions/<name>.instructions.md`

| Property | Value |
|----------|-------|
| **Directory** | `.github/instructions/` (subdirs allowed) |
| **Naming** | `<name>.instructions.md` |
| **Format** | Markdown with YAML frontmatter |

#### Frontmatter Schema

```yaml
---
applyTo: "**/*.ts,**/*.tsx"     # Required — comma-separated glob patterns
excludeAgent: "code-review"     # Optional — "code-review" | "coding-agent"
---
```

### 1c. CLI User-Level — `$HOME/.copilot/copilot-instructions.md`

### 1d. Agent Instructions — `AGENTS.md`

Also recognizes `CLAUDE.md` and `GEMINI.md` at repo root.

### Rule Mapping from dotai

- `alwaysApply` + no `appliesTo` + no `excludeAgent` -> `.github/copilot-instructions.md`
- Has `appliesTo` or `excludeAgent` -> `.github/instructions/<slug>.instructions.md`
- Not `alwaysApply`, no `appliesTo` -> `.github/instructions/<slug>.instructions.md`

---

## 2. Agents

| Property | Value |
|----------|-------|
| **Directory** | `.github/agents/` |
| **Naming** | `<name>.agent.md` |
| **Format** | Markdown with YAML frontmatter |
| **Max body** | 30,000 characters |

### Frontmatter Schema

```yaml
---
description: "Purpose and capabilities"    # Required
tools: [read, edit, search]                # Optional — omit = all; [] = none
model: "gpt-4o"                            # Optional (IDE only)
target: "vscode"                           # Optional — "vscode" | "github-copilot"
disable-model-invocation: true             # Optional
mcp-servers:                               # Optional — agent-specific
  custom-mcp:
    type: "local"
    command: "some-command"
    tools: ["*"]
metadata:                                  # Optional
  team: backend
---
```

### Tool Aliases

| Alias | Maps from |
|-------|-----------|
| `execute` | Shell, Bash |
| `read` | Read |
| `edit` | Edit, Write |
| `search` | Grep, Glob |
| `agent` | Agent, Task |
| `web` | WebSearch, WebFetch |

### Unsupported Fields (vs Claude Code)

- `disallowedTools`, `permissionMode`, `maxTurns`, `skills`
- `memory`, `isolation`, `hooks`, `modelReasoningEffort`, `background`

---

## 3. Skills

| Property | Value |
|----------|-------|
| **Directory** | `.github/skills/<name>/SKILL.md` |
| **Format** | Markdown with minimal YAML frontmatter |

### Frontmatter Schema (Copilot-specific)

```yaml
---
name: my-skill
description: "What it does"
license: MIT
---
```

**Only `name`, `description`, and `license` are supported.** Fields like `allowed-tools`, `model`, `context`, `agent`, `hooks`, `user-invocable`, `argument-hint`, `disable-model-invocation` are NOT supported by Copilot.

---

## 4. Hooks

### Configuration Location

`.github/hooks/hooks.json` (must be on default branch for Coding Agent)

### Format

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "./scripts/check.sh",
        "timeoutSec": 30,
        "cwd": ".",
        "env": { "KEY": "value" },
        "comment": "Description"
      }
    ]
  }
}
```

**`version: 1` is required.**

### Supported Events

`sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`, `postToolUse`, `errorOccurred`, `agentStop`, `subagentStop`

### Hook Entry Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | Yes | Only `"command"` supported |
| `bash` | string | Yes (Unix) | Shell command |
| `powershell` | string | Yes (Win) | Windows command |
| `cwd` | string | No | Working directory |
| `timeoutSec` | number | No | Default 30 seconds |
| `env` | object | No | Custom environment variables |
| `comment` | string | No | Internal documentation |

### Key Differences from Claude Code

- Event names are camelCase (Claude uses PascalCase)
- Only `command` type (no `prompt` or `agent` hooks)
- Uses `bash` field (not `command`)
- Timeout in seconds (not milliseconds)
- Only `preToolUse` return values are processed (approve/deny)

---

## 5. MCP Servers

### 5a. VS Code — `.vscode/mcp.json`

```json
{
  "servers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@some/mcp-server"]
    }
  }
}
```

**Note:** Uses `servers` key (NOT `mcpServers`). Requires explicit `type` field.

### 5b. Coding Agent — GitHub Repo Settings (JSON)

Configured in GitHub web UI, NOT a file. Uses `mcpServers` key with `tools` array.

### 5c. Agent-Level MCP

Defined in agent frontmatter `mcp-servers:` block.

### Key Differences from Claude Code

- VS Code uses `servers` key, not `mcpServers`
- Supports `inputs` array for user-prompted values
- `type` field required on all entries (defaults to `stdio` if omitted in dotai)
- Coding agent MCP must be configured in GitHub repo settings separately

---

## 6. Permissions & Settings

Copilot does **not** support file-based permission or settings configuration.

- CLI flags: `--allow-all-tools`, `--allow-tool <tool>`, `--deny-tool <tool>`
- IDE: VS Code `settings.json` with Copilot-specific keys

---

## 7. Ignore Patterns

Copilot does **not** support file-based ignore patterns. Content exclusion is configured in GitHub web UI at repo/org/enterprise level.

**Not supported by:** CLI, Coding Agent, Agent mode.

---

## 8. Additional Concepts

### Prompt Files (`.github/prompts/*.prompt.md`)

IDE-only (VS Code, Visual Studio, JetBrains). Markdown with `agent` and `description` frontmatter. Supports dynamic `${input:varName:prompt}` variables.

### Setup Steps (`.github/workflows/copilot-setup-steps.yml`)

GitHub Actions workflow for Coding Agent environment setup. Job name must be `copilot-setup-steps`.

### Plugins (`plugin.json`)

CLI plugin system with agents, skills, hooks, MCP servers. Installed to `~/.copilot/installed-plugins/`.

---

## 9. dotai Entity Coverage

### Current Emitter Status

| Entity | Emitter | Output Path(s) | Status |
|--------|---------|----------------|--------|
| Rules | rulesEmitter | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` | Complete |
| Agents | agentsEmitter | `.github/agents/<name>.agent.md` | Complete |
| Skills | skillsEmitter | `.github/skills/<name>/SKILL.md` | Complete (limited fields) |
| Hooks | hooksEmitter | `.github/hooks/hooks.json` | Complete |
| MCP Servers | mcpEmitter | `.vscode/mcp.json` | Complete |
| Permissions | permissionsEmitter | (skipped) | Correct — not supported |
| Ignore | hooksEmitter | (skipped) | Correct — not supported |

### Known Gaps

See `.ai/research/copilot-capabilities.md` section 11 for detailed gap analysis.

| Gap | Severity | Notes |
|-----|----------|-------|
| `excludeAgent` on rules | Medium | Domain field exists but may not be emitted |
| Skills over-emitting | Low | Copilot only supports name/description/license |
| Prompt files | Low | New entity type — not yet in dotai |
| Setup steps | Low | CI-specific — probably out of scope |
| Plugin manifest | Low | Advanced — future consideration |

### Areas to Monitor

- Copilot evolves rapidly — check GitHub docs monthly
- Coding Agent capabilities expand frequently (new tools, MCP improvements)
- Plugin system is new and may change significantly
- Skills support may gain more frontmatter fields over time
