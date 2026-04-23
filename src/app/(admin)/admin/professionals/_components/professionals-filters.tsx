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
import { translateSpecialty } from "@/locales/patient/specialties";

interface ProfessionalsFiltersProps {
  specialties: string[];
  cities: string[];
  totalCount: number;
}

export function ProfessionalsFilters({
  specialties,
  cities,
  totalCount,
}: ProfessionalsFiltersProps) {
  const { t, locale } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("specialty") ||
    searchParams.has("city") ||
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
        <SelectItem value="pending">
          {t.statuses.verification.pending}
        </SelectItem>
        <SelectItem value="verified">
          {t.statuses.verification.verified}
        </SelectItem>
        <SelectItem value="rejected">
          {t.statuses.verification.rejected}
        </SelectItem>
      </SelectContent>
    </Select>
  );

  const specialtySelect = (
    <Select
      defaultValue={searchParams.get("specialty") ?? "all"}
      onValueChange={(value) => updateParam("specialty", value)}
    >
      <SelectTrigger
        className="w-full sm:w-[170px] h-9"
        aria-label={t.professionals.specialtyFilter}
      >
        <SelectValue placeholder={t.professionals.specialtyFilter} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          {t.professionals.allSpecialties}
        </SelectItem>
        {specialties.map((s) => (
          <SelectItem key={s} value={s}>
            {translateSpecialty(s, locale) ?? s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const citySelect = (
    <Select
      defaultValue={searchParams.get("city") ?? "all"}
      onValueChange={(value) => updateParam("city", value)}
    >
      <SelectTrigger
        className="w-full sm:w-[150px] h-9"
        aria-label={t.professionals.cityFilter}
      >
        <SelectValue placeholder={t.professionals.cityFilter} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t.professionals.allCities}</SelectItem>
        {cities.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
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
          placeholder={t.professionals.searchPlaceholder}
          className="relative w-[220px]"
        />
        {statusSelect}
        {specialtySelect}
        {citySelect}
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
          {t.professionals.totalCount.replace("{count}", String(totalCount))}
        </span>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={t.professionals.searchPlaceholder}
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
            {t.professionals.totalCount.replace("{count}", String(totalCount))}
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
            {specialtySelect}
            {citySelect}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
