# Contributing to dotai

## Dev Setup

```sh
git clone https://github.com/nullbrainlabs/dotai.git
cd dotai
pnpm install
pnpm test
```

## Commits

We use [Conventional Commits](https://www.conventionalcommits.org/). Examples:

- `feat: add windsurf target support`
- `fix: resolve YAML parsing edge case`
- `docs: update contributing guide`
- `refactor: simplify config merging`
- `test: add coverage for skill scanner`
- `chore: update dependencies`

A commit-msg hook enforces this automatically via commitlint.

## Changesets

If your change is user-facing (new feature, bug fix, breaking change), add a changeset:

```sh
pnpm changeset
```

Follow the prompts to select the package, bump type, and write a summary. This creates a markdown file in `.changeset/` — commit it with your PR.

## Code Style

- **Tabs**, 100-char line width, double quotes
- **Functional style** — no classes, prefer pure functions
- **Biome** for lint + format — run `pnpm lint:fix` to auto-fix
- ESM with `.js` extensions in imports

## Testing

```sh
pnpm test          # run all tests
pnpm test:watch    # watch mode
pnpm typecheck     # type checking
pnpm lint          # lint check
```

All PRs must pass CI (lint, typecheck, test, build) on Node 18 and 22.
