"use client";

import { useState, useCallback, useTransition } from "react";
import { fetchPeriodStats, type PeriodStats } from "../_actions/compare-actions";
import { fetchAIInsights, type AIInsight } from "../_actions/insights-actions";
import type { PeriodPreset } from "./compare-utils";
import { getPresetRange } from "./compare-utils";

// ---------------------------------------------------------------------------
// Compare data hook
// ---------------------------------------------------------------------------

export interface CompareState {
  presetA: PeriodPreset;
  presetB: PeriodPreset;
  dataA: PeriodStats | null;
  dataB: PeriodStats | null;
  loading: boolean;
}

export function useCompareData() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CompareState>({
    presetA: "this-month",
    presetB: "last-month",
    dataA: null,
    dataB: null,
    loading: false,
  });

  const fetchBothPeriods = useCallback(
    (presetA: PeriodPreset, presetB: PeriodPreset) => {
      setState((prev) => ({ ...prev, presetA, presetB, loading: true }));
      const rangeA = getPresetRange(presetA);
      const rangeB = getPresetRange(presetB);

      startTransition(async () => {
        const [dataA, dataB] = await Promise.all([
          fetchPeriodStats(rangeA.from, rangeA.to),
          fetchPeriodStats(rangeB.from, rangeB.to),
        ]);
        setState((prev) => ({ ...prev, dataA, dataB, loading: false }));
      });
    },
    [],
  );

  const setPresetA = useCallback(
    (preset: PeriodPreset) => fetchBothPeriods(preset, state.presetB),
    [fetchBothPeriods, state.presetB],
  );

  const setPresetB = useCallback(
    (preset: PeriodPreset) => fetchBothPeriods(state.presetA, preset),
    [fetchBothPeriods, state.presetA],
  );

  return {
    ...state,
    loading: state.loading || isPending,
    setPresetA,
    setPresetB,
    fetchBothPeriods,
  };
}

// ---------------------------------------------------------------------------
// AI Insights hook
// ---------------------------------------------------------------------------

export function useInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const generate = useCallback(
    async (dataA: PeriodStats, dataB: PeriodStats, locale: string) => {
      setLoading(true);
      setError(false);
      try {
        const result = await fetchAIInsights(dataA, dataB, locale);
        setInsights(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { insights, loading, error, generate };
}
