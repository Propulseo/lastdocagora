"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro";

type PeriodFilter = "day" | "week" | "month";

interface AgendaFiltersProps {
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  statusFilters: string[];
  onStatusChange: (statuses: string[]) => void;
}

export function AgendaFilters({
  periodFilter,
  onPeriodChange,
  statusFilters,
  onStatusChange,
}: AgendaFiltersProps) {
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
    { value: "no-show", label: t.common.status.noShow },
  ];

  const toggleStatus = (status: string) => {
    if (statusFilters.includes(status)) {
      onStatusChange(statusFilters.filter((s) => s !== status));
    } else {
      onStatusChange([...statusFilters, status]);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{t.agenda.period}</p>
          <div className="flex gap-1">
            {periodOptions.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={periodFilter === opt.value ? "default" : "outline"}
                onClick={() => onPeriodChange(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{t.agenda.statusLabel}</p>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((opt) => (
              <Badge
                key={opt.value}
                variant={
                  statusFilters.includes(opt.value) ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleStatus(opt.value)}
              >
                {opt.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
