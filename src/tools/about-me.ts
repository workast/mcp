import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({});

export function registerAboutMe(server: McpServer): void {
  server.registerTool(
    'about_me',
    {
      description: 'Get the current Workast user and their team.',
      inputSchema,
    },
    async (_args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.users.me()
    )),
  );
}
