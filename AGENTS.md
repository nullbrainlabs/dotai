# Project Instructions

## Record architectural decisions as ADRs

# Architecture Decision Records

When you make a design decision that affects project conventions, architecture, or tool choices — and the rationale isn't obvious from the code alone — record it as an ADR using the `/add-decision` skill.

Signs you should record a decision:

- Choosing between two or more reasonable alternatives
- Establishing a new pattern or convention
- Changing or reversing an existing convention
- Adding or removing a dependency
- Changing the build, test, or deployment pipeline

Do not record routine implementation choices (variable names, minor refactors, straightforward bug fixes).

---

## conventions

# Project Conventions

- Follow existing code style and patterns
- Write clear, descriptive commit messages
- Keep functions focused and small
- Add comments only where the logic isn't self-evident

---

## dotai

# dotai

Configure once, generate for all AI coding tools.

## Architecture

Layered, functional architecture — no classes:

```
domain/       Pure types + factories + type guards (8 entity types)
  ↓
config/       YAML + markdown frontmatter loader, skill scanner, schema validation
  ↓
emitters/     Target-specific file generators (one per entity type + merge logic)
  ↓
commands/     CLI commands (init, sync, check, status, add, import)
  ↓
cli.ts        Commander entry point
```

`src/index.ts` is the public library API with curated named exports.

## Build / Test / Lint

```sh
pnpm build        # tsup → dist/ (ESM + CJS)
pnpm test         # vitest run
pnpm test:watch   # vitest (watch mode)
pnpm lint         # biome check src tests
pnpm lint:fix     # biome check --write src tests
pnpm typecheck    # tsc --noEmit
pnpm dev          # tsx src/cli.ts
```

## Conventions

- **Tabs**, 100-char line width, double quotes
- **ESM** (`"type": "module"`) — use `.js` extensions in imports
- **Functional style** — no classes, prefer pure functions
- **Biome** for lint + format — run `pnpm lint:fix` to auto-fix
- Avoid `let` without type annotation (biome `noImplicitAnyLet`)
- Use ternary or typed variable instead

## File Naming

- Domain entities: `src/domain/<entity>.ts` (singular noun)
- Emitters: `src/emitters/<entity-plural>.ts`
- Commands: `src/commands/<verb>.ts`
- Tests mirror source: `tests/<path>.test.ts`
- Test fixtures: `tests/fixtures.ts`

## Key Files

| File | Purpose |
|------|---------|
| `src/domain/index.ts` | Re-exports all domain types, factories, type guards |
| `src/config/schema.ts` | `ProjectConfig` type, `emptyConfig()`, `mergeConfigs()`, `validateConfig()` |
| `src/config/loader.ts` | `loadProjectConfig()`, `loadMergedConfig()` |
| `src/emitters/types.ts` | `EmittedFile`, `Emitter`, `TargetTool`, `ALL_TARGETS` |
| `src/emitters/merge.ts` | `mergeFiles()`, `deepMerge()` — file merge strategies |
| `src/state.ts` | Sync state tracking, content hashing, conflict detection |
| `src/tui.ts` | Terminal UI helpers (confirm, spinner, TTY detection) |

## How To

### Add a new entity type

1. Create `src/domain/<entity>.ts` with the interface
2. Add factory in `src/domain/factories.ts`
3. Add type guard in `src/domain/type-guards.ts`
4. Export from `src/domain/index.ts`
5. Add field to `ProjectConfig` in `src/config/schema.ts`
6. Update `emptyConfig()`, `mergeConfigs()`, `validateConfig()`
7. Add loader logic in `src/config/loader.ts`

### Add a new emitter

1. Create `src/emitters/<entity-plural>.ts` implementing `Emitter`
2. Export from `src/emitters/index.ts`
3. Register in `EMITTERS` array in `src/commands/sync.ts`

### Add a new target tool

1. Add to `TargetTool` enum in `src/emitters/types.ts` (updates `ALL_TARGETS` automatically)
2. Add output cases in each emitter's `emit()` function
3. Add user output dir in `src/commands/sync.ts` `USER_OUTPUT_DIRS`
4. Add label in `TARGET_LABELS`

## Dependencies

- **yaml** — YAML parsing for config.yaml
- **smol-toml** — TOML generation for Codex
- **commander** — CLI framework
- **@clack/prompts** — interactive terminal prompts

## Config Format

- Input: `.ai/` directory with `config.yaml`, `rules/*.md`, `skills/*/SKILL.md`, `agents/*.md`
- User scope: `~/.ai/` as base, project `.ai/` overrides
- Outputs: Claude Code, Cursor, Codex, GitHub Copilot

---

## Check target tool spec before modifying emitter output format

> Applies to: src/emitters/**/*.ts

# Emitter Spec Check

Before modifying any emitter file, read the corresponding spec to verify your changes are valid.

## Spec Mapping

- `*/claude.ts` → `specs/claude-code.md`
- `*/cursor.ts` → `specs/cursor.md`
- `*/codex.ts` → `specs/codex.md`
- `*/copilot.ts` → `specs/copilot.md`

## Requirements

- The spec defines exact file paths, frontmatter schemas, JSON structures, and TOML sections
- When adding a new field, verify the tool supports it via the spec's field reference tables
- When the spec shows a "Known Gap", don't silently "fix" it without discussion
- After modifying output, run `pnpm test -- --update` then review snapshot diffs

---

## Enforce layered architecture — domain has zero imports from other layers

> Applies to: src/domain/**/*.ts, src/config/**/*.ts, src/emitters/**/*.ts, src/commands/**/*.ts

# Layer Boundaries

Strict layer order: `domain/` → `config/` → `emitters/` → `commands/` → `cli.ts`

## Import Rules

- **`domain/`** — NEVER imports from config, emitters, commands, or external packages
- **`config/`** — imports from domain only
- **`emitters/`** — imports from domain and config only
- **`commands/`** — may import from all layers above
- **`src/index.ts`** — exception: cherry-picks exports from all layers

## When You Need a Type in a Lower Layer

Move the type definition up to `domain/`. Do not create upward dependencies.

---

## Run tests after code changes and update snapshots when emitter output changes

# Test After Change

- After modifying `src/`, run `pnpm test` before considering the task complete
- After modifying `src/emitters/**`, run `pnpm test -- --update` first, then `pnpm test`
- After modifying domain types or config schema, also run `pnpm typecheck`
- Never skip or delete failing tests — fix root causes
- Test files mirror source: `tests/emitters/rules/claude.test.ts` ↔ `src/emitters/rules/claude.ts`
