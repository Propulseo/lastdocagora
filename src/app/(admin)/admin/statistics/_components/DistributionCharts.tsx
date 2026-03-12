"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { StatisticsData } from "../_lib/types";

const PRO_COLORS = ["#10b981", "#f59e0b", "#ef4444"];
const CHANNEL_COLORS = ["#3b82f6", "#8b5cf6"];

interface DonutProps {
  data: { name: string; value: number }[];
  colors: string[];
  title: string;
}

function MiniDonut({ data, colors, title }: DonutProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <div className="flex items-center gap-4">
        <div className="h-[130px] w-[130px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data} cx="50%" cy="50%"
                innerRadius={35} outerRadius={55}
                paddingAngle={2} dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="font-medium tabular-nums">{d.value}</span>
              <span className="text-xs text-muted-foreground">
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DistributionChartsProps {
  proStatus: StatisticsData["proStatus"];
  bookingChannel: StatisticsData["bookingChannel"];
}

export function DistributionCharts({ proStatus, bookingChannel }: DistributionChartsProps) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  const proData = [
    { name: s.verified, value: proStatus.verified },
    { name: s.pending, value: proStatus.pending },
    { name: s.rejected, value: proStatus.rejected },
  ];

  const channelData = [
    { name: s.patientBooking, value: bookingChannel.patient },
    { name: s.manualBooking, value: bookingChannel.manual },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{s.distributionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <MiniDonut data={proData} colors={PRO_COLORS} title={s.proStatusTitle} />
        <MiniDonut data={channelData} colors={CHANNEL_COLORS} title={s.bookingChannelTitle} />
      </CardContent>
    </Card>
  );
}
