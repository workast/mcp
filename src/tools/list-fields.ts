import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().optional().describe('When set, only fields enabled on this space'),
});

export function registerListFields(server: McpServer): void {
  server.registerTool(
    'workast_list_fields',
    {
      title: 'List Fields',
      description: 'List custom fields. Optionally filter to a space.',
      inputSchema,
      annotations: {
        title: 'List Fields',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      if (args.spaceId) {
        return workast.fields.list({ listId: args.spaceId });
      }
      return workast.fields.list();
    }),
  );
}
