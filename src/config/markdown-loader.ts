import { readFile } from "node:fs/promises";

/** Parsed result of a markdown file with YAML frontmatter. */
export interface ParsedMarkdown {
	/** Frontmatter key-value pairs. */
	frontmatter: Record<string, unknown>;
	/** Markdown body after frontmatter. */
	body: string;
}

/**
 * Parse a markdown string with optional YAML frontmatter.
 *
 * Frontmatter is delimited by `---` at the start of the file.
 * Uses a simple parser to avoid pulling in a full YAML library for frontmatter
 * (the main config.yaml uses the `yaml` package).
 */
export function parseMarkdownWithFrontmatter(raw: string): ParsedMarkdown {
	const trimmed = raw.trimStart();
	if (!trimmed.startsWith("---")) {
		return { frontmatter: {}, body: raw.trim() };
	}

	const endIndex = trimmed.indexOf("---", 3);
	if (endIndex === -1) {
		return { frontmatter: {}, body: raw.trim() };
	}

	const frontmatterBlock = trimmed.slice(3, endIndex).trim();
	const body = trimmed.slice(endIndex + 3).trim();

	const frontmatter: Record<string, unknown> = {};
	for (const line of frontmatterBlock.split("\n")) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;

		const key = line.slice(0, colonIdx).trim();
		const rawValue = line.slice(colonIdx + 1).trim();
		frontmatter[key] = parseFrontmatterValue(rawValue);
	}

	return { frontmatter, body };
}

/** Parse a simple frontmatter value (booleans, numbers, arrays, strings). */
function parseFrontmatterValue(raw: string): unknown {
	if (raw === "true") return true;
	if (raw === "false") return false;
	if (raw === "") return "";
	if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);

	// Simple inline array: [a, b, c]
	if (raw.startsWith("[") && raw.endsWith("]")) {
		const inner = raw.slice(1, -1).trim();
		if (!inner) return [];
		return inner.split(",").map((s) => {
			const v = s.trim();
			// Strip quotes
			if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
				return v.slice(1, -1);
			}
			return v;
		});
	}

	// Strip quotes from string values
	if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
		return raw.slice(1, -1);
	}

	return raw;
}

/** Load and parse a markdown file with frontmatter from disk. */
export async function loadMarkdownFile(filePath: string): Promise<ParsedMarkdown> {
	const content = await readFile(filePath, "utf-8");
	return parseMarkdownWithFrontmatter(content);
}
