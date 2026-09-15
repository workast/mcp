import { describe, expect, it } from 'vitest';
import { GET } from '../app/health/route';

describe('GET /health', () => {
  it('returns ok JSON without Authorization', async () => {
    const response = await GET(new Request('http://localhost:3000/health'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/application\/json/);
    expect(await response.json()).toEqual({ ok: true });
  });
});
