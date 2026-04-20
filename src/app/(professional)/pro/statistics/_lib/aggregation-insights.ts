import type { HeatmapCell } from "../_components/HeatmapChart";
import type { ServiceStat } from "../_components/ServiceBreakdownChart";
import type { Insight } from "../_components/InsightsTable";
import type { HistoryRow, InsightLabels } from "./aggregation-types";
import { DEFAULT_INSIGHT_LABELS } from "./aggregation-types";

// ---------------------------------------------------------------------------
// Insights builder
// ---------------------------------------------------------------------------

function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
  }
  return result;
}

export function buildInsights(
  serviceBreakdown: ServiceStat[],
  heatmap: HeatmapCell[],
  historyRows: HistoryRow[],
  labels?: InsightLabels,
): Insight[] {
  const l = labels ?? DEFAULT_INSIGHT_LABELS;
  const insights: Insight[] = [];

  // 1) Services with high no-show rates
  for (const svc of serviceBreakdown) {
    if (svc.total < 3) continue;
    const noShowRate = Math.round((svc.noShow / svc.total) * 100);
    if (noShowRate >= 25) {
      insights.push({
        type: "danger",
        message: interpolate(l.worstService, { name: svc.name, rate: noShowRate }),
        action: l.worstServiceAction,
      });
    } else if (noShowRate === 0 && svc.total >= 5) {
      insights.push({
        type: "success",
        message: interpolate(l.bestService, { name: svc.name, rate: 100 }),
        action: l.bestServiceAction,
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
        .join(" ") || l.patientFallback,
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
        message: interpolate(l.riskyPatient, { name: p.name, count: total }),
        action: l.riskyPatientAction,
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
