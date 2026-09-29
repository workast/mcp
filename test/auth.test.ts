import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/mcp/route';
import { createHandler } from '../src/create-handler';
import { API_KEY, mcpRequest } from './helpers';

function wwwAuthenticate(response: Response): string | null {
  return response.headers.get('WWW-Authenticate');
}

describe('MCP auth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 401 when Authorization is missing on the route POST', async () => {
    const response = await POST(mcpRequest('ping', {}, { apiKey: null }));

    expect(response.status).toBe(401);
  });

  it('returns 401 with WWW-Authenticate resource_metadata when Authorization is missing', async () => {
    const handler = createHandler();
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
    const handler = createHandler();
    const response = await handler(mcpRequest('ping', {}, { apiKey: API_KEY }));

    expect(response.status).toBe(200);
  });

  it('returns 200 when Authorization Bearer is a wat:: token', async () => {
    const handler = createHandler();
    const response = await handler(
      mcpRequest('ping', {}, { apiKey: 'wat::example-token' }),
    );

    expect(response.status).toBe(200);
  });

  it('pins WWW-Authenticate resource_metadata to MCP_PUBLIC_ORIGIN', async () => {
    vi.stubEnv('MCP_PUBLIC_ORIGIN', 'https://mcp.workast.com');
    const handler = createHandler();

    const base = mcpRequest('ping', {}, { apiKey: null });
    const request = new Request(base, {
      headers: {
        ...Object.fromEntries(base.headers),
        'X-Forwarded-Host': 'evil.com',
      },
    });
    const response = await handler(request);

    expect(response.status).toBe(401);
    const challenge = wwwAuthenticate(response);
    const metadataUrl = challenge?.match(/resource_metadata="([^"]+)"/)?.[1];
    expect(metadataUrl).toBe(
      'https://mcp.workast.com/.well-known/oauth-protected-resource',
    );
    expect(challenge).not.toContain('evil.com');
  });
});
