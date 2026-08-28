import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskId: z.string().describe('Task ID'),
  comment: z.string().describe('Comment text'),
});

export function registerCreateComment(server: McpServer): void {
  server.registerTool(
    'workast_create_comment',
    {
      title: 'Create Comment',
      description: 'Add a top-level comment to a task.',
      inputSchema,
      annotations: {
        title: 'Create Comment',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.tasks.activities.create(args.taskId, {
        type: 'comment',
        value: args.comment,
      })
    )),
  );
}
