# src/templates/

Templates used by the `init` command to scaffold a new `.ai/` directory.

## Key files

- `index.ts` — `defaultConfig()` returns a starter `ProjectConfig` with a conventions rule and common ignore patterns (node_modules, dist, .env).
- `helper-skills.ts` — Built-in skill definitions that can be added during init.
- `skill-creator.ts` — Generates skill file content from templates.
