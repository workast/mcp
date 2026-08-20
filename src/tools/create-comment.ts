import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskId: z.string().describe('Task ID'),
  comment: z.string().describe('Comment text'),
});

export function registerCreateComment(server: McpServer): void {
  server.registerTool(
    'create_comment',
    {
      description: 'Add a top-level comment to a task.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.tasks.activities.create(args.taskId, {
        type: 'comment',
        value: args.comment,
      })
    )),
  );
}
