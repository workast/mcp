# Contributing

Pull requests are welcome. Keep them focused, match the style of the surrounding code, and include tests for behavior you change.

## Setup

Node.js 20+ (this repo’s `.nvmrc` is 24 for local/CI).

```sh
nvm use
npm install
cp .env.sample .env
npm test
npm run build
npm run dev
```

Point the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) at `http://localhost:3000/mcp` and authorize when it asks. To test headless access, send a key on the `Authorization` header instead.

## Environment

| Variable | Values | Default |
| --- | --- | --- |
| `WORKAST_AUTH_URL` | Workast account service (same value as auth `AUTH_URL`) | `https://my.workast.com` |
| `MCP_PUBLIC_ORIGIN` | Public origin of this server, no path | unset (request origin). Set this in production |
| `WORKAST_API_URL` | Workast API origin | `https://api.workast.com` |
| `CUSTOMERIO_WRITE_KEY` | Customer.io CDP write key | unset (analytics off) |
| `CUSTOMERIO_HOST` | Customer.io CDP host | Customer.io default |
| `LOG_LEVEL` | pino log level | `info` |

## Run tool evals

[mcp-eval-gateway](https://github.com/guillegette/mcp-eval-gateway) scores LLM tool use against the in-process `/mcp` handler. It does not start the dev server.

Copy `.env.sample` to `.env` and set `AI_GATEWAY_API_KEY`, `WORKAST_API_KEY`, and `WORKAST_MCP_TOKEN`. `WORKAST_API_KEY` is the privileged key for setup and teardown. `WORKAST_MCP_TOKEN` is the bearer on MCP calls during the run, so permission errors an MCP token would hit still show up. Set `WORKAST_API_URL` when the API is not `https://api.workast.com`.

```sh
nvm use
npm run eval
```

The runner loads `eval/config.ts` and `eval/tasks.yaml`. Before and after the tasks, it resets the McpEval spaces: Marketing, Product, Design, Bugs, Bug Reports, and Fixtures stay, any other active space whose name starts with McpEval is archived, and the fixture tasks are restored. Starter spaces outside that prefix are left alone. Personal tasks whose summary contains McpEval are deleted.

## Add a tool

To wrap another `@workast/sdk` method as an MCP tool, copy an existing slice (for example `src/tools/create-tasks.ts` and `test/tools/create-tasks.test.ts`) and register it explicitly in `src/create-handler.ts`.
