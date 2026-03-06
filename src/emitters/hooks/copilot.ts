import type { Hook } from "../../domain/hook.js";
import type { IgnorePattern } from "../../domain/ignore-pattern.js";
import type { EmitResult, EmittedFile } from "../types.js";

/** Events supported by Copilot hooks. */
const COPILOT_HOOK_EVENTS = new Set([
	"sessionStart",
	"sessionEnd",
	"userPromptSubmitted",
	"preToolUse",
	"postToolUse",
	"errorOccurred",
	"agentStop",
	"subagentStop",
]);

/** Copilot: .github/hooks/hooks.json — version 1 format */
export function emitCopilot(hooks: Hook[], ignorePatterns: IgnorePattern[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (hooks.length > 0) {
		const hooksObj: Record<string, unknown[]> = {};
		for (const hook of hooks) {
			if (!COPILOT_HOOK_EVENTS.has(hook.event)) {
				warnings.push(`Hook event "${hook.event}" is not supported by Copilot — skipped.`);
				continue;
			}
			const hookType = hook.type ?? "command";
			if (hookType !== "command") {
				warnings.push(
					`Hook type "${hookType}" is not supported by Copilot — only "command" hooks are supported. Skipped.`,
				);
				continue;
			}

			if (!hooksObj[hook.event]) hooksObj[hook.event] = [];
			const entry: Record<string, unknown> = {
				type: "command",
				bash: hook.handler,
			};
			if (hook.timeout !== undefined) entry.timeoutSec = Math.round(hook.timeout / 1000);
			if (hook.statusMessage) entry.comment = hook.statusMessage;
			if (hook.cwd) entry.cwd = hook.cwd;
			if (hook.env && Object.keys(hook.env).length > 0) entry.env = hook.env;
			hooksObj[hook.event].push(entry);
		}

		if (Object.keys(hooksObj).length > 0) {
			files.push({
				path: ".github/hooks/hooks.json",
				content: `${JSON.stringify({ version: 1, hooks: hooksObj }, null, 2)}\n`,
			});
		}
	}

	if (ignorePatterns.length > 0) {
		warnings.push(
			"Copilot does not support file-based ignore patterns — ignore configuration is skipped.",
		);
	}

	return { files, warnings };
}
