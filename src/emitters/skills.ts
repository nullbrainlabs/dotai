import type { ProjectConfig } from "../config/schema.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "./types.js";

/** Map of target tool to skills output directory. */
const SKILLS_DIRS: Record<TargetTool, string> = {
	claude: ".claude/skills",
	cursor: ".cursor/skills",
	codex: ".codex/skills",
	copilot: ".github/skills",
};

/** Emits skill files for all target tools. Near-identical format across all 3. */
export const skillsEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		const files: EmittedFile[] = [];
		const warnings: string[] = [];
		const baseDir = SKILLS_DIRS[target];

		for (const skill of config.skills) {
			files.push({
				path: `${baseDir}/${skill.name}/SKILL.md`,
				content: skill.content,
			});
		}

		return { files, warnings };
	},
};
