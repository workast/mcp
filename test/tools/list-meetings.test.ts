import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { meetings, task, user } = examples;

const timeRange = {
  timeMin: '2026-04-01T00:00:00.000Z',
  timeMax: '2026-04-30T23:59:59.000Z',
};

describe('list_meetings tool', () => {
  const mock = setupWorkastMock();

  it('calls meetings.list with timeMin and timeMax', async () => {
    mock.meetings.list.on(timeRange).resolves(meetings);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
    });

    expect(status).toBe(200);
    expectToolData(message, meetings);
    expect(mock.calls()).toEqual([{
      method: 'meetings.list',
      args: [timeRange],
    }]);
  });

  it('calls meetings.list with dates and participants as attendees', async () => {
    const query = { ...timeRange, attendees: [user.id, task.createdBy.id] };
    mock.meetings.list.on(query).resolves(meetings);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
      participants: [user.id, task.createdBy.id],
    });

    expect(status).toBe(200);
    expectToolData(message, meetings);
    expect(mock.calls()).toEqual([{
      method: 'meetings.list',
      args: [query],
    }]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.meetings.list.on(timeRange).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
