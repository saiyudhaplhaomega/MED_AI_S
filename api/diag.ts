/*
 * Temporary diagnostic: probes which MiniMax API endpoint accepts the
 * configured key. Reports status codes and short error snippets only.
 * Remove before final submission.
 */

async function probe(name: string, url: string, headers: Record<string, string>, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    return { name, status: response.status, snippet: text.slice(0, 220) };
  } catch (err) {
    return { name, status: 0, snippet: err instanceof Error ? err.message : "failed" };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: any, res: any) {
  const key = process.env.MINIMAX_API_KEY || "";
  if (!key) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "no key configured" }));
    return;
  }

  const v2 = "https://api.minimax.io/v1/text/chatcompletion_v2";
  const auth = { authorization: `Bearer ${key}` };
  const messages = [{ role: "user", content: "Say hi in two words." }];

  const results = await Promise.all([
    probe("v2 role/content MiniMax-M2.7", v2, auth, { model: "MiniMax-M2.7", messages, max_tokens: 16 }),
    probe("v2 role/content MiniMax-M1", v2, auth, { model: "MiniMax-M1", messages, max_tokens: 16 }),
    probe("v2 role/content MiniMax-Text-01", v2, auth, { model: "MiniMax-Text-01", messages, max_tokens: 16 }),
  ]);

  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ results }, null, 2));
}
