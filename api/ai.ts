/*
 * OWNER: MiniMax session. See handoffs/MINIMAX_AI_N8N.md.
 * Vercel serverless function. Proxies the browser's AI requests to the
 * MiniMax API using the MINIMAX_API_KEY env var. Never expose the key.
 */
export default async function handler(req: any, res: any) {
  res.statusCode = 501;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ error: "AI endpoint not implemented yet" }));
}
