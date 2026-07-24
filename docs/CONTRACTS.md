# Integration Contract

This file is the single source of truth for how the three build sessions fit together.
It is owned by the orchestrator. Nobody else edits it. If something here blocks you,
write it in `handoffs/STATUS.md` under your section and keep working on what you can.

## The product in one line

Upload any medical-chronology Excel, get a treatment story an attorney can use:
an evidence-grade interactive timeline (the Case Seismograph) plus a cinematic
scroll-driven Story Mode, with AI where it genuinely helps.

## Directory ownership

| Path | Owner | Notes |
|---|---|---|
| `src/lib/` | Orchestrator | FROZEN. Types, store, derivation rules. Read, never write. |
| `src/core/` | Codex-1 | Everything: upload, parsing, timeline UI, exports, past cases. |
| `src/story/` | Codex-2 | Story Mode only. |
| `src/ai/` | MiniMax session | Client for AI calls + digest builder. |
| `api/` | MiniMax session | Vercel serverless functions. |
| `n8n/` | MiniMax session | Workflow exports and docs. |
| `docs/`, `handoffs/`, root configs | Orchestrator | Ask before touching. |
| `public/samples/` | Orchestrator | Five real sample cases. Read freely. |

Rules:
- Commit small and often, straight to `main`. Pull with `git pull --rebase` before every push.
- Never edit another owner's directory. If you need something from them, write it in
  `handoffs/STATUS.md` and build against the contract in the meantime.
- `package.json`: if you must add a dependency, add it, run `npm install`, and commit
  `package.json` + `package-lock.json` immediately in their own commit.

## Routes

| Route | Owner | Content |
|---|---|---|
| `/` and everything except `/story` | Codex-1 | Landing + upload + timeline workspace. |
| `/story` | Codex-2 | Scroll cinematic. Reads the loaded case from the store. |

Navigation between the two is a simple link in each header. Codex-1 adds a
"Story Mode" button; Codex-2 adds a "Back to workspace" link.

## Shared state

`src/lib/store.ts` exports `useCaseStore` (zustand). The `CaseState` interface is frozen.
Codex-1 populates `caseModel` after parsing. Everyone else reads it.
Case data lives only in the browser. The only things that leave are AI calls (summaries,
digests for Q&A), which go through our own serverless proxy.

## Data model and derivation rules

`src/lib/caseModel.ts` is the whole contract: `CaseModel`, `CaseEvent`, severity rules,
flag rules, `GAP_DAYS`. The parser (Codex-1) applies the rules; every consumer may rely
on them being applied. Severity must stay explainable: any UI that shows severity should
be able to show WHY (matched rule reason) on hover or tap.

## API endpoints (owner: MiniMax session)

All endpoints are Vercel serverless functions under `api/`. The browser never holds keys.

`POST /api/ai`
- `{ action: "case-summary", caseDigest: string }` returns `{ text: string }`
- `{ action: "headlines", events: [{ id, summary, recordType, bodyParts }] }` returns `{ headlines: { [id]: string } }` (batch of at most 40)
- `{ action: "rephrase", text: string, tone: "plain" | "clinical" | "jury" }` returns `{ text: string }`

`POST /api/qa`
- `{ caseDigest: string, question: string, history: [{ role, content }] }` returns `{ answer: string, citations: [{ eventId, exhibit }] }`
- Implementation forwards server-side to the n8n webhook (env `N8N_QA_WEBHOOK_URL`), so the browser never talks to n8n directly and CORS never comes up. If n8n does not answer within 25 s, fall back to calling MiniMax directly in the function, same response shape. The UI must not care which path answered.

Errors: non-200 with `{ error: string }`. The UI (Codex-1) wraps every AI call in
try/catch and shows a quiet inline notice, never a broken screen.

`caseDigest` format (built by `src/ai/digest.ts`, MiniMax owns): a stats header
(name, span, counts by medicine type) followed by one line per event:
`#<exhibit> | <date or "undated"> | <headline> | <medicineType> | <bodyParts> | sev<severity>`.
Keep it under ~100 KB even for 820-event cases; truncate summaries, never drop events.

## Environment variables

| Name | Where | Purpose |
|---|---|---|
| `MINIMAX_API_KEY` | Vercel env (user adds it) + local `.env` | MiniMax API auth, server side only. |
| `MINIMAX_BASE_URL` | Vercel env, optional | Defaults to the MiniMax OpenAI-compatible endpoint. |
| `N8N_QA_WEBHOOK_URL` | Vercel env | The production webhook URL of the n8n Q&A workflow. |

## Design rules (Case Seismograph)

Tokens live in `src/index.css`. The rules that keep the design coherent:
- Crimson (`--color-accident`) marks the accident milestone and nothing else.
- Hue encodes medicine type only (`--color-cat1..7`, unknown gets gray). Severity is
  encoded by size and the navy ramp (`--color-sev1..4`), never by hue alone.
- Amber (`--color-flag`) is for flags and gap callouts.
- White paper background, navy ink. The app should survive grayscale printing.
- Typography: system font stack is fine; weight and size carry hierarchy.

## The first 30 seconds (what the judges see after upload)

1. Case name, date span, and three stat chips (events, providers, span in months).
2. The seismograph: full-case severity waveform, fixed width, with chapter bands,
   accident marker (once added), flagged spikes, and visible treatment gaps.
3. A "key events" strip with the 3 to 5 highest-severity flagged events.
4. The import report line: "137 events loaded, 7 undated (view them), 2 warnings".

## Deadlines and checkpoints (local time)

- 13:15 checkpoint 1: floor deployed. Upload works, timeline renders, on Vercel.
- 14:30 checkpoint 2: P0 features complete, Story Mode integrated, AI features live.
- 15:15 feature freeze. After this, only fixes and polish. No new features.
- 15:15 to 15:45 integration QA against all five samples plus an unseen mutated fixture.
- 16:30 at the latest: link submitted. Submitting early improves presentation order.
