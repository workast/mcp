import type { List, ListCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { entitySchema, runWorkast } from '../run-tool';

const inputSchema = z.object({
  name: z.string().describe('Space name'),
  participants: z.array(z.string()).max(50).optional()
    .describe('User IDs to add as participants'),
  privacy: z.enum(['private', 'team']).optional()
    .describe('Space privacy determines if anyone can view and join the space (team) or if it is only visible to the participants (private). Defaults to team.'),
});

export function registerCreateSpace(server: McpServer): void {
  server.registerTool(
    'workast_create_space',
    {
      title: 'Create Space',
      description: 'Create a Workast space. A space is a collection of tasks that are related to a specific project, topic, department, client. Always check if a relevant space already exists before creating a new one.',
      inputSchema,
      outputSchema: entitySchema,
      annotations: {
        title: 'Create Space',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_space', async (workast) => {
      const body = {
        name: args.name,
        ...(args.participants != null ? { participants: args.participants } : {}),
        ...(args.privacy != null ? { privacy: args.privacy } : {}),
      } as ListCreate;
      const space: List = await workast.lists.create(body);
      return space;
    }),
  );
}
