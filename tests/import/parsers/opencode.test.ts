import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseOpenCode } from "../../../src/import/parsers/opencode.js";
import type { DetectedFile } from "../../../src/import/scanner.js";

const TMP_DIR = join(import.meta.dirname, "../../fixtures/tmp-opencode-parser");

describe("parseOpenCode", () => {
	beforeEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
	});

	it("parses opencode.json MCP servers", async () => {
		const content = JSON.stringify({
			mcp: {
				github: { type: "stdio", command: "npx", args: ["@mcp/server-github"] },
				api: { type: "remote", url: "https://api.example.com/mcp" },
			},
		});
		const filePath = join(TMP_DIR, "opencode.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "opencode.json",
				source: "opencode",
				kind: "settings",
				label: "opencode.json",
			},
		];

		const result = await parseOpenCode(TMP_DIR, files);
		expect(result.toolServers).toHaveLength(2);

		const stdio = result.toolServers?.find((s) => s.name === "github");
		expect(stdio?.transport).toBe("stdio");
		expect(stdio?.command).toBe("npx");
		expect(stdio?.args).toEqual(["@mcp/server-github"]);

		const remote = result.toolServers?.find((s) => s.name === "api");
		expect(remote?.transport).toBe("http");
		expect(remote?.url).toBe("https://api.example.com/mcp");
	});

	it("parses opencode.json permissions", async () => {
		const content = JSON.stringify({
			permission: {
				bash: {
					"npm *": "allow",
					"rm -rf /*": "deny",
				},
				read: "allow",
			},
		});
		const filePath = join(TMP_DIR, "opencode.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "opencode.json",
				source: "opencode",
				kind: "settings",
				label: "opencode.json",
			},
		];

		const result = await parseOpenCode(TMP_DIR, files);
		expect(result.permissions).toHaveLength(3);

		const bashAllow = result.permissions?.find((p) => p.tool === "bash" && p.pattern === "npm *");
		expect(bashAllow?.decision).toBe("allow");

		const bashDeny = result.permissions?.find(
			(p) => p.tool === "bash" && p.pattern === "rm -rf /*",
		);
		expect(bashDeny?.decision).toBe("deny");

		const readAllow = result.permissions?.find((p) => p.tool === "read" && !p.pattern);
		expect(readAllow?.decision).toBe("allow");
	});

	it("parses opencode.json instructions into directives", async () => {
		// Create instruction files
		const instrDir = join(TMP_DIR, ".opencode", "instructions");
		mkdirSync(instrDir, { recursive: true });
		writeFileSync(join(instrDir, "coding.md"), "# Coding Rules\n\nWrite clean code.");
		writeFileSync(
			join(instrDir, "testing.md"),
			"<!-- applies to: **/*.test.ts -->\n\n# Testing Rules\n\nWrite good tests.",
		);

		const content = JSON.stringify({
			instructions: [".opencode/instructions/coding.md", ".opencode/instructions/testing.md"],
		});
		const filePath = join(TMP_DIR, "opencode.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "opencode.json",
				source: "opencode",
				kind: "settings",
				label: "opencode.json",
			},
		];

		const result = await parseOpenCode(TMP_DIR, files);
		expect(result.directives).toHaveLength(2);
		expect(result.directives?.[0].content).toContain("Coding Rules");
		expect(result.directives?.[0].alwaysApply).toBe(true);
		expect(result.directives?.[1].appliesTo).toEqual(["**/*.test.ts"]);
		expect(result.directives?.[1].alwaysApply).toBe(false);
	});

	it("parses opencode.json watcher.ignore into ignorePatterns", async () => {
		const content = JSON.stringify({
			watcher: { ignore: ["node_modules/**", "dist/**"] },
		});
		const filePath = join(TMP_DIR, "opencode.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "opencode.json",
				source: "opencode",
				kind: "settings",
				label: "opencode.json",
			},
		];

		const result = await parseOpenCode(TMP_DIR, files);
		expect(result.ignorePatterns).toHaveLength(2);
		expect(result.ignorePatterns?.[0].pattern).toBe("node_modules/**");
		expect(result.ignorePatterns?.[1].pattern).toBe("dist/**");
	});

	it("parses opencode.json settings keys", async () => {
		const content = JSON.stringify({
			model: "claude-sonnet-4-6",
			theme: "dark",
		});
		const filePath = join(TMP_DIR, "opencode.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "opencode.json",
				source: "opencode",
				kind: "settings",
				label: "opencode.json",
			},
		];

		const result = await parseOpenCode(TMP_DIR, files);
		const modelSetting = result.settings?.find((s) => s.key === "model");
		expect(modelSetting?.value).toBe("claude-sonnet-4-6");
		const themeSetting = result.settings?.find((s) => s.key === "theme");
		expect(themeSetting?.value).toBe("dark");
	});

	it("parses .opencode/agents/*.md with frontmatter", async () => {
		const agentsDir = join(TMP_DIR, ".opencode", "agents");
		mkdirSync(agentsDir, { recursive: true });
		const content = `---
description: Reviews code changes
mode: subagent
model: claude-sonnet-4-6
temperature: 0.3
top_p: 0.9
steps: 10
color: blue
hidden: true
disable: true
---

Review code changes carefully.`;
		const filePath = join(agentsDir, "reviewer.md");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".opencode/agents/reviewer.md",
				source: "opencode",
				kind: "agents",
				label: ".opencode/agents/reviewer.md",
			},
		];

		const result = await parseOpenCode(TMP_DIR, files);
		expect(result.agents).toHaveLength(1);
		const agent = result.agents?.[0];
		expect(agent?.name).toBe("reviewer");
		expect(agent?.description).toBe("Reviews code changes");
		expect(agent?.mode).toBe("subagent");
		expect(agent?.model).toBe("claude-sonnet-4-6");
		expect(agent?.temperature).toBe(0.3);
		expect(agent?.topP).toBe(0.9);
		expect(agent?.steps).toBe(10);
		expect(agent?.color).toBe("blue");
		expect(agent?.hidden).toBe(true);
		expect(agent?.disabled).toBe(true);
		expect(agent?.instructions).toContain("Review code changes carefully");
	});
});
