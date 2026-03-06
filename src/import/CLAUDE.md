# src/import/

Reverse operation: imports existing AI tool configs into `.ai/` format.

## Key files

- `scanner.ts` — `scanForConfigs()` detects existing config files (CLAUDE.md, .cursor/rules, AGENTS.md, .github/copilot-instructions.md, etc.). Returns `DetectedFile[]` with source tool and kind.
- `parsers/claude.ts` — Parses Claude Code config (CLAUDE.md, .claude/rules/, .mcp.json).
- `parsers/cursor.ts` — Parses Cursor config (.cursorrules, .cursor/rules/).
- `parsers/codex.ts` — Parses Codex config (AGENTS.md, codex.toml/.codex/).
- `runner.ts` — `runImport()` orchestrates: scan, parse, merge into ProjectConfig.
- `writer.ts` — `writeProjectConfig()` writes the resulting config to `.ai/` directory.
- `index.ts` — Re-exports public API.

## Data flow

```
Existing configs ─→ scanner ─→ parsers ─→ ProjectConfig ─→ writer ─→ .ai/
```
