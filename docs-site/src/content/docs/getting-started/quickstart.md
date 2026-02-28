---
title: Quick Start
description: Generate your first config sync in under 5 minutes.
---

Get up and running with dotai in under 5 minutes. If you haven't installed yet, see [Installation](/getting-started/installation).

## Initialize

Run `dotai init` in your project root:

```bash
cd your-project
dotai init
```

This creates an `.ai/` directory with a starter `config.yaml` and example rules.

## Add a Rule

Create a file at `.ai/rules/code-style.md`:

```markdown
---
scope: project
alwaysApply: true
---

# Code Style

- Use TypeScript strict mode
- Prefer named exports over default exports
- Write tests for all new functions
```

## Sync

Generate config files for your AI tools:

```bash
dotai sync
```

This produces the right files for each tool:

| Tool | Generated files |
|------|----------------|
| Claude Code | `CLAUDE.md`, `.claude/settings.json`, `.claude/rules/*.md` |
| Cursor | `.cursor/rules/*.mdc`, `.cursorignore` |
| Codex | `AGENTS.md`, `.codex/config.toml` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/agents/*.agent.md`, `.vscode/mcp.json` |

## Check Status

See what's in sync and what needs updating:

```bash
dotai status
```

## Validate

Run validation checks on your `.ai/` configuration:

```bash
dotai check
```

## Next Steps

- Explore the [Concepts overview](/concepts/overview) to understand dotai's 8 entity types
- See which features each tool supports in the [Compatibility Matrix](/tools/compatibility)
- Already have configs? [Import them](/getting-started/importing)
