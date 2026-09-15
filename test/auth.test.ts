import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/mcp/route';
import { createHandler } from '../src/create-handler';
import { API_KEY, mcpRequest } from './helpers';

const AUTH_URL = 'https://my.workast.com';

function wwwAuthenticate(response: Response): string | null {
  return response.headers.get('WWW-Authenticate');
}

describe('MCP auth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 401 when Authorization is missing', async () => {
    const response = await POST(mcpRequest('ping', {}, { apiKey: null }));

    expect(response.status).toBe(401);
  });

  it('throws when MCP_AUTH_MODE is user and WORKAST_AUTH_URL is missing', () => {
    vi.stubEnv('MCP_AUTH_MODE', 'user');
    vi.stubEnv('WORKAST_AUTH_URL', '');

    expect(() => createHandler()).toThrow('WORKAST_AUTH_URL is required when MCP_AUTH_MODE=user');
  });

  describe('agent mode', () => {
    let handler: ReturnType<typeof createHandler>;

    beforeEach(() => {
      vi.stubEnv('MCP_AUTH_MODE', 'agent');
      handler = createHandler();
    });

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

  describe('user mode', () => {
    let handler: ReturnType<typeof createHandler>;

    beforeEach(() => {
      vi.stubEnv('MCP_AUTH_MODE', 'user');
      vi.stubEnv('WORKAST_AUTH_URL', AUTH_URL);
      handler = createHandler();
    });

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
