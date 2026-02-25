---
title: Directives
description: Persistent instructions that shape AI agent behavior.
---

Directives are the most-used entity type in dotai. A directive is a piece of Markdown text that is loaded into an AI tool's context and shapes how the agent behaves — what conventions to follow, what to avoid, how to communicate. Every major AI coding tool has its own format for persistent instructions; directives give you one format that translates into all of them.

## Configuration

Create directives by adding Markdown files to `.ai/directives/`. Each file becomes one directive. The filename determines the directive's identity; the frontmatter controls how it is scoped and applied.

```
.ai/
  directives/
    coding-style.md
    testing.md
    security.md
```

### Frontmatter fields

| Field | Type | Default | Description |
|---|---|---|---|
| `scope` | `"enterprise" \| "project" \| "user" \| "local"` | `"project"` | Where the directive applies |
| `alwaysApply` | `boolean` | `true` | Include in every conversation regardless of context |
| `appliesTo` | `string[]` | `undefined` | Glob patterns that activate the directive conditionally |
| `description` | `string` | `undefined` | Human-readable summary, used in some tool formats |
| `outputDir` | `string` | `undefined` | Subdirectory for the emitted file (e.g. `docs-site` → `docs-site/CLAUDE.md`) |
| `override` | `boolean` | `false` | Emit to `AGENTS.override.md` instead of `AGENTS.md` (Codex only) |

### TypeScript interface

```typescript
interface Directive {
  content: string;
  scope: Scope;
  appliesTo?: string[];
  alwaysApply: boolean;
  description?: string;
  outputDir?: string;
  override?: boolean;
}
```

## Always-apply vs conditional

### Always-apply

An always-apply directive is included in every conversation. Use this for global conventions that should never be ignored.

```markdown
---
alwaysApply: true
description: Core coding conventions for this repository.
---

Always use tabs for indentation. Maximum line length is 100 characters.
Prefer named exports over default exports.
```

### Conditional (appliesTo)

A conditional directive is only activated when the agent is working with files that match the given globs. Use this to keep context focused and avoid noise.

```markdown
---
alwaysApply: false
appliesTo:
  - "**/*.test.ts"
  - "**/*.spec.ts"
description: Testing conventions, activated for test files.
---

Use `describe` blocks to group related tests.
Each test should assert one thing. Prefer `toEqual` over `toBe` for objects.
```

## Output directory

The `outputDir` field groups emitted files into a subdirectory. This is useful for monorepos or projects with multiple documentation roots:

```markdown
---
alwaysApply: true
description: Docs site conventions.
outputDir: docs-site
---

Use sentence case for headings. Keep pages focused on one topic.
```

This emits to `docs-site/CLAUDE.md` for Claude Code, `docs-site/.cursor/rules/docs-site-conventions.mdc` for Cursor, and so on. The directive content is grouped per `outputDir` — all directives sharing the same `outputDir` are concatenated into a single output file.

## Override (Codex only)

The `override` field controls whether a directive is emitted to `AGENTS.override.md` instead of the default `AGENTS.md`. This only affects Codex output:

```markdown
---
alwaysApply: true
description: Strict rules that override base instructions.
override: true
---

Never modify files in the vendor/ directory.
```

For Claude Code, Cursor, and Copilot, the `override` field has no effect — the directive is emitted to the standard output location.

## Cross-tool support

dotai translates directives into each tool's native format. The exact output depends on `alwaysApply`, `appliesTo`, scope, and `outputDir`.

| Behavior | Claude Code | Cursor | Codex | Copilot |
|---|---|---|---|---|
| `alwaysApply: true` | `CLAUDE.md` | `.cursor/rules/*.mdc` | `AGENTS.md` | `.github/copilot-instructions.md` |
| `alwaysApply: false` | `.claude/rules/*.md` | `.cursor/rules/*.mdc` | `AGENTS.md` | `.github/instructions/*.instructions.md` |
| `appliesTo` globs | Frontmatter `paths:` | `globs` field | Ignored | `applyTo` frontmatter |
| Local scope | `CLAUDE.local.md` | N/A | N/A | N/A |
| `outputDir` set | `<dir>/CLAUDE.md` | `<dir>/.cursor/rules/*.mdc` | `<dir>/AGENTS.md` | `<dir>/.github/copilot-instructions.md` |
| `override: true` | No effect | No effect | `AGENTS.override.md` | No effect |

:::caution
Codex does not support conditional directive activation. Directives with `alwaysApply: false` or `appliesTo` set will still be emitted to Codex, but the conditional logic is lost — the directive is always included.
:::

### Known limitations

- **Codex** — Does not parse `appliesTo`. All directives are appended to `AGENTS.md` regardless of scope or conditionality. Conditional semantics are silently dropped.
- **Cursor** — Supports glob patterns via the `globs` field in `.mdc` frontmatter. Conditional directives translate faithfully.
- **Claude Code** — Local-scope directives with `appliesTo` are placed in `CLAUDE.local.md` since Claude Code does not support scoped local rules.

## Best practices

**Be specific.** Vague directives ("write good code") waste context and are ignored in practice. Concrete directives ("use named exports, never default exports") are actionable.

**Include examples.** A directive that shows a before/after or a code snippet is far more effective than one that only states a rule.

**Explain the why.** Directives that include a brief rationale are more likely to be followed consistently and help new team members understand conventions.

**Keep each directive focused.** One concern per directive file. A directive that covers coding style, security, and testing is hard to maintain and hard to conditionally activate.

**Use conditional activation.** If a directive only matters for test files, Python files, or migration scripts, set `appliesTo` so it does not pollute context when working elsewhere.

**Use `outputDir` for monorepos.** If you have a monorepo with multiple packages, use `outputDir` to scope directives to the relevant package root.
