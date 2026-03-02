---
name: add-mcp
description: Guide the user through configuring an MCP server in dotai
---

# Add MCP Server

Configure a new MCP (Model Context Protocol) server in `.ai/config.yaml`.

## Process

1. Ask the user for the server name (e.g. `github`, `postgres`)
2. Ask for the transport type: stdio, http, or sse
3. For stdio: ask for the command and optional args
4. For http/sse: ask for the URL
5. Ask about optional environment variables
6. Add the server entry to the `mcpServers` section of `.ai/config.yaml`

## Config Location

```
.ai/config.yaml → mcpServers section
```

## Config Format

```yaml
mcpServers:
  server-name:
    transport: stdio
    command: npx -y @example/mcp-server
    args: []
    env:
      API_KEY: "${API_KEY}"
```

## Transport Types

- **stdio** — local process, requires `command` (and optional `args`)
- **http** — HTTP endpoint, requires `url`
- **sse** — Server-Sent Events endpoint, requires `url`

## Valid Fields

- `transport` (string) — "stdio", "http", or "sse"
- `command` (string) — shell command for stdio transport
- `url` (string) — endpoint URL for http/sse transport
- `args` (string[]) — command arguments for stdio
- `env` (object) — environment variables passed to the server
- `enabledTools` (string[]) — only expose these tools
- `disabledTools` (string[]) — hide these tools
- `headers` (object) — custom HTTP headers for http/sse
- `oauth` (object) — OAuth config with `clientId` and optional `callbackPort`

## After Configuring

Run `dotai sync` to propagate the MCP server config to your AI tools.
