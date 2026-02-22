import { existsSync, mkdirSync, rmSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runInit } from "../../src/commands/init.js";
import type { SyncOptions } from "../../src/commands/sync.js";
import { deriveGitignorePatterns, runSync, updateGitignore } from "../../src/commands/sync.js";
import type { EmittedFile } from "../../src/emitters/types.js";

const TMP_DIR = join(import.meta.dirname, "../fixtures/tmp-sync");

const defaults: SyncOptions = { targets: [], dryRun: false, scope: "project", force: false };

describe("runSync", () => {
	beforeEach(async () => {
		mkdirSync(TMP_DIR, { recursive: true });
		await runInit(TMP_DIR, { template: "minimal", skipImport: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true });
		}
	});

	it("generates Claude files", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"] });

		expect(existsSync(join(TMP_DIR, "CLAUDE.md"))).toBe(true);
		const content = await readFile(join(TMP_DIR, "CLAUDE.md"), "utf-8");
		expect(content).toContain("Project Conventions");
	});

	it("generates Cursor files", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["cursor"] });

		const rulesDir = join(TMP_DIR, ".cursor/rules");
		expect(existsSync(rulesDir)).toBe(true);
	});

	it("generates Codex files", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["codex"] });

		expect(existsSync(join(TMP_DIR, "AGENTS.md"))).toBe(true);
	});

	it("generates OpenCode files", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["opencode"] });

		expect(existsSync(join(TMP_DIR, "opencode.json"))).toBe(true);
		const content = await readFile(join(TMP_DIR, "opencode.json"), "utf-8");
		const parsed = JSON.parse(content);
		expect(parsed.instructions).toBeDefined();
		expect(Array.isArray(parsed.instructions)).toBe(true);
	});

	it("dry run does not write files", async () => {
		if (existsSync(join(TMP_DIR, "CLAUDE.md"))) {
			rmSync(join(TMP_DIR, "CLAUDE.md"));
		}

		await runSync(TMP_DIR, { ...defaults, targets: ["claude"], dryRun: true });

		expect(existsSync(join(TMP_DIR, "CLAUDE.md"))).toBe(false);
	});

	it("generates for all targets", async () => {
		const configPath = join(TMP_DIR, ".ai/config.yaml");
		const config = `mcpServers:
  test-server:
    transport: stdio
    command: echo
    args: ["hello"]

permissions:
  - tool: Bash
    pattern: "npm *"
    decision: allow

settings:
  model: claude-sonnet-4-6

hooks: []

ignore:
  - node_modules/**
`;
		await writeFile(configPath, config, "utf-8");

		await runSync(TMP_DIR, defaults);

		// Claude output
		expect(existsSync(join(TMP_DIR, "CLAUDE.md"))).toBe(true);
		expect(existsSync(join(TMP_DIR, ".mcp.json"))).toBe(true);

		// Cursor output
		expect(existsSync(join(TMP_DIR, ".cursor/rules"))).toBe(true);
		expect(existsSync(join(TMP_DIR, ".cursor/mcp.json"))).toBe(true);

		// Codex output
		expect(existsSync(join(TMP_DIR, "AGENTS.md"))).toBe(true);

		// State file should be written
		expect(existsSync(join(TMP_DIR, ".ai/.state.json"))).toBe(true);
	});

	it("saves state after sync", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"] });

		const statePath = join(TMP_DIR, ".ai/.state.json");
		expect(existsSync(statePath)).toBe(true);
		const state = JSON.parse(await readFile(statePath, "utf-8"));
		expect(state.lastSync).toBeDefined();
		expect(state.files["CLAUDE.md"]).toBeDefined();
	});

	it("detects conflicts when files are manually edited", async () => {
		// First sync
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"] });

		// Manually edit the generated file
		const claudePath = join(TMP_DIR, "CLAUDE.md");
		await writeFile(claudePath, "# Manually edited content\n", "utf-8");

		// Second sync should detect conflict (exitCode set, not thrown)
		const origExitCode = process.exitCode;
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"] });
		const hadConflict = process.exitCode === 1;
		process.exitCode = origExitCode;
		expect(hadConflict).toBe(true);
	});

	it("yes flag skips confirmation and writes files", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"], yes: true });

		expect(existsSync(join(TMP_DIR, "CLAUDE.md"))).toBe(true);
		const content = await readFile(join(TMP_DIR, "CLAUDE.md"), "utf-8");
		expect(content).toContain("Project Conventions");
	});

	it("force flag overwrites conflicts", async () => {
		// First sync
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"] });

		// Manually edit
		const claudePath = join(TMP_DIR, "CLAUDE.md");
		await writeFile(claudePath, "# Manually edited\n", "utf-8");

		// Force sync should succeed
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"], force: true });

		const content = await readFile(claudePath, "utf-8");
		expect(content).toContain("Project Conventions");
	});

	it("updates .gitignore after sync", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"], yes: true });

		const gitignorePath = join(TMP_DIR, ".gitignore");
		expect(existsSync(gitignorePath)).toBe(true);
		const content = await readFile(gitignorePath, "utf-8");
		expect(content).toContain("# dotai outputs");
		expect(content).toContain(".ai/.state.json");
		expect(content).toContain("CLAUDE.md");
	});

	it("does not update .gitignore on dry run", async () => {
		await runSync(TMP_DIR, { ...defaults, targets: ["claude"], dryRun: true });

		const gitignorePath = join(TMP_DIR, ".gitignore");
		expect(existsSync(gitignorePath)).toBe(false);
	});
});

describe("deriveGitignorePatterns", () => {
	it("produces dir pattern for dot-directories at root", () => {
		const files: EmittedFile[] = [
			{ path: ".claude/rules/foo.md", content: "" },
			{ path: ".claude/settings.json", content: "" },
		];
		const patterns = deriveGitignorePatterns(files);
		expect(patterns).toContain(".claude/");
		// Should not contain individual file entries
		expect(patterns).not.toContain(".claude/rules/foo.md");
	});

	it("produces prefixed dir pattern for outputDir paths", () => {
		const files: EmittedFile[] = [{ path: "docs-site/.claude/rules/foo.md", content: "" }];
		const patterns = deriveGitignorePatterns(files);
		expect(patterns).toContain("docs-site/.claude/");
	});

	it("produces exact match for root-level files", () => {
		const files: EmittedFile[] = [
			{ path: "CLAUDE.md", content: "" },
			{ path: "AGENTS.md", content: "" },
			{ path: ".mcp.json", content: "" },
			{ path: "opencode.json", content: "" },
		];
		const patterns = deriveGitignorePatterns(files);
		expect(patterns).toContain("CLAUDE.md");
		expect(patterns).toContain("AGENTS.md");
		expect(patterns).toContain(".mcp.json");
		expect(patterns).toContain("opencode.json");
	});

	it("produces exact match for outputDir-prefixed root files", () => {
		const files: EmittedFile[] = [{ path: "docs-site/CLAUDE.md", content: "" }];
		const patterns = deriveGitignorePatterns(files);
		expect(patterns).toContain("docs-site/CLAUDE.md");
	});

	it("deduplicates multiple files in the same dot-directory", () => {
		const files: EmittedFile[] = [
			{ path: ".claude/rules/a.md", content: "" },
			{ path: ".claude/rules/b.md", content: "" },
			{ path: ".claude/settings.json", content: "" },
		];
		const patterns = deriveGitignorePatterns(files);
		const claudeEntries = patterns.filter((p) => p.includes(".claude"));
		expect(claudeEntries).toEqual([".claude/"]);
	});

	it("always includes .ai/.state.json", () => {
		const patterns = deriveGitignorePatterns([]);
		expect(patterns).toContain(".ai/.state.json");
	});
});

describe("updateGitignore", () => {
	const TMP = join(import.meta.dirname, "../fixtures/tmp-gitignore");

	beforeEach(() => {
		mkdirSync(TMP, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP)) {
			rmSync(TMP, { recursive: true });
		}
	});

	it("creates .gitignore if missing", async () => {
		const files: EmittedFile[] = [{ path: "CLAUDE.md", content: "" }];
		const added = await updateGitignore(TMP, files);

		expect(added).toBeGreaterThan(0);
		const content = await readFile(join(TMP, ".gitignore"), "utf-8");
		expect(content).toContain("# dotai outputs");
		expect(content).toContain("CLAUDE.md");
		expect(content).toContain(".ai/.state.json");
	});

	it("appends block with header to existing .gitignore", async () => {
		await writeFile(join(TMP, ".gitignore"), "node_modules/\n", "utf-8");

		const files: EmittedFile[] = [{ path: "CLAUDE.md", content: "" }];
		await updateGitignore(TMP, files);

		const content = await readFile(join(TMP, ".gitignore"), "utf-8");
		expect(content).toContain("node_modules/");
		expect(content).toContain("# dotai outputs");
		expect(content).toContain("CLAUDE.md");
	});

	it("skips already-present entries", async () => {
		await writeFile(join(TMP, ".gitignore"), "node_modules/\nCLAUDE.md\n", "utf-8");

		const files: EmittedFile[] = [
			{ path: "CLAUDE.md", content: "" },
			{ path: ".claude/rules/a.md", content: "" },
		];
		const added = await updateGitignore(TMP, files);

		const content = await readFile(join(TMP, ".gitignore"), "utf-8");
		// CLAUDE.md should not be duplicated
		const matches = content.match(/CLAUDE\.md/g) ?? [];
		expect(matches).toHaveLength(1);
		// New entries should be added
		expect(content).toContain(".claude/");
		expect(added).toBeGreaterThan(0);
	});

	it("preserves existing content", async () => {
		const original = "# My project\nnode_modules/\ndist/\n";
		await writeFile(join(TMP, ".gitignore"), original, "utf-8");

		const files: EmittedFile[] = [{ path: "AGENTS.md", content: "" }];
		await updateGitignore(TMP, files);

		const content = await readFile(join(TMP, ".gitignore"), "utf-8");
		expect(content).toContain("# My project");
		expect(content).toContain("node_modules/");
		expect(content).toContain("dist/");
	});

	it("returns 0 when all patterns already present", async () => {
		await writeFile(join(TMP, ".gitignore"), ".ai/.state.json\nCLAUDE.md\n.claude/\n", "utf-8");

		const files: EmittedFile[] = [
			{ path: "CLAUDE.md", content: "" },
			{ path: ".claude/rules/a.md", content: "" },
		];
		const added = await updateGitignore(TMP, files);
		expect(added).toBe(0);
	});

	it("appends to existing dotai block", async () => {
		await writeFile(
			join(TMP, ".gitignore"),
			"node_modules/\n\n# dotai outputs\nCLAUDE.md\n",
			"utf-8",
		);

		const files: EmittedFile[] = [
			{ path: "CLAUDE.md", content: "" },
			{ path: "AGENTS.md", content: "" },
		];
		await updateGitignore(TMP, files);

		const content = await readFile(join(TMP, ".gitignore"), "utf-8");
		// Should only have one header
		const headers = content.match(/# dotai outputs/g) ?? [];
		expect(headers).toHaveLength(1);
		expect(content).toContain("AGENTS.md");
	});
});
