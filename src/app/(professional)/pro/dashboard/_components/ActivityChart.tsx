"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Calendar, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "../_hooks/useDashboardData";

interface ActivityChartProps {
  data: DashboardData;
}

export function ActivityChart({ data }: ActivityChartProps) {
  const {
    t,
    dailyCounts,
    thisWeekCount,
    lastWeekCount,
    weekDelta,
    upcomingAppointments,
  } = data;

  const dateLocale = t.common.dateLocale as string;

  const chartData = dailyCounts.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "EEE", { locale: undefined }),
    fullDate: new Date(d.date).toLocaleDateString(dateLocale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="hidden sm:flex flex-col gap-4">
      {/* Weekly sparkline card */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4">
        <h3 className="text-sm font-semibold">{t.dashboard.weeklyActivity}</h3>

        <div className="mt-3 h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.623 0.214 259)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.623 0.214 259)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "oklch(0.71 0.015 255)" }}
                dy={4}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof chartData)[0];
                  return (
                    <div className="rounded-lg border border-border/60 bg-popover px-3 py-1.5 text-xs shadow-md">
                      <p className="font-medium">{d.fullDate}</p>
                      <p className="text-muted-foreground">
                        {d.count} {t.dashboard.rdv}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="oklch(0.623 0.214 259)"
                strokeWidth={2}
                fill="url(#chartGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Week comparison */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>
            {t.dashboard.appointmentsThisWeek.replace(
              "{count}",
              String(thisWeekCount)
            )}
          </span>
          <span>·</span>
          <span>
            {t.dashboard.vsLastWeek.replace(
              "{count}",
              String(lastWeekCount)
            )}
          </span>
          {weekDelta !== 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                weekDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {weekDelta > 0 ? (
                <ArrowUp className="size-2.5" />
              ) : (
                <ArrowDown className="size-2.5" />
              )}
              {weekDelta > 0 ? `+${weekDelta}` : weekDelta}
            </span>
          )}
        </div>
      </div>

      {/* Upcoming appointments card — flex-1 to fill remaining height */}
      <div className="flex flex-1 flex-col rounded-xl border border-border/40 bg-card/50 p-4">
        <h3 className="text-sm font-semibold">
          {t.dashboard.upcomingAppointments}
        </h3>

        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted/40">
              <Calendar className="size-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {t.dashboard.noUpcoming}
            </p>
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs" asChild>
              <Link href="/pro/agenda">
                <CalendarPlus className="size-3" />
                {t.dashboard.planAppointment}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-2.5">
            {upcomingAppointments.map((apt) => {
              const patient = apt.patients;
              const initial =
                (patient?.first_name?.[0] ?? "") +
                (patient?.last_name?.[0] ?? "");
              const dateStr = new Date(apt.appointment_date).toLocaleDateString(
                dateLocale,
                { weekday: "short", day: "numeric", month: "short" }
              );

              return (
                <Link
                  key={apt.id}
                  href="/pro/agenda"
                  className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent/50"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold uppercase text-primary">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {patient?.first_name} {patient?.last_name}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {dateStr} · {apt.appointment_time?.slice(0, 5)} ·{" "}
                      {apt.services?.name ?? apt.consultation_type}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
