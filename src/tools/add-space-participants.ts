import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  users: z.array(z.string()).describe('User IDs to add as participants'),
});

export function registerAddSpaceParticipants(server: McpServer): void {
  server.registerTool(
    'workast_add_space_participants',
    {
      title: 'Add Space Participants',
      description: 'Add participants to a Workast space.',
      inputSchema,
      outputSchema: z.object({ ok: z.literal(true) }),
      annotations: {
        title: 'Add Space Participants',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_add_space_participants', async (workast) => {
      await workast.lists.participants.add(args.spaceId, { users: args.users });
      return { ok: true };
    }),
  );
}
