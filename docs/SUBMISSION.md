# MEDALS submission package

Copy from here into the submission form. Verify the link one last time before
sending.

## 01 Link

https://medals-ai.vercel.app

Open on any device. No login. Judges can upload their own case Excel or click a
sample case for an instant view.

## 02 Assumptions

- One Excel per case, first worksheet, in the provided chronology format. Column
  headers are matched fuzzily, so reordered columns, extra columns, and casing
  differences are fine. Nothing is hardcoded to the sample files.
- AI features assume a Google Gemini API key (configured server-side) and an
  n8n cloud workflow for the case Q&A chatbot (MiniMax M2.7). Both are already
  configured on the deployed link; judges need nothing.
- Hosting on Vercel free tier.

## 03 Where the data goes

- The Excel is parsed entirely in the browser. Case data persists only in the
  browser's localStorage on the user's own device (the "past cases" library),
  and can be deleted there. Nothing is uploaded on import.
- Only when the user invokes an AI feature does data leave the browser: a
  compact text digest of the case goes through our own serverless proxy to
  Gemini, and Q&A questions route through the owner's n8n instance to MiniMax.
  API keys live server-side. No case data is stored by us on any server.

## 04 Approximate cost to run one case

- Hosting: free tier, effectively zero.
- AI: on Gemini's free tier the demo costs nothing. At paid rates, a full case
  pass (draft medical summary, event headlines, ten Q&A turns, a few rephrases)
  is roughly 0.02 to 0.05 EUR. Q&A turns through n8n cost about a cent each in
  n8n credits.
- Realistic all-in figure: under 0.05 EUR per case.

## 05 What we built and what we're proud of

MEDALS turns any medical-chronology Excel into an evidence-grade treatment
story. The seismograph view shows an adjuster the whole case in ten seconds:
severity waveform, treatment phases, care gaps, flagged key events, and the
accident milestone with a before/after split. The workspace is a real working
file: search by keyword, provider, or exhibit number, group events by
provider, medicine type, or body part, click through to every source PDF,
browse and switch between saved cases, and export to PowerPoint or a
full-record PDF. Story Mode plays the same case as a scroll-driven cinematic
for a jury or client walkthrough. The AI layer stays grounded rather than
decorative: a clearly-labeled draft medical summary, per-event AI headlines,
tone-based rephrasing (plain-language, clinical, or jury-facing, always from
the source facts, never invented), and a Q&A chatbot, running on an n8n
workflow with a MiniMax model, that answers only from the case and cites every
claim back to its exhibit. We're proudest that none of it is hardcoded: the
app was stress-tested against a deliberately mutated unseen file all through
the build, and dirty data is shown honestly, with an undated-records shelf and
an import report instead of silent drops.
