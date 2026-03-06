---
description: Act on spec drift — map doc changes to affected emitters and apply updates.
---

# Handle Spec Drift

## Steps

1. **Read the drift report** — check the GitHub issue or provided summary for what changed in official docs.

2. **Read the research config** — open `specs/<tool>.research.json` for each affected tool to find:
   - Doc URLs that changed
   - Emitter files that consume this spec
   - Output paths that may need updating

3. **Read the current spec** — open `specs/<tool>.md` and identify which sections are affected by the changes.

4. **Update the spec** — apply changes to the spec file:
   - Update field reference tables
   - Update format examples
   - Update the header date and version
   - Update Known Gaps and Areas to Monitor

5. **Map to emitters** — for each change, identify which emitters are affected using the `emitters` array in the research config. Check if the change affects:
   - Output file format
   - New fields to emit
   - Deprecated fields to remove
   - Changed field names or values

6. **Apply emitter changes** — for each affected emitter, follow the update-emitter skill pattern:
   - Read the emitter source
   - Assess cross-target impact
   - Make the change
   - Update tests

7. **Verify** — run the full verification suite:

```sh
pnpm test -- --update
pnpm test
pnpm typecheck
```
