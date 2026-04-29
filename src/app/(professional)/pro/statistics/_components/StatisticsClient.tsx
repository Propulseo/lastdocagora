"use client";

import { Suspense, useState } from "react";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { cn } from "@/lib/utils";
import { RADIUS, TYPE } from "@/lib/design-tokens";
import { StatsFiltersBar } from "./StatsFiltersBar";
import { YearNavigator } from "./YearNavigator";
import type { KpiData } from "./KpiCards";
import type { TrendPoint } from "./TrendsChart";
import type { RevenueTrendPoint } from "./StatsCharts";
import { AnalyzeMode } from "./AnalyzeMode";
import { CompareMode } from "./CompareMode";
import { EmptyKpiState } from "./EmptyKpiState";
import { CalendarX2 } from "lucide-react";

// Keep old chart types for backward compat
import type { HeatmapCell } from "./HeatmapChart";
import type { ServiceStat } from "./ServiceBreakdownChart";
import type { ChannelStat } from "./ChannelChart";
import type { PunctualityData } from "./PunctualityChart";
import type { Insight } from "./InsightsTable";

interface ServiceOption { id: string; name: string }

export type StatsMode = "analyze" | "compare";

export interface DashboardData {
  kpi: KpiData;
  trends: TrendPoint[];
  heatmap: HeatmapCell[];
  serviceBreakdown: ServiceStat[];
  channels: ChannelStat[];
  punctuality: PunctualityData;
  insights: Insight[];
  revenueTrends: RevenueTrendPoint[];
  totalRevenue: number;
  filters: {
    range: string;
    service: string;
    channel: string;
    services: ServiceOption[];
  };
  yearNav: {
    selectedYear: number;
    minYear: number;
    maxYear: number;
  };
}

export function StatisticsClient({ data }: { data: DashboardData }) {
  const { t } = useProfessionalI18n();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<StatsMode>("analyze");

  const hasData = data.kpi.totalAppointments > 0;

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("range")) params.set("range", "30d");
    window.open(`/pro/statistics/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── Header: title + mode toggle + export ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className={cn(TYPE.page_title, "text-xl sm:text-2xl")}>{t.statistics.title}</h1>
          <p className="mt-0.5 hidden text-sm leading-relaxed text-muted-foreground sm:mt-1 sm:block">
            {t.statistics.description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className={`inline-flex items-center ${RADIUS.sm} bg-muted p-0.5`}>
            <button
              onClick={() => setMode("analyze")}
              className={cn(
                `${RADIUS.sm} px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm`,
                mode === "analyze"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.statistics.analyze?.label ?? "Analyser"}
            </button>
            <button
              onClick={() => setMode("compare")}
              className={cn(
                `${RADIUS.sm} px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm`,
                mode === "compare"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.statistics.compare?.label ?? "Comparer"}
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="size-4" />
            <span className="hidden sm:inline">{t.statistics.export}</span>
          </Button>
        </div>
      </div>

      {/* ── Filters bar (analyze mode) ── */}
      {mode === "analyze" && (
        <Suspense>
          <StatsFiltersBar
            yearNavigator={
              <Suspense>
                <YearNavigator
                  selectedYear={data.yearNav.selectedYear}
                  minYear={data.yearNav.minYear}
                  maxYear={data.yearNav.maxYear}
                />
              </Suspense>
            }
            services={data.filters.services}
            currentRange={data.filters.range}
            currentService={data.filters.service}
            currentChannel={data.filters.channel}
          />
        </Suspense>
      )}

      {/* ── Content ── */}
      {mode === "analyze" ? (
        !hasData ? (
          <EmptyKpiState
            icon={CalendarX2}
            title={t.statistics.emptyState.noDataForYear.replace(
              "{year}",
              String(data.yearNav.selectedYear),
            )}
            description={t.statistics.emptyState.tryLongerPeriod}
            ctaLabel={t.statistics.kpi.goToAgenda}
            ctaHref="/pro/agenda"
          />
        ) : (
          <AnalyzeMode
            kpi={data.kpi}
            trends={data.trends}
            heatmap={data.heatmap}
            serviceBreakdown={data.serviceBreakdown}
            channels={data.channels}
            punctuality={data.punctuality}
            revenueTrends={data.revenueTrends}
            totalRevenue={data.totalRevenue}
          />
        )
      ) : (
        <CompareMode />
      )}
    </div>
  );
}
