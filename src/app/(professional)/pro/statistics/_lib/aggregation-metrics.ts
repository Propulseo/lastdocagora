import type { TrendPoint } from "../_components/TrendsChart";
import type { HeatmapCell } from "../_components/HeatmapChart";
import type { ServiceStat } from "../_components/ServiceBreakdownChart";
import type { ChannelStat } from "../_components/ChannelChart";
import type { PunctualityData } from "../_components/PunctualityChart";
import type { AppointmentRow } from "./aggregation-types";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

export function getDateRange(
  range: string,
  year?: number,
): { from: string; to: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const selectedYear = year ?? currentYear;
  const isCurrentYear = selectedYear === currentYear;

  // End of range: Dec 31 of selected year, or today if current year
  const toDate = isCurrentYear
    ? now
    : new Date(selectedYear, 11, 31);
  const to = toDate.toISOString().split("T")[0];

  // Start of range: relative to `toDate`, clamped to Jan 1 of selected year
  const yearStart = new Date(selectedYear, 0, 1);
  let from: Date;
  switch (range) {
    case "90d": {
      from = new Date(toDate);
      from.setDate(from.getDate() - 89);
      break;
    }
    case "1y": {
      from = new Date(selectedYear, 0, 1);
      break;
    }
    case "7d": {
      from = new Date(toDate);
      from.setDate(from.getDate() - 6);
      break;
    }
    default: {
      from = new Date(toDate);
      from.setDate(from.getDate() - 29);
      break;
    }
  }

  // Clamp from to Jan 1 of selected year
  if (from < yearStart) from = yearStart;

  return { from: from.toISOString().split("T")[0], to };
}

export function generateDateSeries(from: string, to: string): string[] {
  const dates: string[] = [];
  const current = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ---------------------------------------------------------------------------
// Aggregation functions
// ---------------------------------------------------------------------------

export function buildTrends(
  rows: AppointmentRow[],
  allDates: string[],
): TrendPoint[] {
  const map = new Map<
    string,
    { total: number; noShow: number; cancelled: number }
  >();
  for (const date of allDates) {
    map.set(date, { total: 0, noShow: 0, cancelled: 0 });
  }

  for (const r of rows) {
    const entry = map.get(r.appointment_date);
    if (!entry) continue;
    if (r.status !== "cancelled" && r.status !== "rejected") entry.total++;
    if (r.status === "no-show") entry.noShow++;
    if (r.status === "cancelled" || r.status === "rejected") entry.cancelled++;
  }

  return allDates.map((date) => {
    const entry = map.get(date)!;
    return { date, ...entry };
  });
}

export function buildHeatmap(rows: AppointmentRow[]): HeatmapCell[] {
  const map = new Map<string, number>();

  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected") continue;
    const date = new Date(r.appointment_date + "T00:00:00");
    const day = date.getDay();
    const hour = parseInt(r.appointment_time?.split(":")[0] ?? "0", 10);
    if (hour < 8 || hour > 19) continue;
    const key = `${day}-${hour}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  for (const [key, count] of map) {
    const [day, hour] = key.split("-").map(Number);
    cells.push({ day, hour, count });
  }
  return cells;
}

export function buildServiceBreakdown(rows: AppointmentRow[], locale = "pt", deletedLabel = "—"): ServiceStat[] {
  const map = new Map<string, { total: number; noShow: number }>();

  for (const r of rows) {
    const svc = r.services;
    const locKey = `name_${locale}` as "name_pt" | "name_fr" | "name_en";
    const name = (svc && svc[locKey]) || svc?.name_pt || svc?.name || deletedLabel;
    const entry = map.get(name) ?? { total: 0, noShow: 0 };
    if (r.status !== "cancelled" && r.status !== "rejected") entry.total++;
    if (r.status === "no-show") entry.noShow++;
    map.set(name, entry);
  }

  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);
}

export function buildChannels(rows: AppointmentRow[], channelLabels?: Record<string, string>): ChannelStat[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const ch = r.created_via ?? "patient_booking";
    map.set(ch, (map.get(ch) ?? 0) + 1);
  }

  const fallback: Record<string, string> = {
    patient_booking: "Patient",
    manual: "Manual (pro)",
    walk_in: "Walk-in",
  };
  const labels = channelLabels ?? fallback;

  return Array.from(map.entries()).map(([channel, count]) => ({
    channel,
    label: labels[channel] ?? channel,
    count,
  }));
}

export function buildPunctuality(rows: AppointmentRow[]): PunctualityData {
  let onTime = 0;
  let late = 0;
  let absent = 0;

  for (const r of rows) {
    const att = r.appointment_attendance;
    if (!att || !Array.isArray(att) || att.length === 0) continue;
    const status = att[0].status;
    if (status === "present") onTime++;
    else if (status === "late") late++;
    else if (status === "absent") absent++;
  }

  return { onTime, late, absent };
}
