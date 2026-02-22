import type { ProjectConfig } from "../config/schema.js";
import type { Permission } from "../domain/permission.js";
import type { Setting } from "../domain/settings.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "./types.js";

/** Emits permissions and settings configuration files. */
export const permissionsEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaude(config.permissions, config.settings);
			case "cursor":
				return emitCursor(config.permissions, config.settings);
			case "codex":
				return emitCodex(config.permissions, config.settings);
			case "opencode":
				return emitOpenCode(config.permissions, config.settings);
			case "copilot":
				return emitCopilot(config.permissions, config.settings);
			case "antigravity":
				return emitAntigravity(config.permissions, config.settings);
		}
	},
};

/** Claude Code: .claude/settings.json with permissions.allow/deny */
function emitClaude(permissions: Permission[], settings: Setting[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (permissions.length === 0 && settings.length === 0) return { files, warnings };

	const settingsObj: Record<string, unknown> = {};

	// Permissions
	if (permissions.length > 0) {
		const allow: string[] = [];
		const deny: string[] = [];

		for (const perm of permissions) {
			const rule = perm.pattern ? `${perm.tool}(${perm.pattern})` : perm.tool;
			if (perm.decision === "allow") allow.push(rule);
			else if (perm.decision === "deny") deny.push(rule);
		}

		const permsObj: Record<string, string[]> = {};
		if (allow.length > 0) permsObj.allow = allow;
		if (deny.length > 0) permsObj.deny = deny;
		settingsObj.permissions = permsObj;

		if (permissions.some((p) => p.decision === "ask")) {
			warnings.push(
				'Claude Code does not support "ask" permission decision — these rules are omitted.',
			);
		}
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

/** Cursor: .cursor/cli.json with allow/deny per tool type */
function emitCursor(permissions: Permission[], settings: Setting[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (permissions.length === 0 && settings.length === 0) return { files, warnings };

	const cliConfig: Record<string, unknown> = {};

	if (permissions.length > 0) {
		const allow: string[] = [];
		const deny: string[] = [];

		for (const perm of permissions) {
			const rule = perm.pattern ? `${perm.tool}(${perm.pattern})` : perm.tool;
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

/** Codex: approval_policy + sandbox_mode in .codex/config.toml (lossy) */
function emitCodex(permissions: Permission[], settings: Setting[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (permissions.length === 0 && settings.length === 0) return { files, warnings };

	const lines: string[] = [];

	// Map permissions to Codex approval_policy
	if (permissions.length > 0) {
		const hasAllow = permissions.some((p) => p.decision === "allow");
		const hasDeny = permissions.some((p) => p.decision === "deny");

		if (hasAllow && !hasDeny) {
			lines.push(`approval_policy = "unless-allowed"`);
		} else if (hasDeny) {
			lines.push(`approval_policy = "unless-allowed"`);
		} else {
			lines.push(`approval_policy = "on-failure"`);
		}

		warnings.push(
			"Codex permissions are lossy — per-tool/pattern permissions are mapped to a single approval_policy.",
		);
	}

	// Settings
	for (const setting of settings) {
		const value = typeof setting.value === "string" ? `"${setting.value}"` : String(setting.value);
		lines.push(`${setting.key} = ${value}`);
	}

	files.push({
		path: ".codex/config.toml",
		content: `${lines.join("\n")}\n`,
	});

	return { files, warnings };
}

/** OpenCode: opencode.json with permission key. All 3 decisions supported. */
function emitOpenCode(permissions: Permission[], settings: Setting[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (permissions.length === 0 && settings.length === 0) return { files, warnings };

	const config: Record<string, unknown> = {};

	if (permissions.length > 0) {
		const permission: Record<string, unknown> = {};

		for (const perm of permissions) {
			if (perm.pattern) {
				// Tool with pattern → nested object: { "bash": { "<pattern>": "<decision>" } }
				const toolKey = perm.tool.toLowerCase();
				if (!permission[toolKey] || typeof permission[toolKey] !== "object") {
					permission[toolKey] = {};
				}
				(permission[toolKey] as Record<string, string>)[perm.pattern] = perm.decision;
			} else {
				// Tool without pattern → flat: { "<tool>": "<decision>" }
				permission[perm.tool.toLowerCase()] = perm.decision;
			}
		}

		config.permission = permission;
	}

	for (const setting of settings) {
		config[setting.key] = setting.value;
	}

	files.push({
		path: "opencode.json",
		content: `${JSON.stringify(config, null, 2)}\n`,
	});

	return { files, warnings };
}

/** Copilot: no file-based permission or settings support */
function emitCopilot(permissions: Permission[], settings: Setting[]): EmitResult {
	const warnings: string[] = [];

	if (permissions.length > 0) {
		warnings.push(
			"Copilot does not support file-based permission configuration — permissions are skipped.",
		);
	}

	if (settings.length > 0) {
		warnings.push(
			"Copilot does not support file-based settings configuration — settings are skipped.",
		);
	}

	return { files: [], warnings };
}

/** Antigravity: no file-based permission or settings support */
function emitAntigravity(permissions: Permission[], settings: Setting[]): EmitResult {
	const warnings: string[] = [];

	if (permissions.length > 0) {
		warnings.push(
			"Antigravity does not support file-based permission configuration — permissions are skipped.",
		);
	}

	if (settings.length > 0) {
		warnings.push(
			"Antigravity does not support file-based settings configuration — settings are skipped.",
		);
	}

	return { files: [], warnings };
}
