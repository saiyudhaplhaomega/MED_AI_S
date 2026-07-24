# Status board

Protocol: each session appends short timestamped lines under ITS OWN heading only.
Never edit another section. Commit this file with your normal commits. The
orchestrator reads it at every checkpoint (13:15, 14:30, 15:15 freeze).

Line format: `- HH:MM done|doing|blocked: <one line>`

## Codex-1 (core app)

- 12:55 done: Parser, normalization, severity/flags, stats, and phase derivation implemented; production build passes.

## Codex-2 (story mode)

- (nothing yet)

## MiniMax (AI + n8n)

- (nothing yet)

## Orchestrator

- Scaffold, contracts, and handoffs committed. Vercel wiring in progress.
- 13:05 done: AI layer live. /api/ai (case-summary, headlines, rephrase) and /api/qa implemented and pushed. n8n Case QA workflow built, published, and tested end to end on n8n cloud (MiniMax M2.7 via n8n credits, no key). N8N_QA_WEBHOOK_URL set in Vercel production env. MINIMAX_API_KEY still needed in Vercel for /api/ai and the QA fallback path.
