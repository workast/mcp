---
name: add-mcp-method
description: >-
  Adds a Workast MCP tool that wraps one @workast/sdk method: red mockWorkast
  test, tool file under src/tools, explicit register in create-handler. Use when
  adding an MCP tool, wrapping an SDK verb (create_tasks, retrieve_task, …),
  or extending the agent MCP surface; not for OAuth, well-known routes, or
  auto-registries.
---

# Add an MCP tool

Copy a nearby tool (for example `src/tools/create-tasks.ts` and `test/tools/create-tasks.test.ts`). One SDK method → one tool file + one test file. Explicit import in `src/create-handler.ts` — no auto-registry. Auth stays in `src/auth/verify-api-key.ts`; tools only read `ctx.http?.authInfo?.token`. Types and examples come from `@workast/sdk` / `@workast/sdk/mock`. Do not add OAuth, retries, or extra abstraction layers.

Canonical example: `workast_create_tasks` → `workast.tasks.create(spaceId, body)` via `createWorkast` in `src/workast.ts`. Tool args use UI names (`spaceId`, `reportId`); SDK paths stay `/list`, `/search`. Tool names always use the `workast_` prefix.

## Layout

| Piece | Path |
| --- | --- |
| Tool | `src/tools/<tool-name>.ts` |
| Test | `test/tools/<tool-name>.test.ts` |
| Register | `src/create-handler.ts` (call the register fn next to the other `register*` calls) |
| Route | `app/mcp/route.ts` — already mounts `createHandler()`; do not register tools here |
| Client | `src/workast.ts` — `createWorkast(apiKey)` |
| Auth | `src/auth/verify-api-key.ts` — do not change for a new tool |
| Run | `src/run-tool.ts` — `runWorkast(token, fn)` (missing token + `ApiError`) |
| Helpers | `test/helpers.ts` — `setupWorkastMock`, `callTool`, `expectToolData`, `mcpRequest` |

Tool name is the MCP name with a `workast_` prefix: `workast_list_spaces`, `workast_create_tasks`, `workast_retrieve_report`. File slug uses hyphens: `list-spaces.ts`. Register fn is `register` + PascalCase tool: `registerListSpaces`. Every new tool must set `title` and annotations: `readOnlyHint`, `destructiveHint`, `idempotentHint` as appropriate, and `openWorldHint: false`.

## 1. Resolve the SDK method

In `@workast/sdk` (or the SDK skill / swagger Public operation), record: resource method, path ids, body/query type, success type. If the SDK method does not exist yet, add it in the SDK repo first — this MCP skill only wraps shipped SDK methods.

Map UI ids to SDK ids in the handler only: `spaceId` → list id, `reportId` → search id. Do not expose `listId` in the tool schema.

## 2. Red mockWorkast test first

Add `test/tools/<tool-name>.test.ts`. Copy `test/tools/create-tasks.test.ts`. Reuse helpers from `test/helpers.ts`:

- `setupWorkastMock()` — patches every `Workast` instance, including the real `createWorkast` client
- `callTool(createHandler(), name, args)` — JSON-RPC `tools/call` with Bearer key
- `expectToolData` / `expectUnauthorizedTool` — assert tool result JSON

Tests call `createHandler()`. `mockWorkast()` intercepts SDK methods on the live client.

1. Happy path: `.on(expectedSdkArgs).resolves(examples.*)` then `callTool` then `expectToolData` plus `mock.calls()` for SDK method + args. Use `examples.list.id`, `examples.task.id`, `examples.task.text`, `examples.user.id`, `examples.customField.id`, `examples.task.shortId` — never `'list-1'` / `'task-1'`. Success JSON is the SDK example as returned (pass-through).
2. SDK 401: `.rejects(errors.unauthorized)` then HTTP 200 MCP response and `expectUnauthorizedTool`. For multi-arg methods, match the same `.on(...)` args as the happy path.
3. Void SDK methods (`.resolves()` with no value): tool result `{ ok: true }`.
4. Multi-call tools queue one interceptor per SDK call and assert `mock.calls()` length and order.

`.on()` is a prefix match. Nested objects match regardless of key order. Do not assert HTTP method, URL, or `Authorization`. Do not invent slim card objects or local fixture files.

When the tool has optional filters, call the SDK with **no argument** when none are set (`lists.list()`, not `lists.list({})`). Pass only the keys that were set.

Import `examples` / `errors` from `@workast/sdk/mock`. Do not hit live Workast.

## 3. Implement the tool

Add `src/tools/<tool-name>.ts`. Pattern from `create-tasks`:

- Export `registerCreateTasks(server)` (name = `register` + PascalCase tool).
- Call `runWorkast` from `../run-tool`. Do not take a `createWorkast` dependency in the tool file.
- `server.registerTool('workast_create_tasks', { title, description, inputSchema, annotations }, handler)`.
- Zod `inputSchema`: UI path ids first (`spaceId`, `taskId`, …), then swagger/SDK body fields as optional/required Zod fields — do not invent fields. Cast the body slice to the SDK type (`TaskCreate`, …) from `@workast/sdk`.
- Handler: `runWorkast(ctx.http?.authInfo?.token, async (workast) => { … })`. Success → JSON text of the SDK return value (or `{ ok: true }` when the SDK is void). `ApiError` → failed tool result with `message (status)`; unknowns rethrow.

```ts
import type { TaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

// registerTool('workast_create_tasks', …) → workast.tasks.create(spaceId, body)
```

## 4. Register explicitly

In `src/create-handler.ts`:

1. Import `registerRetrieveTask` (or whatever) from `./tools/<tool-name>`.
2. Call it inside the `createMcpHandler` callback next to the other `register*` calls.

`app/mcp/route.ts` stays a thin mount — do not add tool imports there.

Do not create a tool registry, barrel export of all tools, or dynamic loader.

## 5. Auth stays put

`verifyApiKey` + `withMcpAuth(..., { required: true })` already wrap the handler. New tools must not parse `Authorization` themselves. Only use `ctx.http?.authInfo?.token` as the Workast API key.

## 6. Verify

From this MCP repo:

```bash
nvm use
npm test -- test/tools/<tool-name>.test.ts
npm run build
```

Do not start the next tool until green.

## Conventions

- Naming: MCP `workast_retrieve_task` → files `retrieve-task.ts` / `retrieve-task.test.ts` → `registerRetrieveTask`. Always prefix tool names with `workast_`.
- Every tool sets `title` plus annotations (`readOnlyHint` / `destructiveHint` / `idempotentHint` / `openWorldHint: false`).
- Input = UI ids (`spaceId`, not `listId`) + SDK body/query fields; types from `@workast/sdk`.
- Return JSON text content (SDK payload pass-through); map `ApiError` to `isError: true` tool results.
- Keep `workast_ping` as the no-API health tool behind the same auth wrapper.
