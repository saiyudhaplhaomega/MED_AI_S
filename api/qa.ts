/*
 * OWNER: MiniMax session. See handoffs/MINIMAX_AI_N8N.md.
 * Vercel serverless function. Forwards Q&A requests to the n8n case-QA
 * webhook, falling back to a direct MiniMax call when n8n is unavailable.
 * Citations are always derived here from the client-supplied exhibit -> id
 * map, so the response shape does not depend on which path answered.
 */

const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1";
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || "MiniMax-M2.7";

const GUARDRAILS =
  "Never invent facts that are not present in the case digest. Do not give legal or medical advice or diagnoses. Keep the patient's dignity: no lurid or sensational language.";

interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

interface QaCitation {
  eventId: string;
  exhibit: number;
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

function extractCitations(answer: string, ids: Record<string, string>): QaCitation[] {
  const seen = new Set<number>();
  const citations: QaCitation[] = [];
  const pattern = /\[#(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(answer)) !== null) {
    const exhibit = Number(match[1]);
    if (seen.has(exhibit)) continue;
    seen.add(exhibit);
    citations.push({ exhibit, eventId: ids[String(exhibit)] ?? "" });
  }

  return citations;
}

async function callMiniMaxQa(
  caseDigest: string,
  question: string,
  history: HistoryTurn[]
): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY is not configured");

  const system = `You are a medical-chronology assistant helping a personal-injury attorney. Answer the question using ONLY facts in the case digest below. Every factual claim must cite the source event as [#exhibit]. If the answer is not in the record, say so plainly. Keep the answer under 120 words unless the question asks for a list. ${GUARDRAILS}\n\nCase digest:\n${caseDigest}`;

  const messages = [
    { role: "system", content: system },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MINIMAX_MODEL, messages, temperature: 0.3 }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`MiniMax API error ${response.status}: ${errorBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== "string") throw new Error("MiniMax API returned no content");
    return text.trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function callN8n(
  caseDigest: string,
  question: string,
  history: HistoryTurn[]
): Promise<string> {
  const webhookUrl = process.env.N8N_QA_WEBHOOK_URL;
  if (!webhookUrl) throw new Error("N8N_QA_WEBHOOK_URL is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caseDigest, question, history }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`n8n webhook error ${response.status}`);

    const data = await response.json();
    const answer = typeof data?.answer === "string" ? data.answer : data?.text;
    if (typeof answer !== "string") throw new Error("n8n webhook returned no answer");
    return answer;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const body = parseBody(req);

  if (typeof body.caseDigest !== "string" || body.caseDigest.length === 0) {
    sendJson(res, 400, { error: "caseDigest is required" });
    return;
  }
  if (typeof body.question !== "string" || body.question.length === 0) {
    sendJson(res, 400, { error: "question is required" });
    return;
  }

  const history: HistoryTurn[] = Array.isArray(body.history) ? body.history : [];
  const ids: Record<string, string> = body.ids && typeof body.ids === "object" ? body.ids : {};

  try {
    let answer: string;
    try {
      answer = await callN8n(body.caseDigest, body.question, history);
    } catch {
      answer = await callMiniMaxQa(body.caseDigest, body.question, history);
    }

    sendJson(res, 200, { answer, citations: extractCitations(answer, ids) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Q&A request failed";
    sendJson(res, 502, { error: message });
  }
}
