import { describe, expect, it } from 'vitest';
import { POST } from '../app/mcp/route';
import { API_KEY, mcpRequest, sseData } from './helpers';

describe('workast_ping tool', () => {
  it('returns ok via MCP tools/call', async () => {
    const response = await POST(mcpRequest('workast_ping', {}, { apiKey: API_KEY }));

    expect(response.status).toBe(200);
    const message = sseData(await response.text()) as {
      result?: { content?: Array<{ type: string; text: string }> };
    };
    expect(message.result?.content).toEqual([{ type: 'text', text: 'ok' }]);
  });
});
