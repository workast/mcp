# Workast MCP

[![CI](https://github.com/workast/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/workast/mcp/actions/workflows/ci.yml)

MCP host for [Workast](https://workast.com/). Exposes Model Context Protocol tools over Streamable HTTP at `/mcp`.

| Host | Mode | Auth |
| --- | --- | --- |
| `https://agent.workast.com/mcp` | `MCP_AUTH_MODE=agent` (default) | Workast API key (`Authorization: Bearer …`) |
| `https://mcp.workast.com/mcp` | `MCP_AUTH_MODE=user` | OAuth at workast-auth; send the WAT as `Authorization: Bearer wat::…` |

User-mode hosts discover OAuth via RFC 9728 Protected Resource Metadata at `/.well-known/oauth-protected-resource`. CIMD and token issuance live on workast-auth.

A workspace-scoped API key locks tools to that workspace. Create a key in Workast under **Preferences → API**.

## Environment

| Variable | Values | Default |
| --- | --- | --- |
| `MCP_AUTH_MODE` | `agent` \| `user` | `agent` |
| `WORKAST_AUTH_URL` | Issuer URL of workast-auth (same string as auth `AUTH_URL` / well-known `issuer`, e.g. `https://my.workast.com`) | required when mode is `user` |

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
| `workast_ping` | Health check (requires auth) |
| `workast_list_spaces` | List spaces (`type`, `participants`, `limit`, `skip`) |
| `workast_create_space` | Create a space (`name`, optional `participants`, `privacy`) |
| `workast_add_space_participants` | Add users to a space (`spaceId`, `users`) |
| `workast_list_space_participants` | List space participants (`spaceId`) |
| `workast_create_sublist` | Create a sublist (`spaceId`, `name`) |
| `workast_list_coworkers` | List teammates (`limit`, `offset`) |
| `workast_about_me` | Current user and team |
| `workast_search_tasks` | Search tasks with filters (`spaceId`, `statusIs`, `limit`, `skip`, …) |
| `workast_retrieve_task` | Get a task (`taskId` or `shortId`) |
| `workast_create_tasks` | Create tasks in a space (`spaceId`, `tasks[]`) |
| `workast_create_subtasks` | Create subtasks (`parentTaskId`, `subtasks[]`) |
| `workast_update_tasks` | Patch tasks (`taskIds[]` plus fields; no `status`) |
| `workast_complete_tasks` | Mark tasks done (`taskIds[]`) |
| `workast_create_comment` | Comment on a task (`taskId`, `comment`) |
| `workast_list_task_activity` | Task activity (`taskId`, optional `type`, `limit`, `skip`) |
| `workast_list_meetings` | List meetings (`startDateAfter`, `startDateBefore`, `participants`, `limit`, `pageToken`) |
| `workast_retrieve_meeting` | Get a meeting (`meetingId`, optional `includeTranscript`) |
| `workast_list_fields` | List custom fields (optional `spaceId`) |
| `workast_create_field` | Create a field and enable it on a space |
| `workast_list_reports` | List saved reports (optional `home`, `limit`, `skip`) |
| `workast_retrieve_report` | Get a report and its tasks (`reportId`, optional `getTasks`) |

List and search tools accept page size and offset (`limit`/`skip`, or `limit`/`offset` for coworkers). Meetings use `limit` (sent as `maxResults`) and an optional `pageToken`. Responses include `has_more` and the next page cursor (`next_skip`, `next_offset`, or `nextPageToken`) so clients can keep paging.

## Response size

Tool results are truncated at 25,000 characters. Oversized list responses set `truncated: true` and a `truncation_message` that tells the client to paginate or add filters. Use `limit`/`skip` (or `pageToken` for meetings) to fetch the rest.

## Local development

```sh
nvm use
npm install
npm test
npm run build
npm run dev
```

For agent mode, point the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) or MCPJam at Streamable HTTP → `http://localhost:3000/mcp` and send an `Authorization: Bearer <your-api-key>` header.

For user mode, set `MCP_AUTH_MODE=user` and `WORKAST_AUTH_URL` (the workast-auth issuer) and connect Inspector/MCPJam to `http://localhost:3000/mcp`. Production user-mode URL: `https://mcp.workast.com/mcp`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT
