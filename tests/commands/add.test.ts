import { existsSync, mkdirSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runAdd } from "../../src/commands/add.js";
import { runInit } from "../../src/commands/init.js";

const TMP_DIR = join(import.meta.dirname, "../fixtures/tmp-add");

describe("runAdd", () => {
	beforeEach(async () => {
		mkdirSync(TMP_DIR, { recursive: true });
		await runInit(TMP_DIR, { template: "blank", skipImport: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true });
		}
	});

	it("errors when .ai/ does not exist", async () => {
		const emptyDir = join(TMP_DIR, "no-ai");
		mkdirSync(emptyDir, { recursive: true });

		const origExitCode = process.exitCode;
		await runAdd(emptyDir, "directive", "test");
		expect(process.exitCode).toBe(1);
		process.exitCode = origExitCode;
	});

	it("errors on unknown entity type", async () => {
		const origExitCode = process.exitCode;
		await runAdd(TMP_DIR, "widget", "test");
		expect(process.exitCode).toBe(1);
		process.exitCode = origExitCode;
	});

	it("scaffolds a directive", async () => {
		await runAdd(TMP_DIR, "directive", "security");

		const filePath = join(TMP_DIR, ".ai/directives/security.md");
		expect(existsSync(filePath)).toBe(true);

		const content = await readFile(filePath, "utf-8");
		expect(content).toContain("scope: project");
		expect(content).toContain("alwaysApply: true");
		expect(content).toContain("description: security");
	});

	it("scaffolds an agent", async () => {
		await runAdd(TMP_DIR, "agent", "reviewer");

		const filePath = join(TMP_DIR, ".ai/agents/reviewer.md");
		expect(existsSync(filePath)).toBe(true);

		const content = await readFile(filePath, "utf-8");
		expect(content).toContain("description: reviewer agent");
	});

	it("scaffolds a skill", async () => {
		await runAdd(TMP_DIR, "skill", "deploy");

		const filePath = join(TMP_DIR, ".ai/skills/deploy/SKILL.md");
		expect(existsSync(filePath)).toBe(true);

		const content = await readFile(filePath, "utf-8");
		expect(content).toContain("description: deploy skill");
	});

	it("adds MCP server with --command flag", async () => {
		await runAdd(TMP_DIR, "mcp", "filesystem", {
			command: "npx @anthropic/mcp-filesystem /tmp",
		});

		const configPath = join(TMP_DIR, ".ai/config.yaml");
		const content = await readFile(configPath, "utf-8");
		expect(content).toContain("filesystem");
		expect(content).toContain("transport: stdio");
		expect(content).toContain("command: npx");
	});

	it("adds MCP server with --url flag", async () => {
		await runAdd(TMP_DIR, "mcp", "remote", {
			url: "http://localhost:3000",
		});

		const configPath = join(TMP_DIR, ".ai/config.yaml");
		const content = await readFile(configPath, "utf-8");
		expect(content).toContain("remote");
		expect(content).toContain("transport: http");
		expect(content).toContain("http://localhost:3000");
	});

	it("appends MCP server to existing config", async () => {
		// Add first server
		await runAdd(TMP_DIR, "mcp", "server1", { command: "echo hello" });

		// Add second server
		await runAdd(TMP_DIR, "mcp", "server2", { url: "http://localhost:4000" });

		const configPath = join(TMP_DIR, ".ai/config.yaml");
		const content = await readFile(configPath, "utf-8");
		expect(content).toContain("server1");
		expect(content).toContain("server2");
	});

	it("errors when file already exists in non-TTY", async () => {
		// Create the directive first
		await runAdd(TMP_DIR, "directive", "existing");
		expect(existsSync(join(TMP_DIR, ".ai/directives/existing.md"))).toBe(true);

		// Try again — should error in non-TTY (test env is non-TTY)
		const origExitCode = process.exitCode;
		await runAdd(TMP_DIR, "directive", "existing");
		expect(process.exitCode).toBe(1);
		process.exitCode = origExitCode;
	});
});
