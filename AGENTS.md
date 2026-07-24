# AGENTS.md

You are one of three build sessions working in parallel on this repo for a same-day
hackathon deadline. Read this, then read YOUR handoff in `handoffs/`, then build.

## The mission

Turn any medical-chronology Excel into a visual treatment timeline for personal-injury
attorneys. Judged on: 30-second first impression, timeline clarity, ease of use, feature
depth, real-world fit, meaningful AI, and whether an attorney would keep it.

## The one rule that matters

The judges will load an Excel we have never seen. Same columns, different case, 49 to
800+ rows, dirty data (missing dates, missing providers, inconsistent casing). Nothing
may be hardcoded to the samples. Every feature must degrade gracefully on missing data.

## Where you may work

Ownership is in `docs/CONTRACTS.md`. Short version: Codex-1 owns `src/core/`, Codex-2
owns `src/story/`, MiniMax owns `src/ai/` + `api/` + `n8n/`. `src/lib/` is frozen
contract. Never write outside your directories except your own section of
`handoffs/STATUS.md` and (for dependency adds only) `package.json`.

## Git discipline

- Work on `main`. Commit small, pull with `--rebase` before every push, push often.
  Every push auto-deploys to Vercel, so never push something that breaks `npm run build`.
- Commit messages: short imperative subject, e.g. `core: add seismograph hover math`.
- No Co-Authored-By lines or any AI attribution in commits.

## Engineering principles (non-negotiable)

1. Think before coding. Read `src/lib/caseModel.ts` and `docs/CONTRACTS.md` before
   your first line.
2. Simplest thing that works. No speculative abstraction, no config for things that
   never vary, no wrapper layers with one caller.
3. No slop. Delete what you replace. No dead code, no leftover console.log, no
   commented-out blocks, no TODO you could just do.
4. Surgical diffs. Touch only what the task needs.
5. Verify before declaring done. `npm run build` passes, then load
   the smallest sample (49 rows) AND the largest sample
   (820 rows) and click through what you built.
6. If a library fights you for more than 15 minutes, write the 40 lines yourself.

## When you are blocked

Do not stop and do not guess someone else's interface. Write the blocker under your
section in `handoffs/STATUS.md`, commit it, and switch to the next task on your list.
The orchestrator reads STATUS.md at every checkpoint.

## Commands

- `npm run dev` for the dev server, `npm run build` for the production check.
- Samples live in `public/samples/`. Test with the small one and the huge one.
