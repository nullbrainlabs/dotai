import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { rulesEmitter } from "../../../src/emitters/rules/index.js";

describe("rulesEmitter — codex", () => {
	const makeConfig = () => {
		const config = emptyConfig();
		config.rules.push(
			{
				content: "Use tabs for indentation.",
				scope: "project",
				alwaysApply: true,
				description: "Code style",
			},
			{
				content: "Write tests with vitest.",
				scope: "project",
				alwaysApply: false,
				appliesTo: ["**/*.test.ts"],
				description: "Testing rules",
			},
		);
		return config;
	};

	it("concatenates all rules into AGENTS.md", () => {
		const result = rulesEmitter.emit(makeConfig(), "codex");
		const agentsMd = result.files.find((f) => f.path === "AGENTS.md");
		expect(agentsMd).toBeDefined();
		expect(agentsMd?.content).toContain("# Project Instructions");
		expect(agentsMd?.content).toContain("Use tabs for indentation.");
		expect(agentsMd?.content).toContain("Write tests with vitest.");
	});

	it("warns about file-scoped rules", () => {
		const result = rulesEmitter.emit(makeConfig(), "codex");
		expect(result.warnings).toContainEqual(expect.stringContaining("appliesTo"));
	});

	it("skips user-scope rules with warning", () => {
		const config = emptyConfig();
		config.rules.push(
			{
				content: "User pref.",
				scope: "user",
				alwaysApply: true,
				description: "User rule",
			},
			{
				content: "Project rule.",
				scope: "project",
				alwaysApply: true,
				description: "Project rule",
			},
		);
		const result = rulesEmitter.emit(config, "codex");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe("AGENTS.md");
		expect(result.files[0].content).not.toContain("User pref.");
		expect(result.warnings).toContainEqual(
			expect.stringContaining('user-scope rule(s) — use "dotai sync --scope user"'),
		);
	});

	it("skips enterprise-scope rules with warning", () => {
		const config = emptyConfig();
		config.rules.push({
			content: "Enterprise policy.",
			scope: "enterprise",
			alwaysApply: true,
			description: "Enterprise rule",
		});
		const result = rulesEmitter.emit(config, "codex");
		expect(result.files).toHaveLength(0);
		expect(result.warnings).toContainEqual(expect.stringContaining("enterprise-scope rule(s)"));
	});

	it("emits override: true rules to AGENTS.override.md", () => {
		const config = emptyConfig();
		config.rules.push(
			{
				content: "Normal rule.",
				scope: "project",
				alwaysApply: true,
				description: "Normal",
			},
			{
				content: "Override rule.",
				scope: "project",
				alwaysApply: true,
				description: "Override",
				override: true,
			},
		);
		const result = rulesEmitter.emit(config, "codex");
		const agentsMd = result.files.find((f) => f.path === "AGENTS.md");
		expect(agentsMd).toBeDefined();
		expect(agentsMd?.content).toContain("Normal rule.");
		expect(agentsMd?.content).not.toContain("Override rule.");

		const overrideMd = result.files.find((f) => f.path === "AGENTS.override.md");
		expect(overrideMd).toBeDefined();
		expect(overrideMd?.content).toContain("Override rule.");
	});

	it("emits override: true + outputDir to <dir>/AGENTS.override.md", () => {
		const config = emptyConfig();
		config.rules.push({
			content: "Nested override.",
			scope: "project",
			alwaysApply: true,
			description: "Nested",
			outputDir: "services/api",
			override: true,
		});
		const result = rulesEmitter.emit(config, "codex");
		const overrideMd = result.files.find((f) => f.path === "services/api/AGENTS.override.md");
		expect(overrideMd).toBeDefined();
		expect(overrideMd?.content).toContain("Nested override.");
	});

	it("warns when content exceeds 32 KiB", () => {
		const config = emptyConfig();
		config.rules.push({
			content: "x".repeat(33 * 1024),
			scope: "project",
			alwaysApply: true,
			description: "Huge",
		});
		const result = rulesEmitter.emit(config, "codex");
		expect(result.warnings).toContainEqual(expect.stringContaining("exceeds Codex 32 KiB limit"));
	});

	it("override field is ignored for Claude/Cursor/Copilot targets", () => {
		const config = emptyConfig();
		config.rules.push({
			content: "Override ignored.",
			scope: "project",
			alwaysApply: true,
			description: "Special rule",
			override: true,
		});

		for (const target of ["claude", "cursor", "copilot"] as const) {
			const result = rulesEmitter.emit(config, target);
			// No file should route to AGENTS.override.md
			expect(result.files.every((f) => !f.path.includes("AGENTS.override"))).toBe(true);
			// Content should still be emitted
			expect(result.files.length).toBeGreaterThan(0);
		}
	});

	it("emits Codex rules to outputDir/AGENTS.md", () => {
		const config = emptyConfig();
		config.rules.push(
			{
				content: "Root rule.",
				scope: "project",
				alwaysApply: true,
				description: "Root rules",
			},
			{
				content: "Docs rule.",
				scope: "project",
				alwaysApply: true,
				description: "Docs rules",
				outputDir: "docs-site",
			},
		);

		const result = rulesEmitter.emit(config, "codex");
		const rootAgents = result.files.find((f) => f.path === "AGENTS.md");
		expect(rootAgents).toBeDefined();
		expect(rootAgents?.content).toContain("Root rule.");

		const docsAgents = result.files.find((f) => f.path === "docs-site/AGENTS.md");
		expect(docsAgents).toBeDefined();
		expect(docsAgents?.content).toContain("Docs rule.");
	});
});
