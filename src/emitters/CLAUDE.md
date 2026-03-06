# src/emitters/

Target-specific file generators. Transforms `ProjectConfig` into output files for each AI tool.

## Structure

Each subdirectory handles one entity type: `rules/`, `skills/`, `agents/`, `mcp/`, `permissions/`, `hooks/`. Inside each: per-target files (`claude.ts`, `cursor.ts`, `codex.ts`, `copilot.ts`) + `index.ts` implementing the `Emitter` interface.

## Key files

- `types.ts` — `Emitter` interface (`emit(config, target) -> EmitResult`), `TargetTool` enum (claude, cursor, codex, copilot), `EmittedFile`, `ALL_TARGETS`.
- `merge.ts` — Handles multiple emitters writing to the same path. JSON: deep-merge objects. TOML: concatenate sections. Markdown: concatenate with `---` separator. Other: last writer wins.
- `toml-utils.ts` — TOML generation helpers (uses `smol-toml`).
- `index.ts` — Re-exports all emitters.

## Adding a new emitter

1. Create subdirectory with per-target files + `index.ts`
2. Implement `Emitter` interface
3. Register in `EMITTERS` array in `commands/sync.ts`
4. Run `pnpm test -- --update` to regenerate contract snapshots
