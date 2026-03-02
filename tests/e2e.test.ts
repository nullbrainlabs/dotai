import { existsSync, mkdirSync, rmSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runAdd } from "../src/commands/add.js";
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
		await runInit(PROJECT, { skipImport: true });

		expect(existsSync(join(PROJECT, ".ai/config.yaml"))).toBe(true);
		expect(existsSync(join(PROJECT, ".ai/rules/conventions.md"))).toBe(true);
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
			join(PROJECT, ".ai/rules/conventions.md"),
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
			join(PROJECT, ".ai/rules/testing.md"),
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
		expect(claudeRules).toContain('  - "**/*.test.ts"');
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
		expect(cursorAgent).toContain("name: reviewer");
		expect(cursorAgent).toContain("model: claude-sonnet-4-6");
		expect(cursorAgent).toContain("readonly: true");
		expect(cursorAgent).not.toContain("tools:");

		const cursorSkill = await readFile(join(PROJECT, ".cursor/skills/deploy/SKILL.md"), "utf-8");
		expect(cursorSkill).toContain("# Deploy");

		const cursorCli = JSON.parse(await readFile(join(PROJECT, ".cursor/cli.json"), "utf-8"));
		expect(cursorCli.permissions.allow).toContain("Bash(npm *)");
		expect(cursorCli.permissions.deny).toContain("Write(dist/**)");
		expect(cursorCli.model).toBe("claude-sonnet-4-6");

		const cursorIgnore = await readFile(join(PROJECT, ".cursorignore"), "utf-8");
		expect(cursorIgnore).toContain("node_modules/**");
		expect(cursorIgnore).toContain(".env");

		// ── Codex ──
		const agentsMd = await readFile(join(PROJECT, "AGENTS.md"), "utf-8");
		expect(agentsMd).toContain("# Project Instructions");
		expect(agentsMd).toContain("Use TypeScript strict mode");
		expect(agentsMd).toContain("Applies to: **/*.test.ts");

		const codexToml = await readFile(join(PROJECT, ".codex/config.toml"), "utf-8");
		expect(codexToml).toContain("[mcp_servers.github]");
		expect(codexToml).toContain("[mcp_servers.postgres]");
		expect(codexToml).toContain("approval_policy");
		expect(codexToml).toContain('protected_paths = ["node_modules/**"');
		expect(codexToml).toContain("[agents.reviewer]");
		expect(codexToml).toContain('config_file = "agents/reviewer.toml"');

		const codexAgent = await readFile(join(PROJECT, ".codex/agents/reviewer.toml"), "utf-8");
		expect(codexAgent).toContain('model = "claude-sonnet-4-6"');
		expect(codexAgent).toContain('sandbox_mode = "read-only"');

		const codexSkill = await readFile(join(PROJECT, ".codex/skills/deploy/SKILL.md"), "utf-8");
		expect(codexSkill).toContain("# Deploy");
	});

	// ── Step 6: state file written ───────────────────────────────────

	it("state file is written after sync", async () => {
		const state = JSON.parse(await readFile(join(PROJECT, ".ai/.state.json"), "utf-8"));
		expect(state.lastSync).toBeDefined();
		expect(Object.keys(state.files).length).toBe(23);
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

		// Change config — add a new rule
		await writeFile(
			join(PROJECT, ".ai/rules/security.md"),
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

	// ── Step 12: Copilot output verification ────────────────────────

	it("sync writes correct Copilot output files", async () => {
		// Copilot instructions (alwaysApply rules)
		const copilotInstructions = await readFile(
			join(PROJECT, ".github/copilot-instructions.md"),
			"utf-8",
		);
		expect(copilotInstructions).toContain("Use TypeScript strict mode");
		expect(copilotInstructions).toContain("Never commit secrets");

		// Copilot scoped rule
		const copilotTesting = await readFile(
			join(PROJECT, ".github/instructions/testing-rules.instructions.md"),
			"utf-8",
		);
		expect(copilotTesting).toContain("applyTo:");
		expect(copilotTesting).toContain("Write descriptive test names");

		// Copilot agent
		const copilotAgent = await readFile(join(PROJECT, ".github/agents/reviewer.agent.md"), "utf-8");
		expect(copilotAgent).toContain("description: Reviews code changes");
		expect(copilotAgent).toContain("tools:");
		// readonly agent should map to read/search tools
		expect(copilotAgent).toContain("read");
		expect(copilotAgent).toContain("search");

		// Copilot MCP (.vscode/mcp.json)
		const vscodeMcp = JSON.parse(await readFile(join(PROJECT, ".vscode/mcp.json"), "utf-8"));
		expect(vscodeMcp.servers.github.command).toBe("npx");
		expect(vscodeMcp.servers.github.type).toBe("stdio");

		// Copilot hooks
		const copilotHooks = JSON.parse(
			await readFile(join(PROJECT, ".github/hooks/hooks.json"), "utf-8"),
		);
		expect(copilotHooks.version).toBe(1);
		expect(copilotHooks.hooks.postToolUse).toBeDefined();
		expect(copilotHooks.hooks.postToolUse[0].type).toBe("command");
		expect(copilotHooks.hooks.postToolUse[0].bash).toBe("eslint --fix");

		// Copilot skill
		const copilotSkill = await readFile(join(PROJECT, ".github/skills/deploy/SKILL.md"), "utf-8");
		expect(copilotSkill).toContain("# Deploy");
	});

	// ── Step 13: gitignore auto-update ──────────────────────────────

	it("gitignore contains dotai output patterns", async () => {
		const gitignore = await readFile(join(PROJECT, ".gitignore"), "utf-8");
		expect(gitignore).toContain("# dotai outputs");
		expect(gitignore).toContain(".ai/.state.json");
		expect(gitignore).toContain(".claude/");
		expect(gitignore).toContain(".cursor/");
		expect(gitignore).toContain(".codex/");
		expect(gitignore).toContain(".github/");
		expect(gitignore).toContain(".vscode/");
		expect(gitignore).toContain("CLAUDE.md");
		expect(gitignore).toContain("AGENTS.md");
		expect(gitignore).toContain(".mcp.json");
		expect(gitignore).toContain(".cursorignore");
	});

	// ── Step 14: outputDir nesting ──────────────────────────────────

	it("outputDir nests generated files in subdirectory", async () => {
		await writeFile(
			join(PROJECT, ".ai/rules/docs.md"),
			`---
alwaysApply: true
outputDir: docs-site
description: Documentation rules
---

Keep documentation current with code changes.
`,
			"utf-8",
		);

		await runSync(PROJECT, { ...defaults, force: true });

		// Claude nested output
		const docsClaudeMd = await readFile(join(PROJECT, "docs-site/CLAUDE.md"), "utf-8");
		expect(docsClaudeMd).toContain("Keep documentation current");

		// Codex nested output
		const docsAgentsMd = await readFile(join(PROJECT, "docs-site/AGENTS.md"), "utf-8");
		expect(docsAgentsMd).toContain("Keep documentation current");

		// Cursor nested output
		const docsCursorRule = await readFile(
			join(PROJECT, "docs-site/.cursor/rules/documentation-rules.mdc"),
			"utf-8",
		);
		expect(docsCursorRule).toContain("alwaysApply: true");
		expect(docsCursorRule).toContain("Keep documentation current");

		// Copilot nested output
		const docsCopilot = await readFile(
			join(PROJECT, "docs-site/.github/copilot-instructions.md"),
			"utf-8",
		);
		expect(docsCopilot).toContain("Keep documentation current");

		// Gitignore should include nested patterns
		const gitignore = await readFile(join(PROJECT, ".gitignore"), "utf-8");
		expect(gitignore).toContain("docs-site/CLAUDE.md");
		expect(gitignore).toContain("docs-site/AGENTS.md");
	});

	// ── Step 15: orphaned file detection ────────────────────────────

	it("removing a rule causes orphaned files", async () => {
		// Sync fresh to establish state
		await runSync(PROJECT, { ...defaults, force: true });

		const stateBefore = JSON.parse(await readFile(join(PROJECT, ".ai/.state.json"), "utf-8"));
		expect(stateBefore.files[".claude/rules/testing-rules.md"]).toBeDefined();

		// Remove the testing rule
		await rm(join(PROJECT, ".ai/rules/testing.md"));

		// Re-sync — orphaned files should still exist on disk but not be regenerated
		await runSync(PROJECT, { ...defaults, force: true });

		const stateAfter = JSON.parse(await readFile(join(PROJECT, ".ai/.state.json"), "utf-8"));

		// Orphaned files should be removed from state (not generated anymore)
		expect(stateAfter.files[".claude/rules/testing-rules.md"]).toBeUndefined();
		expect(stateAfter.files[".cursor/rules/testing-rules.mdc"]).toBeUndefined();
		expect(stateAfter.files[".github/instructions/testing-rules.instructions.md"]).toBeUndefined();

		// But they still exist on disk (sync doesn't delete orphans)
		expect(existsSync(join(PROJECT, ".claude/rules/testing-rules.md"))).toBe(true);
	});

	// ── Step 16: add command — rule ─────────────────────────────────

	it("add rule creates .ai/rules/<name>.md", async () => {
		await runAdd(PROJECT, "rule", "api-guidelines");

		const filePath = join(PROJECT, ".ai/rules/api-guidelines.md");
		expect(existsSync(filePath)).toBe(true);

		const content = await readFile(filePath, "utf-8");
		expect(content).toContain("scope: project");
		expect(content).toContain("alwaysApply: true");
		expect(content).toContain("description: api-guidelines");
	});

	// ── Step 17: add command — agent ────────────────────────────────

	it("add agent creates .ai/agents/<name>.md", async () => {
		await runAdd(PROJECT, "agent", "debugger");

		const filePath = join(PROJECT, ".ai/agents/debugger.md");
		expect(existsSync(filePath)).toBe(true);

		const content = await readFile(filePath, "utf-8");
		expect(content).toContain("description: debugger agent");
	});

	// ── Step 18: add command — skill ────────────────────────────────

	it("add skill creates .ai/skills/<name>/SKILL.md", async () => {
		await runAdd(PROJECT, "skill", "testing");

		const filePath = join(PROJECT, ".ai/skills/testing/SKILL.md");
		expect(existsSync(filePath)).toBe(true);

		const content = await readFile(filePath, "utf-8");
		expect(content).toContain("description: testing skill");
	});

	// ── Step 19: add command — MCP stdio ────────────────────────────

	it("add mcp with --command appends stdio server to config.yaml", async () => {
		await runAdd(PROJECT, "mcp", "lint-server", { command: "npx @lint/mcp-server" });

		const config = await readFile(join(PROJECT, ".ai/config.yaml"), "utf-8");
		expect(config).toContain("lint-server");

		// Sync and verify it appears in output
		await runSync(PROJECT, { ...defaults, force: true });

		const mcpJson = JSON.parse(await readFile(join(PROJECT, ".mcp.json"), "utf-8"));
		expect(mcpJson.mcpServers["lint-server"]).toBeDefined();
		expect(mcpJson.mcpServers["lint-server"].command).toBe("npx");
		expect(mcpJson.mcpServers["lint-server"].args).toContain("@lint/mcp-server");
	});

	// ── Step 20: add command — MCP http ─────────────────────────────

	it("add mcp with --url appends http server to config.yaml", async () => {
		await runAdd(PROJECT, "mcp", "analytics", { url: "http://localhost:4000/mcp" });

		const config = await readFile(join(PROJECT, ".ai/config.yaml"), "utf-8");
		expect(config).toContain("analytics");

		await runSync(PROJECT, { ...defaults, force: true });

		const mcpJson = JSON.parse(await readFile(join(PROJECT, ".mcp.json"), "utf-8"));
		expect(mcpJson.mcpServers.analytics).toBeDefined();
		expect(mcpJson.mcpServers.analytics.url).toBe("http://localhost:4000/mcp");
	});

	// ── Step 21: add command — duplicate errors in non-TTY ─────────

	it("add rule errors when file already exists (non-TTY)", async () => {
		const orig = process.exitCode;
		await runAdd(PROJECT, "rule", "api-guidelines");
		expect(process.exitCode).toBe(1);
		process.exitCode = orig;
	});

	// ── Step 22: re-init when .ai/ exists ───────────────────────────

	it("re-init overwrites existing .ai/ in non-TTY mode", async () => {
		const reinitDir = join(import.meta.dirname, "fixtures/tmp-e2e-reinit");
		if (existsSync(reinitDir)) rmSync(reinitDir, { recursive: true });
		mkdirSync(reinitDir, { recursive: true });

		try {
			// First init
			await runInit(reinitDir, { skipImport: true });
			expect(existsSync(join(reinitDir, ".ai/rules/conventions.md"))).toBe(true);

			// Re-init — non-TTY should proceed
			await runInit(reinitDir, { skipImport: true });
			expect(existsSync(join(reinitDir, ".ai/config.yaml"))).toBe(true);
			expect(existsSync(join(reinitDir, ".ai/rules/conventions.md"))).toBe(true);
		} finally {
			rmSync(reinitDir, { recursive: true, force: true });
		}
	});
});
