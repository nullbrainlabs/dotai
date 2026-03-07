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

	// Permissions — extract permission-block extensions from settings
	const defaultMode = settings.find((s) => s.key === "permissions.defaultMode")?.value as
		| string
		| undefined;
	const additionalDirectories = settings.find((s) => s.key === "permissions.additionalDirectories")
		?.value as string[] | undefined;
	const permissionSettingKeys = new Set(["permissions.defaultMode", "permissions.additionalDirectories"]);

	if (permissions.length > 0 || defaultMode !== undefined || additionalDirectories !== undefined) {
		const allow: string[] = [];
		const deny: string[] = [];
		const ask: string[] = [];

		for (const perm of permissions) {
			const rule = perm.pattern ? `${perm.tool}(${perm.pattern})` : perm.tool;
			if (perm.decision === "allow") allow.push(rule);
			else if (perm.decision === "deny") deny.push(rule);
			else if (perm.decision === "ask") ask.push(rule);
		}

		const permsObj: Record<string, unknown> = {};
		if (allow.length > 0) permsObj.allow = allow;
		if (deny.length > 0) permsObj.deny = deny;
		if (ask.length > 0) permsObj.ask = ask;
		if (defaultMode !== undefined) permsObj.defaultMode = defaultMode;
		if (additionalDirectories !== undefined) permsObj.additionalDirectories = additionalDirectories;
		settingsObj.permissions = permsObj;
	}

	// Settings (excluding permission-block extensions handled above)
	for (const setting of settings) {
		if (!permissionSettingKeys.has(setting.key)) {
			settingsObj[setting.key] = setting.value;
		}
	}

	files.push({
		path: ".claude/settings.json",
		content: `${JSON.stringify(settingsObj, null, 2)}\n`,
	});

	return { files, warnings };
}
