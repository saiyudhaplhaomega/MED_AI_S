/*
 * Simple landing page. Codex-2 will replace this with the scroll-world
 * cinematic version later; keep the route and CTA targets identical.
 */
import { Link } from "react-router-dom";
import { FileUp, ScrollText, Search } from "lucide-react";

const proofPoints = [
  {
    icon: FileUp,
    title: "Upload any chronology Excel",
    text: "Fuzzy header matching, messy dates, and missing fields handled honestly. Nothing hardcoded.",
  },
  {
    icon: Search,
    title: "See gaps and key evidence",
    text: "Severity waveform, treatment phases, care gaps, and auto-flagged surgeries in one glance.",
  },
  {
    icon: ScrollText,
    title: "Tell the story and export",
    text: "Cinematic Story Mode for the jury, PPT and PDF exports for the file.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-bold tracking-[.25em] text-ink-soft">MEDALS</p>
      <h1 className="mt-3 max-w-3xl text-5xl font-bold leading-tight text-ink">
        Turn a messy medical chronology into a treatment story a jury can feel.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Medical AI Legal Service. Built for personal-injury case review: every event
        stays linked to its source record, and AI drafts are always labeled as drafts.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/app"
          className="rounded-lg bg-ink px-6 py-3 text-lg font-semibold text-white hover:bg-ink-soft"
        >
          Open the workspace
        </Link>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {proofPoints.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-line bg-white p-5">
            <Icon className="size-6 text-ink" />
            <h2 className="mt-3 font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{text}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-ink-soft">
        Your case data stays in this browser. The only thing that leaves is the text
        sent to the AI when you ask for a summary, a rephrase, or an answer.
      </p>
    </main>
  );
}
