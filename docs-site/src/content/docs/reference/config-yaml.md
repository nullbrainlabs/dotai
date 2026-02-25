---
title: config.yaml Schema
description: Complete reference for the .ai/config.yaml configuration file.
---

The `.ai/config.yaml` file is the main configuration for dotai. It defines targets, servers, hooks, permissions, settings, and ignore patterns.

## Full schema

```yaml
# Which tools to generate config for
targets:
  - claude-code
  - cursor
  - codex
  - copilot

# MCP tool servers
servers:
  - name: string              # Server identifier
    transport: stdio | http | sse
    command: string            # For stdio transport
    url: string                # For http/sse transport
    args: string[]             # Command arguments
    env:                       # Environment variables
      KEY: value
    enabledTools: string[]     # Tool whitelist (mutually exclusive with disabledTools)
    disabledTools: string[]    # Tool blacklist
    headers:                   # Custom HTTP headers (http/sse only)
      Header-Name: value
    oauth:                     # OAuth config (http/sse only)
      clientId: string
      callbackPort: number
    scope: enterprise | project | user | local

# Lifecycle hooks
hooks:
  - event: preToolUse | postToolUse | preFileEdit | postFileEdit | sessionStart | sessionEnd | userPromptSubmitted | agentStop | subagentStop | errorOccurred | permissionRequest | postToolUseFailure | notification | subagentStart | teammateIdle | taskCompleted | configChange | worktreeCreate | worktreeRemove | preCompact
    matcher: string            # Tool name or file glob (optional)
    handler: string            # Shell command or prompt text
    scope: enterprise | project | user | local
    type: command | prompt | agent  # Handler type (default: command)
    timeout: number            # Timeout in milliseconds
    statusMessage: string      # Status message shown during execution
    once: boolean              # Fire only once per session
    async: boolean             # Run asynchronously (command type only)
    model: string              # Model override (prompt/agent type only)

# Access control
permissions:
  - tool: string               # Tool name (Bash, Read, Write, Edit, etc.)
    pattern: string            # Glob/prefix for argument matching (optional)
    decision: allow | deny | ask
    scope: enterprise | project | user | local

# Key-value settings
settings:
  - key: string
    value: any                 # Tool-specific value
    scope: enterprise | project | user | local

# File exclusions
ignore:
  - pattern: string            # Gitignore-style glob
    scope: project | user      # Only project and user scope allowed
```

## Targets

Valid target values:

| Target | Tool |
|--------|------|
| `claude-code` | Claude Code |
| `cursor` | Cursor |
| `codex` | Codex |
| `copilot` | GitHub Copilot |

If `targets` is omitted, dotai generates for all four tools.

## Servers

See [Tool Servers](/concepts/tool-servers) for the full reference.

Server transport types:

| Transport | Required fields | Description |
|-----------|----------------|-------------|
| `stdio` | `command` | Spawns a subprocess, communicates over stdin/stdout |
| `http` | `url` | Stateless HTTP requests (Streamable HTTP) |
| `sse` | `url` | Server-sent events for streaming (deprecated — use `http`) |

Additional server fields:

| Field | Type | Applies to | Description |
|-------|------|-----------|-------------|
| `enabledTools` | string[] | All | Tool whitelist (mutually exclusive with `disabledTools`) |
| `disabledTools` | string[] | All | Tool blacklist |
| `headers` | Record | http, sse | Custom HTTP headers |
| `oauth.clientId` | string | http, sse | OAuth client ID |
| `oauth.callbackPort` | number | http, sse | OAuth callback port |

## Hooks

See [Hooks](/concepts/hooks) for the full reference.

20 lifecycle events are available:

| Category | Events |
|----------|--------|
| Tool events | `preToolUse`, `postToolUse`, `postToolUseFailure` |
| File events | `preFileEdit`, `postFileEdit` |
| Session events | `sessionStart`, `sessionEnd` |
| Agent events | `agentStop`, `subagentStop`, `subagentStart` |
| User events | `userPromptSubmitted`, `permissionRequest` |
| System events | `notification`, `taskCompleted`, `configChange`, `preCompact` |
| Team events | `teammateIdle` |
| Worktree events | `worktreeCreate`, `worktreeRemove` |
| Error events | `errorOccurred` |

Hook-specific fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `command \| prompt \| agent` | `command` | Handler execution type |
| `timeout` | number | — | Timeout in milliseconds |
| `statusMessage` | string | — | Status message shown during execution |
| `once` | boolean | `false` | Fire only once per session |
| `async` | boolean | `false` | Run asynchronously without blocking (command type only) |
| `model` | string | — | Model override for prompt/agent types |

## Scope rules

| Entity | Allowed scopes |
|--------|---------------|
| Server | enterprise, project, user, local |
| Hook | enterprise, project, user, local |
| Permission | enterprise, project, user, local |
| Setting | enterprise, project, user, local |
| Ignore | project, user |

Precedence: `enterprise > project > user > local`. Higher scope wins on conflict.

## Agents

Agents are defined in `.ai/agents/*.md` files, not in `config.yaml`. See [Agents](/concepts/ai-agents) for the full reference including all 14+ frontmatter fields.

## Skills

Skills are defined in `.ai/skills/<name>/SKILL.md` files, not in `config.yaml`. See [Skills](/concepts/skills) for the full reference including all 11 frontmatter fields.

## Directives

Directives are defined in `.ai/directives/*.md` files, not in `config.yaml`. See [Directives](/concepts/directives) for the full reference including `outputDir` and `override` fields.

## Local overrides

Create `.ai/config.local.yaml` for machine-specific settings. This file should be gitignored and uses the same schema as `config.yaml`.
