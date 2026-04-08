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
import type { FrequencyBucket } from "../_lib/types";

interface AppointmentFrequencyChartProps {
  data: FrequencyBucket[];
}

export function AppointmentFrequencyChart({
  data,
}: AppointmentFrequencyChartProps) {
  const colors = useChartColors();
  const { t } = useProfessionalI18n();
  const ct = t.patients.charts as Record<string, string>;

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card className={cn(RADIUS.card, SHADOW.card)}>
      <CardHeader>
        <CardTitle>{ct.frequencyTitle}</CardTitle>
        <CardDescription>{ct.frequencyDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={BarChart3}
            title={ct.noData}
            description=""
          />
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={data.map((d) => ({
                name: `${d.bucket} ${ct.appointments}`,
                count: d.count,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="name"
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
                formatter={(value) => [
                  `${value} ${ct.patients}`,
                  "",
                ]}
              />
              <Bar
                dataKey="count"
                fill={colors.chart1}
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
