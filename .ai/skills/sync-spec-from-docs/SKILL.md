# Sync Spec From Docs

## Steps

1. **Determine tool** — which target? (claude-code, cursor, codex, copilot)

2. **Read research config** — open `specs/<tool>.research.json` for doc URLs, hashes, and current version info

3. **Fetch and compare** — for each doc entry in the research config:
   - Read cached content from `specs/.cache/<tool>/<filename>` if it exists (this is your baseline for diffing)
   - Fetch the latest content from the URL
   - If the content hash matches `lastHash` → skip (no changes)
   - If the content differs → diff the cached version against the fetched version to identify what changed
   - Classify changes: structural, behavioral, format (report), or cosmetic (skip)

4. **Idempotency check** — before each edit, verify the change isn't already in the spec. Skip and note "already current" if so.

5. **Update the spec** with:
   - New capabilities the tool has added
   - Changed file formats or field schemas
   - Deprecated features with migration notes

6. **Update Known Gaps** — compare the updated spec against current emitter output to identify:
   - Missing fields (tool supports it, dotai doesn't emit it)
   - Wrong formats (dotai output doesn't match expected format)
   - Over-emitting (dotai outputs fields the tool ignores)

7. **Update cache and hashes** — after processing:
   - Save fetched content to `specs/.cache/<tool>/<filename>` (create the directory if needed)
   - Update `lastHash` (SHA-256 of fetched content) and `lastFetched` (today's date) for each doc entry in the research config
   - Bump `lastResearchedVersion` and date in the research config JSON

8. **Cross-reference drift report** — if `specs/<tool>.drift-report.json` exists with status `"pending"`:
   - For each change in the drift report that you've now addressed, note it as resolved
   - If all changes are addressed, update the drift report status to `"resolved"`