import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { rulesEmitter } from "../../../src/emitters/rules/index.js";

describe("rulesEmitter — copilot", () => {
	it("puts alwaysApply rules in .github/copilot-instructions.md", () => {
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

		const result = rulesEmitter.emit(config, "copilot");
		const repoWide = result.files.find((f) => f.path === ".github/copilot-instructions.md");
		expect(repoWide).toBeDefined();
		expect(repoWide?.content).toContain("Use tabs for indentation.");
	});

	it("puts scoped rules in .github/instructions/ with applyTo frontmatter", () => {
		const config = emptyConfig();
		config.rules.push({
			content: "Write tests with vitest.",
			scope: "project",
			alwaysApply: false,
			appliesTo: ["**/*.test.ts"],
			description: "Testing rules",
		});

		const result = rulesEmitter.emit(config, "copilot");
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

	it("emits Copilot rules to outputDir/.github/", () => {
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

		const result = rulesEmitter.emit(config, "copilot");
		const rootCopilot = result.files.find((f) => f.path === ".github/copilot-instructions.md");
		expect(rootCopilot).toBeDefined();

		const docsCopilot = result.files.find(
			(f) => f.path === "docs-site/.github/copilot-instructions.md",
		);
		expect(docsCopilot).toBeDefined();
		expect(docsCopilot?.content).toContain("Docs rule.");
	});
});
