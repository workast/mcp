import type { TaskActivitySearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskId: z.string().describe('Task ID'),
  type: z.string().optional().describe('Activity type, e.g. comment'),
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
      description: 'List activity on a task. Optionally filter by type (e.g. comment).',
      inputSchema,
      annotations: {
        title: 'List Task Activity',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const query: TaskActivitySearchQuery = {
        limit: args.limit,
        skip: args.skip,
      };
      if (args.type) {
        query.type = [args.type] as TaskActivitySearchQuery['type'];
      }
      const result = await workast.tasks.activities.list(args.taskId, query);
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
