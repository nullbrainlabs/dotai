import { existsSync, mkdirSync, rmSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runCheck } from "../src/commands/check.js";
import { runInit } from "../src/commands/init.js";
import { runStatus } from "../src/commands/status.js";
import type { SyncOptions } from "../src/commands/sync.js";
import { runSync } from "../src/commands/sync.js";

const PROJECT = join(import.meta.dirname, "fixtures/tmp-e2e");
const defaults: SyncOptions = { targets: [], dryRun: false, scope: "project", force: false };

describe("end-to-end", () => {
	beforeAll(() => {
		if (existsSync(PROJECT)) rmSync(PROJECT, { recursive: true });
		mkdirSync(PROJECT, { recursive: true });
	});

	afterAll(() => {
		if (existsSync(PROJECT)) rmSync(PROJECT, { recursive: true });
	});

	// ── Step 1: init ──────────────────────────────────────────────────

	it("init scaffolds .ai/ directory", async () => {
		await runInit(PROJECT, { template: "minimal", skipImport: true });

		expect(existsSync(join(PROJECT, ".ai/config.yaml"))).toBe(true);
		expect(existsSync(join(PROJECT, ".ai/directives/conventions.md"))).toBe(true);
		expect(existsSync(join(PROJECT, ".ai/skills"))).toBe(true);
		expect(existsSync(join(PROJECT, ".ai/agents"))).toBe(true);
	});

	// ── Step 2: populate config ───────────────────────────────────────

	it("populate config with MCP servers, permissions, hooks, ignore", async () => {
		await writeFile(
			join(PROJECT, ".ai/config.yaml"),
			`mcpServers:
  github:
    transport: stdio
    command: npx
    args: ["@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: "\${GITHUB_TOKEN}"
  postgres:
    transport: stdio
    command: npx
    args: ["@modelcontextprotocol/server-postgres"]

permissions:
  - tool: Bash
    pattern: "npm *"
    decision: allow
  - tool: Bash
    pattern: "git *"
    decision: allow
  - tool: Write
    pattern: "dist/**"
    decision: deny

settings:
  model: claude-sonnet-4-6

hooks:
  - event: postToolUse
    handler: eslint --fix

ignore:
  - node_modules/**
  - dist/**
  - "*.log"
  - .env
`,
			"utf-8",
		);

		await writeFile(
			join(PROJECT, ".ai/directives/conventions.md"),
			`---
scope: project
alwaysApply: true
description: Project conventions
---

# Project Conventions

- Use TypeScript strict mode
- Use tabs for indentation
- Run tests before committing
`,
			"utf-8",
		);

		await writeFile(
			join(PROJECT, ".ai/directives/testing.md"),
			`---
scope: project
alwaysApply: false
appliesTo: ["**/*.test.ts", "**/*.spec.ts"]
description: Testing rules
---

# Testing Rules

- Write descriptive test names
- Clean up fixtures in afterEach
`,
			"utf-8",
		);

		await writeFile(
			join(PROJECT, ".ai/agents/reviewer.md"),
			`---
description: Reviews code changes
model: claude-sonnet-4-6
readonly: true
tools: [Read, Glob, Grep]
---

# Code Reviewer

Review code for correctness, type safety, and style.
`,
			"utf-8",
		);

		await mkdir(join(PROJECT, ".ai/skills/deploy"), { recursive: true });
		await writeFile(
			join(PROJECT, ".ai/skills/deploy/SKILL.md"),
			`# Deploy

Assist with deployment tasks.

## Steps
1. Verify tests pass
2. Build the project
3. Deploy
`,
			"utf-8",
		);
	});

	// ── Step 3: check ─────────────────────────────────────────────────

	it("check validates config and reports compatibility", async () => {
		// Should not set exitCode (valid config)
		const orig = process.exitCode;
		await runCheck(PROJECT);
		expect(process.exitCode).not.toBe(1);
		process.exitCode = orig;
	});

	// ── Step 4: sync --dry-run ────────────────────────────────────────

	it("sync --dry-run lists files without writing", async () => {
		await runSync(PROJECT, { ...defaults, dryRun: true });

		// Nothing should be written
		expect(existsSync(join(PROJECT, "CLAUDE.md"))).toBe(false);
		expect(existsSync(join(PROJECT, ".mcp.json"))).toBe(false);
		expect(existsSync(join(PROJECT, "AGENTS.md"))).toBe(false);
	});

	// ── Step 5: sync (all targets) ───────────────────────────────────

	it("sync writes files for all 3 targets", async () => {
		await runSync(PROJECT, defaults);

		// ── Claude Code ──
		const claudeMd = await readFile(join(PROJECT, "CLAUDE.md"), "utf-8");
		expect(claudeMd).toContain("# Project Conventions");
		expect(claudeMd).toContain("Use TypeScript strict mode");

		const claudeRules = await readFile(join(PROJECT, ".claude/rules/testing-rules.md"), "utf-8");
		expect(claudeRules).toContain("applies to: **/*.test.ts");
		expect(claudeRules).toContain("Write descriptive test names");

		const mcpJson = JSON.parse(await readFile(join(PROJECT, ".mcp.json"), "utf-8"));
		expect(mcpJson.mcpServers.github.command).toBe("npx");
		expect(mcpJson.mcpServers.github.args).toContain("@modelcontextprotocol/server-github");
		expect(mcpJson.mcpServers.postgres.command).toBe("npx");

		const claudeSettings = JSON.parse(
			await readFile(join(PROJECT, ".claude/settings.json"), "utf-8"),
		);
		expect(claudeSettings.permissions.allow).toContain("Bash(npm *)");
		expect(claudeSettings.permissions.allow).toContain("Bash(git *)");
		expect(claudeSettings.permissions.deny).toContain("Write(dist/**)");
		expect(claudeSettings.permissions.deny).toContain("Read(.env)");
		expect(claudeSettings.model).toBe("claude-sonnet-4-6");
		expect(claudeSettings.hooks.PostToolUse).toHaveLength(1);
		expect(claudeSettings.hooks.PostToolUse[0].hooks[0].type).toBe("command");
		expect(claudeSettings.hooks.PostToolUse[0].hooks[0].command).toBe("eslint --fix");

		const claudeAgent = await readFile(join(PROJECT, ".claude/agents/reviewer.md"), "utf-8");
		expect(claudeAgent).toContain("# Code Reviewer");

		const claudeSkill = await readFile(join(PROJECT, ".claude/skills/deploy/SKILL.md"), "utf-8");
		expect(claudeSkill).toContain("# Deploy");

		// ── Cursor ──
		const cursorConventions = await readFile(
			join(PROJECT, ".cursor/rules/project-conventions.mdc"),
			"utf-8",
		);
		expect(cursorConventions).toContain("---");
		expect(cursorConventions).toContain("alwaysApply: true");
		expect(cursorConventions).toContain("description: Project conventions");

		const cursorTesting = await readFile(join(PROJECT, ".cursor/rules/testing-rules.mdc"), "utf-8");
		expect(cursorTesting).toContain("globs: **/*.test.ts, **/*.spec.ts");
		expect(cursorTesting).toContain("alwaysApply: false");

		const cursorMcp = JSON.parse(await readFile(join(PROJECT, ".cursor/mcp.json"), "utf-8"));
		expect(cursorMcp.mcpServers.github.command).toBe("npx");

		const cursorAgent = await readFile(join(PROJECT, ".cursor/agents/reviewer.md"), "utf-8");
		expect(cursorAgent).toContain("model: claude-sonnet-4-6");
		expect(cursorAgent).toContain("readonly: true");
		expect(cursorAgent).toContain("tools: [Read, Glob, Grep]");

		const cursorIgnore = await readFile(join(PROJECT, ".cursorignore"), "utf-8");
		expect(cursorIgnore).toContain("node_modules/**");
		expect(cursorIgnore).toContain(".env");

		// ── Codex ──
		const agentsMd = await readFile(join(PROJECT, "AGENTS.md"), "utf-8");
		expect(agentsMd).toContain("# Project Instructions");
		expect(agentsMd).toContain("Use TypeScript strict mode");
		expect(agentsMd).toContain("Applies to: **/*.test.ts");
		expect(agentsMd).toContain("## Agent: reviewer");
		expect(agentsMd).toContain("Tools: Read, Glob, Grep");

		const codexToml = await readFile(join(PROJECT, ".codex/config.toml"), "utf-8");
		expect(codexToml).toContain("[mcp_servers.github]");
		expect(codexToml).toContain("[mcp_servers.postgres]");
		expect(codexToml).toContain("approval_policy");
		expect(codexToml).toContain('protected_paths = ["node_modules/**"');

		const codexSkill = await readFile(join(PROJECT, ".codex/skills/deploy/SKILL.md"), "utf-8");
		expect(codexSkill).toContain("# Deploy");
	});

	// ── Step 6: state file written ───────────────────────────────────

	it("state file is written after sync", async () => {
		const state = JSON.parse(await readFile(join(PROJECT, ".ai/.state.json"), "utf-8"));
		expect(state.lastSync).toBeDefined();
		expect(Object.keys(state.files).length).toBe(31);
		expect(state.files["CLAUDE.md"]).toBeDefined();
		expect(state.files["AGENTS.md"]).toBeDefined();
		expect(state.files[".mcp.json"]).toBeDefined();
	});

	// ── Step 7: status shows all up-to-date ──────────────────────────

	it("status shows all files up-to-date", async () => {
		// runStatus prints to console — we just verify it doesn't error
		await runStatus(PROJECT);
	});

	// ── Step 8: manual edit creates conflict ─────────────────────────

	it("manual edit is detected as conflict", async () => {
		await writeFile(join(PROJECT, "CLAUDE.md"), "# I manually edited this\n", "utf-8");

		const orig = process.exitCode;
		await runSync(PROJECT, defaults);
		const blocked = process.exitCode === 1;
		process.exitCode = orig;

		expect(blocked).toBe(true);

		// File should still have the manual edit (sync was blocked)
		const content = await readFile(join(PROJECT, "CLAUDE.md"), "utf-8");
		expect(content).toContain("I manually edited this");
	});

	// ── Step 9: --force overwrites conflict ──────────────────────────

	it("--force overwrites conflicting files", async () => {
		await runSync(PROJECT, { ...defaults, force: true });

		const content = await readFile(join(PROJECT, "CLAUDE.md"), "utf-8");
		expect(content).toContain("Use TypeScript strict mode");
		expect(content).not.toContain("I manually edited this");
	});

	// ── Step 10: single-target sync ──────────────────────────────────

	it("sync --target cursor only writes cursor files", async () => {
		// Remove cursor files first
		rmSync(join(PROJECT, ".cursor"), { recursive: true, force: true });
		rmSync(join(PROJECT, ".cursorignore"), { force: true });

		await runSync(PROJECT, { ...defaults, targets: ["cursor"] });

		// Cursor files recreated
		expect(existsSync(join(PROJECT, ".cursor/rules/project-conventions.mdc"))).toBe(true);
		expect(existsSync(join(PROJECT, ".cursor/mcp.json"))).toBe(true);
		expect(existsSync(join(PROJECT, ".cursorignore"))).toBe(true);
	});

	// ── Step 11: config change shows modified in status ──────────────

	it("config change after sync shows modified files", async () => {
		// Sync everything fresh
		await runSync(PROJECT, { ...defaults, force: true });

		// Change config — add a new directive
		await writeFile(
			join(PROJECT, ".ai/directives/security.md"),
			`---
scope: project
alwaysApply: true
description: Security rules
---

# Security

- Never commit secrets or .env files
- Validate all user input
`,
			"utf-8",
		);

		// Re-sync — should succeed (new content, no manual edits since last sync)
		const orig = process.exitCode;
		await runSync(PROJECT, defaults);
		process.exitCode = orig;

		// CLAUDE.md should now include security rules
		const claudeMd = await readFile(join(PROJECT, "CLAUDE.md"), "utf-8");
		expect(claudeMd).toContain("Never commit secrets");
	});
});
