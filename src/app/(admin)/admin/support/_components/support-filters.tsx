"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
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
import { SlidersHorizontal, X } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface SupportFiltersProps {
  totalCount: number;
}

export function SupportFilters({ totalCount }: SupportFiltersProps) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("priority") ||
    searchParams.has("type") ||
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
        <SelectItem value="open">{t.statuses.ticket.open}</SelectItem>
        <SelectItem value="in_progress">
          {t.statuses.ticket.in_progress}
        </SelectItem>
        <SelectItem value="awaiting_confirmation">
          {(t.statuses.ticket as Record<string, string>).awaiting_confirmation ?? "Awaiting confirmation"}
        </SelectItem>
        <SelectItem value="resolved">
          {t.statuses.ticket.resolved}
        </SelectItem>
        <SelectItem value="closed">{t.statuses.ticket.closed}</SelectItem>
      </SelectContent>
    </Select>
  );

  const prioritySelect = (
    <Select
      defaultValue={searchParams.get("priority") ?? "all"}
      onValueChange={(value) => updateParam("priority", value)}
    >
      <SelectTrigger
        className="w-full sm:w-[150px] h-9"
        aria-label={t.support.priorityFilter}
      >
        <SelectValue placeholder={t.support.priorityFilter} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t.support.allPriorities}</SelectItem>
        <SelectItem value="low">{t.statuses.priority.low}</SelectItem>
        <SelectItem value="medium">
          {t.statuses.priority.medium}
        </SelectItem>
        <SelectItem value="high">{t.statuses.priority.high}</SelectItem>
        <SelectItem value="urgent">
          {t.statuses.priority.urgent}
        </SelectItem>
      </SelectContent>
    </Select>
  );

  const typeSelect = (
    <Select
      defaultValue={searchParams.get("type") ?? "all"}
      onValueChange={(value) => updateParam("type", value)}
    >
      <SelectTrigger
        className="w-full sm:w-[170px] h-9"
        aria-label={t.support.typeFilter}
      >
        <SelectValue placeholder={t.support.typeFilter} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t.support.allTypes}</SelectItem>
        <SelectItem value="profile_change_request">{t.support.typeChangeRequest}</SelectItem>
        <SelectItem value="general">{t.support.typeGeneral}</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <>
      {/* Desktop */}
      <div
        className="hidden sm:flex items-center gap-2"
        style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "100ms" }}
      >
        <SearchInput
          placeholder={t.support.searchPlaceholder}
          className="relative w-[220px]"
        />
        {statusSelect}
        {prioritySelect}
        {typeSelect}
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
          {t.support.totalCount?.replace("{count}", String(totalCount)) ?? `${totalCount} tickets`}
        </span>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={t.support.searchPlaceholder}
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
        <div className="flex items-center justify-between">
          <span className="text-xs tabular-nums text-muted-foreground">
            {t.support.totalCount?.replace("{count}", String(totalCount)) ?? `${totalCount} tickets`}
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
            {prioritySelect}
            {typeSelect}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
