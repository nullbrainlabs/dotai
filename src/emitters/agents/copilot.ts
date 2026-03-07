import { stringify as stringifyYaml } from "yaml";
import type { Agent } from "../../domain/agent.js";
import type { EmitResult, EmittedFile } from "../types.js";

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

/** Fields not supported by Copilot agent config. */
const COPILOT_UNSUPPORTED_AGENT_FIELDS = [
	"disallowedTools",
	"permissionMode",
	"maxTurns",
	"skills",
	"memory",
	"isolation",
	"hooks",
	"modelReasoningEffort",
	"background",
] as const;

/** Copilot: .github/agents/<name>.agent.md with YAML frontmatter */
export function emitCopilotAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	for (const agent of agents) {
		const frontmatter: string[] = [];
		frontmatter.push(`name: ${agent.name}`);
		frontmatter.push(`description: ${agent.description || agent.name}`);

		if (agent.model) {
			frontmatter.push(`model: ${agent.model}`);
		}

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

		if (agent.userInvocable !== undefined) {
			frontmatter.push(`user-invocable: ${agent.userInvocable}`);
		}
		if (agent.disableModelInvocation) {
			frontmatter.push("disable-model-invocation: true");
		}
		if (agent.target) {
			frontmatter.push(`target: ${agent.target}`);
		}
		if (agent.mcpServers && Object.keys(agent.mcpServers).length > 0) {
			const yamlBlock = stringifyYaml({ "mcp-servers": agent.mcpServers }, { indent: 2 }).trimEnd();
			frontmatter.push(yamlBlock);
		}
		if (agent.metadata && Object.keys(agent.metadata).length > 0) {
			const yamlBlock = stringifyYaml({ metadata: agent.metadata }, { indent: 2 }).trimEnd();
			frontmatter.push(yamlBlock);
		}

		const header = `---\n${frontmatter.join("\n")}\n---\n\n`;
		files.push({
			path: `.github/agents/${agent.name}.agent.md`,
			content: `${header}${agent.instructions}\n`,
		});

		// Warn about unsupported fields
		for (const field of COPILOT_UNSUPPORTED_AGENT_FIELDS) {
			const value = agent[field];
			if (value !== undefined && value !== null) {
				const hasContent = Array.isArray(value)
					? value.length > 0
					: typeof value === "object"
						? Object.keys(value).length > 0
						: true;
				if (hasContent) {
					warnings.push(`Copilot does not support "${field}" on agent "${agent.name}" — ignored.`);
				}
			}
		}
	}

	return { files, warnings };
}
