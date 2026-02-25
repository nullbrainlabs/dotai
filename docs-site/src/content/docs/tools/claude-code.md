---
title: Claude Code
description: How dotai generates Claude Code configuration.
---

Claude Code has the richest configuration surface of any supported tool. It supports all 8 entity types and all scope tiers (enterprise, project, and user) — the only exception is local settings files, which are intentionally excluded from dotai management.

## Supported features

- Conditional directives with intelligent selection
- Skills (all 11 frontmatter fields)
- Sub-agents (all 14+ frontmatter fields)
- MCP servers (with headers and OAuth support)
- Lifecycle hooks (17 of 20 events, with command/prompt/agent types)
- Per-tool permissions with `allow`, `deny`, and `ask` decisions
- Enterprise, project, and user scope

## Generated files

| dotai source | Generated file |
|---------------|---------------|
| Directives (`alwaysApply: true`, project scope) | `CLAUDE.md` |
| Directives (local scope) | `CLAUDE.local.md` |
| Directives (`alwaysApply: false` or `appliesTo` set) | `.claude/rules/*.md` |
| Directives with `outputDir` | `<outputDir>/CLAUDE.md`, `<outputDir>/.claude/rules/*.md` |
| Skills | `.claude/skills/<name>/SKILL.md` |
| Agents | `.claude/agents/*.md` |
| Servers | `.mcp.json` |
| Hooks | `.claude/settings.json` (hooks) |
| Permissions | `.claude/settings.json` (permissions) |
| Ignore patterns | `.claude/settings.json` (deny rules) |

## Entity details

### Directives

Directive output depends on scope and activation mode:

- **Project scope + `alwaysApply: true`** — concatenated into `CLAUDE.md` at the project root (or `<outputDir>/CLAUDE.md` if `outputDir` is set).
- **Local scope** — concatenated into `CLAUDE.local.md` (not checked into version control).
- **Project scope + `appliesTo` globs** — written as individual `.claude/rules/<name>.md` files with a YAML frontmatter block containing `paths:` for intelligent selection.
- **Project scope + `alwaysApply: false` (no `appliesTo`)** — written to `.claude/rules/` but loads unconditionally (a warning is emitted since this has no effect vs `alwaysApply: true`).

The `override` field only affects Codex output (emitting to `AGENTS.override.md`); it has no effect on Claude Code.

### Agents

Each agent is written as a markdown file under `.claude/agents/<name>.md` with YAML frontmatter. Claude Code supports all agent frontmatter fields:

| Frontmatter field | Source field | Notes |
|-------------------|-------------|-------|
| `name` | `name` | Agent identifier |
| `description` | `description` | When to delegate to this agent |
| `model` | `model` | Translated via alias map (e.g. `claude-sonnet-4-6` → `sonnet`) |
| `modelReasoningEffort` | `modelReasoningEffort` | `low`, `medium`, or `high` |
| `tools` | `tools` | Comma-separated list of allowed tool names |
| `disallowedTools` | `disallowedTools` or `readonly` | `readonly: true` maps to `Write, Edit, NotebookEdit` |
| `permissionMode` | `permissionMode` | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | `maxTurns` | Maximum agentic turns |
| `skills` | `skills` | Comma-separated list of skill names |
| `memory` | `memory` | `user`, `project`, or `local` |
| `background` | `background` | `true` to run in background |
| `isolation` | `isolation` | `worktree` for isolated git worktree |
| `hooks` | `hooks` | Serialized as nested YAML in frontmatter |
| `mcpServers` | `mcpServers` | Serialized as nested YAML in frontmatter |

The model field uses an alias map: `claude-sonnet-4-6` and `claude-sonnet-4-5` become `sonnet`, `claude-opus-4-6` and `claude-opus-4-5` become `opus`, `claude-haiku-4-5` variants become `haiku`.

### Skills

Each skill is written to `.claude/skills/<name>/SKILL.md` with frontmatter. Claude Code supports all skill frontmatter fields:

| Frontmatter field | Source field | Notes |
|-------------------|-------------|-------|
| `name` | `name` | Skill identifier (used for `/skill-name` invocation) |
| `description` | `description` | When to auto-invoke this skill |
| `disable-model-invocation` | `disableAutoInvocation` | `true` to prevent automatic invocation |
| `argument-hint` | `argumentHint` | Hint shown in slash command menu (e.g. `<file-path>`) |
| `user-invocable` | `userInvocable` | `false` to hide from user-facing slash commands |
| `allowed-tools` | `allowedTools` | Comma-separated list (e.g. `Read, Grep, Glob`) |
| `model` | `model` | Model override for skill execution |
| `context` | `context` | `fork` to run in isolated context |
| `agent` | `agent` | Agent to delegate to when invoked |
| `hooks` | `hooks` | Serialized as nested YAML in frontmatter |

Note that `allowed-tools` uses comma-separated format, not array bracket syntax.

### MCP servers

MCP servers are written to `.mcp.json` under the `mcpServers` key. Each entry is keyed by server name:

- **stdio transport** — `command`, `args`, and `env` fields.
- **http transport** — `type: "http"`, `url`, and optionally `headers` and `oauth` fields.
- **sse transport** — `type: "sse"`, `url`, `headers`, `oauth`. A deprecation warning is emitted recommending migration to HTTP (Streamable HTTP).

```json
{
  "mcpServers": {
    "my-api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      },
      "oauth": {
        "clientId": "my-app",
        "callbackPort": 8080
      }
    }
  }
}
```

### Hooks

Claude Code supports 17 of the 20 lifecycle events. Events are translated from dotai's camelCase to Claude Code's PascalCase names:

| dotai event | Claude Code event |
|-------------|------------------|
| `preToolUse` | `PreToolUse` |
| `postToolUse` | `PostToolUse` |
| `sessionStart` | `SessionStart` |
| `sessionEnd` | `SessionEnd` |
| `userPromptSubmitted` | `UserPromptSubmit` |
| `agentStop` | `Stop` |
| `subagentStop` | `SubagentStop` |
| `permissionRequest` | `PermissionRequest` |
| `postToolUseFailure` | `PostToolUseFailure` |
| `notification` | `Notification` |
| `subagentStart` | `SubagentStart` |
| `teammateIdle` | `TeammateIdle` |
| `taskCompleted` | `TaskCompleted` |
| `configChange` | `ConfigChange` |
| `worktreeCreate` | `WorktreeCreate` |
| `worktreeRemove` | `WorktreeRemove` |
| `preCompact` | `PreCompact` |

Events **not supported** by Claude Code: `preFileEdit`, `postFileEdit`, `errorOccurred`.

Hooks are written to `.claude/settings.json` under the `hooks` key. Claude Code supports all three hook types (`command`, `prompt`, `agent`) and all optional fields (`timeout`, `statusMessage`, `once`, `async`, `model`).

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review this command for safety.",
            "model": "haiku",
            "timeout": 10000
          }
        ]
      }
    ]
  }
}
```

### Permissions

Permissions are written to `.claude/settings.json` under the `permissions` key. Rules can be scoped per tool and include argument pattern matching. Each rule carries an `allow`, `deny`, or `ask` decision. Ignore patterns are expressed as `deny` rules on the `Read` and `Edit` tools with glob path matchers.
