import type { Task, TaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { entitySchema, runWorkast, toolErrorFrom } from '../run-tool';

const taskSchema = z.object({
  summary: z.string().describe('Task summary (title). Prefer this over description.'),
  assignedTo: z.array(z.string()).max(50).optional()
    .describe('User IDs to assign (not names or emails). Use workast_list_coworkers or workast_list_space_participants to look up IDs.'),
  description: z.string().optional()
    .describe('Longer task details. Only set when extra context is needed beyond the summary.'),
  startDate: z.string().optional().describe('Start date as YYYY-MM-DD'),
  dueDate: z.string().optional()
    .describe('Due date as YYYY-MM-DD. Without dueDateTime the task is due on that date with no time. The current user timezone is used automatically.'),
  dueDateTime: z.string().optional()
    .describe('Due time as HH:mm:ss (e.g. 17:00:00). When set with dueDate, the task has a due time and the assignee is reminded before it is due.'),
  subListId: z.string().optional()
    .describe('Sublist ID to place the task in'),
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
      description: 'Create one or more tasks in a Workast space. For personal tasks with no space, use workast_create_personal_tasks.',
      inputSchema,
      outputSchema: z.object({ tasks: z.array(entitySchema) }),
      annotations: {
        title: 'Create Tasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_tasks', async (workast) => {
      const created: Task[] = [];
      for (const [i, { summary, ...rest }] of args.tasks.entries()) {
        try {
          created.push(await workast.tasks.create(args.spaceId, { text: summary, ...rest } as TaskCreate));
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
