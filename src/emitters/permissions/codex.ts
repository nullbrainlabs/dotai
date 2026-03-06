import type { Permission } from "../../domain/permission.js";
import type { Setting } from "../../domain/settings.js";
import type { EmitResult, EmittedFile } from "../types.js";

/** Codex: approval_policy + sandbox_mode in .codex/config.toml (lossy) */
export function emitCodex(permissions: Permission[], settings: Setting[]): EmitResult {
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
