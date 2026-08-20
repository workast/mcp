import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { searches } = examples;

describe('list_reports tool', () => {
  const mock = setupWorkastMock();

  it('calls searches.list with no args', async () => {
    mock.searches.list.on().resolves(searches);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_reports', {});

    expect(status).toBe(200);
    expectToolData(message, searches);
    expect(mock.calls()).toEqual([{ method: 'searches.list', args: [] }]);
  });

  it('calls searches.list with home when home is set', async () => {
    mock.searches.list.on({ home: true }).resolves(searches);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_reports', { home: true });

    expect(status).toBe(200);
    expectToolData(message, searches);
    expect(mock.calls()).toEqual([{
      method: 'searches.list',
      args: [{ home: true }],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.searches.list.on().rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_reports', {});

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
