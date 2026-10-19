import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHandler } from '../src/create-handler';
import { callJsonRpc, setupWorkastMock } from './helpers';

const bytes = readFileSync(join(process.cwd(), 'skills/workast/SKILL.md'));
const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const size = bytes.byteLength;
const text = bytes.toString('utf8');

const FOLDED_DESCRIPTION = 'Manage Workast spaces, lists, tasks, notes, forms, meetings, and reports. Use when the user mentions Workast, pastes a workast.com or workast.app URL, gives a short task id, or asks to create, assign, search, complete, or comment on work in Workast.\n';

const INSTRUCTIONS = 'Load the Workast skill at skill://workast/SKILL.md when the user mentions Workast, pastes a workast.com or workast.app URL, gives a short task id, or asks to create, assign, search, complete, or comment on work in Workast.';

const skillEntry = {
  uri: 'skill://workast/SKILL.md',
  frontmatter: {
    name: 'workast',
    description: FOLDED_DESCRIPTION,
  },
  resources: [
    {
      uri: 'skill://workast/SKILL.md',
      digest,
      size,
    },
  ],
};

const INITIALIZE_PARAMS = {
  protocolVersion: '2025-03-26',
  capabilities: {},
  clientInfo: { name: 'vitest', version: '1.0.0' },
};

type InitializeResult = {
  capabilities?: {
    resources?: unknown;
    extensions?: Record<string, unknown>;
  };
  instructions?: string;
};

type SkillsListResult = {
  skills?: unknown;
  resultType?: string;
  ttlMs?: number;
  cacheScope?: string;
};

type SkillsGetResult = {
  skill?: unknown;
  resultType?: string;
  ttlMs?: number;
  cacheScope?: string;
};

type JsonRpcError = {
  code?: number;
};

type ResourceContent = {
  uri?: string;
  mimeType?: string;
  text?: string;
};

type ResourcesReadResult = {
  contents?: ResourceContent[];
};

type ResourceListEntry = {
  uri?: string;
  name?: string;
  mimeType?: string;
  description?: string;
};

type ResourcesListResult = {
  resources?: ResourceListEntry[];
};

describe('Workast skill', () => {
  setupWorkastMock();

  it('advertises the skill extension from initialize', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'initialize', INITIALIZE_PARAMS);

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as InitializeResult;
    expect(result.capabilities?.resources).toEqual(expect.any(Object));
    expect(result.capabilities?.extensions?.['io.modelcontextprotocol/skills']).toEqual({});
    expect(result.instructions).toBe(INSTRUCTIONS);
  });

  it('lists the Workast skill', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'skills/list', {});

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as SkillsListResult;
    expect(result.skills).toEqual([skillEntry]);
    expect(result.resultType).toBe('complete');
    expect(result.ttlMs).toBe(300000);
    expect(result.cacheScope).toBe('public');
  });

  it('gets the Workast skill by uri', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'skills/get', {
      uri: 'skill://workast/SKILL.md',
    });

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as SkillsGetResult;
    expect(result.skill).toEqual(skillEntry);
    expect(result.resultType).toBe('complete');
    expect(result.ttlMs).toBe(300000);
    expect(result.cacheScope).toBe('public');
  });

  it('rejects an unknown skill uri', async () => {
    const POST = createHandler();
    const { message } = await callJsonRpc(POST, 'skills/get', {
      uri: 'skill://missing/SKILL.md',
    });

    const error = message.error as JsonRpcError;
    expect(error.code).toBe(-32602);
  });

  it('reads the skill markdown resource', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'resources/read', {
      uri: 'skill://workast/SKILL.md',
    });

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as ResourcesReadResult;
    expect(Array.isArray(result.contents)).toBe(true);
    const content = result.contents?.[0];
    expect(content?.uri).toBe('skill://workast/SKILL.md');
    expect(content?.mimeType).toBe('text/markdown');
    expect(content?.text).toBe(text);
  });

  it('lists the skill markdown resource', async () => {
    const POST = createHandler();
    const { status, message } = await callJsonRpc(POST, 'resources/list');

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    const result = message.result as ResourcesListResult;
    const resource = result.resources?.find((entry) => entry.uri === 'skill://workast/SKILL.md');
    expect(resource?.uri).toBe('skill://workast/SKILL.md');
    expect(resource?.name).toBe('workast');
    expect(resource?.mimeType).toBe('text/markdown');
    expect(resource?.description).toBe(FOLDED_DESCRIPTION);
  });
});
