import type { Rule } from "../../domain/rule.js";
import type { EmitResult, EmittedFile } from "../types.js";
import { groupByOutputDir, prefixPath, slugify } from "./shared.js";

/**
 * Copilot:
 * - alwaysApply + no appliesTo + no excludeAgent → <outputDir>/.github/copilot-instructions.md (grouped)
 * - alwaysApply + excludeAgent → .github/instructions/<slug>.instructions.md with frontmatter
 * - Has appliesTo → <outputDir>/.github/instructions/<slug>.instructions.md with applyTo frontmatter
 * - Not alwaysApply, no appliesTo → <outputDir>/.github/instructions/<slug>.instructions.md
 */
export function emitCopilot(rules: Rule[]): EmitResult {
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
