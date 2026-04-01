"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface CompareKpiProps {
  label: string;
  valueA: string;
  valueB: string;
  delta: number;
  icon: React.ElementType;
  colorA: string;
  colorB: string;
  labelCurrent: string;
  labelRef: string;
}

export function CompareKpiCard({ label, valueA, valueB, delta, icon: Icon, colorA, colorB, labelCurrent, labelRef }: CompareKpiProps) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>

        <div className="grid grid-cols-2 divide-x">
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${colorA}`} />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {labelCurrent}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight">{valueA}</p>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${colorB}`} />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {labelRef}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-muted-foreground">{valueB}</p>
          </div>
        </div>

        <div
          className={`flex items-center justify-center gap-1.5 px-4 py-2 ${
            isNeutral
              ? "bg-muted/50 text-muted-foreground"
              : isPositive
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600"
          }`}
        >
          {isNeutral ? (
            <Minus className="size-3.5" />
          ) : isPositive ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          )}
          <span className="text-sm font-semibold">
            {isNeutral ? "0%" : `${isPositive ? "+" : ""}${delta}%`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
