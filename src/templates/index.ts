import type { ProjectConfig } from "../config/schema.js";
import { blankTemplate } from "./blank.js";
import { minimalTemplate } from "./minimal.js";
import { monorepoTemplate } from "./monorepo.js";
import { pythonTemplate } from "./python.js";
import { webTemplate } from "./web.js";

/** Available template names. */
export type TemplateName = "blank" | "minimal" | "web" | "python" | "monorepo";

/** Template metadata for display. */
export interface TemplateInfo {
	name: TemplateName;
	label: string;
	description: string;
	factory: () => ProjectConfig;
}

/** All available templates. */
export const TEMPLATES: readonly TemplateInfo[] = [
	{
		name: "minimal",
		label: "Minimal",
		description: "Conventions + common ignore patterns",
		factory: minimalTemplate,
	},
	{
		name: "web",
		label: "Web / TypeScript",
		description: "TypeScript conventions, testing, security, MCP server",
		factory: webTemplate,
	},
	{
		name: "python",
		label: "Python",
		description: "Formatting, typing, docstrings, pytest conventions",
		factory: pythonTemplate,
	},
	{
		name: "monorepo",
		label: "Monorepo",
		description: "Workspace-aware conventions, reviewer agent",
		factory: monorepoTemplate,
	},
	{
		name: "blank",
		label: "Blank",
		description: "Empty config skeleton",
		factory: blankTemplate,
	},
] as const;

/** Get a template by name. Throws if not found. */
export function getTemplate(name: TemplateName): ProjectConfig {
	const template = TEMPLATES.find((t) => t.name === name);
	if (!template) {
		throw new Error(`Unknown template: ${name}`);
	}
	return template.factory();
}

/** All valid template names. */
export const TEMPLATE_NAMES: readonly TemplateName[] = TEMPLATES.map((t) => t.name);
