const TOKEN = 'VbgsGS1gBIjGaHbGfH7nDCHnlF-MPP2bWnfrY8de7Hc';

export function GET(): Response {
  return new Response(TOKEN, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
