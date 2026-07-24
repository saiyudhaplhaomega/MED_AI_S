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
    try {
      const parsed = JSON.parse(text);
      return {
        name,
        status: response.status,
        baseResp: parsed?.base_resp ?? null,
        error: parsed?.error ?? null,
        content:
          parsed?.choices?.[0]?.message?.content?.slice(0, 80) ??
          parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.slice(0, 80) ??
          null,
      };
    } catch {
      return { name, status: response.status, snippet: text.slice(0, 220) };
    }
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

  const geminiKey = process.env.GEMINI_API_KEY || "";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}&pageSize=50`
  );
  const data = await response.json().catch(() => null);
  const models = Array.isArray(data?.models)
    ? data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name)
    : data;

  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ status: response.status, models }, null, 2));
}
