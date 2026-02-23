import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { skillsEmitter } from "../../src/emitters/skills.js";

describe("skillsEmitter", () => {
	it("emits skill files for Claude", () => {
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
		expect(result.files[0].content).toContain("# Review");
	});

	it("emits skill files for Cursor", () => {
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
	});

	it("emits skill files for Codex", () => {
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

	it("emits skill files for Copilot", () => {
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

	it("returns empty for no skills", () => {
		const config = emptyConfig();
		const result = skillsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
		expect(result.warnings).toHaveLength(0);
	});
});
