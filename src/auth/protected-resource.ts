import {
  getPublicOrigin,
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from 'mcp-handler';

/** Scheme+host, no path. */
export function getMcpPublicOrigin(req?: Request): string | undefined {
  const pinned = process.env.MCP_PUBLIC_ORIGIN?.trim().replace(/\/$/, '');
  if (pinned) {
    return pinned;
  }
  return req ? getPublicOrigin(req) : undefined;
}

const DEFAULT_AUTH_URL = 'https://my.workast.com';

export function getProtectedResourceHandlers() {
  const authUrl = process.env.WORKAST_AUTH_URL || DEFAULT_AUTH_URL;
  return {
    GET: (req: Request) =>
      protectedResourceHandler({
        authServerUrls: [new URL(authUrl).origin],
        resourceUrl: `${getMcpPublicOrigin(req)}/mcp`,
      })(req),
    OPTIONS: metadataCorsOptionsRequestHandler(),
  };
}
