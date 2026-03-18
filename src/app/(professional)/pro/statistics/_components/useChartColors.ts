"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

interface ChartColors {
  primary: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  destructive: string;
  border: string;
  background: string;
  muted: string;
}

const FALLBACK: ChartColors = {
  primary: "#6366f1",
  chart1: "#6366f1",
  chart2: "#22d3ee",
  chart3: "#f59e0b",
  chart4: "#a855f7",
  chart5: "#f97316",
  destructive: "#ef4444",
  border: "#e5e7eb",
  background: "#ffffff",
  muted: "#9ca3af",
};

/**
 * Resolve an oklch/hsl/etc CSS color to hex via canvas.
 * This guarantees recharts SVG attributes get a universally supported value.
 */
function toHex(cssColor: string): string {
  if (!cssColor) return "";
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return cssColor;
  ctx.fillStyle = cssColor;
  return ctx.fillStyle; // browser returns hex
}

function getCssVar(el: Element, name: string): string {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  return raw ? toHex(raw) : "";
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(FALLBACK);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Read from document.body — theme overrides (body.role-professional)
    // are applied on <body>, not <html>
    const el = document.body;
    setColors({
      primary: getCssVar(el, "--primary") || FALLBACK.primary,
      chart1: getCssVar(el, "--chart-1") || FALLBACK.chart1,
      chart2: getCssVar(el, "--chart-2") || FALLBACK.chart2,
      chart3: getCssVar(el, "--chart-3") || FALLBACK.chart3,
      chart4: getCssVar(el, "--chart-4") || FALLBACK.chart4,
      chart5: getCssVar(el, "--chart-5") || FALLBACK.chart5,
      destructive: getCssVar(el, "--destructive") || FALLBACK.destructive,
      border: getCssVar(el, "--border") || FALLBACK.border,
      background: getCssVar(el, "--background") || FALLBACK.background,
      muted: getCssVar(el, "--muted-foreground") || FALLBACK.muted,
    });
  }, [resolvedTheme]);

  return colors;
}
