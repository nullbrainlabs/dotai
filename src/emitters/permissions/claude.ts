import type { Permission } from "../../domain/permission.js";
import type { Setting } from "../../domain/settings.js";
import type { EmitResult, EmittedFile } from "../types.js";

/** Claude Code: .claude/settings.json with permissions.allow/deny */
export function emitClaude(permissions: Permission[], settings: Setting[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (permissions.length === 0 && settings.length === 0) return { files, warnings };

	const settingsObj: Record<string, unknown> = {
		$schema: "https://json.schemastore.org/claude-code-settings.json",
	};

	// Permissions
	if (permissions.length > 0) {
		const allow: string[] = [];
		const deny: string[] = [];
		const ask: string[] = [];

		for (const perm of permissions) {
			const rule = perm.pattern ? `${perm.tool}(${perm.pattern})` : perm.tool;
			if (perm.decision === "allow") allow.push(rule);
			else if (perm.decision === "deny") deny.push(rule);
			else if (perm.decision === "ask") ask.push(rule);
		}

		const permsObj: Record<string, string[]> = {};
		if (allow.length > 0) permsObj.allow = allow;
		if (deny.length > 0) permsObj.deny = deny;
		if (ask.length > 0) permsObj.ask = ask;
		settingsObj.permissions = permsObj;
	}

	// Settings
	for (const setting of settings) {
		settingsObj[setting.key] = setting.value;
	}

	files.push({
		path: ".claude/settings.json",
		content: `${JSON.stringify(settingsObj, null, 2)}\n`,
	});

	return { files, warnings };
}
