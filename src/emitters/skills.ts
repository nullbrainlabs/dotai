import { stringify as stringifyYaml } from "yaml";
import type { ProjectConfig } from "../config/schema.js";
import type { Skill } from "../domain/skill.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "./types.js";

/** Map of target tool to skills output directory. */
const SKILLS_DIRS: Record<TargetTool, string> = {
	claude: ".claude/skills",
	cursor: ".cursor/skills",
	codex: ".codex/skills",
	copilot: ".github/skills",
};

/** Fields not supported by Copilot skills. */
const COPILOT_UNSUPPORTED_SKILL_FIELDS = [
	"allowedTools",
	"model",
	"context",
	"agent",
	"hooks",
	"userInvocable",
	"argumentHint",
	"disableAutoInvocation",
] as const;

/** Emits skill files for all target tools. All share SKILL.md format with frontmatter. */
export const skillsEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		const files: EmittedFile[] = [];
		const warnings: string[] = [];
		const baseDir = SKILLS_DIRS[target];

		for (const skill of config.skills) {
			if (target === "copilot") {
				files.push({
					path: `${baseDir}/${skill.name}/SKILL.md`,
					content: buildCopilotSkillContent(skill),
				});
				// Warn about unsupported fields
				for (const field of COPILOT_UNSUPPORTED_SKILL_FIELDS) {
					const value = skill[field];
					if (value !== undefined && value !== null) {
						const hasContent = Array.isArray(value)
							? value.length > 0
							: typeof value === "object"
								? Object.keys(value).length > 0
								: true;
						if (hasContent) {
							warnings.push(
								`Copilot does not support "${field}" on skill "${skill.name}" — ignored.`,
							);
						}
					}
				}
			} else {
				files.push({
					path: `${baseDir}/${skill.name}/SKILL.md`,
					content: buildSkillContent(skill),
				});
			}
		}

		return { files, warnings };
	},
};

/** Build Copilot SKILL.md with only supported fields: name, description, license. */
function buildCopilotSkillContent(skill: Skill): string {
	const frontmatterLines: string[] = [];

	frontmatterLines.push(`name: ${skill.name}`);
	if (skill.description) frontmatterLines.push(`description: ${skill.description}`);
	if (skill.license) frontmatterLines.push(`license: ${skill.license}`);

	return `---\n${frontmatterLines.join("\n")}\n---\n\n${skill.content}\n`;
}

/** Build SKILL.md content with optional YAML frontmatter. */
function buildSkillContent(skill: Skill): string {
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
