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

function searchPayload(predicates: unknown[]) {
  return {
    predicates,
    includeSubTasks: true,
    sort: [{ field: 'createdAt', direction: -1 }],
    limit: 25,
    expand: ['listId', 'assignedTo'],
  };
}

describe('search_tasks tool', () => {
  const mock = setupWorkastMock();

  async function expectSearch(
    args: Record<string, unknown>,
    predicates: unknown[],
  ) {
    const body = searchPayload(predicates);
    mock.tasks.list.on(body).resolves(searchResults);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'search_tasks', args);

    expect(status).toBe(200);
    expectToolData(message, searchResults);
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

    const { status, message } = await callTool(POST, 'search_tasks', {
      statusIs: 'pending',
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
