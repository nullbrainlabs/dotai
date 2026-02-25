import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Skill } from "../domain/skill.js";
import { parseMarkdownWithFrontmatter } from "./markdown-loader.js";

/**
 * Scan `.ai/skills/` for skill directories.
 * Each skill is a directory containing a SKILL.md file.
 */
export async function loadSkills(skillsDir: string): Promise<Skill[]> {
	const entries = await readdir(skillsDir).catch(() => []);
	const skills: Skill[] = [];

	for (const entry of entries) {
		const skillDir = join(skillsDir, entry);
		const skillStat = await stat(skillDir).catch(() => null);
		if (!skillStat?.isDirectory()) continue;

		const skillFile = join(skillDir, "SKILL.md");
		const raw = await readFile(skillFile, "utf-8").catch(() => null);
		if (raw === null) continue;

		const { frontmatter, body } = parseMarkdownWithFrontmatter(raw);

		// When frontmatter exists, extract fields; otherwise backward-compat
		const hasFrontmatter = Object.keys(frontmatter).length > 0;

		const skill: Skill = {
			name: entry,
			description: hasFrontmatter
				? typeof frontmatter.description === "string"
					? frontmatter.description
					: ""
				: extractDescription(raw),
			content: hasFrontmatter ? body : raw,
			disableAutoInvocation:
				frontmatter["disable-model-invocation"] === true ||
				frontmatter.disableModelInvocation === true,
			argumentHint:
				typeof frontmatter["argument-hint"] === "string"
					? frontmatter["argument-hint"]
					: typeof frontmatter.argumentHint === "string"
						? frontmatter.argumentHint
						: undefined,
			userInvocable:
				frontmatter["user-invocable"] === false || frontmatter.userInvocable === false
					? false
					: undefined,
			allowedTools: Array.isArray(frontmatter["allowed-tools"])
				? frontmatter["allowed-tools"].map(String)
				: Array.isArray(frontmatter.allowedTools)
					? frontmatter.allowedTools.map(String)
					: undefined,
			model: typeof frontmatter.model === "string" ? frontmatter.model : undefined,
			context: frontmatter.context === "fork" ? "fork" : undefined,
			agent: typeof frontmatter.agent === "string" ? frontmatter.agent : undefined,
			hooks:
				typeof frontmatter.hooks === "object" && frontmatter.hooks !== null
					? (frontmatter.hooks as Record<string, unknown>)
					: undefined,
		};

		skills.push(skill);
	}

	return skills;
}

/** Extract a description from the first paragraph or heading of SKILL.md. */
function extractDescription(content: string): string {
	const lines = content.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		// Skip empty lines and headings
		if (!trimmed || trimmed.startsWith("#")) continue;
		// Return first non-empty, non-heading line as description
		return trimmed.length > 100 ? `${trimmed.slice(0, 97)}...` : trimmed;
	}
	return "";
}
