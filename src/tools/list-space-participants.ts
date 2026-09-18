import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { projectUser, userCardSchema } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
});

export function registerListSpaceParticipants(server: McpServer): void {
  server.registerTool(
    'workast_list_space_participants',
    {
      title: 'List Space Participants',
      description: 'List participants in a Workast space.',
      inputSchema,
      outputSchema: z.object({ participants: z.array(userCardSchema) }),
      annotations: {
        title: 'List Space Participants',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_list_space_participants', async (workast) => {
      const participants = (await workast.lists.participants.list(args.spaceId)).map(projectUser);
      return { participants };
    }),
  );
}
