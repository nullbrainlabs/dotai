# src/domain/

Pure domain types with no side effects or I/O.

## Entity types (8)

Rule, Skill, Agent, ToolServer, Permission, Hook, IgnorePattern, Settings — each in its own file.

## Key files

- `scope.ts` — 4-tier scope hierarchy: enterprise > project > user > local. `SCOPE_PRECEDENCE` array + `scopeOutranks()` helper.
- `factories.ts` — `create<Entity>()` factory for each type (applies defaults).
- `type-guards.ts` — `is<Entity>()` type guard for each type.
- `index.ts` — Re-exports all types, factories, and type guards.

## Rules

- No classes. All types are interfaces.
- No imports from outside `domain/` — this layer has zero dependencies.
- Every new entity needs: type file, factory, type guard, and re-export from `index.ts`.
