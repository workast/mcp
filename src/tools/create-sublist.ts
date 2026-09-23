import type { SubList } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createdSublistCardSchema, projectCreatedSublist } from '../project';
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
      description: 'Create a sublist in a Workast space. All spaces have at least one sublist and tasks always belong to a sublist. Use sublists to organize tasks into logical groups, like status, priority, category, or any other grouping that makes sense for the space context.',
      inputSchema,
      outputSchema: createdSublistCardSchema,
      annotations: {
        title: 'Create Sublist',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_sublist', async (workast) => {
      const sublist: SubList = await workast.lists.sublists.create(args.spaceId, { name: args.name });
      return projectCreatedSublist(sublist);
    }),
  );
}
