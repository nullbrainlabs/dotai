# src/config/

Config loading pipeline: reads `.ai/` directories and produces a `ProjectConfig`.

## Key files

- `schema.ts` — `ProjectConfig` type (8 entity arrays), `emptyConfig()`, `mergeConfigs()`, `validateConfig()`. Config merging: project appends to user, except settings (override by key) and toolServers (override by name).
- `loader.ts` — `loadProjectConfig()` reads a single `.ai/` dir. `loadMergedConfig()` merges user (`~/.ai/`) + project (`.ai/`) configs.
- `skill-loader.ts` — Scans `skills/*/SKILL.md` directories. Each skill is a markdown file with optional YAML frontmatter.
- `markdown-loader.ts` — Parses markdown files with YAML frontmatter (used for rules and skills).
- `index.ts` — Re-exports public API.

## Data flow

```
~/.ai/ (user scope)  ─┐
                       ├─ mergeConfigs() ─→ ProjectConfig
.ai/  (project scope) ─┘
```

## Rules

- YAML parsing uses the `yaml` package.
- Frontmatter fields map directly to domain type properties.
- Validation errors include file path and message for diagnostics.
