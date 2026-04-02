"use client";

import Link from "next/link";
import { Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "../_hooks/useDashboardData";

interface NextSlotsWidgetProps {
  data: DashboardData;
}

export function NextSlotsWidget({ data }: NextSlotsWidgetProps) {
  const { t, nextAvailableSlot } = data;

  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-amber-500" />
        <h3 className="text-sm font-semibold">{t.dashboard.nextSlot}</h3>
      </div>

      {nextAvailableSlot ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {nextAvailableSlot.slice(0, 5)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs"
            asChild
          >
            <Link href="/pro/agenda">
              <UserPlus className="size-3" />
              {t.dashboard.registerWalkIn}
            </Link>
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {t.dashboard.noAvailableSlots}
        </p>
      )}
    </div>
  );
}
