import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadProjectConfig } from "../../src/config/loader.js";
import { runImport } from "../../src/import/runner.js";

const TMP_DIR = join(import.meta.dirname, "../fixtures/tmp-runner");

describe("runImport", () => {
	beforeEach(() => {
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true });
		}
	});

	it("returns empty result when no config files found", async () => {
		const result = await runImport(TMP_DIR, { interactive: false });

		expect(result.detected).toHaveLength(0);
		expect(result.imported).toHaveLength(0);
		expect(result.filesWritten).toHaveLength(0);
	});

	it("non-interactive imports all detected files", async () => {
		// Create CLAUDE.md
		writeFileSync(join(TMP_DIR, "CLAUDE.md"), "# My Rules\n\nBe nice.\n");
		// Create .mcp.json
		writeFileSync(
			join(TMP_DIR, ".mcp.json"),
			JSON.stringify({
				mcpServers: {
					github: { command: "npx", args: ["@mcp/github"] },
				},
			}),
		);
		// Create .cursor/rules/testing.mdc
		mkdirSync(join(TMP_DIR, ".cursor", "rules"), { recursive: true });
		writeFileSync(
			join(TMP_DIR, ".cursor", "rules", "testing.mdc"),
			"---\ndescription: Testing rules\nalwaysApply: true\n---\n\nAlways write tests.\n",
		);

		const result = await runImport(TMP_DIR, { interactive: false });

		expect(result.detected.length).toBeGreaterThanOrEqual(3);
		expect(result.imported.length).toBe(result.detected.length);
		expect(result.filesWritten.length).toBeGreaterThan(0);

		// Verify generated .ai/ config
		const loaded = await loadProjectConfig(join(TMP_DIR, ".ai"), "project");
		expect(loaded.config.directives.length).toBeGreaterThanOrEqual(2);
		expect(loaded.config.toolServers.length).toBe(1);
		expect(loaded.config.toolServers[0].name).toBe("github");
	});

	it("source filter limits to specified source", async () => {
		// Create both Claude and Cursor files
		writeFileSync(join(TMP_DIR, "CLAUDE.md"), "# My Rules\n\nBe nice.\n");
		mkdirSync(join(TMP_DIR, ".cursor", "rules"), { recursive: true });
		writeFileSync(
			join(TMP_DIR, ".cursor", "rules", "testing.mdc"),
			"---\ndescription: Testing rules\nalwaysApply: true\n---\n\nAlways write tests.\n",
		);

		const result = await runImport(TMP_DIR, {
			interactive: false,
			sourceFilter: "cursor",
		});

		// Should detect both sources but only import cursor
		expect(result.detected.length).toBeGreaterThanOrEqual(2);
		expect(result.imported.every((f) => f.source === "cursor")).toBe(true);

		const loaded = await loadProjectConfig(join(TMP_DIR, ".ai"), "project");
		// Only cursor directives should be present
		expect(loaded.config.directives.length).toBe(1);
		expect(loaded.config.toolServers.length).toBe(0);
	});

	it("deduplicates MCP servers by name", async () => {
		// Claude .mcp.json — parsed first
		writeFileSync(
			join(TMP_DIR, ".mcp.json"),
			JSON.stringify({
				mcpServers: {
					github: { command: "npx", args: ["@mcp/github-claude"] },
				},
			}),
		);
		// Cursor .cursor/mcp.json — parsed second, overrides via mergeConfigs
		mkdirSync(join(TMP_DIR, ".cursor"), { recursive: true });
		writeFileSync(
			join(TMP_DIR, ".cursor", "mcp.json"),
			JSON.stringify({
				mcpServers: {
					github: { command: "npx", args: ["@mcp/github-cursor"] },
				},
			}),
		);

		const result = await runImport(TMP_DIR, { interactive: false });

		// Both sources detected
		expect(result.detected.length).toBe(2);
		// Only one github server after merge + dedup
		expect(result.config.toolServers.length).toBe(1);
		expect(result.config.toolServers[0].name).toBe("github");
	});

	it("merges with existing .ai/ config (existing takes precedence)", async () => {
		// Create existing .ai/ with a tool server
		mkdirSync(join(TMP_DIR, ".ai"), { recursive: true });
		await writeFile(
			join(TMP_DIR, ".ai", "config.yaml"),
			`mcpServers:
  existing-server:
    transport: stdio
    command: echo
    args: ["hello"]
`,
			"utf-8",
		);

		// Create importable Claude file with a different MCP server
		writeFileSync(
			join(TMP_DIR, ".mcp.json"),
			JSON.stringify({
				mcpServers: {
					github: { command: "npx", args: ["@mcp/github"] },
				},
			}),
		);

		const _result = await runImport(TMP_DIR, { interactive: false });

		// Both servers should be present
		const loaded = await loadProjectConfig(join(TMP_DIR, ".ai"), "project");
		const serverNames = loaded.config.toolServers.map((s) => s.name);
		expect(serverNames).toContain("github");
		expect(serverNames).toContain("existing-server");

		// Existing server should take precedence (merged last)
		const existingServer = loaded.config.toolServers.find((s) => s.name === "existing-server");
		expect(existingServer).toBeDefined();
		expect(existingServer?.command).toBe("echo");
	});

	it("selectFiles callback filters imported files", async () => {
		// Create multiple importable files
		writeFileSync(join(TMP_DIR, "CLAUDE.md"), "# My Rules\n\nBe nice.\n");
		writeFileSync(
			join(TMP_DIR, ".mcp.json"),
			JSON.stringify({
				mcpServers: {
					github: { command: "npx", args: ["@mcp/github"] },
				},
			}),
		);
		mkdirSync(join(TMP_DIR, ".cursor", "rules"), { recursive: true });
		writeFileSync(
			join(TMP_DIR, ".cursor", "rules", "testing.mdc"),
			"---\ndescription: Testing rules\nalwaysApply: true\n---\n\nAlways write tests.\n",
		);

		const result = await runImport(TMP_DIR, {
			interactive: true,
			selectFiles: async (files) => {
				// Only select the CLAUDE.md file
				return files.filter((f) => f.relativePath === "CLAUDE.md");
			},
		});

		expect(result.detected.length).toBeGreaterThanOrEqual(3);
		expect(result.imported.length).toBe(1);
		expect(result.imported[0].relativePath).toBe("CLAUDE.md");

		// Only directives from CLAUDE.md, no MCP servers
		const loaded = await loadProjectConfig(join(TMP_DIR, ".ai"), "project");
		expect(loaded.config.directives.length).toBeGreaterThanOrEqual(1);
		expect(loaded.config.toolServers.length).toBe(0);
	});
});
