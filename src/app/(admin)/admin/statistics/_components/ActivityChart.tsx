"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { cn } from "@/lib/utils";
import type { ActivityPoint, StatisticsData } from "../_lib/types";

function formatTick(dateStr: string) {
  if (dateStr.length === 7) return dateStr.slice(2);
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function RateMetric({ label, rate, delta }: { label: string; rate: number; delta: number }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">{rate}%</p>
      {delta !== 0 && (
        <span className={cn(
          "inline-flex items-center gap-0.5 text-xs font-medium",
          delta > 0 ? "text-emerald-600" : "text-red-600",
        )}>
          {delta > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {delta > 0 ? "+" : ""}{delta}%
        </span>
      )}
    </div>
  );
}

interface ActivityChartProps {
  data: ActivityPoint[];
  rates: StatisticsData["rates"];
}

export function ActivityChart({ data, rates }: ActivityChartProps) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{s.activityTitle}</CardTitle>
        <CardDescription>{s.activitySubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{s.noData}</p>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="date" tickFormatter={formatTick} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone" dataKey="confirmed" name={s.confirmed}
                  stroke="#10b981" strokeWidth={2} dot={false}
                />
                <Line
                  type="monotone" dataKey="cancelled" name={s.cancelled}
                  stroke="#ef4444" strokeWidth={2} dot={false}
                />
                <Line
                  type="monotone" dataKey="noShow" name={s.noShow}
                  stroke="#f59e0b" strokeWidth={2} dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          <RateMetric label={s.attendanceRate} rate={rates.attendance} delta={rates.attendanceDelta} />
          <RateMetric label={s.cancellationRate} rate={rates.cancellation} delta={rates.cancellationDelta} />
          <RateMetric label={s.noShowRate} rate={rates.noShow} delta={rates.noShowDelta} />
        </div>
      </CardContent>
    </Card>
  );
}
