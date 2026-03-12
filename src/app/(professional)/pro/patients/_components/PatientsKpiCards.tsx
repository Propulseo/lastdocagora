"use client";

import {
  Users,
  UserPlus,
  UserCheck,
  RefreshCw,
  CalendarCheck,
  ClipboardCheck,
} from "lucide-react";
import { KPICard } from "@/components/shared/kpi-card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import type { PatientsKpi } from "../_lib/types";

interface PatientsKpiCardsProps {
  kpi: PatientsKpi;
}

export function PatientsKpiCards({ kpi }: PatientsKpiCardsProps) {
  const { t } = useProfessionalI18n();
  const pt = t.patients.kpi as Record<string, string>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KPICard
        icon={Users}
        label={pt.totalPatients}
        value={kpi.totalPatients}
        iconVariant="blue"
      />
      <KPICard
        icon={UserPlus}
        label={pt.newPatients}
        value={kpi.newPatients30d}
        iconVariant="green"
      />
      <KPICard
        icon={UserCheck}
        label={pt.activePatients}
        value={kpi.activePatients}
        iconVariant="green"
      />
      <KPICard
        icon={RefreshCw}
        label={pt.retentionRate}
        value={`${kpi.retentionRate}%`}
        iconVariant="amber"
      />
      <KPICard
        icon={CalendarCheck}
        label={pt.avgAppointments}
        value={kpi.avgAppointmentsPerPatient}
        iconVariant="blue"
      />
      <KPICard
        icon={ClipboardCheck}
        label={pt.attendanceRate}
        value={
          kpi.attendanceTotal > 0 ? `${kpi.attendanceRate}%` : "-"
        }
        description={
          kpi.attendanceTotal === 0 ? pt.noAttendanceData : undefined
        }
        iconVariant={kpi.attendanceRate >= 80 ? "green" : "red"}
      />
    </div>
  );
}
