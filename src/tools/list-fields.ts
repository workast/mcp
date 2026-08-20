import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().optional().describe('When set, only fields enabled on this space'),
});

export function registerListFields(server: McpServer): void {
  server.registerTool(
    'list_fields',
    {
      description: 'List custom fields. Optionally filter to a space.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      if (args.spaceId) {
        return workast.fields.list({ listId: args.spaceId });
      }
      return workast.fields.list();
    }),
  );
}
