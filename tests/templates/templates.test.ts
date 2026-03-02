import { describe, expect, it } from "vitest";
import { validateConfig } from "../../src/config/schema.js";
import { defaultConfig, helperSkills } from "../../src/templates/index.js";

describe("defaultConfig", () => {
	it("produces a valid config", () => {
		const config = defaultConfig();
		const result = validateConfig(config);
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("has at least one rule and one ignorePattern", () => {
		const config = defaultConfig();
		expect(config.rules.length).toBeGreaterThanOrEqual(1);
		expect(config.ignorePatterns.length).toBeGreaterThanOrEqual(1);
	});

	it("returns a fresh copy each call", () => {
		const a = defaultConfig();
		const b = defaultConfig();
		expect(a).toEqual(b);
		expect(a).not.toBe(b);
	});
});

describe("helperSkills", () => {
	it("returns 4 skills with valid names and non-empty content", () => {
		const skills = helperSkills();
		expect(skills).toHaveLength(4);

		const names = skills.map((s) => s.name);
		expect(names).toEqual(["add-skill", "add-rule", "add-agent", "add-mcp"]);

		for (const skill of skills) {
			expect(skill.content.length).toBeGreaterThan(0);
			expect(skill.description.length).toBeGreaterThan(0);
		}
	});

	it("all disable auto invocation", () => {
		const skills = helperSkills();
		for (const skill of skills) {
			expect(skill.disableAutoInvocation).toBe(true);
		}
	});

	it("returns fresh copies each call", () => {
		const a = helperSkills();
		const b = helperSkills();
		expect(a).toEqual(b);
		expect(a).not.toBe(b);
		expect(a[0]).not.toBe(b[0]);
	});

	it("merged with defaultConfig passes validation", () => {
		const config = defaultConfig();
		config.skills.push(...helperSkills());
		const result = validateConfig(config);
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});
});
