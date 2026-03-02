import { describe, expect, it } from "vitest";
import { validateConfig } from "../../src/config/schema.js";
import { defaultConfig } from "../../src/templates/index.js";

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
