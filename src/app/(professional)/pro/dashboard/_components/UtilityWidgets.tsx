"use client";

import Link from "next/link";
import { Bell, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardData } from "../_hooks/useDashboardData";
import { NextSlotsWidget } from "./NextSlotsWidget";

interface UtilityWidgetsProps {
  data: DashboardData;
}

/* ─── SVG Gauge ─── */
function NoShowGauge({
  rate,
  color,
  zeroLabel,
  countLabel,
}: {
  rate: number;
  color: "emerald" | "amber" | "red";
  zeroLabel: string;
  countLabel: string;
}) {
  const radius = 36;
  const strokeW = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(rate, 100) / 100;
  const offset = circumference * (1 - progress);

  const strokeColor = {
    emerald: "stroke-emerald-500",
    amber: "stroke-amber-500",
    red: "stroke-red-500",
  }[color];

  const textColor = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
  }[color];

  const isZero = rate === 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-28">
        <svg viewBox="0 0 80 80" className="size-full -rotate-90">
          {/* Background track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth={strokeW}
            className="stroke-muted/20"
          />
          {/* Value arc */}
          {!isZero && (
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn("transition-all duration-700", strokeColor)}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xl font-bold tabular-nums", textColor)}>
            {Math.round(rate)}%
          </span>
        </div>
      </div>
      {/* Label under gauge */}
      <span className={cn("text-[11px] font-medium", isZero ? "text-emerald-400" : textColor)}>
        {isZero ? zeroLabel : countLabel}
      </span>
    </div>
  );
}

export function UtilityWidgets({ data }: UtilityWidgetsProps) {
  const { t, unconfirmedNext24h, recentPatients, noShowRate, noShowColor } = data;

  const dateLocale = t.common.dateLocale as string;

  // Build the count label with actual no-show count
  const monthAppts = data.todayAppointments; // We don't have raw month data here
  const noShowCountLabel = t.dashboard.noShowCount
    ? t.dashboard.noShowCount.replace("{count}", String(Math.round(noShowRate)))
    : `${Math.round(noShowRate)}%`;

  return (
    <div className="flex flex-col gap-4">
      {/* Next available slot widget */}
      <NextSlotsWidget data={data} />

      {/* Reminders widget */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{t.dashboard.remindersToSend}</h3>
        </div>

        {unconfirmedNext24h > 0 ? (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.dashboard.unconfirmedNext24h.replace(
                "{count}",
                String(unconfirmedNext24h)
              )}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3 w-full gap-1.5 text-xs"
              asChild
            >
              <Link href="/pro/reminders">
                <Send className="size-3" />
                {t.dashboard.sendReminders}
              </Link>
            </Button>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            {t.dashboard.noReminders}
          </p>
        )}
      </div>

      {/* Recent patients widget */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-4">
        <h3 className="text-sm font-semibold">{t.dashboard.recentPatients}</h3>

        {recentPatients.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t.dashboard.noRecentPatients}
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {recentPatients.map((p) => {
              const initial =
                (p.firstName?.[0] ?? "") + (p.lastName?.[0] ?? "");
              const visitDate = new Date(p.lastVisit).toLocaleDateString(
                dateLocale,
                { day: "numeric", month: "short" }
              );
              return (
                <Link
                  key={p.id}
                  href="/pro/patients"
                  className="group flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-accent/50"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold uppercase text-primary">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.dashboard.lastVisit}: {visitDate}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* No-show gauge widget — flex-1 to fill remaining space */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border/40 bg-card/50 p-4">
        <h3 className="mb-3 self-start text-sm font-semibold">
          {t.dashboard.noShowThisMonth}
        </h3>
        <div className="flex flex-1 items-center">
          <NoShowGauge
            rate={noShowRate}
            color={noShowColor}
            zeroLabel={t.dashboard.noShowZero}
            countLabel={noShowCountLabel}
          />
        </div>
      </div>
    </div>
  );
}
