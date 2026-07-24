import type { CaseEvent, CasePhase, PhaseKind } from "../lib/caseModel";

const phaseMeta: Record<PhaseKind, { label: string }> = {
  emergency: { label: "Emergency care" },
  surgery: { label: "Surgery" },
  diagnostics: { label: "Diagnostics & imaging" },
  therapy: { label: "Therapy & rehab" },
  recovery: { label: "Recovery & maintenance" },
  other: { label: "Ongoing care" },
};

function category(event: CaseEvent): PhaseKind {
  const text = `${event.recordType ?? ""} ${event.medicineType ?? ""}`.toLowerCase();
  if (event.flags.includes("emergency")) return "emergency";
  if (event.flags.includes("surgery")) return "surgery";
  if (event.flags.includes("imaging")) return "diagnostics";
  if (/therap|rehab|chiro/.test(text)) return "therapy";
  return "other";
}

export function derivePhases(events: CaseEvent[]): CasePhase[] {
  const dated = events.filter((event) => event.date);
  if (!dated.length) return [];
  const runs: { kind: PhaseKind; events: CaseEvent[] }[] = [];
  for (const event of dated) {
    const kind = category(event);
    const current = runs.at(-1);
    if (!current || current.kind !== kind) runs.push({ kind, events: [event] });
    else current.events.push(event);
  }
  while (runs.length > 1) {
    const shortIndex = runs.findIndex((run) => run.events.length < 3);
    if (shortIndex < 0) break;
    const target = shortIndex === 0 ? 1 : shortIndex - 1;
    runs[target].events = shortIndex === 0
      ? [...runs[shortIndex].events, ...runs[target].events]
      : [...runs[target].events, ...runs[shortIndex].events];
    runs.splice(shortIndex, 1);
  }
  const selected = runs.length <= 8 ? runs : runs.slice(0, 7).concat({
    kind: "other" as PhaseKind,
    events: runs.slice(7).flatMap((run) => run.events),
  });
  const phases = selected.map((run, index) => ({
    id: `phase-${index + 1}`,
    label: phaseMeta[run.kind].label,
    kind: run.kind,
    start: run.events[0].date!,
    end: run.events.at(-1)!.date!,
    eventIds: run.events.map((event) => event.id),
  }));
  const span = new Date(dated.at(-1)!.date!).getTime() - new Date(dated[0].date!).getTime();
  const tailStart = new Date(dated[0].date!).getTime() + span * 0.8;
  const tail = dated.filter((event) => new Date(event.date!).getTime() >= tailStart);
  const peak = Math.max(...phases.map((phase) => phase.eventIds.length));
  if (tail.length && tail.length < peak / 4) phases.at(-1)!.label = phaseMeta.recovery.label;
  for (const phase of phases) for (const id of phase.eventIds) {
    const event = events.find((item) => item.id === id);
    if (event) event.phaseId = phase.id;
  }
  return phases;
}
