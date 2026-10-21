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
  listId: z.string().optional().describe('List id to move the task to'),
  fields: z
    .array(z.object({
      id: z.string().describe('Custom field ID from workast_list_fields'),
      value: z.string().describe('Value to set on the field'),
    }))
    .max(50)
    .optional()
    .describe('Custom field values to upsert. Use workast_list_fields to get field IDs.'),
  addAssignee: z.array(z.string()).max(50).optional()
    .describe('User IDs to assign. Adds these people and leaves other assignees in place. Use workast_list_coworkers or workast_list_space_participants. Not names or emails.'),
  removeAssignee: z.array(z.string()).max(50).optional()
    .describe('User IDs to unassign. Applied after addAssignee. Not names or emails.'),
  repeat: z.object({
    freq: z.enum(['daily', 'weekly', 'fortnight', 'monthly', 'yearly'])
      .describe('daily, weekly, fortnight (every two weeks), monthly, or yearly. Weekdays (Mon–Fri) are daily with byweekday [0,1,2,3,4]. Monthly on the nth weekday is monthly with bysetpos and one byweekday.'),
    interval: z.number().int().min(1).optional()
      .describe('Repeat every this many weeks or months. Defaults to 1 when omitted.'),
    byweekday: z.array(z.number().int().min(0).max(6)).max(7).optional()
      .describe('Weekdays, 0=Monday through 6=Sunday. Unique values.'),
    bysetpos: z.union([
      z.literal(-1), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    ]).optional()
      .describe('Which occurrence in the period. 1, 2, 3, 4, or -1 for the last. Used with monthly and one byweekday.'),
  }).nullable().optional()
    .describe('Recurrence for a task that has a due date. Pass null to clear it. Omit to leave the current repeat unchanged.'),
});

export function registerUpdateTasks(server: McpServer): void {
  server.registerTool(
    'workast_update_tasks',
    {
      title: 'Update Tasks',
      description: 'Update one or more tasks. Assignees are changed with addAssignee and removeAssignee, and repeat is set with repeat or cleared with null. Does not change status; use workast_complete_tasks to complete. Omit unused optional fields; do not send empty strings or empty arrays.',
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
      const { taskIds, summary, listId, addAssignee, removeAssignee, repeat, ...rest } = args;
      const patch = omitEmpty({
        text: summary,
        ...rest,
        subListId: listId,
        repeat: repeat === null ? undefined : repeat,
      }) as TaskPatch;
      if (repeat === null) {
        patch.repeat = null;
      }
      const usersToAdd = omitEmpty(addAssignee) as string[] | undefined;
      const usersToRemove = omitEmpty(removeAssignee) as string[] | undefined;
      const succeeded = [];

      for (const [i, taskId] of taskIds.entries()) {
        try {
          if (Object.keys(patch).length > 0) {
            await workast.tasks.update(taskId, patch);
          }
          if (usersToAdd?.length) {
            await workast.tasks.assign(taskId, { users: usersToAdd });
          }
          if (usersToRemove?.length) {
            await workast.tasks.unassign(taskId, { users: usersToRemove });
          }
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
