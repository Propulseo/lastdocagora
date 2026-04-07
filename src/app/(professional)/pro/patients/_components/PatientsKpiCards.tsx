"use client";

import type { LucideIcon } from "lucide-react";
import {
  Users,
  UserPlus,
  UserCheck,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import type { PatientsKpi } from "../_lib/types";

/* ------------------------------------------------------------------ */
/*  Accent styles per card variant                                     */
/* ------------------------------------------------------------------ */
const variants = {
  blue: {
    border: "border-l-blue-500",
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  green: {
    border: "border-l-emerald-500",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    border: "border-l-amber-500",
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  red: {
    border: "border-l-red-500",
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  muted: {
    border: "border-l-muted-foreground/30",
    icon: "bg-muted text-muted-foreground",
  },
} as const;

type Variant = keyof typeof variants;

/* ------------------------------------------------------------------ */
/*  Single KPI tile                                                    */
/* ------------------------------------------------------------------ */
function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  variant = "blue",
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  variant?: Variant;
  className?: string;
}) {
  const v = variants[variant];
  return (
    <div
      className={cn(
        "bg-card text-card-foreground relative rounded-xl border border-l-[3px] p-4 shadow-sm transition-shadow hover:shadow-md",
        v.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {label}
          </p>
          <p
            className="text-2xl font-bold tabular-nums tracking-tight truncate"
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </p>
          {sub && (
            <p className="text-muted-foreground text-[11px] leading-tight">
              {sub}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            v.icon
          )}
        >
          <Icon className="size-[18px]" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI grid                                                           */
/* ------------------------------------------------------------------ */
interface PatientsKpiCardsProps {
  kpi: PatientsKpi;
}

export function PatientsKpiCards({ kpi }: PatientsKpiCardsProps) {
  const { t } = useProfessionalI18n();
  const pt = t.patients.kpi as Record<string, string>;

  const hasAttendance = kpi.attendanceTotal > 0;
  const attendanceVariant: Variant =
    !hasAttendance ? "muted" : kpi.attendanceRate >= 80 ? "green" : "red";

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiTile
        icon={Users}
        label={pt.totalPatients}
        value={kpi.totalPatients}
        variant="blue"
      />
      <KpiTile
        icon={UserPlus}
        label={pt.newPatients}
        value={kpi.newPatients30d}
        variant="green"
      />
      <KpiTile
        icon={UserCheck}
        label={pt.activePatients}
        value={kpi.activePatients}
        variant="green"
      />
      <KpiTile
        icon={RefreshCw}
        label={pt.retentionRate}
        value={`${kpi.retentionRate}%`}
        variant="amber"
      />
      <KpiTile
        icon={ClipboardCheck}
        label={pt.attendanceRate}
        value={hasAttendance ? `${kpi.attendanceRate}%` : "-"}
        sub={!hasAttendance ? pt.noAttendanceData : undefined}
        variant={attendanceVariant}
      />
    </div>
  );
}
