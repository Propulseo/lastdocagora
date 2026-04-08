"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { cn } from "@/lib/utils";
import { RADIUS, SHADOW } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

export function ServicesFiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useProfessionalI18n();
  const sf = t.services.filters as Record<string, string>;

  const currentStatus = searchParams.get("status") ?? "all";
  const currentSort = searchParams.get("sort") ?? "name";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-3 bg-card px-4 py-3", RADIUS.card, SHADOW.card)}>
      <Suspense>
        <SearchInput
          placeholder={sf.searchPlaceholder}
          paramKey="search"
        />
      </Suspense>

      <Select
        value={currentStatus}
        onValueChange={(v) => updateParam("status", v)}
      >
        <SelectTrigger className={`h-9 w-auto min-w-[130px] ${RADIUS.element}`}>
          <SelectValue placeholder={sf.statusLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{sf.all}</SelectItem>
          <SelectItem value="active">{sf.active}</SelectItem>
          <SelectItem value="inactive">{sf.inactive}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentSort}
        onValueChange={(v) => updateParam("sort", v)}
      >
        <SelectTrigger className={`h-9 w-auto min-w-[160px] ${RADIUS.element}`}>
          <SelectValue placeholder={sf.sortLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name">{sf.sortName}</SelectItem>
          <SelectItem value="price">{sf.sortPrice}</SelectItem>
          <SelectItem value="duration">{sf.sortDuration}</SelectItem>
          <SelectItem value="appointments">{sf.sortAppointments}</SelectItem>
          <SelectItem value="revenue">{sf.sortRevenue}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
