import { Workast } from '@workast/sdk';

export type CreateWorkastOptions = {
  fetch?: typeof fetch;
  baseUrl?: string;
};

export function createWorkast(
  apiKey: string,
  options: CreateWorkastOptions = {},
): Workast {
  return new Workast({
    apiKey,
    fetch: options.fetch,
    baseUrl: options.baseUrl,
  });
}
