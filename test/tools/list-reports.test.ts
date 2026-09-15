import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { searches } = examples;

describe('workast_list_reports tool', () => {
  const mock = setupWorkastMock();

  it('calls searches.list with no args', async () => {
    mock.searches.list.on({ limit: 50, skip: 0 }).resolves(searches);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_reports', {});

    expect(status).toBe(200);
    expectToolData(message, {
      searches: searches.searches,
      total: searches.total,
      count: searches.searches.length,
      skip: 0,
      has_more: true,
      next_skip: searches.searches.length,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.list',
      args: [{ limit: 50, skip: 0 }],
    }]);
  });

  it('calls searches.listHome when home is true', async () => {
    mock.searches.listHome.on({ limit: 50, skip: 0 }).resolves(searches);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_reports', { home: true });

    expect(status).toBe(200);
    expectToolData(message, {
      searches: searches.searches,
      total: searches.total,
      count: searches.searches.length,
      skip: 0,
      has_more: true,
      next_skip: searches.searches.length,
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.listHome',
      args: [{ limit: 50, skip: 0 }],
    }]);
  });

  it('forwards limit and skip to searches.list', async () => {
    mock.searches.list.on({ limit: 10, skip: 20 }).resolves(searches);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_reports', {
      limit: 10,
      skip: 20,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.list',
      args: [{ limit: 10, skip: 20 }],
    }]);
    expectToolData(message, {
      searches: searches.searches,
      total: searches.total,
      count: searches.searches.length,
      skip: 20,
      has_more: false,
      next_skip: null,
    });
  });

  it('forwards home with limit and skip', async () => {
    mock.searches.listHome.on({ limit: 10, skip: 0 }).resolves(searches);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_reports', {
      home: true,
      limit: 10,
      skip: 0,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'searches.listHome',
      args: [{ limit: 10, skip: 0 }],
    }]);
    expectToolData(message, {
      searches: searches.searches,
      total: searches.total,
      count: searches.searches.length,
      skip: 0,
      has_more: true,
      next_skip: searches.searches.length,
    });
  });

  it('sets has_more true when more reports remain', async () => {
    const page = {
      searches: searches.searches,
      total: searches.total,
    };
    mock.searches.list.on({ limit: 1, skip: 0 }).resolves(page);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_reports', {
      limit: 1,
      skip: 0,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      searches: page.searches,
      total: page.total,
      count: page.searches.length,
      skip: 0,
      has_more: true,
      next_skip: page.searches.length,
    });
  });
});
