# ADR-010: Biome over ESLint + Prettier

**Status:** Accepted
**Date:** 2026-02-20

## Context

We needed a linter and formatter for the TypeScript codebase. The traditional choice is ESLint + Prettier, but Biome offers a unified alternative.

## Decision

Use **Biome** as the single tool for both linting and formatting.

Configuration: tabs, 100-char line width, double quotes. Key lint rules include `noImplicitAnyLet` (no untyped `let` declarations).

```sh
pnpm lint        # biome check src tests
pnpm lint:fix    # biome check --write src tests
```

## Consequences

- Single dependency instead of ESLint + Prettier + eslint-config-prettier + typescript-eslint.
- Significantly faster execution (Rust-based).
- Less configuration surface — Biome's defaults are opinionated and cover most cases.
- `noImplicitAnyLet` means avoiding bare `let x;` — use typed declarations or ternary expressions instead.
- Auto-fix with `--write` handles most formatting issues automatically.
