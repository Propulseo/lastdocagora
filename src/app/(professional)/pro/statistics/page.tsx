import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  StatisticsClient,
  type DashboardData,
} from "./_components/StatisticsClient";
import type { KpiData } from "./_components/KpiCards";
import type { TrendPoint } from "./_components/TrendsChart";
import type { HeatmapCell } from "./_components/HeatmapChart";
import type { ServiceStat } from "./_components/ServiceBreakdownChart";
import type { ChannelStat } from "./_components/ChannelChart";
import type { PunctualityData } from "./_components/PunctualityChart";
import type { RetentionData } from "./_components/RetentionCard";
import type { Insight } from "./_components/InsightsTable";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateRange(range: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  let from: Date;
  switch (range) {
    case "90d": {
      from = new Date(now);
      from.setDate(from.getDate() - 89);
      break;
    }
    case "7d": {
      from = new Date(now);
      from.setDate(from.getDate() - 6);
      break;
    }
    default: {
      // 30d
      from = new Date(now);
      from.setDate(from.getDate() - 29);
      break;
    }
  }

  return { from: from.toISOString().split("T")[0], to };
}

function generateDateSeries(from: string, to: string): string[] {
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
// Aggregation helpers (run in server component — Node.js)
// ---------------------------------------------------------------------------

interface AppointmentRow {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_via: string;
  service_id: string | null;
  patient_id: string | null;
  services: { name: string } | null;
  appointment_attendance: { status: string; late_minutes: number | null }[];
}

function buildTrends(
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
    if (r.status !== "cancelled") entry.total++;
    if (r.status === "no-show") entry.noShow++;
    if (r.status === "cancelled") entry.cancelled++;
  }

  return allDates.map((date) => {
    const entry = map.get(date)!;
    return { date, ...entry };
  });
}

function buildHeatmap(rows: AppointmentRow[]): HeatmapCell[] {
  const map = new Map<string, number>();

  for (const r of rows) {
    if (r.status === "cancelled") continue;
    const date = new Date(r.appointment_date + "T00:00:00");
    const day = date.getDay(); // 0=Sun..6=Sat
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

function buildServiceBreakdown(rows: AppointmentRow[]): ServiceStat[] {
  const map = new Map<string, { total: number; noShow: number }>();

  for (const r of rows) {
    const name = r.services?.name ?? "—";
    const entry = map.get(name) ?? { total: 0, noShow: 0 };
    if (r.status !== "cancelled") entry.total++;
    if (r.status === "no-show") entry.noShow++;
    map.set(name, entry);
  }

  return Array.from(map.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.total - a.total);
}

function buildChannels(rows: AppointmentRow[]): ChannelStat[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const ch = r.created_via ?? "patient_booking";
    map.set(ch, (map.get(ch) ?? 0) + 1);
  }

  const channelLabels: Record<string, string> = {
    patient_booking: "Paciente",
    manual: "Manual (pro)",
  };

  return Array.from(map.entries()).map(([channel, count]) => ({
    channel,
    label: channelLabels[channel] ?? channel,
    count,
  }));
}

function buildPunctuality(rows: AppointmentRow[]): PunctualityData {
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

interface HistoryRow {
  patient_id: string | null;
  status: string;
  appointment_date: string;
  service_id: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
  appointment_attendance: { status: string }[];
}

function buildRetention(historyRows: HistoryRow[]): RetentionData {
  // For each patient, find their first appointment, then check if they returned
  const patientDates = new Map<string, string[]>();
  for (const r of historyRows) {
    if (!r.patient_id) continue;
    if (r.status === "cancelled") continue;
    const dates = patientDates.get(r.patient_id) ?? [];
    dates.push(r.appointment_date);
    patientDates.set(r.patient_id, dates);
  }

  let total = 0;
  let ret30 = 0;
  let ret60 = 0;
  let ret90 = 0;

  for (const [, dates] of patientDates) {
    if (dates.length < 1) continue;
    total++;
    dates.sort();
    const first = new Date(dates[0] + "T00:00:00");

    for (let i = 1; i < dates.length; i++) {
      const next = new Date(dates[i] + "T00:00:00");
      const diffDays = Math.floor(
        (next.getTime() - first.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays <= 30) {
        ret30++;
        ret60++;
        ret90++;
        break;
      } else if (diffDays <= 60) {
        ret60++;
        ret90++;
        break;
      } else if (diffDays <= 90) {
        ret90++;
        break;
      }
    }
  }

  return {
    days30: total > 0 ? Math.round((ret30 / total) * 100) : 0,
    days60: total > 0 ? Math.round((ret60 / total) * 100) : 0,
    days90: total > 0 ? Math.round((ret90 / total) * 100) : 0,
    totalPatients: total,
  };
}

function buildInsights(
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

  // 3) High no-show time slots from heatmap
  // Group by day-hour, check if any slot has disproportionate no-shows
  // (simplified: just flag low-density slots)

  // 4) Sort by severity
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

  return insights.slice(0, 8); // max 8 insights
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface SearchParams {
  range?: string;
  service?: string;
  channel?: string;
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const range = params.range || "30d";
  const serviceFilter = params.service || "";
  const channelFilter = params.channel || "";
  const { from, to } = getDateRange(range);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!professional) redirect("/login");

  // --- 4 parallel queries ---
  const [kpiResult, chartResult, insightsResult, servicesResult] =
    await Promise.all([
      // 1) KPI via RPC
      supabase.rpc("get_pro_dashboard_stats", {
        p_professional_id: professional.id,
        p_from_date: from,
        p_to_date: to,
        p_service_id: serviceFilter || undefined,
        p_created_via: channelFilter || undefined,
      }),

      // 2) Chart data (appointments in range with attendance + services)
      (() => {
        let query = supabase
          .from("appointments")
          .select(
            `
            id, appointment_date, appointment_time, status, created_via,
            service_id, patient_id,
            services(name),
            appointment_attendance(status, late_minutes)
          `,
          )
          .eq("professional_id", professional.id)
          .gte("appointment_date", from)
          .lte("appointment_date", to);

        if (serviceFilter) query = query.eq("service_id", serviceFilter);
        if (channelFilter) query = query.eq("created_via", channelFilter);

        return query;
      })(),

      // 3) Insights data (full history for patient risk)
      supabase
        .from("appointments")
        .select(
          `
          patient_id, status, appointment_date, service_id,
          patients(first_name, last_name),
          services(name),
          appointment_attendance(status)
        `,
        )
        .eq("professional_id", professional.id),

      // 4) Services list for filter dropdown
      supabase
        .from("services")
        .select("id, name")
        .eq("professional_id", professional.id)
        .eq("is_active", true)
        .order("name"),
    ]);

  // --- Parse RPC result ---
  const kpi = kpiResult.data as Record<string, number> | null;
  const kpiData: KpiData = {
    totalAppointments: kpi?.total_appointments ?? 0,
    attendanceRate: kpi?.attendance_rate ?? 0,
    attendanceTotal: kpi?.attendance_total ?? 0,
    noShowRate: kpi?.no_show_rate ?? 0,
    noShowCount: kpi?.no_show ?? 0,
    cancellationRate: kpi?.cancellation_rate ?? 0,
    cancelledCount: kpi?.cancelled ?? 0,
    avgLateMinutes: kpi?.avg_late_minutes ?? 0,
    pctLate: kpi?.pct_late ?? 0,
    newPatientsPct: kpi?.new_patients_pct ?? 0,
    newPatientsCount: kpi?.new_patients_count ?? 0,
    returningPatientsCount: kpi?.returning_patients_count ?? 0,
    totalInRange: kpi?.total_in_range ?? 0,
    totalWithAttendance: kpi?.total_with_attendance ?? 0,
  };

  // --- Aggregate chart data ---
  const chartRows = (chartResult.data ?? []) as unknown as AppointmentRow[];
  const historyRows = (insightsResult.data ?? []) as unknown as HistoryRow[];
  const allDates = generateDateSeries(from, to);

  const trends = buildTrends(chartRows, allDates);
  const heatmap = buildHeatmap(chartRows);
  const serviceBreakdown = buildServiceBreakdown(chartRows);
  const channels = buildChannels(chartRows);
  const punctuality = buildPunctuality(chartRows);
  const retention = buildRetention(historyRows);
  const insights = buildInsights(serviceBreakdown, heatmap, historyRows);

  const servicesList = (servicesResult.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const dashboardData: DashboardData = {
    kpi: kpiData,
    trends,
    heatmap,
    serviceBreakdown,
    channels,
    punctuality,
    retention,
    insights,
    filters: {
      range,
      service: serviceFilter,
      channel: channelFilter,
      services: servicesList,
    },
  };

  return <StatisticsClient data={dashboardData} />;
}
