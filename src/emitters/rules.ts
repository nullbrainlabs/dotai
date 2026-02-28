import type { ProjectConfig } from "../config/schema.js";
import type { Rule } from "../domain/rule.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "./types.js";

/** Emits rule files — biggest format divergence across tools. */
export const rulesEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaude(config.rules);
			case "cursor":
				return emitCursor(config.rules);
			case "codex":
				return emitCodex(config.rules);
			case "copilot":
				return emitCopilot(config.rules);
		}
	},
};

/** Prefix a path with an optional output directory. */
function prefixPath(path: string, outputDir?: string): string {
	return outputDir ? `${outputDir}/${path}` : path;
}

/** Group rules by their outputDir (undefined key = root). */
function groupByOutputDir(rules: Rule[]): Map<string | undefined, Rule[]> {
	const groups = new Map<string | undefined, Rule[]>();
	for (const d of rules) {
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
function emitClaude(rules: Rule[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	// 1. Filter by scope — skip enterprise + user with warnings
	const enterpriseCount = rules.filter((d) => d.scope === "enterprise").length;
	if (enterpriseCount > 0) {
		warnings.push(
			`Skipping ${enterpriseCount} enterprise-scope rule(s) — no Claude Code target path for enterprise scope.`,
		);
	}

	const userCount = rules.filter((d) => d.scope === "user").length;
	if (userCount > 0) {
		warnings.push(
			`Skipping ${userCount} user-scope rule(s) — use "dotai sync --scope user" to emit these.`,
		);
	}

	const remaining = rules.filter((d) => d.scope !== "enterprise" && d.scope !== "user");

	// 2. Local-scope → collect into CLAUDE.local.md per outputDir
	const localRules = remaining.filter((d) => d.scope === "local");
	if (localRules.some((d) => d.appliesTo?.length)) {
		warnings.push(
			"Local-scope rules with appliesTo will be placed in CLAUDE.local.md — Claude Code does not support scoped local rules.",
		);
	}
	for (const [outputDir, group] of groupByOutputDir(localRules)) {
		const sections = group.map((d) => d.content);
		files.push({
			path: prefixPath("CLAUDE.local.md", outputDir),
			content: `${sections.join("\n\n---\n\n")}\n`,
		});
	}

	// 3. Project-scope rules
	const projectRules = remaining.filter((d) => d.scope === "project");
	const alwaysApply = projectRules.filter((d) => d.alwaysApply && !d.appliesTo?.length);
	const scoped = projectRules.filter((d) => d.appliesTo?.length);
	const noEffect = projectRules.filter((d) => !d.alwaysApply && !d.appliesTo?.length);

	// 4. Warn on alwaysApply: false without appliesTo
	if (noEffect.length > 0) {
		warnings.push(
			`${noEffect.length} rule(s) have alwaysApply: false without appliesTo — Claude Code loads all rules unconditionally. Add appliesTo patterns or set alwaysApply: true.`,
		);
	}

	// Group alwaysApply rules by outputDir → one CLAUDE.md per group
	for (const [outputDir, group] of groupByOutputDir(alwaysApply)) {
		const sections = group.map((d) => d.content);
		files.push({
			path: prefixPath("CLAUDE.md", outputDir),
			content: `${sections.join("\n\n---\n\n")}\n`,
		});
	}

	// Scoped rules → .claude/rules/<name>.md with YAML paths: frontmatter
	for (const rule of scoped) {
		const name = slugify(rule.description || "rule");
		const paths = rule.appliesTo?.map((p) => `  - "${p}"`).join("\n");
		const frontmatter = `---\npaths:\n${paths}\n---`;
		const content = `${frontmatter}\n\n${rule.content}`;

		files.push({
			path: prefixPath(`.claude/rules/${name}.md`, rule.outputDir),
			content: `${content}\n`,
		});
	}

	// noEffect rules still go to .claude/rules/ (they just load unconditionally)
	for (const rule of noEffect) {
		const name = slugify(rule.description || "rule");
		files.push({
			path: prefixPath(`.claude/rules/${name}.md`, rule.outputDir),
			content: `${rule.content}\n`,
		});
	}

	return { files, warnings };
}

/**
 * Cursor:
 * Each rule → <outputDir>/.cursor/rules/<name>.mdc with frontmatter.
 */
function emitCursor(rules: Rule[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	for (const rule of rules) {
		const name = slugify(rule.description || "rule");
		const frontmatter: string[] = [];

		if (rule.description) {
			frontmatter.push(`description: ${rule.description}`);
		}
		if (rule.appliesTo?.length) {
			frontmatter.push(`globs: ${rule.appliesTo.join(", ")}`);
		}
		frontmatter.push(`alwaysApply: ${rule.alwaysApply}`);

		const header = `---\n${frontmatter.join("\n")}\n---`;
		files.push({
			path: prefixPath(`.cursor/rules/${name}.mdc`, rule.outputDir),
			content: `${header}\n\n${rule.content}\n`,
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
function emitCodex(rules: Rule[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (rules.length === 0) return { files, warnings };

	// 1. Filter by scope — skip enterprise + user with warnings
	const enterpriseCount = rules.filter((d) => d.scope === "enterprise").length;
	if (enterpriseCount > 0) {
		warnings.push(
			`Skipping ${enterpriseCount} enterprise-scope rule(s) — no Codex target path for enterprise scope.`,
		);
	}

	const userCount = rules.filter((d) => d.scope === "user").length;
	if (userCount > 0) {
		warnings.push(
			`Skipping ${userCount} user-scope rule(s) — use "dotai sync --scope user" to emit these.`,
		);
	}

	const remaining = rules.filter((d) => d.scope !== "enterprise" && d.scope !== "user");

	if (remaining.length === 0) return { files, warnings };

	// 2. Split by override flag
	const overrideRules = remaining.filter((d) => d.override);
	const regularRules = remaining.filter((d) => !d.override);

	// 3. Emit regular rules → AGENTS.md per outputDir
	for (const [outputDir, group] of groupByOutputDir(regularRules)) {
		const sections = group.map((d) => {
			const header = d.description ? `## ${d.description}` : "## Rule";
			const scopeNote = d.appliesTo?.length ? `\n\n> Applies to: ${d.appliesTo.join(", ")}` : "";
			return `${header}${scopeNote}\n\n${d.content}`;
		});

		const path = prefixPath("AGENTS.md", outputDir);
		const content = `# Project Instructions\n\n${sections.join("\n\n---\n\n")}\n`;
		files.push({ path, content });
		checkSizeLimit(path, content, warnings);
	}

	// 4. Emit override rules → AGENTS.override.md per outputDir
	for (const [outputDir, group] of groupByOutputDir(overrideRules)) {
		const sections = group.map((d) => {
			const header = d.description ? `## ${d.description}` : "## Rule";
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
			"Codex AGENTS.md does not support file-scoped rules — appliesTo patterns are included as notes but not enforced.",
		);
	}

	return { files, warnings };
}

/**
 * Copilot:
 * - alwaysApply + no appliesTo + no excludeAgent → <outputDir>/.github/copilot-instructions.md (grouped)
 * - alwaysApply + excludeAgent → .github/instructions/<slug>.instructions.md with frontmatter
 * - Has appliesTo → <outputDir>/.github/instructions/<slug>.instructions.md with applyTo frontmatter
 * - Not alwaysApply, no appliesTo → <outputDir>/.github/instructions/<slug>.instructions.md
 */
function emitCopilot(rules: Rule[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	// Repo-wide: alwaysApply + no appliesTo + no excludeAgent (copilot-instructions.md has no frontmatter)
	const repoWide = rules.filter((d) => d.alwaysApply && !d.appliesTo?.length && !d.excludeAgent);
	// Everything else goes to .github/instructions/
	const scoped = rules.filter(
		(d) => !d.alwaysApply || (d.appliesTo?.length ?? 0) > 0 || d.excludeAgent,
	);

	// Group repo-wide rules by outputDir
	for (const [outputDir, group] of groupByOutputDir(repoWide)) {
		const sections = group.map((d) => d.content);
		files.push({
			path: prefixPath(".github/copilot-instructions.md", outputDir),
			content: `${sections.join("\n\n---\n\n")}\n`,
		});
	}

	for (const rule of scoped) {
		const name = slugify(rule.description || "rule");
		const frontmatterLines: string[] = [];

		if (rule.appliesTo?.length) {
			const applyTo = rule.appliesTo.join(",");
			frontmatterLines.push(`applyTo: "${applyTo}"`);
		}
		if (rule.excludeAgent) {
			frontmatterLines.push(`excludeAgent: ${rule.excludeAgent}`);
		}

		const content =
			frontmatterLines.length > 0
				? `---\n${frontmatterLines.join("\n")}\n---\n\n${rule.content}`
				: rule.content;

		files.push({
			path: prefixPath(`.github/instructions/${name}.instructions.md`, rule.outputDir),
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
