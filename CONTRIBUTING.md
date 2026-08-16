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

## Add a tool

To wrap another `@workast/sdk` method as an MCP tool, follow [`.cursor/skills/add-mcp-method/SKILL.md`](.cursor/skills/add-mcp-method/SKILL.md). Copy the `tasks_create` slice (`src/tools/tasks-create.ts`, `test/tools/tasks-create.test.ts`, explicit register in `src/create-handler.ts`).