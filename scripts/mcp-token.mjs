// Mint a Workast MCP bearer for local evals.
// Run from workast-mcp: node scripts/mcp-token.mjs
// Opens the authorize page, catches the localhost redirect, and prints the token.
// Put that value in WORKAST_MCP_TOKEN. Do not commit it.

import { execFile } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const authUrl = (process.env.WORKAST_AUTH_URL || 'https://my.workast.com').replace(/\/$/, '');
const timeoutMs = 5 * 60 * 1000;

function base64url(size) {
  return randomBytes(size).toString('base64url');
}

function openBrowser(url) {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  execFile(command, args, (error) => {
    if (error) {
      process.stderr.write(`Open this URL in a browser:\n${url}\n`);
    }
  });
}

function listen() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

function waitForCallback(server, expectedState) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timed out waiting for authorization'));
    }, timeoutMs);

    server.on('request', (request, response) => {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        response.writeHead(404).end();
        return;
      }

      clearTimeout(timer);
      const error = url.searchParams.get('error');
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end('<p>Authorization finished. You can close this window.</p>');

      if (error) {
        reject(new Error(`Authorization failed: ${error}`));
        return;
      }
      if (!code || state !== expectedState) {
        reject(new Error('Authorization response was missing a matching code'));
        return;
      }
      resolve(code);
    });
  });
}

async function registerClient(redirectUri) {
  const response = await fetch(`${authUrl}/oauth/mcp/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Workast MCP token',
      redirect_uris: [redirectUri],
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.client_id) {
    throw new Error(body.error_description || body.error || `Client registration failed (${response.status})`);
  }
  return body.client_id;
}

async function exchangeCode({ clientId, code, redirectUri, verifier }) {
  const response = await fetch(`${authUrl}/oauth/mcp/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || `Token exchange failed (${response.status})`);
  }
  return body.access_token;
}

const { server, port } = await listen();
const redirectUri = `http://127.0.0.1:${port}/callback`;
const state = base64url(16);
const verifier = base64url(32);
const challenge = createHash('sha256').update(verifier).digest('base64url');

try {
  const clientId = await registerClient(redirectUri);
  const callback = waitForCallback(server, state);
  const authorize = new URL(`${authUrl}/oauth/mcp/authorize`);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', challenge);
  authorize.searchParams.set('code_challenge_method', 'S256');
  process.stderr.write(`Waiting for you to authorize at ${authUrl}\n`);
  openBrowser(authorize.toString());
  const code = await callback;
  const token = await exchangeCode({
    clientId, code, redirectUri, verifier,
  });
  process.stdout.write(`${token}\n`);
  process.stderr.write('Set this as WORKAST_MCP_TOKEN. Do not commit it.\n');
} finally {
  server.close();
}
