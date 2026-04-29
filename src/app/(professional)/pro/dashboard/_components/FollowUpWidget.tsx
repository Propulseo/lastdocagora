"use client";

import Link from "next/link";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS, TYPE, SPACING } from "@/lib/design-tokens";
import type { DashboardData } from "../_hooks/useDashboardData";

interface FollowUpWidgetProps {
  data: DashboardData;
}

export function FollowUpWidget({ data }: FollowUpWidgetProps) {
  const { t, followUps } = data;
  const dateLocale = t.common.dateLocale as string;
  const todayStr = new Date().toISOString().split("T")[0];

  if (!followUps || followUps.length === 0) {
    return (
      <div
        className={cn(
          "border border-border/40 bg-card",
          RADIUS.card,
          SHADOW.card,
          SPACING.card_sm,
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex size-8 items-center justify-center bg-amber-500/10",
              RADIUS.element,
            )}
          >
            <CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className={TYPE.card_title}>{t.dashboard.suggestedFollowUps}</h3>
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground">
          {t.dashboard.noFollowUps}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border border-border/40 bg-card",
        RADIUS.card,
        SHADOW.card,
        SPACING.card_sm,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex size-8 items-center justify-center bg-amber-500/10",
            RADIUS.element,
          )}
        >
          <CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className={TYPE.card_title}>{t.dashboard.suggestedFollowUps}</h3>
      </div>

      <div className="mt-3 space-y-1">
        {followUps.slice(0, 5).map((item) => {
          const isOverdue = item.followUpDate < todayStr;
          const formattedDate = new Date(
            item.followUpDate + "T00:00:00",
          ).toLocaleDateString(dateLocale, {
            day: "numeric",
            month: "short",
          });

          return (
            <Link
              key={item.noteId}
              href="/pro/patients"
              className="group flex items-center gap-3 rounded-xl px-1.5 py-1.5 transition-all duration-150 hover:bg-accent/50 active:scale-[0.98]"
            >
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/10">
                {(item.patientFirstName?.[0] ?? "") +
                  (item.patientLastName?.[0] ?? "")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.patientFirstName} {item.patientLastName}
                </p>
                <p
                  className={cn(
                    "flex items-center gap-1 text-[10px]",
                    isOverdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                  )}
                >
                  {isOverdue && <AlertTriangle className="size-2.5" />}
                  {isOverdue
                    ? t.dashboard.followUpOverdue
                    : t.dashboard.followUpDue?.replace("{date}", formattedDate)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
