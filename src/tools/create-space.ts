import type { List, ListCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { omitEmpty } from '../omit-empty';
import { createdSpaceCardSchema, projectCreatedSpace } from '../project';
import { runWorkast } from '../run-tool';

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
      description: 'Create a Workast space. A space is a collection of tasks that are related to a specific project, topic, department, client. Always check if a relevant space already exists before creating a new one. Omit unused optional fields; do not send empty strings or empty arrays.',
      inputSchema,
      outputSchema: createdSpaceCardSchema,
      annotations: {
        title: 'Create Space',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_space', async (workast) => {
      const body = omitEmpty({
        name: args.name,
        participants: args.participants,
        privacy: args.privacy,
      }) as ListCreate;
      const space: List = await workast.lists.create(body);
      return projectCreatedSpace(space);
    }),
  );
}
