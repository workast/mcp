import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  users: z.array(z.string()).describe('User IDs to add as participants'),
});

export function registerAddSpaceParticipants(server: McpServer): void {
  server.registerTool(
    'add_space_participants',
    {
      description: 'Add participants to a Workast space.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      await workast.lists.participants.add(args.spaceId, { users: args.users });
      return { ok: true };
    }),
  );
}
