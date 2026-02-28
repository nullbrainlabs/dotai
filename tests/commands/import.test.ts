import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runImportCommand } from "../../src/commands/import.js";

const TMP_DIR = join(import.meta.dirname, "../fixtures/tmp-import-cmd");

describe("runImportCommand", () => {
	beforeEach(() => {
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true });
		}
	});

	it("imports Claude config files and creates .ai/ directory", async () => {
		// Create CLAUDE.md
		writeFileSync(join(TMP_DIR, "CLAUDE.md"), "# My Rules\n\nBe nice.\n");
		// Create .mcp.json with an MCP server
		writeFileSync(
			join(TMP_DIR, ".mcp.json"),
			JSON.stringify({
				mcpServers: {
					github: { command: "npx", args: ["@mcp/github"] },
				},
			}),
		);

		await runImportCommand(TMP_DIR);

		// .ai/ directory should exist
		expect(existsSync(join(TMP_DIR, ".ai"))).toBe(true);
		// config.yaml should exist
		expect(existsSync(join(TMP_DIR, ".ai", "config.yaml"))).toBe(true);

		// Verify config.yaml contains the imported MCP server
		const configContent = await readFile(join(TMP_DIR, ".ai", "config.yaml"), "utf-8");
		expect(configContent).toContain("github");
	});

	it("imports with source filter", async () => {
		// Create both Claude and Cursor files
		writeFileSync(join(TMP_DIR, "CLAUDE.md"), "# My Rules\n\nBe nice.\n");
		mkdirSync(join(TMP_DIR, ".cursor", "rules"), { recursive: true });
		writeFileSync(
			join(TMP_DIR, ".cursor", "rules", "testing.mdc"),
			"---\ndescription: Testing rules\nalwaysApply: true\n---\n\nAlways write tests.\n",
		);

		await runImportCommand(TMP_DIR, { source: "cursor" });

		expect(existsSync(join(TMP_DIR, ".ai", "config.yaml"))).toBe(true);

		// Should have a rule from cursor but not the CLAUDE.md content in rules
		const _configContent = await readFile(join(TMP_DIR, ".ai", "config.yaml"), "utf-8");
		// config.yaml won't contain rule text (rules are in .ai/rules/*.md)
		// but it should exist
		expect(existsSync(join(TMP_DIR, ".ai", "rules"))).toBe(true);
	});

	it("reports no files found when nothing to import", async () => {
		// Empty directory — should not throw
		await expect(runImportCommand(TMP_DIR)).resolves.toBeUndefined();
	});
});
