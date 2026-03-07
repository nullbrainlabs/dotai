import type { Permission } from "../../domain/permission.js";
import type { Setting } from "../../domain/settings.js";
import type { EmitResult, EmittedFile } from "../types.js";

/** Cursor: .cursor/cli.json with allow/deny per tool type */
export function emitCursor(permissions: Permission[], settings: Setting[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (permissions.length === 0 && settings.length === 0) return { files, warnings };

	const cliConfig: Record<string, unknown> = { version: 1 };

	if (permissions.length > 0) {
		const allow: string[] = [];
		const deny: string[] = [];

		for (const perm of permissions) {
			// Cursor uses Shell() instead of Bash() for shell command permissions
			const toolName = perm.tool === "Bash" ? "Shell" : perm.tool;
			const rule = perm.pattern ? `${toolName}(${perm.pattern})` : toolName;
			if (perm.decision === "allow") allow.push(rule);
			else if (perm.decision === "deny") deny.push(rule);
		}

		const permsObj: Record<string, string[]> = {};
		if (allow.length > 0) permsObj.allow = allow;
		if (deny.length > 0) permsObj.deny = deny;
		cliConfig.permissions = permsObj;
	}

	for (const setting of settings) {
		cliConfig[setting.key] = setting.value;
	}

	files.push({
		path: ".cursor/cli.json",
		content: `${JSON.stringify(cliConfig, null, 2)}\n`,
	});

	return { files, warnings };
}
