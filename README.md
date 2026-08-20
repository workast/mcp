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
| `list_spaces` | List spaces (`type`, `participants`) |
| `create_space` | Create a space (`name`, optional `participants`, `privacy`) |
| `add_space_participants` | Add users to a space (`spaceId`, `users`) |
| `list_space_participants` | List space participants (`spaceId`) |
| `create_sublist` | Create a sublist (`spaceId`, `name`) |
| `list_coworkers` | List teammates |
| `about_me` | Current user and team |
| `search_tasks` | Search tasks with filters (`spaceId`, `statusIs`, …) |
| `retrieve_task` | Get a task (`taskId` or `shortId`) |
| `create_tasks` | Create tasks in a space (`spaceId`, `tasks[]`) |
| `create_subtasks` | Create subtasks (`parentTaskId`, `subtasks[]`) |
| `update_tasks` | Patch tasks (`taskIds[]` plus fields; no `status`) |
| `complete_tasks` | Mark tasks done (`taskIds[]`) |
| `create_comment` | Comment on a task (`taskId`, `comment`) |
| `list_task_activity` | Task activity (`taskId`, optional `type`) |
| `list_meetings` | List meetings (`startDateAfter`, `startDateBefore`, `participants`) |
| `retrieve_meeting` | Get a meeting (`meetingId`, optional `includeTranscript`) |
| `list_fields` | List custom fields (optional `spaceId`) |
| `create_field` | Create a field and enable it on a space |
| `list_reports` | List saved reports (optional `home`) |
| `retrieve_report` | Get a report and its tasks (`reportId`, optional `getTasks`) |

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

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT
