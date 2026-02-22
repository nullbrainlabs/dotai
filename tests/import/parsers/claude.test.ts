import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseClaude } from "../../../src/import/parsers/claude.js";
import type { DetectedFile } from "../../../src/import/scanner.js";

const TMP_DIR = join(import.meta.dirname, "../../fixtures/tmp-claude-parser");

describe("parseClaude", () => {
	beforeEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
	});

	it("parses CLAUDE.md into directives split on separator", async () => {
		const content = "# Rule One\n\nDo this thing.\n\n---\n\n# Rule Two\n\nDo that thing.";
		const filePath = join(TMP_DIR, "CLAUDE.md");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: "CLAUDE.md",
				source: "claude",
				kind: "directives",
				label: "CLAUDE.md",
			},
		];

		const result = await parseClaude(TMP_DIR, files);
		expect(result.directives).toHaveLength(2);
		expect(result.directives?.[0].content).toContain("Rule One");
		expect(result.directives?.[0].alwaysApply).toBe(true);
		expect(result.directives?.[1].content).toContain("Rule Two");
	});

	it("parses .mcp.json into toolServers", async () => {
		const content = JSON.stringify({
			mcpServers: {
				github: { command: "npx", args: ["@mcp/server-github"] },
			},
		});
		const filePath = join(TMP_DIR, ".mcp.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".mcp.json",
				source: "claude",
				kind: "mcp",
				label: ".mcp.json",
			},
		];

		const result = await parseClaude(TMP_DIR, files);
		expect(result.toolServers).toHaveLength(1);
		expect(result.toolServers?.[0].name).toBe("github");
		expect(result.toolServers?.[0].command).toBe("npx");
		expect(result.toolServers?.[0].args).toEqual(["@mcp/server-github"]);
		expect(result.toolServers?.[0].transport).toBe("stdio");
	});

	it("parses .claude/settings.json permissions", async () => {
		const settingsDir = join(TMP_DIR, ".claude");
		mkdirSync(settingsDir, { recursive: true });
		const content = JSON.stringify({
			permissions: {
				allow: ["Bash(npm *)"],
				deny: ["Bash(rm -rf /*)"],
			},
		});
		const filePath = join(settingsDir, "settings.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".claude/settings.json",
				source: "claude",
				kind: "settings",
				label: ".claude/settings.json",
			},
		];

		const result = await parseClaude(TMP_DIR, files);
		const allowRule = result.permissions?.find((p) => p.decision === "allow");
		expect(allowRule).toBeDefined();
		expect(allowRule?.tool).toBe("Bash");
		expect(allowRule?.pattern).toBe("npm *");
		const denyRule = result.permissions?.find((p) => p.decision === "deny");
		expect(denyRule).toBeDefined();
		expect(denyRule?.tool).toBe("Bash");
		expect(denyRule?.pattern).toBe("rm -rf /*");
	});

	it("parses .claude/settings.json hooks", async () => {
		const settingsDir = join(TMP_DIR, ".claude");
		mkdirSync(settingsDir, { recursive: true });
		const content = JSON.stringify({
			hooks: {
				preFileEdit: [{ command: "eslint --fix" }],
			},
		});
		const filePath = join(settingsDir, "settings.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".claude/settings.json",
				source: "claude",
				kind: "settings",
				label: ".claude/settings.json",
			},
		];

		const result = await parseClaude(TMP_DIR, files);
		expect(result.hooks).toHaveLength(1);
		expect(result.hooks?.[0].event).toBe("preFileEdit");
		expect(result.hooks?.[0].handler).toBe("eslint --fix");
	});

	it("converts Read/Edit deny rules into ignorePatterns", async () => {
		const settingsDir = join(TMP_DIR, ".claude");
		mkdirSync(settingsDir, { recursive: true });
		const content = JSON.stringify({
			permissions: {
				allow: [],
				deny: ["Read(node_modules/**)", "Edit(node_modules/**)"],
			},
		});
		const filePath = join(settingsDir, "settings.json");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".claude/settings.json",
				source: "claude",
				kind: "settings",
				label: ".claude/settings.json",
			},
		];

		const result = await parseClaude(TMP_DIR, files);
		expect(result.ignorePatterns?.length).toBeGreaterThanOrEqual(1);
		const nodeModules = result.ignorePatterns?.find((p) => p.pattern === "node_modules/**");
		expect(nodeModules).toBeDefined();
		expect(nodeModules?.scope).toBe("project");
		// Read/Edit deny rules should not appear in permissions
		const readDeny = result.permissions?.find((p) => p.tool === "Read");
		expect(readDeny).toBeUndefined();
	});

	it("parses .claude/rules/*.md into directives with appliesTo", async () => {
		const rulesDir = join(TMP_DIR, ".claude", "rules");
		mkdirSync(rulesDir, { recursive: true });
		const content =
			"<!-- applies to: **/*.test.ts, **/*.spec.ts -->\n\n# Testing Rules\n\nWrite good tests.";
		const filePath = join(rulesDir, "testing.md");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".claude/rules/testing.md",
				source: "claude",
				kind: "directives",
				label: ".claude/rules/testing.md",
			},
		];

		const result = await parseClaude(TMP_DIR, files);
		expect(result.directives).toHaveLength(1);
		expect(result.directives?.[0].appliesTo).toEqual(["**/*.test.ts", "**/*.spec.ts"]);
		expect(result.directives?.[0].alwaysApply).toBe(false);
		expect(result.directives?.[0].content).toContain("Testing Rules");
	});

	it("parses .claude/agents/*.md into agents", async () => {
		const agentsDir = join(TMP_DIR, ".claude", "agents");
		mkdirSync(agentsDir, { recursive: true });
		const content = "# Reviewer Agent\n\nReview code changes carefully.";
		const filePath = join(agentsDir, "reviewer.md");
		writeFileSync(filePath, content);

		const files: DetectedFile[] = [
			{
				path: filePath,
				relativePath: ".claude/agents/reviewer.md",
				source: "claude",
				kind: "agents",
				label: ".claude/agents/reviewer.md",
			},
		];

		const result = await parseClaude(TMP_DIR, files);
		expect(result.agents).toHaveLength(1);
		expect(result.agents?.[0].name).toBe("reviewer");
		expect(result.agents?.[0].instructions).toContain("Review code changes carefully");
	});
});
