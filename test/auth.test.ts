import { describe, expect, it } from 'vitest';
import { POST } from '../app/mcp/route';
import { mcpRequest } from './helpers';

describe('MCP auth', () => {
  it('returns 401 when Authorization is missing', async () => {
    const response = await POST(mcpRequest('ping', {}, { apiKey: null }));

    expect(response.status).toBe(401);
  });
});
