---
title: Agents
description: Specialized sub-agents with isolated context and tool restrictions.
---

Agents are task-driven, not capability-driven. Unlike a general-purpose assistant, each agent activates at a specific point in the workflow — after code changes, before a commit, or when a slash command triggers it. They operate with their own instructions, optional model override, and constrained tool access.

## TypeScript interface

```typescript
interface Agent {
  name: string;
  description: string;
  model?: string;
  modelReasoningEffort?: "low" | "medium" | "high";
  readonly?: boolean;
  instructions: string;
  tools?: string[];
  disallowedTools?: string[];
  permissionMode?: "default" | "acceptEdits" | "dontAsk" | "bypassPermissions" | "plan";
  maxTurns?: number;
  skills?: string[];
  memory?: "user" | "project" | "local";
  background?: boolean;
  isolation?: "worktree";
  hooks?: Record<string, unknown>;
  mcpServers?: Record<string, unknown>;
  disableModelInvocation?: boolean;
  target?: "vscode" | "github-copilot";
  metadata?: Record<string, string>;
}
```

## Configuration

Agents are defined in `.ai/agents/*.md`. Each file is a Markdown document with a YAML frontmatter block. The filename becomes the agent's name. The Markdown body becomes the agent's instruction set.

```
.ai/agents/
  docs-reviewer.md
  plan-checker.md
  cleanup-analyzer.md
```

### Frontmatter fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | string | Tool default | Model to use (e.g. `claude-sonnet-4-6`, `opus`, `haiku`) |
| `modelReasoningEffort` | `"low" \| "medium" \| "high"` | — | Reasoning effort level for the model |
| `readonly` | boolean | `false` | If true, the agent can only read files — no writes or edits |
| `tools` | string[] | All tools | Allowlist of tool names the agent may use |
| `disallowedTools` | string[] | — | Denylist of tool names the agent may not use |
| `permissionMode` | string | `"default"` | Permission behavior: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | number | — | Maximum number of agentic turns before stopping |
| `skills` | string[] | — | Skills available to the agent (by name) |
| `memory` | `"user" \| "project" \| "local"` | — | Memory scope for the agent |
| `background` | boolean | `false` | Run the agent in the background |
| `isolation` | `"worktree"` | — | Run the agent in an isolated git worktree |
| `hooks` | object | — | Inline [hook](/concepts/hooks) definitions (nested YAML, passed through) |
| `mcpServers` | object | — | Inline [MCP server](/concepts/tool-servers) definitions (nested YAML, passed through) |
| `disableModelInvocation` | boolean | `false` | Disable model invocation for the agent (Copilot only) |
| `target` | `"vscode" \| "github-copilot"` | — | Target environment for the agent (Copilot only) |
| `metadata` | Record\<string, string\> | — | Metadata key-value pairs (Copilot only) |

### Example agent file

```markdown
---
model: claude-sonnet-4-6
readonly: true
tools:
  - Read
  - Glob
  - Grep
---

# Docs reviewer

Review documentation for accuracy against the current codebase.

## Process
1. Read the changed files
2. Find related documentation
3. Verify accuracy
4. Report discrepancies
```

### Permission modes

The `permissionMode` field controls how the agent handles permission checks:

| Mode | Behavior |
|------|----------|
| `default` | Normal permission prompts — asks user to approve tool use |
| `acceptEdits` | Auto-approve file edits, prompt for other operations |
| `dontAsk` | Skip operations that would require permission instead of prompting |
| `bypassPermissions` | Run without any permission checks (use with caution) |
| `plan` | Plan-only mode — the agent proposes changes but does not execute them |

```yaml
---
permissionMode: plan
model: opus
maxTurns: 50
---

# Architecture planner

Design implementation plans without executing any changes.
```

### Skills integration

Reference skills by name to make them available to the agent:

```yaml
---
skills:
  - deploy
  - write-migration
  - review-pr
---

# Release manager

Coordinate releases using the deploy and migration skills.
```

### Background and isolation

Agents can run in the background and/or in isolated worktrees:

```yaml
---
background: true
isolation: worktree
model: haiku
---

# Background linter

Continuously check code quality in the background without interfering with the main session.
```

### Inline hooks and MCP servers

Agents can define their own hooks and MCP servers that apply only when the agent is active:

```yaml
---
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: prompt
          prompt: "Validate this command is safe for the docs environment."
mcpServers:
  docs-search:
    command: npx
    args: ["-y", "@docs/mcp-search"]
---

# Docs builder

Build and validate the documentation site.
```

## Agent structure pattern

Well-structured agents follow a consistent layout. This is Pattern 2 from the [Configuration Patterns](../architecture/patterns) guide — task-specialized sub-agents with a standard internal structure.

```markdown
# Agent name

## Purpose
One sentence describing what this agent does.

## When to use
Specific triggers — what condition or event should cause the primary agent to delegate to this one.

## Process
Numbered steps the agent follows.

## Guidelines
### DO:
- Specific positive behaviors

### DO NOT:
- Specific anti-patterns

## Output format
Exact structure the agent should return.
```

This structure serves both human readers and the agents that will be reading it. The `When to use` section is especially important — it tells the primary agent when to delegate, which is what makes agents task-driven rather than capability-driven.

## Cross-tool support

| Aspect | Claude Code | Cursor | Codex | Copilot |
|--------|-------------|--------|-------|---------|
| Location | `.claude/agents/*.md` | `.cursor/agents/*.md` | `.codex/config.toml` | `.github/agents/*.agent.md` |
| Format | MD + frontmatter | MD + frontmatter | TOML config | MD + YAML frontmatter |
| Model override | `model` frontmatter | `model` frontmatter | `model` TOML key | `model` frontmatter |
| Read-only | `disallowedTools` | `readonly` frontmatter | `sandbox_mode` | `tools: [read, search]` |
| Tool restrictions | `tools` / `disallowedTools` | Not supported | Limited | `tools` array (mapped aliases) |
| Permission mode | `permissionMode` | Not supported | Not supported | Not supported |
| Max turns | `maxTurns` | Not supported | Not supported | Not supported |
| Skills | `skills` | Not supported | Not supported | Not supported |
| Memory | `memory` | Not supported | Not supported | Not supported |
| Background | `background` | `is_background` | Not supported | Not supported |
| Isolation | `isolation` | Not supported | Not supported | Not supported |
| Inline hooks | `hooks` | Not supported | Not supported | Not supported |
| Inline MCP | `mcpServers` | Not supported | Not supported | `mcp-servers` frontmatter |

**Notes:**

- **Claude Code** supports all agent fields. It has the richest agent configuration surface.
- **Cursor** supports `name`, `description`, `model`, `readonly`, and `background` (as `is_background`). All other fields emit warnings.
- **Copilot** maps tool names to its own alias scheme. `Read` becomes `read`, `Write` and `Edit` both become `edit`, and so on. dotai performs this translation automatically.

## Known limitations

- **Codex**: No `readonly` equivalent. Read-only agents are emitted with `sandbox_mode = "read-only"`. Fields like `tools`, `disallowedTools`, `permissionMode`, `maxTurns`, `skills`, `memory`, `background`, `isolation`, `hooks`, and `mcpServers` are not supported.
- **Copilot**: Supports `model`, `tools`, `disableModelInvocation`, `target`, `metadata`, and inline `mcpServers`. Does not support `permissionMode`, `maxTurns`, `skills`, `memory`, `isolation`, or `hooks`.
- **Cursor**: Does not support `tools`, `disallowedTools`, `permissionMode`, `maxTurns`, `skills`, `memory`, `isolation`, `hooks`, `mcpServers`, or `modelReasoningEffort`. These fields are ignored with warnings.
