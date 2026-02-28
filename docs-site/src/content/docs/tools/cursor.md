---
title: Cursor
description: How dotai generates Cursor configuration.
---

Cursor supports most entity types but with some limitations on hooks and permissions. It is a project-scope-only target — enterprise and user scope entities are merged into the project-scoped output before emission.

## Generated Files

| dotai Source | Generated File |
|---------------|---------------|
| Rules | `.cursor/rules/*.mdc` |
| Skills | `.cursor/skills/<name>/SKILL.md` |
| Agents | `.cursor/agents/*.md` |
| Servers | `.cursor/mcp.json` |
| Hooks (file-edit only) | `.cursor/rules/*.mdc` |
| Permissions | `.cursor/cli.json` |
| Ignore patterns | `.cursorignore` |

## Entity Details

### Rules

Rules are written as MDC files under `.cursor/rules/`. Each file uses YAML frontmatter with a `globs` field that carries any glob patterns used for intelligent selection. The markdown body contains the rule content. Rules without glob patterns are applied globally.

### Hooks

Cursor only supports file-edit hooks. Hooks for other lifecycle events are silently dropped during emission. File-edit hooks are expressed as rule actions within `.cursor/rules/*.mdc` files rather than as a separate hooks configuration.

### Permissions

Permissions are written to `.cursor/cli.json`. Only `allow` and `deny` decisions are supported — any `ask` decision in your dotai config is downgraded to `deny` when emitting for Cursor. Rules can be scoped per tool, but the `ask` loss is logged as a warning during sync.

### Ignore Patterns

Ignore patterns are written to `.cursorignore` at the project root using gitignore-style syntax. One pattern per line.

## Known Limitations

- **No `ask` decision.** The `ask` permission decision is not supported. It is downgraded to `deny` automatically.
- **File-edit hooks only.** All other lifecycle hook events (`PreToolUse`, `PostToolUse`, `Stop`, etc.) are not supported and are dropped.
- **Project scope only.** Enterprise and user scope entities are merged into the project output. There is no way to maintain separate scope tiers within Cursor's configuration format.
