import type { CustomField, CustomFieldPatch } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { fieldDefCardSchema, projectFieldDef } from '../project';
import { runWorkast, ToolError } from '../run-tool';

const optionSchema = z.object({
  id: z.string().optional().describe('Existing option id. Omit to add an option.'),
  name: z.string().describe('Option label'),
  color: z.string().optional().describe('Option color'),
});

const inputSchema = z.object({
  fieldId: z.string().describe('Custom field ID'),
  name: z.string().optional().describe('Field name. Omit to leave the name unchanged.'),
  description: z.string().optional()
    .describe('Field description. An empty string clears it. Omit to leave the description unchanged.'),
  options: z.array(optionSchema).max(50).optional()
    .describe('Full set of options for an options field. Omit to leave options unchanged.'),
});

const outputSchema = fieldDefCardSchema.extend({
  options: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    color: z.string().optional(),
  })).optional(),
});

type OptionPatch = NonNullable<CustomFieldPatch['options']>[number];

export function registerUpdateField(server: McpServer): void {
  server.registerTool(
    'workast_update_field',
    {
      title: 'Update Field',
      description: 'Update a custom field. The change applies everywhere the field is enabled. Send only name, description, or options. An empty description clears it. For an options field, options is the full set: include id to keep an option, omit id to add one, and leave an option out to delete it. Omitting options leaves them unchanged. Use workast_update_space fields.add to enable an existing field on a space.',
      inputSchema,
      outputSchema,
      annotations: {
        title: 'Update Field',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_update_field', async (workast) => {
      if (args.name === undefined && args.description === undefined && args.options === undefined) {
        throw new ToolError([{
          param: 'fieldId',
          message: 'Nothing to update',
          suggestion: 'Send name, description, or options.',
        }]);
      }

      const fields: CustomField[] = await workast.fields.list();
      const field = fields.find((item) => item.id === args.fieldId);
      if (!field) {
        throw new ToolError([{
          param: 'fieldId',
          message: 'Field not found',
          suggestion: 'Use workast_list_fields to look up the field id.',
        }]);
      }
      if (field.type !== 'options' && args.options !== undefined) {
        throw new ToolError([{
          param: 'options',
          message: 'options is only valid for an options field',
          suggestion: 'Omit options for text and number fields.',
        }]);
      }
      if (field.type === 'options' && args.options !== undefined && args.options.length === 0) {
        throw new ToolError([{
          param: 'options',
          message: 'options must include at least 1 item',
          suggestion: 'Send the full set of options, with at least 1 item.',
        }]);
      }

      const body: CustomFieldPatch = {
        name: args.name ?? field.name,
        enableForAll: false,
        useAsTaskColor: field.useAsTaskColor ?? false,
      };
      if (args.description !== undefined) {
        body.description = args.description;
      }
      if (field.type === 'options') {
        body.options = args.options === undefined
          ? (field.options ?? []).map((option) => ({
            ...(option.id !== undefined ? { id: option.id } : {}),
            name: option.name ?? '',
            ...(option.color !== undefined ? { color: option.color } : {}),
          }))
          : args.options.map((option) => {
            const next: OptionPatch = { name: option.name };
            if (option.id !== undefined) {
              next.id = option.id;
            }
            if (option.color !== undefined) {
              next.color = option.color;
            } else if (option.id !== undefined) {
              const stored = field.options?.find((item) => item.id === option.id);
              if (stored?.color !== undefined) {
                next.color = stored.color;
              }
            }
            return next;
          });
      }

      const updated: CustomField = await workast.fields.update(args.fieldId, body);
      return projectFieldDef(updated);
    }),
  );
}
