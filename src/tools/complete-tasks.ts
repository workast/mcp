import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskIds: z.array(z.string()).min(1).describe('Task IDs to complete'),
});

export function registerCompleteTasks(server: McpServer): void {
  server.registerTool(
    'workast_complete_tasks',
    {
      title: 'Complete Tasks',
      description: 'Mark one or more tasks as done.',
      inputSchema,
      annotations: {
        title: 'Complete Tasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      for (const taskId of args.taskIds) {
        await workast.tasks.complete(taskId);
      }
      return { ok: true };
    }),
  );
}
