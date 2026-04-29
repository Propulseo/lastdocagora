"use client";

import Link from "next/link";
import { Clock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS, TYPE, SPACING } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import type { DashboardData } from "../_hooks/useDashboardData";

interface NextSlotsWidgetProps {
  data: DashboardData;
}

export function NextSlotsWidget({ data }: NextSlotsWidgetProps) {
  const { t, nextAvailableSlot } = data;

  return (
    <div className={cn("border border-border/40 bg-card", RADIUS.card, SHADOW.card, SPACING.card_sm)}>
      <div className="flex items-center gap-2.5">
        <div className={cn("flex size-8 items-center justify-center bg-amber-500/10", RADIUS.element)}>
          <Clock className="size-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className={TYPE.card_title}>{t.dashboard.nextSlot}</h3>
      </div>

      {nextAvailableSlot ? (
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <span className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {nextAvailableSlot.slice(0, 5)}
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs min-h-[44px] w-full sm:w-auto"
            asChild
          >
            <Link href="/pro/agenda">
              <UserPlus className="size-3" />
              {t.dashboard.registerWalkIn}
            </Link>
          </Button>
        </div>
      ) : (
        <p className="mt-2.5 text-xs text-muted-foreground">
          {t.dashboard.noAvailableSlots}
        </p>
      )}
    </div>
  );
}
