import type { UserDetail, UserSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { entitySchema, runWorkast } from '../run-tool';

const inputSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Maximum number of coworkers to return (1–200)'),
  offset: z.number().int().min(0).default(0)
    .describe('Number of coworkers to skip'),
});

export function registerListCoworkers(server: McpServer): void {
  server.registerTool(
    'workast_list_coworkers',
    {
      title: 'List Coworkers',
      description: 'Find all users in the current Workast team. Use this tool to get the user ID of a coworker to assign tasks to them.',
      inputSchema,
      outputSchema: z.object({
        users: z.array(entitySchema),
        count: z.number(),
        offset: z.number(),
        has_more: z.boolean(),
        next_offset: z.number().nullable(),
      }),
      annotations: {
        title: 'List Coworkers',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_coworkers', async (workast) => {
      const query: UserSearchQuery = {
        limit: args.limit,
        offset: args.offset,
      };
      const users: UserDetail[] = await workast.users.list(query);
      const count = users.length;
      const has_more = count === args.limit;
      return {
        users,
        count,
        offset: args.offset,
        has_more,
        next_offset: has_more ? args.offset + count : null,
      };
    }),
  );
}
