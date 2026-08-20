import type { TaskActivitySearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskId: z.string().describe('Task ID'),
  type: z.string().optional().describe('Activity type, e.g. comment'),
});

export function registerListTaskActivity(server: McpServer): void {
  server.registerTool(
    'list_task_activity',
    {
      description: 'List activity on a task. Optionally filter by type (e.g. comment).',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      if (args.type) {
        return workast.tasks.activities.list(args.taskId, {
          type: [args.type] as TaskActivitySearchQuery['type'],
        });
      }
      return workast.tasks.activities.list(args.taskId);
    }),
  );
}
