import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorkast } from '../src/workast';

describe('createWorkast', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses the SDK default host when WORKAST_API_URL is unset', async () => {
    vi.stubEnv('WORKAST_API_URL', '');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await createWorkast('test-api-key').users.me();

    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.workast.com/user/me');
  });

  it('uses WORKAST_API_URL as the SDK baseUrl when set', async () => {
    vi.stubEnv('WORKAST_API_URL', 'https://api.example.test');
    const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await createWorkast('test-api-key').users.me();

    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.example.test/user/me');
  });
});
