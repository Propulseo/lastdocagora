"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, UserCheck, XCircle, Banknote, UserPlus, Users } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { TrendsChart, type TrendPoint } from "./TrendsChart";
import { RevenueChart, type RevenueTrendPoint } from "./StatsCharts";
import { HeatmapChart, type HeatmapCell } from "./HeatmapChart";
import { ServiceBreakdownChart, type ServiceStat } from "./ServiceBreakdownChart";
import { ChannelChart, type ChannelStat } from "./ChannelChart";
import { PunctualityChart, type PunctualityData } from "./PunctualityChart";
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
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`${RADIUS.element} p-2 ${bg}`}>
          <Icon className={`size-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
