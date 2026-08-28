import { describe, expect, it } from 'vitest';
import { createHandler } from '../src/create-handler';
import { callJsonRpc } from './helpers';

const EXPECTED_TOOLS = [
  'workast_ping',
  'workast_list_spaces',
  'workast_create_space',
  'workast_add_space_participants',
  'workast_list_space_participants',
  'workast_create_sublist',
  'workast_list_coworkers',
  'workast_about_me',
  'workast_search_tasks',
  'workast_retrieve_task',
  'workast_create_tasks',
  'workast_create_subtasks',
  'workast_update_tasks',
  'workast_complete_tasks',
  'workast_create_comment',
  'workast_list_task_activity',
  'workast_list_meetings',
  'workast_retrieve_meeting',
  'workast_list_fields',
  'workast_create_field',
  'workast_list_reports',
  'workast_retrieve_report',
] as const;

type ListedTool = {
  name: string;
  annotations?: {
    title?: string;
    openWorldHint?: boolean;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
};

type ToolsListResult = {
  tools?: ListedTool[];
};

type InitializeResult = {
  serverInfo?: { name?: string; version?: string };
};

describe('server identity and tool annotations', () => {
  it('returns workast-mcp-server 1.0.0 from initialize', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'vitest', version: '1.0.0' },
    });

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as InitializeResult;
    expect(result.serverInfo).toEqual({
      name: 'workast-mcp-server',
      version: '1.0.0',
    });
  });

  it('lists exactly the 22 workast_ tools with annotations', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'tools/list');

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as ToolsListResult;
    const tools = result.tools ?? [];
    expect(tools.map((tool) => tool.name).sort()).toEqual([...EXPECTED_TOOLS].sort());
    expect(tools).toHaveLength(22);

    for (const tool of tools) {
      expect(tool.annotations).toBeDefined();
      expect(tool.annotations?.openWorldHint).toBe(false);
      expect(tool.annotations?.title).toEqual(expect.any(String));
      expect(tool.annotations?.title?.length).toBeGreaterThan(0);
    }
  });

  it('marks read-only list and retrieve tools', async () => {
    const POST = createHandler();
    const { message } = await callJsonRpc(POST, 'tools/list');
    const tools = ((message.result as ToolsListResult).tools ?? []);
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

    for (const name of [
      'workast_search_tasks',
      'workast_list_spaces',
      'workast_retrieve_task',
      'workast_about_me',
    ]) {
      expect(byName[name]?.annotations?.readOnlyHint).toBe(true);
    }
  });

  it('marks create, update, complete, and add-participant hints', async () => {
    const POST = createHandler();
    const { message } = await callJsonRpc(POST, 'tools/list');
    const tools = ((message.result as ToolsListResult).tools ?? []);
    const byName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

    expect(byName.workast_create_tasks?.annotations).toEqual(
      expect.objectContaining({
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
      }),
    );
    expect(byName.workast_update_tasks?.annotations).toEqual(
      expect.objectContaining({
        destructiveHint: true,
        idempotentHint: true,
      }),
    );
    expect(byName.workast_complete_tasks?.annotations).toEqual(
      expect.objectContaining({
        destructiveHint: false,
        idempotentHint: true,
      }),
    );
    expect(byName.workast_add_space_participants?.annotations).toEqual(
      expect.objectContaining({
        destructiveHint: false,
        idempotentHint: true,
      }),
    );
  });
});
