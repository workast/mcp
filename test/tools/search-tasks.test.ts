import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { customField, list, searchResults, subList, tag, task, user } = examples;

function searchPayload(predicates: unknown[], paging: { limit?: number; skip?: number } = {}) {
  return {
    predicates,
    includeSubTasks: true,
    sort: [{ field: 'createdAt', direction: -1 }],
    limit: paging.limit ?? 25,
    skip: paging.skip ?? 0,
    expand: ['listId', 'assignedTo'],
  };
}

describe('workast_search_tasks tool', () => {
  const mock = setupWorkastMock();

  async function expectSearch(
    args: Record<string, unknown>,
    predicates: unknown[],
  ) {
    const body = searchPayload(predicates);
    mock.tasks.list.on(body).resolves(searchResults);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_search_tasks', args);

    expect(status).toBe(200);
    const count = searchResults.tasks.length;
    const has_more = 0 + count < searchResults.total;
    expectToolData(message, {
      ...searchResults,
      count,
      skip: 0,
      has_more,
      next_skip: has_more ? count : null,
    });
    expect(mock.calls()).toEqual([{
      method: 'tasks.list',
      args: [body],
    }]);
  }

  it('compiles q to a text contains predicate', async () => {
    await expectSearch(
      { q: 'Ship' },
      [{ type: 'string', attribute: 'text', comparison: 'contains', value: 'Ship' }],
    );
  });

  it('compiles statusIs to a status eq predicate', async () => {
    await expectSearch(
      { statusIs: 'pending' },
      [{ type: 'status', attribute: 'status', comparison: 'eq', value: 'pending' }],
    );
  });

  it('compiles assignedTo to a user eq predicate', async () => {
    await expectSearch(
      { assignedTo: [user.id] },
      [{ type: 'user', attribute: 'assignedTo', comparison: 'eq', value: user.id }],
    );
  });

  it('compiles multiple assignedTo values to an OR predicate', async () => {
    await expectSearch(
      { assignedTo: [user.id, task.createdBy.id] },
      [{
        type: 'or',
        predicates: [
          { type: 'user', attribute: 'assignedTo', comparison: 'eq', value: user.id },
          { type: 'user', attribute: 'assignedTo', comparison: 'eq', value: task.createdBy.id },
        ],
      }],
    );
  });

  it('compiles dueDateAfter to a dueDate gte predicate', async () => {
    await expectSearch(
      { dueDateAfter: '2026-04-01T00:00:00.000Z' },
      [{
        type: 'date',
        attribute: 'dueDate',
        comparison: 'gte',
        value: '2026-04-01T00:00:00.000Z',
      }],
    );
  });

  it('compiles dueDateBefore to a dueDate lte predicate', async () => {
    await expectSearch(
      { dueDateBefore: '2026-04-30T00:00:00.000Z' },
      [{
        type: 'date',
        attribute: 'dueDate',
        comparison: 'lte',
        value: '2026-04-30T00:00:00.000Z',
      }],
    );
  });

  it('compiles startDateAfter to a startDate gte predicate', async () => {
    await expectSearch(
      { startDateAfter: '2026-04-01T00:00:00.000Z' },
      [{
        type: 'date',
        attribute: 'startDate',
        comparison: 'gte',
        value: '2026-04-01T00:00:00.000Z',
      }],
    );
  });

  it('compiles createdBy to a user eq predicate', async () => {
    await expectSearch(
      { createdBy: [task.createdBy.id] },
      [{ type: 'user', attribute: 'createdBy', comparison: 'eq', value: task.createdBy.id }],
    );
  });

  it('compiles createdAfter to a createdAt gte predicate', async () => {
    await expectSearch(
      { createdAfter: '2026-03-01T00:00:00.000Z' },
      [{
        type: 'date',
        attribute: 'createdAt',
        comparison: 'gte',
        value: '2026-03-01T00:00:00.000Z',
      }],
    );
  });

  it('compiles spaceId to a listId eq predicate', async () => {
    await expectSearch(
      { spaceId: list.id },
      [{ type: 'list', attribute: 'listId', comparison: 'eq', value: list.id }],
    );
  });

  it('compiles sublist to a subListName eq predicate', async () => {
    await expectSearch(
      { sublist: [subList.name] },
      [{ type: 'string', attribute: 'subListName', comparison: 'eq', value: subList.name }],
    );
  });

  it('compiles completedAfter to a doneAt gte predicate', async () => {
    await expectSearch(
      { completedAfter: '2026-04-01T00:00:00.000Z' },
      [{
        type: 'date',
        attribute: 'doneAt',
        comparison: 'gte',
        value: '2026-04-01T00:00:00.000Z',
      }],
    );
  });

  it('compiles tags to a tag eq predicate', async () => {
    await expectSearch(
      { tags: [tag.id] },
      [{ type: 'tag', attribute: 'tags', comparison: 'eq', value: tag.id }],
    );
  });

  it('compiles customFields to fieldValues eq predicates', async () => {
    await expectSearch(
      { customFields: [{ fieldId: customField.id, value: 'High' }] },
      [{ type: 'fieldValues', attribute: customField.id, comparison: 'eq', value: 'High' }],
    );
  });

  it('joins multiple filters with AND predicates', async () => {
    await expectSearch(
      {
        statusIs: 'pending',
        assignedTo: [user.id],
        spaceId: list.id,
        dueDateAfter: '2026-04-01T00:00:00.000Z',
      },
      [
        { type: 'status', attribute: 'status', comparison: 'eq', value: 'pending' },
        { type: 'user', attribute: 'assignedTo', comparison: 'eq', value: user.id },
        { type: 'list', attribute: 'listId', comparison: 'eq', value: list.id },
        {
          type: 'date',
          attribute: 'dueDate',
          comparison: 'gte',
          value: '2026-04-01T00:00:00.000Z',
        },
      ],
    );
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.tasks.list.on(searchPayload([
      { type: 'status', attribute: 'status', comparison: 'eq', value: 'pending' },
    ])).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_search_tasks', {
      statusIs: 'pending',
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });

  it('forwards limit and skip on the search body', async () => {
    const predicates = [
      { type: 'string', attribute: 'text', comparison: 'contains', value: 'Ship' },
    ];
    const body = searchPayload(predicates, { limit: 10, skip: 20 });
    mock.tasks.list.on(body).resolves(searchResults);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_search_tasks', {
      q: 'Ship',
      limit: 10,
      skip: 20,
    });

    expect(status).toBe(200);
    expect(message.error).toBeUndefined();
    expect(mock.calls()).toEqual([{
      method: 'tasks.list',
      args: [body],
    }]);
  });

  it('defaults to limit 25 and skip 0 when paging args are omitted', async () => {
    await expectSearch({}, []);
  });

  it('includes pagination fields when more results remain', async () => {
    const tasks = [task, { ...task, id: `${task.id}-2` }];
    const body = searchPayload([], { limit: 10, skip: 20 });
    mock.tasks.list.on(body).resolves({ tasks, total: 30 });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_search_tasks', {
      limit: 10,
      skip: 20,
    });

    expect(status).toBe(200);
    const text = message.result?.content?.[0]?.text;
    expect(text).toBeTruthy();
    const data = JSON.parse(text as string);
    expect(data.count).toBe(2);
    expect(data.skip).toBe(20);
    expect(data.has_more).toBe(true);
    expect(data.next_skip).toBe(22);
  });

  it('sets has_more false and next_skip null when the page is complete', async () => {
    const tasks = [task, { ...task, id: `${task.id}-2` }];
    const body = searchPayload([], { limit: 10, skip: 28 });
    mock.tasks.list.on(body).resolves({ tasks, total: 30 });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_search_tasks', {
      limit: 10,
      skip: 28,
    });

    expect(status).toBe(200);
    const text = message.result?.content?.[0]?.text;
    expect(text).toBeTruthy();
    const data = JSON.parse(text as string);
    expect(data.has_more).toBe(false);
    expect(data.next_skip).toBeNull();
  });

  it('marks oversized search results as truncated', async () => {
    const padded = { ...task, description: 'x'.repeat(200) };
    const tasks = Array.from({ length: 200 }, (_, i) => ({
      ...padded,
      id: `${task.id}-${i}`,
    }));
    expect(JSON.stringify({ tasks, total: 200 }).length).toBeGreaterThan(25000);

    const body = searchPayload([]);
    mock.tasks.list.on(body).resolves({ tasks, total: 200 });
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_search_tasks', {});

    expect(status).toBe(200);
    const text = message.result?.content?.[0]?.text;
    expect(text).toBeTruthy();
    const data = JSON.parse(text as string);
    expect(data.truncated).toBe(true);
    expect(data.truncation_message).toEqual(expect.stringMatching(/truncated/i));
    expect(data.truncation_message).toEqual(expect.stringMatching(/limit/i));
    expect(data.tasks.length).toBeLessThan(tasks.length);
    expect(data.count).toBe(data.tasks.length);
    expect(data.has_more).toBe(true);
  });

  it('passes a small search result through without truncated', async () => {
    const body = searchPayload([]);
    mock.tasks.list.on(body).resolves(searchResults);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_search_tasks', {});

    expect(status).toBe(200);
    const text = message.result?.content?.[0]?.text;
    expect(text).toBeTruthy();
    const data = JSON.parse(text as string);
    expect(data.truncated).toBeUndefined();
  });
});
