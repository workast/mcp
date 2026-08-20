import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskIds: z.array(z.string()).min(1).describe('Task IDs to complete'),
});

export function registerCompleteTasks(server: McpServer): void {
  server.registerTool(
    'complete_tasks',
    {
      description: 'Mark one or more tasks as done.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      for (const taskId of args.taskIds) {
        await workast.tasks.complete(taskId);
      }
      return { ok: true };
    }),
  );
}
