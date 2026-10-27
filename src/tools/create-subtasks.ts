import type { SubtaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { projectSearchTask, searchTaskCardSchema } from '../project';
import { runWorkast, toolErrorFrom } from '../run-tool';
import { needsTimeZone, prepareDate } from '../task-dates';
import { findOrCreateTags } from '../task-tags';

const subtaskSchema = z.object({
  summary: z.string().describe('Subtask summary (title). Prefer this over description.'),
  assignedTo: z.array(z.string()).max(50).optional()
    .describe('User IDs to assign (not names or emails). Use workast_list_coworkers or workast_list_space_participants to look up IDs.'),
  description: z.string().optional()
    .describe('Longer subtask details. Only set when extra context is needed beyond the summary.'),
  startDate: z.string().optional()
    .describe('Start date as YYYY-MM-DD, for example 2026-04-10. When the user gives a time, use YYYY-MM-DDTHH:mm:ss, for example 2026-04-10T09:00:00.'),
  dueDate: z.string().optional()
    .describe('Due date as YYYY-MM-DD, for example 2026-04-10. When the user gives a time, use YYYY-MM-DDTHH:mm:ss, for example 2026-04-10T17:00:00.'),
  tags: z.array(z.string()).max(50).optional()
    .describe('Tag names. The tool finds a tag with that name or creates it.'),
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
      description: 'Create one or more subtasks on a parent task. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: z.object({ subtasks: z.array(searchTaskCardSchema) }),
      annotations: {
        title: 'Create Subtasks',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_subtasks', async (workast) => {
      const dates = args.subtasks.flatMap((task) => [task.startDate, task.dueDate]);
      const timeZone = dates.some(needsTimeZone)
        ? (await workast.users.me()).timezone || 'UTC'
        : 'UTC';
      const created: ReturnType<typeof projectSearchTask>[] = [];
      for (const [i, task] of args.subtasks.entries()) {
        try {
          let { summary, startDate, dueDate, tags, ...taskFields } = task;
          if (dueDate) dueDate = prepareDate(dueDate, timeZone);
          if (startDate) startDate = prepareDate(startDate, timeZone);
          const tagIds = await findOrCreateTags(workast, tags);
          created.push(projectSearchTask(
            await workast.tasks.subtasks.create(
              args.parentTaskId,
              omitEmpty({ text: summary, ...taskFields, startDate, dueDate, tags: tagIds }) as SubtaskCreate,
            ),
          ));
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
