import { useMemo, useRef, useState } from "react";
import type { CaseModel } from "../lib/caseModel";

export interface DateRange { start: string; end: string }
interface Props { caseModel: CaseModel; onRangeChange?: (range: DateRange | null) => void; compact?: boolean }
const width = 1200;
const height = 220;

function daysBetween(a: string, b: string) { return (new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000; }
function dateAt(start: string, days: number) { const d = new Date(`${start}T00:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

export default function Seismograph({ caseModel, onRangeChange, compact = false }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [brush, setBrush] = useState<{ start: number; end: number } | null>(null);
  const drawing = useRef<number | null>(null);
  const { stats, events, phases, milestones } = caseModel;
  const data = useMemo(() => {
    if (!stats.firstDate || !stats.lastDate) return null;
    const span = Math.max(1, daysBetween(stats.firstDate, stats.lastDate));
    const buckets = Array.from({ length: Math.min(120, Math.max(1, Math.ceil(span) + 1)) }, (_, index) => ({ index, events: [] as typeof events }));
    for (const event of events) if (event.date) buckets[Math.min(buckets.length - 1, Math.floor((daysBetween(stats.firstDate, event.date) / span) * buckets.length))].events.push(event);
    const max = Math.max(1, ...buckets.map((bucket) => bucket.events.reduce((sum, event) => sum + event.severity, 0)));
    return { span, buckets, max };
  }, [events, stats]);
  if (!data || !stats.firstDate || !stats.lastDate) return <div className="rounded-xl border border-line bg-white p-8 text-ink-soft">No dated events are available for the seismograph. Undated records remain in the case list.</div>;
  const x = (bucket: number) => (bucket / Math.max(1, data.buckets.length - 1)) * width;
  const amplitude = (index: number) => data.buckets[index].events.reduce((sum, event) => sum + event.severity, 0) / data.max * 76;
  const line = data.buckets.map((_, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${(126 - amplitude(index)).toFixed(1)}`).join(" ");
  const area = `${line} L${width},126 L0,126 Z`;
  const eventX = (date: string) => Math.max(0, Math.min(width, (daysBetween(stats.firstDate!, date) / data.span) * width));
  const coordinate = (event: React.MouseEvent<SVGSVGElement>) => Math.max(0, Math.min(width, (event.nativeEvent.offsetX / event.currentTarget.clientWidth) * width));
  const setRange = (start: number, end: number) => {
    const a = Math.min(start, end), b = Math.max(start, end);
    if (Math.abs(b - a) < 8) return onRangeChange?.(null);
    onRangeChange?.({ start: dateAt(stats.firstDate!, data.span * a / width), end: dateAt(stats.firstDate!, data.span * b / width) });
  };
  const selected = hovered === null ? null : data.buckets[hovered];
  return <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
    <svg viewBox={`0 0 ${width} ${height}`} className={`block w-full ${compact ? "h-[320px]" : "h-[230px]"}`} onMouseMove={(event) => { const point = coordinate(event); setHovered(Math.round(point / width * (data.buckets.length - 1))); if (drawing.current !== null) setBrush({ start: drawing.current, end: point }); }} onMouseLeave={() => setHovered(null)} onMouseDown={(event) => { drawing.current = coordinate(event); setBrush({ start: drawing.current, end: drawing.current }); }} onMouseUp={(event) => { if (drawing.current !== null) setRange(drawing.current, coordinate(event)); drawing.current = null; }}>
      <defs><pattern id="gap-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#b7791f" strokeWidth="2" opacity=".35" /></pattern></defs>
      {phases.map((phase, index) => <g key={phase.id}><rect x={eventX(phase.start)} y="0" width={Math.max(2, eventX(phase.end) - eventX(phase.start))} height={height} fill={index % 2 ? "#f7f6f1" : "#eef0f6"} /><text x={eventX(phase.start) + 8} y="22" fill="#3a4368" fontSize="13">{phase.label}</text></g>)}
      {events.filter((event) => event.flags.includes("gap-after") && event.date).map((event) => { const next = events[events.indexOf(event) + 1]; return next?.date ? <rect key={event.id} x={eventX(event.date!)} y="30" width={Math.max(2, eventX(next.date) - eventX(event.date!))} height="140" fill="url(#gap-hatch)" /> : null; })}
      <path d={area} fill="#0b1437" opacity=".12" /><path d={line} fill="none" stroke="#0b1437" strokeWidth="3" />
      {events.filter((event) => event.date && event.flags.some((flag) => ["surgery", "emergency", "imaging", "work-status"].includes(flag))).map((event) => <line key={event.id} x1={eventX(event.date!)} x2={eventX(event.date!)} y1={120 - event.severity * 14} y2={120 - event.severity * 14 - 15} stroke="#b7791f" strokeWidth="3" />)}
      {milestones.map((milestone) => <g key={milestone.id}><line x1={eventX(milestone.date)} x2={eventX(milestone.date)} y1="0" y2={height} stroke={milestone.kind === "accident" ? "#c02434" : "#b7791f"} strokeWidth="3" /><text x={eventX(milestone.date) + 5} y="210" fill={milestone.kind === "accident" ? "#c02434" : "#b7791f"} fontSize="12">{milestone.label}</text></g>)}
      {brush && <rect x={Math.min(brush.start, brush.end)} y="0" width={Math.abs(brush.end - brush.start)} height={height} fill="#0b1437" opacity=".12" />}
      <line x1="0" x2={width} y1="126" y2="126" stroke="#e4e2dc" /><text x="0" y="205" fill="#3a4368" fontSize="13">{stats.firstDate}</text><text x={width - 75} y="205" fill="#3a4368" fontSize="13">{stats.lastDate}</text>
      {caseModel.undatedCount > 0 && <g><rect x={width - 22} y="48" width="18" height="82" rx="4" fill="#999" opacity=".35" /><text x={width - 22} y="145" fill="#3a4368" fontSize="11">{caseModel.undatedCount} undated</text></g>}
    </svg>
    {selected && <div className="pointer-events-none absolute left-4 top-8 max-w-xs rounded-lg border border-line bg-paper p-3 text-xs shadow-lg"><strong>{dateAt(stats.firstDate, selected.index / data.buckets.length * data.span)} to {dateAt(stats.firstDate, (selected.index + 1) / data.buckets.length * data.span)}</strong><br />{selected.events.length} event{selected.events.length === 1 ? "" : "s"}, severity {selected.events.reduce((sum, event) => sum + event.severity, 0)}<br />{Object.entries(selected.events.reduce<Record<string, number>>((totals, event) => ({ ...totals, [`${event.headline} (${event.severity})`]: (totals[`${event.headline} (${event.severity})`] ?? 0) + 1 }), {})).slice(0, 3).map(([label, count]) => `${count} ${label}`).join(" + ") || "No events"}</div>}
  </div>;
}
