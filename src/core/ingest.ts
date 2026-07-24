import * as XLSX from "xlsx";
import { GAP_DAYS, FLAG_RULES, SEVERITY_RULES, type CaseEvent, type CaseModel, type CaseStats, type ImportReport } from "../lib/caseModel";
import { useCaseStore } from "../lib/store";
import { derivePhases } from "./derive";

type Field = "date" | "providers" | "facility" | "bodyParts" | "medicineType" | "recordType" | "summary" | "pdfUrl";
const aliases: Record<Field, string[]> = {
  date: ["encounterdate", "dateofservice", "service date", "date"],
  providers: ["primaryprovider", "provider", "physician", "doctor"],
  facility: ["facility", "location", "clinic"],
  bodyParts: ["bodyparts", "bodypart", "injuryarea", "anatomicalarea"],
  medicineType: ["medicinetype", "specialty", "medicaltype", "type"],
  recordType: ["recordtype", "documenttype", "notetype", "record"],
  summary: ["summary", "description", "narrative", "notes"],
  pdfUrl: ["linktopdf", "pdflink", "pdf", "link"],
};
const clean = (value: unknown) => String(value ?? "").trim();
const normalized = (value: unknown) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const titleCase = (value: string) => value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

function isoDate(year: number, month: number, day: number) { return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return isoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  if (typeof value === "number" && value > 0) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return isoDate(parsed.y, parsed.m, parsed.d);
  }
  const text = clean(value);
  if (!text) return null;
  const american = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  const candidate = american ? new Date(Number(american[3].length === 2 ? `20${american[3]}` : american[3]), Number(american[1]) - 1, Number(american[2])) : new Date(text);
  return Number.isNaN(candidate.getTime()) ? null : isoDate(candidate.getFullYear(), candidate.getMonth() + 1, candidate.getDate());
}

function findHeaders(rows: unknown[][]): { row: number; fields: Partial<Record<Field, number>>; map: Record<string, string> } {
  let best = { row: 0, fields: {} as Partial<Record<Field, number>>, map: {} as Record<string, string> };
  rows.slice(0, 5).forEach((row, rowIndex) => {
    const fields: Partial<Record<Field, number>> = {}; const map: Record<string, string> = {};
    row.forEach((cell, column) => Object.entries(aliases).forEach(([field, names]) => {
      if (fields[field as Field] === undefined && names.some((name) => normalized(name) === normalized(cell))) {
        fields[field as Field] = column; map[field] = clean(cell);
      }
    }));
    if (Object.keys(fields).length > Object.keys(best.fields).length) best = { row: rowIndex, fields, map };
  });
  return best;
}

function headline(recordType: string | null, bodyParts: string[], providers: string[]) {
  const label = `${recordType || "Medical record"} - ${bodyParts[0] || "General care"}${providers[0] ? ` (${providers[0]})` : ""}`;
  return label.length > 70 ? `${label.slice(0, 67)}...` : label;
}

export function parseWorkbook(buffer: ArrayBuffer, sourceFileName: string): CaseModel {
  const book = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = book.Sheets[book.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true });
  const headers = findHeaders(rows);
  const report: ImportReport = { rowsRead: Math.max(0, rows.length - headers.row - 1), eventsLoaded: 0, missingDates: 0, missingProviders: 0, missingBodyParts: 0, missingMedicineType: 0, headerMap: headers.map, warnings: [] };
  if (Object.keys(headers.fields).length < 4) report.warnings.push("Could not confidently identify a header row; available columns were imported where possible.");
  const events: CaseEvent[] = [];
  rows.slice(headers.row + 1).forEach((row, index) => {
    if (!row.some((cell) => clean(cell))) return;
    const value = (field: Field) => row[headers.fields[field] ?? -1];
    const providers = clean(value("providers")).split(";").map(clean).filter(Boolean);
    const bodyParts = [...new Map(clean(value("bodyParts")).split(",").map(clean).filter(Boolean).map((part) => [part.toLowerCase(), titleCase(part)])).values()];
    const date = parseDate(value("date"));
    const recordType = clean(value("recordType")) || null, medicineType = clean(value("medicineType")) || null;
    const matching = `${recordType ?? ""} ${medicineType ?? ""}`;
    const severityRule = SEVERITY_RULES.find((rule) => rule.pattern.test(matching));
    const address = XLSX.utils.encode_cell({ r: headers.row + 1 + index, c: headers.fields.pdfUrl ?? -1 });
    const pdfUrl = headers.fields.pdfUrl === undefined ? null : sheet[address]?.l?.Target ?? null;
    const raw = Object.fromEntries(rows[headers.row].map((header, column) => [clean(header), clean(row[column])]));
    events.push({ id: `e-${String(index + 1).padStart(4, "0")}`, exhibit: 0, date, providers, facility: clean(value("facility")) || null, bodyParts, medicineType, recordType, summary: clean(value("summary")), pdfUrl, severity: severityRule?.level ?? 2, flags: FLAG_RULES.filter((rule) => rule.pattern.test(matching)).map((rule) => rule.flag), headline: headline(recordType, bodyParts, providers), raw });
    if (!date) report.missingDates++; if (!providers.length) report.missingProviders++; if (!bodyParts.length) report.missingBodyParts++; if (!medicineType) report.missingMedicineType++;
  });
  events.sort((a, b) => (a.date === null ? 1 : b.date === null ? -1 : a.date.localeCompare(b.date)) || a.id.localeCompare(b.id));
  events.forEach((event, index) => event.exhibit = index + 1);
  const dated = events.filter((event) => event.date);
  if (dated[0]) dated[0].flags.push("first-visit");
  dated.forEach((event, index) => { if (dated[index + 1] && (new Date(dated[index + 1].date!).getTime() - new Date(event.date!).getTime()) / 86400000 > GAP_DAYS) event.flags.push("gap-after"); });
  const firstDate = dated[0]?.date ?? null, lastDate = dated.at(-1)?.date ?? null;
  const count = (values: string[]) => values.reduce<Record<string, number>>((total, item) => ({ ...total, [item]: (total[item] ?? 0) + 1 }), {});
  const months: CaseStats["visitsPerMonth"] = [];
  if (firstDate && lastDate) for (let cursor = new Date(`${firstDate}T00:00:00`); cursor <= new Date(`${lastDate}T00:00:00`); cursor.setMonth(cursor.getMonth() + 1)) { const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`; const items = dated.filter((event) => event.date!.startsWith(month)); months.push({ month, count: items.length, severitySum: items.reduce((sum, event) => sum + event.severity, 0) }); }
  const stats: CaseStats = { totalEvents: events.length, firstDate, lastDate, dateSpanDays: firstDate && lastDate ? Math.round((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000) : 0, providerCount: new Set(events.flatMap((event) => event.providers.map((provider) => provider.toLowerCase()))).size, facilityCount: new Set(events.map((event) => event.facility?.toLowerCase()).filter(Boolean)).size, byMedicineType: count(events.map((event) => event.medicineType || "Unclassified")), byBodyPart: count(events.flatMap((event) => event.bodyParts)), byRecordType: count(events.map((event) => event.recordType || "Unclassified")), visitsPerMonth: months };
  const phases = derivePhases(events); report.eventsLoaded = events.length;
  return { id: `case-${Date.now()}`, name: sourceFileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), sourceFileName, importedAt: new Date().toISOString(), events, undatedCount: report.missingDates, milestones: [], phases, stats, importReport: report };
}

export async function ingestFile(file: File) {
  const model = parseWorkbook(await file.arrayBuffer(), file.name);
  useCaseStore.getState().setCase(model);
  return model;
}
