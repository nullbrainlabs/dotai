import { expect, test } from "vitest";
import { emptyConfig, validateConfig } from "../src/index.js";

test("library exports work", () => {
	const config = emptyConfig();
	const result = validateConfig(config);
	expect(result.valid).toBe(true);
});
