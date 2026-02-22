---
title: Patterns & Recipes
description: Real-world patterns for orchestrating AI agents across a codebase.
---

These patterns are drawn from real-world usage of AI coding tools in production projects. They represent the configuration strategies that dotai is designed to generate and manage.

## Pattern 1: Hierarchical Instructions

One canonical file (`AGENTS.md`) defines how all agents should behave. Agent-specific configs simply point to it.

```
CLAUDE.md → "Read @AGENTS.md for all project instructions."
```

**Why this matters:** Rules are maintained in one place. When you update a pattern, every agent gets it. No drift between what Claude Code knows and what Cursor knows.

**What dotai does:** Generates the canonical instructions from `.ai/directives/`, then produces agent-specific wrappers for each tool.

## Pattern 2: Task-Specialized Sub-Agents

Each sub-agent handles a focused task with its own instructions and constraints:

| Agent | Domain | Spawned by |
|-------|--------|------------|
| `plan-checker` | Architecture compliance | Before implementing a plan |
| `docs-reviewer` | Developer docs accuracy | After code changes that affect docs |
| `cleanup-analyzer` | Code quality analysis | `/cleanup` command |
| `userguide-reviewer` | User-facing docs accuracy | After UI changes |

**Key insight:** Agents are task-driven, not capability-driven. They activate at specific points in the workflow, not as general-purpose assistants.

Sub-agents follow a consistent structure:

```markdown
# Agent Name

## Purpose
One sentence describing what this agent does.

## When to Use
Specific triggers.

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

## Pattern 3: Custom Slash Commands

Commands define repeatable workflows that compose agents and tools:

| Command | Purpose |
|---------|---------|
| `/check` | Verify architecture adherence + run checks + suggest commit |
| `/cleanup` | Spawn cleanup-analyzer + present report + optionally create task doc |
| `/init` | One-time project initialization from template |

**Key insight:** Commands are orchestration, not just delegation. `/cleanup` spawns an agent, processes its output, and asks follow-up questions.

## Pattern 4: Machine-Enforced Rules

Prompts work 90% of the time. Machine-enforced rules catch the other 10%.

Three enforcement layers:
1. **Human-readable rules** in directives — agents should follow these
2. **Machine-enforced rules** (ast-grep, ESLint, etc.) — violations fail the build
3. **Continuous validation** via check scripts — catches everything

**Key insight:** Defense in depth. Telling an AI "don't destructure Zustand stores" works most of the time. An ast-grep rule catches the rest.

## Pattern 5: Permission Whitelisting

Agents get the minimum permissions they need:

```yaml
# .ai/config.yaml
permissions:
  - tool: Bash
    pattern: "npm run check:*"
    decision: allow
  - tool: Bash
    pattern: "npm run lint:*"
    decision: allow
  - tool: Bash
    pattern: "git checkout:*"
    decision: allow
```

They can run checks and format code, but can't install arbitrary packages or run destructive commands without approval.

## Pattern 6: Quality Gate Pipeline

A multi-step quality gate that the agent runs and fixes:

```
1. TypeScript typecheck
2. Linting
3. Architecture validation
4. Formatting
5. Tests
```

The `/check` command tells the agent to run this pipeline and fix failures. This creates a tight feedback loop: make changes, validate, fix, commit.

## Pattern 7: Documentation Written for AI

Write docs that serve both humans and AI agents:

- Explain the **why**, not just the what
- Include **common mistakes** (AI agents make the same ones)
- Use minimal **correct/incorrect examples**
- Focus on **non-obvious patterns** (obvious ones don't need docs)
- Add **cross-links** between related docs

**Key insight:** The docs directory is a training dataset for agents. Every document should be written with the assumption that an AI will read it and use it to make decisions.

## Pattern 8: Context-Aware Ignoring

Exclude noise from the agent's context window:

```yaml
# .ai/config.yaml
ignore:
  - pattern: "dist/**"
  - pattern: "node_modules/**"
  - pattern: "*.lock"
  - pattern: ".cache/**"
```

AI agents have limited context. Excluding build artifacts, lock files, and generated code means the agent sees more signal. This is prompt engineering at the filesystem level.
