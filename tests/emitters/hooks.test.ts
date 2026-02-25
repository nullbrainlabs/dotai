import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { hooksEmitter } from "../../src/emitters/hooks.js";

describe("hooksEmitter", () => {
	const makeConfig = () => {
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
		return config;
	};

	describe("Claude", () => {
		it("maps event names to PascalCase with nested hook format", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "postToolUse",
				handler: "echo done",
				matcher: "Edit",
				scope: "project",
			});
			config.ignorePatterns.push({ pattern: "node_modules/**", scope: "project" });

			const result = hooksEmitter.emit(config, "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".claude/settings.json");

			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.PostToolUse).toHaveLength(1);
			expect(parsed.hooks.PostToolUse[0].hooks).toEqual([
				{ type: "command", command: "echo done" },
			]);
			expect(parsed.hooks.PostToolUse[0].matcher).toBe("Edit");
			expect(parsed.permissions.deny).toContain("Read(node_modules/**)");
		});

		it("includes $schema in settings.json", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "sessionStart",
				handler: "echo hello",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.$schema).toBe("https://json.schemastore.org/claude-code-settings.json");
		});

		it("omits matcher when not specified", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "sessionStart",
				handler: "echo hi",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.SessionStart[0].matcher).toBeUndefined();
			expect(parsed.hooks.SessionStart[0].hooks).toEqual([{ type: "command", command: "echo hi" }]);
		});

		it("maps userPromptSubmitted to UserPromptSubmit", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "userPromptSubmitted",
				handler: "echo prompt",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.UserPromptSubmit).toHaveLength(1);
		});

		it("maps agentStop to Stop", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "agentStop",
				handler: "echo stopped",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.Stop).toHaveLength(1);
		});

		it("maps new events correctly", () => {
			const newEvents = [
				["permissionRequest", "PermissionRequest"],
				["postToolUseFailure", "PostToolUseFailure"],
				["notification", "Notification"],
				["subagentStart", "SubagentStart"],
				["teammateIdle", "TeammateIdle"],
				["taskCompleted", "TaskCompleted"],
				["configChange", "ConfigChange"],
				["worktreeCreate", "WorktreeCreate"],
				["worktreeRemove", "WorktreeRemove"],
				["preCompact", "PreCompact"],
			] as const;

			for (const [event, claudeEvent] of newEvents) {
				const config = emptyConfig();
				config.hooks.push({ event, handler: "echo test", scope: "project" });
				const result = hooksEmitter.emit(config, "claude");
				const parsed = JSON.parse(result.files[0].content);
				expect(parsed.hooks[claudeEvent]).toHaveLength(1);
			}
		});

		it("emits prompt type hooks correctly", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "preToolUse",
				handler: "Check if this tool use is appropriate",
				type: "prompt",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.PreToolUse[0].hooks[0]).toEqual({
				type: "prompt",
				prompt: "Check if this tool use is appropriate",
			});
		});

		it("emits agent type hooks correctly", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "postToolUse",
				handler: "Verify the output is correct",
				type: "agent",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.PostToolUse[0].hooks[0]).toEqual({
				type: "agent",
				prompt: "Verify the output is correct",
			});
		});

		it("includes timeout, statusMessage, once, and async fields", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "preToolUse",
				handler: "lint-check",
				type: "command",
				timeout: 5000,
				statusMessage: "Running lint...",
				once: true,
				async: true,
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			const handler = parsed.hooks.PreToolUse[0].hooks[0];
			expect(handler.type).toBe("command");
			expect(handler.command).toBe("lint-check");
			expect(handler.timeout).toBe(5000);
			expect(handler.statusMessage).toBe("Running lint...");
			expect(handler.once).toBe(true);
			expect(handler.async).toBe(true);
		});

		it("emits model field on prompt/agent hooks", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "preToolUse",
				handler: "Check safety",
				type: "prompt",
				model: "haiku",
				scope: "project",
			});
			config.hooks.push({
				event: "postToolUse",
				handler: "Verify output",
				type: "agent",
				model: "sonnet",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.PreToolUse[0].hooks[0]).toEqual({
				type: "prompt",
				prompt: "Check safety",
				model: "haiku",
			});
			expect(parsed.hooks.PostToolUse[0].hooks[0]).toEqual({
				type: "agent",
				prompt: "Verify output",
				model: "sonnet",
			});
		});

		it("omits model field on command hooks", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "preToolUse",
				handler: "echo test",
				type: "command",
				model: "haiku",
				scope: "project",
			});
			const result = hooksEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.PreToolUse[0].hooks[0].model).toBeUndefined();
		});

		it("warns and skips unsupported events", () => {
			const result = hooksEmitter.emit(makeConfig(), "claude");
			expect(result.warnings.some((w) => w.includes("preFileEdit"))).toBe(true);
			// Only ignore patterns file, no hooks since preFileEdit is unsupported
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks).toEqual({});
		});
	});

	describe("Cursor", () => {
		it("emits .cursorignore for ignore patterns", () => {
			const result = hooksEmitter.emit(makeConfig(), "cursor");
			const ignoreFile = result.files.find((f) => f.path === ".cursorignore");
			expect(ignoreFile).toBeDefined();
			expect(ignoreFile?.content).toContain("node_modules/**");
			expect(ignoreFile?.content).toContain("dist/**");
		});

		it("warns about limited hook support", () => {
			const result = hooksEmitter.emit(makeConfig(), "cursor");
			expect(result.warnings.length).toBeGreaterThan(0);
		});
	});

	describe("Codex", () => {
		it("emits protected_paths in config.toml", () => {
			const result = hooksEmitter.emit(makeConfig(), "codex");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".codex/config.toml");
			expect(result.files[0].content).toContain("protected_paths");
			expect(result.files[0].content).toContain("node_modules/**");
		});

		it("warns that hooks are not supported", () => {
			const result = hooksEmitter.emit(makeConfig(), "codex");
			expect(result.warnings).toContain(
				"Codex does not support hooks — hook configuration is skipped.",
			);
		});
	});

	describe("Copilot", () => {
		it("emits .github/hooks/dotai.hooks.json for supported events", () => {
			const config = emptyConfig();
			config.hooks.push({
				event: "preToolUse",
				matcher: "execute",
				handler: "echo pre-tool",
				scope: "project",
			});

			const result = hooksEmitter.emit(config, "copilot");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".github/hooks/dotai.hooks.json");

			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.hooks.preToolUse).toHaveLength(1);
			expect(parsed.hooks.preToolUse[0].command).toBe("echo pre-tool");
			expect(parsed.hooks.preToolUse[0].matcher).toBe("execute");
		});

		it("warns and skips unsupported hook events", () => {
			const result = hooksEmitter.emit(makeConfig(), "copilot");
			expect(result.warnings.some((w) => w.includes("preFileEdit"))).toBe(true);
			// preFileEdit hook should be skipped, no hooks file emitted
			expect(result.files.filter((f) => f.path.includes("hooks")).length).toBe(0);
		});

		it("warns about ignore patterns", () => {
			const result = hooksEmitter.emit(makeConfig(), "copilot");
			expect(result.warnings.some((w) => w.includes("ignore patterns"))).toBe(true);
		});
	});

	it("returns empty for no hooks or ignore patterns", () => {
		const config = emptyConfig();
		const result = hooksEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});
});
