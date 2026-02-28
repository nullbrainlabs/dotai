import { existsSync, mkdirSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseCursor } from "../../../src/import/parsers/cursor.js";
import type { DetectedFile } from "../../../src/import/scanner.js";

const TMP_DIR = join(import.meta.dirname, "../../fixtures/tmp-cursor-parser");

describe("parseCursor", () => {
	beforeEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
	});

	it("parses .cursor/rules/*.mdc into rules with frontmatter", async () => {
		const rulesDir = join(TMP_DIR, ".cursor", "rules");
		await mkdir(rulesDir, { recursive: true });
		const content = [
			"---",
			"description: Testing rules",
			'globs: "**/*.test.ts, **/*.spec.ts"',
			"alwaysApply: false",
			"---",
			"",
			"# Testing Rules",
			"",
			"Write good tests.",
		].join("\n");
		const filePath = join(rulesDir, "testing.mdc");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".cursor/rules/testing.mdc",
				source: "cursor",
				kind: "rules",
				label: ".cursor/rules/testing.mdc",
			},
		];

		const result = await parseCursor(TMP_DIR, files);
		expect(result.rules).toHaveLength(1);
		expect(result.rules?.[0].description).toBe("Testing rules");
		expect(result.rules?.[0].appliesTo).toEqual(["**/*.test.ts", "**/*.spec.ts"]);
		expect(result.rules?.[0].alwaysApply).toBe(false);
		expect(result.rules?.[0].content).toContain("Write good tests.");
	});

	it("parses .cursor/mcp.json into toolServers", async () => {
		const cursorDir = join(TMP_DIR, ".cursor");
		await mkdir(cursorDir, { recursive: true });
		const content = JSON.stringify({
			mcpServers: {
				github: { command: "npx", args: ["@mcp/server-github"] },
			},
		});
		const filePath = join(cursorDir, "mcp.json");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".cursor/mcp.json",
				source: "cursor",
				kind: "mcp",
				label: ".cursor/mcp.json",
			},
		];

		const result = await parseCursor(TMP_DIR, files);
		expect(result.toolServers).toHaveLength(1);
		expect(result.toolServers?.[0].name).toBe("github");
		expect(result.toolServers?.[0].command).toBe("npx");
		expect(result.toolServers?.[0].args).toEqual(["@mcp/server-github"]);
		expect(result.toolServers?.[0].transport).toBe("stdio");
	});

	it("parses .cursor/agents/*.md into agents with frontmatter", async () => {
		const agentsDir = join(TMP_DIR, ".cursor", "agents");
		await mkdir(agentsDir, { recursive: true });
		const content = [
			"---",
			"description: Code review agent",
			"model: claude-sonnet-4-6",
			"readonly: true",
			"tools: [Read, Grep]",
			"---",
			"",
			"# Reviewer",
			"",
			"Review code changes carefully.",
		].join("\n");
		const filePath = join(agentsDir, "reviewer.md");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".cursor/agents/reviewer.md",
				source: "cursor",
				kind: "agents",
				label: ".cursor/agents/reviewer.md",
			},
		];

		const result = await parseCursor(TMP_DIR, files);
		expect(result.agents).toHaveLength(1);
		expect(result.agents?.[0].name).toBe("reviewer");
		expect(result.agents?.[0].description).toBe("Code review agent");
		expect(result.agents?.[0].model).toBe("claude-sonnet-4-6");
		expect(result.agents?.[0].readonly).toBe(true);
		expect(result.agents?.[0].tools).toEqual(["Read", "Grep"]);
		expect(result.agents?.[0].instructions).toContain("Review code changes carefully.");
	});
});
