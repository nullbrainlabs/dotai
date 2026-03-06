# Claude Code Configuration Capabilities — Complete Reference

> Source: Claude Code CLI (firsthand knowledge + emitter code)
> Last Researched Version: Claude Code 1.0 (CLI)
> Date: 2026-03-05

## Table of Contents

1. [Rules (Instructions)](#1-rules-instructions)
2. [Agents](#2-agents)
3. [Skills](#3-skills)
4. [Hooks](#4-hooks)
5. [MCP Servers](#5-mcp-servers)
6. [Permissions & Settings](#6-permissions--settings)
7. [Ignore Patterns](#7-ignore-patterns)
8. [dotai Entity Coverage](#8-dotai-entity-coverage)

---

## 1. Rules (Instructions)

### 1a. Project-Wide — `CLAUDE.md`

| Property | Value |
|----------|-------|
| **File** | `CLAUDE.md` (project root or any subdirectory) |
| **Format** | Plain Markdown (no frontmatter) |
| **Scope** | Loaded for all conversations in the project |
| **Subdirectory** | `subdir/CLAUDE.md` — loaded when working in or below `subdir/` |

Multiple `CLAUDE.md` files are concatenated (root first, then deeper directories).

### 1b. Local-Only — `CLAUDE.local.md`

| Property | Value |
|----------|-------|
| **File** | `CLAUDE.local.md` (project root or any subdirectory) |
| **Format** | Plain Markdown |
| **Scope** | Same as `CLAUDE.md` but gitignored — personal local instructions |

### 1c. Scoped Rules — `.claude/rules/<name>.md`

| Property | Value |
|----------|-------|
| **Directory** | `.claude/rules/` |
| **Naming** | `<slug>.md` |
| **Format** | Markdown with YAML frontmatter |

#### Frontmatter Schema

```yaml
---
paths:
  - "src/**/*.ts"
  - "tests/**/*.test.ts"
---
```

Rules with `paths:` frontmatter are only loaded when the conversation involves matching files. Rules without frontmatter load unconditionally (same as being in `CLAUDE.md`).

### 1d. User-Level — `~/.claude/CLAUDE.md`

| Property | Value |
|----------|-------|
| **File** | `~/.claude/CLAUDE.md` |
| **Scope** | Applied to all projects for the current user |

### 1e. Scope Hierarchy (highest to lowest)

1. Enterprise (managed policy — not file-based)
2. User (`~/.claude/CLAUDE.md`)
3. Project (`CLAUDE.md`, `.claude/rules/`)
4. Local (`CLAUDE.local.md`)

---

## 2. Agents

| Property | Value |
|----------|-------|
| **Directory** | `.claude/agents/` |
| **Naming** | `<name>.md` |
| **Format** | Markdown with YAML frontmatter |
| **Invocation** | `/agent:<name>` in conversation, or via Agent tool with `subagent_type` |

### Frontmatter Schema

```yaml
---
name: test-runner
description: Runs tests and reports failures
model: sonnet                    # sonnet | opus | haiku | inherit
modelReasoningEffort: medium     # low | medium | high
tools: [Read, Glob, Grep, Bash]
disallowedTools: [Write, Edit]
permissionMode: default          # default | acceptEdits | dontAsk | bypassPermissions | plan
maxTurns: 20
skills: [test-runner, lint-fixer]
memory: true
background: true
isolation: worktree
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: ./scripts/check.sh
mcpServers:
  server-name:
    command: npx
    args: [-y, some-server]
---

Agent behavioral instructions go here.
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Agent identifier (matches filename) |
| `description` | string | Yes | When/why to delegate to this agent |
| `model` | string | No | `sonnet`, `opus`, `haiku`, `inherit`, or full model ID |
| `modelReasoningEffort` | string | No | `low`, `medium`, `high` |
| `tools` | string[] | No | Allowed tools (omit = all) |
| `disallowedTools` | string[] | No | Explicitly blocked tools |
| `permissionMode` | string | No | Permission level override |
| `maxTurns` | number | No | Maximum agentic turns |
| `skills` | string[] | No | Available skill names |
| `memory` | boolean | No | Enable persistent memory |
| `background` | boolean | No | Run as background agent |
| `isolation` | string | No | `worktree` for isolated git worktree |
| `hooks` | object | No | Agent-specific hook overrides |
| `mcpServers` | object | No | Agent-specific MCP servers |

### Available Tool Names

`Read`, `Edit`, `Write`, `MultiEdit`, `Glob`, `Grep`, `Bash`, `Agent`, `WebSearch`, `WebFetch`, `NotebookEdit`, `NotebookRead`, `TodoRead`, `TodoWrite`, `AskUserQuestion`, `LSP`

---

## 3. Skills

| Property | Value |
|----------|-------|
| **Directory** | `.claude/skills/<name>/SKILL.md` |
| **User-level** | `~/.claude/skills/<name>/SKILL.md` |
| **Naming** | Directory = skill name (kebab-case), file = `SKILL.md` |
| **Format** | Markdown with YAML frontmatter |
| **Invocation** | `/<skill-name>` in conversation |

### Frontmatter Schema

```yaml
---
name: deploy-app
description: Deploy the application to production
disable-model-invocation: true
argument-hint: <environment> [--dry-run]
user-invocable: false
allowed-tools: Bash, Read, Glob
model: sonnet
context: src/deploy/
agent: deploy-agent
hooks:
  postToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: ./log-deploy.sh
---

Skill instructions, examples, and guidelines in markdown.
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Skill identifier |
| `description` | string | Yes | Trigger description for auto-invocation |
| `disable-model-invocation` | boolean | No | Prevent auto-selection, require `/<name>` |
| `argument-hint` | string | No | Hint shown in `/` menu |
| `user-invocable` | boolean | No | `false` = only model can invoke |
| `allowed-tools` | string (CSV) | No | Comma-separated tool names |
| `model` | string | No | Model override for skill execution |
| `context` | string | No | File/directory context to load |
| `agent` | string | No | Agent to delegate to |
| `hooks` | object | No | Skill-specific hooks |

### Skill Directories

Can contain supplementary files (scripts, templates, examples) referenced from SKILL.md instructions.

---

## 4. Hooks

### Configuration Location

`.claude/settings.json` under the `hooks` key.

### Hook Format

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/check.sh",
            "timeout": 30000,
            "statusMessage": "Running safety check...",
            "async": true,
            "once": true
          }
        ]
      }
    ]
  }
}
```

### Event Names (PascalCase)

| Event | Trigger |
|-------|---------|
| `PreToolUse` | Before a tool executes (can approve/deny) |
| `PostToolUse` | After a tool executes |
| `SessionStart` | Conversation begins |
| `SessionEnd` | Conversation ends |
| `UserPromptSubmit` | User sends a message |
| `Stop` | Agent stops |
| `SubagentStop` | Subagent stops |
| `SubagentStart` | Subagent starts |
| `PermissionRequest` | Permission prompt shown |
| `PostToolUseFailure` | Tool execution failed |
| `Notification` | Notification event |
| `TeammateIdle` | Teammate becomes idle |
| `TaskCompleted` | Task completed |
| `ConfigChange` | Configuration changed |
| `WorktreeCreate` | Git worktree created |
| `WorktreeRemove` | Git worktree removed |
| `PreCompact` | Before context compaction |

### Hook Handler Types

| Type | Fields | Notes |
|------|--------|-------|
| `command` | `command`, `timeout`, `statusMessage`, `async`, `once` | Shell command execution |
| `prompt` | `prompt`, `model`, `timeout`, `statusMessage`, `once` | LLM prompt injection |
| `agent` | `prompt`, `model`, `timeout`, `statusMessage`, `once` | Agent delegation |

### Hook Entry Fields

| Field | Type | Notes |
|-------|------|-------|
| `matcher` | string | Tool name filter (only for PreToolUse/PostToolUse) |
| `hooks` | array | Array of hook handlers |

### Handler Fields

| Field | Type | Notes |
|-------|------|-------|
| `type` | string | `command`, `prompt`, or `agent` |
| `command` | string | Shell command (type=command) |
| `prompt` | string | LLM prompt (type=prompt/agent) |
| `timeout` | number | Milliseconds |
| `statusMessage` | string | Display text during execution |
| `async` | boolean | Non-blocking (type=command) |
| `once` | boolean | Run only once per session |
| `model` | string | Model override (type=prompt/agent) |

---

## 5. MCP Servers

### Configuration Location

`.mcp.json` (project root)

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

### Transport Types

#### stdio (default)

```json
{
  "mcpServers": {
    "local-server": {
      "command": "node",
      "args": ["server.js"],
      "env": { "KEY": "value" }
    }
  }
}
```

#### HTTP (Streamable HTTP)

```json
{
  "mcpServers": {
    "remote-server": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer TOKEN" }
    }
  }
}
```

#### SSE (deprecated)

```json
{
  "mcpServers": {
    "sse-server": {
      "type": "sse",
      "url": "https://api.example.com/sse",
      "headers": {}
    }
  }
}
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `command` | string | stdio | Startup command |
| `args` | string[] | No | Command arguments |
| `env` | object | No | Environment variables |
| `type` | string | non-stdio | `http`, `sse` |
| `url` | string | non-stdio | Server endpoint |
| `headers` | object | No | HTTP headers |
| `oauth` | object | No | OAuth configuration |

---

## 6. Permissions & Settings

### Configuration Location

`.claude/settings.json`

### Format

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Read",
      "Glob"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Edit(.env)"
    ],
    "ask": [
      "Bash(git push)"
    ]
  }
}
```

### Permission Rule Format

- `ToolName` — applies to all invocations of the tool
- `ToolName(pattern)` — applies only when the tool argument matches the pattern

### Permission Decisions

| Decision | Behavior |
|----------|----------|
| `allow` | Auto-approve without prompting |
| `deny` | Block and refuse |
| `ask` | Prompt user for approval |

### Settings

Additional key-value pairs in `settings.json` control Claude Code behavior. These are tool-specific and may change between versions.

### Scope Levels

Settings can exist at:
- **Project**: `.claude/settings.json`
- **User**: `~/.claude/settings.json`
- **Enterprise**: Managed configuration

---

## 7. Ignore Patterns

### Implementation

Claude Code does not have a dedicated ignore file. Ignore patterns are implemented as `deny` permission rules on `Read` and `Edit` tools:

```json
{
  "permissions": {
    "deny": [
      "Read(node_modules/**)",
      "Edit(node_modules/**)",
      "Read(.env)",
      "Edit(.env)"
    ]
  }
}
```

This is a lossy mapping — it blocks reading/editing but doesn't hide files from other tools (Glob, Grep, etc.).

---

## 8. dotai Entity Coverage

### Current Emitter Status

| Entity | Emitter | Output Path(s) | Status |
|--------|---------|----------------|--------|
| Rules | rulesEmitter | `CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/*.md` | Complete |
| Agents | agentsEmitter | `.claude/agents/<name>.md` | Complete |
| Skills | skillsEmitter | `.claude/skills/<name>/SKILL.md` | Complete |
| Hooks | hooksEmitter | `.claude/settings.json` (hooks key) | Complete |
| MCP Servers | mcpEmitter | `.mcp.json` | Complete |
| Permissions | permissionsEmitter | `.claude/settings.json` (permissions key) | Complete |
| Ignore | hooksEmitter | `.claude/settings.json` (deny rules) | Complete (lossy) |

### Known Gaps

None critical. Claude Code is the primary/reference target for dotai.

### Notes

- Claude Code is the most feature-rich target — most dotai entity fields map 1:1
- Model names use aliases (`sonnet`, `opus`, `haiku`) not full IDs
- Hook events use PascalCase (unlike other tools which use camelCase)
- SSE transport is deprecated — warn users to migrate to HTTP
- `CLAUDE.md` concatenation: multiple rules with the same outputDir merge into one file separated by `---`
