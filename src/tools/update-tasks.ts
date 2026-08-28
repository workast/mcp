import type { TaskPatch } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  taskIds: z.array(z.string()).min(1).describe('Task IDs to update'),
  text: z.string().optional().describe('Task summary'),
  description: z.string().optional().describe('Task description'),
  startDate: z.string().optional().describe('Start date'),
  dueDate: z.string().optional().describe('Due date'),
  dueDateTimezone: z.string().optional().describe('Due date timezone'),
  dueDateTime: z.string().optional().describe('Due date time'),
  subListId: z.string().optional().describe('Sublist ID'),
  listPosition: z.number().optional().describe('Position in the space'),
  fields: z
    .array(z.object({
      id: z.string(),
      value: z.string(),
    }))
    .optional()
    .describe('Custom field values to upsert'),
});

export function registerUpdateTasks(server: McpServer): void {
  server.registerTool(
    'workast_update_tasks',
    {
      title: 'Update Tasks',
      description: 'Update one or more tasks. Does not change status; use workast_complete_tasks to complete.',
      inputSchema,
      annotations: {
        title: 'Update Tasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const { taskIds, ...rest } = args;
      const patch = rest as TaskPatch;

      for (const taskId of taskIds) {
        await workast.tasks.update(taskId, patch);
      }
      return { ok: true };
    }),
  );
}
