"use client";

import { Fragment } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { CalendarDays } from "lucide-react";
import { useChartColors } from "./useChartColors";

export interface HeatmapCell {
  day: number; // 0=Sun..6=Sat
  hour: number; // 8..19
  count: number;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h to 19h
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sat, Sun

export function HeatmapChart({ data }: { data: HeatmapCell[] }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.some((d) => d.count > 0);

  const dayLabels = t.agenda.days; // ["Domingo","Segunda","Terça",...]

  // Build lookup map
  const cellMap = new Map<string, number>();
  let maxCount = 0;
  for (const cell of data) {
    const key = `${cell.day}-${cell.hour}`;
    const val = (cellMap.get(key) ?? 0) + cell.count;
    cellMap.set(key, val);
    if (val > maxCount) maxCount = val;
  }

  const getOpacity = (count: number) => {
    if (maxCount === 0) return 0;
    return Math.max(0.15, count / maxCount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.heatmap.title}</CardTitle>
        <CardDescription>{t.statistics.heatmap.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={CalendarDays}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[500px]"
              style={{
                gridTemplateColumns: `80px repeat(${HOURS.length}, 1fr)`,
              }}
            >
              {/* Header row: hours */}
              <div />
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="py-1 text-center text-xs text-muted-foreground"
                >
                  {h}h
                </div>
              ))}

              {/* Data rows */}
              {DAYS.map((day) => (
                <Fragment key={`row-${day}`}>
                  <div className="flex items-center pr-2 text-xs text-muted-foreground">
                    {dayLabels[day]?.slice(0, 3)}
                  </div>
                  {HOURS.map((hour) => {
                    const count = cellMap.get(`${day}-${hour}`) ?? 0;
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="relative m-0.5 flex items-center justify-center rounded"
                        style={{
                          backgroundColor:
                            count > 0 ? colors.primary : undefined,
                          opacity: count > 0 ? getOpacity(count) : undefined,
                          minHeight: "28px",
                        }}
                        title={`${count} ${t.statistics.heatmap.appointments}`}
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-medium text-primary-foreground">
                            {count}
                          </span>
                        )}
                        {count === 0 && (
                          <div className="absolute inset-0 rounded bg-muted/30" />
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
