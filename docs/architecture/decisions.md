# Architecture Decisions

## ADR-001: Inline content generation over file references or symlinks

**Status:** Accepted
**Date:** 2026-02-20

### Context

The dotai tool generates configuration files for multiple coding agents (Claude Code, Cursor, Codex) from a universal `.ai/` source format. We evaluated three strategies for producing these output files:

1. **Inline (current)** — Emitters read `.ai/` sources, transform as needed, and write self-contained output files.
2. **File references** — Generated files use agent-native import syntax (e.g., `@path/to/file`) to point back to `.ai/` sources instead of copying content.
3. **Symlinks** — Generated files are filesystem symlinks to `.ai/` source files.

### Decision

We use **inline content generation** for all emitters.

### Reasons

**File references don't work across targets.** Only Claude Code's `CLAUDE.md` supports an import mechanism (`@path/to/file`). Cursor rules (`.mdc`) and Codex (`AGENTS.md`) have no import or include syntax. Special-casing one target would add complexity for marginal benefit.

**Symlinks only work when source and destination are byte-identical.** Most emitters *transform* content rather than copying it verbatim:

- Cursor rules inject YAML frontmatter (`description`, `globs`, `alwaysApply`) that doesn't exist in `.ai/` source files.
- `CLAUDE.md` and `AGENTS.md` are concatenations of multiple rules with separators and section headers.
- `.claude/rules/*.md` files inject `<!-- applies to: ... -->` HTML comments.
- MCP, permissions, and hooks emit structured JSON/TOML aggregated from multiple config entries.

The only case where content is byte-identical is **skills** (1:1 file copies), but even there symlinks introduce cross-platform concerns (Windows git support) and a runtime dependency on `.ai/` existing at the expected relative path.

**The sync + state tracking model already solves the staleness problem.** The `sync` command with content hashing in `.ai/.state.json` keeps generated files up to date, which is the same problem file references or symlinks would address — but in a target-agnostic way.

### Consequences

- All generated output files are self-contained with no runtime dependency on `.ai/` source files. (Notably, this means generated files can be used independently of the dotai tool after generation.)
- Content duplication exists between `.ai/` sources and generated files, but `.ai/` remains the single source of truth.
- Users must run `dotai sync` after modifying `.ai/` sources to propagate changes. (We can suggest a git pre-commit hook or LLM instruction to automate this.)
