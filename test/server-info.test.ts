import { describe, expect, it } from 'vitest';
import { createHandler } from '../src/create-handler';
import { callJsonRpc, setupWorkastMock } from './helpers';

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
  'workast_retrieve_tasks',
  'workast_create_tasks',
  'workast_create_personal_tasks',
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

type ToolsListResult = {
  tools?: Array<{ name: string }>;
};

type InitializeResult = {
  serverInfo?: { name?: string; version?: string };
};

describe('server identity', () => {
  setupWorkastMock();

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

  it('lists exactly the 23 workast_ tools', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'tools/list');

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as ToolsListResult;
    const tools = result.tools ?? [];
    expect(tools.map((tool) => tool.name).sort()).toEqual([...EXPECTED_TOOLS].sort());
    expect(tools).toHaveLength(23);
  });
});
