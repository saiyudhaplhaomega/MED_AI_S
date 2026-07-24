# Handoff: Codex-2, Story Mode

You own `src/story/`. You are building the cinematic scroll experience at `/story`.
Read `AGENTS.md` and `docs/CONTRACTS.md` first, then `src/lib/caseModel.ts`.

The user may run the `/scroll-world` skill in this session to drive the scroll
craft. The kickoff prompt for that is at the bottom. Whatever technique you use,
the constraints in this file win.

## The hard constraint

The judges load an Excel nobody has seen. EVERYTHING you show must be generated at
runtime from the `CaseModel` in the store (`useCaseStore` from `src/lib/store.ts`).
No pre-rendered videos or images of any specific case. Case-agnostic ambient
texture (gradients, grain, abstract sky) is fine. If the store has no case, keep
the existing redirect to `/`.

## What Story Mode is

A scroll-scrubbed narrative the attorney can play for a jury or client: one
continuous flight through the client's treatment story, built from the same
seismograph metaphor as the workspace. Scroll position scrubs the camera. GSAP +
ScrollTrigger are already installed.

## Scene sequence (all data-driven)

1. Title: ink-dark screen. Case name, date span, then "N medical encounters"
   counting up. Providers and facilities counts fade in as secondary chips.
2. Accident (only if the attorney set the accident milestone): the screen flashes
   to paper, a crimson vertical line drops in with the date and milestone label.
3. Chapters, one per `CasePhase` (max 8): the camera flies along that segment of
   the severity terrain (render the phase's slice of the waveform as an SVG
   mountain silhouette). Each chapter shows its label, date range, event count,
   dominant medicine types (colored chips), and the single worst event's headline
   as a pull quote. Sky/backdrop darkness scales with the phase's severity density
   (storm at the worst, clearing toward recovery).
4. Gap interludes: between chapters separated by a 45+ day treatment gap, a quiet
   typographic beat: "43 days of silence in the record."
5. Finale: zoom out to the full terrain with all chapter labels, totals row,
   the sky at its clearest, and two buttons: "Back to workspace", "Export".

## Scroll mapping

Scroll distance within the chapters section is proportional to calendar time,
clamped so no chapter is shorter than 60vh or longer than 300vh. Long empty
recovery months should FEEL long without becoming a chore.

## Craft rules

- Animate transform and opacity only. Never animate layout properties.
- Aggregate: never mount hundreds of event nodes in one scene. Chapters show
  aggregates plus one highlighted event.
- `prefers-reduced-motion`: render the same scenes as a static vertical sequence
  with no scrub.
- Works at 375px wide and at desktop. Test both.
- Garrison (820 events, 8 phases) must scroll at 60fps. Middleswarth (49 events)
  must still feel substantial, not empty.

## Integration contract

- You read the store. You never write it.
- Your only route is `/story`. Add a "Back to workspace" link in your corner UI.
- Do not touch `src/core/`. If you need something from Codex-1, write it in
  `handoffs/STATUS.md` under your section and build with mock phase data meanwhile
  (make a `mockCase.ts` inside `src/story/` and delete it before the freeze).

## Kickoff prompt for /scroll-world (paste into this Codex session)

> Build the /story route of this repo as a scroll-scrubbed cinematic. Do not
> generate any pre-rendered media: every scene must be rendered at runtime from
> the CaseModel in src/lib/store.ts (see src/lib/caseModel.ts for types and
> handoffs/CODEX2_STORY_MODE.md for the scene spec). Art direction: "evidence in
> motion" - paper white and ink navy, one crimson accident line, storm-to-clear
> sky driven by severity density, terrain flyover over an SVG severity waveform.
> GSAP + ScrollTrigger are installed. Scenes: title with counting stats, accident
> milestone, one chapter per treatment phase with terrain flyover and stat chips,
> gap interludes, zoom-out finale. Scroll maps to calendar time with 60vh-300vh
> clamps per chapter. Reduced-motion fallback is a static sequence. Only touch
> src/story/.

## Acceptance checklist

- `npm run build` clean; `/story` works for all five samples in `public/samples/`.
- No case-specific strings, images, or thresholds anywhere in `src/story/`.
- Reduced-motion mode shows all content without scrubbing.
- 60fps scroll on Garrison in a normal laptop Chrome.
