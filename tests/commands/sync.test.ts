import { existsSync, mkdirSync, rmSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runInit } from "../../src/commands/init.js";
import type { SyncOptions } from "../../src/commands/sync.js";
import { resolveOutputPath, runSync } from "../../src/commands/sync.js";

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
});

describe("resolveOutputPath", () => {
	const projectDir = "/tmp/test-project";
	const home = homedir();

	it("routes AGENTS.md to ~/.codex/AGENTS.md in user scope", () => {
		const result = resolveOutputPath("AGENTS.md", true, projectDir, ["codex"]);
		expect(result).toBe(join(home, ".codex", "AGENTS.md"));
	});

	it("routes AGENTS.override.md to ~/.codex/AGENTS.override.md in user scope", () => {
		const result = resolveOutputPath("AGENTS.override.md", true, projectDir, ["codex"]);
		expect(result).toBe(join(home, ".codex", "AGENTS.override.md"));
	});

	it("routes CLAUDE.md to ~/CLAUDE.md in user scope (unchanged)", () => {
		const result = resolveOutputPath("CLAUDE.md", true, projectDir, ["claude"]);
		expect(result).toBe(join(home, "CLAUDE.md"));
	});

	it("routes files to project dir in project scope", () => {
		const result = resolveOutputPath("AGENTS.md", false, projectDir, ["codex"]);
		expect(result).toBe(join(projectDir, "AGENTS.md"));
	});
});
