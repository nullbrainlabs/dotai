import type { TargetTool } from "../types.js";

/** Map of target tool to skills output directory. */
export const SKILLS_DIRS: Record<TargetTool, string> = {
	claude: ".claude/skills",
	cursor: ".cursor/skills",
	codex: ".codex/skills",
	copilot: ".github/skills",
};

/** Fields not supported by Copilot skills. */
export const COPILOT_UNSUPPORTED_SKILL_FIELDS = [
	"allowedTools",
	"model",
	"context",
	"agent",
	"hooks",
	"userInvocable",
	"argumentHint",
	"disableAutoInvocation",
] as const;
