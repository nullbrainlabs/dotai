import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { directivesEmitter } from "../../src/emitters/directives.js";

describe("directivesEmitter", () => {
	const makeConfig = () => {
		const config = emptyConfig();
		config.directives.push(
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
		it("puts alwaysApply directives in CLAUDE.md", () => {
			const result = directivesEmitter.emit(makeConfig(), "claude");
			const claudeMd = result.files.find((f) => f.path === "CLAUDE.md");
			expect(claudeMd).toBeDefined();
			expect(claudeMd?.content).toContain("Use tabs for indentation.");
		});

		it("puts scoped directives in .claude/rules/ with YAML frontmatter", () => {
			const result = directivesEmitter.emit(makeConfig(), "claude");
			const rules = result.files.filter((f) => f.path.startsWith(".claude/rules/"));
			expect(rules).toHaveLength(1);
			expect(rules[0].path).toBe(".claude/rules/testing-rules.md");
			expect(rules[0].content).toContain("Write tests with vitest.");
			expect(rules[0].content).toContain("---\npaths:\n");
			expect(rules[0].content).toContain('  - "**/*.test.ts"');
		});

		it("emits multi-pattern YAML frontmatter", () => {
			const config = emptyConfig();
			config.directives.push({
				content: "Follow React conventions.",
				scope: "project",
				alwaysApply: false,
				appliesTo: ["**/*.tsx", "**/*.jsx", "src/components/**"],
				description: "React rules",
			});
			const result = directivesEmitter.emit(config, "claude");
			const rule = result.files.find((f) => f.path.startsWith(".claude/rules/"));
			expect(rule).toBeDefined();
			expect(rule?.content).toContain('  - "**/*.tsx"');
			expect(rule?.content).toContain('  - "**/*.jsx"');
			expect(rule?.content).toContain('  - "src/components/**"');
		});

		it("routes local-scope directives to CLAUDE.local.md", () => {
			const config = emptyConfig();
			config.directives.push({
				content: "My local preference.",
				scope: "local",
				alwaysApply: true,
				description: "Local prefs",
			});
			const result = directivesEmitter.emit(config, "claude");
			const localMd = result.files.find((f) => f.path === "CLAUDE.local.md");
			expect(localMd).toBeDefined();
			expect(localMd?.content).toContain("My local preference.");
			expect(result.files.find((f) => f.path === "CLAUDE.md")).toBeUndefined();
		});

		it("warns when local-scope directive has appliesTo", () => {
			const config = emptyConfig();
			config.directives.push({
				content: "Local scoped rule.",
				scope: "local",
				alwaysApply: false,
				appliesTo: ["**/*.ts"],
				description: "Local scoped",
			});
			const result = directivesEmitter.emit(config, "claude");
			const localMd = result.files.find((f) => f.path === "CLAUDE.local.md");
			expect(localMd).toBeDefined();
			expect(localMd?.content).toContain("Local scoped rule.");
			expect(result.warnings).toContainEqual(
				expect.stringContaining("does not support scoped local rules"),
			);
		});

		it("skips user-scope directives with warning", () => {
			const config = emptyConfig();
			config.directives.push(
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
			const result = directivesEmitter.emit(config, "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe("CLAUDE.md");
			expect(result.files[0].content).not.toContain("User pref.");
			expect(result.warnings).toContainEqual(
				expect.stringContaining('user-scope directive(s) — use "dotai sync --scope user"'),
			);
		});

		it("skips enterprise-scope directives with warning", () => {
			const config = emptyConfig();
			config.directives.push({
				content: "Enterprise policy.",
				scope: "enterprise",
				alwaysApply: true,
				description: "Enterprise rule",
			});
			const result = directivesEmitter.emit(config, "claude");
			expect(result.files).toHaveLength(0);
			expect(result.warnings).toContainEqual(
				expect.stringContaining("enterprise-scope directive(s)"),
			);
		});

		it("warns on alwaysApply: false without appliesTo", () => {
			const config = emptyConfig();
			config.directives.push({
				content: "Orphan rule.",
				scope: "project",
				alwaysApply: false,
				description: "No scope rule",
			});
			const result = directivesEmitter.emit(config, "claude");
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
		it("emits .mdc files with frontmatter for each directive", () => {
			const result = directivesEmitter.emit(makeConfig(), "cursor");
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
		it("concatenates all directives into AGENTS.md", () => {
			const result = directivesEmitter.emit(makeConfig(), "codex");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe("AGENTS.md");
			expect(result.files[0].content).toContain("# Project Instructions");
			expect(result.files[0].content).toContain("Use tabs for indentation.");
			expect(result.files[0].content).toContain("Write tests with vitest.");
		});

		it("warns about file-scoped directives", () => {
			const result = directivesEmitter.emit(makeConfig(), "codex");
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings[0]).toContain("appliesTo");
		});
	});

	describe("Copilot", () => {
		it("puts alwaysApply directives in .github/copilot-instructions.md", () => {
			const result = directivesEmitter.emit(makeConfig(), "copilot");
			const repoWide = result.files.find((f) => f.path === ".github/copilot-instructions.md");
			expect(repoWide).toBeDefined();
			expect(repoWide?.content).toContain("Use tabs for indentation.");
		});

		it("puts scoped directives in .github/instructions/ with applyTo frontmatter", () => {
			const result = directivesEmitter.emit(makeConfig(), "copilot");
			const scoped = result.files.filter((f) => f.path.startsWith(".github/instructions/"));
			expect(scoped).toHaveLength(1);
			expect(scoped[0].path).toBe(".github/instructions/testing-rules.instructions.md");
			expect(scoped[0].content).toContain('applyTo: "**/*.test.ts"');
			expect(scoped[0].content).toContain("Write tests with vitest.");
		});

		it("emits non-alwaysApply directives without frontmatter when no appliesTo", () => {
			const config = emptyConfig();
			config.directives.push({
				content: "Be concise.",
				scope: "project",
				alwaysApply: false,
				description: "Style guide",
			});

			const result = directivesEmitter.emit(config, "copilot");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".github/instructions/style-guide.instructions.md");
			expect(result.files[0].content).not.toContain("applyTo");
		});
	});

	it("returns empty for no directives", () => {
		const config = emptyConfig();
		const result = directivesEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});

	describe("outputDir", () => {
		const makeOutputDirConfig = () => {
			const config = emptyConfig();
			config.directives.push(
				{
					content: "Root directive.",
					scope: "project",
					alwaysApply: true,
					description: "Root rules",
				},
				{
					content: "Docs directive.",
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

		it("emits Claude directives to outputDir/CLAUDE.md", () => {
			const result = directivesEmitter.emit(makeOutputDirConfig(), "claude");
			const rootMd = result.files.find((f) => f.path === "CLAUDE.md");
			expect(rootMd).toBeDefined();
			expect(rootMd?.content).toContain("Root directive.");

			const docsMd = result.files.find((f) => f.path === "docs-site/CLAUDE.md");
			expect(docsMd).toBeDefined();
			expect(docsMd?.content).toContain("Docs directive.");

			const docsRule = result.files.find((f) => f.path.startsWith("docs-site/.claude/rules/"));
			expect(docsRule).toBeDefined();
			expect(docsRule?.content).toContain("Scoped to docs.");
		});

		it("emits Cursor directives to outputDir/.cursor/rules/", () => {
			const result = directivesEmitter.emit(makeOutputDirConfig(), "cursor");
			const docsFiles = result.files.filter((f) => f.path.startsWith("docs-site/"));
			expect(docsFiles).toHaveLength(2);
			expect(docsFiles[0].path).toMatch(/^docs-site\/\.cursor\/rules\/.*\.mdc$/);
		});

		it("emits Codex directives to outputDir/AGENTS.md", () => {
			const result = directivesEmitter.emit(makeOutputDirConfig(), "codex");
			const rootAgents = result.files.find((f) => f.path === "AGENTS.md");
			expect(rootAgents).toBeDefined();
			expect(rootAgents?.content).toContain("Root directive.");

			const docsAgents = result.files.find((f) => f.path === "docs-site/AGENTS.md");
			expect(docsAgents).toBeDefined();
			expect(docsAgents?.content).toContain("Docs directive.");
		});

		it("emits Copilot directives to outputDir/.github/", () => {
			const result = directivesEmitter.emit(makeOutputDirConfig(), "copilot");
			const rootCopilot = result.files.find((f) => f.path === ".github/copilot-instructions.md");
			expect(rootCopilot).toBeDefined();

			const docsCopilot = result.files.find(
				(f) => f.path === "docs-site/.github/copilot-instructions.md",
			);
			expect(docsCopilot).toBeDefined();
			expect(docsCopilot?.content).toContain("Docs directive.");
		});

		it("directive without outputDir still emits to root (backward compat)", () => {
			const config = emptyConfig();
			config.directives.push({
				content: "Root only.",
				scope: "project",
				alwaysApply: true,
				description: "Root",
			});
			const result = directivesEmitter.emit(config, "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe("CLAUDE.md");
		});

		it("emits local-scope directives to outputDir/CLAUDE.local.md", () => {
			const config = emptyConfig();
			config.directives.push(
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
			const result = directivesEmitter.emit(config, "claude");
			const rootLocal = result.files.find((f) => f.path === "CLAUDE.local.md");
			expect(rootLocal).toBeDefined();
			expect(rootLocal?.content).toContain("Local root.");

			const docsLocal = result.files.find((f) => f.path === "docs-site/CLAUDE.local.md");
			expect(docsLocal).toBeDefined();
			expect(docsLocal?.content).toContain("Local docs.");
		});
	});
});
