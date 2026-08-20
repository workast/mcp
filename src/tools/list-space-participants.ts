import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
});

export function registerListSpaceParticipants(server: McpServer): void {
  server.registerTool(
    'list_space_participants',
    {
      description: 'List participants in a Workast space.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.lists.participants.list(args.spaceId)
    )),
  );
}
