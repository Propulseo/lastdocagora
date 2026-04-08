"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
import { useChartColors } from "@/app/(professional)/pro/statistics/_components/useChartColors";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";
import type { NotificationTrendPoint } from "../_types/reminders";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

interface NotificationTrendsChartProps {
  data: NotificationTrendPoint[];
}

export function NotificationTrendsChart({ data }: NotificationTrendsChartProps) {
  const colors = useChartColors();
  const { t } = useProfessionalI18n();
  const ct = t.reminders.charts as Record<string, string>;
  const dateLocale = t.common.dateLocale as string;

  const hasData = data.some((d) => d.sent > 0 || d.delivered > 0 || d.failed > 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(
      dateLocale === "pt-PT" ? "pt-PT" : dateLocale === "en-GB" ? "en-GB" : "fr-FR",
      { day: "2-digit", month: "short" },
    );
  };

  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardHeader>
        <CardTitle>{ct.trendsTitle}</CardTitle>
        <CardDescription>{ct.trendsDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState icon={BarChart3} title={ct.noData} description="" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={{ stroke: colors.border }}
              />
              <YAxis
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={{ stroke: colors.border }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                }}
                labelFormatter={(label) => formatDate(String(label))}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="sent"
                name={ct.sent}
                stroke={colors.chart1}
                fill={colors.chart1}
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="delivered"
                name={ct.delivered}
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="failed"
                name={ct.failed}
                stroke={colors.destructive}
                fill={colors.destructive}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
