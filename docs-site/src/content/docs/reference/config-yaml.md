---
title: config.yaml Schema
description: Complete reference for the .ai/config.yaml configuration file.
---

The `.ai/config.yaml` file is the main configuration for dotai. It defines MCP servers, hooks, permissions, settings, and ignore patterns.

:::note
Targets are not set in `config.yaml`. Use the `-t, --target` CLI flag on `dotai init` or `dotai sync` to specify which tools to generate for.
:::

## Full schema

```yaml
# MCP tool servers (keyed by name)
mcpServers:
  my-server:
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
    cwd: string                # Working directory for hook execution
    env:                       # Environment variables for hook execution
      KEY: value

# Access control
permissions:
  - tool: string               # Tool name (Bash, Read, Write, Edit, etc.)
    pattern: string            # Glob/prefix for argument matching (optional)
    decision: allow | deny | ask
    scope: enterprise | project | user | local

# Key-value settings
settings:
  model: sonnet
  temperature: 0.7

# File exclusions
ignore:
  - node_modules/**
  - dist/**
  - .env
```

## MCP Servers

See [Tool Servers](/concepts/tool-servers) for the full reference.

MCP servers are defined as a map keyed by server name:

```yaml
mcpServers:
  my-server:
    transport: stdio
    command: npx
    args: ["-y", "my-server"]
  remote-search:
    transport: http
    url: https://search.example.com/mcp
```

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
| `cwd` | string | — | Working directory for hook execution |
| `env` | Record | — | Environment variables for hook execution |

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

## Rules

Rules are defined in `.ai/rules/*.md` files, not in `config.yaml`. See [Rules](/concepts/rules) for the full reference including `outputDir` and `override` fields.

## Local overrides

Create `.ai/config.local.yaml` for machine-specific settings. This file should be gitignored and uses the same schema as `config.yaml`.
