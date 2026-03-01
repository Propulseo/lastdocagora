"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KPICard } from "@/components/shared/kpi-card";
import { Send, CheckCircle2, TrendingDown } from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";

interface RemindersKpiStripProps {
  sentThisMonth: number;
  deliverabilityRate: string;
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

export function RemindersKpiStrip({
  sentThisMonth,
  deliverabilityRate,
  t,
}: RemindersKpiStripProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KPICard
        icon={Send}
        label={t.reminders.kpi.sentThisMonth}
        value={sentThisMonth}
        iconVariant="blue"
      />

      {deliverabilityRate === "\u2014" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <KPICard
                icon={CheckCircle2}
                label={t.reminders.kpi.deliverability}
                value={deliverabilityRate}
                iconVariant="green"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{t.reminders.kpi.noData}</TooltipContent>
        </Tooltip>
      ) : (
        <KPICard
          icon={CheckCircle2}
          label={t.reminders.kpi.deliverability}
          value={deliverabilityRate}
          iconVariant="green"
        />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <KPICard
              icon={TrendingDown}
              label={t.reminders.kpi.noShowReduction}
              value={"\u2014"}
              iconVariant="amber"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>{t.reminders.kpi.comingSoon}</TooltipContent>
      </Tooltip>
    </div>
  );
}
