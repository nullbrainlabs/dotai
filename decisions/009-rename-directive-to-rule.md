# ADR-009: Rename "directive" to "rule"

**Status:** Accepted
**Date:** 2026-02-20

## Context

The original codebase used "directive" as the domain term for persistent text-based instructions. However, every target tool uses different terminology: Claude Code calls them "rules" (in `.claude/rules/`), Cursor calls them "rules" (`.cursor/rules/`), and Codex uses "instructions" in `AGENTS.md`. The term "directive" didn't match any target tool's vocabulary.

## Decision

Rename "directive" to **"rule"** throughout the entire codebase:

- Domain type: `Directive` → `Rule`
- Factory: `createDirective()` → `createRule()`
- Type guard: `isDirective()` → `isRule()`
- Config property: `config.directives` → `config.rules`
- Directory: `.ai/directives/` → `.ai/rules/`
- Emitter: `directivesEmitter` → `rulesEmitter`

## Consequences

- Terminology aligns with the most common target tool vocabulary (both Claude and Cursor use "rules").
- Documentation and error messages are more intuitive for users already familiar with these tools.
- The rename was a one-time migration — no backward compatibility shim was needed.
