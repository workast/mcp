import { describe, expect, it } from 'vitest';
import { POST } from '../app/mcp/route';
import { createHandler } from '../src/create-handler';
import { API_KEY, mcpRequest } from './helpers';

const AUTH_URL = 'https://my.workast.com';

function wwwAuthenticate(response: Response): string | null {
  return response.headers.get('WWW-Authenticate');
}

describe('MCP auth', () => {
  it('returns 401 when Authorization is missing', async () => {
    const response = await POST(mcpRequest('ping', {}, { apiKey: null }));

    expect(response.status).toBe(401);
  });

  describe('agent mode', () => {
    const handler = createHandler({ authMode: 'agent' });

    it('returns 401 when Authorization is missing', async () => {
      const response = await handler(mcpRequest('ping', {}, { apiKey: null }));

      expect(response.status).toBe(401);
    });

    it('does not advertise resource_metadata on 401', async () => {
      const response = await handler(mcpRequest('ping', {}, { apiKey: null }));

      expect(response.status).toBe(401);
      const challenge = wwwAuthenticate(response);
      if (challenge != null) {
        expect(challenge).not.toContain('resource_metadata');
      }
    });

    it('returns 200 when Authorization Bearer is present', async () => {
      const response = await handler(mcpRequest('ping', {}, { apiKey: API_KEY }));

      expect(response.status).toBe(200);
    });
  });

  describe('user mode', () => {
    const handler = createHandler({ authMode: 'user', authUrl: AUTH_URL });

    it('returns 401 when Authorization is missing', async () => {
      const response = await handler(mcpRequest('ping', {}, { apiKey: null }));

      expect(response.status).toBe(401);
    });

    it('returns 401 with WWW-Authenticate resource_metadata', async () => {
      const response = await handler(mcpRequest('ping', {}, { apiKey: null }));

      expect(response.status).toBe(401);
      const challenge = wwwAuthenticate(response);
      expect(challenge).toMatch(/Bearer/i);
      expect(challenge).toContain('resource_metadata=');
      const metadataUrl = challenge?.match(/resource_metadata="([^"]+)"/)?.[1];
      expect(metadataUrl).toBeTruthy();
      expect(metadataUrl).toContain('/.well-known/oauth-protected-resource');
    });

    it('returns 200 when Authorization Bearer is present', async () => {
      const response = await handler(mcpRequest('ping', {}, { apiKey: API_KEY }));

      expect(response.status).toBe(200);
    });
  });
});
