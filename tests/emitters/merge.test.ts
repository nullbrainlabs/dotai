import { describe, expect, it } from "vitest";
import { deepMerge, mergeFiles } from "../../src/emitters/merge.js";
import type { EmittedFile } from "../../src/emitters/types.js";

describe("mergeFiles", () => {
	it("passes through a single file unchanged", () => {
		const files: EmittedFile[] = [{ path: "a.txt", content: "hello" }];
		expect(mergeFiles(files)).toEqual(files);
	});

	it("deep-merges JSON files with nested objects", () => {
		const files: EmittedFile[] = [
			{ path: "settings.json", content: JSON.stringify({ a: { x: 1 }, b: 2 }) },
			{ path: "settings.json", content: JSON.stringify({ a: { y: 3 }, c: 4 }) },
		];
		const result = mergeFiles(files);
		expect(result).toHaveLength(1);
		const parsed = JSON.parse(result[0].content);
		expect(parsed).toEqual({ a: { x: 1, y: 3 }, b: 2, c: 4 });
	});

	it("deep-merges JSON files with array concatenation", () => {
		const files: EmittedFile[] = [
			{ path: "data.json", content: JSON.stringify({ items: [1, 2] }) },
			{ path: "data.json", content: JSON.stringify({ items: [3, 4] }) },
		];
		const result = mergeFiles(files);
		const parsed = JSON.parse(result[0].content);
		expect(parsed).toEqual({ items: [1, 2, 3, 4] });
	});

	it("concatenates TOML sections", () => {
		const files: EmittedFile[] = [
			{ path: "config.toml", content: "[section1]\nkey = 1\n" },
			{ path: "config.toml", content: "[section2]\nkey = 2\n" },
		];
		const result = mergeFiles(files);
		expect(result).toHaveLength(1);
		expect(result[0].content).toBe("[section1]\nkey = 1\n\n[section2]\nkey = 2\n");
	});

	it("concatenates markdown with --- separator", () => {
		const files: EmittedFile[] = [
			{ path: "README.md", content: "# Part 1\n" },
			{ path: "README.md", content: "# Part 2\n" },
		];
		const result = mergeFiles(files);
		expect(result).toHaveLength(1);
		expect(result[0].content).toBe("# Part 1\n\n---\n\n# Part 2\n");
	});

	it("uses last-writer-wins for unknown extensions", () => {
		const files: EmittedFile[] = [
			{ path: "out.txt", content: "first" },
			{ path: "out.txt", content: "second" },
		];
		const result = mergeFiles(files);
		expect(result).toHaveLength(1);
		expect(result[0].content).toBe("second");
	});

	it("handles multiple different paths independently", () => {
		const files: EmittedFile[] = [
			{ path: "a.json", content: '{"x":1}' },
			{ path: "b.md", content: "hello" },
			{ path: "a.json", content: '{"y":2}' },
		];
		const result = mergeFiles(files);
		expect(result).toHaveLength(2);
		expect(JSON.parse(result[0].content)).toEqual({ x: 1, y: 2 });
		expect(result[1].content).toBe("hello");
	});
});

describe("deepMerge", () => {
	it("merges flat objects", () => {
		expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
	});

	it("overwrites primitives with source values", () => {
		expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
	});

	it("recursively merges nested objects", () => {
		const target = { a: { b: 1, c: 2 } };
		const source = { a: { c: 3, d: 4 } };
		expect(deepMerge(target, source)).toEqual({ a: { b: 1, c: 3, d: 4 } });
	});

	it("concatenates arrays", () => {
		expect(deepMerge({ a: [1] }, { a: [2] })).toEqual({ a: [1, 2] });
	});

	it("overwrites non-object with object from source", () => {
		expect(deepMerge({ a: 1 }, { a: { nested: true } })).toEqual({ a: { nested: true } });
	});

	it("does not mutate the target", () => {
		const target = { a: { b: 1 } };
		const result = deepMerge(target, { a: { c: 2 } });
		expect(target).toEqual({ a: { b: 1 } });
		expect(result).toEqual({ a: { b: 1, c: 2 } });
	});

	it("handles empty source", () => {
		expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
	});

	it("handles empty target", () => {
		expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
	});
});
