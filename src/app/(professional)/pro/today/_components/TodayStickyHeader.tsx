"use client";

import { ListChecks, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RADIUS, SHADOW } from "@/lib/design-tokens";
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
  isToday: boolean;
  isMaxFuture: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onGoToday: () => void;
  todayButtonLabel: string;
  walkInTodayOnlyLabel: string;
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
  isToday,
  isMaxFuture,
  onPrevDay,
  onNextDay,
  onGoToday,
  todayButtonLabel,
  walkInTodayOnlyLabel,
}: TodayStickyHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="py-4">
        <div className="flex items-center gap-3 mb-3">
          <ListChecks className="size-6 text-primary" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold">{title}</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-7 min-h-[44px] min-w-[44px]", RADIUS.sm)}
                onClick={onPrevDay}
              >
                <ChevronLeft className="size-[18px]" />
              </Button>
              <span className="text-sm text-muted-foreground capitalize tabular-nums">
                {todayDate}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-7 min-h-[44px] min-w-[44px]", RADIUS.sm)}
                onClick={onNextDay}
                disabled={isMaxFuture}
              >
                <ChevronRight className="size-[18px]" />
              </Button>
              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-7 min-h-[44px] text-xs ml-1", RADIUS.element)}
                  onClick={onGoToday}
                >
                  {todayButtonLabel}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950 gap-2 min-h-[44px] w-full sm:w-auto"
                    onClick={onWalkInClick}
                    disabled={!isToday}
                  >
                    <UserPlus className="size-4" />
                    {walkInButtonLabel}
                  </Button>
                </span>
              </TooltipTrigger>
              {!isToday && (
                <TooltipContent>{walkInTodayOnlyLabel}</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className={cn("flex gap-1 mb-3 overflow-x-auto", RADIUS.card)}>
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
            <span className="text-sm font-bold tabular-nums">{stats.total}</span>
            <span className="text-xs text-muted-foreground">{statsLabels.total}</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
            <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{stats.confirmed}</span>
            <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">{statsLabels.confirmed}</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-lg">
            <span className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">{stats.present}</span>
            <span className="text-xs text-blue-600/70 dark:text-blue-400/70">{statsLabels.present}</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-lg">
            <span className="text-sm font-bold tabular-nums text-orange-600 dark:text-orange-400">{stats.pending}</span>
            <span className="text-xs text-orange-600/70 dark:text-orange-400/70">{statsLabels.pending}</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterKeys.map((key) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-xs font-medium border transition-all min-h-[44px] flex items-center active:scale-95",
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
