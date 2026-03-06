import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { rulesEmitter } from "../../../src/emitters/rules/index.js";

describe("rulesEmitter — claude", () => {
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
