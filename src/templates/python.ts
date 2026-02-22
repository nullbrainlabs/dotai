import type { ProjectConfig } from "../config/schema.js";

/** Python project starter — formatting, typing, docstring conventions. */
export function pythonTemplate(): ProjectConfig {
	return {
		directives: [
			{
				content:
					"# Python Conventions\n\n- Use type hints for all function signatures\n- Follow PEP 8 style guidelines\n- Use `ruff` or `black` for formatting\n- Prefer f-strings over `.format()` or `%` formatting\n- Use `pathlib.Path` instead of `os.path` for file operations\n- Use dataclasses or Pydantic models for structured data",
				scope: "project",
				alwaysApply: true,
				description: "python-conventions",
			},
			{
				content:
					"# Docstring Conventions\n\n- Write docstrings for all public modules, classes, and functions\n- Use Google-style docstrings\n- Include Args, Returns, and Raises sections as applicable\n- Keep the first line as a concise summary",
				scope: "project",
				alwaysApply: true,
				description: "docstrings",
			},
			{
				content:
					"# Testing Rules\n\n- Write tests using pytest\n- Use descriptive test names: `test_<what>_<condition>_<expected>`\n- Use fixtures for shared setup\n- Mock external services, not internal logic\n- Aim for high coverage on business logic",
				scope: "project",
				alwaysApply: true,
				description: "testing",
			},
		],
		skills: [],
		agents: [],
		toolServers: [],
		hooks: [],
		permissions: [
			{ tool: "Bash", pattern: "python *", decision: "allow", scope: "project" },
			{ tool: "Bash", pattern: "pip *", decision: "allow", scope: "project" },
			{ tool: "Bash", pattern: "pytest *", decision: "allow", scope: "project" },
		],
		settings: [],
		ignorePatterns: [
			{ pattern: "__pycache__/**", scope: "project" },
			{ pattern: ".venv/**", scope: "project" },
			{ pattern: "*.pyc", scope: "project" },
			{ pattern: ".env", scope: "project" },
			{ pattern: "dist/**", scope: "project" },
			{ pattern: "*.egg-info/**", scope: "project" },
		],
	};
}
