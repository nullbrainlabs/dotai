# ADR-006: State-based conflict detection

**Status:** Accepted
**Date:** 2026-02-20

## Context

Generated output files might be manually edited by users or other tools between syncs. Blindly overwriting would lose those changes. We needed a way to detect when a generated file has been modified externally.

## Decision

Track sync state in `.ai/.state.json` via `src/state.ts`:

- On each sync, compute a SHA-256 content hash (truncated to 16 hex chars) for every emitted file and store it alongside a timestamp.
- Before the next sync, compare the on-disk file's hash against the stored hash.
- If they differ and the new emitted content also differs, flag as a **conflict**.
- Conflicts block sync unless `--force` is passed.

File statuses: `new`, `up-to-date`, `modified`, `conflict`, `orphaned`.

## Consequences

- Users are protected from accidental overwrites of manual edits.
- The `status` command can show which files are out of sync without performing a write.
- `.ai/.state.json` should be committed to the repo so all collaborators share sync state.
- The `--force` flag provides an explicit escape hatch when conflicts are intentional.
