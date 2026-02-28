import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { rulesEmitter } from "../../src/emitters/rules.js";

describe("rulesEmitter", () => {
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

	describe("Claude", () => {
		it("puts alwaysApply rules in CLAUDE.md", () => {
			const result = rulesEmitter.emit(makeConfig(), "claude");
			const claudeMd = result.files.find((f) => f.path === "CLAUDE.md");
			expect(claudeMd).toBeDefined();
			expect(claudeMd?.content).toContain("Use tabs for indentation.");
		});

		it("puts scoped rules in .claude/rules/ with YAML frontmatter", () => {
			const result = rulesEmitter.emit(makeConfig(), "claude");
			const rules = result.files.filter((f) => f.path.startsWith(".claude/rules/"));
			expect(rules).toHaveLength(1);
			expect(rules[0].path).toBe(".claude/rules/testing-rules.md");
			expect(rules[0].content).toContain("Write tests with vitest.");
			expect(rules[0].content).toContain("---\npaths:\n");
			expect(rules[0].content).toContain('  - "**/*.test.ts"');
		});

		it("emits multi-pattern YAML frontmatter", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "Follow React conventions.",
				scope: "project",
				alwaysApply: false,
				appliesTo: ["**/*.tsx", "**/*.jsx", "src/components/**"],
				description: "React rules",
			});
			const result = rulesEmitter.emit(config, "claude");
			const rule = result.files.find((f) => f.path.startsWith(".claude/rules/"));
			expect(rule).toBeDefined();
			expect(rule?.content).toContain('  - "**/*.tsx"');
			expect(rule?.content).toContain('  - "**/*.jsx"');
			expect(rule?.content).toContain('  - "src/components/**"');
		});

		it("routes local-scope rules to CLAUDE.local.md", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "My local preference.",
				scope: "local",
				alwaysApply: true,
				description: "Local prefs",
			});
			const result = rulesEmitter.emit(config, "claude");
			const localMd = result.files.find((f) => f.path === "CLAUDE.local.md");
			expect(localMd).toBeDefined();
			expect(localMd?.content).toContain("My local preference.");
			expect(result.files.find((f) => f.path === "CLAUDE.md")).toBeUndefined();
		});

		it("warns when local-scope rule has appliesTo", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "Local scoped rule.",
				scope: "local",
				alwaysApply: false,
				appliesTo: ["**/*.ts"],
				description: "Local scoped",
			});
			const result = rulesEmitter.emit(config, "claude");
			const localMd = result.files.find((f) => f.path === "CLAUDE.local.md");
			expect(localMd).toBeDefined();
			expect(localMd?.content).toContain("Local scoped rule.");
			expect(result.warnings).toContainEqual(
				expect.stringContaining("does not support scoped local rules"),
			);
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
			const result = rulesEmitter.emit(config, "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe("CLAUDE.md");
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
			const result = rulesEmitter.emit(config, "claude");
			expect(result.files).toHaveLength(0);
			expect(result.warnings).toContainEqual(expect.stringContaining("enterprise-scope rule(s)"));
		});

		it("warns on alwaysApply: false without appliesTo", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "Orphan rule.",
				scope: "project",
				alwaysApply: false,
				description: "No scope rule",
			});
			const result = rulesEmitter.emit(config, "claude");
			// Still emits to .claude/rules/ but warns
			const rule = result.files.find((f) => f.path === ".claude/rules/no-scope-rule.md");
			expect(rule).toBeDefined();
			expect(rule?.content).toContain("Orphan rule.");
			expect(rule?.content).not.toContain("---"); // no frontmatter
			expect(result.warnings).toContainEqual(
				expect.stringContaining("alwaysApply: false without appliesTo"),
			);
		});
	});

	describe("Cursor", () => {
		it("emits .mdc files with frontmatter for each rule", () => {
			const result = rulesEmitter.emit(makeConfig(), "cursor");
			expect(result.files).toHaveLength(2);

			const style = result.files.find((f) => f.path.includes("code-style"));
			expect(style).toBeDefined();
			expect(style?.path).toMatch(/\.cursor\/rules\/.*\.mdc$/);
			expect(style?.content).toContain("alwaysApply: true");

			const testing = result.files.find((f) => f.path.includes("testing"));
			expect(testing).toBeDefined();
			expect(testing?.content).toContain("globs: **/*.test.ts");
			expect(testing?.content).toContain("alwaysApply: false");
		});
	});

	describe("Codex", () => {
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
	});

	describe("Copilot", () => {
		it("puts alwaysApply rules in .github/copilot-instructions.md", () => {
			const result = rulesEmitter.emit(makeConfig(), "copilot");
			const repoWide = result.files.find((f) => f.path === ".github/copilot-instructions.md");
			expect(repoWide).toBeDefined();
			expect(repoWide?.content).toContain("Use tabs for indentation.");
		});

		it("puts scoped rules in .github/instructions/ with applyTo frontmatter", () => {
			const result = rulesEmitter.emit(makeConfig(), "copilot");
			const scoped = result.files.filter((f) => f.path.startsWith(".github/instructions/"));
			expect(scoped).toHaveLength(1);
			expect(scoped[0].path).toBe(".github/instructions/testing-rules.instructions.md");
			expect(scoped[0].content).toContain('applyTo: "**/*.test.ts"');
			expect(scoped[0].content).toContain("Write tests with vitest.");
		});

		it("emits non-alwaysApply rules without frontmatter when no appliesTo", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "Be concise.",
				scope: "project",
				alwaysApply: false,
				description: "Style guide",
			});

			const result = rulesEmitter.emit(config, "copilot");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".github/instructions/style-guide.instructions.md");
			expect(result.files[0].content).not.toContain("applyTo");
		});

		it("emits excludeAgent in frontmatter for scoped instructions", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "Skip code review.",
				scope: "project",
				alwaysApply: false,
				appliesTo: ["**/*.test.ts"],
				description: "No review",
				excludeAgent: "code-review",
			});

			const result = rulesEmitter.emit(config, "copilot");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".github/instructions/no-review.instructions.md");
			expect(result.files[0].content).toContain("excludeAgent: code-review");
			expect(result.files[0].content).toContain('applyTo: "**/*.test.ts"');
		});

		it("routes alwaysApply + excludeAgent to instructions path", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "Not for coding agent.",
				scope: "project",
				alwaysApply: true,
				description: "No coding agent",
				excludeAgent: "coding-agent",
			});

			const result = rulesEmitter.emit(config, "copilot");
			// Should NOT go to copilot-instructions.md (no frontmatter support there)
			const repoWide = result.files.find((f) => f.path === ".github/copilot-instructions.md");
			expect(repoWide).toBeUndefined();
			// Should go to .github/instructions/
			const instruction = result.files.find((f) => f.path.startsWith(".github/instructions/"));
			expect(instruction).toBeDefined();
			expect(instruction?.content).toContain("excludeAgent: coding-agent");
			expect(instruction?.content).toContain("Not for coding agent.");
		});
	});

	it("returns empty for no rules", () => {
		const config = emptyConfig();
		const result = rulesEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});

	describe("outputDir", () => {
		const makeOutputDirConfig = () => {
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
				{
					content: "Scoped to docs.",
					scope: "project",
					alwaysApply: false,
					appliesTo: ["**/*.md"],
					description: "Docs scoped",
					outputDir: "docs-site",
				},
			);
			return config;
		};

		it("emits Claude rules to outputDir/CLAUDE.md", () => {
			const result = rulesEmitter.emit(makeOutputDirConfig(), "claude");
			const rootMd = result.files.find((f) => f.path === "CLAUDE.md");
			expect(rootMd).toBeDefined();
			expect(rootMd?.content).toContain("Root rule.");

			const docsMd = result.files.find((f) => f.path === "docs-site/CLAUDE.md");
			expect(docsMd).toBeDefined();
			expect(docsMd?.content).toContain("Docs rule.");

			const docsRule = result.files.find((f) => f.path.startsWith("docs-site/.claude/rules/"));
			expect(docsRule).toBeDefined();
			expect(docsRule?.content).toContain("Scoped to docs.");
		});

		it("emits Cursor rules to outputDir/.cursor/rules/", () => {
			const result = rulesEmitter.emit(makeOutputDirConfig(), "cursor");
			const docsFiles = result.files.filter((f) => f.path.startsWith("docs-site/"));
			expect(docsFiles).toHaveLength(2);
			expect(docsFiles[0].path).toMatch(/^docs-site\/\.cursor\/rules\/.*\.mdc$/);
		});

		it("emits Codex rules to outputDir/AGENTS.md", () => {
			const result = rulesEmitter.emit(makeOutputDirConfig(), "codex");
			const rootAgents = result.files.find((f) => f.path === "AGENTS.md");
			expect(rootAgents).toBeDefined();
			expect(rootAgents?.content).toContain("Root rule.");

			const docsAgents = result.files.find((f) => f.path === "docs-site/AGENTS.md");
			expect(docsAgents).toBeDefined();
			expect(docsAgents?.content).toContain("Docs rule.");
		});

		it("emits Copilot rules to outputDir/.github/", () => {
			const result = rulesEmitter.emit(makeOutputDirConfig(), "copilot");
			const rootCopilot = result.files.find((f) => f.path === ".github/copilot-instructions.md");
			expect(rootCopilot).toBeDefined();

			const docsCopilot = result.files.find(
				(f) => f.path === "docs-site/.github/copilot-instructions.md",
			);
			expect(docsCopilot).toBeDefined();
			expect(docsCopilot?.content).toContain("Docs rule.");
		});

		it("rule without outputDir still emits to root (backward compat)", () => {
			const config = emptyConfig();
			config.rules.push({
				content: "Root only.",
				scope: "project",
				alwaysApply: true,
				description: "Root",
			});
			const result = rulesEmitter.emit(config, "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe("CLAUDE.md");
		});

		it("emits local-scope rules to outputDir/CLAUDE.local.md", () => {
			const config = emptyConfig();
			config.rules.push(
				{
					content: "Local root.",
					scope: "local",
					alwaysApply: true,
					description: "Local root",
				},
				{
					content: "Local docs.",
					scope: "local",
					alwaysApply: true,
					description: "Local docs",
					outputDir: "docs-site",
				},
			);
			const result = rulesEmitter.emit(config, "claude");
			const rootLocal = result.files.find((f) => f.path === "CLAUDE.local.md");
			expect(rootLocal).toBeDefined();
			expect(rootLocal?.content).toContain("Local root.");

			const docsLocal = result.files.find((f) => f.path === "docs-site/CLAUDE.local.md");
			expect(docsLocal).toBeDefined();
			expect(docsLocal?.content).toContain("Local docs.");
		});
	});
});
