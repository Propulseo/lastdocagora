"use client";

import {
  ResponsiveContainer,
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
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { TrendingUp } from "lucide-react";
import { useChartColors } from "./useChartColors";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

export interface TrendPoint {
  date: string;
  total: number;
  noShow: number;
  cancelled: number;
}

export function TrendsChart({ data }: { data: TrendPoint[] }) {
  const { t, locale } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.some((d) => d.total > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(locale === "pt" ? "pt-PT" : "fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardHeader>
        <CardTitle>{t.statistics.trends.title}</CardTitle>
        <CardDescription>{t.statistics.trends.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={TrendingUp}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="h-[220px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border}
                  strokeOpacity={0.4}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                  width={30}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className={`${RADIUS.sm} border bg-background px-3 py-2 shadow-md`}>
                        <p className="text-xs font-medium text-muted-foreground">
                          {formatDate(String(label ?? ""))}
                        </p>
                        {payload.map((item) => (
                          <p
                            key={String(item.dataKey)}
                            className="text-sm"
                            style={{ color: item.color }}
                          >
                            {item.name}: {item.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name={t.statistics.trends.appointments}
                  stroke={colors.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="noShow"
                  name={t.statistics.trends.noShow}
                  stroke={colors.chart5}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  name={t.statistics.trends.cancelled}
                  stroke={colors.destructive}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
