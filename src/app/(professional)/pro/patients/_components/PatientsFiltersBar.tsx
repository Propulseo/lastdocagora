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
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

interface PatientsFiltersBarProps {
  insuranceProviders: string[];
}

export function PatientsFiltersBar({
  insuranceProviders,
}: PatientsFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useProfessionalI18n();
  const pf = t.patients.filters as Record<string, string>;
  const insuranceLabels = t.patients.insuranceLabels as Record<string, string>;

  const currentStatus = searchParams.get("status") ?? "all";
  const currentInsurance = searchParams.get("insurance") ?? "all";
  const currentSort = searchParams.get("sort") ?? "last";

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
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <Suspense>
        <SearchInput
          placeholder={t.patients.searchPlaceholder}
          paramKey="search"
          minLength={3}
        />
      </Suspense>

      {/* Status filter */}
      <Select
        value={currentStatus}
        onValueChange={(v) => updateParam("status", v)}
      >
        <SelectTrigger className="h-9 w-auto min-w-[130px]">
          <SelectValue placeholder={pf.statusLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{pf.all}</SelectItem>
          <SelectItem value="active">{pf.active}</SelectItem>
          <SelectItem value="inactive">{pf.inactive}</SelectItem>
          <SelectItem value="new">{pf.new}</SelectItem>
        </SelectContent>
      </Select>

      {/* Insurance filter */}
      {insuranceProviders.length > 0 && (
        <Select
          value={currentInsurance}
          onValueChange={(v) => updateParam("insurance", v)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue placeholder={pf.insuranceLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{pf.allInsurance}</SelectItem>
            {insuranceProviders.map((p) => (
              <SelectItem key={p} value={p}>
                {insuranceLabels[p] ?? p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort */}
      <Select
        value={currentSort}
        onValueChange={(v) => updateParam("sort", v)}
      >
        <SelectTrigger className="h-9 w-auto min-w-[160px]">
          <SelectValue placeholder={pf.sortLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="last">{pf.sortLast}</SelectItem>
          <SelectItem value="name">{pf.sortName}</SelectItem>
          <SelectItem value="total">{pf.sortTotal}</SelectItem>
          <SelectItem value="attendance">{pf.sortAttendance}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
