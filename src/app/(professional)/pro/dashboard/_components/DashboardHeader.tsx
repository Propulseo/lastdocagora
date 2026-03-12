"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarPlus, X, ArrowRight } from "lucide-react";
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
        <div className="mb-4 flex h-9 items-center justify-between rounded-lg bg-amber-500/15 px-4">
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

      {/* Header row - max 64px */}
      <div className="flex h-16 items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{greeting}</h1>
          <p className="text-[13px] capitalize text-muted-foreground">
            {formattedDate}
          </p>
        </div>
        <Button size="sm" asChild className="gap-1.5">
          <Link href="/pro/agenda">
            <CalendarPlus className="size-3.5" />
            {t.dashboard.newAppointment}
          </Link>
        </Button>
      </div>
    </div>
  );
}
