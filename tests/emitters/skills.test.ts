import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { skillsEmitter } from "../../src/emitters/skills.js";

describe("skillsEmitter", () => {
	it("emits skill files for Claude with frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "review",
			description: "Code review",
			content: "# Review\n\nReview the code.",
			disableAutoInvocation: false,
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".claude/skills/review/SKILL.md");
		expect(result.files[0].content).toContain("---");
		expect(result.files[0].content).toContain("name: review");
		expect(result.files[0].content).toContain("description: Code review");
		expect(result.files[0].content).toContain("# Review");
	});

	it("emits skill files for Cursor with frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "deploy",
			description: "Deploy helper",
			content: "# Deploy",
			disableAutoInvocation: false,
		});

		const result = skillsEmitter.emit(config, "cursor");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".cursor/skills/deploy/SKILL.md");
		expect(result.files[0].content).toContain("---");
		expect(result.files[0].content).toContain("name: deploy");
	});

	it("emits skill files for Codex with frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "test",
			description: "Test runner",
			content: "# Test",
			disableAutoInvocation: false,
		});

		const result = skillsEmitter.emit(config, "codex");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".codex/skills/test/SKILL.md");
	});

	it("emits skill files for Copilot with frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "lint",
			description: "Lint helper",
			content: "# Lint",
			disableAutoInvocation: false,
		});

		const result = skillsEmitter.emit(config, "copilot");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".github/skills/lint/SKILL.md");
	});

	it("emits disable-model-invocation when true", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "manual",
			description: "Manual only",
			content: "# Manual",
			disableAutoInvocation: true,
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("disable-model-invocation: true");
	});

	it("emits argumentHint in frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "gen",
			description: "Generator",
			content: "# Gen",
			disableAutoInvocation: false,
			argumentHint: "<file-path>",
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("argument-hint: <file-path>");
	});

	it("emits user-invocable: false when set", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "internal",
			description: "Internal skill",
			content: "# Internal",
			disableAutoInvocation: false,
			userInvocable: false,
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("user-invocable: false");
	});

	it("emits allowed-tools in frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "safe",
			description: "Safe skill",
			content: "# Safe",
			disableAutoInvocation: false,
			allowedTools: ["Read", "Grep"],
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("allowed-tools: Read, Grep");
	});

	it("emits model in frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "smart",
			description: "Smart skill",
			content: "# Smart",
			disableAutoInvocation: false,
			model: "opus",
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("model: opus");
	});

	it("emits context: fork in frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "isolated",
			description: "Isolated skill",
			content: "# Isolated",
			disableAutoInvocation: false,
			context: "fork",
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("context: fork");
	});

	it("emits agent in frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "delegated",
			description: "Delegated skill",
			content: "# Delegated",
			disableAutoInvocation: false,
			agent: "reviewer",
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("agent: reviewer");
	});

	it("emits hooks as YAML block in frontmatter", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "hooked",
			description: "Hooked skill",
			content: "# Hooked",
			disableAutoInvocation: false,
			hooks: {
				preToolUse: { command: "echo check" },
			},
		});

		const result = skillsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("hooks:");
		expect(result.files[0].content).toContain("preToolUse:");
	});

	it("returns empty for no skills", () => {
		const config = emptyConfig();
		const result = skillsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
		expect(result.warnings).toHaveLength(0);
	});
});
