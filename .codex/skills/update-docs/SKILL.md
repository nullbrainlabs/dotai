---
name: update-docs
description: Update documentation pages to reflect code changes
---

# Update Docs

Update the Starlight documentation site to reflect recent code changes.

## When to Use

Invoke `/update-docs` after making code changes that affect the public API, domain model, CLI commands, config format, or cross-tool mapping.

## Process

1. **Identify changes**: Run `git diff HEAD~1 -- src/` to see what changed
2. **Map changes to docs**: Use this mapping to find affected pages:
   - `src/commands/` → `docs-site/src/content/docs/reference/cli.md`
   - `src/domain/` → `docs-site/src/content/docs/architecture/domain-model.md` and `docs-site/src/content/docs/reference/domain-entities.md`
   - `src/config/` → `docs-site/src/content/docs/reference/config-yaml.md` and `docs-site/src/content/docs/guides/config-format.md`
   - `src/emitters/` → `docs-site/src/content/docs/architecture/cross-tool-mapping.md`
   - `src/import/` → `docs-site/src/content/docs/guides/import.md`
   - `src/state.ts` → `docs-site/src/content/docs/reference/cli.md` (sync/status commands)
3. **Read both code and docs**: Understand the current state of both
4. **Update docs**: Make the documentation match the code
5. **Verify**: Ensure tables, code examples, and descriptions are accurate

## Guidelines

### DO:
- Keep descriptions concise and accurate
- Update code examples to match current interfaces
- Update tables when entity fields change
- Add new sections for new features

### DO NOT:
- Remove content without reason
- Add speculative documentation for unimplemented features
- Change the page structure unnecessarily
- Modify frontmatter unless the title or description needs updating
