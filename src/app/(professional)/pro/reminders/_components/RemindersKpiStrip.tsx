"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KPICard } from "@/components/shared/kpi-card";
import {
  Send,
  CheckCircle2,
  TrendingDown,
  Bell,
  FileText,
} from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import type { RemindersKpiData } from "../_types/reminders";

interface RemindersKpiStripProps {
  kpiData: RemindersKpiData;
  deliverabilityRate: string;
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

const cardClass = "min-h-24 p-4";

export function RemindersKpiStrip({
  kpiData,
  deliverabilityRate,
  t,
}: RemindersKpiStripProps) {
  const kpiLabels = t.reminders.kpi as Record<string, string>;

  const rulesDesc = kpiLabels.rulesDesc
    ?.replace("{count}", String(kpiData.activeRulesCount))
    .replace("{total}", String(kpiData.totalRulesCount));

  const templatesDesc = kpiLabels.templatesDesc?.replace(
    "{count}",
    String(kpiData.ownTemplatesCount),
  );

  return (
    <div className="flex gap-4 overflow-x-auto flex-nowrap pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KPICard
        icon={Send}
        label={kpiLabels.sentThisMonth}
        value={kpiData.sentThisMonth}
        iconVariant="blue"
        className={cardClass}
      />

      {deliverabilityRate === "\u2014" ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-full">
              <KPICard
                icon={CheckCircle2}
                label={kpiLabels.deliverability}
                value={deliverabilityRate}
                iconVariant="green"
                className={`${cardClass} h-full`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{kpiLabels.noData}</TooltipContent>
        </Tooltip>
      ) : (
        <KPICard
          icon={CheckCircle2}
          label={kpiLabels.deliverability}
          value={deliverabilityRate}
          iconVariant="green"
          className={cardClass}
        />
      )}

      {kpiData.noShowReduction !== null ? (
        <KPICard
          icon={TrendingDown}
          label={kpiLabels.noShowReduction}
          value={`${kpiData.noShowReduction}%`}
          iconVariant="amber"
          trend={kpiData.noShowReduction > 0 ? "up" : "neutral"}
          className={cardClass}
        />
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="h-full">
              <KPICard
                icon={TrendingDown}
                label={kpiLabels.noShowReduction}
                value={"\u2014"}
                iconVariant="amber"
                className={`${cardClass} h-full`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>{kpiLabels.comingSoon}</TooltipContent>
        </Tooltip>
      )}

      <KPICard
        icon={Bell}
        label={kpiLabels.activeRules}
        value={kpiData.activeRulesCount}
        description={rulesDesc}
        iconVariant="blue"
        className={cardClass}
      />

      <KPICard
        icon={FileText}
        label={kpiLabels.activeTemplates}
        value={kpiData.activeTemplatesCount}
        description={templatesDesc}
        iconVariant="green"
        className={cardClass}
      />

      {/* Placeholder 6th card - avg delivery time not available yet */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-full">
            <KPICard
              icon={Send}
              label={kpiLabels.avgDeliveryTime}
              value={"\u2014"}
              iconVariant="default"
              className={`${cardClass} h-full`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>{kpiLabels.comingSoon}</TooltipContent>
      </Tooltip>
    </div>
  );
}
