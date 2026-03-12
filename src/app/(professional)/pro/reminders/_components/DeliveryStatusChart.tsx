"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
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
import type { StatusSlice } from "../_types/reminders";

interface DeliveryStatusChartProps {
  data: StatusSlice[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#9ca3af",
  sent: "#6366f1",
  delivered: "#10b981",
  failed: "#ef4444",
  bounced: "#f59e0b",
};

export function DeliveryStatusChart({ data }: DeliveryStatusChartProps) {
  const colors = useChartColors();
  const { t } = useProfessionalI18n();
  const ct = t.reminders.charts as Record<string, string>;

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ct.statusTitle}</CardTitle>
        <CardDescription>{ct.statusDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState icon={BarChart3} title={ct.noData} description="" />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="label"
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
                formatter={(value) => [`${value} ${ct.notifications}`, ""]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                {data.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? colors.chart1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
