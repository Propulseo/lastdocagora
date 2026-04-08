"use client";

import {
  Briefcase,
  CheckCircle2,
  Euro,
  TrendingUp,
  Star,
  Clock,
} from "lucide-react";
import { KPICard } from "@/components/shared/kpi-card";
import { cn } from "@/lib/utils";
import { RADIUS, SHADOW, SPACING } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { getServiceName } from "@/lib/get-service-name";
import type { ServicesKpi } from "../_lib/types";

interface ServicesKpiCardsProps {
  kpi: ServicesKpi;
}

const cardClass = cn("h-24", SPACING.card_sm, RADIUS.card, SHADOW.card);

export function ServicesKpiCards({ kpi }: ServicesKpiCardsProps) {
  const { t, locale } = useProfessionalI18n();
  const sk = t.services.kpi as Record<string, string>;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <KPICard
        icon={Briefcase}
        label={sk.totalServices}
        value={kpi.totalServices}
        iconVariant="blue"
        className={cardClass}
      />
      <KPICard
        icon={CheckCircle2}
        label={sk.activeServices}
        value={kpi.activeServices}
        description={
          sk.activeDesc
            ?.replace("{count}", String(kpi.activeServices))
            .replace("{total}", String(kpi.totalServices))
        }
        iconVariant="green"
        className={cardClass}
      />
      <KPICard
        icon={Euro}
        label={sk.avgPrice}
        value={kpi.avgPrice > 0 ? `${kpi.avgPrice}\u00a0\u20ac` : "\u2014"}
        iconVariant="amber"
        className={cardClass}
      />
      <KPICard
        icon={TrendingUp}
        label={sk.totalRevenue}
        value={kpi.totalRevenue > 0 ? `${kpi.totalRevenue}\u00a0\u20ac` : "\u2014"}
        iconVariant="green"
        className={cardClass}
      />
      <KPICard
        icon={Star}
        label={sk.mostPopular}
        value={kpi.mostPopularService ? getServiceName(kpi.mostPopularService, locale) : "\u2014"}
        iconVariant="blue"
        className={cardClass}
      />
      <KPICard
        icon={Clock}
        label={sk.avgDuration}
        value={kpi.avgDuration > 0 ? `${kpi.avgDuration} min` : "\u2014"}
        iconVariant="default"
        className={cardClass}
      />
    </div>
  );
}
