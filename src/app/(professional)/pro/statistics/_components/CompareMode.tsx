"use client";

import { useEffect } from "react";
import {
  CalendarCheck,
  Banknote,
  UserPlus,
  UserCheck,
  ArrowRightLeft,
} from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { useCompareData } from "../_lib/useStatsData";
import { computeDelta, formatCurrency } from "../_lib/compare-utils";
import { CompareChart, type ComparePoint } from "./StatsCharts";
import { InsightsPanel } from "./InsightsPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { PeriodSelector, usePresetLabels } from "./ComparePeriodSelector";
import { CompareKpiCard } from "./CompareKpiCard";

export function CompareMode() {
  const { t, locale } = useProfessionalI18n();
  const labels = usePresetLabels();
  const {
    presetA, presetB, dataA, dataB, loading,
    setPresetA, setPresetB, fetchBothPeriods,
  } = useCompareData();

  useEffect(() => {
    fetchBothPeriods("this-month", "last-month");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData: ComparePoint[] = [];
  if (dataA && dataB) {
    const mapA = new Map(dataA.dailyData.map((d) => [d.day, d.count]));
    const mapB = new Map(dataB.dailyData.map((d) => [d.day, d.count]));
    const allDays = new Set([...mapA.keys(), ...mapB.keys()]);
    for (const day of Array.from(allDays).sort((a, b) => a - b)) {
      chartData.push({ day, countA: mapA.get(day) ?? 0, countB: mapB.get(day) ?? 0 });
    }
  }

  if (loading || !dataA || !dataB) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[360px] w-full rounded-lg" />
      </div>
    );
  }

  const kpis = [
    {
      label: t.statistics.kpi.totalAppointments,
      valueA: String(dataA.appointments),
      valueB: String(dataB.appointments),
      delta: computeDelta(dataA.appointments, dataB.appointments),
      icon: CalendarCheck,
    },
    {
      label: t.statistics.analyze?.totalRevenue ?? "Receitas",
      valueA: formatCurrency(dataA.revenue, locale),
      valueB: formatCurrency(dataB.revenue, locale),
      delta: computeDelta(dataA.revenue, dataB.revenue),
      icon: Banknote,
    },
    {
      label: t.statistics.kpi.newPatients,
      valueA: String(dataA.newPatients),
      valueB: String(dataB.newPatients),
      delta: computeDelta(dataA.newPatients, dataB.newPatients),
      icon: UserPlus,
    },
    {
      label: t.statistics.kpi.attendanceRate,
      valueA: `${dataA.attendanceRate}%`,
      valueB: `${dataB.attendanceRate}%`,
      delta: dataA.attendanceRate - dataB.attendanceRate,
      icon: UserCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <PeriodSelector
          label={t.statistics.compare?.periodA ?? "Periodo A"}
          color="bg-emerald-500"
          borderColor="border-l-emerald-500"
          value={presetA}
          onChange={setPresetA}
          labels={labels}
        />
        <div className="hidden items-center sm:flex">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <ArrowRightLeft className="size-3.5 text-muted-foreground" />
          </div>
        </div>
        <PeriodSelector
          label={t.statistics.compare?.periodB ?? "Periodo B"}
          color="bg-blue-500"
          borderColor="border-l-blue-500"
          value={presetB}
          onChange={setPresetB}
          labels={labels}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <CompareKpiCard
            key={kpi.label}
            {...kpi}
            colorA="bg-emerald-500"
            colorB="bg-blue-500"
            labelCurrent={t.statistics.compare?.current ?? "atual"}
            labelRef={t.statistics.compare?.reference ?? "ref."}
          />
        ))}
      </div>

      <CompareChart
        data={chartData}
        title={t.statistics.compare?.evolution ?? "Evolucao comparativa"}
        labelA={labels[presetA]}
        labelB={labels[presetB]}
        dayLabel={t.statistics.compare?.dayLabel ?? "Dia"}
      />

      <InsightsPanel dataA={dataA} dataB={dataB} />
    </div>
  );
}
