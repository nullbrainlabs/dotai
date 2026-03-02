---
name: add-agent
description: Guide the user through creating a new dotai agent
---

# Add Agent

Create a new agent definition in the `.ai/agents/` directory.

## Process

1. Ask the user for the agent name (kebab-case, e.g. `test-runner`)
2. Ask for a description of when the primary agent should delegate to this one
3. Ask about any constraints (read-only, specific tools, model override)
4. Create the agent markdown file

## File Location

```
.ai/agents/<name>.md
```

## Agent Format

```markdown
---
description: When and why to delegate to this agent
model: claude-sonnet-4-6
readonly: false
tools: [Read, Glob, Grep]
---

System prompt and behavioral guidance for the agent.
```

## Valid Frontmatter Fields

- `description` (string) — when/why to delegate to this agent
- `model` (string) — model override, e.g. "claude-sonnet-4-6"
- `readonly` (boolean) — restrict to read-only file access
- `tools` (string[]) — allowed tool names
- `disallowedTools` (string[]) — disallowed tool names
- `permissionMode` (string) — "default", "acceptEdits", "dontAsk", "bypassPermissions", "plan"
- `maxTurns` (number) — maximum agentic turns
- `skills` (string[]) — skills available to the agent
- `isolation` ("worktree") — run in isolated worktree

## After Creating

Run `dotai sync` to propagate the agent to your AI tool configs.
