"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";

type PeriodFilter = "day" | "week" | "month";

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
    { value: "cancelled", label: t.common.status.cancelled },
    { value: "rejected", label: t.common.status.rejected },
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
    <div className="flex flex-wrap items-center gap-2">
      {/* Segmented period toggle */}
      <div className="hidden sm:inline-flex rounded-lg bg-muted p-0.5">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPeriodChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium transition-colors",
              periodFilter === opt.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Status filter badges */}
      <div className="flex items-center gap-1 overflow-x-auto flex-nowrap">
        {statusOptions.map((opt) => (
          <Badge
            key={opt.value}
            variant={statusFilters.includes(opt.value) ? "default" : "outline"}
            className="h-6 cursor-pointer text-[11px]"
            onClick={() => toggleStatus(opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date navigation */}
      <div className="flex items-center justify-between gap-1 w-full sm:w-auto">
        <Button
          variant="ghost"
          size="icon"
          className="size-7 sm:size-7 min-h-[44px] min-w-[44px]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 sm:size-7 min-h-[44px] min-w-[44px]"
          onClick={() => navigate(1)}
        >
          <ChevronRight className="size-4" />
        </Button>
        <span className="px-1 text-sm font-medium tabular-nums">
          {dateLabel}
        </span>
        <Button variant="outline" size="sm" className="h-7 min-h-[44px] text-xs" onClick={goToday}>
          {t.common.today}
        </Button>
      </div>
    </div>
  );
}
