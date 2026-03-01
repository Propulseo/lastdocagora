import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import {
  StatisticsClient,
  type DashboardData,
} from "./_components/StatisticsClient";
import type { KpiData } from "./_components/KpiCards";
import {
  getDateRange,
  generateDateSeries,
  buildTrends,
  buildHeatmap,
  buildServiceBreakdown,
  buildChannels,
  buildPunctuality,
  buildInsights,
  type AppointmentRow,
  type HistoryRow,
} from "./_lib/aggregation";

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

  const professionalId = await getProfessionalId();

  const supabase = await createClient();

  // --- 4 parallel queries ---
  const [kpiResult, chartResult, insightsResult, servicesResult] =
    await Promise.all([
      // 1) KPI via RPC
      supabase.rpc("get_pro_dashboard_stats", {
        p_professional_id: professionalId,
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
          .eq("professional_id", professionalId)
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
        .eq("professional_id", professionalId),

      // 4) Services list for filter dropdown
      supabase
        .from("services")
        .select("id, name")
        .eq("professional_id", professionalId)
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
