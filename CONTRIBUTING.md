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

Copy `.env.sample` to `.env` and set `AI_GATEWAY_API_KEY` and `WORKAST_API_KEY`. Tasks that call Workast need a real workspace key. Set `WORKAST_API_URL` when the API is not `https://api.workast.com`.

```sh
nvm use
npm run eval
```

The runner loads `eval/config.ts` and `eval/tasks.yaml`. Before the tasks, it archives active spaces whose names contain `McpEval`, `holiday campaign`, or `comp planning`, seeds the `McpEval` spaces when they are missing, and reopens the batch tasks. After the tasks, it archives those spaces and deletes the write-eval tasks.

## Add a tool

To wrap another `@workast/sdk` method as an MCP tool, copy an existing slice (for example `src/tools/create-tasks.ts` and `test/tools/create-tasks.test.ts`) and register it explicitly in `src/create-handler.ts`.
