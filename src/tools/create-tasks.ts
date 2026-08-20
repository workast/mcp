import type { TaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const taskSchema = z.object({
  text: z.string().describe('Task summary'),
  assignedTo: z.array(z.string()).optional(),
  assignedToEmail: z.array(z.string()).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  dueDateTimezone: z.string().optional(),
  dueDateTime: z.string().optional(),
  subListId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  meetingId: z.string().optional(),
  listPosition: z.number().optional(),
  fields: z
    .array(z.object({
      id: z.string(),
      value: z.string(),
    }))
    .optional(),
});

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID to create the tasks in'),
  tasks: z.array(taskSchema).min(1).describe('Tasks to create'),
});

export function registerCreateTasks(server: McpServer): void {
  server.registerTool(
    'create_tasks',
    {
      description: 'Create one or more tasks in a Workast space.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const created = [];
      for (const task of args.tasks) {
        created.push(await workast.tasks.create(args.spaceId, task as TaskCreate));
      }
      return created;
    }),
  );
}
