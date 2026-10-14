import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { projectSpaceDetail, spaceDetailCardSchema } from '../project';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
});

export function registerRetrieveSpace(server: McpServer): void {
  server.registerTool(
    'workast_retrieve_space',
    {
      title: 'Retrieve Space',
      description: 'Retrieve a space. Returns the readme when the space has one, defaultList, and lists (id and name). Use this when you need the readme or a list id. A task created without a list id lands on defaultList.',
      inputSchema,
      outputSchema: spaceDetailCardSchema,
      annotations: {
        title: 'Retrieve Space',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_retrieve_space', async (workast) => {
      const space = await workast.lists.retrieve(args.spaceId);
      return projectSpaceDetail(space);
    }),
  );
}
