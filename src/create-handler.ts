import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { z } from 'zod';
import { verifyApiKey } from './auth/verify-api-key';
import { registerTasksCreate, type TasksCreateDeps } from './tools/tasks-create';

export function createHandler(deps: TasksCreateDeps = {}) {
  const handler = createMcpHandler((server) => {
    server.registerTool(
      'ping',
      {
        description: 'Health check. Returns ok.',
        inputSchema: z.object({}),
      },
      async () => ({
        content: [{ type: 'text', text: 'ok' }],
      }),
    );

    registerTasksCreate(server, deps);
  });

  return withMcpAuth(handler, verifyApiKey, { required: true });
}
