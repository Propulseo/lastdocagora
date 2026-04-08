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
import { SHADOW, RADIUS, TYPE, SPACING } from "@/lib/design-tokens";
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
    <div className="flex flex-col gap-4">
      {/* Weekly sparkline card */}
      <div className={cn("overflow-hidden border border-border/40 bg-card", RADIUS.card, SHADOW.card)}>
        <div className="px-4 pt-4 pb-2">
          <h3 className={TYPE.card_title}>{t.dashboard.weeklyActivity}</h3>
        </div>

        <div className="h-20 px-2 sm:h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.623 0.214 259)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="oklch(0.623 0.214 259)" stopOpacity={0.02} />
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
                    <div className={cn(RADIUS.element, "border border-border/60 bg-popover px-3 py-1.5 text-xs shadow-md")}>
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
        <div className="flex items-center gap-1.5 border-t border-border/20 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            {t.dashboard.appointmentsThisWeek.replace(
              "{count}",
              String(thisWeekCount)
            )}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>
            {t.dashboard.vsLastWeek.replace(
              "{count}",
              String(lastWeekCount)
            )}
          </span>
          {weekDelta !== 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-semibold",
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
      <div className={cn("flex flex-1 flex-col overflow-hidden border border-border/40 bg-card", RADIUS.card, SHADOW.card)}>
        <div className="px-4 pt-4 pb-1">
          <h3 className={TYPE.card_title}>
            {t.dashboard.upcomingAppointments}
          </h3>
        </div>

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
          <div className="space-y-0.5 px-2 py-2">
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
                  href={`/pro/agenda?date=${apt.appointment_date}&appointmentId=${apt.id}&view=day`}
                  className={cn("group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-all duration-150 hover:bg-accent/50")}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold uppercase text-primary ring-1 ring-primary/10">
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
