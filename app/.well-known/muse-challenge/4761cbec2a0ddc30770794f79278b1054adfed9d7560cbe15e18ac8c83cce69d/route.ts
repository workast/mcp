const TOKEN = 'muse-challenge=4761cbec2a0ddc30770794f79278b1054adfed9d7560cbe15e18ac8c83cce69d';

export function GET(): Response {
  return new Response(TOKEN, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
