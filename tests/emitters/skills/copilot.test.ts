import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { skillsEmitter } from "../../../src/emitters/skills/index.js";

describe("skillsEmitter — copilot", () => {
	it("emits skill files for Copilot with only supported fields", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "lint",
			description: "Lint helper",
			content: "# Lint",
			disableAutoInvocation: false,
			license: "MIT",
		});

		const result = skillsEmitter.emit(config, "copilot");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".github/skills/lint/SKILL.md");
		expect(result.files[0].content).toContain("name: lint");
		expect(result.files[0].content).toContain("description: Lint helper");
		expect(result.files[0].content).toContain("license: MIT");
		// Should NOT contain unsupported fields
		expect(result.files[0].content).not.toContain("disable-model-invocation");
		expect(result.files[0].content).not.toContain("allowed-tools");
	});

	it("warns about unsupported Copilot skill fields", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "full",
			description: "Full skill",
			content: "# Full",
			disableAutoInvocation: true,
			allowedTools: ["Read"],
			model: "opus",
			context: "fork",
			agent: "reviewer",
			hooks: { preToolUse: { command: "echo" } },
			userInvocable: false,
			argumentHint: "<file>",
		});

		const result = skillsEmitter.emit(config, "copilot");
		expect(result.warnings.some((w) => w.includes('"allowedTools"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"model"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"context"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"agent"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"hooks"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"userInvocable"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"argumentHint"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"disableAutoInvocation"'))).toBe(true);
	});

	it("Copilot does not include unsupported fields in output", () => {
		const config = emptyConfig();
		config.skills.push({
			name: "safe",
			description: "Safe skill",
			content: "# Safe",
			disableAutoInvocation: true,
			allowedTools: ["Read"],
			model: "opus",
		});

		const result = skillsEmitter.emit(config, "copilot");
		const content = result.files[0].content;
		expect(content).toContain("name: safe");
		expect(content).toContain("description: Safe skill");
		expect(content).not.toContain("allowed-tools");
		expect(content).not.toContain("model:");
		expect(content).not.toContain("disable-model-invocation");
	});
});
