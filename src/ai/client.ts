/*
 * OWNER: MiniMax session. See handoffs/MINIMAX_AI_N8N.md.
 * Typed client for the AI features. The UI (Codex-1) calls ONLY these
 * functions and always wraps them in try/catch with a graceful fallback,
 * so the app stays fully usable when AI is down.
 */
import type { CaseModel } from "../lib/caseModel";

export interface QaCitation {
  eventId: string;
  exhibit: number;
}

export interface QaAnswer {
  answer: string;
  citations: QaCitation[];
}

/** Draft a medical summary of the whole treatment. */
export async function draftCaseSummary(caseModel: CaseModel): Promise<string> {
  throw new Error("not implemented yet");
}

/** Short display headlines for a batch of events. Returns eventId -> headline. */
export async function draftHeadlines(
  caseModel: CaseModel,
  eventIds: string[]
): Promise<Record<string, string>> {
  throw new Error("not implemented yet");
}

/** Rephrase one event summary. */
export async function rephraseSummary(
  original: string,
  tone: "plain" | "clinical" | "jury"
): Promise<string> {
  throw new Error("not implemented yet");
}

/** Ask the n8n-backed case chatbot a question. */
export async function askCaseQuestion(
  caseModel: CaseModel,
  question: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<QaAnswer> {
  throw new Error("not implemented yet");
}
