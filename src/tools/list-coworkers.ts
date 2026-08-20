import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({});

export function registerListCoworkers(server: McpServer): void {
  server.registerTool(
    'list_coworkers',
    {
      description: 'List coworkers in the current Workast team.',
      inputSchema,
    },
    async (_args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => (
      workast.users.list()
    )),
  );
}
