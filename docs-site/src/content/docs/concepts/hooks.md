---
title: Hooks
description: Event-driven handlers fired at agent lifecycle points.
---

Hooks run custom actions at specific points in the agent lifecycle. Use them to lint files after edits, run tests after source changes, log tool usage, or enforce pre-session checks. A hook binds a handler to a lifecycle event, with an optional matcher that filters which tools or files trigger it.

## TypeScript interface

```typescript
interface Hook {
  event: HookEvent;
  matcher?: string;
  handler: string;
  scope: Scope;
  type?: "command" | "prompt" | "agent";
  timeout?: number;
  statusMessage?: string;
  once?: boolean;
  async?: boolean;
  model?: string;
  cwd?: string;
  env?: Record<string, string>;
}
```

## Configuration

Hooks are defined in the `hooks` section of `.ai/config.yaml`:

```yaml
hooks:
  - event: postToolUse
    matcher: "Bash"
    handler: "npx biome check --write"
    scope: project

  - event: sessionStart
    handler: "echo 'Session started at $(date)'"
    scope: user

  - event: preToolUse
    matcher: "Bash"
    type: prompt
    handler: "Review this command for safety before allowing execution."
    model: haiku
    scope: project
```

## Hook events

dotai defines 20 lifecycle events. Not all events are supported by every tool — see [cross-tool support](#cross-tool-support) for the full matrix.

| Event | Fires when | Matcher type |
|-------|-----------|-------------|
| `preToolUse` | Before a tool is invoked | Tool name (e.g. `Bash`, `Write`) |
| `postToolUse` | After a tool completes | Tool name |
| `preFileEdit` | Before a file is modified | File glob (e.g. `*.ts`, `src/**`) |
| `postFileEdit` | After a file is modified | File glob |
| `sessionStart` | When the agent session begins | None |
| `sessionEnd` | When the agent session ends | None |
| `userPromptSubmitted` | When the user submits a prompt | None |
| `agentStop` | When the primary agent stops | None |
| `subagentStop` | When a sub-agent stops | None |
| `errorOccurred` | When an error occurs | None |
| `permissionRequest` | When a permission check is triggered | None |
| `postToolUseFailure` | When a tool invocation fails | Tool name |
| `notification` | When the agent emits a notification | None |
| `subagentStart` | When a sub-agent starts | None |
| `teammateIdle` | When a teammate agent becomes idle | None |
| `taskCompleted` | When a task completes | None |
| `configChange` | When configuration changes | None |
| `worktreeCreate` | When a git worktree is created | None |
| `worktreeRemove` | When a git worktree is removed | None |
| `preCompact` | Before context compaction occurs | None |

## Hook types

The `type` field controls how the handler is executed. There are three types:

### Command (default)

Runs the handler as a shell command. This is the default when `type` is omitted.

```yaml
- event: postToolUse
  matcher: "Write"
  type: command
  handler: "npx prettier --write"
  scope: project
```

### Prompt

Sends the handler text as a prompt to the AI model for evaluation. Useful for review gates and safety checks.

```yaml
- event: preToolUse
  matcher: "Bash"
  type: prompt
  handler: "Review this command for safety. Reject if it modifies production data."
  model: haiku
  scope: project
```

### Agent

Delegates the handler to a full agent invocation. The handler text becomes the agent's prompt.

```yaml
- event: postToolUse
  matcher: "Write"
  type: agent
  handler: "Review the changes for security vulnerabilities and report findings."
  model: sonnet
  scope: project
```

## Hook fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `event` | `HookEvent` | Yes | — | Lifecycle event to listen for |
| `matcher` | string | No | — | Filter condition — tool name for tool events, file glob for file-edit events, omit for session/agent events |
| `handler` | string | Yes | — | Shell command (command type) or prompt text (prompt/agent type) |
| `scope` | `Scope` | Yes | — | Scope tier (`enterprise` / `project` / `user` / `local`) |
| `type` | `"command" \| "prompt" \| "agent"` | No | `"command"` | Handler execution type |
| `timeout` | number | No | — | Timeout in milliseconds for hook execution |
| `statusMessage` | string | No | — | Status message shown in the UI while the hook is running |
| `once` | boolean | No | `false` | When true, the hook fires only once per session |
| `async` | boolean | No | `false` | When true, the hook runs asynchronously without blocking (command type only) |
| `model` | string | No | — | Model override for prompt/agent hook evaluation (ignored for command type) |
| `cwd` | string | No | — | Working directory for hook execution |
| `env` | Record\<string, string\> | No | — | Environment variables for hook execution |

## Common patterns

### Auto-lint after edits

Run the linter automatically whenever the agent uses the Write tool:

```yaml
- event: postToolUse
  matcher: "Write"
  handler: "npx biome check --write"
  scope: project
```

### Safety review gate

Use a prompt hook to review dangerous commands before execution:

```yaml
- event: preToolUse
  matcher: "Bash"
  type: prompt
  handler: "Check if this command could delete files or modify production data. Block if unsafe."
  model: haiku
  scope: project
```

### One-time session setup

Run an initialization script once when the session starts:

```yaml
- event: sessionStart
  handler: "scripts/setup-dev-env.sh"
  once: true
  statusMessage: "Setting up development environment..."
  scope: project
```

### Async logging

Log tool usage without blocking the agent:

```yaml
- event: postToolUse
  handler: "echo '$(date): Tool used' >> .ai/agent.log"
  async: true
  scope: local
```

## Cross-tool support

Hook support varies across tools. Claude Code and Copilot have the broadest support; Cursor only handles file-edit events; Codex has no hook support.

| Aspect | Claude Code | Cursor | Codex | Copilot |
|--------|-------------|--------|-------|---------|
| Support | 17 events | 2 events | None | 18 events |

### Per-event support matrix

| Event | Claude Code | Cursor | Copilot |
|-------|-------------|--------|---------|
| `preToolUse` | Yes | No | Yes |
| `postToolUse` | Yes | No | Yes |
| `preFileEdit` | No | Yes | No |
| `postFileEdit` | No | Yes | No |
| `sessionStart` | Yes | No | Yes |
| `sessionEnd` | Yes | No | Yes |
| `userPromptSubmitted` | Yes | No | Yes |
| `agentStop` | Yes | No | Yes |
| `subagentStop` | Yes | No | Yes |
| `errorOccurred` | No | No | Yes |
| `permissionRequest` | Yes | No | Yes |
| `postToolUseFailure` | Yes | No | Yes |
| `notification` | Yes | No | Yes |
| `subagentStart` | Yes | No | Yes |
| `teammateIdle` | Yes | No | Yes |
| `taskCompleted` | Yes | No | Yes |
| `configChange` | Yes | No | Yes |
| `worktreeCreate` | Yes | No | Yes |
| `worktreeRemove` | Yes | No | Yes |
| `preCompact` | Yes | No | Yes |

**Notes:**

- **Claude Code** supports 17 of 20 events. `preFileEdit`, `postFileEdit`, and `errorOccurred` are not supported. Event names are translated to PascalCase (e.g. `userPromptSubmitted` → `UserPromptSubmit`, `agentStop` → `Stop`). Claude Code also supports the `type`, `timeout`, `statusMessage`, `once`, `async`, and `model` fields.
- **Cursor** translates file-edit hooks into rule-triggered actions in `.cursor/rules/`. Only `preFileEdit` and `postFileEdit` map; all other events are dropped.
- **Copilot** outputs hooks to `.github/hooks/hooks.json`. It supports 18 of 20 events — only `preFileEdit` and `postFileEdit` are not supported.

## Known limitations

- **Codex**: No hook support. All hooks are silently dropped when emitting to Codex. If your workflow depends on hooks, Codex will not fire them.
- **Cursor**: Only file-edit events (`preFileEdit`, `postFileEdit`) are emitted. Tool events, session events, and agent lifecycle events are dropped.
- **Copilot**: File-edit hooks (`preFileEdit`, `postFileEdit`) are not supported. The remaining 18 events are emitted to `.github/hooks/hooks.json`. Advanced fields (`type`, `timeout`, `statusMessage`, `once`, `async`, `model`) are not supported by Copilot — only `command` and `matcher` are emitted.
- **Hook types**: Only Claude Code supports the `prompt` and `agent` hook types. Other tools treat all hooks as shell commands.
