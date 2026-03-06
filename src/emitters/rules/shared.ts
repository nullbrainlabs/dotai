import type { Rule } from "../../domain/rule.js";

/** Convert a string to a filename-safe slug. */
export function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

/** Prefix a path with an optional output directory. */
export function prefixPath(path: string, outputDir?: string): string {
	return outputDir ? `${outputDir}/${path}` : path;
}

/** Group rules by their outputDir (undefined key = root). */
export function groupByOutputDir(rules: Rule[]): Map<string | undefined, Rule[]> {
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
