/*
 * OWNER: MiniMax session. See handoffs/MINIMAX_AI_N8N.md.
 * Vercel serverless function. Proxies the browser's AI requests to the
 * MiniMax API using the MINIMAX_API_KEY env var. Never expose the key.
 */

const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || "MiniMax-M2";

const GUARDRAILS =
  "Never invent facts that are not present in the provided material. Do not give legal or medical advice or diagnoses. Keep the patient's dignity: no lurid or sensational language.";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

interface HeadlineEventInput {
  id: string;
  summary: string;
  recordType: string | null;
  bodyParts: string[];
}

async function callMiniMax(messages: ChatMessage[], temperature: number): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MINIMAX_MODEL, messages, temperature }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`MiniMax API error ${response.status}: ${errorBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("MiniMax API returned no content");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function parseBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function sendJson(res: any, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

async function handleCaseSummary(caseDigest: string): Promise<{ text: string }> {
  const system = `You are a paralegal assistant drafting a treatment narrative for a personal-injury attorney from a medical-record digest. Write a single 150 to 220 word plain-prose narrative covering: mechanism of injury context if present, the arc of care, escalations, gaps in treatment, and current status. No bullet points, no markdown, no headings, just prose. Use only facts present in the digest. ${GUARDRAILS}`;
  const user = `Case digest:\n${caseDigest}\n\nWrite the narrative now.`;

  const text = await callMiniMax(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    0.4
  );
  return { text: text.trim() };
}

async function handleHeadlines(
  events: HeadlineEventInput[]
): Promise<{ headlines: Record<string, string> }> {
  if (!Array.isArray(events) || events.length === 0) return { headlines: {} };
  const batch = events.slice(0, 40);

  const system = `You write short headlines for medical-record events on a personal-injury case timeline. Each headline is at most 9 words, concrete and specific, for example "First lumbar MRI shows L4-L5 bulge" rather than "Patient had imaging". Respond with ONLY a strict JSON object mapping each input id to its headline string, no other text, no markdown fences. ${GUARDRAILS}`;
  const user = `Events:\n${JSON.stringify(
    batch.map((e) => ({
      id: e.id,
      summary: e.summary,
      recordType: e.recordType,
      bodyParts: e.bodyParts,
    }))
  )}\n\nRespond with only the JSON object.`;

  const text = await callMiniMax(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    0.2
  );

  const headlines: Record<string, string> = {};
  const validIds = new Set(batch.map((e) => e.id));

  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/, "");
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      for (const [id, headline] of Object.entries(parsed as Record<string, unknown>)) {
        if (validIds.has(id) && typeof headline === "string" && headline.trim().length > 0) {
          headlines[id] = headline.trim();
        }
      }
    }
  } catch {
    // Malformed JSON from the model: drop the whole batch, the UI falls back
    // to each event's deterministic headline.
  }

  return { headlines };
}

async function handleRephrase(
  text: string,
  tone: "plain" | "clinical" | "jury"
): Promise<{ text: string }> {
  const toneInstructions: Record<"plain" | "clinical" | "jury", string> = {
    plain: "Rewrite at an 8th-grade reading level, short clear sentences, no jargon.",
    clinical: "Rewrite as terse, precise clinical shorthand, medical register.",
    jury: "Rewrite in a human, sensory, plain-spoken way a juror would relate to. Do not draw legal conclusions.",
  };

  const system = `You rephrase one medical-record summary for a personal-injury case file. ${toneInstructions[tone]} Return only the rewritten text, no preamble, no quotes. ${GUARDRAILS}`;
  const user = `Original text:\n${text}`;

  const result = await callMiniMax(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    0.3
  );
  return { text: result.trim() };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const body = parseBody(req);
  const action = body?.action;

  try {
    if (action === "case-summary") {
      if (typeof body.caseDigest !== "string" || body.caseDigest.length === 0) {
        sendJson(res, 400, { error: "caseDigest is required" });
        return;
      }
      sendJson(res, 200, await handleCaseSummary(body.caseDigest));
      return;
    }

    if (action === "headlines") {
      if (!Array.isArray(body.events)) {
        sendJson(res, 400, { error: "events is required" });
        return;
      }
      sendJson(res, 200, await handleHeadlines(body.events));
      return;
    }

    if (action === "rephrase") {
      if (typeof body.text !== "string" || body.text.length === 0) {
        sendJson(res, 400, { error: "text is required" });
        return;
      }
      const tone = body.tone === "clinical" || body.tone === "jury" ? body.tone : "plain";
      sendJson(res, 200, await handleRephrase(body.text, tone));
      return;
    }

    sendJson(res, 400, { error: `Unknown action: ${String(action)}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    sendJson(res, 502, { error: message });
  }
}
