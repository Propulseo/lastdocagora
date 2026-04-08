"use client";

import { AlertTriangle } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { RADIUS } from "@/lib/design-tokens";

interface SmallSampleWarningProps {
  count: number;
  threshold?: number;
}

export function SmallSampleWarning({
  count,
  threshold = 5,
}: SmallSampleWarningProps) {
  const { t } = useProfessionalI18n();

  if (count >= threshold) return null;

  return (
    <div className={`flex items-center gap-1.5 ${RADIUS.badge} bg-amber-500/10 px-2 py-1 text-xs text-amber-500`}>
      <AlertTriangle className="size-3" />
      <span>
        {t.statistics.kpi.sampleWarning.replace(
          "{{count}}",
          String(count),
        )}
      </span>
    </div>
  );
}
