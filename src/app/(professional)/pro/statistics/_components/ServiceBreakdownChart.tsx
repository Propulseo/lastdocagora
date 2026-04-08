"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { Stethoscope } from "lucide-react";
import { useChartColors } from "./useChartColors";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

export interface ServiceStat {
  name: string;
  total: number;
  noShow: number;
}

export function ServiceBreakdownChart({ data }: { data: ServiceStat[] }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.length > 0 && data.some((d) => d.total > 0);

  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardHeader>
        <CardTitle>{t.statistics.services.title}</CardTitle>
        <CardDescription>{t.statistics.services.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={Stethoscope}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="h-[200px] sm:h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border}
                  strokeOpacity={0.4}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                  width={120}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload as ServiceStat;
                    return (
                      <div className={`${RADIUS.sm} border bg-background px-3 py-2 shadow-md`}>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.statistics.services.total}: {item.total}
                        </p>
                        <p className="text-xs text-orange-500">
                          {t.statistics.services.noShow}: {item.noShow}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar
                  dataKey="total"
                  name={t.statistics.services.total}
                  fill={colors.primary}
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="noShow"
                  name={t.statistics.services.noShow}
                  fill={colors.chart5}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
