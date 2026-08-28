import { describe, expect, it } from 'vitest';
import { examples, errors } from '@workast/sdk/mock';
import { createHandler } from '../../src/create-handler';
import {
  callTool,
  expectToolData,
  expectUnauthorizedTool,
  setupWorkastMock,
} from '../helpers';

const { meeting, meetingDetail, meetingRecordingResource } = examples;

describe('workast_retrieve_meeting tool', () => {
  const mock = setupWorkastMock();

  it('calls meetings.retrieve once when transcript is omitted', async () => {
    mock.meetings.retrieve.on(meeting.id).resolves(meetingDetail);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_meeting', {
      meetingId: meeting.id,
    });

    expect(status).toBe(200);
    expectToolData(message, meetingDetail);
    expect(mock.calls()).toEqual([{
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
    expectToolData(message, { ...meetingDetail, recording: meetingRecordingResource });
    expect(mock.calls()).toEqual([
      { method: 'meetings.retrieve', args: [meeting.id] },
      { method: 'meetings.retrieveRecording', args: [meeting.id] },
    ]);
  });

  it('returns a failed tool result on SDK 401', async () => {
    mock.meetings.retrieve.on(meeting.id).rejects(errors.unauthorized);
    const POST = createHandler();

    const { status, message } = await callTool(POST, 'workast_retrieve_meeting', {
      meetingId: meeting.id,
    });

    expect(status).toBe(200);
    expectUnauthorizedTool(message);
  });
});
