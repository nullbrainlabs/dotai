---
description: Act on spec drift — map doc changes to affected emitters and apply updates.
---

# Handle Spec Drift

## Steps

1. **Get the drift report** — determine the entry point:
   - **From GitHub issue**: read the issue body, extract the drift-report JSON from the fenced ```json code block
   - **From local invocation with tool name**: read `specs/<tool>.drift-report.json` if it exists; if not, tell the user to run the spec-researcher agent first (e.g. "Run `@claude research <tool>` with the spec-researcher agent to generate a drift report")
   - Parse the drift report to get the `changes` array

2. **Read the research config** — open `specs/<tool>.research.json` for each affected tool to find:
   - Doc URLs that changed
   - Emitter files that consume this spec
   - Output paths that may need updating

3. **Read the current spec** — open `specs/<tool>.md` and identify which sections are affected by the changes listed in the drift report's `changes` array.

4. **Update the spec** — for each change in the `changes` array:
   - **Idempotency check**: before editing, verify the change isn't already reflected in the spec. If it is, skip and note "already current"
   - Update field reference tables
   - Update format examples
   - Update the header date and version
   - Update Known Gaps and Areas to Monitor

5. **Map to emitters** — for each change, use the `emittersAffected` field from the drift report (or fall back to the `emitters` array in the research config). Check if the change affects:
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

8. **Mark resolved** — update `specs/<tool>.drift-report.json`: set `status` to `"resolved"`.
