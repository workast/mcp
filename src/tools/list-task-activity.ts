import type { TaskActivities, TaskActivitySearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const outputSchema = z.looseObject({
  count: z.number(),
  skip: z.number(),
  has_more: z.boolean(),
  next_skip: z.number().nullable(),
});

const inputSchema = z.object({
  taskId: z.string().describe('Task ID'),
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Maximum number of activities to return (1–200)'),
  skip: z.number().int().min(0).default(0)
    .describe('Number of activities to skip'),
});

export function registerListTaskActivity(server: McpServer): void {
  server.registerTool(
    'workast_list_task_activity',
    {
      title: 'List Task Activity',
      description: 'List activity on a task.',
      inputSchema,
      outputSchema,
      annotations: {
        title: 'List Task Activity',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_task_activity', async (workast) => {
      const query: TaskActivitySearchQuery = {
        limit: args.limit,
        skip: args.skip,
      };
      const result: TaskActivities = await workast.tasks.activities.list(args.taskId, query);
      const count = result.activities.length;
      const has_more = args.skip + count < result.total;
      return {
        ...result,
        count,
        skip: args.skip,
        has_more,
        next_skip: has_more ? args.skip + count : null,
      };
    }),
  );
}
