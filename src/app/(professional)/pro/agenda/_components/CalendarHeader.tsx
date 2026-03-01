"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { toLocalDateStr, parseLocalDate } from "../_lib/date-utils";

interface CalendarHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  periodFilter: "day" | "week" | "month";
}

export function CalendarHeader({
  selectedDate,
  onDateChange,
  periodFilter,
}: CalendarHeaderProps) {
  const { t } = useProfessionalI18n();

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

  const goToday = () => {
    onDateChange(toLocalDateStr(new Date()));
  };

  const label =
    periodFilter === "day"
      ? `${dayName}, ${day} ${month} ${year}`
      : periodFilter === "week"
        ? `${t.agenda.weekOfPrefix} ${day} ${month} ${year}`
        : `${month} ${year}`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{label}</h2>
      </div>
      <Button variant="outline" size="sm" onClick={goToday}>
        {t.common.today}
      </Button>
    </div>
  );
}
