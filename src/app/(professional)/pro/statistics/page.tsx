import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/server";
import { getProfessionalTranslations } from "@/lib/i18n/pro/translations";
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
  type InsightLabels,
  buildRevenueTrends,
  computeAvgGapMinutes,
  computeBillableHours,
  computeOccupancyRate,
  type AppointmentRow,
  type HistoryRow,
  type AvailabilityRow,
} from "./_lib/aggregation";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface SearchParams {
  range?: string;
  service?: string;
  channel?: string;
  year?: string;
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
  const currentYear = new Date().getFullYear();
  const selectedYear = params.year ? parseInt(params.year, 10) : currentYear;
  const { from, to } = getDateRange(range, selectedYear);

  const professionalId = await getProfessionalId();

  const supabase = await createClient();

  // Fetch professional created_at to determine min year
  const { data: proData } = await supabase
    .from("professionals")
    .select("created_at")
    .eq("id", professionalId)
    .single();
  const minYear = proData?.created_at
    ? new Date(proData.created_at).getFullYear()
    : currentYear;

  // --- 5 parallel queries ---
  const [kpiResult, chartResult, insightsResult, servicesResult, availabilityResult] =
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
            service_id, patient_id, price, duration_minutes,
            services(name, name_pt, name_fr, name_en),
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

      // 3) Insights data (year-scoped for patient risk)
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
        .eq("professional_id", professionalId)
        .gte("appointment_date", `${selectedYear}-01-01`)
        .lte("appointment_date", `${selectedYear}-12-31`),

      // 4) Services list for filter dropdown
      supabase
        .from("services")
        .select("id, name, name_pt, name_fr, name_en")
        .eq("professional_id", professionalId)
        .eq("is_active", true)
        .order("name"),

      // 5) Availability slots for occupancy calculation
      supabase
        .from("availability")
        .select("start_time, end_time, is_recurring, specific_date, day_of_week")
        .eq("professional_id", professionalId)
        .eq("is_blocked", false),
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
    avgGapMinutes: 0,
    billableHours: 0,
    occupancyRate: 0,
    walkInCount: 0,
  };

  // --- Aggregate chart data ---
  const chartRows = (chartResult.data ?? []) as unknown as AppointmentRow[];
  const historyRows = (insightsResult.data ?? []) as unknown as HistoryRow[];
  const allDates = generateDateSeries(from, to);

  const locale = await getServerLocale();
  const proI18n = getProfessionalTranslations(locale);
  const channelLabels: Record<string, string> = {
    patient_booking: proI18n.statistics.channel.patientBooking,
    manual: proI18n.statistics.channel.manual,
    walk_in: proI18n.statistics.channel.walkIn,
  };
  const deletedServiceLabel = (proI18n.statistics.emptyState as Record<string, string>).deletedService ?? "\u2014";

  const trends = buildTrends(chartRows, allDates);
  const heatmap = buildHeatmap(chartRows);
  const serviceBreakdown = buildServiceBreakdown(chartRows, locale, deletedServiceLabel);
  const channels = buildChannels(chartRows, channelLabels);
  const punctuality = buildPunctuality(chartRows);
  const insightLabels: InsightLabels = {
    worstService: proI18n.statistics.insights.worstService,
    worstServiceAction: proI18n.statistics.insights.worstServiceAction,
    bestService: proI18n.statistics.insights.bestService,
    bestServiceAction: proI18n.statistics.insights.bestServiceAction,
    patientFallback: proI18n.statistics.insights.patientFallback,
    riskyPatient: proI18n.statistics.insights.riskyPatient,
    riskyPatientAction: proI18n.statistics.insights.riskyPatientAction,
  };
  const insights = buildInsights(serviceBreakdown, heatmap, historyRows, insightLabels);
  const { trends: revenueTrends, total: totalRevenue } = buildRevenueTrends(chartRows, allDates);

  // --- Compute operational KPIs ---
  const availabilityRows = (availabilityResult.data ?? []) as unknown as AvailabilityRow[];
  kpiData.avgGapMinutes = computeAvgGapMinutes(chartRows);
  kpiData.billableHours = computeBillableHours(chartRows);
  kpiData.occupancyRate = computeOccupancyRate(chartRows, availabilityRows, from, to);
  kpiData.walkInCount = chartRows.filter((r) => r.created_via === "walk_in").length;

  const servicesList = (servicesResult.data ?? []).map((s) => {
    const svc = s as { id: string; name: string; name_pt?: string | null; name_fr?: string | null; name_en?: string | null };
    const locKey = `name_${locale}` as "name_pt" | "name_fr" | "name_en";
    return {
      id: svc.id,
      name: svc[locKey] || svc.name_pt || svc.name,
    };
  });

  const dashboardData: DashboardData = {
    kpi: kpiData,
    trends,
    heatmap,
    serviceBreakdown,
    channels,
    punctuality,
    insights,
    revenueTrends,
    totalRevenue,
    filters: {
      range,
      service: serviceFilter,
      channel: channelFilter,
      services: servicesList,
    },
    yearNav: {
      selectedYear,
      minYear,
      maxYear: currentYear,
    },
  };

  return <StatisticsClient data={dashboardData} />;
}
