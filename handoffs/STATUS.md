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
