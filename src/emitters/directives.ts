import type { ProjectConfig } from "../config/schema.js";
import type { Directive } from "../domain/directive.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "./types.js";

/** Emits directive files — biggest format divergence across tools. */
export const directivesEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaude(config.directives);
			case "cursor":
				return emitCursor(config.directives);
			case "codex":
				return emitCodex(config.directives);
			case "copilot":
				return emitCopilot(config.directives);
		}
	},
};

/** Prefix a path with an optional output directory. */
function prefixPath(path: string, outputDir?: string): string {
	return outputDir ? `${outputDir}/${path}` : path;
}

/** Group directives by their outputDir (undefined key = root). */
function groupByOutputDir(directives: Directive[]): Map<string | undefined, Directive[]> {
	const groups = new Map<string | undefined, Directive[]>();
	for (const d of directives) {
		const key = d.outputDir;
		const list = groups.get(key);
		if (list) {
			list.push(d);
		} else {
			groups.set(key, [d]);
		}
	}
	return groups;
}

/**
 * Claude Code:
 * - alwaysApply directives → <outputDir>/CLAUDE.md (concatenated, grouped by outputDir)
 * - scoped/conditional directives → <outputDir>/.claude/rules/<name>.md
 */
function emitClaude(directives: Directive[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	const alwaysApply = directives.filter((d) => d.alwaysApply && !d.appliesTo?.length);
	const scoped = directives.filter((d) => !d.alwaysApply || d.appliesTo?.length);

	// Group alwaysApply directives by outputDir → one CLAUDE.md per group
	for (const [outputDir, group] of groupByOutputDir(alwaysApply)) {
		const sections = group.map((d) => d.content);
		files.push({
			path: prefixPath("CLAUDE.md", outputDir),
			content: `${sections.join("\n\n---\n\n")}\n`,
		});
	}

	for (const directive of scoped) {
		const name = slugify(directive.description || "rule");
		let content = directive.content;

		// Claude Code rules don't support frontmatter, so embed scope info as comments
		if (directive.appliesTo?.length) {
			const globs = directive.appliesTo.join(", ");
			content = `<!-- applies to: ${globs} -->\n\n${content}`;
		}

		files.push({
			path: prefixPath(`.claude/rules/${name}.md`, directive.outputDir),
			content: `${content}\n`,
		});
	}

	return { files, warnings };
}

/**
 * Cursor:
 * Each directive → <outputDir>/.cursor/rules/<name>.mdc with frontmatter.
 */
function emitCursor(directives: Directive[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	for (const directive of directives) {
		const name = slugify(directive.description || "rule");
		const frontmatter: string[] = [];

		if (directive.description) {
			frontmatter.push(`description: ${directive.description}`);
		}
		if (directive.appliesTo?.length) {
			frontmatter.push(`globs: ${directive.appliesTo.join(", ")}`);
		}
		frontmatter.push(`alwaysApply: ${directive.alwaysApply}`);

		const header = `---\n${frontmatter.join("\n")}\n---`;
		files.push({
			path: prefixPath(`.cursor/rules/${name}.mdc`, directive.outputDir),
			content: `${header}\n\n${directive.content}\n`,
		});
	}

	return { files, warnings };
}

/**
 * Codex:
 * Directives concatenated into <outputDir>/AGENTS.md files, grouped by outputDir.
 */
function emitCodex(directives: Directive[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (directives.length === 0) return { files, warnings };

	for (const [outputDir, group] of groupByOutputDir(directives)) {
		const sections = group.map((d) => {
			const header = d.description ? `## ${d.description}` : "## Directive";
			const scopeNote = d.appliesTo?.length ? `\n\n> Applies to: ${d.appliesTo.join(", ")}` : "";
			return `${header}${scopeNote}\n\n${d.content}`;
		});

		files.push({
			path: prefixPath("AGENTS.md", outputDir),
			content: `# Project Instructions\n\n${sections.join("\n\n---\n\n")}\n`,
		});
	}

	if (directives.some((d) => d.appliesTo?.length)) {
		warnings.push(
			"Codex AGENTS.md does not support file-scoped directives — appliesTo patterns are included as notes but not enforced.",
		);
	}

	return { files, warnings };
}

/**
 * Copilot:
 * - alwaysApply + no appliesTo → <outputDir>/.github/copilot-instructions.md (grouped by outputDir)
 * - Has appliesTo → <outputDir>/.github/instructions/<slug>.instructions.md with applyTo frontmatter
 * - Not alwaysApply, no appliesTo → <outputDir>/.github/instructions/<slug>.instructions.md
 */
function emitCopilot(directives: Directive[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	const repoWide = directives.filter((d) => d.alwaysApply && !d.appliesTo?.length);
	const scoped = directives.filter((d) => !d.alwaysApply || (d.appliesTo?.length ?? 0) > 0);

	// Group repo-wide directives by outputDir
	for (const [outputDir, group] of groupByOutputDir(repoWide)) {
		const sections = group.map((d) => d.content);
		files.push({
			path: prefixPath(".github/copilot-instructions.md", outputDir),
			content: `${sections.join("\n\n---\n\n")}\n`,
		});
	}

	for (const directive of scoped) {
		const name = slugify(directive.description || "rule");
		let content = directive.content;

		if (directive.appliesTo?.length) {
			const applyTo = directive.appliesTo.join(",");
			content = `---\napplyTo: "${applyTo}"\n---\n\n${content}`;
		}

		files.push({
			path: prefixPath(`.github/instructions/${name}.instructions.md`, directive.outputDir),
			content: `${content}\n`,
		});
	}

	return { files, warnings };
}

/** Convert a string to a filename-safe slug. */
function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
