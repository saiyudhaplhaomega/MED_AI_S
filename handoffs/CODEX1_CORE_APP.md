# Handoff: Codex-1, Core App

You own `src/core/`. You are building the main product: upload, parsing, and the
Case Seismograph timeline workspace. Read `AGENTS.md` and `docs/CONTRACTS.md` first,
then `src/lib/caseModel.ts`. Those three files are law. This file is your spec.

## Priority order

Build in this exact order. Each numbered block should end in a commit and a push.

1. Parser + normalizer (the floor, and the thing judges secretly test)
2. Workspace layout with the seismograph overview + detailed event list
3. Accident milestone + before/after + flags + filters + search + click-to-PDF
4. Compact view, exports (PPT + print PDF), past cases
5. AI hooks (summary panel, headlines, rephrase, Q&A sidebar), each with fallback

## 1. Parser (src/core/ingest.ts)

Use `xlsx` (SheetJS, already installed). Parse in the browser, no server.

- Read the FIRST sheet whatever its name. `cellDates: true`.
- Header row: find it by scanning the first 5 rows for a row where at least 4 cells
  fuzzy-match known headers. Match fuzzily: trim, lowercase, ignore punctuation.
  Canonical fields: encounter date, primary provider, facility, body parts,
  medicine type, record type, summary, link to pdf. Accept reordered and extra
  columns. Record the mapping in `importReport.headerMap`.
- Dates arrive as strings ("12/07/2024", MM/DD/YYYY), JS Dates, or Excel serials
  depending on the file. Handle all three. Unparseable or empty date means
  `date: null`, counted in `missingDates`, kept as an event.
- Providers: split on ";". Body parts: split on ",". Trim, Title Case, dedupe.
  ("Cervical spine" and "Cervical Spine" are the same thing. The samples really
  contain this.)
- PDF links: the cell text is just "pdf". The real URL is the hyperlink target:
  `sheet[addr].l?.Target`. Missing hyperlink means `pdfUrl: null`.
- Skip fully empty rows. Never throw on a bad row; degrade and count in the report.
- Sort events date ascending; undated events go LAST in original row order.
  Assign `exhibit` numbers after sorting, 1-based.
- Apply `SEVERITY_RULES` and `FLAG_RULES` from `src/lib/caseModel.ts` against
  `"<Record Type> <Medicine Type>"`. Default severity 2. Add `first-visit` to the
  first dated event. Add `gap-after` to any dated event whose next dated neighbor
  is more than `GAP_DAYS` days away.
- Deterministic headline: `"<Record Type> - <first body part>"` plus the first
  provider in parens when present. Truncate to ~70 chars.
- Build `stats`, `phases` (below), `importReport`, then `setCase()` on the store.

### Phase detection (src/core/derive.ts)

1. Categorize each dated event: emergency (matches emergency flag rule), surgery
   (surgery rule), diagnostics (imaging rule), therapy (`/therap|rehab|chiro/i` on
   record+medicine type), else other.
2. Walk chronologically. Start a new phase when the category changes AND the new
   category holds for at least 3 events or 14 days. Merge phases shorter than 3
   events into their neighbor. Cap at 8 phases.
3. Kinds map to labels: "Emergency care", "Surgery", "Diagnostics & imaging",
   "Therapy & rehab", "Ongoing care". If the final 20%+ of the span has event
   density under a quarter of the peak, relabel that tail "Recovery & maintenance".

## 2. The seismograph (src/core/Seismograph.tsx)

Custom SVG. No chart library. This is the hero and the navigator.

- Bucket the date span into ~120 equal buckets. Amplitude = sum of severity in the
  bucket. Render as a smooth area path, navy on paper. Fixed width, so 49 events
  and 820 events both fill the same canvas.
- Overlays: phase bands (subtle alternating tint + label), accident line (crimson,
  full height), flag ticks on spikes (amber), treatment gaps of 45+ days as
  hatched spans, undated-events shelf indicator on the right edge.
- Hover a bucket: tooltip with date range, event count, and the severity sum
  decomposed (e.g. "1 surgery (4) + 3 PT visits (2 each)"). Severity must always
  be explainable; the rules carry a `reason` string for this.
- Click/drag on it filters the detail list to that date range (brush).

## 3. Workspace (src/core/CoreApp.tsx and friends)

Landing: drop zone + file picker + "Load sample case" (list `public/samples/*.xlsx`
with fetch) + past cases list. On parse, land in the workspace.

First viewport, top to bottom: case header (name, span, three stat chips), import
report line ("137 events loaded, 7 undated, view them"), seismograph, key events
strip (3 to 5 highest-severity flagged events as cards), then the detail list.

Detail list: virtualized vertical list (write simple windowing, ~15 lines, no lib)
of day-grouped event cards. Card: exhibit number, date, headline (prefer
`aiHeadline`), medicine-type color chip, body part tags, severity as left bar +
card height, flag icons, PDF button when `pdfUrl` exists (opens new tab).
Click opens a right drawer: full summary, all metadata, rephrase-with-AI, edit
headline, toggle key-event star (persist stars in localStorage by case id).

Filters row: medicine type chips (colored), body part multiselect, provider search,
keyword search over summaries, date range (linked to brush). Undated events drawer
opens from the import report line.

Milestones: prominent "Mark the accident date" CTA when absent. Date picker +
label. Renders as the crimson line + splits stats into before/after chips
("before: 2 visits · after: 135"). Support extra custom milestones (surgery date,
treatment stop) in amber.

Compact view toggle: hides the detail list, enlarges seismograph + key events +
phase labels. This is the slide-ready view and the print/PPT source.

## 4. Exports + past cases

- PPT (pptxgenjs): title slide, seismograph (serialize the SVG to a PNG dataURL via
  canvas), key events slide, phases slide, AI case summary slide when present.
- PDF: print stylesheet on the compact view + `window.print()`.
- Past cases: after each successful parse, store the full CaseModel JSON in
  localStorage (`medas.cases.<id>`), newest first, cap at 10. Landing lists them.

## 5. AI integration (call, never depend)

All calls go through `src/ai/client.ts` (MiniMax session owns the internals; the
signatures are stable). Wrap every call in try/catch. If it throws, hide or
gray the feature with a one-line notice. The app must be 100% usable offline.

- On case load: fire `draftCaseSummary` async into a collapsible "Case brief" panel.
- Headlines: `draftHeadlines` in batches of 40 for events as they scroll into view,
  falling back to the deterministic headline.
- Drawer: `rephraseSummary` with tone picker.
- Q&A: right-side chat panel calling `askCaseQuestion`; render citations as exhibit
  chips that scroll to and highlight the event.

## Acceptance checklist before you call it done

- `npm run build` clean.
- All five samples in `public/samples/` load with plausible counts and no console errors.
- Garrison (820 rows) scrolls smoothly and the seismograph stays readable.
- Caldwell shows 7 undated events in the shelf, not silently dropped.
- A file with reordered/extra columns and a file with zero parseable dates load
  without crashing (make quick test fixtures yourself).
- Click-to-PDF opens the Drive/search URL from the sample in a new tab.
- With the network blocked, everything except AI panels still works.
