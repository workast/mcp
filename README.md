# Workast MCP

[![CI](https://github.com/workast/mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/workast/mcp/actions/workflows/ci.yml)

MCP host for [Workast](https://workast.com/). Exposes Model Context Protocol tools over Streamable HTTP at `https://mcp.workast.com/mcp`.

Authenticate with either:

- A Workast API key via `Authorization: Bearer …`
- OAuth at workast-auth: connect with no Authorization header; the client follows the 401 challenge to workast-auth, then sends `Authorization: Bearer wat::…`

OAuth discovery uses RFC 9728 Protected Resource Metadata at `/.well-known/oauth-protected-resource`. CIMD and token issuance live on workast-auth.

A workspace-scoped API key locks tools to that workspace. Create a key in Workast under **Preferences → API**.

## Skill

The server serves one Agent Skill, `workast`, from `skills/workast/SKILL.md` at `skill://workast/SKILL.md`. Initialize advertises the `io.modelcontextprotocol/skills` extension. Clients list it with `skills/list`, fetch one entry with `skills/get`, and read the file with `resources/read`.

## Environment

| Variable | Values | Default |
| --- | --- | --- |
| `WORKAST_AUTH_URL` | Issuer URL of workast-auth (same string as auth `AUTH_URL` / well-known `issuer`) | `https://my.workast.com` |
| `MCP_PUBLIC_ORIGIN` | Public origin, no path (e.g. `https://mcp.workast.com`) | unset (request origin). Required in production so the 401 challenge and `resource` stay stable |
| `WORKAST_API_URL` | Workast API origin passed to the SDK as `baseUrl` (for example `http://localhost:8080`) | SDK default (`https://api.workast.com`) |
| `CUSTOMERIO_WRITE_KEY` | Customer.io CDP write key | unset (analytics no-op) |
| `CUSTOMERIO_HOST` | Customer.io CDP host (for example `https://cdp-eu.customer.io`) | Customer.io default |
| `LOG_LEVEL` | pino log level | `info` |

## Cursor

API key:

```json
{
  "mcpServers": {
    "workast": {
      "url": "https://mcp.workast.com/mcp",
      "headers": {
        "Authorization": "Bearer ${env:WORKAST_API_KEY}"
      }
    }
  }
}
```

Set `WORKAST_API_KEY` in your environment (or Cursor’s env config) to a Workast secret API key.

OAuth (client follows the 401 challenge to workast-auth):

```json
{
  "mcpServers": {
    "workast": {
      "url": "https://mcp.workast.com/mcp"
    }
  }
}
```

## Tools

| Tool | Description |
| --- | --- |
| `workast_ping` | Health check (requires auth) |
| `workast_list_spaces` | List active spaces (optional `type`, `participants`, `includeArchived`, `limit`, `skip`) |
| `workast_create_space` | Create a space (`name`, optional `participants`, `privacy`) |
| `workast_add_space_participants` | Add users to a space (`spaceId`, `users`) |
| `workast_list_space_participants` | List space participants (`spaceId`) |
| `workast_update_space` | Update a space (`name`, `readme`, `defaultList`, lists add/rename/remove, fields add/remove) |
| `workast_list_coworkers` | List teammates (`limit`, `offset`) |
| `workast_about_me` | Current user and team |
| `workast_search_tasks` | Search tasks with filters (`spaceId`, `statusIs`, `limit`, `skip`, …) |
| `workast_retrieve_tasks` | Get tasks (`taskIds[]` or `shortIds[]`) |
| `workast_create_tasks` | Create tasks in a space (`spaceId`, `tasks[]`) |
| `workast_create_personal_tasks` | Create personal tasks (`tasks[]`, no `spaceId`) |
| `workast_create_subtasks` | Create subtasks (`parentTaskId`, `subtasks[]`) |
| `workast_update_tasks` | Patch tasks (`taskIds[]` plus fields; no `status`) |
| `workast_complete_tasks` | Mark tasks done (`taskIds[]`) |
| `workast_create_comment` | Comment on a task (`taskId`, `comment`) |
| `workast_list_task_activity` | Task activity (`taskId`, `limit`, `skip`) |
| `workast_list_meetings` | List meetings (`startDateAfter`, `startDateBefore`, optional `participants`, `limit`, `pageToken`) |
| `workast_retrieve_meeting` | Get a meeting (`meetingId`, optional `includeTranscript`) |
| `workast_list_fields` | List custom fields (optional `spaceId`) |
| `workast_create_field` | Create a field and enable it on a space (`spaceId`, `name`, `type`, optional `options`) |
| `workast_update_field` | Update a custom field (`fieldId`, optional `name`, `description`, `options`) |
| `workast_list_reports` | List saved reports (optional `home`, `limit`, `skip`) |
| `workast_retrieve_report` | Get a report and its tasks (`reportId`, `getTasks` default 25) |

Paginated list and search tools accept page size and offset (`limit`/`skip`, or `limit`/`offset` for coworkers). Meetings use `limit` (sent as `maxResults`) and an optional `pageToken`. Those responses include `has_more` and the next page cursor (`next_skip`, `next_offset`, or `nextPageToken`) so clients can keep paging.

## Local development

```sh
nvm use
npm install
cp .env.sample .env
npm test
npm run build
npm run dev
```

Point the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) or MCPJam at Streamable HTTP → `http://localhost:3000/mcp` and either send `Authorization: Bearer <your-api-key>` or connect with no Authorization header so OAuth discovery runs via `/.well-known/oauth-protected-resource`. The issuer defaults to `https://my.workast.com`; set `WORKAST_AUTH_URL` when workast-auth is somewhere else. Production MCP URL: `https://mcp.workast.com/mcp`.

## Run tool evals

[mcp-eval-gateway](https://github.com/guillegette/mcp-eval-gateway) scores LLM tool use against the in-process `/mcp` handler. It does not start `next dev`.

Copy `.env.sample` to `.env` and set `AI_GATEWAY_API_KEY` and `WORKAST_API_KEY`.

`WORKAST_API_KEY` is sent as the Bearer token. The starter `ping` task does not call the Workast API, so any non-blank value works for that task. Tasks that call Workast tools need a real workspace API key. Set `WORKAST_API_URL` when that API is not `https://api.workast.com`.

Then run the evals:

```sh
nvm use
npm run eval
```

The runner loads `eval/config.ts` and `eval/tasks.yaml`. The config sets a current-date `systemPrompt` that includes the Workast skill body. `before` archives active spaces whose names contain `McpEval`, `holiday campaign`, or `comp planning` (skipping spaces the token is not a participant of), seeds `McpEval Marketing`, `McpEval Product`, `McpEval Design`, and `McpEval Bugs` when missing, and reopens the three short-ID batch tasks. `after` archives those same spaces and deletes the write-eval tasks. Add tasks there as you add tools.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT
