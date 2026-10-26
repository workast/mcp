import type { TaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { projectSearchTask, searchTaskCardSchema } from '../project';
import { runWorkast, toolErrorFrom } from '../run-tool';
import { needsTimeZone, prepareDate } from '../task-dates';

const taskSchema = z.object({
  summary: z.string().describe('Task summary (title). Prefer this over description.'),
  assignedTo: z.array(z.string()).max(50).optional()
    .describe('User IDs to assign (not names or emails). Use workast_list_coworkers to look up IDs.'),
  description: z.string().optional()
    .describe('Longer task details. Only set when extra context is needed beyond the summary.'),
  startDate: z.string().optional()
    .describe('Start date as YYYY-MM-DD, for example 2026-04-10. When the user gives a time, use YYYY-MM-DDTHH:mm:ss, for example 2026-04-10T09:00:00.'),
  dueDate: z.string().optional()
    .describe('Due date as YYYY-MM-DD, for example 2026-04-10. When the user gives a time, use YYYY-MM-DDTHH:mm:ss, for example 2026-04-10T17:00:00.'),
  tags: z.array(z.string()).max(50).optional()
    .describe('Tag IDs to add (not names). Use IDs from existing tasks or search results.'),
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
  tasks: z.array(taskSchema).min(1).max(50).describe('Personal tasks to create'),
});

export function registerCreatePersonalTasks(server: McpServer): void {
  server.registerTool(
    'workast_create_personal_tasks',
    {
      title: 'Create Personal Tasks',
      description: 'Create one or more tasks in the current user personal list. No spaceId is required. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: z.object({ tasks: z.array(searchTaskCardSchema) }),
      annotations: {
        title: 'Create Personal Tasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_personal_tasks', async (workast) => {
      const dates = args.tasks.flatMap((task) => [task.startDate, task.dueDate]);
      const timeZone = dates.some(needsTimeZone)
        ? (await workast.users.me()).timezone || 'UTC'
        : 'UTC';
      const created: ReturnType<typeof projectSearchTask>[] = [];
      for (const [i, task] of args.tasks.entries()) {
        try {
          let { summary, startDate, dueDate, ...taskFields } = task;
          if (dueDate) dueDate = prepareDate(dueDate, timeZone);
          if (startDate) startDate = prepareDate(startDate, timeZone);
          created.push(projectSearchTask(
            await workast.tasks.createPersonal(
              omitEmpty({ text: summary, ...taskFields, startDate, dueDate }) as TaskCreate,
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
