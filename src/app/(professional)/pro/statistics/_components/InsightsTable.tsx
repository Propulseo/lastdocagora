"use client";

import {
  AlertTriangle,
  TrendingDown,
  Award,
  CalendarX,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

export interface Insight {
  type: "warning" | "danger" | "success" | "info";
  message: string;
  action: string;
}

const typeConfig: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  danger: {
    icon: TrendingDown,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  success: {
    icon: Award,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  info: {
    icon: CalendarX,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
};

export function InsightsTable({ insights }: { insights: Insight[] }) {
  const { t } = useProfessionalI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.insights.title}</CardTitle>
        <CardDescription>
          {t.statistics.insights.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.statistics.insights.noInsights}
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const config = typeConfig[insight.type] ?? typeConfig.info;
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className={`rounded-lg p-2 ${config.bg}`}>
                    <Icon className={`size-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      → {insight.action}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
