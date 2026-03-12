"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { GrowthPoint } from "../_lib/types";

function formatTick(dateStr: string) {
  if (dateStr.length === 7) return dateStr.slice(2); // YY-MM
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}`;
}

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{s.growthTitle}</CardTitle>
        <CardDescription>{s.growthSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{s.noData}</p>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="date" tickFormatter={formatTick} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <p className="mb-1 text-sm font-medium">{label}</p>
                        <p className="text-sm text-blue-500">
                          {payload[0]?.value} {s.patients.toLowerCase()}
                        </p>
                        <p className="text-sm text-violet-500">
                          {payload[1]?.value} {s.professionals.toLowerCase()}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Area
                  type="monotone" dataKey="patients" name={s.patients}
                  stroke="#3b82f6" strokeWidth={2} fill="url(#gradPatients)"
                />
                <Area
                  type="monotone" dataKey="professionals" name={s.professionals}
                  stroke="#8b5cf6" strokeWidth={2} fill="url(#gradPros)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
