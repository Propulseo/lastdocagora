"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, UserCheck, XCircle, Banknote, UserPlus, Users } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import type { TrendPoint } from "./TrendsChart";
import type { RevenueTrendPoint } from "./StatsCharts";
import type { HeatmapCell } from "./HeatmapChart";
import type { ServiceStat } from "./ServiceBreakdownChart";
import type { ChannelStat } from "./ChannelChart";
import type { PunctualityData } from "./PunctualityChart";
const ChartSkeleton = () => <Skeleton className="h-64 w-full rounded-xl" />;
const TrendsChart = dynamic(() => import("./TrendsChart").then(m => m.TrendsChart), { ssr: false, loading: ChartSkeleton });
const RevenueChart = dynamic(() => import("./StatsCharts").then(m => m.RevenueChart), { ssr: false, loading: ChartSkeleton });
const HeatmapChart = dynamic(() => import("./HeatmapChart").then(m => m.HeatmapChart), { ssr: false, loading: ChartSkeleton });
const ServiceBreakdownChart = dynamic(() => import("./ServiceBreakdownChart").then(m => m.ServiceBreakdownChart), { ssr: false, loading: ChartSkeleton });
const ChannelChart = dynamic(() => import("./ChannelChart").then(m => m.ChannelChart), { ssr: false, loading: ChartSkeleton });
const PunctualityChart = dynamic(() => import("./PunctualityChart").then(m => m.PunctualityChart), { ssr: false, loading: ChartSkeleton });
import type { KpiData } from "./KpiCards";
import { formatCurrency } from "../_lib/compare-utils";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

// ---------------------------------------------------------------------------
// Mini KPI card used inside tabs
// ---------------------------------------------------------------------------

interface MiniKpiProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function MiniKpi({ label, value, icon: Icon, color, bg }: MiniKpiProps) {
  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardContent className="p-2 sm:p-4">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
          <div className={`${RADIUS.element} p-1 sm:p-2 ${bg}`}>
            <Icon className={`size-3 sm:size-5 ${color}`} />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="text-lg font-bold leading-tight tracking-tight sm:order-2 sm:text-xl">{value}</p>
            <p className="line-clamp-2 text-[10px] leading-tight text-muted-foreground sm:order-1 sm:text-xs">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AnalyzeMode
// ---------------------------------------------------------------------------

interface AnalyzeModeProps {
  kpi: KpiData;
  trends: TrendPoint[];
  heatmap: HeatmapCell[];
  serviceBreakdown: ServiceStat[];
  channels: ChannelStat[];
  punctuality: PunctualityData;
  revenueTrends: RevenueTrendPoint[];
  totalRevenue: number;
}

export function AnalyzeMode({ kpi, trends, heatmap, serviceBreakdown, channels, punctuality, revenueTrends, totalRevenue }: AnalyzeModeProps) {
  const { t, locale } = useProfessionalI18n();

  const avgRevenue =
    kpi.totalAppointments > 0
      ? Math.round(totalRevenue / kpi.totalAppointments)
      : 0;

  return (
    <Tabs defaultValue="appointments" className="space-y-4">
      <TabsList>
        <TabsTrigger value="appointments">
          {t.statistics.analyze?.tabAppointments ?? "Consultas"}
        </TabsTrigger>
        <TabsTrigger value="performance">
          {t.statistics.analyze?.tabPerformance ?? "Desempenho"}
        </TabsTrigger>
      </TabsList>

      {/* ── Rendez-vous tab ── */}
      <TabsContent value="appointments" className="space-y-4">
        <div className="hidden sm:block">
          <TrendsChart data={trends} />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <MiniKpi
            label={t.statistics.kpi.totalAppointments}
            value={String(kpi.totalAppointments)}
            icon={CalendarCheck}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <MiniKpi
            label={t.statistics.kpi.attendanceRate}
            value={`${kpi.attendanceRate}%`}
            icon={UserCheck}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <MiniKpi
            label={t.statistics.kpi.cancellationRate}
            value={`${kpi.cancellationRate}%`}
            icon={XCircle}
            color="text-red-500"
            bg="bg-red-500/10"
          />
        </div>

        <div className="hidden sm:block">
          <HeatmapChart data={heatmap} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ServiceBreakdownChart data={serviceBreakdown} />
          <ChannelChart data={channels} />
        </div>

        <PunctualityChart data={punctuality} />
      </TabsContent>

      {/* ── Performance tab ── */}
      <TabsContent value="performance" className="space-y-4">
        <RevenueChart
          data={revenueTrends}
          title={t.statistics.analyze?.revenueTitle ?? "Evolução das receitas"}
          description={t.statistics.analyze?.revenueDesc ?? "Receitas diárias no período"}
          locale={locale}
        />
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <MiniKpi
            label={t.statistics.analyze?.totalRevenue ?? "Receitas totais"}
            value={formatCurrency(totalRevenue, locale)}
            icon={Banknote}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <MiniKpi
            label={t.statistics.analyze?.avgRevenue ?? "Receita média / consulta"}
            value={formatCurrency(avgRevenue, locale)}
            icon={Banknote}
            color="text-blue-500"
            bg="bg-blue-500/10"
          />
          <MiniKpi
            label={t.statistics.kpi.newPatients}
            value={String(kpi.newPatientsCount)}
            icon={UserPlus}
            color="text-violet-500"
            bg="bg-violet-500/10"
          />
          <MiniKpi
            label={t.statistics.analyze?.recurringPatients ?? "Pacientes recorrentes"}
            value={String(kpi.returningPatientsCount)}
            icon={Users}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
