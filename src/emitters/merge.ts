import type { EmittedFile } from "./types.js";

/**
 * Merge files targeting the same path.
 * For JSON files, deep-merge the objects.
 * For TOML files, concatenate sections.
 * For Markdown files, concatenate with `---` separator.
 * For other files, last writer wins.
 */
export function mergeFiles(files: EmittedFile[]): EmittedFile[] {
	const byPath = new Map<string, EmittedFile[]>();
	for (const file of files) {
		const existing = byPath.get(file.path) ?? [];
		existing.push(file);
		byPath.set(file.path, existing);
	}

	const merged: EmittedFile[] = [];
	for (const [path, group] of byPath) {
		if (group.length === 1) {
			merged.push(group[0]);
			continue;
		}

		if (path.endsWith(".json")) {
			// Deep merge JSON objects
			let result = {};
			for (const file of group) {
				const parsed = JSON.parse(file.content);
				result = deepMerge(result, parsed);
			}
			merged.push({ path, content: `${JSON.stringify(result, null, 2)}\n` });
		} else if (path.endsWith(".toml")) {
			// Concatenate TOML sections
			const combined = group.map((f) => f.content.trim()).join("\n\n");
			merged.push({ path, content: `${combined}\n` });
		} else if (path.endsWith(".md")) {
			// Concatenate markdown with separator
			const combined = group.map((f) => f.content.trim()).join("\n\n---\n\n");
			merged.push({ path, content: `${combined}\n` });
		} else {
			// Last writer wins
			merged.push(group[group.length - 1]);
		}
	}

	return merged;
}

/** Deep-merge two plain objects, concatenating arrays and recursing into nested objects. */
export function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...target };
	for (const [key, value] of Object.entries(source)) {
		if (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value) &&
			typeof result[key] === "object" &&
			result[key] !== null &&
			!Array.isArray(result[key])
		) {
			result[key] = deepMerge(
				result[key] as Record<string, unknown>,
				value as Record<string, unknown>,
			);
		} else if (Array.isArray(value) && Array.isArray(result[key])) {
			result[key] = [...(result[key] as unknown[]), ...value];
		} else {
			result[key] = value;
		}
	}
	return result;
}
