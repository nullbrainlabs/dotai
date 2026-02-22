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
			case "opencode":
				return emitOpenCodeAgents(config.agents);
			case "copilot":
				return emitCopilotAgents(config.agents);
			case "antigravity":
				return emitAntigravityAgents(config.agents);
		}
	},
};

/** Claude Code: .claude/agents/<name>.md */
function emitClaudeAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	for (const agent of agents) {
		files.push({
			path: `.claude/agents/${agent.name}.md`,
			content: `${agent.instructions}\n`,
		});
	}
	return { files, warnings: [] };
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

/** OpenCode: .opencode/agents/<name>.md with YAML frontmatter */
function emitOpenCodeAgents(agents: Agent[]): EmitResult {
	const files: EmittedFile[] = [];
	for (const agent of agents) {
		const frontmatter: string[] = [];
		if (agent.description) frontmatter.push(`description: ${agent.description}`);
		if (agent.mode) frontmatter.push(`mode: ${agent.mode}`);
		if (agent.model) frontmatter.push(`model: ${agent.model}`);
		if (agent.temperature !== undefined) frontmatter.push(`temperature: ${agent.temperature}`);
		if (agent.topP !== undefined) frontmatter.push(`top_p: ${agent.topP}`);
		if (agent.steps !== undefined) frontmatter.push(`steps: ${agent.steps}`);
		if (agent.color) frontmatter.push(`color: ${agent.color}`);
		if (agent.hidden) frontmatter.push(`hidden: true`);
		if (agent.disabled) frontmatter.push(`disable: true`);
		if (agent.readonly) {
			frontmatter.push(`tools:`);
			frontmatter.push(`  write: false`);
			frontmatter.push(`  bash: false`);
		}

		const header = frontmatter.length > 0 ? `---\n${frontmatter.join("\n")}\n---\n\n` : "";
		files.push({
			path: `.opencode/agents/${agent.name}.md`,
			content: `${header}${agent.instructions}\n`,
		});
	}
	return { files, warnings: [] };
}

/** Antigravity: no file-based agent configuration */
function emitAntigravityAgents(agents: Agent[]): EmitResult {
	const warnings: string[] = [];

	if (agents.length > 0) {
		warnings.push(
			"Antigravity does not support file-based agent configuration — agents are skipped.",
		);
	}

	return { files: [], warnings };
}
