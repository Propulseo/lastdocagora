"use client";

import type { LucideIcon } from "lucide-react";
import { useCounter } from "./use-counter";

export interface DashboardKpi {
  label: string;
  value: number;
  icon: LucideIcon;
  description?: string;
}

function AnimatedValue({ value }: { value: number }) {
  const count = useCounter(value);
  return <>{count}</>;
}

interface DashboardKpiGridProps {
  kpis: DashboardKpi[];
}

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  if (kpis.length === 0) return null;

  const [primary, ...secondary] = kpis;

  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card"
      style={{
        animation: "admin-fade-up 0.4s ease-out both",
        animationDelay: "80ms",
      }}
    >
      {/* ── Desktop: horizontal strip ── */}
      <div className="hidden lg:flex">
        {/* Primary metric — larger */}
        <div className="flex flex-col justify-center border-r border-border px-8 py-6">
          <p className="text-4xl font-semibold tabular-nums tracking-tight">
            <AnimatedValue value={primary.value} />
          </p>
          <p className="mt-1.5 text-sm font-medium">
            {primary.label}
          </p>
          {primary.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {primary.description}
            </p>
          )}
        </div>

        {/* Secondary metrics */}
        <div className="flex flex-1">
          {secondary.map((kpi, i) => (
            <div
              key={kpi.label}
              className={`flex flex-1 flex-col justify-center px-6 py-6 ${
                i > 0 ? "border-l border-border" : ""
              }`}
            >
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                <AnimatedValue value={kpi.value} />
              </p>
              <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                {kpi.label}
              </p>
              {kpi.description && (
                <p className="mt-0.5 text-xs text-muted-foreground/50">
                  {kpi.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tablet: 2+3 grid ── */}
      <div className="hidden sm:block lg:hidden">
        {/* Top row: primary + first secondary */}
        <div className="flex">
          <div className="flex flex-1 flex-col justify-center border-r border-border px-6 py-5">
            <p className="text-3xl font-semibold tabular-nums tracking-tight">
              <AnimatedValue value={primary.value} />
            </p>
            <p className="mt-1 text-sm font-medium">
              {primary.label}
            </p>
            {primary.description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {primary.description}
              </p>
            )}
          </div>
          {secondary[0] && (
            <div className="flex flex-1 flex-col justify-center px-6 py-5">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                <AnimatedValue value={secondary[0].value} />
              </p>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {secondary[0].label}
              </p>
              {secondary[0].description && (
                <p className="mt-0.5 text-xs text-muted-foreground/50">
                  {secondary[0].description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom row: remaining 3 */}
        {secondary.length > 1 && (
          <div className="flex border-t border-border">
            {secondary.slice(1).map((kpi, i) => (
              <div
                key={kpi.label}
                className={`flex flex-1 flex-col justify-center px-6 py-4 ${
                  i > 0 ? "border-l border-border" : ""
                }`}
              >
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  <AnimatedValue value={kpi.value} />
                </p>
                <p className="mt-1 text-[13px] font-medium text-muted-foreground">
                  {kpi.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile: stacked rows ── */}
      <div className="sm:hidden">
        {/* Primary — prominent */}
        <div className="px-5 py-5">
          <p className="text-3xl font-semibold tabular-nums tracking-tight">
            <AnimatedValue value={primary.value} />
          </p>
          <p className="mt-1 text-sm font-medium">
            {primary.label}
          </p>
          {primary.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {primary.description}
            </p>
          )}
        </div>

        {/* Secondary — compact 2-col grid */}
        <div className="grid grid-cols-2 border-t border-border">
          {secondary.map((kpi, i) => (
            <div
              key={kpi.label}
              className={`px-5 py-4 ${i % 2 !== 0 ? "border-l border-border" : ""} ${
                i >= 2 ? "border-t border-border" : ""
              }`}
            >
              <p className="text-xl font-semibold tabular-nums tracking-tight">
                <AnimatedValue value={kpi.value} />
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {kpi.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
