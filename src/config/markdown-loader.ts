import { readFile } from "node:fs/promises";
import { parse as parseYaml } from "yaml";

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
 * Uses the `yaml` library for full YAML support including nested structures.
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

	const frontmatterBlock = trimmed.slice(3, endIndex);
	const body = trimmed.slice(endIndex + 3).trim();

	const parsed = parseYaml(frontmatterBlock);
	const frontmatter: Record<string, unknown> =
		typeof parsed === "object" && parsed !== null ? parsed : {};

	return { frontmatter, body };
}

/** Load and parse a markdown file with frontmatter from disk. */
export async function loadMarkdownFile(filePath: string): Promise<ParsedMarkdown> {
	const content = await readFile(filePath, "utf-8");
	return parseMarkdownWithFrontmatter(content);
}
