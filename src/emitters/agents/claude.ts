import { stringify as stringifyYaml } from "yaml";
import type { Agent } from "../../domain/agent.js";
import type { EmitResult, EmittedFile } from "../types.js";

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
export function emitClaudeAgents(agents: Agent[]): EmitResult {
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
