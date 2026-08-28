import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskId: z.string().optional().describe('Task ID'),
  shortId: z.string().optional().describe('Task short ID'),
});

export function registerRetrieveTask(server: McpServer): void {
  server.registerTool(
    'workast_retrieve_task',
    {
      title: 'Retrieve Task',
      description: 'Retrieve a task by ID or short ID.',
      inputSchema,
      annotations: {
        title: 'Retrieve Task',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => {
      if (!args.taskId && !args.shortId) {
        return {
          content: [{ type: 'text' as const, text: 'Provide taskId or shortId' }],
          isError: true,
        };
      }
      return runWorkast(ctx.http?.authInfo?.token, async (workast) => {
        if (args.taskId) {
          return workast.tasks.retrieve(args.taskId);
        }
        return workast.tasks.retrieveByShortId(args.shortId as string);
      });
    },
  );
}
