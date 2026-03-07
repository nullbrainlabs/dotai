import type { Rule } from "../../domain/rule.js";
import type { EmitResult, EmittedFile } from "../types.js";
import { prefixPath, slugify } from "./shared.js";

/**
 * Cursor:
 * Each rule → <outputDir>/.cursor/rules/<name>.mdc with frontmatter.
 */
export function emitCursor(rules: Rule[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	for (const rule of rules) {
		const name = slugify(rule.description || "rule");
		const frontmatter: string[] = [];

		if (rule.description) {
			frontmatter.push(`description: ${rule.description}`);
		}
		if (rule.appliesTo?.length) {
			const globList = rule.appliesTo.map((g) => `"${g}"`).join(", ");
			frontmatter.push(`globs: [${globList}]`);
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
