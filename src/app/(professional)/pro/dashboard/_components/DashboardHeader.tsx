"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { RADIUS, TYPE } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { CalendarPlus, X, ArrowRight, Sparkles } from "lucide-react";
import type { DashboardData } from "../_hooks/useDashboardData";

interface DashboardHeaderProps {
  data: DashboardData;
}

export function DashboardHeader({ data }: DashboardHeaderProps) {
  const {
    t,
    firstName,
    formattedDate,
    onboardingCompleted,
    profileBannerDismissed,
    setProfileBannerDismissed,
  } = data;

  const greeting = t.dashboard.greeting.replace("{name}", firstName || "");

  return (
    <div className="space-y-0">
      {/* Profile incomplete banner */}
      {!onboardingCompleted && !profileBannerDismissed && (
        <div className={cn("mb-4 flex h-9 items-center justify-between bg-amber-500/15 px-4", RADIUS.element)}>
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <span className="font-medium">{t.dashboard.profileIncomplete}</span>
            <span className="text-amber-400/70">
              — {t.dashboard.profileIncompleteMessage}
            </span>
            <Link
              href="/pro/profile"
              className="ml-1 inline-flex items-center gap-1 font-medium text-amber-300 underline underline-offset-2 hover:text-amber-200"
            >
              {t.dashboard.completeProfile}
              <ArrowRight className="size-3" />
            </Link>
          </div>
          <button
            onClick={() => setProfileBannerDismissed(true)}
            className="text-amber-400/60 hover:text-amber-300"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-end justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={cn(TYPE.page_title, "text-[26px]")}>{greeting}</h1>
            <Sparkles className="size-5 text-amber-400/70" />
          </div>
          <p className="mt-1 text-sm capitalize text-muted-foreground/80">
            {formattedDate}
          </p>
        </div>
        <Button size="sm" asChild className="gap-1.5 shadow-sm">
          <Link href="/pro/agenda">
            <CalendarPlus className="size-3.5" />
            {t.dashboard.newAppointment}
          </Link>
        </Button>
      </div>
    </div>
  );
}
