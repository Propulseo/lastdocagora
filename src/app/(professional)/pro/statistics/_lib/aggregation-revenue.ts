import type { RevenueTrendPoint } from "../_components/StatsCharts";
import type { AppointmentRow } from "./aggregation-types";

// ---------------------------------------------------------------------------
// Revenue trends (for Performance tab)
// ---------------------------------------------------------------------------

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
