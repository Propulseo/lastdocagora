"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import { RADIUS, SHADOW } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";

type PeriodFilter = "day" | "week" | "month";

const STATUS_COLORS: Record<string, { active: string; dot: string }> = {
  confirmed: {
    active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/40",
    dot: "bg-emerald-500",
  },
  pending: {
    active: "bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/40",
    dot: "bg-amber-500",
  },
  completed: {
    active: "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-500/40",
    dot: "bg-blue-500",
  },
  "no-show": {
    active: "bg-orange-100 text-orange-700 ring-1 ring-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:ring-orange-500/40",
    dot: "bg-orange-500",
  },
};

const PERIOD_ICONS: Record<PeriodFilter, typeof Calendar> = {
  day: Calendar,
  week: CalendarDays,
  month: CalendarRange,
};

interface AgendaControlBarProps {
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  statusFilters: string[];
  onStatusChange: (statuses: string[]) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function AgendaControlBar({
  periodFilter,
  onPeriodChange,
  statusFilters,
  onStatusChange,
  selectedDate,
  onDateChange,
}: AgendaControlBarProps) {
  const { t } = useProfessionalI18n();

  const periodOptions: { value: PeriodFilter; label: string }[] = [
    { value: "day", label: t.agenda.periodDay },
    { value: "week", label: t.agenda.periodWeek },
    { value: "month", label: t.agenda.periodMonth },
  ];

  const statusOptions = [
    { value: "confirmed", label: t.common.status.confirmed },
    { value: "pending", label: t.common.status.pending },
    { value: "completed", label: t.common.status.completed },
    { value: "no-show", label: t.common.status.noShow },
  ];

  const toggleStatus = (status: string) => {
    if (statusFilters.includes(status)) {
      onStatusChange(statusFilters.filter((s) => s !== status));
    } else {
      onStatusChange([...statusFilters, status]);
    }
  };

  // Date navigation
  const date = parseLocalDate(selectedDate);
  const dayName = t.agenda.daysFull[date.getDay()];
  const day = date.getDate();
  const month = t.agenda.months[date.getMonth()];
  const year = date.getFullYear();

  const navigate = (direction: -1 | 1) => {
    const d = parseLocalDate(selectedDate);
    if (periodFilter === "day") {
      d.setDate(d.getDate() + direction);
    } else if (periodFilter === "week") {
      d.setDate(d.getDate() + direction * 7);
    } else {
      d.setMonth(d.getMonth() + direction);
    }
    onDateChange(toLocalDateStr(d));
  };

  const goToday = () => onDateChange(toLocalDateStr(new Date()));

  const dateLabel =
    periodFilter === "day"
      ? `${dayName}, ${day} ${month} ${year}`
      : periodFilter === "week"
        ? `${t.agenda.weekOfPrefix} ${day} ${month} ${year}`
        : `${month} ${year}`;

  return (
    <div className={cn("flex flex-col gap-2 bg-card px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-4 sm:py-3", RADIUS.card, SHADOW.card)}>
      {/* Row 1 on mobile: Date navigation */}
      <div className="flex items-center justify-between sm:order-3 sm:ml-auto">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8 min-h-[44px] min-w-[44px]", RADIUS.sm)}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-1 text-sm font-semibold tabular-nums">
            {dateLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-8 min-h-[44px] min-w-[44px]", RADIUS.sm)}
            onClick={() => navigate(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" className={cn("h-8 text-xs", RADIUS.element)} onClick={goToday}>
          {t.common.today}
        </Button>
      </div>

      {/* Row 2 on mobile: Status filter pills */}
      <div className="flex gap-1.5 overflow-x-auto sm:order-2 sm:flex-wrap sm:gap-2">
        {statusOptions.map((opt) => {
          const isActive = statusFilters.includes(opt.value);
          const colors = STATUS_COLORS[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => toggleStatus(opt.value)}
              className={cn(
                RADIUS.badge,
                "inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold transition-all whitespace-nowrap sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs",
                isActive
                  ? colors.active
                  : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
            >
              <span className={cn("size-1.5 rounded-full shrink-0 sm:size-2", isActive ? colors.dot : "bg-muted-foreground/40")} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Segmented period toggle — desktop only */}
      <div className={cn("hidden sm:inline-flex sm:order-1", RADIUS.element, "bg-muted p-1 gap-1")}>
        {periodOptions.map((opt) => {
          const Icon = PERIOD_ICONS[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => onPeriodChange(opt.value)}
              className={cn(
                RADIUS.sm, "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold transition-all",
                periodFilter === opt.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
