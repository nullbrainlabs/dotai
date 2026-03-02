---
name: add-rule
description: Guide the user through creating a new dotai rule
---

# Add Rule

Create a new rule in the `.ai/rules/` directory.

## Process

1. Ask the user what behavior or convention the rule should enforce
2. Ask for a short description (used as the filename and for intelligent selection)
3. Ask whether it should always apply or only for specific file patterns
4. Create the rule markdown file with proper frontmatter

## File Location

```
.ai/rules/<description>.md
```

## Rule Format

```markdown
---
scope: project
alwaysApply: true
description: short description for intelligent selection
---

# Rule Title

The rule content in markdown. This is injected into the AI's context.
```

## Valid Frontmatter Fields

- `scope` (string) — "project" or "user"
- `alwaysApply` (boolean) — always include in context vs. intelligent selection
- `description` (string) — human-readable label for intelligent selection
- `appliesTo` (string[]) — glob patterns to activate for matching files only
- `outputDir` (string) — subdirectory for the emitted file
- `override` (boolean) — emit to AGENTS.override.md (Codex only)
- `excludeAgent` ("code-review" | "coding-agent") — exclude from a Copilot agent

## After Creating

Run `dotai sync` to propagate the rule to your AI tool configs.
