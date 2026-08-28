import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({});

export function registerAboutMe(server: McpServer): void {
  server.registerTool(
    'workast_about_me',
    {
      title: 'About Me',
      description: 'Get the current Workast user and their team.',
      inputSchema,
      annotations: {
        title: 'About Me',
        openWorldHint: false,
        readOnlyHint: true,
      },
    },
    async (_args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.users.me()
    )),
  );
}
