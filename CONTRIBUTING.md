# Contributing

Pull requests are welcome. Keep them focused, match the style of the surrounding code, and include tests for behavior you change.

## Setup

Node.js 20+ (this repo’s `.nvmrc` is 24 for local/CI).

```sh
nvm use
npm install
npm test
npm run build
```

To score LLM tool use against the MCP handler, add `AI_GATEWAY_API_KEY` and `WORKAST_API_KEY` to `.env` and run `npm run eval`. See the *Run tool evals* section of [README.md](README.md).

## Add a tool

To wrap another `@workast/sdk` method as an MCP tool, follow [`.cursor/skills/add-mcp-method/SKILL.md`](.cursor/skills/add-mcp-method/SKILL.md). Copy an existing slice (for example `src/tools/create-tasks.ts` and `test/tools/create-tasks.test.ts`) and register it explicitly in `src/create-handler.ts`.
