import type { Agent } from "../../domain/agent.js";
import { tomlMultilineString, tomlString } from "../toml-utils.js";
import type { EmitResult, EmittedFile } from "../types.js";

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
export function emitCodexAgents(agents: Agent[]): EmitResult {
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
