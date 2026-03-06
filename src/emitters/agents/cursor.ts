import type { Agent } from "../../domain/agent.js";
import type { EmitResult, EmittedFile } from "../types.js";

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
export function emitCursorAgents(agents: Agent[]): EmitResult {
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
