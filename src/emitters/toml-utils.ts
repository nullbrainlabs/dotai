/** Escape and quote a string for TOML. */
export function tomlString(s: string): string {
	return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Format a multi-line string as a TOML multi-line literal (triple-quoted). */
export function tomlMultilineString(s: string): string {
	// Use triple-double-quotes with leading newline per TOML spec
	const escaped = s.replace(/\\/g, "\\\\").replace(/"""/g, '""\\"');
	return `"""\n${escaped}"""`;
}
