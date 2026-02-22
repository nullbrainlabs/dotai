import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
	site: "https://nullbrainlabs.github.io",
	base: "/dotai",
	integrations: [
		starlight({
			title: "ai.",
			customCss: ["./src/styles/custom.css"],
			components: {
				PageTitle: "./src/components/PageTitle.astro",
			},
			description:
				"One config, every AI coding tool. Unified configuration for Claude Code, Cursor, Codex, and GitHub Copilot.",
			sidebar: [
				{
					label: "Getting Started",
					items: [
						{ slug: "getting-started/introduction" },
						{ slug: "getting-started/installation" },
						{ slug: "getting-started/quickstart" },
						{ slug: "getting-started/importing" },
					],
				},
				{
					label: "Concepts",
					items: [
						{ slug: "concepts/overview" },
						{ slug: "concepts/directives" },
						{ slug: "concepts/skills" },
						{ slug: "concepts/agents" },
						{ slug: "concepts/tool-servers" },
						{ slug: "concepts/hooks" },
						{ slug: "concepts/permissions" },
						{ slug: "concepts/settings" },
						{ slug: "concepts/ignore-patterns" },
					],
				},
				{
					label: "Supported Tools",
					items: [
						{ slug: "tools/compatibility" },
						{ slug: "tools/claude-code" },
						{ slug: "tools/cursor" },
						{ slug: "tools/codex" },
						{ slug: "tools/copilot" },
						{ slug: "tools/opencode" },
						{ slug: "tools/antigravity" },
					],
				},
				{
					label: "Reference",
					items: [
						{ slug: "reference/cli" },
						{ slug: "reference/config-yaml" },
						{ slug: "reference/glossary" },
						{ slug: "reference/patterns" },
					],
				},
			],
		}),
	],
});
