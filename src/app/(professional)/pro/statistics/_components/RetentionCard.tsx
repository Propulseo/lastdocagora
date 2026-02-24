"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { useChartColors } from "./useChartColors";

export interface RetentionData {
  days30: number;
  days60: number;
  days90: number;
  totalPatients: number;
}

export function RetentionCard({ data }: { data: RetentionData }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.totalPatients >= 2;

  const bars = [
    { label: t.statistics.retention.days30, value: data.days30 },
    { label: t.statistics.retention.days60, value: data.days60 },
    { label: t.statistics.retention.days90, value: data.days90 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.retention.title}</CardTitle>
        <CardDescription>
          {t.statistics.retention.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.statistics.retention.noData}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {bars.map((bar) => (
              <div key={bar.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{bar.label}</span>
                  <span className="text-sm font-bold">{bar.value}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${bar.value}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.statistics.retention.returned}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
