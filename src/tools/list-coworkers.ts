import type { UserSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

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
      description: 'List coworkers in the current Workast team.',
      inputSchema,
      annotations: {
        title: 'List Coworkers',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const query: UserSearchQuery = {
        limit: args.limit,
        offset: args.offset,
      };
      const users = await workast.users.list(query);
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
