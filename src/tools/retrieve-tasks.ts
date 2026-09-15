import { ApiError, TimeoutError, type Task } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import {
  entitySchema,
  errorEntrySchema,
  runWorkast,
  ToolError,
  toolErrorEntry,
  type ToolErrorEntry,
} from '../run-tool';

const inputSchema = z.object({
  taskIds: z.array(z.string()).optional().describe('Task IDs to retrieve'),
  shortIds: z.array(z.string()).optional().describe('Task short IDs to retrieve (e.g. TQ7ZK)'),
});

export function registerRetrieveTasks(server: McpServer): void {
  server.registerTool(
    'workast_retrieve_tasks',
    {
      title: 'Retrieve Tasks',
      description: 'Retrieve one or more tasks by ID or short ID.',
      inputSchema,
      outputSchema: z.object({
        tasks: z.array(entitySchema),
        errors: z.array(errorEntrySchema).optional(),
      }),
      annotations: {
        title: 'Retrieve Tasks',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_retrieve_tasks', async (workast) => {
      const taskIds = args.taskIds ?? [];
      const shortIds = args.shortIds ?? [];
      if (taskIds.length === 0 && shortIds.length === 0) {
        throw new ToolError([{
          param: 'taskIds',
          message: 'Provide taskIds or shortIds',
          suggestion: 'Provide at least one task ID or short ID.',
        }]);
      }
      const tasks: Task[] = [];
      const errors: ToolErrorEntry[] = [];
      const lookups = [
        ...taskIds.map((id, i) => ({
          param: `taskIds[${i}]`,
          retrieve: () => workast.tasks.retrieve(id),
        })),
        ...shortIds.map((id, i) => ({
          param: `shortIds[${i}]`,
          retrieve: () => workast.tasks.retrieveByShortId(id),
        })),
      ];

      for (const { param, retrieve } of lookups) {
        try {
          tasks.push(await retrieve());
        } catch (error) {
          if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
            errors.push(toolErrorEntry(error, param));
            continue;
          }
          if ((error instanceof ApiError && error.status === 401) || error instanceof TimeoutError) {
            if (tasks.length === 0) {
              throw error;
            }
            errors.push(toolErrorEntry(error, param));
            break;
          }
          throw error;
        }
      }

      if (errors.length === 0) {
        return { tasks };
      }
      if (tasks.length > 0) {
        return { tasks, errors };
      }
      throw new ToolError(errors, { tasks: [] });
    }),
  );
}
