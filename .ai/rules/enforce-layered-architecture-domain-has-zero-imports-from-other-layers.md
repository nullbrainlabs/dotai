---
scope: project
alwaysApply: false
appliesTo: [src/domain/**/*.ts, src/config/**/*.ts, src/emitters/**/*.ts, src/commands/**/*.ts]
description: Enforce layered architecture — domain has zero imports from other layers
---

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
