import { useLayoutEffect, useMemo, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { CaseEvent, CaseModel, CasePhase } from "../lib/caseModel";
import { useCaseStore } from "../lib/store";
import "./story.css";

gsap.registerPlugin(ScrollTrigger);

type Chapter = CasePhase & { events: CaseEvent[]; gapBefore: number; dominantTypes: string[]; worst: CaseEvent | null };

const DAY = 86_400_000;

function formatDate(date: string | null) {
  if (!date) return "Undated";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${date}T12:00:00`)
  );
}

function formatRange(start: string | null, end: string | null) {
  return start && end ? `${formatDate(start)} to ${formatDate(end)}` : "Dates not available";
}

function daysBetween(start: string, end: string) {
  return Math.max(0, Math.round((new Date(`${end}T12:00:00`).getTime() - new Date(`${start}T12:00:00`).getTime()) / DAY));
}

function makeFallbackPhase(model: CaseModel): CasePhase[] {
  const dated = model.events.filter((event) => event.date);
  if (!dated.length) return [];
  return [{
    id: "treatment-record",
    label: "Treatment record",
    kind: "other",
    start: dated[0].date!,
    end: dated[dated.length - 1].date!,
    eventIds: dated.map((event) => event.id),
  }];
}

function buildChapters(model: CaseModel): Chapter[] {
  const phases = (model.phases.length ? model.phases : makeFallbackPhase(model)).slice(0, 8);
  let previousEnd: string | null = null;
  return phases.map((phase) => {
    const ids = new Set(phase.eventIds);
    const events = model.events.filter((event) => ids.has(event.id));
    const typeCounts = new Map<string, number>();
    events.forEach((event) => typeCounts.set(event.medicineType ?? "Unclassified", (typeCounts.get(event.medicineType ?? "Unclassified") ?? 0) + 1));
    const dominantTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([type]) => type);
    const worst = events.reduce<CaseEvent | null>((current, event) => !current || event.severity > current.severity ? event : current, null);
    const gapBefore = previousEnd ? daysBetween(previousEnd, phase.start) : 0;
    previousEnd = phase.end;
    return { ...phase, events, gapBefore, dominantTypes, worst };
  });
}

function terrainPath(events: CaseEvent[]) {
  const levels = events.length ? events.map((event) => event.severity) : [1, 1];
  const points = levels.map((severity, index) => {
    const x = levels.length === 1 ? 50 : (index / (levels.length - 1)) * 100;
    const y = 87 - severity * 16;
    return `${x.toFixed(2)},${y}`;
  });
  return `M 0,100 L ${points.join(" L ")} L 100,100 Z`;
}

function countLabel(count: number, single: string, plural: string) {
  return `${count.toLocaleString()} ${count === 1 ? single : plural}`;
}

function StoryPageContent({ model }: { model: CaseModel }) {
  const root = useRef<HTMLElement>(null);
  const chapters = useMemo(() => buildChapters(model), [model]);
  const accident = model.milestones.find((milestone) => milestone.kind === "accident");
  const spanMonths = Math.max(1, Math.round(model.stats.dateSpanDays / 30.44));

  useLayoutEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches || !root.current) return;
    const context = gsap.context(() => {
      gsap.fromTo(".story-intro-reveal", { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.11, duration: 0.75, ease: "power3.out" });
      gsap.utils.toArray<HTMLElement>(".story-chapter").forEach((chapter) => {
        const terrain = chapter.querySelector<SVGElement>(".story-terrain");
        const copy = chapter.querySelector<HTMLElement>(".story-chapter-copy");
        const sky = chapter.querySelector<HTMLElement>(".story-sky");
        gsap.timeline({ scrollTrigger: { trigger: chapter, start: "top bottom", end: "bottom top", scrub: 0.65 } })
          .fromTo(terrain, { xPercent: -18, scale: 1.08 }, { xPercent: 15, scale: 1, ease: "none" }, 0)
          .fromTo(copy, { y: 42, opacity: 0 }, { y: -30, opacity: 1, ease: "none" }, 0)
          .fromTo(sky, { opacity: 0.42 }, { opacity: 0.92, ease: "none" }, 0);
      });
    }, root);
    return () => context.revert();
  }, [chapters.length]);

  return (
    <main className="story-page" ref={root}>
      <nav className="story-nav" aria-label="Story navigation">
        <Link to="/app" className="story-back">← Back to workspace</Link>
        <span>MEDALS · Medical AI Legal Service</span>
      </nav>

      <section className="story-title story-section" aria-labelledby="story-title">
        <div className="story-orbit story-orbit-one" />
        <div className="story-orbit story-orbit-two" />
        <div className="story-title-content">
          <p className="story-kicker story-intro-reveal">MEDALS · Medical AI Legal Service</p>
          <h1 id="story-title" className="story-intro-reveal">{model.name}</h1>
          <p className="story-date-range story-intro-reveal">{formatRange(model.stats.firstDate, model.stats.lastDate)}</p>
          <p className="story-encounters story-intro-reveal"><strong>{model.stats.totalEvents.toLocaleString()}</strong> medical encounters</p>
          <div className="story-meta story-intro-reveal">
            <span>{countLabel(model.stats.providerCount, "provider", "providers")}</span>
            <span>{countLabel(model.stats.facilityCount, "facility", "facilities")}</span>
            <span>{spanMonths} month{spanMonths === 1 ? "" : "s"}</span>
          </div>
        </div>
        <p className="story-scroll-hint">Scroll to follow the record <span>↓</span></p>
      </section>

      {accident && <section className="story-accident story-section" aria-label="Accident milestone">
        <div className="story-accident-line" />
        <div className="story-accident-copy">
          <p>Origin point</p>
          <h2>{accident.label}</h2>
          <time>{formatDate(accident.date)}</time>
        </div>
      </section>}

      {chapters.map((chapter, index) => {
        const density = chapter.events.length ? Math.round(chapter.events.reduce((total, event) => total + event.severity, 0) / chapter.events.length) : 1;
        const phaseDays = daysBetween(chapter.start, chapter.end);
        const height = Math.min(300, Math.max(60, 60 + phaseDays * 0.9));
        return <div key={chapter.id}>
          {index > 0 && chapter.gapBefore >= 45 && <section className="story-gap" aria-label={`${chapter.gapBefore} day treatment gap`}>
            <span className="story-gap-line" />
            <p><strong>{chapter.gapBefore} days</strong> of silence in the record.</p>
            <span className="story-gap-line" />
          </section>}
          <section className={`story-chapter story-section story-density-${density}`} style={{ minHeight: `${height}vh` }} aria-labelledby={`chapter-${chapter.id}`}>
            <div className="story-sky" />
            <div className="story-chapter-copy">
              <p className="story-kicker">Chapter {String(index + 1).padStart(2, "0")}</p>
              <h2 id={`chapter-${chapter.id}`}>{chapter.label}</h2>
              <p className="story-chapter-range">{formatRange(chapter.start, chapter.end)} · {countLabel(chapter.events.length, "encounter", "encounters")}</p>
              <div className="story-type-list">{chapter.dominantTypes.map((type, typeIndex) => <span key={type} className={`story-type story-type-${typeIndex + 1}`}>{type}</span>)}</div>
              {chapter.worst && <blockquote>“{chapter.worst.aiHeadline ?? chapter.worst.headline}”<cite>Exhibit {chapter.worst.exhibit} · Severity {chapter.worst.severity}/4</cite></blockquote>}
            </div>
            <svg className="story-terrain" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={terrainPath(chapter.events)} /></svg>
            <p className="story-flight-label">{chapter.kind} / {phaseDays || 1} days</p>
          </section>
        </div>;
      })}

      <section className="story-finale story-section" aria-labelledby="story-finale-title">
        <p className="story-kicker">The record, in full</p>
        <h2 id="story-finale-title">A treatment course<br />with a visible arc.</h2>
        <div className="story-mini-terrain" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d={terrainPath(model.events)} /></svg></div>
        <div className="story-totals"><span>{countLabel(model.stats.totalEvents, "encounter", "encounters")}</span><span>{countLabel(model.stats.providerCount, "provider", "providers")}</span><span>{spanMonths} months</span></div>
        <div className="story-actions"><Link to="/app" className="story-button story-button-primary">Back to workspace</Link><button type="button" className="story-button" onClick={() => window.print()}>Export</button></div>
      </section>
    </main>
  );
}

export default function StoryPage() {
  const caseModel = useCaseStore((state) => state.caseModel);
  return caseModel ? <StoryPageContent model={caseModel} /> : <Navigate to="/app" replace />;
}
