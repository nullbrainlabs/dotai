---
name: add-decision
description: Record an architecture decision as an ADR in decisions/
---

# Add Decision

Record an architecture decision in the `decisions/` directory.

## Process

1. Determine the decision to record. If invoked automatically (from the architecture-decisions rule), summarize the decision you just made. If invoked explicitly by the user, ask what decision to record. If you're
in a conversation, review previous messages to find a decision that was made but not yet recorded and include that in your ask.
2. Read `decisions/README.md` to find the current highest ADR number.
3. Compute the next number (zero-padded to 3 digits).
4. Write the ADR file at `decisions/<number>-<slug>.md` using the format below.
5. Update the index table in `decisions/README.md` — append a new row before the blank line after the last table entry.

## ADR Format

```markdown
# ADR-NNN: Title

**Status:** Accepted
**Date:** YYYY-MM-DD

## Context
Why this decision was needed. What alternatives were considered.

## Decision
What we chose and why.

## Consequences
What follows from this decision — both benefits and tradeoffs.
```

## Slug Rules

- Lowercase, hyphen-separated, no special characters
- Short but descriptive (3-5 words)
- Example: `inline-content-generation`, `functional-style`

## Guidelines

- Keep ADRs concise — a few paragraphs, not a design doc
- Focus on the *why*, not the *what* (the code shows the what)
- Include alternatives you considered and why they were rejected
- Use present tense for the decision, past tense for context
- Date should be today's date
