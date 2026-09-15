import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { search, searchDetail } = examples;

describe('workast_retrieve_report tool', () => {
  const mock = setupWorkastMock();

  it('calls searches.retrieve with default getTasks and returns the report', async () => {
    mock.searches.retrieve.on(search.id, { getTasks: 25 }).resolves(searchDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_report', {
      reportId: search.id,
    });

    expect(status).toBe(200);
    expectToolData(message, searchDetail);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.retrieve',
      args: [search.id, { getTasks: 25 }],
    }]);
  });

  it('calls searches.retrieve with getTasks when set', async () => {
    mock.searches.retrieve.on(search.id, { getTasks: 50 }).resolves(searchDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_report', {
      reportId: search.id,
      getTasks: 50,
    });

    expect(status).toBe(200);
    expectToolData(message, searchDetail);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.retrieve',
      args: [search.id, { getTasks: 50 }],
    }]);
  });
});
