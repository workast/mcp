import type { List, ListPatch } from '@workast/sdk';
import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { createdSublistCardSchema, projectCreatedSublist } from '../project';
import { runWorkast, ToolError, toolErrorFrom } from '../run-tool';

const inputSchema = z.object({
  spaceId: z.string().describe('Space ID'),
  name: z.string().optional()
    .describe('New name for a group space. Omit to leave the name unchanged.'),
  readme: z.string().optional()
    .describe('Space readme (GitHub Flavored Markdown without images, raw HTML, or mentions). An empty string clears it. Omit to leave the readme unchanged.'),
  defaultList: z.string().optional()
    .describe('Existing list id to set as the default list. Omit to leave the default list unchanged.'),
  lists: z.object({
    add: z.array(z.object({
      name: z.string().describe('Name of the list to create'),
    })).max(50).optional()
      .describe('Lists to create. Omit to leave lists unchanged.'),
    rename: z.array(z.object({
      id: z.string().describe('List id'),
      name: z.string().describe('New list name'),
    })).max(50).optional()
      .describe('Lists to rename by id. Omit to leave lists unchanged.'),
    remove: z.array(z.string()).max(50).optional()
      .describe('List ids to delete. Omit to leave lists unchanged. Removing a list deletes its open tasks.'),
  }).optional().describe('List changes. Omit unused sections.'),
  fields: z.object({
    add: z.array(z.string()).max(50).optional()
      .describe('Existing field ids to enable on this space. Omit to leave fields unchanged.'),
    remove: z.array(z.string()).max(50).optional()
      .describe('Field ids to disable on this space. Omit to leave fields unchanged.'),
  }).optional().describe('Field changes. Omit unused sections.'),
});

const outputSchema = z.object({
  spaceId: z.string(),
  name: z.string().optional(),
  readme: z.string().optional(),
  defaultList: z.string().optional(),
  listsAdded: z.array(createdSublistCardSchema).optional(),
  listsRenamed: z.array(createdSublistCardSchema).optional(),
  listsRemoved: z.array(z.string()).optional(),
  fieldsAdded: z.array(z.string()).optional(),
  fieldsRemoved: z.array(z.string()).optional(),
});

type SpaceUpdate = z.infer<typeof outputSchema>;

function sharesId(left: string[] | undefined, right: string[] | undefined): boolean {
  if (!left?.length || !right?.length) {
    return false;
  }
  const ids = new Set(right);
  return left.some((id) => ids.has(id));
}

export function registerUpdateSpace(server: McpServer): void {
  server.registerTool(
    'workast_update_space',
    {
      title: 'Update Space',
      description: 'Update a space. Omit any section to leave it unchanged. name renames a group space. readme replaces the space readme; an empty string clears it. defaultList is an existing list id. lists.add creates lists, lists.rename renames lists by id, and lists.remove deletes lists. The default list cannot be removed; move those tasks with workast_update_tasks listId first, or set defaultList to another existing list in this call. A list created in this call cannot be defaultList until a later call. fields.add enables existing fields on this space. fields.remove disables them here; the field and its task values remain. Use workast_list_fields to get the field ID. Personal and direct spaces cannot be renamed.',
      inputSchema,
      outputSchema,
      annotations: {
        title: 'Update Space',
        openWorldHint: false,
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
      },
    },
    async (args, ctx) => runWorkast(ctx.http?.authInfo?.token, 'workast_update_space', async (workast) => {
      const hasChanges = args.name !== undefined
        || args.readme !== undefined
        || args.defaultList !== undefined
        || Boolean(args.lists?.add?.length)
        || Boolean(args.lists?.rename?.length)
        || Boolean(args.lists?.remove?.length)
        || Boolean(args.fields?.add?.length)
        || Boolean(args.fields?.remove?.length);
      if (!hasChanges) {
        throw new ToolError([{
          param: 'spaceId',
          message: 'Nothing to update',
          suggestion: 'Send name, readme, defaultList, lists, or fields.',
        }]);
      }
      if (sharesId(args.lists?.rename?.map((item) => item.id), args.lists?.remove)) {
        throw new ToolError([{
          param: 'lists.remove',
          message: 'A list id is in both lists.rename and lists.remove',
          suggestion: 'Keep the id in lists.rename or lists.remove, not both.',
        }]);
      }
      if (args.defaultList !== undefined && args.lists?.remove?.includes(args.defaultList)) {
        throw new ToolError([{
          param: 'defaultList',
          message: 'The default list cannot be removed in the same call',
          suggestion: 'Set defaultList to another existing list, or leave it out of lists.remove.',
        }]);
      }
      if (sharesId(args.fields?.add, args.fields?.remove)) {
        throw new ToolError([{
          param: 'fields.remove',
          message: 'A field id is in both fields.add and fields.remove',
          suggestion: 'Keep the id in fields.add or fields.remove, not both.',
        }]);
      }

      if (args.name !== undefined) {
        const space: List = await workast.lists.retrieve(args.spaceId);
        if (space.type === 'personal' || space.type === 'direct') {
          throw new ToolError([{
            param: 'name',
            message: `${space.type} spaces cannot be renamed`,
            suggestion: 'Omit name. Personal and direct spaces cannot be renamed.',
          }]);
        }
      }

      const result: SpaceUpdate = { spaceId: args.spaceId };

      if (args.name !== undefined || args.readme !== undefined || args.defaultList !== undefined) {
        const patch: ListPatch = {};
        if (args.name !== undefined) {
          patch.name = args.name;
        }
        if (args.readme !== undefined) {
          patch.readme = args.readme;
        }
        if (args.defaultList !== undefined) {
          patch.defaultSubList = args.defaultList;
        }
        await workast.lists.update(args.spaceId, patch);
        if (args.name !== undefined) {
          result.name = args.name;
        }
        if (args.readme !== undefined) {
          result.readme = args.readme;
        }
        if (args.defaultList !== undefined) {
          result.defaultList = args.defaultList;
        }
      }

      if (args.lists?.add?.length) {
        const listsAdded: NonNullable<SpaceUpdate['listsAdded']> = [];
        for (const [i, item] of args.lists.add.entries()) {
          try {
            listsAdded.push(projectCreatedSublist(
              await workast.lists.sublists.create(args.spaceId, { name: item.name }),
            ));
            result.listsAdded = listsAdded;
          } catch (error) {
            toolErrorFrom(error, `lists.add[${i}].name`, result);
          }
        }
      }

      if (args.lists?.rename?.length) {
        const listsRenamed: NonNullable<SpaceUpdate['listsRenamed']> = [];
        for (const [i, item] of args.lists.rename.entries()) {
          try {
            await workast.lists.sublists.update(args.spaceId, item.id, { name: item.name });
            listsRenamed.push({ id: item.id, name: item.name });
            result.listsRenamed = listsRenamed;
          } catch (error) {
            toolErrorFrom(error, `lists.rename[${i}].id`, result);
          }
        }
      }

      if (args.lists?.remove?.length) {
        const listsRemoved: string[] = [];
        for (const [i, id] of args.lists.remove.entries()) {
          try {
            await workast.lists.sublists.del(args.spaceId, id);
            listsRemoved.push(id);
            result.listsRemoved = listsRemoved;
          } catch (error) {
            toolErrorFrom(error, `lists.remove[${i}]`, result);
          }
        }
      }

      if (args.fields?.add?.length) {
        const fieldsAdded: string[] = [];
        for (const [i, fieldId] of args.fields.add.entries()) {
          try {
            await workast.lists.fields.enable(args.spaceId, fieldId);
            fieldsAdded.push(fieldId);
            result.fieldsAdded = fieldsAdded;
          } catch (error) {
            toolErrorFrom(error, `fields.add[${i}]`, result);
          }
        }
      }

      if (args.fields?.remove?.length) {
        const fieldsRemoved: string[] = [];
        for (const [i, fieldId] of args.fields.remove.entries()) {
          try {
            await workast.lists.fields.disable(args.spaceId, fieldId);
            fieldsRemoved.push(fieldId);
            result.fieldsRemoved = fieldsRemoved;
          } catch (error) {
            toolErrorFrom(error, `fields.remove[${i}]`, result);
          }
        }
      }

      return result;
    }),
  );
}
