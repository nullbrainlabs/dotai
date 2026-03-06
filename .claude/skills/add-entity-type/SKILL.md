---
name: add-entity-type
description: Add a new domain entity type. Guides through all 7+ required touchpoints.
---

# Add Entity Type

## Mandatory File Checklist

Every new entity type requires changes to all of these files:

1. **`src/domain/<entity>.ts`** — interface with JSDoc (new file)
2. **`src/domain/factories.ts`** — add `create<Entity>()` factory function
3. **`src/domain/type-guards.ts`** — add `is<Entity>()` type guard
4. **`src/domain/index.ts`** — re-export the type, factory, and guard
5. **`src/config/schema.ts`** — add field to `ProjectConfig`, update `emptyConfig()`, `mergeConfigs()`, `validateConfig()`
6. **`src/config/loader.ts`** — add loading logic for the new entity
7. **Tests** — add to `tests/domain.test.ts` and `tests/config/loader.test.ts`

## Verification

After completing all touchpoints:

```sh
pnpm typecheck && pnpm test
```

Both must pass. TypeScript will catch most missing touchpoints — if `ProjectConfig` has the field but `emptyConfig()` doesn't, you'll get a type error.
