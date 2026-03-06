# Agentic Architecture Strategy

How to organize dotai's codebase and workflows to favor agentic programming — using AI agents to build and maintain the tool that configures AI agents.

## 1. Tool Knowledge as Data, Not Code

Target tool behavior is currently embedded in emitter logic. If a tool changes its config format, an agent needs to understand the emitter code to update it. Instead:

- **Create a `specs/` directory** with structured docs per target tool (e.g. `specs/cursor.md`, `specs/claude-code.md`). Each spec documents the tool's config format, file paths, capabilities, and quirks.
- Emitters reference these specs. When a tool changes, update the spec, and an agent can then update the emitter code with full context.
- Specs can include version history — "as of v1.2, Cursor supports X" — so agents know what's current.

## 2. Test-Driven Contracts per Target

Agents work best when they can validate their own work. For each target tool:

- **Snapshot/fixture tests** that capture the exact expected output for a given config. An agent updating an emitter can run tests immediately to verify correctness.
- **Schema validation tests** — if a target tool publishes a JSON schema for its config, validate emitter output against it.
- This lets an agent confidently make changes: update spec → update emitter → tests pass → done.

## 3. Isolated, Self-Contained Emitter Modules

Each emitter should be **completely self-contained** — its own types, its own test fixtures, its own spec reference. An agent working on the Cursor emitter shouldn't need to understand the Codex emitter.

- **One file per concern** within an emitter. Rather than one big `emit()` function handling rules, skills, MCP, agents — split into focused functions.
- Smaller functions = smaller context window = better agent output.

## 4. Automated Spec Monitoring

The hardest part: keeping up with target tool changes.

- **A scheduled agent task** (or GitHub Action) that periodically checks target tool documentation/changelogs for updates. It could scrape or fetch known doc URLs and diff against stored specs.
- When changes are detected, it opens an issue or PR with the diff and a summary of what changed.
- A second agent can take that diff and propose emitter updates.

## 5. CLAUDE.md / Rules as Agent Onboarding

Extend the existing CLAUDE.md approach:

- **Per-directory CLAUDE.md files** in `src/emitters/`, `src/commands/`, etc. that give agents local context. "This directory contains emitters. Each emitter implements the `Emitter` interface. To add a new target, do X."
- **Decision records** (lightweight ADRs) in a `decisions/` directory. When an agent encounters a design question ("why does merge work this way?"), the answer is already documented.

## 6. Task Decomposition Patterns

Structure work so it's naturally decomposable into agent-sized chunks:

- **Issue templates** that break "add support for tool X" into: (1) create spec, (2) create emitter, (3) add tests, (4) register in sync command, (5) update docs. Each step is independently completable by an agent.
- **A `tasks/` or `.ai/skills/` directory** with reusable skill definitions for common operations — "add-target", "update-spec", "add-entity-type". dotai's own skills system supports this.

## 7. The Meta Play: Dogfood dotai for dotai

Use dotai's own config to define the rules, skills, and agents that maintain dotai:

- Skills like `update-emitter`, `add-target-tool`, `sync-spec-from-docs`
- Rules like "always run tests after modifying emitters", "check spec before changing output format"
- This creates a feedback loop: improving dotai's skills improves the agents that maintain dotai.

## Where to Start

1. **Specs directory** — clear reference material for each target tool
2. **Per-emitter isolation** — small, testable units of work
3. **Dogfooding** — use dotai skills/rules to maintain dotai itself

These three changes give agents the most leverage immediately.
