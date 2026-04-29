"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-5">
      {/* Header */}
      <div style={{ animation: "admin-fade-up 0.4s ease-out both" }}>
        <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{s.title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border bg-muted/50 p-0.5 overflow-x-auto">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRange(opt)}
                  className={cn(
                    "rounded-sm px-2.5 py-1 text-xs font-medium transition-all min-h-[44px] sm:min-h-0 whitespace-nowrap active:scale-95",
                    data.range === opt
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {periodLabels[opt]}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="hidden sm:flex h-8"
            >
              <Download className="mr-1.5 size-3.5" />
              {s.exportCsv}
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <KPIStrip kpis={data.kpis} />

      {/* Charts: hidden on mobile */}
      <div
        className="hidden sm:block"
        style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "160ms" }}
      >
        <GrowthChart data={data.growth} />
      </div>

      <div
        className="hidden sm:grid gap-5 lg:grid-cols-2"
        style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "240ms" }}
      >
        <ActivityChart data={data.activity} rates={data.rates} />
        <DistributionCharts proStatus={data.proStatus} bookingChannel={data.bookingChannel} />
      </div>

      <div
        className="hidden sm:grid gap-5 lg:grid-cols-2"
        style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "320ms" }}
      >
        <TopProfessionals data={data.topProfessionals} />
        <SpecialtyChart data={data.topSpecialties} />
      </div>

      {/* Mobile hint */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 sm:hidden">
        <Monitor className="size-5 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">{t.mobile.fullStatsHint}</p>
      </div>

      <div
        style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "400ms" }}
      >
        <AlertsPanel alerts={data.alerts} />
      </div>
    </div>
  );
}
