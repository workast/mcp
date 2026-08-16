import type { AuthInfo } from '@modelcontextprotocol/server';

/**
 * Accept any non-blank Bearer token as a Workast API key.
 * Missing or blank → undefined (withMcpAuth returns 401 when required).
 */
export function verifyApiKey(
  _req: Request,
  bearerToken?: string,
): AuthInfo | undefined {
  if (bearerToken == null || bearerToken.trim() === '') {
    return undefined;
  }

  return {
    token: bearerToken,
    clientId: 'api-key',
    scopes: ['workast'],
  };
}
