import { Analytics } from '@customerio/cdp-analytics-node';

let client: Analytics | undefined;

export function getClient(): Analytics | undefined {
  const writeKey = process.env.CUSTOMERIO_WRITE_KEY?.trim();
  if (!writeKey) {
    return undefined;
  }
  if (!client) {
    const host = process.env.CUSTOMERIO_HOST;
    client = host
      ? new Analytics({ writeKey, host, maxEventsInBatch: 1 })
      : new Analytics({ writeKey, maxEventsInBatch: 1 });
  }
  return client;
}
