/*
 * OWNER: MiniMax session. See handoffs/MINIMAX_AI_N8N.md.
 * Builds the caseDigest text sent to the AI endpoints, plus an exhibit ->
 * eventId map so citations from the model can be traced back to real events.
 * Field widths are capped so an 820-event digest stays under ~100 KB.
 */
import type { CaseModel } from "../lib/caseModel";

const MAX_HEADLINE_CHARS = 32;
const MAX_MEDICINE_CHARS = 16;
const MAX_BODY_PARTS_CHARS = 16;

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function buildCaseDigest(caseModel: CaseModel): {
  digest: string;
  ids: Record<number, string>;
} {
  const { stats, milestones, events } = caseModel;

  const span =
    stats.firstDate && stats.lastDate
      ? `${stats.firstDate} to ${stats.lastDate} (${stats.dateSpanDays} days)`
      : "unknown";

  const byType =
    Object.entries(stats.byMedicineType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ") || "none";

  const milestoneLines = milestones.length
    ? milestones
        .map((m) => `${m.kind === "accident" ? "Accident" : m.label} on ${m.date}`)
        .join("; ")
    : "none recorded";

  const header = [
    `Case: ${caseModel.name}`,
    `Date span: ${span}`,
    `Total events: ${stats.totalEvents} (${caseModel.undatedCount} undated)`,
    `Providers: ${stats.providerCount}, Facilities: ${stats.facilityCount}`,
    `By medicine type: ${byType}`,
    `Milestones: ${milestoneLines}`,
  ];

  const ids: Record<number, string> = {};
  const lines: string[] = [];

  for (const event of events) {
    ids[event.exhibit] = event.id;
    const date = event.date ?? "undated";
    const headline = truncate(event.headline, MAX_HEADLINE_CHARS);
    const medicineType = truncate(event.medicineType ?? "?", MAX_MEDICINE_CHARS);
    const bodyParts = truncate(event.bodyParts.join(","), MAX_BODY_PARTS_CHARS);
    lines.push(
      `#${event.exhibit} | ${date} | ${headline} | ${medicineType} | ${bodyParts} | sev${event.severity}`
    );
  }

  const digest = [...header, "", ...lines].join("\n");
  return { digest, ids };
}
