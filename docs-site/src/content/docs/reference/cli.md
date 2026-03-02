---
title: CLI Reference
description: Complete reference for all dotai CLI commands.
---

## dotai init

Initialize an `.ai/` directory in your project.

```bash
dotai init [options]
```

| Option | Description |
|--------|-------------|
| `-t, --target <tools...>` | Target tools (claude, cursor, codex, copilot) |
| `--skip-import` | Skip auto-detection of existing configs |
| `--sync` | Run sync after init |
| `--with-helpers` | Include dotai helper skills |

Creates a starter `config.yaml` with a conventions rule and common ignore patterns.

## dotai sync

Generate tool-specific configuration files from `.ai/` sources.

```bash
dotai sync [options]
```

| Option | Description |
|--------|-------------|
| `-t, --target <tool>` | Target tool (claude, cursor, codex, copilot, all). Defaults to `all`. |
| `--dry-run` | Show what would be generated without writing files |
| `-s, --scope <scope>` | Config scope (`user` or `project`). Defaults to `project`. |
| `--force` | Overwrite files even if manually edited (conflicts detected) |
| `-y, --yes` | Skip confirmation prompt |

Reads `.ai/` config, applies scope precedence, and writes output files for each target tool. Tracks content hashes in `.ai/.state.json` for conflict detection.

## dotai check

Validate your `.ai/` configuration.

```bash
dotai check [options]
```

| Option | Description |
|--------|-------------|
| `-s, --scope <scope>` | Config scope (`user` or `project`). Defaults to `project`. |

Checks for:
- Valid YAML syntax in `config.yaml`
- Valid frontmatter in rules and agents
- Required fields present on all entities
- Scope values within allowed range
- No conflicting permission rules

## dotai status

Show the current state of dotai configuration and generated files.

```bash
dotai status
```

Displays:
- Which targets are configured
- Number of entities by type
- Sync status (up-to-date, needs sync, conflicts)
- Files that have been manually modified since last sync

## dotai import

Import existing tool configurations into `.ai/` format.

```bash
dotai import [options]
```

| Option | Description |
|--------|-------------|
| `--source <tool>` | Import from a specific tool (claude, cursor, codex) |

Auto-detects existing configurations and converts them to `.ai/` entities. See [Importing Existing Configs](/getting-started/importing) for details.

## dotai add

Scaffold a rule, agent, skill, or MCP server.

```bash
dotai add [type] [name]
```

| Argument | Description |
|----------|-------------|
| `type` | Entity type: `rule`, `agent`, `skill`, or `mcp` |
| `name` | Name of the entity to create |

| Option | Description |
|--------|-------------|
| `--command <cmd>` | MCP server command (stdio transport) |
| `--url <url>` | MCP server URL (http/sse transport) |

If `type` and `name` are omitted, the command runs interactively. For MCP servers, use `--command` for stdio-based servers or `--url` for HTTP/SSE servers.
