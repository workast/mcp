import type { ListCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  name: z.string().describe('Space name'),
  participants: z.array(z.string()).optional()
    .describe('User IDs to add as participants'),
  privacy: z.enum(['private', 'team']).optional()
    .describe('Space privacy. Defaults to team'),
});

export function registerCreateSpace(server: McpServer): void {
  server.registerTool(
    'workast_create_space',
    {
      title: 'Create Space',
      description: 'Create a Workast space.',
      inputSchema,
      annotations: {
        title: 'Create Space',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const body = {
        name: args.name,
        ...(args.participants != null ? { participants: args.participants } : {}),
        ...(args.privacy != null ? { privacy: args.privacy } : {}),
      } as ListCreate;
      return workast.lists.create(body);
    }),
  );
}
