import { stringify as stringifyYaml } from "yaml";
import type { Skill } from "../../domain/skill.js";

/** Build SKILL.md content with optional YAML frontmatter. */
export function buildSkillContent(skill: Skill): string {
	const frontmatterLines: string[] = [];

	frontmatterLines.push(`name: ${skill.name}`);
	if (skill.description) frontmatterLines.push(`description: ${skill.description}`);
	if (skill.disableAutoInvocation) frontmatterLines.push("disable-model-invocation: true");
	if (skill.argumentHint) frontmatterLines.push(`argument-hint: ${skill.argumentHint}`);
	if (skill.userInvocable === false) frontmatterLines.push("user-invocable: false");
	if (skill.allowedTools?.length) {
		frontmatterLines.push(`allowed-tools: ${skill.allowedTools.join(", ")}`);
	}
	if (skill.model) frontmatterLines.push(`model: ${skill.model}`);
	if (skill.context) frontmatterLines.push(`context: ${skill.context}`);
	if (skill.agent) frontmatterLines.push(`agent: ${skill.agent}`);
	if (skill.hooks && Object.keys(skill.hooks).length > 0) {
		const yamlBlock = stringifyYaml({ hooks: skill.hooks }, { indent: 2 }).trimEnd();
		frontmatterLines.push(yamlBlock);
	}

	return `---\n${frontmatterLines.join("\n")}\n---\n\n${skill.content}\n`;
}
