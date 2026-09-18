import type { ListSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { projectSpace, spaceCardSchema } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  type: z.enum(['direct', 'group', 'personal', 'template']).optional()
    .describe('Filter by space type'),
  participants: z.array(z.string()).max(50).optional()
    .describe('Filter by participant user IDs'),
  limit: z.number().int().min(1).max(200).default(50)
    .describe('Maximum number of spaces to return (1–200)'),
  skip: z.number().int().min(0).default(0)
    .describe('Number of spaces to skip'),
});

export function registerListSpaces(server: McpServer): void {
  server.registerTool(
    'workast_list_spaces',
    {
      title: 'List Spaces',
      description: 'List Workast spaces visible to the current user. Use this tool to get the space ID of a space to create a task in.',
      inputSchema,
      outputSchema: z.object({
        spaces: z.array(spaceCardSchema),
        count: z.number(),
        skip: z.number(),
        has_more: z.boolean(),
        next_skip: z.number().nullable(),
      }),
      annotations: {
        title: 'List Spaces',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_spaces', async (workast) => {
      const query: ListSearchQuery = {
        limit: args.limit,
        skip: args.skip,
      };
      if (args.type != null) {
        query.type = args.type;
      }
      if (args.participants != null) {
        query.participants = args.participants;
      }

      const spaces = (await workast.lists.list(query)).map(projectSpace);
      const count = spaces.length;
      const has_more = count === args.limit;
      return {
        spaces,
        count,
        skip: args.skip,
        has_more,
        next_skip: has_more ? args.skip + count : null,
      };
    }),
  );
}
