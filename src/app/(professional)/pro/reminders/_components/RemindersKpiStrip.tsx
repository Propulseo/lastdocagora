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

const cardClass = "min-h-24 min-w-[160px] shrink-0 snap-start p-4 sm:min-w-0 sm:shrink";

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
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 xl:grid-cols-5">
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
            <div className="min-w-[160px] shrink-0 snap-start sm:min-w-0 sm:shrink">
              <KPICard
                icon={CheckCircle2}
                label={kpiLabels.deliverability}
                value={deliverabilityRate}
                iconVariant="green"
                className="min-h-24 h-full p-4"
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

      <KPICard
        icon={Bell}
        label={kpiLabels.activeRules}
        value={kpiData.activeRulesCount}
        description={rulesDesc}
        iconVariant="violet"
        className={cardClass}
      />

      <KPICard
        icon={FileText}
        label={kpiLabels.activeTemplates}
        value={kpiData.activeTemplatesCount}
        description={templatesDesc}
        iconVariant="amber"
        className={cardClass}
      />

      {/* Placeholder 6th card - avg delivery time not available yet */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="min-w-[160px] shrink-0 sm:min-w-0 sm:shrink">
            <KPICard
              icon={Send}
              label={kpiLabels.avgDeliveryTime}
              value={"\u2014"}
              iconVariant="default"
              className="min-h-24 h-full p-4"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>{kpiLabels.comingSoon}</TooltipContent>
      </Tooltip>
    </div>
  );
}
