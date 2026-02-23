---
title: Hooks
description: Event-driven handlers fired at agent lifecycle points.
---

Hooks run custom actions at specific points in the agent lifecycle. Use them to lint files after edits, run tests after source changes, log tool usage, or enforce pre-session checks. A hook binds a shell command to a lifecycle event, with an optional matcher that filters which tools or files trigger it.

## TypeScript Interface

```typescript
interface Hook {
  event: HookEvent;
  matcher?: string;
  handler: string;
  scope: Scope;
}
```

## Configuration

Hooks are defined in the `hooks` section of `.ai/config.yaml`:

```yaml
hooks:
  - event: postFileEdit
    matcher: "*.ts"
    handler: "npx biome check --write"
    scope: project

  - event: sessionStart
    handler: "echo 'Session started at $(date)'"
    scope: user
```

### Hook Events

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

### Hook Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | `HookEvent` | Yes | Lifecycle event to listen for |
| `matcher` | string | No | Filter condition — tool name for tool events, file glob for file-edit events, omit for session/agent events |
| `handler` | string | Yes | Shell command to execute when the hook fires |
| `scope` | `Scope` | Yes | Scope tier (`enterprise` / `project` / `user` / `local`) |

## Common Patterns

### Auto-lint after edits

Run the linter automatically whenever the agent modifies a TypeScript file:

```yaml
- event: postFileEdit
  matcher: "*.{ts,tsx}"
  handler: "npx biome check --write"
  scope: project
```

### Run tests after source changes

Trigger the test suite when source files change:

```yaml
- event: postFileEdit
  matcher: "src/**/*.ts"
  handler: "npm test"
  scope: project
```

### Log tool usage

Append a timestamped entry to a local log file whenever any tool is used:

```yaml
- event: postToolUse
  handler: "echo '$(date): Tool used' >> .ai/agent.log"
  scope: local
```

## Cross-Tool Support

Hook support is the most divergent aspect of dotai's output. Three tools have no support at all; the remaining three have partial or full support.

| Aspect | Claude Code | Cursor | Codex | Copilot |
|--------|-------------|--------|-------|---------|
| Support | Full | Partial | None | Partial |

### Per-Event Support Matrix

| Event | Claude Code | Cursor | Copilot |
|-------|-------------|--------|---------|
| `preToolUse` | Yes | No | Yes |
| `postToolUse` | Yes | No | Yes |
| `preFileEdit` | Yes | Yes | No |
| `postFileEdit` | Yes | Yes | No |
| `sessionStart` | Yes | No | Yes |
| `sessionEnd` | Yes | No | Yes |
| `userPromptSubmitted` | Yes | No | Yes |
| `agentStop` | Yes | No | Yes |
| `subagentStop` | Yes | No | Yes |
| `errorOccurred` | Yes | No | Yes |

**Notes:**

- **Cursor** translates file-edit hooks into rule-triggered actions in `.cursor/rules/`. Only `preFileEdit` and `postFileEdit` map; all other events are dropped.
- **Copilot** outputs hooks to `.github/hooks/dotai.hooks.json`. It supports 8 of the 10 events but has no mechanism for file-edit hooks.

## Known Limitations

- **Codex**: No hook support. All hooks are silently dropped when emitting to Codex. If your workflow depends on hooks, Codex will not fire them.
- **Cursor**: Only file-edit events (`preFileEdit`, `postFileEdit`) are emitted. Tool events, session events, and agent lifecycle events are dropped.
- **Copilot**: File-edit hooks (`preFileEdit`, `postFileEdit`) are not supported. The remaining 8 events are emitted to `.github/hooks/dotai.hooks.json`.
