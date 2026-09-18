import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { meetings, task, user } = examples;
const listedMeeting = meetings.meetings[0];
const meetingCard = {
  id: listedMeeting.id,
  summary: listedMeeting.summary,
  eventId: listedMeeting.eventId,
  isRecurrent: listedMeeting.isRecurrent,
  organizer: {
    id: listedMeeting.organizer.id,
    name: listedMeeting.organizer.name,
  },
  totalAttendees: listedMeeting.totalAttendees,
  someAttendees: [
    { id: listedMeeting.someAttendees[0].id, name: listedMeeting.someAttendees[0].name },
    { id: listedMeeting.someAttendees[1].id, name: listedMeeting.someAttendees[1].name },
  ],
  link: listedMeeting.link,
  start: listedMeeting.start,
  end: listedMeeting.end,
  allDay: listedMeeting.allDay,
  completedTasks: listedMeeting.completedTasks,
};
const meetingsCard = {
  meetings: [meetingCard],
  nextPageToken: meetings.nextPageToken,
};

const timeRange = {
  timeMin: '2026-04-01T00:00:00.000Z',
  timeMax: '2026-04-30T23:59:59.000Z',
};

describe('workast_list_meetings tool', () => {
  const mock = setupWorkastMock();

  it('calls meetings.list with timeMin and timeMax', async () => {
    const query = { ...timeRange, maxResults: 50 };
    mock.meetings.list.on(query).resolves(meetings);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
    });

    expect(status).toBe(200);
    expectToolData(message, { ...meetingsCard, has_more: true });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'meetings.list',
      args: [query],
    }]);
  });

  it('calls meetings.list with dates and participants as attendees', async () => {
    const query = {
      ...timeRange,
      attendees: [user.id, task.createdBy.id],
      maxResults: 50,
    };
    mock.meetings.list.on(query).resolves(meetings);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
      participants: [user.id, task.createdBy.id],
    });

    expect(status).toBe(200);
    expectToolData(message, { ...meetingsCard, has_more: true });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'meetings.list',
      args: [query],
    }]);
  });

  it('forwards limit as maxResults and pageToken', async () => {
    const query = { ...timeRange, maxResults: 10, pageToken: meetings.nextPageToken };
    mock.meetings.list.on(query).resolves(meetings);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
      limit: 10,
      pageToken: meetings.nextPageToken,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'meetings.list',
      args: [query],
    }]);
    expectToolData(message, { ...meetingsCard, has_more: true });
  });

  it('defaults maxResults to 50', async () => {
    const query = { ...timeRange, maxResults: 50 };
    mock.meetings.list.on(query).resolves(meetings);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
    });

    expect(status).toBe(200);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'meetings.list',
      args: [query],
    }]);
    expectToolData(message, { ...meetingsCard, has_more: true });
  });

  it('sets has_more false when nextPageToken is null', async () => {
    const page = { ...meetings, nextPageToken: null };
    const query = { ...timeRange, maxResults: 50 };
    mock.meetings.list.on(query).resolves(page);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_list_meetings', {
      startDateAfter: timeRange.timeMin,
      startDateBefore: timeRange.timeMax,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      meetings: [meetingCard],
      nextPageToken: null,
      has_more: false,
    });
  });
});
