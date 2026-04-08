"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  AlertTriangle,
  Info,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { useInsights } from "../_lib/useStatsData";
import type { PeriodStats } from "../_actions/compare-actions";
import type { AIInsight } from "../_actions/insights-actions";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

// ---------------------------------------------------------------------------
// Insight card
// ---------------------------------------------------------------------------

const ICON_MAP: Record<AIInsight["type"], React.ElementType> = {
  positive: TrendingUp,
  warning: AlertTriangle,
  info: Info,
};

const COLOR_MAP: Record<AIInsight["type"], { text: string; bg: string; border: string }> = {
  positive: {
    text: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  warning: {
    text: "text-orange-600",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  info: {
    text: "text-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

function InsightCard({ insight }: { insight: AIInsight }) {
  const Icon = ICON_MAP[insight.type];
  const colors = COLOR_MAP[insight.type];

  return (
    <Card className={`${RADIUS.card} ${SHADOW.card} border ${colors.border}`}>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`${RADIUS.element} p-2 ${colors.bg}`}>
          <Icon className={`size-4 ${colors.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${colors.text}`}>{insight.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{insight.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// InsightsPanel
// ---------------------------------------------------------------------------

interface InsightsPanelProps {
  dataA: PeriodStats;
  dataB: PeriodStats;
}

export function InsightsPanel({ dataA, dataB }: InsightsPanelProps) {
  const { t, locale } = useProfessionalI18n();
  const { insights, loading, error, generate } = useInsights();

  // Auto-generate on mount or when data changes
  useEffect(() => {
    generate(dataA, dataB, locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataA, dataB]);

  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t.statistics.compare?.insightsTitle ?? "Insights IA"}</CardTitle>
          <CardDescription>
            {t.statistics.compare?.insightsDesc ?? "Analyse intelligente de vos données"}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generate(dataA, dataB, locale)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {t.statistics.compare?.refreshInsights ?? "Actualiser"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">
            {t.statistics.compare?.insightsLoading ?? "Analyse en cours…"}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-500">
            {t.statistics.compare?.insightsError ?? "Impossible de générer les insights."}
          </p>
        )}
        {!loading && !error && insights.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
