---
title: Agents
description: Specialized sub-agents with isolated context and tool restrictions.
---

Agents are task-driven, not capability-driven. Unlike a general-purpose assistant, each agent activates at a specific point in the workflow — after code changes, before a commit, or when a slash command triggers it. They operate with their own instructions, optional model override, and constrained tool access.

## TypeScript Interface

```typescript
interface Agent {
  name: string;
  description: string;
  model?: string;
  readonly?: boolean;
  instructions: string;
  tools?: string[];
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

### Frontmatter Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | string | Tool default | Model to use for this agent (e.g. `claude-sonnet-4-20250514`) |
| `readonly` | boolean | `false` | If true, the agent can only read files — no writes or edits |
| `tools` | string[] | All tools | Allowlist of tool names the agent may use |

### Example Agent File

```markdown
---
model: claude-sonnet-4-20250514
readonly: true
tools:
  - Read
  - Glob
  - Grep
---

# Docs Reviewer

Review documentation for accuracy against the current codebase.

## Process
1. Read the changed files
2. Find related documentation
3. Verify accuracy
4. Report discrepancies
```

## Agent Structure Pattern

Well-structured agents follow a consistent layout. This is Pattern 2 from the [Configuration Patterns](../architecture/patterns) guide — task-specialized sub-agents with a standard internal structure.

```markdown
# Agent Name

## Purpose
One sentence describing what this agent does.

## When to Use
Specific triggers — what condition or event should cause the primary agent to delegate to this one.

## Process
Numbered steps the agent follows.

## Guidelines
### DO:
- Specific positive behaviors

### DO NOT:
- Specific anti-patterns

## Output Format
Exact structure the agent should return.
```

This structure serves both human readers and the agents that will be reading it. The `When to Use` section is especially important — it tells the primary agent when to delegate, which is what makes agents task-driven rather than capability-driven.

## Cross-Tool Support

| Aspect | Claude Code | Cursor | Codex | OpenCode | Copilot | Antigravity |
|--------|-------------|--------|-------|----------|---------|-------------|
| Location | `.claude/agents/*.md` | `.cursor/agents/*.md` | `.codex/config.toml` | `.opencode/agents/*.md` | `.github/agents/*.agent.md` | Not supported |
| Format | MD + frontmatter | MD + frontmatter | TOML config | MD + YAML frontmatter | MD + YAML frontmatter | N/A |
| Model override | `model` frontmatter | `model` frontmatter | `model` TOML key | `model` frontmatter | Not supported (warning) | N/A |
| Read-only | `readonly` frontmatter | `readonly` frontmatter | Not supported | `tools.write`/`bash: false` | `tools: [read, search]` | N/A |
| Tool restrictions | `tools` array | `tools` array | Limited | Limited (write/bash toggles) | `tools` array (mapped aliases) | N/A |

**Notes:**

- **Copilot** maps tool names to its own alias scheme. `Read` becomes `read`, `Write` and `Edit` both become `edit`, and so on. dotai performs this translation automatically.
- **Antigravity** agents are session-based, not file-based. There is no persistent agent definition — each conversation session is its own ephemeral agent context. dotai cannot emit agents for Antigravity.

## Known Limitations

- **Antigravity**: Agent definitions are silently skipped. There is no file-based agent system to target.
- **Codex**: No `readonly` equivalent. Read-only agents are emitted without the restriction; the agent will have write access.
- **Copilot**: No model override support. If a `model` field is set, dotai emits a warning and drops the field from the Copilot output.
