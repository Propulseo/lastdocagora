"use client";

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
import { X } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

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
  const { t } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div className="flex items-center gap-3 h-12">
      <SearchInput
        placeholder={t.professionals.searchPlaceholder}
        className="relative w-[240px]"
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
      <Select
        defaultValue={searchParams.get("specialty") ?? "all"}
        onValueChange={(value) => updateParam("specialty", value)}
      >
        <SelectTrigger
          className="w-[180px]"
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
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("city") ?? "all"}
        onValueChange={(value) => updateParam("city", value)}
      >
        <SelectTrigger
          className="w-[160px]"
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
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="size-4" />
          {t.common.clearFilters}
        </Button>
      )}
      <span className="ml-auto text-[13px] text-muted-foreground">
        {t.professionals.totalCount.replace("{count}", String(totalCount))}
      </span>
    </div>
  );
}
