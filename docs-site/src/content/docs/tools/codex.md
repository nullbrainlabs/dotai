---
title: Codex
description: How dotai generates Codex configuration.
---

Codex has a minimal configuration surface centered on two outputs: an `AGENTS.md` markdown file for directives, and a `.codex/config.toml` TOML file for everything else. It is a project-scope-only target.

## Generated Files

| dotai Source | Generated File |
|---------------|---------------|
| Directives | `AGENTS.md` |
| Skills | `.codex/skills/<name>/SKILL.md` |
| Agents | `.codex/config.toml` |
| Servers | `.codex/config.toml` |
| Hooks | Not generated |
| Permissions | `.codex/config.toml` (`approval_policy`) |
| Ignore patterns | `.codex/config.toml` (protected paths) |

## Entity Details

### Directives

All directives — regardless of their `alwaysApply` setting or glob patterns — are concatenated and written to `AGENTS.md` at the project root. Codex does not support conditional directive activation, so intelligent selection and `alwaysApply: false` directives are treated identically to always-apply directives.

### Agents

Agents are written to `.codex/config.toml` under a `[[agents]]` array. Each entry carries the agent's `name`, `description`, and system prompt. The `readonly` flag is not supported by Codex and is dropped during emission. Model overrides are written if supported by the installed Codex version.

### MCP Servers

MCP servers are written to `.codex/config.toml` under an `[[mcpServers]]` array. Tool filtering (`enabledTools`/`disabledTools`) is not supported and is dropped.

### Permissions

Permissions are mapped to Codex's three-level `approval_policy` setting in `.codex/config.toml`:

- `full-auto` — all operations are permitted without confirmation
- `auto-edit` — file edits are permitted, but shell commands require confirmation
- `suggest` — all operations require confirmation

If any permission rule carries a `deny` decision, the entire policy is collapsed to `suggest` mode. There is no per-tool granularity.

### Sandbox Mode

Codex is the only supported tool with a native sandbox mode. The `sandbox` setting in `.codex/config.toml` accepts `off`, `read-only`, or `full`. This maps to dotai's sandbox configuration when present.

### Ignore Patterns

Ignore patterns are written to `.codex/config.toml` as a `protected_paths` array. Codex treats protected paths as files and directories that require explicit confirmation before modification.

## Known Limitations

- **No conditional directives.** All directives always apply regardless of `alwaysApply` or glob patterns.
- **No hooks.** Lifecycle hooks are not supported and are not generated.
- **No per-tool permissions.** Permissions are collapsed to a global `approval_policy` level. A single `deny` rule forces the entire policy to `suggest` mode.
- **No `readonly` agent flag.** The agent `readonly` attribute is dropped during emission.
- **Project scope only.** Enterprise and user scope entities are merged into the project output.
