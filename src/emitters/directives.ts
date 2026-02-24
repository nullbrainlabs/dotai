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
 * - enterprise/user scope → skipped with warnings
 * - local scope → <outputDir>/CLAUDE.local.md (concatenated, grouped by outputDir)
 * - project + alwaysApply (no appliesTo) → <outputDir>/CLAUDE.md (concatenated, grouped by outputDir)
 * - project + appliesTo → <outputDir>/.claude/rules/<name>.md with YAML paths: frontmatter
 * - project + alwaysApply:false without appliesTo → .claude/rules/ with warning (no effect)
 */
function emitClaude(directives: Directive[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	// 1. Filter by scope — skip enterprise + user with warnings
	const enterpriseCount = directives.filter((d) => d.scope === "enterprise").length;
	if (enterpriseCount > 0) {
		warnings.push(
			`Skipping ${enterpriseCount} enterprise-scope directive(s) — no Claude Code target path for enterprise scope.`,
		);
	}

	const userCount = directives.filter((d) => d.scope === "user").length;
	if (userCount > 0) {
		warnings.push(
			`Skipping ${userCount} user-scope directive(s) — use "dotai sync --scope user" to emit these.`,
		);
	}

	const remaining = directives.filter((d) => d.scope !== "enterprise" && d.scope !== "user");

	// 2. Local-scope → collect into CLAUDE.local.md per outputDir
	const localDirectives = remaining.filter((d) => d.scope === "local");
	if (localDirectives.some((d) => d.appliesTo?.length)) {
		warnings.push(
			"Local-scope directives with appliesTo will be placed in CLAUDE.local.md — Claude Code does not support scoped local rules.",
		);
	}
	for (const [outputDir, group] of groupByOutputDir(localDirectives)) {
		const sections = group.map((d) => d.content);
		files.push({
			path: prefixPath("CLAUDE.local.md", outputDir),
			content: `${sections.join("\n\n---\n\n")}\n`,
		});
	}

	// 3. Project-scope directives
	const projectDirectives = remaining.filter((d) => d.scope === "project");
	const alwaysApply = projectDirectives.filter((d) => d.alwaysApply && !d.appliesTo?.length);
	const scoped = projectDirectives.filter((d) => d.appliesTo?.length);
	const noEffect = projectDirectives.filter((d) => !d.alwaysApply && !d.appliesTo?.length);

	// 4. Warn on alwaysApply: false without appliesTo
	if (noEffect.length > 0) {
		warnings.push(
			`${noEffect.length} directive(s) have alwaysApply: false without appliesTo — Claude Code loads all rules unconditionally. Add appliesTo patterns or set alwaysApply: true.`,
		);
	}

	// Group alwaysApply directives by outputDir → one CLAUDE.md per group
	for (const [outputDir, group] of groupByOutputDir(alwaysApply)) {
		const sections = group.map((d) => d.content);
		files.push({
			path: prefixPath("CLAUDE.md", outputDir),
			content: `${sections.join("\n\n---\n\n")}\n`,
		});
	}

	// Scoped directives → .claude/rules/<name>.md with YAML paths: frontmatter
	for (const directive of scoped) {
		const name = slugify(directive.description || "rule");
		const paths = directive.appliesTo?.map((p) => `  - "${p}"`).join("\n");
		const frontmatter = `---\npaths:\n${paths}\n---`;
		const content = `${frontmatter}\n\n${directive.content}`;

		files.push({
			path: prefixPath(`.claude/rules/${name}.md`, directive.outputDir),
			content: `${content}\n`,
		});
	}

	// noEffect directives still go to .claude/rules/ (they just load unconditionally)
	for (const directive of noEffect) {
		const name = slugify(directive.description || "rule");
		files.push({
			path: prefixPath(`.claude/rules/${name}.md`, directive.outputDir),
			content: `${directive.content}\n`,
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

/** 32 KiB — Codex `project_doc_max_bytes` default. */
const CODEX_SIZE_LIMIT = 32 * 1024;

/** Warn if file content exceeds the Codex size limit. */
function checkSizeLimit(path: string, content: string, warnings: string[]): void {
	const size = new TextEncoder().encode(content).byteLength;
	if (size > CODEX_SIZE_LIMIT) {
		warnings.push(
			`${path} exceeds Codex 32 KiB limit (${(size / 1024).toFixed(1)} KiB) — Codex may truncate it.`,
		);
	}
}

/**
 * Codex:
 * - enterprise/user scope → skipped with warnings
 * - project + local → AGENTS.md / AGENTS.override.md (grouped by outputDir)
 * - override: true → AGENTS.override.md
 */
function emitCodex(directives: Directive[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (directives.length === 0) return { files, warnings };

	// 1. Filter by scope — skip enterprise + user with warnings
	const enterpriseCount = directives.filter((d) => d.scope === "enterprise").length;
	if (enterpriseCount > 0) {
		warnings.push(
			`Skipping ${enterpriseCount} enterprise-scope directive(s) — no Codex target path for enterprise scope.`,
		);
	}

	const userCount = directives.filter((d) => d.scope === "user").length;
	if (userCount > 0) {
		warnings.push(
			`Skipping ${userCount} user-scope directive(s) — use "dotai sync --scope user" to emit these.`,
		);
	}

	const remaining = directives.filter((d) => d.scope !== "enterprise" && d.scope !== "user");

	if (remaining.length === 0) return { files, warnings };

	// 2. Split by override flag
	const overrideDirectives = remaining.filter((d) => d.override);
	const regularDirectives = remaining.filter((d) => !d.override);

	// 3. Emit regular directives → AGENTS.md per outputDir
	for (const [outputDir, group] of groupByOutputDir(regularDirectives)) {
		const sections = group.map((d) => {
			const header = d.description ? `## ${d.description}` : "## Directive";
			const scopeNote = d.appliesTo?.length ? `\n\n> Applies to: ${d.appliesTo.join(", ")}` : "";
			return `${header}${scopeNote}\n\n${d.content}`;
		});

		const path = prefixPath("AGENTS.md", outputDir);
		const content = `# Project Instructions\n\n${sections.join("\n\n---\n\n")}\n`;
		files.push({ path, content });
		checkSizeLimit(path, content, warnings);
	}

	// 4. Emit override directives → AGENTS.override.md per outputDir
	for (const [outputDir, group] of groupByOutputDir(overrideDirectives)) {
		const sections = group.map((d) => {
			const header = d.description ? `## ${d.description}` : "## Directive";
			const scopeNote = d.appliesTo?.length ? `\n\n> Applies to: ${d.appliesTo.join(", ")}` : "";
			return `${header}${scopeNote}\n\n${d.content}`;
		});

		const path = prefixPath("AGENTS.override.md", outputDir);
		const content = `# Project Instructions (Override)\n\n${sections.join("\n\n---\n\n")}\n`;
		files.push({ path, content });
		checkSizeLimit(path, content, warnings);
	}

	if (remaining.some((d) => d.appliesTo?.length)) {
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
