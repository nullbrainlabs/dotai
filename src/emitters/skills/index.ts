import type { ProjectConfig } from "../../config/schema.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "../types.js";
import { buildCopilotSkillContent } from "./copilot.js";
import { COPILOT_UNSUPPORTED_SKILL_FIELDS, SKILLS_DIRS } from "./shared.js";
import { buildSkillContent } from "./standard.js";

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

		// Codex requires skills to be registered in config.toml via [[skills.config]]
		if (target === "codex" && config.skills.length > 0) {
			const entries = config.skills
				.map((skill) => `[[skills.config]]\npath = "${baseDir}/${skill.name}/SKILL.md"\nenabled = true`)
				.join("\n\n");
			files.push({
				path: ".codex/config.toml",
				content: `${entries}\n`,
			});
		}

		return { files, warnings };
	},
};
