import type { Skill } from "../../domain/skill.js";

/** Build Copilot SKILL.md with only supported fields: name, description, license. */
export function buildCopilotSkillContent(skill: Skill): string {
	const frontmatterLines: string[] = [];

	frontmatterLines.push(`name: ${skill.name}`);
	if (skill.description) frontmatterLines.push(`description: ${skill.description}`);
	if (skill.license) frontmatterLines.push(`license: ${skill.license}`);

	return `---\n${frontmatterLines.join("\n")}\n---\n\n${skill.content}\n`;
}
