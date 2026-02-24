"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { StatsFiltersBar } from "./StatsFiltersBar";
import { KpiCards, type KpiData } from "./KpiCards";
import { TrendsChart, type TrendPoint } from "./TrendsChart";
import { HeatmapChart, type HeatmapCell } from "./HeatmapChart";
import {
  ServiceBreakdownChart,
  type ServiceStat,
} from "./ServiceBreakdownChart";
import { ChannelChart, type ChannelStat } from "./ChannelChart";
import { PunctualityChart, type PunctualityData } from "./PunctualityChart";
import { RetentionCard, type RetentionData } from "./RetentionCard";
import { InsightsTable, type Insight } from "./InsightsTable";

interface ServiceOption {
  id: string;
  name: string;
}

export interface DashboardData {
  kpi: KpiData;
  trends: TrendPoint[];
  heatmap: HeatmapCell[];
  serviceBreakdown: ServiceStat[];
  channels: ChannelStat[];
  punctuality: PunctualityData;
  retention: RetentionData;
  insights: Insight[];
  filters: {
    range: string;
    service: string;
    channel: string;
    services: ServiceOption[];
  };
}

export function StatisticsClient({ data }: { data: DashboardData }) {
  const { t } = useProfessionalI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.statistics.title}
        description={t.statistics.description}
        action={
          <Suspense>
            <StatsFiltersBar
              services={data.filters.services}
              currentRange={data.filters.range}
              currentService={data.filters.service}
              currentChannel={data.filters.channel}
            />
          </Suspense>
        }
      />

      {/* A) KPI Cards */}
      <KpiCards data={data.kpi} />

      {/* B) Trends - full width */}
      <TrendsChart data={data.trends} />

      {/* C) Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HeatmapChart data={data.heatmap} />
        <ServiceBreakdownChart data={data.serviceBreakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChannelChart data={data.channels} />
        <PunctualityChart data={data.punctuality} />
      </div>

      {/* D) Retention */}
      <RetentionCard data={data.retention} />

      {/* E) Insights */}
      <InsightsTable insights={data.insights} />
    </div>
  );
}
