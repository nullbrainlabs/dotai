import { stringify as stringifyYaml } from "yaml";
import type { ProjectConfig } from "../config/schema.js";
import type { Agent } from "../domain/agent.js";
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

/** Cursor: .cursor/agents/<name>.md */
function emitCursorAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	for (const agent of agents) {
		const frontmatter: string[] = [];
		if (agent.description) frontmatter.push(`description: ${agent.description}`);
		if (agent.model) frontmatter.push(`model: ${agent.model}`);
		if (agent.readonly) frontmatter.push(`readonly: true`);
		if (agent.tools?.length) frontmatter.push(`tools: [${agent.tools.join(", ")}]`);

		const header = frontmatter.length > 0 ? `---\n${frontmatter.join("\n")}\n---\n\n` : "";
		files.push({
			path: `.cursor/agents/${agent.name}.md`,
			content: `${header}${agent.instructions}\n`,
		});
	}
	return { files, warnings: [] };
}

/** Codex: agent sections appended to AGENTS.md */
function emitCodexAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (agents.length === 0) return { files, warnings };

	const sections = agents.map((a) => {
		const meta: string[] = [];
		if (a.model) meta.push(`Model: ${a.model}`);
		if (a.readonly) meta.push("Read-only access");
		if (a.tools?.length) meta.push(`Tools: ${a.tools.join(", ")}`);
		const metaBlock = meta.length > 0 ? `\n\n> ${meta.join(" | ")}` : "";
		return `## Agent: ${a.name}\n\n${a.description ? `${a.description}\n\n` : ""}${a.instructions}${metaBlock}`;
	});

	files.push({
		path: "AGENTS.md",
		content: `# Agents\n\n${sections.join("\n\n---\n\n")}\n`,
	});

	if (agents.some((a) => a.tools?.length)) {
		warnings.push(
			"Codex does not support per-agent tool restrictions — tools listed as notes only.",
		);
	}

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
