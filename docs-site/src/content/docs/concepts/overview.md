---
title: Overview
description: The 8 entity types that form dotai's unified configuration model.
---

dotai maps the configuration surfaces of four AI coding tools — Claude Code, Cursor, Codex, and Copilot — into 8 entity types. Once you author config in `.ai/`, the `sync` command translates it into each tool's native format. You never touch tool-specific files directly.

## Entity Types

| Entity | What it governs | Config location |
|---|---|---|
| Directive | Persistent textual instructions | `.ai/directives/*.md` |
| Skill | Reusable knowledge packages | `.ai/skills/<name>/SKILL.md` |
| Agent | Specialized sub-agents | `.ai/agents/*.md` |
| ToolServer | MCP tool/data providers | `.ai/config.yaml` `servers` |
| Hook | Event-driven lifecycle handlers | `.ai/config.yaml` `hooks` |
| Permission | Access control rules | `.ai/config.yaml` `permissions` |
| Setting | Key-value configuration | `.ai/config.yaml` `settings` |
| IgnorePattern | File exclusion rules | `.ai/config.yaml` `ignore` |

Each entity is loaded from your `.ai/` directory, validated against its domain type, and then emitted to each tool's config format during `ai sync`.

## Scope Hierarchy

Every entity carries a scope that controls where it applies and how it is trusted. Scopes form a hierarchy from broadest to narrowest:

```
enterprise > project > user > local
```

| Scope | Meaning | Location | VCS |
|---|---|---|---|
| `enterprise` | Organization-wide policy | Defined by organization tooling | Committed |
| `project` | Repository-specific config | `.ai/` at the repo root | Committed |
| `user` | Personal preferences | `~/.ai/` in the home directory | Not committed |
| `local` | Machine-local overrides | `.ai.local/` at the repo root | Gitignored |

Scope represents a trust hierarchy, not just layering. A directive scoped to `enterprise` expresses organization policy that downstream scopes cannot override. A `user`-scoped directive applies only to one developer's environment and is never committed to the repository.

When the same key appears at multiple scopes, the narrower scope wins for settings and permissions. For directives and skills, all scopes contribute — a project-scoped directive and a user-scoped directive are both active simultaneously.

## Further Reading

- [Directives](./directives) — persistent textual instructions
- [Skills](./skills) — reusable knowledge packages
- [Agents](./agents) — specialized sub-agents
- [Tool Servers](./tool-servers) — MCP providers
- [Hooks](./hooks) — lifecycle event handlers
- [Permissions](./permissions) — access control
- [Settings](./settings) — key-value configuration
- [Ignore Patterns](./ignore-patterns) — file exclusion rules
