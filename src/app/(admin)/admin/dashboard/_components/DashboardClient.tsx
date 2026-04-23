"use client";

import {
  Users,
  ShieldCheck,
  Calendar,
  CalendarCheck,
  HeadphonesIcon,
} from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { DashboardHero } from "./dashboard-hero";
import {
  DashboardKpiGrid,
  type DashboardKpi,
} from "./dashboard-kpi-grid";

import { DashboardAlerts } from "./dashboard-alerts";
import { DashboardTopPros } from "./dashboard-top-pros";

interface DashboardClientProps {
  firstName: string;
  stats: {
    total_patients: number | null;
    verified_professionals: number | null;
    appointments_this_month: number | null;
    open_tickets: number | null;
  } | null;
  topProfessionals: never[];
  todayCount: number | null;
  pendingVerifications: number | null;
  openTickets: number | null;
}

export function DashboardClient({
  firstName,
  stats,
  topProfessionals,
  todayCount,
  pendingVerifications,
  openTickets,
}: DashboardClientProps) {
  const { t } = useAdminI18n();

  const todayShort = new Date().toLocaleDateString(
    t.common.dateLocale as string,
    { day: "numeric", month: "short" }
  );

  // Primary KPI first (largest display), then secondary in order of relevance
  const kpis: DashboardKpi[] = [
    {
      label: t.dashboard.kpiMonthlyAppointments,
      value: stats?.appointments_this_month ?? 0,
      icon: Calendar,
      description: t.dashboard.kpiMonthlyAppointmentsDesc,
    },
    {
      label: t.dashboard.kpiTotalUsers,
      value: stats?.total_patients ?? 0,
      icon: Users,
      description: t.dashboard.kpiTotalUsersDesc,
    },
    {
      label: t.dashboard.kpiVerifiedPros,
      value: stats?.verified_professionals ?? 0,
      icon: ShieldCheck,
      description: t.dashboard.kpiVerifiedProsDesc,
    },
    {
      label: t.dashboard.kpiTodayAppointments,
      value: todayCount ?? 0,
      icon: CalendarCheck,
      description: todayShort,
    },
    {
      label: t.dashboard.kpiOpenTickets,
      value: stats?.open_tickets ?? 0,
      icon: HeadphonesIcon,
      description: t.dashboard.kpiOpenTicketsDesc,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardHero
        firstName={firstName}
        pendingVerifications={pendingVerifications ?? 0}
        openTickets={openTickets ?? 0}
      />

      <DashboardKpiGrid kpis={kpis} />

      <DashboardAlerts
        pendingVerifications={pendingVerifications ?? 0}
        openTickets={openTickets ?? 0}
      />

      <DashboardTopPros data={topProfessionals} />
    </div>
  );
}
