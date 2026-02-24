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
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { Clock } from "lucide-react";
import { useChartColors } from "./useChartColors";
import { SmallSampleWarning } from "./SmallSampleWarning";

export interface PunctualityData {
  onTime: number;
  late: number;
  absent: number;
}

export function PunctualityChart({ data }: { data: PunctualityData }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const total = data.onTime + data.late + data.absent;
  const hasData = total > 0;

  const barData = [
    { name: t.statistics.punctuality.onTime, value: data.onTime },
    { name: t.statistics.punctuality.late, value: data.late },
    { name: t.statistics.punctuality.absent, value: data.absent },
  ];
  const barColors = [colors.chart2, colors.chart3, colors.destructive];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.statistics.punctuality.title}</CardTitle>
            <CardDescription>
              {t.statistics.punctuality.description}
            </CardDescription>
          </div>
          <SmallSampleWarning count={total} />
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={Clock}
            title={t.statistics.kpi.noAttendanceData}
            description={t.statistics.kpi.markAttendanceCta}
            ctaLabel={t.statistics.kpi.goToAgenda}
            ctaHref="/pro/agenda"
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {barData.map((item, i) => {
                const pct =
                  total > 0
                    ? Math.round((item.value / total) * 100)
                    : 0;
                return (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: barColors[i] }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold">{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.border}
                    strokeOpacity={0.4}
                    horizontal={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    stroke="currentColor"
                    opacity={0.5}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    stroke="currentColor"
                    opacity={0.5}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const pct =
                        total > 0
                          ? Math.round(
                              ((item.value as number) / total) * 100,
                            )
                          : 0;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.value} ({pct}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={index} fill={barColors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
