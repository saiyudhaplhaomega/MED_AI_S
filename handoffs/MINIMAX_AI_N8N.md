# Handoff: MiniMax session, AI + n8n

You own `src/ai/`, `api/`, and `n8n/`. You are building every AI capability and the
n8n automation. Read `AGENTS.md` and `docs/CONTRACTS.md` first, then
`src/lib/caseModel.ts`. The endpoint shapes in CONTRACTS.md are frozen; the UI is
being built against them right now.

## Priority order

1. `api/ai.ts` MiniMax proxy (case-summary, headlines, rephrase)
2. `src/ai/digest.ts` + `src/ai/client.ts` implementations
3. `api/qa.ts` + the n8n Q&A workflow
4. PDF skim notes (`handoffs/PDF_NOTES.md`)
5. P1 only after everything above works: n8n report generator
6. Cost-per-case estimate for the submission form

## 1. MiniMax proxy (api/ai.ts)

Vercel serverless function, Node runtime. Key comes from `process.env.MINIMAX_API_KEY`,
base URL from `MINIMAX_BASE_URL` with a sensible default. Use the OpenAI-compatible
chat completions endpoint and the best MiniMax text model available on this account
(check with `mmx` locally if unsure). The browser never sees the key.

Actions and shapes are in CONTRACTS.md. Implementation notes:

- case-summary: input is the caseDigest text. Prompt for a 150-220 word treatment
  narrative an attorney could read aloud: mechanism of injury context, arc of care,
  escalations, gaps, current status. Plain prose, no bullet lists, no markdown,
  no diagnosis invention. Only facts present in the digest.
- headlines: batch of up to 40 events. Return strict JSON mapping id to a headline
  of AT MOST 9 words, concrete and specific ("First lumbar MRI shows L4-L5 bulge",
  not "Patient had imaging"). Set temperature low. Validate the JSON server-side;
  drop entries that fail, the UI falls back per event.
- rephrase: tones = plain (8th-grade reading level), clinical (terse medical),
  jury (human, sensory, no legal conclusions). Return text only.

Guardrails for every prompt: never invent facts not in the input, never give legal
or medical advice, keep patient dignity (no lurid language).

## 2. Client (src/ai/client.ts, src/ai/digest.ts)

Implement the four functions with the exact signatures already stubbed. digest.ts
builds the caseDigest per CONTRACTS.md: stats header then one line per event,
`#<exhibit> | <date|undated> | <headline> | <medicineType> | <bodyParts> | sev<n>`.
Truncate long fields; keep the whole digest under ~100 KB at 820 events. Include
milestones (accident date!) in the header when present.

## 3. Q&A (api/qa.ts + n8n)

`api/qa.ts` forwards `{ caseDigest, question, history }` to
`process.env.N8N_QA_WEBHOOK_URL` with a 25 s timeout. On timeout or non-200, fall
back to calling MiniMax directly inside the function with the same system prompt.
Identical response shape either way: `{ answer, citations: [{ eventId, exhibit }] }`.

The n8n workflow (build it in the n8n cloud UI, then export the JSON to
`n8n/case-qa.json` and write `n8n/README.md` with the webhook path and env needed):

- Webhook node (POST) receives the same body.
- LLM step calls MiniMax (OpenAI-compatible credential or HTTP Request node).
  System prompt: you are a medical-chronology assistant for an attorney; answer
  ONLY from the digest; every factual claim cites events as `[#exhibit]`; if the
  answer is not in the record, say so; keep answers under 120 words unless asked
  for a list.
- A Code node parses `[#n]` citations out of the answer, maps them back to
  eventIds via the digest, and shapes the JSON response.
- Respond-to-Webhook node returns it.

The orchestrator has n8n MCP access and will import/activate your JSON and set
`N8N_QA_WEBHOOK_URL` in Vercel if you note the production URL in STATUS.md.

## 4. PDF skim (30 minutes, timeboxed)

Skim 4 or 5 PDFs under `SWANS_INSTRUCTIONS/Medical Records-*/` (Middleswarth and
Rogers folders). You are NOT parsing them into the app. You are validating our
heuristics against real records. Write `handoffs/PDF_NOTES.md`:

- Record-type vocabulary that our SEVERITY_RULES / FLAG_RULES regexes would miss.
- What a "key event" looks like in the real record (operative reports, work
  restrictions, imaging impressions) to sharpen the headline and QA prompts.
- Anything that would help the demo narrative.

Propose rule changes in STATUS.md; only the orchestrator edits `src/lib/`.

## 5. Cost per case (for the submission form)

Estimate tokens for one 800-event case: summary + ~800 headlines in batches +
10 Q&A turns. Convert to euros at MiniMax pricing. Write it in STATUS.md.

## Local testing

`.env` with MINIMAX_API_KEY for local runs (never commit it, .gitignore covers it).
`vercel dev` runs the functions locally if the Vercel CLI is linked; otherwise
deploy-test via push, the repo auto-deploys. curl each action with a small digest
before marking done. Update your section of `handoffs/STATUS.md` after each block.
