import type { ProjectConfig } from "../config/schema.js";

/** Minimal starter — conventions rule + common ignore patterns. */
export function minimalTemplate(): ProjectConfig {
	return {
		rules: [
			{
				content:
					"# Project Conventions\n\n- Follow existing code style and patterns\n- Write clear, descriptive commit messages\n- Keep functions focused and small\n- Add comments only where the logic isn't self-evident",
				scope: "project",
				alwaysApply: true,
				description: "conventions",
			},
		],
		skills: [],
		agents: [],
		toolServers: [],
		hooks: [],
		permissions: [],
		settings: [],
		ignorePatterns: [
			{ pattern: "node_modules/**", scope: "project" },
			{ pattern: "dist/**", scope: "project" },
			{ pattern: ".env", scope: "project" },
			{ pattern: ".env.*", scope: "project" },
		],
	};
}
