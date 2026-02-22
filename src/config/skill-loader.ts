import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Skill } from "../domain/skill.js";

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
		const content = await readFile(skillFile, "utf-8").catch(() => null);
		if (content === null) continue;

		skills.push({
			name: entry,
			description: extractDescription(content),
			content,
			disableAutoInvocation: false,
		});
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
