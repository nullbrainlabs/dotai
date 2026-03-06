---
description: Update a target tool's spec from official docs. For inline use during coding sessions.
disableAutoInvocation: true
---

# Sync Spec From Docs

## Steps

1. **Determine tool** — which target? (claude-code, cursor, codex, copilot)

2. **Read research config** — open `specs/<tool>.research.json` for doc URLs and current version info

3. **Fetch and compare** — for each URL in the research config, fetch the latest docs and compare against the existing spec at `specs/<tool>.md`

4. **Update the spec** with:
   - New capabilities the tool has added
   - Changed file formats or field schemas
   - Deprecated features with migration notes

5. **Update Known Gaps** — compare the updated spec against current emitter output to identify:
   - Missing fields (tool supports it, dotai doesn't emit it)
   - Wrong formats (dotai output doesn't match expected format)
   - Over-emitting (dotai outputs fields the tool ignores)

6. **Update research config** — bump `lastResearchedVersion` and date in the JSON file
