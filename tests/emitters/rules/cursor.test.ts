import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { rulesEmitter } from "../../../src/emitters/rules/index.js";

describe("rulesEmitter — cursor", () => {
	it("emits .mdc files with frontmatter for each rule", () => {
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

		const result = rulesEmitter.emit(config, "cursor");
		expect(result.files).toHaveLength(2);

		const style = result.files.find((f) => f.path.includes("code-style"));
		expect(style).toBeDefined();
		expect(style?.path).toMatch(/\.cursor\/rules\/.*\.mdc$/);
		expect(style?.content).toContain("alwaysApply: true");

		const testing = result.files.find((f) => f.path.includes("testing"));
		expect(testing).toBeDefined();
		expect(testing?.content).toContain('globs: ["**/*.test.ts"]');
		expect(testing?.content).toContain("alwaysApply: false");
	});

	it("emits Cursor rules to outputDir/.cursor/rules/", () => {
		const config = emptyConfig();
		config.rules.push(
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

		const result = rulesEmitter.emit(config, "cursor");
		const docsFiles = result.files.filter((f) => f.path.startsWith("docs-site/"));
		expect(docsFiles).toHaveLength(2);
		expect(docsFiles[0].path).toMatch(/^docs-site\/\.cursor\/rules\/.*\.mdc$/);
	});
});
