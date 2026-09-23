import type { TaskPatch } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { runWorkast, toolErrorFrom } from '../run-tool';

const inputSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(50).describe('Task IDs to update'),
  summary: z.string().optional().describe('Task summary (title). Prefer this over description.'),
  description: z.string().optional()
    .describe('Longer task details. Only set when extra context is needed beyond the summary.'),
  startDate: z.string().optional().describe('Start date as YYYY-MM-DD'),
  dueDate: z.string().optional()
    .describe('Due date as YYYY-MM-DD. Without dueDateTime the task is due on that date with no time. The current user timezone is used automatically.'),
  dueDateTime: z.string().optional()
    .describe('Due time as HH:mm:ss (e.g. 17:00:00). When set with dueDate, the task has a due time and the assignee is reminded before it is due.'),
  subListId: z.string().optional().describe('Sublist ID to move the task to'),
  fields: z
    .array(z.object({
      id: z.string().describe('Custom field ID from workast_list_fields'),
      value: z.string().describe('Value to set on the field'),
    }))
    .max(50)
    .optional()
    .describe('Custom field values to upsert. Use workast_list_fields to get field IDs.'),
});

export function registerUpdateTasks(server: McpServer): void {
  server.registerTool(
    'workast_update_tasks',
    {
      title: 'Update Tasks',
      description: 'Update one or more tasks. Does not change status; use workast_complete_tasks to complete. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: z.object({ succeeded: z.array(z.string()) }),
      annotations: {
        title: 'Update Tasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_update_tasks', async (workast) => {
      const { taskIds, summary, ...rest } = args;
      const patch = omitEmpty(
        summary === undefined ? rest : { text: summary, ...rest },
      ) as TaskPatch;
      const succeeded = [];

      for (const [i, taskId] of taskIds.entries()) {
        try {
          await workast.tasks.update(taskId, patch);
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
