"use client";

import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface LockedFieldProps {
  label: string;
  value: string | null | undefined;
  fallbackLabel: string;
}

export function LockedField({ label, value, fallbackLabel }: LockedFieldProps) {
  const { t } = useProfessionalI18n();

  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1.5 text-right text-sm font-medium text-muted-foreground/60">
              {value || fallbackLabel}
              <Lock className="size-3.5 shrink-0" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-center">
            <p>{t.profile.lockedFieldTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
