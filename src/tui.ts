import {
	confirm,
	intro,
	isCancel,
	multiselect,
	outro,
	select,
	spinner,
	text,
} from "@clack/prompts";

/** Check if the current process is running in an interactive terminal. */
export function isTTY(): boolean {
	return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

/** Guard against user cancellation in clack prompts. Exits cleanly if cancelled. */
export function cancelGuard<T>(value: T | symbol): T {
	if (isCancel(value)) {
		outro("Cancelled.");
		process.exit(0);
	}
	return value as T;
}

export { confirm, intro, isCancel, multiselect, outro, select, spinner, text };
