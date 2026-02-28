---
title: Introduction
description: What is dotai and why does it exist.
---

dotai is a CLI tool that generates correct configuration files for four AI coding tools from a single `.ai/` directory. Write your rules, skills, and agents once — dotai produces the right files for Claude Code, Cursor, Codex, and GitHub Copilot automatically.

## The Problem

Every AI coding tool has its own configuration format:

| Tool | Config files |
|------|-------------|
| Claude Code | `CLAUDE.md`, `.claude/settings.json`, `.mcp.json` |
| Cursor | `.cursor/rules/*.mdc`, `.cursor/mcp.json`, `.cursorignore` |
| Codex | `AGENTS.md`, `.codex/config.toml` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/agents/*.agent.md`, `.vscode/mcp.json` |

When a team uses multiple tools — or different team members prefer different editors — the same rules must be maintained in multiple formats. Config drift is inevitable.

## The Solution

dotai introduces a single `.ai/` directory as the source of truth:

```
.ai/
├── config.yaml          # Servers, hooks, permissions, settings, ignore patterns
├── rules/               # Markdown instruction files
│   ├── code-style.md
│   └── security.md
├── skills/              # Reusable knowledge packages
│   └── deploy/SKILL.md
└── agents/              # Specialized sub-agents
    └── reviewer.md
```

Run `dotai sync` and the CLI reads your `.ai/` directory, applies scope precedence rules, and writes the correct output files for each target tool.

## How It Works

```
.ai/ sources  →  dotai sync  →  Claude Code files
                              →  Cursor files
                              →  Codex files
                              →  Copilot files
```

1. **Define** your configuration in `.ai/` using 8 entity types: rules, skills, agents, tool servers, hooks, permissions, settings, and ignore patterns.
2. **Sync** with `dotai sync` to generate tool-specific files.
3. **Track** changes with content hashing — dotai detects when generated files have been manually edited and warns before overwriting.

## Next Steps

- [Install dotai](/getting-started/installation)
- [Quick Start](/getting-started/quickstart) — generate your first config sync in under 5 minutes
- [Import existing configs](/getting-started/importing) — already using an AI tool? Bring your config into `.ai/`
