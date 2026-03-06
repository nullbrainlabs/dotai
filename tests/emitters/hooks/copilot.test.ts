import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { hooksEmitter } from "../../../src/emitters/hooks/index.js";

describe("hooksEmitter — copilot", () => {
	it("emits .github/hooks/hooks.json with version 1 format", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preToolUse",
			handler: "echo pre-tool",
			scope: "project",
		});

		const result = hooksEmitter.emit(config, "copilot");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".github/hooks/hooks.json");

		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.version).toBe(1);
		expect(parsed.hooks.preToolUse).toHaveLength(1);
		expect(parsed.hooks.preToolUse[0].type).toBe("command");
		expect(parsed.hooks.preToolUse[0].bash).toBe("echo pre-tool");
	});

	it("uses bash key instead of command", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "sessionStart",
			handler: "setup.sh",
			scope: "project",
		});
		const result = hooksEmitter.emit(config, "copilot");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.hooks.sessionStart[0].bash).toBe("setup.sh");
		expect(parsed.hooks.sessionStart[0].command).toBeUndefined();
	});

	it("converts timeout ms to timeoutSec", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preToolUse",
			handler: "lint-check",
			timeout: 5000,
			scope: "project",
		});
		const result = hooksEmitter.emit(config, "copilot");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.hooks.preToolUse[0].timeoutSec).toBe(5);
		expect(parsed.hooks.preToolUse[0].timeout).toBeUndefined();
	});

	it("maps statusMessage to comment", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preToolUse",
			handler: "lint-check",
			statusMessage: "Running lint...",
			scope: "project",
		});
		const result = hooksEmitter.emit(config, "copilot");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.hooks.preToolUse[0].comment).toBe("Running lint...");
		expect(parsed.hooks.preToolUse[0].statusMessage).toBeUndefined();
	});

	it("warns and skips non-command hook types", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preToolUse",
			handler: "Check safety",
			type: "prompt",
			scope: "project",
		});
		const result = hooksEmitter.emit(config, "copilot");
		expect(result.files).toHaveLength(0);
		expect(result.warnings.some((w) => w.includes('"prompt"') && w.includes("not supported"))).toBe(
			true,
		);
	});

	it("warns and skips unsupported hook events", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preFileEdit",
			handler: "eslint --fix",
			scope: "project",
		});
		config.ignorePatterns.push({ pattern: "node_modules/**", scope: "project" });

		const result = hooksEmitter.emit(config, "copilot");
		expect(result.warnings.some((w) => w.includes("preFileEdit"))).toBe(true);
		// preFileEdit hook should be skipped, no hooks file emitted
		expect(result.files.filter((f) => f.path.includes("hooks")).length).toBe(0);
	});

	it("only supports the 8 Copilot events", () => {
		const supportedEvents = [
			"sessionStart",
			"sessionEnd",
			"userPromptSubmitted",
			"preToolUse",
			"postToolUse",
			"errorOccurred",
			"agentStop",
			"subagentStop",
		] as const;

		for (const event of supportedEvents) {
			const config = emptyConfig();
			config.hooks.push({ event, handler: "echo test", scope: "project" });
			const result = hooksEmitter.emit(config, "copilot");
			expect(result.files).toHaveLength(1);
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks[event]).toHaveLength(1);
		}

		// Events NOT supported by Copilot
		const unsupportedEvents = [
			"permissionRequest",
			"postToolUseFailure",
			"notification",
			"subagentStart",
			"teammateIdle",
			"taskCompleted",
			"configChange",
			"worktreeCreate",
			"worktreeRemove",
			"preCompact",
		] as const;

		for (const event of unsupportedEvents) {
			const config = emptyConfig();
			config.hooks.push({ event, handler: "echo test", scope: "project" });
			const result = hooksEmitter.emit(config, "copilot");
			expect(result.files).toHaveLength(0);
			expect(result.warnings.some((w) => w.includes(event))).toBe(true);
		}
	});

	it("emits cwd when present", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "sessionStart",
			handler: "setup.sh",
			cwd: "/workspace",
			scope: "project",
		});
		const result = hooksEmitter.emit(config, "copilot");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.hooks.sessionStart[0].cwd).toBe("/workspace");
	});

	it("emits env when present", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "sessionStart",
			handler: "setup.sh",
			env: { NODE_ENV: "test", DEBUG: "true" },
			scope: "project",
		});
		const result = hooksEmitter.emit(config, "copilot");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.hooks.sessionStart[0].env).toEqual({
			NODE_ENV: "test",
			DEBUG: "true",
		});
	});

	it("warns about ignore patterns", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preFileEdit",
			handler: "eslint --fix",
			scope: "project",
		});
		config.ignorePatterns.push(
			{ pattern: "node_modules/**", scope: "project" },
			{ pattern: "dist/**", scope: "project" },
		);

		const result = hooksEmitter.emit(config, "copilot");
		expect(result.warnings.some((w) => w.includes("ignore patterns"))).toBe(true);
	});
});
