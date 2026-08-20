import type { CustomFieldCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { runWorkast } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID to enable the field on'),
  name: z.string().describe('Field name'),
  type: z.enum(['text', 'number', 'options']).describe('Field type'),
  options: z.array(z.object({
    name: z.string(),
    color: z.string().optional(),
  })).optional().describe('Options. Required when type is options'),
});

export function registerCreateField(server: McpServer): void {
  server.registerTool(
    'create_field',
    {
      description: 'Create a custom field and enable it on a space.',
      inputSchema,
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, async (workast) => {
      const body = {
        name: args.name,
        type: args.type,
        ...(args.options != null ? { options: args.options } : {}),
      } as CustomFieldCreate;
      const field = await workast.fields.create(body);
      await workast.lists.fields.enable(args.spaceId, field.id);
      return field;
    }),
  );
}
