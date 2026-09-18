import type { CustomField, CustomFieldCreate } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createdFieldCardSchema, projectCreatedField } from '../project';
import { runWorkast, ToolError, toolErrorFrom } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID to enable the field on'),
  name: z.string().describe('Field name'),
  type: z.enum(['text', 'number', 'options']).describe('Field type'),
  options: z.array(z.object({
    name: z.string().describe('Option label'),
    color: z.string().optional().describe('Option color'),
  })).max(50).optional().describe('Options. Required when type is options'),
});

export function registerCreateField(server: McpServer): void {
  server.registerTool(
    'workast_create_field',
    {
      title: 'Create Field',
      description: 'Create a custom field and enable it on a space.',
      inputSchema,
      outputSchema: createdFieldCardSchema,
      annotations: {
        title: 'Create Field',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_create_field', async (workast) => {
      if (args.type === 'options' && (args.options == null || args.options.length === 0)) {
        throw new ToolError([{
          param: 'options',
          message: 'options is required when type is "options"',
          suggestion: 'Provide options when type is options.',
        }]);
      }
      const body = {
        name: args.name,
        type: args.type,
        ...(args.options != null ? { options: args.options } : {}),
      } as CustomFieldCreate;
      const field: CustomField = await workast.fields.create(body);
      try {
        await workast.lists.fields.enable(args.spaceId, field.id);
      } catch (error) {
        toolErrorFrom(error, 'spaceId', { createdField: { id: field.id } });
      }
      return projectCreatedField(field);
    }),
  );
}
