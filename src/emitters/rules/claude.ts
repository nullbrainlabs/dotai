import type { Rule } from "../../domain/rule.js";
import type { EmitResult, EmittedFile } from "../types.js";
import { groupByOutputDir, prefixPath, slugify } from "./shared.js";

/**
 * Claude Code:
 * - enterprise/user scope → skipped with warnings
 * - local scope → <outputDir>/CLAUDE.local.md (concatenated, grouped by outputDir)
 * - project + alwaysApply (no appliesTo) → <outputDir>/CLAUDE.md (concatenated, grouped by outputDir)
 * - project + appliesTo → <outputDir>/.claude/rules/<name>.md with YAML paths: frontmatter
 * - project + alwaysApply:false without appliesTo → .claude/rules/ with warning (no effect)
 */
export function emitClaude(rules: Rule[]): EmitResult {
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
