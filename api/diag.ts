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
    return { name, status: response.status, snippet: text.slice(0, 180) };
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

  const results = await Promise.all([
    probe(
      "openai-compat chat/completions M2.7",
      "https://api.minimax.io/v1/chat/completions",
      { authorization: `Bearer ${key}` },
      { model: "MiniMax-M2.7", messages: [{ role: "user", content: "hi" }], max_tokens: 8 }
    ),
    probe(
      "anthropic-compat messages M2.7",
      "https://api.minimax.io/anthropic/v1/messages",
      { authorization: `Bearer ${key}`, "x-api-key": key, "anthropic-version": "2023-06-01" },
      { model: "MiniMax-M2.7", max_tokens: 8, messages: [{ role: "user", content: "hi" }] }
    ),
    probe(
      "legacy chatcompletion_v2 M2.7",
      "https://api.minimax.io/v1/text/chatcompletion_v2",
      { authorization: `Bearer ${key}` },
      { model: "MiniMax-M2.7", messages: [{ sender_type: "USER", sender_name: "user", text: "hi" }] }
    ),
  ]);

  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ results }, null, 2));
}
