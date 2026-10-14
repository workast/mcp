import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  readme: z.string().describe('Markdown readme. An empty string clears the readme.'),
});

export function registerUpdateSpaceReadme(server: McpServer): void {
  server.registerTool(
    'workast_update_space_readme',
    {
      title: 'Update Space Readme',
      description: 'Replace a space readme. The value is GitHub Flavored Markdown without images, raw HTML, or mentions. Use the readme to document the space, rules, task formatting pointers, etc. Send an empty string to clear the readme.',
      inputSchema,
      outputSchema: z.object({ ok: z.literal(true) }),
      annotations: {
        title: 'Update Space Readme',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_update_space_readme', async (workast) => {
      await workast.lists.update(args.spaceId, { readme: args.readme });
      return { ok: true as const };
    }),
  );
}
