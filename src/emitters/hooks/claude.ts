import type { Hook, HookEvent } from "../../domain/hook.js";
import type { IgnorePattern } from "../../domain/ignore-pattern.js";
import type { EmitResult, EmittedFile } from "../types.js";

/** Maps internal hook event names to Claude Code's PascalCase event names. */
const CLAUDE_EVENT_MAP: Partial<Record<HookEvent, string>> = {
	preToolUse: "PreToolUse",
	postToolUse: "PostToolUse",
	sessionStart: "SessionStart",
	sessionEnd: "SessionEnd",
	userPromptSubmitted: "UserPromptSubmit",
	agentStop: "Stop",
	subagentStop: "SubagentStop",
	permissionRequest: "PermissionRequest",
	postToolUseFailure: "PostToolUseFailure",
	notification: "Notification",
	subagentStart: "SubagentStart",
	teammateIdle: "TeammateIdle",
	taskCompleted: "TaskCompleted",
	configChange: "ConfigChange",
	worktreeCreate: "WorktreeCreate",
	worktreeRemove: "WorktreeRemove",
	preCompact: "PreCompact",
	instructionsLoaded: "InstructionsLoaded",
};

/** Build a Claude Code hook handler object based on hook type and fields. */
function buildClaudeHookHandler(hook: Hook): Record<string, unknown> {
	const hookType = hook.type ?? "command";
	const handler: Record<string, unknown> = {};

	if (hookType === "command") {
		handler.type = "command";
		handler.command = hook.handler;
		if (hook.async) handler.async = true;
	} else if (hookType === "prompt") {
		handler.type = "prompt";
		handler.prompt = hook.handler;
	} else if (hookType === "agent") {
		handler.type = "agent";
		handler.prompt = hook.handler;
	} else if (hookType === "http") {
		handler.type = "http";
		handler.url = hook.url ?? hook.handler;
		if (hook.headers && Object.keys(hook.headers).length > 0) handler.headers = hook.headers;
		if (hook.allowedEnvVars?.length) handler.allowedEnvVars = hook.allowedEnvVars;
	}

	if (hook.timeout !== undefined) handler.timeout = Math.round(hook.timeout / 1000);
	if (hook.statusMessage) handler.statusMessage = hook.statusMessage;
	if (hook.once) handler.once = true;
	if (hook.model && (hookType === "prompt" || hookType === "agent")) handler.model = hook.model;

	return handler;
}

/** Claude Code: hooks in settings.json, ignore as deny rules on Read/Edit */
export function emitClaude(hooks: Hook[], ignorePatterns: IgnorePattern[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (hooks.length === 0 && ignorePatterns.length === 0) return { files, warnings };

	const settings: Record<string, unknown> = {
		$schema: "https://json.schemastore.org/claude-code-settings.json",
	};

	// Hooks — Claude Code format:
	// { "Event": [{ "matcher": "ToolName", "hooks": [{ ... }] }] }
	if (hooks.length > 0) {
		const hooksObj: Record<string, unknown[]> = {};
		for (const hook of hooks) {
			const claudeEvent = CLAUDE_EVENT_MAP[hook.event];
			if (!claudeEvent) {
				warnings.push(`Hook event "${hook.event}" is not supported by Claude Code — skipped.`);
				continue;
			}
			if (!hooksObj[claudeEvent]) hooksObj[claudeEvent] = [];
			const entry: Record<string, unknown> = {
				hooks: [buildClaudeHookHandler(hook)],
			};
			if (hook.matcher) entry.matcher = hook.matcher;
			hooksObj[claudeEvent].push(entry);
		}
		settings.hooks = hooksObj;
	}

	// Ignore patterns as deny rules
	if (ignorePatterns.length > 0) {
		const deny = ignorePatterns.flatMap((p) => [`Read(${p.pattern})`, `Edit(${p.pattern})`]);
		settings.permissions = { deny };
	}

	files.push({
		path: ".claude/settings.json",
		content: `${JSON.stringify(settings, null, 2)}\n`,
	});

	return { files, warnings };
}
