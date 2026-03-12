"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
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
import { useChartColors } from "@/app/(professional)/pro/statistics/_components/useChartColors";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyState } from "@/components/shared/empty-state";
import { BarChart3 } from "lucide-react";
import type { AcquisitionPoint } from "../_lib/types";

interface PatientAcquisitionChartProps {
  data: AcquisitionPoint[];
}

export function PatientAcquisitionChart({
  data,
}: PatientAcquisitionChartProps) {
  const colors = useChartColors();
  const { t } = useProfessionalI18n();
  const ct = t.patients.charts as Record<string, string>;
  const dateLocale = t.common.dateLocale as string;

  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1);
    return d.toLocaleDateString(
      dateLocale === "pt-PT" ? "pt-PT" : dateLocale === "en-GB" ? "en-GB" : "fr-FR",
      { month: "short", year: "2-digit" },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ct.acquisitionTitle}</CardTitle>
        <CardDescription>{ct.acquisitionDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={ct.noData}
            description=""
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="date"
                tickFormatter={formatMonth}
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={{ stroke: colors.border }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: colors.muted, fontSize: 12 }}
                axisLine={{ stroke: colors.border }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
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
                labelFormatter={(label) => formatMonth(String(label))}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="newPatients"
                name={ct.newPatients}
                fill={colors.chart1}
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulative"
                name={ct.cumulative}
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
