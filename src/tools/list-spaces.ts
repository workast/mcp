import type { ListSearchQuery } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  type: z.enum(['direct', 'group', 'personal', 'template']).optional()
    .describe('Filter by space type'),
  participants: z.array(z.string()).optional()
    .describe('Filter by participant user IDs'),
});

export function registerListSpaces(server: McpServer): void {
  server.registerTool(
    'list_spaces',
    {
      description: 'List Workast spaces visible to the current user.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const query: ListSearchQuery = {};
      if (args.type != null) {
        query.type = args.type;
      }
      if (args.participants != null) {
        query.participants = args.participants;
      }

      if (query.type == null && query.participants == null) {
        return workast.lists.list();
      }
      return workast.lists.list(query);
    }),
  );
}
