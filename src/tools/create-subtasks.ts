import type { SubtaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const subtaskSchema = z.object({
  text: z.string().describe('Subtask summary'),
  assignedTo: z.array(z.string()).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  dueDateTimezone: z.string().optional(),
  dueDateTime: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fields: z
    .array(z.object({
      id: z.string(),
      value: z.string(),
    }))
    .optional(),
});

const inputSchema = z.object({
  parentTaskId: z.string().describe('Parent task ID'),
  subtasks: z.array(subtaskSchema).min(1).describe('Subtasks to create'),
});

export function registerCreateSubtasks(server: McpServer): void {
  server.registerTool(
    'create_subtasks',
    {
      description: 'Create one or more subtasks on a parent task.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const created = [];
      for (const subtask of args.subtasks) {
        created.push(
          await workast.tasks.subtasks.create(args.parentTaskId, subtask as SubtaskCreate),
        );
      }
      return created;
    }),
  );
}
