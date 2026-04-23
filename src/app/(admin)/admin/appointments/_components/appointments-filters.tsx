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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CalendarDays, SlidersHorizontal, X } from "lucide-react";
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
  const [filterOpen, setFilterOpen] = useState(false);

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("from") ||
    searchParams.has("to") ||
    searchParams.has("search");

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

  function clearFilters() {
    router.push(pathname);
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

  const statusSelect = (
    <Select
      defaultValue={searchParams.get("status") ?? "all"}
      onValueChange={(value) => updateParam("status", value)}
    >
      <SelectTrigger
        className="w-full sm:w-[150px] h-9"
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
  );

  const quickPeriodButtons = (
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-9 min-h-[44px] sm:min-h-0 whitespace-nowrap"
        onClick={() => setQuickPeriod("today")}
      >
        {t.appointments.today}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 min-h-[44px] sm:min-h-0 whitespace-nowrap"
        onClick={() => setQuickPeriod("week")}
      >
        {t.appointments.thisWeek}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 min-h-[44px] sm:min-h-0 whitespace-nowrap"
        onClick={() => setQuickPeriod("month")}
      >
        {t.appointments.thisMonth}
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <div
        className="hidden sm:flex items-center gap-2"
        style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "100ms" }}
      >
        <SearchInput
          placeholder={t.appointments.searchPlaceholder}
          className="relative w-[200px]"
        />
        {statusSelect}
        {quickPeriodButtons}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <CalendarDays className="size-3.5 mr-1" />
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
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="size-3.5 mr-1" />
            {t.common.clearFilters}
          </Button>
        )}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {t.appointments.totalCount.replace("{count}", String(totalCount))}
        </span>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={t.appointments.searchPlaceholder}
            className="relative flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] shrink-0"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="size-4 mr-1.5" />
            {t.mobile.filterButton}
          </Button>
        </div>
        <div className="overflow-x-auto">
          {quickPeriodButtons}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">
            {t.appointments.totalCount.replace("{count}", String(totalCount))}
          </span>
          {hasFilters && (
            <button
              className="text-xs text-muted-foreground underline underline-offset-2"
              onClick={clearFilters}
            >
              {t.common.clearFilters}
            </button>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>{t.mobile.filterButton}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {statusSelect}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                {t.appointments.dateFrom}
              </label>
              <Input
                type="date"
                defaultValue={searchParams.get("from") ?? ""}
                onChange={(e) => updateParam("from", e.target.value)}
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
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
