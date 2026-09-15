import type { CommentActivity } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { entitySchema, runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskId: z.string().describe('Task ID'),
  comment: z.string().describe('Comment text'),
});

export function registerCreateComment(server: McpServer): void {
  server.registerTool(
    'workast_create_comment',
    {
      title: 'Create Comment',
      description: 'Add a comment to a task.',
      inputSchema,
      outputSchema: entitySchema,
      annotations: {
        title: 'Create Comment',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_comment', async (workast) => {
      const activity: CommentActivity = await workast.tasks.activities.create(args.taskId, {
        type: 'comment',
        value: args.comment,
      });
      return activity;
    }),
  );
}
