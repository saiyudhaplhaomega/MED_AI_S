# Status board

Protocol: each session appends short timestamped lines under ITS OWN heading only.
Never edit another section. Commit this file with your normal commits. The
orchestrator reads it at every checkpoint (13:15, 14:30, 15:15 freeze).

Line format: `- HH:MM done|doing|blocked: <one line>`

## Codex-1 (core app)

- 12:55 done: Parser, normalization, severity/flags, stats, and phase derivation implemented; production build passes.
- 13:00 done: Custom SVG seismograph added with phase bands, gaps, flags, milestones, tooltip, and date brush.
- 13:00 done: Workspace landing, sample uploads, local past cases, filters, virtual event list, drawers, key events, and accident milestone are implemented; build passes.

## Codex-2 (story mode)

- 14:32 doing: Story Mode built in src/story with runtime SVG terrain, phase chapters, gaps, reduced-motion fallback, and print export. Full build currently blocked by existing src/core/Seismograph.tsx nullability errors.

## MiniMax (AI + n8n)

- (nothing yet)

## Orchestrator

- Scaffold, contracts, and handoffs committed. Vercel wiring in progress.
- 13:05 done: AI layer live. /api/ai (case-summary, headlines, rephrase) and /api/qa implemented and pushed. n8n Case QA workflow built, published, and tested end to end on n8n cloud (MiniMax M2.7 via n8n credits, no key). N8N_QA_WEBHOOK_URL set in Vercel production env. MINIMAX_API_KEY still needed in Vercel for /api/ai and the QA fallback path.
