const PROOF = 'v=MCPv1; k=ed25519; p=Ez8lKIUR+cB0az7ore8MLqpGT+K9iuwK6HlWI2ugi4M=';

export function GET(): Response {
  return new Response(PROOF, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
