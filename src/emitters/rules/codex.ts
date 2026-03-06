import type { Rule } from "../../domain/rule.js";
import type { EmitResult, EmittedFile } from "../types.js";
import { groupByOutputDir, prefixPath } from "./shared.js";

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
export function emitCodex(rules: Rule[]): EmitResult {
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
