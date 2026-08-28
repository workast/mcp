import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  name: z.string().describe('Sublist name'),
});

export function registerCreateSublist(server: McpServer): void {
  server.registerTool(
    'workast_create_sublist',
    {
      title: 'Create Sublist',
      description: 'Create a sublist in a Workast space.',
      inputSchema,
      annotations: {
        title: 'Create Sublist',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.lists.sublists.create(args.spaceId, { name: args.name })
    )),
  );
}
