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
- **Cinematic landing story** — a five-scene, scroll-scrubbed introduction
  made with **Higgsfield** video assets, with responsive video and still-image
  fallbacks. It explains the product journey before an attorney opens the
  workspace; it does not use or transmit case data.
- **Story Mode** (`/story`) — the loaded case as a separate scroll-driven
  narrative built at runtime from its data, for walking a jury or client
  through the record.
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

## Workspace feature tour

The workspace is designed as an attorney's case desk: a quiet, evidence-first
screen with the case at the top, the treatment pattern in the middle, and the
underlying records immediately below it.

- **Import and case library** — drop in an `.xlsx` or `.xls` medical
  chronology. MEDALS identifies common header variations, normalizes dates,
  preserves available source links, reports missing fields, and saves up to ten
  recent cases in that browser only. Saved cases can be reopened, renamed, or
  removed without uploading the workbook anywhere.
- **Case-at-a-glance** — see the case name, date range, encounter count,
  provider count, and duration immediately after import. An import-status line
  keeps undated records visible instead of silently excluding them.
- **Case Seismograph** — the central interactive timeline turns encounter
  severity into a readable waveform. It shows automatically derived treatment
  phases, high-signal events, marked treatment gaps, and an optional accident
  date that creates a before/after reference point. Hover a time window to see
  its intensity; click it to open its events; drag across it to filter the
  record list to that date range.
- **Key-event strip** — the highest-priority flagged records appear as
  exhibit-labelled cards, so operative reports, emergency care, imaging, and
  work-status events are easy to find first.
- **Record review** — search summaries, providers, facilities, body parts, or
  an exhibit number; then organize results chronologically or by provider,
  medicine type, or body part. Open any record for its full summary,
  structured metadata, and source-PDF link when one was supplied.
- **Clear presentation modes** — switch between a compact executive view and
  the full review workspace. The separate Story Mode turns the loaded case
  into scroll-led treatment chapters, highlights meaningful gaps, and keeps
  each chapter tied to an exhibit.
- **Output for the next room** — print the complete treatment record to PDF or
  export a PowerPoint brief with the case overview, seismograph, key events,
  treatment phases, and an AI brief when available.

## AI, n8n, and Higgsfield

- **Case summary, headlines, rephrase**: the browser calls a Vercel
  serverless function (`api/ai.ts`), which calls Gemini
  (`gemini-flash-latest`, with a `gemini-flash-lite-latest` fallback so one
  model's rate limit can't take the feature down).
- **Q&A chatbot (n8n backend)**: the browser builds a compact,
  citation-ready case digest (`src/ai/digest.ts`) and posts it to the Vercel
  endpoint `api/qa.ts`. That endpoint calls the live **n8n cloud workflow**
  ("MEDAS Case QA Chatbot") through a server-side webhook; the browser never
  contacts n8n directly. The workflow sends the digest, question, and chat
  history to MiniMax M2.7 and returns an answer whose factual claims must cite
  the record as `[#exhibit]`. `api/qa.ts` extracts those citations and maps
  them back to event IDs for the UI. If the webhook is unavailable or exceeds
  its 25-second timeout, the endpoint falls back to Gemini and then direct
  MiniMax with the same grounding rules.
- **What "grounded" means here**: this is a digest-in-context, citation-backed
  chatbot — not a vector-database RAG pipeline. The server sends a compact text
  representation of the loaded case on each question, and the model is
  instructed to answer only from that record or say the answer is absent.
- **Higgsfield visual production**: Higgsfield-generated video assets power
  the five-scene cinematic landing experience in `src/home/assets/`. They are
  product storytelling assets only; they are not part of the medical-record
  analysis or chatbot pipeline.
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
Zustand for state, GSAP for the Story Mode scroll cinematic, Higgsfield for
the landing-story video assets, and pptxgenjs for exports. Hosted on Vercel
(serverless functions for the AI proxy), with n8n Cloud + MiniMax M2.7 for
the grounded, citation-backed Q&A workflow.

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
