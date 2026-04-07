"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
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
import { Users } from "lucide-react";
import { useChartColors } from "./useChartColors";

export interface ChannelStat {
  channel: string;
  label: string;
  count: number;
}

export function ChannelChart({ data }: { data: ChannelStat[] }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();
  const channelI18n = t.statistics.channel as Record<string, string>;

  // Re-map channel labels using client-side i18n (for reactive language switching)
  const channelLabelMap: Record<string, string> = {
    patient_booking: channelI18n.patientBooking ?? "Patient",
    manual: channelI18n.manual ?? "Manual (pro)",
    walk_in: channelI18n.walkIn ?? "Walk-in",
  };
  const localizedData = data.map((d) => ({
    ...d,
    label: channelLabelMap[d.channel] ?? d.label,
  }));

  const total = localizedData.reduce((sum, d) => sum + d.count, 0);
  const hasData = total > 0;

  const pieColors = [colors.chart2, colors.chart4, "#f59e0b"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.channel.title}</CardTitle>
        <CardDescription>{t.statistics.channel.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={Users}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="flex items-center gap-6">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={localizedData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    strokeWidth={2}
                    stroke={colors.background}
                  >
                    {data.map((_, index) => (
                      <Cell
                        key={index}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
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
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              {localizedData.map((item, index) => {
                const pct =
                  total > 0
                    ? Math.round((item.count / total) * 100)
                    : 0;
                return (
                  <div key={item.channel} className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor:
                          pieColors[index % pieColors.length],
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
