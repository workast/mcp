import { Workast } from '@workast/sdk';

export function createWorkast(apiKey: string): Workast {
  return new Workast({ apiKey });
}
