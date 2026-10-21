import type { TaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { projectSearchTask, searchTaskCardSchema } from '../project';
import { runWorkast, toolErrorFrom } from '../run-tool';

const taskSchema = z.object({
  summary: z.string().describe('Task summary (title). Prefer this over description.'),
  assignedTo: z.array(z.string()).max(50).optional()
    .describe('User IDs to assign (not names or emails). Use workast_list_coworkers or workast_list_space_participants to look up IDs.'),
  description: z.string().optional()
    .describe('Longer task details. GitHub Flavored Markdown without images, raw HTML, or mentions. Use this to provide extra context when needed beyond the summary.'),
  startDate: z.string().optional().describe('Start date as YYYY-MM-DD'),
  dueDate: z.string().optional()
    .describe('Due date as YYYY-MM-DD. Without dueDateTime the task is due on that date with no time. The current user timezone is used automatically.'),
  dueDateTime: z.string().optional()
    .describe('Due time as HH:mm:ss (e.g. 17:00:00). When set with dueDate, the task has a due time and the assignee is reminded before it is due.'),
  repeat: z.object({
    freq: z.enum(['daily', 'weekly', 'fortnight', 'monthly', 'yearly'])
      .describe('daily, weekly, fortnight (every two weeks), monthly, or yearly. Monthly on the nth weekday is monthly with bysetpos and one byweekday.'),
    interval: z.number().int().min(1).optional()
      .describe('Repeat every this many weeks or months. Defaults to 1 when omitted.'),
    byweekday: z.array(z.number().int().min(0).max(6)).max(7).optional()
      .describe('Weekdays, 0=Monday through 6=Sunday. Unique values.'),
    bysetpos: z.union([
      z.literal(-1), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
    ]).optional()
      .describe('Which occurrence in the period. 1, 2, 3, 4, or -1 for the last. Used with monthly and one byweekday.'),
  }).optional()
    .describe('Recurrence for a task that has a due date. Omit it when the task does not repeat.'),
  listId: z.string().optional()
    .describe('List id from workast_retrieve_space. Omit it to land on the default list.'),
  tags: z.array(z.string()).max(50).optional()
    .describe('Tag IDs to add (not names). Use IDs from existing tasks or search results.'),
  meetingId: z.string().optional()
    .describe('Meeting ID to associate. Use workast_list_meetings to look up IDs.'),
  fields: z
    .array(z.object({
      id: z.string().describe('Custom field ID from workast_list_fields'),
      value: z.string().describe('Value to set on the field'),
    }))
    .max(50)
    .optional()
    .describe('Custom field values. Use workast_list_fields to get field IDs.'),
});

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID to create the tasks in'),
  tasks: z.array(taskSchema).min(1).max(50).describe('Tasks to create'),
});

export function registerCreateTasks(server: McpServer): void {
  server.registerTool(
    'workast_create_tasks',
    {
      title: 'Create Tasks',
      description: 'Create one or more tasks in a Workast space. For personal tasks with no space, use workast_create_personal_tasks. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: z.object({ tasks: z.array(searchTaskCardSchema) }),
      annotations: {
        title: 'Create Tasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_tasks', async (workast) => {
      const created: ReturnType<typeof projectSearchTask>[] = [];
      for (const [i, { summary, listId, ...rest }] of args.tasks.entries()) {
        try {
          created.push(projectSearchTask(
            await workast.tasks.create(
              args.spaceId,
              omitEmpty({ text: summary, ...rest, subListId: listId }) as TaskCreate,
            ),
          ));
        } catch (error) {
          if (created.length > 0) {
            toolErrorFrom(error, `tasks[${i}]`, { tasks: created });
          }
          throw error;
        }
      }
      return { tasks: created };
    }),
  );
}
