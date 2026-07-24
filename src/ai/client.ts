/*
 * OWNER: MiniMax session. See handoffs/MINIMAX_AI_N8N.md.
 * Typed client for the AI features. The UI (Codex-1) calls ONLY these
 * functions and always wraps them in try/catch with a graceful fallback,
 * so the app stays fully usable when AI is down.
 */
import type { CaseModel, CaseEvent } from "../lib/caseModel";
import { buildCaseDigest } from "./digest";

export interface QaCitation {
  eventId: string;
  exhibit: number;
}

export interface QaAnswer {
  answer: string;
  citations: QaCitation[];
}

const HEADLINE_BATCH_SIZE = 40;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : `Request to ${url} failed`;
    throw new Error(message);
  }

  return data as T;
}

/** Draft a medical summary of the whole treatment. */
export async function draftCaseSummary(caseModel: CaseModel): Promise<string> {
  const { digest } = buildCaseDigest(caseModel);
  const { text } = await postJson<{ text: string }>("/api/ai", {
    action: "case-summary",
    caseDigest: digest,
  });
  return text;
}

/** Short display headlines for a batch of events. Returns eventId -> headline. */
export async function draftHeadlines(
  caseModel: CaseModel,
  eventIds: string[]
): Promise<Record<string, string>> {
  const byId = new Map(caseModel.events.map((e) => [e.id, e]));
  const events = eventIds
    .map((id) => byId.get(id))
    .filter((e): e is CaseEvent => Boolean(e));

  const batches: CaseEvent[][] = [];
  for (let i = 0; i < events.length; i += HEADLINE_BATCH_SIZE) {
    batches.push(events.slice(i, i + HEADLINE_BATCH_SIZE));
  }

  const results = await Promise.all(
    batches.map((batch) =>
      postJson<{ headlines: Record<string, string> }>("/api/ai", {
        action: "headlines",
        events: batch.map((e) => ({
          id: e.id,
          summary: e.summary,
          recordType: e.recordType,
          bodyParts: e.bodyParts,
        })),
      })
    )
  );

  const headlines: Record<string, string> = {};
  for (const result of results) Object.assign(headlines, result.headlines);
  return headlines;
}

/** Rephrase one event summary. */
export async function rephraseSummary(
  original: string,
  tone: "plain" | "clinical" | "jury"
): Promise<string> {
  const { text } = await postJson<{ text: string }>("/api/ai", {
    action: "rephrase",
    text: original,
    tone,
  });
  return text;
}

/** Ask the n8n-backed case chatbot a question. */
export async function askCaseQuestion(
  caseModel: CaseModel,
  question: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<QaAnswer> {
  const { digest, ids } = buildCaseDigest(caseModel);
  return postJson<QaAnswer>("/api/qa", {
    caseDigest: digest,
    question,
    history,
    ids,
  });
}
