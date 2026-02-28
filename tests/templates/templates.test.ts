import { describe, expect, it } from "vitest";
import { validateConfig } from "../../src/config/schema.js";
import type { TemplateName } from "../../src/templates/index.js";
import { getTemplate, TEMPLATES } from "../../src/templates/index.js";

describe("templates", () => {
	it.each(TEMPLATES.map((t) => t.name))("template '%s' produces a valid config", (name) => {
		const config = getTemplate(name);
		const result = validateConfig(config);
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("blank template returns empty arrays", () => {
		const config = getTemplate("blank");
		expect(config.rules).toEqual([]);
		expect(config.skills).toEqual([]);
		expect(config.agents).toEqual([]);
		expect(config.toolServers).toEqual([]);
		expect(config.hooks).toEqual([]);
		expect(config.permissions).toEqual([]);
		expect(config.settings).toEqual([]);
		expect(config.ignorePatterns).toEqual([]);
	});

	it("minimal template has at least one rule and one ignorePattern", () => {
		const config = getTemplate("minimal");
		expect(config.rules.length).toBeGreaterThanOrEqual(1);
		expect(config.ignorePatterns.length).toBeGreaterThanOrEqual(1);
	});

	it("web template has rules, toolServers, permissions, and ignorePatterns", () => {
		const config = getTemplate("web");
		expect(config.rules.length).toBeGreaterThanOrEqual(1);
		expect(config.toolServers.length).toBeGreaterThanOrEqual(1);
		expect(config.permissions.length).toBeGreaterThanOrEqual(1);
		expect(config.ignorePatterns.length).toBeGreaterThanOrEqual(1);
	});

	it("python template has rules, permissions, and ignorePatterns", () => {
		const config = getTemplate("python");
		expect(config.rules.length).toBeGreaterThanOrEqual(1);
		expect(config.permissions.length).toBeGreaterThanOrEqual(1);
		expect(config.ignorePatterns.length).toBeGreaterThanOrEqual(1);
	});

	it("monorepo template has rules, agents, and permissions", () => {
		const config = getTemplate("monorepo");
		expect(config.rules.length).toBeGreaterThanOrEqual(1);
		expect(config.agents.length).toBeGreaterThanOrEqual(1);
		expect(config.permissions.length).toBeGreaterThanOrEqual(1);
	});

	it("throws for unknown template name", () => {
		expect(() => getTemplate("nonexistent" as TemplateName)).toThrow("Unknown template");
	});
});
