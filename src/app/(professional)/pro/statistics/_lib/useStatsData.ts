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
  customRangeA: { from: string; to: string } | null;
  customRangeB: { from: string; to: string } | null;
  dataA: PeriodStats | null;
  dataB: PeriodStats | null;
  loading: boolean;
}

export function useCompareData() {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<CompareState>({
    presetA: "this-month",
    presetB: "last-month",
    customRangeA: null,
    customRangeB: null,
    dataA: null,
    dataB: null,
    loading: false,
  });

  const fetchBothPeriods = useCallback(
    (
      presetA: PeriodPreset,
      presetB: PeriodPreset,
      customA?: { from: string; to: string } | null,
      customB?: { from: string; to: string } | null,
    ) => {
      setState((prev) => ({
        ...prev,
        presetA,
        presetB,
        customRangeA: customA ?? prev.customRangeA,
        customRangeB: customB ?? prev.customRangeB,
        loading: true,
      }));

      const rangeA = presetA === "custom" && customA ? customA : getPresetRange(presetA);
      const rangeB = presetB === "custom" && customB ? customB : getPresetRange(presetB);

      if (!rangeA.from || !rangeB.from) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

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
    (preset: PeriodPreset, customRange?: { from: string; to: string } | null) =>
      fetchBothPeriods(preset, state.presetB, customRange, state.customRangeB),
    [fetchBothPeriods, state.presetB, state.customRangeB],
  );

  const setPresetB = useCallback(
    (preset: PeriodPreset, customRange?: { from: string; to: string } | null) =>
      fetchBothPeriods(state.presetA, preset, state.customRangeA, customRange),
    [fetchBothPeriods, state.presetA, state.customRangeA],
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
