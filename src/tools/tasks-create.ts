import { ApiError, type TaskCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createWorkast as defaultCreateWorkast } from '../workast';

export type TasksCreateDeps = {
  createWorkast?: typeof defaultCreateWorkast;
};

const inputSchema = z.object({
  listId: z.string().describe('List ID to create the task in'),
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

export function registerTasksCreate(
  server: McpServer,
  deps: TasksCreateDeps = {},
): void {
  const makeClient = deps.createWorkast ?? defaultCreateWorkast;

  server.registerTool(
    'tasks_create',
    {
      description: 'Create a task in a Workast list.',
      inputSchema,
    },
    async (args, ctx) => {
      const token = ctx.http?.authInfo?.token;
      if (!token) {
        return {
          content: [{ type: 'text' as const, text: 'Missing API key' }],
          isError: true,
        };
      }

      const { listId, ...rest } = args;
      const body = rest as TaskCreate;
      const workast = makeClient(token);

      try {
        const task = await workast.tasks.create(listId, body);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(task) }],
        };
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            content: [{
              type: 'text' as const,
              text: `${error.message} (${error.status})`,
            }],
            isError: true,
          };
        }
        throw error;
      }
    },
  );
}
