import { stringify as stringifyYaml } from "yaml";
import type { ProjectConfig } from "../config/schema.js";
import type { Agent } from "../domain/agent.js";
import { tomlMultilineString, tomlString } from "./toml-utils.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "./types.js";

/** Emits agent definition files. */
export const agentsEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaudeAgents(config.agents);
			case "cursor":
				return emitCursorAgents(config.agents);
			case "codex":
				return emitCodexAgents(config.agents);
			case "copilot":
				return emitCopilotAgents(config.agents);
		}
	},
};

/** Model alias map for Claude Code agent frontmatter. */
const CLAUDE_MODEL_MAP: Record<string, string> = {
	"claude-sonnet-4-6": "sonnet",
	"claude-sonnet-4-5": "sonnet",
	"claude-opus-4-6": "opus",
	"claude-opus-4-5": "opus",
	"claude-haiku-4-5": "haiku",
	"claude-haiku-4-5-20251001": "haiku",
	sonnet: "sonnet",
	opus: "opus",
	haiku: "haiku",
	inherit: "inherit",
};

/** Claude Code: .claude/agents/<name>.md */
function emitClaudeAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	for (const agent of agents) {
		const lines: string[] = [];
		lines.push(`name: ${agent.name}`);
		if (agent.description) lines.push(`description: ${agent.description}`);

		if (agent.model) {
			const alias = CLAUDE_MODEL_MAP[agent.model];
			if (alias) {
				lines.push(`model: ${alias}`);
			} else {
				warnings.push(
					`Unknown model "${agent.model}" on agent "${agent.name}" — passed through as-is.`,
				);
				lines.push(`model: ${agent.model}`);
			}
		}

		if (agent.modelReasoningEffort) {
			lines.push(`modelReasoningEffort: ${agent.modelReasoningEffort}`);
		}

		if (agent.tools?.length) {
			lines.push(`tools: ${agent.tools.join(", ")}`);
		}

		// Translate readonly → disallowedTools when no explicit disallowedTools
		const disallowed =
			agent.disallowedTools ?? (agent.readonly ? ["Write", "Edit", "NotebookEdit"] : undefined);
		if (disallowed?.length) {
			lines.push(`disallowedTools: ${disallowed.join(", ")}`);
		}

		if (agent.permissionMode) lines.push(`permissionMode: ${agent.permissionMode}`);
		if (agent.maxTurns !== undefined) lines.push(`maxTurns: ${agent.maxTurns}`);
		if (agent.skills?.length) lines.push(`skills: ${agent.skills.join(", ")}`);
		if (agent.memory) lines.push(`memory: ${agent.memory}`);
		if (agent.background) lines.push(`background: true`);
		if (agent.isolation) lines.push(`isolation: ${agent.isolation}`);

		// Complex nested fields serialized via YAML
		if (agent.hooks && Object.keys(agent.hooks).length > 0) {
			const yamlBlock = stringifyYaml({ hooks: agent.hooks }, { indent: 2 }).trimEnd();
			lines.push(yamlBlock);
		}
		if (agent.mcpServers && Object.keys(agent.mcpServers).length > 0) {
			const yamlBlock = stringifyYaml({ mcpServers: agent.mcpServers }, { indent: 2 }).trimEnd();
			lines.push(yamlBlock);
		}

		const header = `---\n${lines.join("\n")}\n---\n\n`;
		files.push({
			path: `.claude/agents/${agent.name}.md`,
			content: `${header}${agent.instructions}\n`,
		});
	}

	return { files, warnings };
}

/** Fields not supported by Cursor agent config. */
const CURSOR_UNSUPPORTED_AGENT_FIELDS = [
	"tools",
	"disallowedTools",
	"permissionMode",
	"maxTurns",
	"skills",
	"memory",
	"isolation",
	"hooks",
	"mcpServers",
	"modelReasoningEffort",
] as const;

/** Cursor: .cursor/agents/<name>.md */
function emitCursorAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];
	for (const agent of agents) {
		const frontmatter: string[] = [];
		frontmatter.push(`name: ${agent.name}`);
		if (agent.description) frontmatter.push(`description: ${agent.description}`);
		if (agent.model) frontmatter.push(`model: ${agent.model}`);
		if (agent.readonly) frontmatter.push(`readonly: true`);
		if (agent.background) frontmatter.push(`is_background: true`);

		const header = `---\n${frontmatter.join("\n")}\n---\n\n`;
		files.push({
			path: `.cursor/agents/${agent.name}.md`,
			content: `${header}${agent.instructions}\n`,
		});

		// Warn about unsupported fields
		for (const field of CURSOR_UNSUPPORTED_AGENT_FIELDS) {
			const value = agent[field];
			if (value !== undefined && value !== null) {
				const hasContent = Array.isArray(value)
					? value.length > 0
					: typeof value === "object"
						? Object.keys(value).length > 0
						: true;
				if (hasContent) {
					warnings.push(`Cursor does not support "${field}" on agent "${agent.name}" — ignored.`);
				}
			}
		}
	}
	return { files, warnings };
}

/** Fields not supported by Codex agent config. */
const CODEX_UNSUPPORTED_AGENT_FIELDS = [
	"tools",
	"disallowedTools",
	"permissionMode",
	"maxTurns",
	"skills",
	"memory",
	"background",
	"isolation",
	"hooks",
	"mcpServers",
] as const;

/** Codex: [agents.<name>] in .codex/config.toml + per-agent .codex/agents/<name>.toml */
function emitCodexAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (agents.length === 0) return { files, warnings };

	// Build config.toml sections for agent roles
	const configSections: string[] = [];

	for (const agent of agents) {
		// config.toml: agent role entry
		const roleLines: string[] = [`[agents.${agent.name}]`];
		if (agent.description) {
			roleLines.push(`description = ${tomlString(agent.description)}`);
		}
		roleLines.push(`config_file = ${tomlString(`agents/${agent.name}.toml`)}`);
		configSections.push(roleLines.join("\n"));

		// Per-agent config file
		const agentLines: string[] = [];
		if (agent.model) {
			agentLines.push(`model = ${tomlString(agent.model)}`);
		}
		if (agent.modelReasoningEffort) {
			agentLines.push(`model_reasoning_effort = ${tomlString(agent.modelReasoningEffort)}`);
		}
		if (agent.readonly) {
			agentLines.push(`sandbox_mode = "read-only"`);
		}
		if (agent.instructions.trim()) {
			agentLines.push(`developer_instructions = ${tomlMultilineString(agent.instructions)}`);
		}

		files.push({
			path: `.codex/agents/${agent.name}.toml`,
			content: `${agentLines.join("\n")}\n`,
		});

		// Warn about unsupported fields
		for (const field of CODEX_UNSUPPORTED_AGENT_FIELDS) {
			const value = agent[field];
			if (value !== undefined && value !== null) {
				const hasContent = Array.isArray(value)
					? value.length > 0
					: typeof value === "object"
						? Object.keys(value).length > 0
						: true;
				if (hasContent) {
					warnings.push(`Codex does not support "${field}" on agent "${agent.name}" — ignored.`);
				}
			}
		}
	}

	files.push({
		path: ".codex/config.toml",
		content: `${configSections.join("\n\n")}\n`,
	});

	return { files, warnings };
}

/** Tool name mapping from generic to Copilot aliases. */
const COPILOT_TOOL_MAP: Record<string, string> = {
	Read: "read",
	Write: "edit",
	Edit: "edit",
	Bash: "execute",
	Shell: "execute",
	Search: "search",
	WebSearch: "web",
	WebFetch: "web",
};

/** Copilot: .github/agents/<name>.agent.md with YAML frontmatter */
function emitCopilotAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	for (const agent of agents) {
		const frontmatter: string[] = [];
		frontmatter.push(`description: ${agent.description || agent.name}`);

		if (agent.readonly) {
			frontmatter.push(`tools: [read, search]`);
		} else if (agent.tools?.length) {
			const mapped = [
				...new Set(
					agent.tools.map((t) => {
						const alias = COPILOT_TOOL_MAP[t];
						if (!alias) {
							warnings.push(
								`Unknown tool "${t}" for Copilot agent "${agent.name}" — passed through as-is.`,
							);
							return t.toLowerCase();
						}
						return alias;
					}),
				),
			];
			frontmatter.push(`tools: [${mapped.join(", ")}]`);
		}

		if (agent.model) {
			warnings.push(
				`Copilot agents do not support model override in file config — model "${agent.model}" on agent "${agent.name}" is ignored.`,
			);
		}

		const header = `---\n${frontmatter.join("\n")}\n---\n\n`;
		files.push({
			path: `.github/agents/${agent.name}.agent.md`,
			content: `${header}${agent.instructions}\n`,
		});
	}

	return { files, warnings };
}
