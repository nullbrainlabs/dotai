import { createSkill } from "../domain/factories.js";
import type { Skill } from "../domain/skill.js";
import { skillCreatorSkill } from "./skill-creator.js";

/** Returns 4 bundled helper skills for guided dotai entity creation. */
export function helperSkills(): Skill[] {
	return [skillCreatorSkill(), addRuleSkill(), addAgentSkill(), addMcpSkill()];
}

function addRuleSkill(): Skill {
	return createSkill({
		name: "add-rule",
		description: "Guide the user through creating a new dotai rule",
		disableAutoInvocation: true,
		content: `---
description: Guide the user through creating a new dotai rule
disableAutoInvocation: true
---

# Add Rule

Create a new rule in the \`.ai/rules/\` directory.

## Process

1. Ask the user what behavior or convention the rule should enforce
2. Ask for a short description (used as the filename and for intelligent selection)
3. Ask whether it should always apply or only for specific file patterns
4. Create the rule markdown file with proper frontmatter

## File Location

\`\`\`
.ai/rules/<description>.md
\`\`\`

## Rule Format

\`\`\`markdown
---
scope: project
alwaysApply: true
description: short description for intelligent selection
---

# Rule Title

The rule content in markdown. This is injected into the AI's context.
\`\`\`

## Valid Frontmatter Fields

- \`scope\` (string) — "project" or "user"
- \`alwaysApply\` (boolean) — always include in context vs. intelligent selection
- \`description\` (string) — human-readable label for intelligent selection
- \`appliesTo\` (string[]) — glob patterns to activate for matching files only
- \`outputDir\` (string) — subdirectory for the emitted file
- \`override\` (boolean) — emit to AGENTS.override.md (Codex only)
- \`excludeAgent\` ("code-review" | "coding-agent") — exclude from a Copilot agent

## After Creating

Run \`dotai sync\` to propagate the rule to your AI tool configs.
`,
	});
}

function addAgentSkill(): Skill {
	return createSkill({
		name: "add-agent",
		description: "Guide the user through creating a new dotai agent",
		disableAutoInvocation: true,
		content: `---
description: Guide the user through creating a new dotai agent
disableAutoInvocation: true
---

# Add Agent

Create a new agent definition in the \`.ai/agents/\` directory.

## Process

1. Ask the user for the agent name (kebab-case, e.g. \`test-runner\`)
2. Ask for a description of when the primary agent should delegate to this one
3. Ask about any constraints (read-only, specific tools, model override)
4. Create the agent markdown file

## File Location

\`\`\`
.ai/agents/<name>.md
\`\`\`

## Agent Format

\`\`\`markdown
---
description: When and why to delegate to this agent
model: claude-sonnet-4-6
readonly: false
tools: [Read, Glob, Grep]
---

System prompt and behavioral guidance for the agent.
\`\`\`

## Valid Frontmatter Fields

- \`description\` (string) — when/why to delegate to this agent
- \`model\` (string) — model override, e.g. "claude-sonnet-4-6"
- \`readonly\` (boolean) — restrict to read-only file access
- \`tools\` (string[]) — allowed tool names
- \`disallowedTools\` (string[]) — disallowed tool names
- \`permissionMode\` (string) — "default", "acceptEdits", "dontAsk", "bypassPermissions", "plan"
- \`maxTurns\` (number) — maximum agentic turns
- \`skills\` (string[]) — skills available to the agent
- \`isolation\` ("worktree") — run in isolated worktree

## After Creating

Run \`dotai sync\` to propagate the agent to your AI tool configs.
`,
	});
}

function addMcpSkill(): Skill {
	return createSkill({
		name: "add-mcp",
		description: "Guide the user through configuring an MCP server in dotai",
		disableAutoInvocation: true,
		content: `---
description: Guide the user through configuring an MCP server in dotai
disableAutoInvocation: true
---

# Add MCP Server

Configure a new MCP (Model Context Protocol) server in \`.ai/config.yaml\`.

## Process

1. Ask the user for the server name (e.g. \`github\`, \`postgres\`)
2. Ask for the transport type: stdio, http, or sse
3. For stdio: ask for the command and optional args
4. For http/sse: ask for the URL
5. Ask about optional environment variables
6. Add the server entry to the \`mcpServers\` section of \`.ai/config.yaml\`

## Config Location

\`\`\`
.ai/config.yaml → mcpServers section
\`\`\`

## Config Format

\`\`\`yaml
mcpServers:
  server-name:
    transport: stdio
    command: npx -y @example/mcp-server
    args: []
    env:
      API_KEY: "\${API_KEY}"
\`\`\`

## Transport Types

- **stdio** — local process, requires \`command\` (and optional \`args\`)
- **http** — HTTP endpoint, requires \`url\`
- **sse** — Server-Sent Events endpoint, requires \`url\`

## Valid Fields

- \`transport\` (string) — "stdio", "http", or "sse"
- \`command\` (string) — shell command for stdio transport
- \`url\` (string) — endpoint URL for http/sse transport
- \`args\` (string[]) — command arguments for stdio
- \`env\` (object) — environment variables passed to the server
- \`enabledTools\` (string[]) — only expose these tools
- \`disabledTools\` (string[]) — hide these tools
- \`headers\` (object) — custom HTTP headers for http/sse
- \`oauth\` (object) — OAuth config with \`clientId\` and optional \`callbackPort\`

## After Configuring

Run \`dotai sync\` to propagate the MCP server config to your AI tools.
`,
	});
}
