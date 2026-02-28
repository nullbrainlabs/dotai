import { existsSync, mkdirSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseCodex } from "../../../src/import/parsers/codex.js";
import type { DetectedFile } from "../../../src/import/scanner.js";

const TMP_DIR = join(import.meta.dirname, "../../fixtures/tmp-codex-parser");

describe("parseCodex", () => {
	beforeEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
	});

	it("parses .codex/config.toml mcp_servers into toolServers", async () => {
		const codexDir = join(TMP_DIR, ".codex");
		await mkdir(codexDir, { recursive: true });
		const content = [
			"[mcp_servers.github]",
			'type = "stdio"',
			'command = "npx"',
			'args = ["@mcp/server-github"]',
		].join("\n");
		const filePath = join(codexDir, "config.toml");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".codex/config.toml",
				source: "codex",
				kind: "settings",
				label: ".codex/config.toml",
			},
		];

		const result = await parseCodex(TMP_DIR, files);
		expect(result.toolServers).toHaveLength(1);
		expect(result.toolServers?.[0].name).toBe("github");
		expect(result.toolServers?.[0].command).toBe("npx");
		expect(result.toolServers?.[0].args).toEqual(["@mcp/server-github"]);
		expect(result.toolServers?.[0].transport).toBe("stdio");
	});

	it("parses approval_policy into permissions", async () => {
		const codexDir = join(TMP_DIR, ".codex");
		await mkdir(codexDir, { recursive: true });
		const content = 'approval_policy = "unless-allowed"';
		const filePath = join(codexDir, "config.toml");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".codex/config.toml",
				source: "codex",
				kind: "settings",
				label: ".codex/config.toml",
			},
		];

		const result = await parseCodex(TMP_DIR, files);
		expect(result.permissions).toHaveLength(1);
		expect(result.permissions?.[0].tool).toBe("Bash");
		expect(result.permissions?.[0].decision).toBe("allow");
	});

	it("parses protected_paths into ignorePatterns", async () => {
		const codexDir = join(TMP_DIR, ".codex");
		await mkdir(codexDir, { recursive: true });
		const content = 'protected_paths = ["node_modules/**", ".env"]';
		const filePath = join(codexDir, "config.toml");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".codex/config.toml",
				source: "codex",
				kind: "settings",
				label: ".codex/config.toml",
			},
		];

		const result = await parseCodex(TMP_DIR, files);
		expect(result.ignorePatterns).toHaveLength(2);
		expect(result.ignorePatterns?.[0].pattern).toBe("node_modules/**");
		expect(result.ignorePatterns?.[0].scope).toBe("project");
		expect(result.ignorePatterns?.[1].pattern).toBe(".env");
	});

	it("parses AGENTS.md sections into rules", async () => {
		const content = [
			"# Project Instructions",
			"",
			"## Conventions",
			"",
			"Follow project conventions.",
		].join("\n");
		const filePath = join(TMP_DIR, "AGENTS.md");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "AGENTS.md",
				source: "codex",
				kind: "rules",
				label: "AGENTS.md",
			},
		];

		const result = await parseCodex(TMP_DIR, files);
		expect(result.rules?.length).toBeGreaterThanOrEqual(1);
		const conventions = result.rules?.find((d) => d.description === "Conventions");
		expect(conventions).toBeDefined();
		expect(conventions?.content).toContain("Follow project conventions.");
		expect(conventions?.alwaysApply).toBe(true);
	});

	it("parses Agent: sections into agents", async () => {
		const content = [
			"# Project Instructions",
			"",
			"## Conventions",
			"",
			"Follow project conventions.",
			"",
			"## Agent: reviewer",
			"",
			"Review code changes carefully.",
		].join("\n");
		const filePath = join(TMP_DIR, "AGENTS.md");
		await writeFile(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "AGENTS.md",
				source: "codex",
				kind: "rules",
				label: "AGENTS.md",
			},
		];

		const result = await parseCodex(TMP_DIR, files);
		expect(result.agents?.length).toBeGreaterThanOrEqual(1);
		const reviewer = result.agents?.find((a) => a.name === "reviewer");
		expect(reviewer).toBeDefined();
		expect(reviewer?.instructions).toContain("Review code changes carefully.");
		// Conventions should still be a rule
		const conventions = result.rules?.find((d) => d.description === "Conventions");
		expect(conventions).toBeDefined();
	});
});
