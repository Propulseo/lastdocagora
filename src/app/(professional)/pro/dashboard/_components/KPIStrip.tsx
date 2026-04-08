"use client";

import {
  CalendarCheck,
  Users,
  Clock,
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS, TYPE } from "@/lib/design-tokens";
import type { DashboardData } from "../_hooks/useDashboardData";

interface KPIStripProps {
  data: DashboardData;
}

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  accent?: string;
  borderAccent?: string;
}

function Metric({ icon, label, value, delta, deltaLabel, accent = "bg-primary/10 text-primary", borderAccent = "border-t-primary" }: MetricProps) {
  const hasDelta = delta !== undefined && delta !== 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3.5 overflow-hidden bg-card border border-border/40",
        RADIUS.card,
        SHADOW.card,
        "p-4 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-border/60",
      )}
    >
      {/* Subtle colored top accent line */}
      <div className={cn("absolute inset-x-0 top-0 h-[2px]", borderAccent)} />

      <div className="flex items-center justify-between">
        <div className={cn("flex size-9 items-center justify-center", accent, RADIUS.element)}>{icon}</div>
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              delta! > 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {delta! > 0 ? (
              <ArrowUp className="size-2.5" />
            ) : (
              <ArrowDown className="size-2.5" />
            )}
            {delta! > 0 ? `+${delta}` : delta}
            {deltaLabel && (
              <span className="ml-0.5 hidden sm:inline">{deltaLabel}</span>
            )}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <span className={cn(TYPE.kpi_number, "leading-none tabular-nums")}>
          {value}
        </span>
        <p className={cn(TYPE.label, "mt-1.5")}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function KPIStrip({ data }: KPIStripProps) {
  const { t, todayCount, todayDelta, totalPatients, pendingCount, attendanceRate } =
    data;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric
        icon={<CalendarCheck className="size-4" />}
        label={t.dashboard.appointmentsToday}
        value={todayCount}
        delta={todayDelta}
        deltaLabel={t.dashboard.vsYesterday}
        accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        borderAccent="bg-blue-500/70"
      />
      <Metric
        icon={<Users className="size-4" />}
        label={t.dashboard.totalPatients}
        value={totalPatients}
        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        borderAccent="bg-emerald-500/70"
      />
      <Metric
        icon={<Clock className="size-4" />}
        label={t.dashboard.pending}
        value={pendingCount}
        accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        borderAccent="bg-amber-500/70"
      />
      <Metric
        icon={<TrendingUp className="size-4" />}
        label={t.dashboard.attendanceRate}
        value={attendanceRate > 0 ? `${Math.round(attendanceRate)}%` : "—"}
        accent="bg-teal-500/10 text-teal-600 dark:text-teal-400"
        borderAccent="bg-teal-500/70"
      />
    </div>
  );
}
