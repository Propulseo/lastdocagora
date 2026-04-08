"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS } from "@/lib/design-tokens";
import { useChartColors } from "@/app/(professional)/pro/statistics/_components/useChartColors";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";
import { getServiceName } from "@/lib/get-service-name";
import type { RevenuePerServiceSlice } from "../_lib/types";

interface RevenuePerServiceChartProps {
  data: RevenuePerServiceSlice[];
}

export function RevenuePerServiceChart({ data }: RevenuePerServiceChartProps) {
  const colors = useChartColors();
  const { t, locale } = useProfessionalI18n();
  const ct = t.services.charts as Record<string, string>;

  const localizedData = data.map((item) => ({
    ...item,
    name: getServiceName(item, locale),
  }));

  return (
    <Card className={cn(RADIUS.card, SHADOW.card)}>
      <CardHeader>
        <CardTitle>{ct.revenueTitle}</CardTitle>
        <CardDescription>{ct.revenueDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState icon={BarChart3} title={ct.noData} description="" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={localizedData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                type="number"
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={{ stroke: colors.border }}
                tickFormatter={(value) => `${value}\u00a0\u20ac`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={{ stroke: colors.border }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                }}
                formatter={(value) => [`${value}\u00a0\u20ac`, ct.revenue]}
              />
              <Bar
                dataKey="revenue"
                fill={colors.chart1}
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
