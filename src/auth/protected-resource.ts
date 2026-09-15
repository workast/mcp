import {
  getPublicOrigin,
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from 'mcp-handler';

export function getProtectedResourceHandlers() {
  const authMode = process.env.MCP_AUTH_MODE ?? 'agent';
  const authUrl = process.env.WORKAST_AUTH_URL;
  const corsHandler = metadataCorsOptionsRequestHandler();
  if (authMode !== 'user') {
    const notFound = async () => new Response(null, { status: 404 });
    return { GET: notFound, OPTIONS: corsHandler };
  }
  if (!authUrl) {
    throw new Error('WORKAST_AUTH_URL is required when MCP_AUTH_MODE=user');
  }
  return {
    GET: (req: Request) =>
      protectedResourceHandler({
        authServerUrls: [new URL(authUrl).origin],
        resourceUrl: `${getPublicOrigin(req)}/mcp`,
      })(req),
    OPTIONS: corsHandler,
  };
}
