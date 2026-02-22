---
title: config.yaml Schema
description: Complete reference for the .ai/config.yaml configuration file.
---

The `.ai/config.yaml` file is the main configuration for dotai. It defines targets, servers, hooks, permissions, settings, and ignore patterns.

## Full Schema

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
    scope: enterprise | project | user | local

# Lifecycle hooks
hooks:
  - event: preToolUse | postToolUse | preFileEdit | postFileEdit | sessionStart | sessionEnd | userPromptSubmitted | agentStop | subagentStop | errorOccurred
    matcher: string            # Tool name or file glob (optional)
    handler: string            # Shell command or prompt
    scope: enterprise | project | user | local

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
| `opencode` | OpenCode |
| `antigravity` | Antigravity |

If `targets` is omitted, dotai generates for all six tools.

## Servers

Server transport types:

| Transport | Required fields | Description |
|-----------|----------------|-------------|
| `stdio` | `command` | Spawns a subprocess, communicates over stdin/stdout |
| `http` | `url` | Stateless HTTP requests |
| `sse` | `url` | Server-sent events for streaming |

`enabledTools` and `disabledTools` are mutually exclusive — use one or the other.

## Scope Rules

| Entity | Allowed scopes |
|--------|---------------|
| Server | enterprise, project, user, local |
| Hook | enterprise, project, user, local |
| Permission | enterprise, project, user, local |
| Setting | enterprise, project, user, local |
| Ignore | project, user |

Precedence: `enterprise > project > user > local`. Higher scope wins on conflict.

## Local Overrides

Create `.ai/config.local.yaml` for machine-specific settings. This file should be gitignored and uses the same schema as `config.yaml`.
