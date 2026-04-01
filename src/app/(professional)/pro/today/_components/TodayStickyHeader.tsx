"use client";

import { ListChecks, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TodayFilter } from "../_hooks/useTodayData";

interface TodayStats {
  total: number;
  confirmed: number;
  present: number;
  pending: number;
}

export interface TodayStickyHeaderProps {
  title: string;
  todayDate: string;
  walkInButtonLabel: string;
  onWalkInClick: () => void;
  stats: TodayStats;
  statsLabels: Record<string, string>;
  filter: TodayFilter;
  filterKeys: TodayFilter[];
  filterLabels: Record<string, string>;
  onFilterChange: (key: TodayFilter) => void;
}

export function TodayStickyHeader({
  title,
  todayDate,
  walkInButtonLabel,
  onWalkInClick,
  stats,
  statsLabels,
  filter,
  filterKeys,
  filterLabels,
  onFilterChange,
}: TodayStickyHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3 mb-3">
          <ListChecks className="size-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground capitalize">{todayDate}</p>
          </div>
        </div>

        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950 gap-2"
            onClick={onWalkInClick}
          >
            <UserPlus className="size-4" />
            {walkInButtonLabel}
          </Button>
        </div>

        <div className="flex gap-4 mb-3 text-sm">
          <span className="font-semibold tabular-nums">
            {stats.total} <span className="font-normal text-muted-foreground">{statsLabels.total}</span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.confirmed} <span className="font-normal">{statsLabels.confirmed}</span>
          </span>
          <span className="text-blue-600 dark:text-blue-400 tabular-nums">
            {stats.present} <span className="font-normal">{statsLabels.present}</span>
          </span>
          <span className="text-orange-600 dark:text-orange-400 tabular-nums">
            {stats.pending} <span className="font-normal">{statsLabels.pending}</span>
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterKeys.map((key) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                filter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
