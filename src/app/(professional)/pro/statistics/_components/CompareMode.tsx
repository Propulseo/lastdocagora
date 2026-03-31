"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  CalendarIcon,
  Banknote,
  UserPlus,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRightLeft,
} from "lucide-react";
import { format } from "date-fns";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { useCompareData } from "../_lib/useStatsData";
import { computeDelta, formatCurrency, type PeriodPreset } from "../_lib/compare-utils";
import { CompareChart, type ComparePoint } from "./StatsCharts";
import { InsightsPanel } from "./InsightsPanel";
import { Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// Period preset options
// ---------------------------------------------------------------------------

const PRESETS: PeriodPreset[] = ["this-month", "last-month", "3-months", "this-year", "custom"];

function usePresetLabels() {
  const { t } = useProfessionalI18n();
  return {
    "this-month": t.statistics.compare?.thisMonth ?? "Este mês",
    "last-month": t.statistics.compare?.lastMonth ?? "Mês passado",
    "3-months": t.statistics.compare?.last3Months ?? "3 últimos meses",
    "this-year": t.statistics.compare?.thisYear ?? "Este ano",
    "custom": t.statistics.compare?.custom ?? "Período personalizado",
  } as Record<PeriodPreset, string>;
}

// ---------------------------------------------------------------------------
// Period selector card
// ---------------------------------------------------------------------------

interface PeriodSelectorProps {
  label: string;
  color: string;
  borderColor: string;
  value: PeriodPreset;
  onChange: (v: PeriodPreset, customRange?: { from: string; to: string } | null) => void;
  labels: Record<PeriodPreset, string>;
}

function PeriodSelector({ label, color, borderColor, value, onChange, labels }: PeriodSelectorProps) {
  const { t } = useProfessionalI18n();
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const handlePresetChange = (v: string) => {
    const preset = v as PeriodPreset;
    if (preset !== "custom") {
      onChange(preset);
      setCustomFrom(undefined);
      setCustomTo(undefined);
    } else {
      onChange(preset);
    }
  };

  const handleDateChange = (type: "from" | "to", date: Date | undefined) => {
    const newFrom = type === "from" ? date : customFrom;
    const newTo = type === "to" ? date : customTo;
    if (type === "from") setCustomFrom(date);
    if (type === "to") setCustomTo(date);

    if (newFrom && newTo) {
      const fromStr = newFrom.toISOString().split("T")[0];
      const toStr = newTo.toISOString().split("T")[0];
      onChange("custom", { from: fromStr, to: toStr });
    }
  };

  return (
    <Card className={`flex-1 border-l-[3px] ${borderColor}`}>
      <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <span className={`inline-block size-2.5 shrink-0 rounded-full ${color}`} />
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <Select value={value} onValueChange={handlePresetChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p} value={p}>{labels[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {value === "custom" && (
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="size-3.5" />
                  {customFrom ? format(customFrom, "dd/MM/yyyy") : (t.statistics.compare?.startDate ?? "Inicio")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={(d) => handleDateChange("from", d)} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="size-3.5" />
                  {customTo ? format(customTo, "dd/MM/yyyy") : (t.statistics.compare?.endDate ?? "Fim")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={(d) => handleDateChange("to", d)} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compare KPI card (redesigned)
// ---------------------------------------------------------------------------

interface CompareKpiProps {
  label: string;
  valueA: string;
  valueB: string;
  delta: number;
  icon: React.ElementType;
  colorA: string;
  colorB: string;
  labelCurrent: string;
  labelRef: string;
}

function CompareKpi({ label, valueA, valueB, delta, icon: Icon, colorA, colorB, labelCurrent, labelRef }: CompareKpiProps) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>

        {/* Values side by side */}
        <div className="grid grid-cols-2 divide-x">
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${colorA}`} />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {labelCurrent}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight">{valueA}</p>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${colorB}`} />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {labelRef}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-muted-foreground">{valueB}</p>
          </div>
        </div>

        {/* Delta bar */}
        <div
          className={`flex items-center justify-center gap-1.5 px-4 py-2 ${
            isNeutral
              ? "bg-muted/50 text-muted-foreground"
              : isPositive
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600"
          }`}
        >
          {isNeutral ? (
            <Minus className="size-3.5" />
          ) : isPositive ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          <span className="text-sm font-semibold">
            {isNeutral ? "0%" : `${isPositive ? "+" : ""}${delta}%`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CompareMode
// ---------------------------------------------------------------------------

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

  // Build compare chart data (merge daily data by day-of-month)
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
      {/* Period selectors — two side-by-side cards */}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <PeriodSelector
          label={t.statistics.compare?.periodA ?? "Período A"}
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
          label={t.statistics.compare?.periodB ?? "Período B"}
          color="bg-blue-500"
          borderColor="border-l-blue-500"
          value={presetB}
          onChange={setPresetB}
          labels={labels}
        />
      </div>

      {/* KPI comparison cards — 4-col on desktop */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <CompareKpi
            key={kpi.label}
            {...kpi}
            colorA="bg-emerald-500"
            colorB="bg-blue-500"
            labelCurrent={t.statistics.compare?.current ?? "atual"}
            labelRef={t.statistics.compare?.reference ?? "ref."}
          />
        ))}
      </div>

      {/* Overlay chart */}
      <CompareChart
        data={chartData}
        title={t.statistics.compare?.evolution ?? "Evolução comparativa"}
        labelA={labels[presetA]}
        labelB={labels[presetB]}
        dayLabel={t.statistics.compare?.dayLabel ?? "Dia"}
      />

      {/* AI Insights */}
      <InsightsPanel dataA={dataA} dataB={dataB} />
    </div>
  );
}
