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
import { SlidersHorizontal } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

export function SupportFilters() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

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

  const statusSelect = (
    <Select
      defaultValue={searchParams.get("status") ?? "all"}
      onValueChange={(value) => updateParam("status", value)}
    >
      <SelectTrigger
        className="w-full sm:w-[160px]"
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
        className="w-full sm:w-[160px]"
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

  return (
    <div className="rounded-xl border bg-card p-3 shadow-[var(--shadow-card)]">
      {/* Desktop filters */}
      <div className="hidden sm:flex flex-wrap items-center gap-3">
        <SearchInput placeholder={t.support.searchPlaceholder} />
        {statusSelect}
        {prioritySelect}
      </div>

      {/* Mobile filters */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={t.support.searchPlaceholder}
            className="flex-1"
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
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
