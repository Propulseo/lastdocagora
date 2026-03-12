"use client";

import {
  Users, UserCheck, Stethoscope, Calendar, Activity, CheckCircle,
} from "lucide-react";
import { KPICard } from "@/components/shared/kpi-card";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { StatisticsData } from "../_lib/types";

interface KPIStripProps {
  kpis: StatisticsData["kpis"];
}

export function KPIStrip({ kpis }: KPIStripProps) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  const delta = (n: number) => (n >= 0 ? `+${n}` : String(n));
  const trend = (n: number) =>
    n > 0 ? ("up" as const) : n < 0 ? ("down" as const) : undefined;

  const cards = [
    {
      icon: Users,
      label: s.kpiTotalUsers,
      value: kpis.totalUsers,
      description: s.newOnPeriod.replace("{count}", delta(kpis.usersDelta)),
      iconVariant: "blue" as const,
      trend: trend(kpis.usersDelta),
    },
    {
      icon: UserCheck,
      label: s.kpiPatients,
      value: kpis.totalPatients,
      description: s.newOnPeriod.replace("{count}", String(kpis.newPatients)),
      iconVariant: "green" as const,
      trend: trend(kpis.patientsDelta),
    },
    {
      icon: Stethoscope,
      label: s.kpiProfessionals,
      value: kpis.totalProfessionals,
      description: `${s.verifiedCount.replace("{verified}", String(kpis.verifiedPros))} / ${s.pendingCount.replace("{pending}", String(kpis.pendingPros))}`,
      iconVariant: "default" as const,
      trend: trend(kpis.prosDelta),
    },
    {
      icon: Calendar,
      label: s.kpiAppointments,
      value: kpis.totalAppointments,
      description: s.thisMonth.replace("{count}", String(kpis.periodAppointments)),
      iconVariant: "amber" as const,
    },
    {
      icon: Activity,
      label: s.kpiActivityRate,
      value: `${kpis.activityRate}%`,
      description: s.activePros.replace("{rate}", String(kpis.activityRate)),
      iconVariant: "default" as const,
    },
    {
      icon: CheckCircle,
      label: s.kpiCompletionRate,
      value: `${kpis.completionRate}%`,
      description: s.completedRate.replace("{rate}", String(kpis.completionRate)),
      iconVariant: "green" as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  );
}
