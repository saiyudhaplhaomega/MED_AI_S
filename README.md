# MEDALS — Medical AI Legal Service

Turn any medical-chronology Excel into an evidence-grade treatment timeline for
personal-injury attorneys.

**Live app:** https://medals-ai.vercel.app

Built for the Swans Applied AI Hackathon, 24 July 2026.

## What it does

Upload a medical chronology Excel (any file in the standard format: encounter
date, provider, facility, body parts, medicine type, record type, summary,
source-PDF link) and get:

- **The Case Seismograph** — a severity waveform of the whole case, phase
  bands (Emergency, Diagnostics, Surgery, Therapy, Recovery), auto-flagged key
  events, treatment gaps, and an attorney-added accident-date milestone with
  a before/after split.
- **A working case file** — filter and search (including by exhibit number),
  group by provider / medicine type / body part, click-through to every
  source PDF, an undated-records shelf so dirty data is shown honestly
  instead of dropped.
- **Story Mode** (`/story`) — the same case as a scroll-driven cinematic
  narrative, built entirely at runtime from the data (no pre-rendered,
  case-specific media), for walking a jury or client through the record.
- **AI, grounded in the record** — a labeled "AI draft" medical summary,
  per-event headline generation, tone-based rephrasing (plain / clinical /
  jury), and a Q&A chatbot that answers only from the case and cites every
  claim back to its exhibit number.
- **Exports** — PowerPoint (case brief, seismograph, key events, phases) and
  a full print/PDF record.

The one rule that mattered: nothing is hardcoded to the sample cases. The
Excel parser fuzzy-matches headers, tolerates missing dates/fields, and was
tested against a deliberately mutated "unseen" file (reordered columns, a
junk column, missing dates) throughout the build.

## How AI is wired in

- **Case summary, headlines, rephrase**: the browser calls a Vercel
  serverless function (`api/ai.ts`), which calls Gemini
  (`gemini-flash-latest`, with a `gemini-flash-lite-latest` fallback so one
  model's rate limit can't take the feature down).
- **Q&A chatbot**: the browser builds a compact citation-ready digest of the
  case (`src/ai/digest.ts`) and posts it to `api/qa.ts`, which forwards to an
  **n8n cloud workflow** ("MEDAS Case QA Chatbot"). Inside n8n: a Webhook
  trigger feeds an AI Agent node, grounded by a system prompt that requires
  every factual claim to cite `[#exhibit]` and requires the model to say so
  when an answer isn't in the record, running on a MiniMax M2.7 chat model.
  If n8n doesn't answer in time, the same function falls back to Gemini with
  an identical prompt, so the feature degrades gracefully instead of failing.
- Every AI feature is optional and wrapped in try/catch in the UI: the
  timeline, filters, exports, and Story Mode are fully usable with AI
  switched off or unreachable.

## Where data goes

Case data is parsed entirely in the browser and only persists in the
browser's own localStorage ("past cases"). Nothing is uploaded on import.
Data leaves the browser only when an AI feature is used, as a compact text
digest, through our own serverless proxy — never the raw Excel or full
records.

## Stack

Vite + React + TypeScript + Tailwind v4, client-side XLSX parsing (SheetJS),
Zustand for state, GSAP for the Story Mode scroll cinematic, pptxgenjs for
exports. Hosted on Vercel (serverless functions for the AI proxy). n8n cloud
for the Q&A workflow.

## Local development

```bash
npm install
npm run dev
```

Sample cases live in `public/samples/`. `npm run build` must pass before any
push; the project auto-deploys to Vercel on every push to `main`.

See [docs/CONTRACTS.md](docs/CONTRACTS.md) for the data model and integration
contract, and [docs/SUBMISSION.md](docs/SUBMISSION.md) for the hackathon
submission package.
