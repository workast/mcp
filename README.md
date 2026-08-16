# Workast MCP

[![CI](https://github.com/workast/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/workast/mcp/actions/workflows/ci.yml)

Agent MCP host for [Workast](https://workast.com/). Exposes Model Context Protocol tools over Streamable HTTP at `/mcp`, authenticated with a Workast API key.

Public URL (agent deploy): `https://agent.workast.com/mcp`

A workspace-scoped API key locks tools to that workspace. Create a key in Workast under **Preferences → API**.

> OAuth for end-user clients (`mcp.workast.com`) comes later. This host is API-key only.

## Cursor

Add to your Cursor `mcp.json`:

```json
{
  "mcpServers": {
    "workast": {
      "url": "https://agent.workast.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:WORKAST_API_KEY}"
      }
    }
  }
}
```

Set `WORKAST_API_KEY` in your environment (or Cursor’s env config) to a Workast secret API key.

## Tools

| Tool | Description |
| --- | --- |
| `ping` | Health check (requires auth) |
| `tasks_create` | Create a task in a list (`listId`, `text`, plus optional TaskCreate fields) |

## Local development

```sh
nvm use
npm install
npm test
npm run build
npm run dev
```

Then point the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) at Streamable HTTP → `http://localhost:3000/mcp` and send an `Authorization: Bearer <your-api-key>` header.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
