import { Workast } from '@workast/sdk';

export function createWorkast(apiKey: string, headers?: Record<string, string>): Workast {
  const baseUrl = process.env.WORKAST_API_URL;
  const client = new Workast(baseUrl ? { apiKey, baseUrl } : { apiKey });
  if (headers && Object.keys(headers).length > 0) {
    return client.withHeaders(headers);
  }
  return client;
}
