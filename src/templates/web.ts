import type { ProjectConfig } from "../config/schema.js";

/** Web/TypeScript project starter — conventions, testing, security rules. */
export function webTemplate(): ProjectConfig {
	return {
		rules: [
			{
				content:
					"# TypeScript Conventions\n\n- Use strict TypeScript — avoid `any`, prefer explicit types\n- Prefer `const` over `let`; never use `var`\n- Use ES modules (`import`/`export`), not CommonJS\n- Prefer async/await over raw promises\n- Use template literals over string concatenation\n- Destructure objects and arrays where it improves readability",
				scope: "project",
				alwaysApply: true,
				description: "typescript-conventions",
			},
			{
				content:
					"# Testing Rules\n\n- Write tests for all new functionality\n- Use descriptive test names that explain the expected behavior\n- Prefer unit tests; use integration tests for cross-boundary flows\n- Mock external dependencies, not internal modules\n- Each test should test one thing",
				scope: "project",
				alwaysApply: true,
				description: "testing",
			},
			{
				content:
					"# Security Guidelines\n\n- Never hardcode secrets, tokens, or credentials\n- Validate and sanitize all user input\n- Use parameterized queries for database operations\n- Escape output to prevent XSS\n- Follow the principle of least privilege for permissions and access",
				scope: "project",
				alwaysApply: true,
				description: "security",
			},
		],
		skills: [],
		agents: [],
		toolServers: [
			{
				name: "filesystem",
				transport: "stdio",
				command: "npx",
				args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
				scope: "project",
			},
		],
		hooks: [],
		permissions: [
			{ tool: "Bash", pattern: "npm *", decision: "allow", scope: "project" },
			{ tool: "Bash", pattern: "npx *", decision: "allow", scope: "project" },
		],
		settings: [],
		ignorePatterns: [
			{ pattern: "node_modules/**", scope: "project" },
			{ pattern: "dist/**", scope: "project" },
			{ pattern: "build/**", scope: "project" },
			{ pattern: ".env", scope: "project" },
			{ pattern: ".env.*", scope: "project" },
			{ pattern: "*.min.js", scope: "project" },
		],
	};
}
