"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

interface PendingBannerHeaderProps {
  count: number;
  expanded: boolean;
  onToggle: () => void;
  onConfirmAll: () => void;
  t: {
    agenda: {
      appointmentSingular: string;
      appointmentPlural: string;
      pendingSingular: string;
      pendingPlural: string;
      pendingBanner: {
        confirmAll: string;
      };
    };
  };
}

/* ─── Header component ─── */

export function PendingBannerHeader({
  count,
  expanded,
  onToggle,
  onConfirmAll,
  t,
}: PendingBannerHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-4 py-3 text-left min-h-[44px] cursor-pointer"
    >
      <div className="relative">
        <AlertCircle className="size-5 shrink-0 text-orange-600 dark:text-orange-400" />
        {/* Pulse dot */}
        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-red-500 animate-pulse" />
      </div>

      <span className="flex-1 text-sm font-semibold text-orange-800 dark:text-orange-200">
        {count}{" "}
        {count === 1
          ? t.agenda.appointmentSingular
          : t.agenda.appointmentPlural}{" "}
        {count === 1
          ? t.agenda.pendingSingular
          : t.agenda.pendingPlural}
      </span>

      {count > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/40 min-h-[44px]"
          onClick={(e) => {
            e.stopPropagation();
            onConfirmAll();
          }}
        >
          <CheckCircle className="size-3.5" />
          {t.agenda.pendingBanner.confirmAll.replace(
            "{{count}}",
            String(count),
          )}
        </Button>
      )}

      <ChevronDown
        className={cn(
          "size-4 text-orange-500 transition-transform duration-200",
          expanded && "rotate-180",
        )}
      />
    </button>
  );
}
