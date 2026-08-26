import { describe, expect, it } from 'vitest';
import { getProtectedResourceHandlers } from '../src/auth/protected-resource';

const AUTH_URL = 'https://my.workast.com';
const WELL_KNOWN = 'http://localhost:3000/.well-known/oauth-protected-resource';

function wellKnownRequest(method: string): Request {
  return new Request(WELL_KNOWN, { method });
}

describe('oauth protected resource metadata', () => {
  describe('user mode', () => {
    const { GET, OPTIONS } = getProtectedResourceHandlers({
      authMode: 'user',
      authUrl: AUTH_URL,
    });

    it('returns JSON metadata with authorization_servers and resource', async () => {
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

    it('returns CORS * on OPTIONS', async () => {
      const response = await OPTIONS(wellKnownRequest('OPTIONS'));

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });
  });

  describe('agent mode', () => {
    const { GET } = getProtectedResourceHandlers({ authMode: 'agent' });

    it('returns 404', async () => {
      const response = await GET(wellKnownRequest('GET'));

      expect(response.status).toBe(404);
    });
  });
});
