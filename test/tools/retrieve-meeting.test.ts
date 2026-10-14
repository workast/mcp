import { describe, expect, it } from 'vitest';
import { examples } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import { projectMeeting } from '../../src/project';
import {
  callTool,
  expectToolData,
  setupWorkastMock,
} from '../helpers';

const { meeting, meetingResource, meetingRecordingResource } = examples;

describe('workast_retrieve_meeting tool', () => {
  const mock = setupWorkastMock();

  it('calls meetings.retrieve once when transcript is omitted', async () => {
    mock.meetings.retrieve.on(meeting.id).resolves(meetingResource);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_meeting', {
      meetingId: meeting.id,
    });

    expect(status).toBe(200);
    expectToolData(message, projectMeeting(meetingResource));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      {
      method: 'meetings.retrieve',
      args: [meeting.id],
    }]);
  });

  it('calls retrieve then retrieveRecording when includeTranscript is true', async () => {
    mock.meetings.retrieve.on(meeting.id).resolves(meetingResource);
    mock.meetings.retrieveRecording.on(meeting.id).resolves(meetingRecordingResource);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_meeting', {
      meetingId: meeting.id,
      includeTranscript: true,
    });

    expect(status).toBe(200);
    expectToolData(message, projectMeeting({
      ...meetingResource,
      recording: meetingRecordingResource,
    }));
    expect(mock.calls()).toEqual([
      { method: 'tokens.retrieve', args: [] },
      { method: 'meetings.retrieve', args: [meeting.id] },
      { method: 'meetings.retrieveRecording', args: [meeting.id] },
    ]);
  });
});
