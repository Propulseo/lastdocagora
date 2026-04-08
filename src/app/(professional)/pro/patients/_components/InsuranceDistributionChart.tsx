"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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
import { PieChartIcon } from "lucide-react";
import type { InsuranceSlice } from "../_lib/types";

interface InsuranceDistributionChartProps {
  data: InsuranceSlice[];
}

const PIE_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#a855f7",
  "#f97316",
  "#10b981",
  "#ef4444",
  "#ec4899",
];

export function InsuranceDistributionChart({
  data,
}: InsuranceDistributionChartProps) {
  const colors = useChartColors();
  const { t } = useProfessionalI18n();
  const ct = t.patients.charts as Record<string, string>;
  const insuranceLabels = t.patients.insuranceLabels as Record<string, string>;

  // Re-map labels using i18n (overrides server-baked Portuguese labels)
  const localizedData = data.map((d) => ({
    ...d,
    label: insuranceLabels[d.provider] ?? d.label,
  }));

  return (
    <Card className={cn(RADIUS.card, SHADOW.card)}>
      <CardHeader>
        <CardTitle>{ct.insuranceTitle}</CardTitle>
        <CardDescription>{ct.insuranceDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={PieChartIcon}
            title={ct.noData}
            description=""
          />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={localizedData}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={PIE_COLORS[idx % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
