import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHandler } from '../src/create-handler';
import { callTool } from './helpers';

describe('forwarded Workast request headers', () => {
  const POST = createHandler();

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  async function aboutMeCalls(headers?: Record<string, string>) {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await callTool(POST, 'workast_about_me', {}, { headers });

    const calls = fetchMock.mock.calls as Array<[unknown, RequestInit]>;
    expect(calls.length).toBeGreaterThan(0);
    return calls;
  }

  it('copies W-Trace and leaves X-Other off every Workast request', async () => {
    const calls = await aboutMeCalls({ 'W-Trace': 'abc', 'X-Other': 'no' });

    for (const call of calls) {
      const headers = new Headers(call[1].headers);
      expect(headers.get('w-trace')).toBe('abc');
      expect(headers.get('x-other')).toBeNull();
    }
  });

  it('copies a lowercase w-trace header onto every Workast request', async () => {
    const calls = await aboutMeCalls({ 'w-trace': 'abc' });

    for (const call of calls) {
      const headers = new Headers(call[1].headers);
      expect(headers.get('w-trace')).toBe('abc');
    }
  });

  it('leaves off a W-Trace value that is blank after trim', async () => {
    const calls = await aboutMeCalls({ 'W-Trace': '   ' });

    for (const call of calls) {
      const headers = new Headers(call[1].headers);
      expect(headers.get('w-trace')).toBeNull();
    }
  });

  it('does not send w-trace when the MCP request only has the bearer token', async () => {
    const calls = await aboutMeCalls();

    for (const call of calls) {
      const headers = new Headers(call[1].headers);
      expect(headers.get('w-trace')).toBeNull();
    }
  });

  it('copies W-Trace and W-Request onto every Workast request', async () => {
    const calls = await aboutMeCalls({ 'W-Trace': 'abc', 'W-Request': 'req-1' });

    for (const call of calls) {
      const headers = new Headers(call[1].headers);
      expect(headers.get('w-trace')).toBe('abc');
      expect(headers.get('w-request')).toBe('req-1');
    }
  });

  it('sends the MCP bearer token on every Workast request', async () => {
    const calls = await aboutMeCalls();

    for (const call of calls) {
      const headers = new Headers(call[1].headers);
      expect(headers.get('authorization')).toBe('Bearer test-api-key');
    }
  });
});
