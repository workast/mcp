import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProtectedResourceHandlers } from '../src/auth/protected-resource';

const WELL_KNOWN = 'http://localhost:3000/.well-known/oauth-protected-resource';

function wellKnownRequest(method: string, headers?: HeadersInit): Request {
  return new Request(WELL_KNOWN, { method, headers });
}

describe('oauth protected resource metadata', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults authorization_servers to https://my.workast.com when WORKAST_AUTH_URL is unset', async () => {
    vi.stubEnv('WORKAST_AUTH_URL', '');
    const { GET } = getProtectedResourceHandlers();
    const response = await GET(wellKnownRequest('GET'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/application\/json/);
    const body = await response.json();
    expect(body.authorization_servers).toEqual(['https://my.workast.com']);
  });

  it('uses WORKAST_AUTH_URL as authorization_servers when set', async () => {
    vi.stubEnv('WORKAST_AUTH_URL', 'https://auth.example.test');
    const { GET } = getProtectedResourceHandlers();
    const response = await GET(wellKnownRequest('GET'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.authorization_servers).toEqual(['https://auth.example.test']);
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
    expect(body.authorization_servers).toEqual(['https://my.workast.com']);
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
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.authorization_servers).toEqual(['https://my.workast.com']);
  });
});
