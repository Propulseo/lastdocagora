"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { GrowthPoint } from "../_lib/types";

function formatTick(dateStr: string) {
  if (dateStr.length === 7) return dateStr.slice(2);
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-baseline justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold">{s.growthTitle}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{s.growthSubtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground/40" />
            {s.patients}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-foreground/15" />
            {s.professionals}
          </span>
        </div>
      </div>
      <div className="px-2 py-4">
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{s.noData}</p>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="currentColor" stopOpacity={0.04} />
                    <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTick}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm">
                        <p className="mb-1 text-xs font-medium">{label}</p>
                        <div className="space-y-0.5 text-xs">
                          <p className="text-muted-foreground">
                            {s.patients}: <span className="font-medium text-foreground">{payload[0]?.value}</span>
                          </p>
                          <p className="text-muted-foreground">
                            {s.professionals}: <span className="font-medium text-foreground">{payload[1]?.value}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone" dataKey="patients" name={s.patients}
                  stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.4}
                  fill="url(#gradPatients)"
                />
                <Area
                  type="monotone" dataKey="professionals" name={s.professionals}
                  stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.15}
                  fill="url(#gradPros)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
