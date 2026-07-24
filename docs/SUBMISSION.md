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
severity waveform, treatment phases, care gaps, and the accident line. The
workspace gives the attorney a working file: filters and multi-word search,
milestones with before/after, click-through to every source PDF, and PPT and
full-record PDF export. Story Mode plays the same case as a scroll cinematic
for a jury, and the AI layer stays grounded: a draft medical summary labeled as
a draft, jury-tone rephrasing that never invents facts, and a Q&A chatbot whose
every claim carries an exhibit citation back to the source row. We're proudest
that none of it is hardcoded: the app was tested against a deliberately mutated
unseen file, and dirty data is shown honestly, with an undated-records shelf
and an import report instead of silent drops.
