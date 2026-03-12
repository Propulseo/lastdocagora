"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChartColors } from "./useChartColors";

// ---------------------------------------------------------------------------
// Revenue trend chart (Analyze → Performance tab)
// ---------------------------------------------------------------------------

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueTrendPoint[];
  title: string;
  description: string;
  locale: string;
}

export function RevenueChart({ data, title, description, locale }: RevenueChartProps) {
  const colors = useChartColors();
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(locale === "en" ? "en-US" : locale === "pt" ? "pt-PT" : "fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} strokeOpacity={0.4} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12, fill: "currentColor" }}
                stroke="currentColor"
                opacity={0.5}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "currentColor" }}
                stroke="currentColor"
                opacity={0.5}
                width={50}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                      <p className="text-xs font-medium text-muted-foreground">
                        {formatDate(String(label ?? ""))}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "#10b981" }}>
                        {Number(payload[0].value).toFixed(0)}€
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Compare overlay chart (Compare mode)
// ---------------------------------------------------------------------------

export interface ComparePoint {
  day: number;
  countA: number;
  countB: number;
}

interface CompareChartProps {
  data: ComparePoint[];
  title: string;
  labelA: string;
  labelB: string;
  dayLabel?: string;
}

export function CompareChart({ data, title, labelA, labelB, dayLabel = "Jour" }: CompareChartProps) {
  const colors = useChartColors();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded bg-emerald-500" />
            <span className="text-xs">{labelA}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed border-blue-500" />
            <span className="text-xs">{labelB}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} strokeOpacity={0.3} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "currentColor" }}
                stroke="currentColor"
                opacity={0.4}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "currentColor" }}
                stroke="currentColor"
                opacity={0.4}
                width={30}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const a = Number(payload[0]?.value ?? 0);
                  const b = Number(payload[1]?.value ?? 0);
                  const diff = b > 0 ? Math.round(((a - b) / b) * 100) : 0;
                  return (
                    <div className="min-w-[160px] rounded-xl border bg-background/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {dayLabel} {label}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block size-2 rounded-full bg-emerald-500" />
                            <span className="text-xs text-muted-foreground">{labelA}</span>
                          </span>
                          <span className="text-sm font-semibold">{a}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block size-2 rounded-full bg-blue-500" />
                            <span className="text-xs text-muted-foreground">{labelB}</span>
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground">{b}</span>
                        </div>
                      </div>
                      {b > 0 && (
                        <div className="mt-2 border-t pt-2">
                          <span
                            className={`text-xs font-medium ${
                              diff >= 0 ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {diff >= 0 ? "+" : ""}{diff}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="countA"
                name={labelA}
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradA)"
                activeDot={{ r: 4, strokeWidth: 0, fill: "#10b981" }}
              />
              <Area
                type="monotone"
                dataKey="countB"
                name={labelB}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#gradB)"
                activeDot={{ r: 4, strokeWidth: 0, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
