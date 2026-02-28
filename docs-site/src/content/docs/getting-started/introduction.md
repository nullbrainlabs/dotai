---
title: Introduction
description: What is .ai and why does it exist.
---

AI agents are already in your workflow.

Teams are shipping production code today with Anthropic's Claude Code, Cursor, OpenAI's Codex, and GitHub Copilot.

The problem isn't whether AI coding agents work. It's that every tool speaks a slightly different dialect.

- Different config formats
- Different file locations
- Different capabilities
- No shared contract for how an agent should behave in a repo

As teams adopt multiple tools — or switch between them — configs drift, instructions fragment, and "how the AI is supposed to work here" turns into tribal knowledge.

That does not scale.

## The vision

`.ai` is a **versioned, tool-agnostic spec** for AI coding agents.

It defines how agents should behave in a project — rules, skills, agents, permissions, hooks, servers — in a single directory that lives in your repo and travels with your code.

> `.ai/` is the source of truth.
> Tools are just targets.

## Why a translation layer, not a universal spec

The first instinct is to define a strict standard that every AI tool vendor adopts — one format to rule them all. That's how protocols like MCP work, and it's the right approach for some problems.

But AI coding agents are moving fast. Tools are experimenting with new capabilities constantly — hooks, agent delegation, sandbox modes, model routing. A rigid spec that every vendor must follow would do one of two things: slow innovation down to the speed of the spec, or fall permanently behind.

`.ai` takes a different approach. Instead of asking tool vendors to change, it acts as a **translation layer** — a middleman that meets every tool where it already is.

- Tool vendors keep shipping whatever formats and features they want
- `.ai` maps the shared concepts and translates the differences
- When a tool adds something new, `.ai` adds support for it — no committee, no proposal process, no waiting

This keeps the ecosystem fast. AI companies keep innovating. Developers and teams keep moving. `.ai` just makes sure your intent arrives in the right format, everywhere.

## The problem we solve

Today, the same intent must be expressed in multiple incompatible formats:

| Tool | Config files |
|------|-------------|
| Claude Code | `CLAUDE.md`, `.claude/settings.json`, `.mcp.json` |
| Cursor | `.cursor/rules/*.mdc`, `.cursor/mcp.json`, `.cursorignore` |
| Codex | `AGENTS.md`, `.codex/config.toml` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/agents/*.agent.md`, `.vscode/mcp.json` |

They share core concepts, but their configuration models differ. Maintaining parity across tools is manual and brittle. Drift is inevitable.

As the ecosystem evolves, this fragmentation compounds.

## The solution

`.ai` separates **intent from implementation**.

- You define agent behavior once in `.ai/`
- The `dotai` CLI generates the correct native configuration for each tool
- Changes are tracked and protected from accidental overwrite

```
.ai/ sources  →  dotai sync  →  Claude Code files
                              →  Cursor files
                              →  Codex files
                              →  Copilot files
```

The spec supports:

- **Shared, cross-tool capabilities** — rules, skills, agents, permissions, hooks, servers, settings, ignore patterns
- **Tool-specific extensions** when needed

AI tool vendors can keep innovating. Teams keep a stable contract.

## What this enables

- Switch tools without rewriting configuration
- Use multiple agents across a team without drift
- Keep AI behavior versioned and reviewable
- Treat AI configuration like infrastructure, not folklore

`.ai` standardizes how AI agents integrate into codebases — the same way `package.json` standardized dependencies or `Dockerfile` standardized environments.

**One repo. One contract. Any agent.**

## Next steps

- [Install .ai](/getting-started/installation)
- [Quick Start](/getting-started/quickstart) — generate your first config sync in under 5 minutes
- [Import existing configs](/getting-started/importing) — already using an AI tool? Bring your config into `.ai/`
