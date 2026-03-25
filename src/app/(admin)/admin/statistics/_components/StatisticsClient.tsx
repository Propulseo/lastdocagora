"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { cn } from "@/lib/utils";
import { type StatisticsData, type PeriodRange, PERIOD_OPTIONS } from "../_lib/types";
import { KPIStrip } from "./KPIStrip";
import { GrowthChart } from "./GrowthChart";
import { ActivityChart } from "./ActivityChart";
import { DistributionCharts } from "./DistributionCharts";
import { TopProfessionals } from "./TopProfessionals";
import { SpecialtyChart } from "./SpecialtyChart";
import { AlertsPanel } from "./AlertsPanel";

export function StatisticsClient({ data }: { data: StatisticsData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useAdminI18n();
  const s = t.statistics;

  const periodLabels: Record<PeriodRange, string> = {
    "7d": s.period7d,
    "30d": s.period30d,
    "3m": s.period3m,
    "6m": s.period6m,
    "1y": s.period1y,
  };

  function setRange(range: PeriodRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", range);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleExport() {
    window.open(`/admin/statistics/export?range=${data.range}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.title}
        description={s.description}
        action={
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border bg-muted p-0.5 overflow-x-auto">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRange(opt)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 whitespace-nowrap",
                    data.range === opt
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {periodLabels[opt]}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex">
              <Download className="mr-1.5 size-4" />
              {s.exportCsv}
            </Button>
          </div>
        }
      />

      <KPIStrip kpis={data.kpis} />

      {/* Charts: hidden on mobile */}
      <div className="hidden sm:block">
        <GrowthChart data={data.growth} />
      </div>

      <div className="hidden sm:grid gap-6 lg:grid-cols-2">
        <ActivityChart data={data.activity} rates={data.rates} />
        <DistributionCharts proStatus={data.proStatus} bookingChannel={data.bookingChannel} />
      </div>

      <div className="hidden sm:grid gap-6 lg:grid-cols-2">
        <TopProfessionals data={data.topProfessionals} />
        <SpecialtyChart data={data.topSpecialties} />
      </div>

      {/* Mobile hint card */}
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4 sm:hidden">
        <Monitor className="size-5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">{t.mobile.fullStatsHint}</p>
      </div>

      <AlertsPanel alerts={data.alerts} />
    </div>
  );
}
