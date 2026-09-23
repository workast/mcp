import { Workast } from '@workast/sdk';

export function createWorkast(apiKey: string): Workast {
  const baseUrl = process.env.WORKAST_API_URL;
  return new Workast(baseUrl ? { apiKey, baseUrl } : { apiKey });
}
