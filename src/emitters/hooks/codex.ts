import type { Hook } from "../../domain/hook.js";
import type { IgnorePattern } from "../../domain/ignore-pattern.js";
import type { EmitResult, EmittedFile } from "../types.js";

/** Codex: ignore → protected paths in config.toml, hooks not supported */
export function emitCodex(hooks: Hook[], ignorePatterns: IgnorePattern[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (ignorePatterns.length > 0) {
		const paths = ignorePatterns.map((p) => `"${p.pattern}"`).join(", ");
		files.push({
			path: ".codex/config.toml",
			content: `protected_paths = [${paths}]\n`,
		});
	}

	if (hooks.length > 0) {
		warnings.push("Codex does not support hooks — hook configuration is skipped.");
	}

	return { files, warnings };
}
