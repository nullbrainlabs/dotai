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
| `--template <name>` | Use a starter template (blank, minimal, web, python, monorepo) |
| `--force` | Overwrite existing `.ai/` directory |

Creates a starter `config.yaml` and example directives.

## dotai sync

Generate tool-specific configuration files from `.ai/` sources.

```bash
dotai sync [options]
```

| Option | Description |
|--------|-------------|
| `--force` | Overwrite files even if manually edited (conflicts detected) |
| `--dry-run` | Show what would be generated without writing files |
| `--target <tool>` | Only generate for a specific tool (claude-code, cursor, codex, copilot, opencode, antigravity) |

Reads `.ai/` config, applies scope precedence, and writes output files for each target tool. Tracks content hashes in `.ai/.state.json` for conflict detection.

## dotai check

Validate your `.ai/` configuration.

```bash
dotai check
```

Checks for:
- Valid YAML syntax in `config.yaml`
- Valid frontmatter in directives and agents
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
| `--from <tool>` | Import from a specific tool (claude-code, cursor, codex, copilot, opencode) |

Auto-detects existing configurations and converts them to `.ai/` entities. See [Importing Existing Configs](/getting-started/importing) for details.
