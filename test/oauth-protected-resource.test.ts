import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProtectedResourceHandlers } from '../src/auth/protected-resource';

const AUTH_URL = 'https://my.workast.com';
const WELL_KNOWN = 'http://localhost:3000/.well-known/oauth-protected-resource';

function wellKnownRequest(method: string, headers?: HeadersInit): Request {
  return new Request(WELL_KNOWN, { method, headers });
}

describe('oauth protected resource metadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('user mode', () => {
    beforeEach(() => {
      vi.stubEnv('MCP_AUTH_MODE', 'user');
      vi.stubEnv('WORKAST_AUTH_URL', AUTH_URL);
    });

    it('returns JSON metadata with authorization_servers and resource', async () => {
      const { GET } = getProtectedResourceHandlers();
      const response = await GET(wellKnownRequest('GET'));

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toMatch(/application\/json/);

      const body = await response.json();
      expect(Array.isArray(body.authorization_servers)).toBe(true);
      expect(body.authorization_servers).toContain(AUTH_URL);
      expect(typeof body.resource).toBe('string');
      expect(body.resource.length).toBeGreaterThan(0);
      expect(new URL(body.resource).origin.length).toBeGreaterThan(0);
    });

    it('pins resource to MCP_PUBLIC_ORIGIN when X-Forwarded-Host is spoofed', async () => {
      vi.stubEnv('MCP_PUBLIC_ORIGIN', 'https://mcp.workast.com');
      const { GET } = getProtectedResourceHandlers();
      const response = await GET(wellKnownRequest('GET', {
        'X-Forwarded-Host': 'evil.com',
      }));

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.resource).toBe('https://mcp.workast.com/mcp');
      expect(body.authorization_servers).toEqual([AUTH_URL]);
    });

    it('returns CORS * on OPTIONS', async () => {
      const { OPTIONS } = getProtectedResourceHandlers();
      const response = await OPTIONS(wellKnownRequest('OPTIONS'));

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('strips a trailing slash from authorization_servers', async () => {
      vi.stubEnv('WORKAST_AUTH_URL', 'https://my.workast.com/');
      const { GET } = getProtectedResourceHandlers();

      const response = await GET(wellKnownRequest('GET'));
      const body = await response.json();

      expect(body.authorization_servers).toContain('https://my.workast.com');
      expect(body.authorization_servers).not.toContain('https://my.workast.com/');
    });
  });

  describe('agent mode', () => {
    beforeEach(() => {
      vi.stubEnv('MCP_AUTH_MODE', 'agent');
    });

    it('returns 404', async () => {
      const { GET } = getProtectedResourceHandlers();
      const response = await GET(wellKnownRequest('GET'));

      expect(response.status).toBe(404);
    });
  });
});
