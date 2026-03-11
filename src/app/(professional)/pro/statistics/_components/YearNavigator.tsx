"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YearNavigatorProps {
  selectedYear: number;
  minYear: number;
  maxYear: number;
}

export function YearNavigator({
  selectedYear,
  minYear,
  maxYear,
}: YearNavigatorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (year: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (year === new Date().getFullYear()) {
        params.delete("year");
      } else {
        params.set("year", String(year));
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const canGoBack = selectedYear > minYear;
  const canGoForward = selectedYear < maxYear;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-muted p-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!canGoBack}
        onClick={() => navigate(selectedYear - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[4ch] text-center text-sm font-semibold tabular-nums">
        {selectedYear}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        disabled={!canGoForward}
        onClick={() => navigate(selectedYear + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
