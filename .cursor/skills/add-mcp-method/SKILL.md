---
name: add-mcp-method
description: >-
  Adds a Workast MCP tool that wraps one @workast/sdk method: red mock-fetch
  test, tool file under src/tools, explicit register in create-handler. Use when
  adding an MCP tool, wrapping an SDK verb (tasks_create, tasks_retrieve, …),
  or extending the agent MCP surface; not for OAuth, well-known routes, or
  auto-registries.
---

# Add an MCP tool

Copy `src/tools/tasks-create.ts` and `test/tools/tasks-create.test.ts`. One SDK method → one tool file + one test file. Explicit import in `src/create-handler.ts` — no auto-registry. Auth stays in `src/auth/verify-api-key.ts`; tools only read `ctx.http?.authInfo?.token`. Types come from `@workast/sdk`, not hand-copied models. Do not add OAuth, retries, or extra abstraction layers.

Canonical example: `tasks_create` → `workast.tasks.create(listId, body)` via `createWorkast` in `src/workast.ts`.

## Layout

| Piece | Path |
| --- | --- |
| Tool | `src/tools/<ns>-<verb>.ts` |
| Test | `test/tools/<ns>-<verb>.test.ts` |
| Register | `src/create-handler.ts` (call the register fn next to `registerTasksCreate`) |
| Route | `app/mcp/route.ts` — already mounts `createHandler()`; do not register tools here |
| Client | `src/workast.ts` — `createWorkast(apiKey, { fetch?, baseUrl? })` |
| Auth | `src/auth/verify-api-key.ts` — do not change for a new tool |
| Helpers | `test/helpers.ts` — `makeCreateWorkast`, `mockFetch`, `mcpRequest`, `sseData`, … |

Tool name is `namespace_verb` (MCP): `tasks_create`, `tasks_retrieve`. File slug uses hyphens: `tasks-create.ts`.

## 1. Resolve the SDK method

In `@workast/sdk` (or the SDK skill / swagger Public operation), record: resource method, path ids, body/query type, success type, HTTP method + path. If the SDK method does not exist yet, add it in the SDK repo first — this MCP skill only wraps shipped SDK methods.

## 2. Red mock-fetch test first

Add `test/tools/<ns>-<verb>.test.ts`. Reuse helpers from `test/helpers.ts`:

- `makeCreateWorkast()` — injects mock `fetch` into `createWorkast`
- `createHandler({ createWorkast })` — wire the handler under test
- `mcpRequest('tasks_create', { … })` — JSON-RPC `tools/call` with Bearer key
- `sseData` / `getRequest` — assert tool result and outbound HTTP

Mirror `test/tools/tasks-create.test.ts`:

1. Happy path: assert method, full URL (`${DEFAULT_BASE_URL}` + path), `Authorization: Bearer ${API_KEY}`, JSON body, tool content = `JSON.stringify(fixture)`.
2. SDK error (e.g. 401): assert HTTP 200 MCP response, `result.isError === true`, message includes status — not an unhandled throw.

Do not hit live Workast. Keep fixtures small and local (see `createdTask` in helpers, or add a fixture next to the new test).

## 3. Implement the tool

Add `src/tools/<ns>-<verb>.ts`. Pattern from `tasks-create`:

- Export `registerTasksCreate(server, deps?)` (name = `register` + PascalCase tool).
- Optional deps: `{ createWorkast? }` so tests inject mock fetch; default to `../workast`.
- `server.registerTool('tasks_create', { description, inputSchema }, handler)`.
- Zod `inputSchema`: path ids first (`listId`, …), then swagger/SDK body fields as optional/required Zod fields — do not invent fields. Cast the body slice to the SDK type (`TaskCreate`, …) from `@workast/sdk`.
- Handler: read `const token = ctx.http?.authInfo?.token`; missing → failed tool result. `makeClient(token)` → call the SDK method. Success → `{ content: [{ type: 'text', text: JSON.stringify(result) }] }`. Catch `ApiError` → failed tool result with `message (status)`; rethrow unknowns.

```ts
import { ApiError, type TaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createWorkast as defaultCreateWorkast } from '../workast';

// registerTool('tasks_create', …) → workast.tasks.create(listId, body)
```

## 4. Register explicitly

In `src/create-handler.ts`:

1. Import `registerTasksRetrieve` (or whatever) from `./tools/<ns>-<verb>`.
2. Call it inside the `createMcpHandler` callback next to `registerTasksCreate(server, deps)`.
3. Pass the same `deps` so tests can inject `createWorkast`.

`app/mcp/route.ts` stays a thin mount — do not add tool imports there.

Do not create a tool registry, barrel export of all tools, or dynamic loader.

## 5. Auth stays put

`verifyApiKey` + `withMcpAuth(..., { required: true })` already wrap the handler. New tools must not parse `Authorization` themselves. Only use `ctx.http?.authInfo?.token` as the Workast API key.

## 6. Verify

From this MCP repo:

```bash
nvm use
npm test
npm run build
```

Do not start the next tool until green.

## Conventions

- Naming: MCP `tasks_retrieve` → files `tasks-retrieve.ts` / `tasks-retrieve.test.ts` → `registerTasksRetrieve`.
- Input = path ids + SDK body/query fields only; types from `@workast/sdk`.
- Return JSON text content; map `ApiError` to `isError: true` tool results.
- Keep `ping` as the no-API health tool behind the same auth wrapper.
- Agent host only — no OAuth, no `/.well-known/*`.
