import type { ProjectConfig } from "../config/schema.js";

/** Monorepo starter — workspace-aware rule, reviewer agent, scoped ignores. */
export function monorepoTemplate(): ProjectConfig {
	return {
		rules: [
			{
				content:
					"# Monorepo Conventions\n\n- Each package lives in its own directory under `packages/` or `apps/`\n- Changes to shared packages require careful review of downstream consumers\n- Prefer workspace-level dependencies; hoist shared deps to the root\n- Each package must have its own README, tests, and build script\n- Cross-package imports must go through published package names, not relative paths",
				scope: "project",
				alwaysApply: true,
				description: "monorepo-conventions",
			},
			{
				content:
					"# Code Review Guidelines\n\n- All changes need at least one approval before merging\n- Review for correctness, readability, and maintainability\n- Check that changes don't break other packages in the workspace\n- Verify that new dependencies are justified and properly scoped",
				scope: "project",
				alwaysApply: true,
				description: "code-review",
			},
		],
		skills: [],
		agents: [
			{
				name: "reviewer",
				description: "Reviews code changes for quality and cross-package impact",
				instructions:
					"You are a code reviewer for a monorepo. When reviewing changes:\n\n1. Check if the change affects shared packages and identify downstream consumers\n2. Verify that cross-package dependencies are properly declared\n3. Ensure tests cover the change adequately\n4. Flag any breaking changes to package APIs\n5. Check for consistent coding patterns across the monorepo",
				readonly: true,
			},
		],
		toolServers: [],
		hooks: [],
		permissions: [
			{ tool: "Bash", pattern: "npm *", decision: "allow", scope: "project" },
			{ tool: "Bash", pattern: "pnpm *", decision: "allow", scope: "project" },
			{ tool: "Bash", pattern: "yarn *", decision: "allow", scope: "project" },
			{ tool: "Bash", pattern: "turbo *", decision: "allow", scope: "project" },
		],
		settings: [],
		ignorePatterns: [
			{ pattern: "node_modules/**", scope: "project" },
			{ pattern: "dist/**", scope: "project" },
			{ pattern: "build/**", scope: "project" },
			{ pattern: ".env", scope: "project" },
			{ pattern: ".env.*", scope: "project" },
			{ pattern: ".turbo/**", scope: "project" },
		],
	};
}
