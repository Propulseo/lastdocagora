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
import { useChartColors } from "@/app/(professional)/pro/statistics/_components/useChartColors";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyState } from "@/components/shared/empty-state";
import { PieChartIcon } from "lucide-react";
import type { ChannelSlice } from "../_types/reminders";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

interface ChannelDistributionChartProps {
  data: ChannelSlice[];
}

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#a855f7"];

export function ChannelDistributionChart({ data }: ChannelDistributionChartProps) {
  const colors = useChartColors();
  const { t } = useProfessionalI18n();
  const ct = t.reminders.charts as Record<string, string>;

  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardHeader>
        <CardTitle>{ct.channelTitle}</CardTitle>
        <CardDescription>{ct.channelDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState icon={PieChartIcon} title={ct.noData} description="" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 8,
                }}
                formatter={(value) => [`${value} ${ct.notifications}`, ""]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
