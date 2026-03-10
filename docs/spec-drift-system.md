# Spec Drift Automation System

How dotai detects, analyzes, and resolves configuration drift between target AI coding tools and dotai's emitter output.

## Overview

dotai maintains specs for 4 target tools (Claude Code, Cursor, Codex, Copilot). Each tool evolves independently — new config fields, changed formats, deprecated features. The spec drift system keeps dotai current by:

1. **Detecting** changes in official docs (automated, weekly)
2. **Analyzing** what changed and which emitters are affected (agent-assisted)
3. **Updating** specs, emitters, and tests (skill-guided)
4. **Verifying** correctness across all targets (agent-reviewed)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DETECTION LAYER                             │
│                                                                 │
│  spec-monitor.yml (GitHub Action, weekly)                       │
│    ├─ Phase 1: Hash check — deterministic, no LLM              │
│    └─ Phase 2: LLM interpretation — only for changed docs      │
│         └─ Creates GitHub issue with structured drift report    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ANALYSIS LAYER                              │
│                                                                 │
│  spec-researcher agent (opus, 30 turns)                         │
│    ├─ Reads research config for doc URLs + emitter mappings     │
│    ├─ Fetches docs, compares against spec + cached docs         │
│    ├─ Produces structured change report (JSON artifact)         │
│    └─ Updates spec file with findings                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     UPDATE LAYER                                │
│                                                                 │
│  Skills (human or agent invoked):                               │
│    ├─ /sync-spec-from-docs — update spec from latest docs       │
│    ├─ /handle-spec-drift — full orchestration from drift report │
│    └─ /update-emitter — modify emitter code for spec changes    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VERIFICATION LAYER                          │
│                                                                 │
│  emitter-reviewer agent (sonnet, readonly, 15 turns)            │
│    ├─ Checks spec compliance                                    │
│    ├─ Checks cross-target consistency                           │
│    ├─ Checks test coverage + snapshot freshness                 │
│    └─ Reports PASS / WARN / FAIL                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Spec Files — `specs/<tool>.md`

Complete reference for a target tool's configuration capabilities. Every spec follows this structure:

1. **Header** — tool name, source URLs, last researched version, date verified
2. **Per-entity sections** — Rules, Agents, Skills, Hooks, MCP, Permissions, Ignore
3. **Each section has**: file paths table, format examples, field reference table
4. **dotai Entity Coverage** — emitter status table per entity
5. **Known Gaps** — table with severity (Critical / Important / Low) and notes
6. **Areas to Monitor** — bullet list of things likely to change

### Research Configs — `specs/<tool>.research.json`

Machine-readable metadata that tells agents where to look and what to watch:

```json
{
  "tool": "claude-code",
  "lastResearchedVersion": "Claude Code 1.0 (CLI)",
  "spec": "specs/claude-code.md",
  "llmsTxt": "https://code.claude.com/docs/llms.txt",
  "docs": [
    {
      "url": "https://code.claude.com/docs/en/hooks.md",
      "lastHash": "sha256:...",
      "lastFetched": "2026-03-07"
    }
  ],
  "emitters": ["src/emitters/hooks.ts", "..."],
  "outputPaths": { "hooks": ".claude/settings.json (hooks key)" },
  "notes": ["Hook events use PascalCase (PreToolUse)"]
}
```

Key fields:
- `docs` — array of doc entries with URL, content hash, and fetch date (enables deterministic change detection)
- `llmsTxt` — fallback index URL when individual doc URLs return 403/404
- `emitters` — which source files consume this spec (maps changes to code)
- `outputPaths` — where the tool expects config files (for gap analysis)
- `notes` — tool-specific quirks and implementation gotchas

### Doc Cache — `specs/.cache/<tool>/`

Raw fetched content from the last successful research run:

```
specs/.cache/
  claude-code/
    settings.md
    hooks.md
    mcp.md
    ...
  cursor/
    rules.md
    ...
```

Purpose:
- Enables real diff comparison (old cached content vs new fetched content)
- Makes local reruns produce identical results
- Lets you `git diff` the cache to see exactly what changed in upstream docs
- Eliminates the need for LLM inference about "what probably changed"

### Drift Reports — `specs/<tool>.drift-report.json`

Structured intermediate artifact produced by the analysis phase:

```json
{
  "tool": "claude-code",
  "detectedAt": "2026-03-09",
  "changes": [
    {
      "section": "hooks",
      "type": "new-field",
      "description": "Added 'timeout' field to hook handlers",
      "docUrl": "https://code.claude.com/docs/en/hooks.md",
      "specLines": "245-260",
      "emittersAffected": ["src/emitters/hooks.ts"]
    }
  ],
  "status": "pending"
}
```

Benefits:
- Makes handle-spec-drift deterministic (reads structured data, not prose)
- Diffable and reviewable in PRs
- Validates with a JSON schema
- Survives across agent invocations
- `status` field tracks resolution progress

---

## Detection: Two-Phase Monitor

The current spec-monitor.yml runs weekly and inlines a ~40-line prompt that does everything in one pass. This causes inconsistency — the same docs can be flagged or not depending on how the LLM interprets the comparison.

### Current Flow (problems)

```
Fetch docs → LLM compares against spec → maybe create issue
```

- No baseline: comparing "live docs" vs "our spec interpretation," not "live docs" vs "last-seen docs"
- Non-deterministic: LLM decides what's "meaningful" with no criteria
- Duplicates logic: the prompt reimplements what spec-researcher already does

### Target Flow (two-phase)

```
Phase 1: Hash Check (deterministic, no LLM)
  ├─ For each doc URL in research config
  │   ├─ Fetch content
  │   ├─ Compute SHA-256 hash
  │   └─ Compare against lastHash in research config
  ├─ If ALL hashes match → exit, no drift
  └─ If ANY differ → save new content to cache, pass to Phase 2

Phase 2: LLM Interpretation (only changed docs)
  ├─ Diff cached old content vs fetched new content
  ├─ Classify each change using the change taxonomy (see below)
  ├─ Skip cosmetic changes
  ├─ If structural/behavioral/format changes found:
  │   ├─ Write drift-report.json
  │   ├─ Check for existing open issue (dedup)
  │   └─ Create GitHub issue with structured report
  └─ If only cosmetic changes:
      └─ Update hashes in research config, no issue
```

### Change Taxonomy

Explicit criteria for what constitutes drift (eliminates LLM guessing):

| Category | Examples | Action |
|----------|----------|--------|
| **Structural** | New config key, removed field, changed type, new file path | Always report |
| **Behavioral** | Changed default value, new enum option, changed validation | Always report |
| **Format** | New file extension, changed path convention, new frontmatter field | Always report |
| **Cosmetic** | Rewording, reordering, typo fixes, added examples for existing features | Skip — update hash only |

---

## Analysis: spec-researcher Agent

### Current Issues

- No structured output format — produces free-form text that's hard to act on
- No awareness of cached docs — always infers changes from spec-vs-docs
- No idempotency — running twice can produce different edits

### Target Behavior

The spec-researcher agent should:

1. Read `specs/<tool>.research.json` for doc URLs and metadata
2. Read cached docs from `specs/.cache/<tool>/` for baseline comparison
3. Fetch latest docs from each URL
4. For each doc where content changed:
   - Diff old cached content vs new fetched content
   - Classify changes using the change taxonomy
   - Map changes to spec sections and emitters
5. Update the spec file with findings
6. Write structured output as `specs/<tool>.drift-report.json`
7. Update the doc cache with new content
8. Update research config hashes and dates

### Structured Output Format

The agent must return findings in this exact format:

```markdown
### Changes Found
| Section | Change Type | Description | Spec Line(s) |
|---------|------------|-------------|---------------|
| Hooks | new-field | Added 'timeout' field | 245-260 |
| MCP | format-change | 'transport' field renamed to 'type' | 180-195 |

### Updated Gaps
| Entity | Gap | Severity | Notes |
|--------|-----|----------|-------|
| Hooks | timeout not emitted | Important | New required field |

### Research Config Updates
- lastResearchedVersion: <new version>
- Docs array changes: <added/removed URLs>
- Hash updates: <list of URLs with new hashes>
```

### Idempotency

Before making any edit, the agent must check if the change is already reflected in the current spec. If the spec already contains the information, skip that change and note "already current" in the output. This ensures running the agent twice produces the same result.

---

## Update: Skills

### handle-spec-drift

Orchestrates the full resolution of a drift report.

**Dual entry points** (supports both CI and local use):

1. **From GitHub issue** — reads the issue body for drift details
2. **From local invocation** — accepts a tool name directly; reads `specs/<tool>.drift-report.json` if available, otherwise runs spec-researcher first

**Steps:**

1. Get the drift report (issue body or drift-report.json or direct tool name)
2. Read `specs/<tool>.research.json` for emitter mappings
3. Read the current spec to identify affected sections
4. Update the spec (field tables, format examples, header, Known Gaps, Areas to Monitor)
5. Map changes to emitters using the `emitters` array
6. For each affected emitter, follow the update-emitter skill
7. Run verification suite (`pnpm test -- --update`, `pnpm test`, `pnpm typecheck`)
8. Mark drift-report.json status as "resolved"

**Idempotency check:** Before each edit, verify the change isn't already applied. Skip and note "already current" if so.

### sync-spec-from-docs

Inline spec update for use during coding sessions. Same as current but with:

- Reads cached docs for baseline comparison (not just spec-vs-docs inference)
- Updates doc cache after fetching
- Updates research config hashes
- Checks for existing drift-report.json and marks resolved changes

### update-emitter

Modifies emitter code to match spec changes. Current version is solid — no major changes needed. Add:

- Reads drift-report.json when available to understand exactly what changed
- Cross-references spec Known Gaps to avoid "fixing" documented gaps without discussion

---

## Verification: emitter-reviewer Agent

### Current Issues

- No spec freshness check — validates against potentially stale specs
- No awareness of drift-report.json — doesn't know what was supposed to change

### Target Behavior

Add to the review process:

1. **Check spec freshness** — read the header date in `specs/<target>.md`. If older than 30 days, WARN that the spec may be stale before validating against it.
2. **Cross-reference drift report** — if `specs/<tool>.drift-report.json` exists, verify that all changes marked as affecting this emitter have been addressed.
3. Existing checks remain: spec compliance, cross-target consistency, test coverage, layer violations.

---

## Supporting Infrastructure

### Rules

**emitter-spec-check** (`.ai/rules/emitter-spec-check.md`):
- Triggers on `src/emitters/**/*.ts`
- Requires reading the corresponding spec before modifying output
- Maps emitter files to specs: `*/claude.ts` → `specs/claude-code.md`, etc.

### Research Config Schema

All research configs follow this schema (enforced by convention, eventually by validation):

```typescript
interface ResearchConfig {
  tool: string;
  lastResearchedVersion: string;
  spec: string;
  llmsTxt: string;
  docs: DocEntry[];
  emitters: string[];
  outputPaths: Record<string, string | null>;
  notes: string[];
}

interface DocEntry {
  url: string;
  lastHash: string;    // SHA-256 of last-fetched content
  lastFetched: string; // ISO date
}
```

### Cross-Tool Entity Mapping

Each entity type has different conventions per tool:

| Entity | Claude Code | Cursor | Codex | Copilot |
|--------|------------|--------|-------|---------|
| Rules | `CLAUDE.md`, `.claude/rules/*.md` | `.cursor/rules/*.mdc` | `AGENTS.md` | `.github/copilot-instructions.md`, `.github/instructions/*.instructions.md` |
| Agents | `.claude/agents/*.md` | `.cursor/agents/*.md` | `.codex/agents/*.toml` | `.github/agents/*.agent.md` |
| Hooks | `.claude/settings.json` (PascalCase) | Not supported | Not supported | `.github/hooks/hooks.json` (camelCase) |
| MCP | `.mcp.json` | `.cursor/mcp.json` | `.codex/config.toml` | `.vscode/mcp.json` |

This mapping lives in each tool's research config (`outputPaths`) and spec file.

---

## Design Principles

1. **Deterministic first, LLM second** — use hashes and diffs for change detection; only invoke LLMs for interpretation and code changes.

2. **Structured artifacts over prose** — drift-report.json, research configs, and spec tables are machine-readable. Free-form text is for humans reading specs.

3. **Idempotent operations** — every skill and agent should produce the same result when run twice against the same input. Check before editing.

4. **Local-first** — every flow that works in CI should also work from a local terminal with `pnpm dev` or direct skill invocation.

5. **Single source of truth** — specs are the authority for tool capabilities. Research configs are the authority for where to look. Drift reports are the authority for what changed.

6. **Cache for consistency** — cached docs eliminate the "what did it look like last time?" problem. Hash comparisons are 100% deterministic.

7. **Small blast radius** — each phase is independently valuable. Phase 1 alone makes research configs more useful. Phase 2 alone makes the monitor more reliable. No phase depends on all others being complete.
