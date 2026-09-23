import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { meeting, meetingDetail, meetingRecordingResource } = examples;
const meetingDetailCard = {
  id: meetingDetail.id,
  createdAt: meetingDetail.createdAt,
  updatedAt: meetingDetail.updatedAt,
  summary: meetingDetail.summary,
  status: meetingDetail.status,
  eventId: meetingDetail.eventId,
  isRecurrent: meetingDetail.isRecurrent,
  organizer: {
    id: meetingDetail.organizer.id,
    name: meetingDetail.organizer.name,
  },
  totalAttendees: meetingDetail.totalAttendees,
  someAttendees: [
    {
      id: meetingDetail.someAttendees[0].id,
      name: meetingDetail.someAttendees[0].name,
    },
  ],
  list: {
    id: meetingDetail.list.id,
    name: meetingDetail.list.name,
    type: meetingDetail.list.type,
    status: meetingDetail.list.status,
    privacy: meetingDetail.list.privacy,
    link: meetingDetail.list.link,
  },
  link: meetingDetail.link,
  conferenceData: {
    joinUrl: meetingDetail.conferenceData.joinUrl,
    provider: meetingDetail.conferenceData.provider,
  },
  notetaker: { enabled: meetingDetail.notetaker.enabled },
  start: meetingDetail.start,
  end: meetingDetail.end,
  allDay: meetingDetail.allDay,
  completedTasks: meetingDetail.completedTasks,
};

describe('workast_retrieve_meeting tool', () => {
  const mock = setupWorkastMock();

  it('calls meetings.retrieve once when transcript is omitted', async () => {
    mock.meetings.retrieve.on(meeting.id).resolves(meetingDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_meeting', {
      meetingId: meeting.id,
    });

    expect(status).toBe(200);
    expectToolData(message, meetingDetailCard);
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'meetings.retrieve',
      args: [meeting.id],
    }]);
  });

  it('calls retrieve then retrieveRecording when includeTranscript is true', async () => {
    mock.meetings.retrieve.on(meeting.id).resolves(meetingDetail);
    mock.meetings.retrieveRecording.on(meeting.id).resolves(meetingRecordingResource);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_meeting', {
      meetingId: meeting.id,
      includeTranscript: true,
    });

    expect(status).toBe(200);
    expectToolData(message, {
      ...meetingDetailCard,
      recording: {
        transcript: {
          object: meetingRecordingResource.transcript.object,
          type: meetingRecordingResource.transcript.type,
          language: meetingRecordingResource.transcript.language,
          transcript: [{
            speaker: meetingRecordingResource.transcript.transcript[0].speaker,
            start: meetingRecordingResource.transcript.transcript[0].start,
            end: meetingRecordingResource.transcript.transcript[0].end,
            text: meetingRecordingResource.transcript.transcript[0].text,
          }],
        },
      },
    });
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'meetings.retrieve', args: [meeting.id] },
      { method: 'meetings.retrieveRecording', args: [meeting.id] },
    ]);
  });
});
