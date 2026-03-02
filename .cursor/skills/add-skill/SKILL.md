---
name: add-skill
description: Create new skills, modify and improve existing skills. Use when users want to create a skill from scratch or update an existing skill.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

Skills are stored in `.ai/skills/<skill-name>/` and propagated to your AI tools via `dotai sync`.

## Communicating with the user

The skill creator is liable to be used by people across a wide range of familiarity with coding jargon. Pay attention to context cues to understand how to phrase your communication! It's OK to briefly explain terms if you're in doubt.

---

## Creating a skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed. The user may need to fill the gaps, and should confirm before proceeding to the next step.

1. What should this skill enable the AI to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies.

Check available MCPs - if useful for research (searching docs, finding similar skills, looking up best practices), research in parallel via subagents if available, otherwise inline. Come prepared with context to reduce burden on the user.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier (kebab-case, e.g. `review-pr`)
- **description**: When to trigger, what it does. This is the primary triggering mechanism — include both what the skill does AND specific contexts for when to use it. All "when to use" info goes here, not in the body. Make descriptions a little "pushy" to avoid undertriggering. For instance, instead of "How to build a dashboard", write "How to build a dashboard. Use this skill whenever the user mentions dashboards, data visualization, or wants to display any kind of data, even if they don't explicitly ask for a 'dashboard.'"
- **the rest of the skill**

Write the SKILL.md to `.ai/skills/<skill-name>/SKILL.md`, then run `dotai sync` to propagate it.

### Skill Writing Guide

#### Anatomy of a Skill

```
.ai/skills/skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - In context whenever skill triggers (<500 lines ideal)
3. **Bundled resources** - As needed (unlimited, scripts can execute without loading)

**Key patterns:**
- Keep SKILL.md under 500 lines; move details into reference files with clear pointers
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

**Domain organization**: When a skill supports multiple domains/frameworks, organize by variant:
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
The AI reads only the relevant reference file.

#### Valid Frontmatter Fields

- `description` (string) — what the skill does and when to use it
- `disableAutoInvocation` (boolean) — if true, only explicit /skill-name invocation
- `argumentHint` (string) — hint for argument format, e.g. `"<file-path>"`
- `userInvocable` (boolean) — if false, only model-invoked
- `allowedTools` (string[]) — tools the skill can use
- `model` (string) — model override for execution
- `context` ("fork") — run in isolated context
- `agent` (string) — delegate to a named agent

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats:**
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern:**
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

#### Writing Style

Try to explain to the model why things are important in lieu of heavy-handed MUSTs. Use theory of mind and try to make the skill general and not super-narrow to specific examples. Start by writing a draft and then look at it with fresh eyes and improve it.

---

## Improving an existing skill

When modifying a skill, read the existing SKILL.md first. Focus on:

1. **Keep the prompt lean.** Remove things that aren't pulling their weight. If the skill is making the model waste time on unproductive steps, remove those parts.

2. **Explain the why.** Explain the reasoning behind instructions rather than using rigid ALWAYS/NEVER rules. LLMs respond better to understanding *why* something matters than to blunt constraints.

3. **Generalize.** Avoid overfitting to specific examples. The skill should work across many different prompts, not just the ones you tested with.

4. **Look for repeated work.** If the model keeps writing the same helper script across invocations, bundle that script in `scripts/` and reference it from the SKILL.md.

After modifying a skill, run `dotai sync` to propagate changes to your AI tool configs.
