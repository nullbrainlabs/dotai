# src/commands/

CLI commands — each file is one command.

## Commands

- `init.ts` — Scaffolds a new `.ai/` directory using templates from `../templates/`.
- `sync.ts` — Core command. Loads config, runs all emitters, merges output files, writes to disk. Handles conflict detection via state tracking (`../state.ts`). `EMITTERS` array defines the emitter pipeline.
- `check.ts` — Validates config without writing files. Reports errors.
- `status.ts` — Shows sync status of generated files (new, modified, conflict, up-to-date, orphaned).
- `add.ts` — Interactive command to add rules, skills, agents, etc.
- `import.ts` — Imports existing tool configs into `.ai/` format (delegates to `../import/`).
- `index.ts` — Re-exports all commands.

## Patterns

- Commands use `../tui.ts` for interactive prompts (`@clack/prompts`).
- Sync writes `.ai/.state.json` with content hashes for conflict detection.
- `--force` flag overrides conflict detection on sync.
