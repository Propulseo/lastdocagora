import type { TrendPoint } from "../_components/TrendsChart";
import type { HeatmapCell } from "../_components/HeatmapChart";
import type { ServiceStat } from "../_components/ServiceBreakdownChart";
import type { ChannelStat } from "../_components/ChannelChart";
import type { PunctualityData } from "../_components/PunctualityChart";
import type { Insight } from "../_components/InsightsTable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AppointmentRow {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_via: string;
  service_id: string | null;
  patient_id: string | null;
  price?: number | null;
  duration_minutes: number;
  services: { name: string } | null;
  appointment_attendance: { status: string; late_minutes: number | null }[];
}

export interface AvailabilityRow {
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
  day_of_week: number;
}

export interface HistoryRow {
  patient_id: string | null;
  status: string;
  appointment_date: string;
  service_id: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
  appointment_attendance: { status: string }[];
}

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

export function buildServiceBreakdown(rows: AppointmentRow[]): ServiceStat[] {
  const map = new Map<string, { total: number; noShow: number }>();

  for (const r of rows) {
    const name = r.services?.name ?? "—";
    const entry = map.get(name) ?? { total: 0, noShow: 0 };
    if (r.status !== "cancelled" && r.status !== "rejected") entry.total++;
    if (r.status === "no-show") entry.noShow++;
    map.set(name, entry);
  }

  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);
}

export function buildChannels(rows: AppointmentRow[]): ChannelStat[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const ch = r.created_via ?? "patient_booking";
    map.set(ch, (map.get(ch) ?? 0) + 1);
  }

  const channelLabels: Record<string, string> = {
    patient_booking: "Paciente",
    manual: "Manual (pro)",
    walk_in: "Walk-in",
  };

  return Array.from(map.entries()).map(([channel, count]) => ({
    channel,
    label: channelLabels[channel] ?? channel,
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

// ---------------------------------------------------------------------------
// Operational KPI functions
// ---------------------------------------------------------------------------

// Avg gap between consecutive appointments on the same day
export function computeAvgGapMinutes(rows: AppointmentRow[]): number {
  // Group appointments by date
  const byDate = new Map<string, AppointmentRow[]>();
  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected") continue;
    const list = byDate.get(r.appointment_date) ?? [];
    list.push(r);
    byDate.set(r.appointment_date, list);
  }

  let totalGap = 0;
  let gapCount = 0;

  for (const [, dayRows] of byDate) {
    if (dayRows.length < 2) continue;
    // Sort by time
    dayRows.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    for (let i = 1; i < dayRows.length; i++) {
      const prev = dayRows[i - 1];
      const curr = dayRows[i];
      const [ph, pm] = prev.appointment_time.split(":").map(Number);
      const prevEnd = ph * 60 + pm + (prev.duration_minutes || 30);
      const [ch, cm] = curr.appointment_time.split(":").map(Number);
      const currStart = ch * 60 + cm;
      const gap = currStart - prevEnd;
      if (gap > 0) {
        totalGap += gap;
        gapCount++;
      }
    }
  }

  return gapCount > 0 ? Math.round(totalGap / gapCount) : 0;
}

// Total billable hours (confirmed/present appointments only)
export function computeBillableHours(rows: AppointmentRow[]): number {
  let totalMinutes = 0;
  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected" || r.status === "no-show" || r.status === "no_show") continue;
    const att = r.appointment_attendance;
    const attStatus = Array.isArray(att) && att.length > 0 ? att[0].status : null;
    // Count if attendance is present or late, or if no attendance recorded yet (confirmed)
    if (attStatus === "present" || attStatus === "late" || !attStatus) {
      totalMinutes += r.duration_minutes || 30;
    }
  }
  return Math.round((totalMinutes / 60) * 10) / 10; // one decimal
}

// Occupancy rate = booked minutes / available minutes
export function computeOccupancyRate(
  rows: AppointmentRow[],
  availabilitySlots: AvailabilityRow[],
  from: string,
  to: string
): number {
  // Calculate booked minutes
  let bookedMinutes = 0;
  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected") continue;
    bookedMinutes += r.duration_minutes || 30;
  }

  // Calculate available minutes from availability slots across the date range
  let availableMinutes = 0;
  const startDate = new Date(from + "T00:00:00");
  const endDate = new Date(to + "T00:00:00");

  for (const slot of availabilitySlots) {
    const [sh, sm] = slot.start_time.split(":").map(Number);
    const [eh, em] = slot.end_time.split(":").map(Number);
    const slotMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (slotMinutes <= 0) continue;

    if (slot.is_recurring) {
      // Count how many times this day_of_week occurs in the range
      const current = new Date(startDate);
      while (current <= endDate) {
        if (current.getDay() === slot.day_of_week) {
          availableMinutes += slotMinutes;
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (slot.specific_date) {
      const slotDate = new Date(slot.specific_date + "T00:00:00");
      if (slotDate >= startDate && slotDate <= endDate) {
        availableMinutes += slotMinutes;
      }
    }
  }

  if (availableMinutes === 0) return 0;
  return Math.min(Math.round((bookedMinutes / availableMinutes) * 100), 100);
}

// ---------------------------------------------------------------------------
// Revenue trends (for Performance tab)
// ---------------------------------------------------------------------------

import type { RevenueTrendPoint } from "../_components/StatsCharts";

export function buildRevenueTrends(
  rows: AppointmentRow[],
  allDates: string[],
): { trends: RevenueTrendPoint[]; total: number } {
  const map = new Map<string, number>();
  for (const date of allDates) map.set(date, 0);

  let total = 0;
  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected") continue;
    const price = Number(r.price) || 0;
    total += price;
    const entry = map.get(r.appointment_date);
    if (entry !== undefined) map.set(r.appointment_date, entry + price);
  }

  const trends = allDates.map((date) => ({ date, revenue: map.get(date) ?? 0 }));
  return { trends, total };
}

export function buildInsights(
  serviceBreakdown: ServiceStat[],
  heatmap: HeatmapCell[],
  historyRows: HistoryRow[],
): Insight[] {
  const insights: Insight[] = [];

  // 1) Services with high no-show rates
  for (const svc of serviceBreakdown) {
    if (svc.total < 3) continue;
    const noShowRate = Math.round((svc.noShow / svc.total) * 100);
    if (noShowRate >= 25) {
      insights.push({
        type: "danger",
        message: `"${svc.name}" : ${noShowRate}% não compareceu`,
        action: "Ativar lembrete específico para este serviço",
      });
    } else if (noShowRate === 0 && svc.total >= 5) {
      insights.push({
        type: "success",
        message: `"${svc.name}" : ${100}% taxa presença`,
        action: "Serviço a promover — excelente adesão",
      });
    }
  }

  // 2) Risky patients (2+ no-show/cancelled)
  const patientRisk = new Map<
    string,
    { name: string; noShows: number; cancels: number }
  >();
  for (const r of historyRows) {
    if (!r.patient_id) continue;
    const entry = patientRisk.get(r.patient_id) ?? {
      name: [r.patients?.first_name, r.patients?.last_name]
        .filter(Boolean)
        .join(" ") || "Paciente",
      noShows: 0,
      cancels: 0,
    };
    if (r.status === "no-show") entry.noShows++;
    if (r.status === "cancelled") entry.cancels++;
    patientRisk.set(r.patient_id, entry);
  }

  for (const [, p] of patientRisk) {
    const total = p.noShows + p.cancels;
    if (total >= 2) {
      insights.push({
        type: "warning",
        message: `${p.name} : ${total} ausências/cancelamentos`,
        action: "Considerar acompanhamento ou acompte",
      });
    }
  }

  // 3) Sort by severity
  const severityOrder: Record<string, number> = {
    danger: 0,
    warning: 1,
    info: 2,
    success: 3,
  };
  insights.sort(
    (a, b) =>
      (severityOrder[a.type] ?? 99) - (severityOrder[b.type] ?? 99),
  );

  return insights.slice(0, 8);
}
