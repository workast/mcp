import type { SubtaskCreate, Task } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { entitySchema, runWorkast, toolErrorFrom } from '../run-tool';

const subtaskSchema = z.object({
  summary: z.string().describe('Subtask summary (title). Prefer this over description.'),
  assignedTo: z.array(z.string()).max(50).optional()
    .describe('User IDs to assign (not names or emails). Use workast_list_coworkers or workast_list_space_participants to look up IDs.'),
  description: z.string().optional()
    .describe('Longer subtask details. Only set when extra context is needed beyond the summary.'),
  startDate: z.string().optional().describe('Start date as YYYY-MM-DD'),
  dueDate: z.string().optional()
    .describe('Due date as YYYY-MM-DD. Without dueDateTime the subtask is due on that date with no time. The current user timezone is used automatically.'),
  dueDateTime: z.string().optional()
    .describe('Due time as HH:mm:ss (e.g. 17:00:00). When set with dueDate, the subtask has a due time and the assignee is reminded before it is due.'),
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
  parentTaskId: z.string().describe('Parent task ID'),
  subtasks: z.array(subtaskSchema).min(1).max(50).describe('Subtasks to create'),
});

export function registerCreateSubtasks(server: McpServer): void {
  server.registerTool(
    'workast_create_subtasks',
    {
      title: 'Create Subtasks',
      description: 'Create one or more subtasks on a parent task.',
      inputSchema,
      outputSchema: z.object({ subtasks: z.array(entitySchema) }),
      annotations: {
        title: 'Create Subtasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_subtasks', async (workast) => {
      const created: Task[] = [];
      for (const [i, { summary, ...rest }] of args.subtasks.entries()) {
        try {
          created.push(
            await workast.tasks.subtasks.create(args.parentTaskId, { text: summary, ...rest } as SubtaskCreate),
          );
        } catch (error) {
          if (created.length > 0) {
            toolErrorFrom(error, `subtasks[${i}]`, { subtasks: created });
          }
          throw error;
        }
      }
      return { subtasks: created };
    }),
  );
}
