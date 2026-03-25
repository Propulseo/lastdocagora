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
  isLast?: boolean;
}

function Metric({ icon, label, value, delta, deltaLabel, isLast }: MetricProps) {
  const hasDelta = delta !== undefined && delta !== 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 md:px-6",
        !isLast && "sm:border-r border-border/40"
      )}
    >
      <div className="text-muted-foreground">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold leading-none tabular-nums tracking-tight">
            {value}
          </span>
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                delta! > 0
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
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
      </div>
    </div>
  );
}

export function KPIStrip({ data }: KPIStripProps) {
  const { t, todayCount, todayDelta, totalPatients, pendingCount, attendanceRate } =
    data;

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:h-20 sm:items-stretch sm:overflow-x-auto rounded-xl border border-border/40 bg-card/50">
      <Metric
        icon={<CalendarCheck className="size-4" />}
        label={t.dashboard.appointmentsToday}
        value={todayCount}
        delta={todayDelta}
        deltaLabel={t.dashboard.vsYesterday}
      />
      <Metric
        icon={<Users className="size-4" />}
        label={t.dashboard.totalPatients}
        value={totalPatients}
      />
      <Metric
        icon={<Clock className="size-4" />}
        label={t.dashboard.pending}
        value={pendingCount}
      />
      <Metric
        icon={<TrendingUp className="size-4" />}
        label={t.dashboard.attendanceRate}
        value={attendanceRate > 0 ? `${Math.round(attendanceRate)}%` : "—"}
        isLast
      />
    </div>
  );
}
