"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { ActivityPoint, StatisticsData } from "../_lib/types";

function formatTick(dateStr: string) {
  if (dateStr.length === 7) return dateStr.slice(2);
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

interface ActivityChartProps {
  data: ActivityPoint[];
  rates: StatisticsData["rates"];
}

export function ActivityChart({ data, rates }: ActivityChartProps) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  const rateMetrics = [
    { label: s.attendanceRate, value: rates.attendance, delta: rates.attendanceDelta },
    { label: s.cancellationRate, value: rates.cancellation, delta: rates.cancellationDelta },
    { label: s.noShowRate, value: rates.noShow, delta: rates.noShowDelta },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-baseline justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold">{s.activityTitle}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{s.activitySubtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-px bg-foreground/50" />
            {s.confirmed}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-px bg-foreground/25" />
            {s.cancelled}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-px bg-foreground/10 border-t border-dashed border-foreground/30" />
            {s.noShow}
          </span>
        </div>
      </div>

      <div className="px-2 py-4">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{s.noData}</p>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date" tickFormatter={formatTick}
                  tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
                />
                <YAxis
                  allowDecimals={false} tick={{ fontSize: 11 }}
                  tickLine={false} axisLine={false} width={30}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm text-xs">
                        <p className="mb-1 font-medium">{label}</p>
                        {payload.map((p) => (
                          <p key={p.dataKey as string} className="text-muted-foreground">
                            {p.name}: <span className="font-medium text-foreground">{p.value}</span>
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone" dataKey="confirmed" name={s.confirmed}
                  stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.5} dot={false}
                />
                <Line
                  type="monotone" dataKey="cancelled" name={s.cancelled}
                  stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.25} dot={false}
                />
                <Line
                  type="monotone" dataKey="noShow" name={s.noShow}
                  stroke="hsl(var(--foreground))" strokeWidth={1} strokeOpacity={0.15}
                  strokeDasharray="4 3" dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Rate metrics footer */}
      <div className="flex border-t border-border">
        {rateMetrics.map((rm, i) => (
          <div
            key={rm.label}
            className={`flex flex-1 flex-col items-center justify-center py-3 ${
              i > 0 ? "border-l border-border" : ""
            }`}
          >
            <p className="text-lg font-semibold tabular-nums">{rm.value}%</p>
            <p className="text-[11px] text-muted-foreground">{rm.label}</p>
            {rm.delta !== 0 && (
              <p className={`text-[10px] tabular-nums ${rm.delta > 0 ? "text-foreground/50" : "text-foreground/50"}`}>
                {rm.delta > 0 ? "+" : ""}{rm.delta}%
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
