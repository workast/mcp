import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast, toolErrorFrom } from '../run-tool';

const inputSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(50).describe('Task IDs to complete'),
});

export function registerCompleteTasks(server: McpServer): void {
  server.registerTool(
    'workast_complete_tasks',
    {
      title: 'Complete Tasks',
      description: 'Mark one or more tasks as done.',
      inputSchema,
      outputSchema: z.object({ succeeded: z.array(z.string()) }),
      annotations: {
        title: 'Complete Tasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_complete_tasks', async (workast) => {
      const succeeded = [];
      for (const [i, taskId] of args.taskIds.entries()) {
        try {
          await workast.tasks.complete(taskId);
          succeeded.push(taskId);
        } catch (error) {
          if (succeeded.length > 0) {
            toolErrorFrom(error, `taskIds[${i}]`, { succeeded });
          }
          throw error;
        }
      }
      return { succeeded };
    }),
  );
}
