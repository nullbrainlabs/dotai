import type { Permission } from "../../domain/permission.js";
import type { Setting } from "../../domain/settings.js";
import type { EmitResult } from "../types.js";

/** Copilot: no file-based permission or settings support */
export function emitCopilot(permissions: Permission[], settings: Setting[]): EmitResult {
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
