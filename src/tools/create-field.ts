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
    'workast_create_field',
    {
      title: 'Create Field',
      description: 'Create a custom field and enable it on a space.',
      inputSchema,
      annotations: {
        title: 'Create Field',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => {
      if (args.type === 'options' && (args.options == null || args.options.length === 0)) {
        return {
          content: [{
            type: 'text' as const,
            text: 'options is required when type is "options"',
          }],
          isError: true,
        };
      }
      return runWorkast(ctx.http?.authInfo?.token, async (workast) => {
        const body = {
          name: args.name,
          type: args.type,
          ...(args.options != null ? { options: args.options } : {}),
        } as CustomFieldCreate;
        const field = await workast.fields.create(body);
        await workast.lists.fields.enable(args.spaceId, field.id);
        return field;
      });
    },
  );
}
