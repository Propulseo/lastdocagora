"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/shared/search-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface AppointmentsFiltersProps {
  totalCount: number;
}

export function AppointmentsFilters({ totalCount }: AppointmentsFiltersProps) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [popoverOpen, setPopoverOpen] = useState(false);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function setQuickPeriod(period: "today" | "week" | "month") {
    const params = new URLSearchParams(searchParams.toString());
    const today = new Date();
    const from = new Date(today);

    params.set("from", today.toISOString().slice(0, 10));

    if (period === "today") {
      params.set("to", today.toISOString().slice(0, 10));
    } else if (period === "week") {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      params.set("to", end.toISOString().slice(0, 10));
    } else {
      from.setDate(1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      params.set("from", from.toISOString().slice(0, 10));
      params.set("to", end.toISOString().slice(0, 10));
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-3 h-12">
      <SearchInput
        placeholder={t.appointments.searchPlaceholder}
        className="relative w-[200px]"
      />
      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(value) => updateParam("status", value)}
      >
        <SelectTrigger
          className="w-[160px]"
          aria-label={t.common.filterByStatus}
        >
          <SelectValue placeholder={t.common.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.common.allStatuses}</SelectItem>
          <SelectItem value="scheduled">
            {t.statuses.appointment.scheduled}
          </SelectItem>
          <SelectItem value="confirmed">
            {t.statuses.appointment.confirmed}
          </SelectItem>
          <SelectItem value="completed">
            {t.statuses.appointment.completed}
          </SelectItem>
          <SelectItem value="cancelled">
            {t.statuses.appointment.cancelled}
          </SelectItem>
          <SelectItem value="no_show">
            {t.statuses.appointment.no_show}
          </SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickPeriod("today")}
        >
          {t.appointments.today}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickPeriod("week")}
        >
          {t.appointments.thisWeek}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickPeriod("month")}
        >
          {t.appointments.thisMonth}
        </Button>
      </div>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <CalendarDays className="size-4 mr-1" />
            {t.appointments.customPeriod}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 space-y-3" align="start">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t.appointments.dateFrom}
            </label>
            <Input
              type="date"
              defaultValue={searchParams.get("from") ?? ""}
              onChange={(e) => updateParam("from", e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t.appointments.dateTo}
            </label>
            <Input
              type="date"
              defaultValue={searchParams.get("to") ?? ""}
              onChange={(e) => updateParam("to", e.target.value)}
              className="w-[160px]"
            />
          </div>
        </PopoverContent>
      </Popover>
      <span className="ml-auto text-[13px] text-muted-foreground">
        {t.appointments.totalCount.replace("{count}", String(totalCount))}
      </span>
    </div>
  );
}
