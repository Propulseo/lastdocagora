"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

const RANGES = ["7d", "30d", "90d", "1y"] as const;
type StatsRange = (typeof RANGES)[number];

interface ServiceOption {
  id: string;
  name: string;
}

interface StatsFiltersBarProps {
  yearNavigator?: React.ReactNode;
  services: ServiceOption[];
  currentRange: string;
  currentService: string;
  currentChannel: string;
}

export function StatsFiltersBar({
  yearNavigator,
  services,
  currentRange,
  currentService,
  currentChannel,
}: StatsFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useProfessionalI18n();

  const rangeLabels: Record<StatsRange, string> = {
    "7d": t.statistics.range["7d"],
    "30d": t.statistics.range["30d"],
    "90d": t.statistics.range["90d"],
    "1y": t.statistics.range["1y"] ?? "1 an",
  };

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:space-y-0">
      {/* Year nav + Period pills — one scrollable row on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:gap-3 sm:overflow-visible">
        {yearNavigator}
        <div className="contents sm:inline-flex sm:items-center sm:rounded-lg sm:bg-muted sm:p-0.5">
          {RANGES.map((range) => (
            <button
              key={range}
              onClick={() => updateParam("range", range)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all active:scale-95",
                "sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-sm",
                currentRange === range
                  ? "bg-primary text-primary-foreground sm:bg-background sm:text-foreground sm:shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground sm:bg-transparent",
              )}
            >
              {rangeLabels[range]}
            </button>
          ))}
        </div>
      </div>

      {/* Selects — grid 2 cols on mobile, inline on desktop */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
        {services.length > 0 && (
          <Select
            value={currentService || "all"}
            onValueChange={(v) => updateParam("service", v)}
          >
            <SelectTrigger className="h-8 text-xs sm:h-9 sm:w-auto sm:min-w-[140px] sm:text-sm">
              <SelectValue placeholder={t.statistics.filters.allServices} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t.statistics.filters.allServices}
              </SelectItem>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={currentChannel || "all"}
          onValueChange={(v) => updateParam("channel", v)}
        >
          <SelectTrigger className="h-8 text-xs sm:h-9 sm:w-auto sm:min-w-[120px] sm:text-sm">
            <SelectValue placeholder={t.statistics.filters.allChannels} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t.statistics.filters.allChannels}
            </SelectItem>
            <SelectItem value="patient_booking">
              {t.statistics.filters.channelPatient}
            </SelectItem>
            <SelectItem value="manual">
              {t.statistics.filters.channelManual}
            </SelectItem>
            <SelectItem value="walk_in">
              {(t.statistics.filters as Record<string, string>).channelWalkIn ?? "Walk-in"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
