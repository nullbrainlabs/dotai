import { describe, expect, it } from "vitest";
import { ALL_TARGETS } from "../../src/emitters/types.js";
import { advancedConfig, kitchenSinkConfig, minimalConfig } from "./configs.js";
import { emitAllForTarget, sanitizePath } from "./helpers.js";

describe.each([...ALL_TARGETS])("contract: %s", (target) => {
	describe("kitchen-sink", () => {
		const files = emitAllForTarget(kitchenSinkConfig(), target);

		it.each(files)("$path", async (file) => {
			await expect(file.content).toMatchFileSnapshot(
				`__snapshots__/${target}/kitchen-sink/${sanitizePath(file.path)}.snap`,
			);
		});
	});

	describe("minimal", () => {
		const files = emitAllForTarget(minimalConfig(), target);

		it.each(files)("$path", async (file) => {
			await expect(file.content).toMatchFileSnapshot(
				`__snapshots__/${target}/minimal/${sanitizePath(file.path)}.snap`,
			);
		});
	});

	describe("advanced", () => {
		const files = emitAllForTarget(advancedConfig(), target);

		it.each(files)("$path", async (file) => {
			await expect(file.content).toMatchFileSnapshot(
				`__snapshots__/${target}/advanced/${sanitizePath(file.path)}.snap`,
			);
		});
	});
});
