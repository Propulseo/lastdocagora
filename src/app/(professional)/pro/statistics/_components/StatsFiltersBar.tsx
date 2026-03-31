"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  services: ServiceOption[];
  currentRange: string;
  currentService: string;
  currentChannel: string;
}

export function StatsFiltersBar({
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

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("range")) params.set("range", "30d");
    window.open(`/pro/statistics/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 overflow-x-auto whitespace-nowrap">
      {/* Period toggle */}
      <div className="inline-flex items-center rounded-lg bg-muted p-0.5">
        {RANGES.map((range) => (
          <button
            key={range}
            onClick={() => updateParam("range", range)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors min-h-[44px]",
              currentRange === range
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {rangeLabels[range]}
          </button>
        ))}
      </div>

      {/* Service filter */}
      {services.length > 0 && (
        <Select
          value={currentService || "all"}
          onValueChange={(v) => updateParam("service", v)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
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

      {/* Channel filter */}
      <Select
        value={currentChannel || "all"}
        onValueChange={(v) => updateParam("channel", v)}
      >
        <SelectTrigger className="h-9 w-auto min-w-[120px]">
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
  );
}
