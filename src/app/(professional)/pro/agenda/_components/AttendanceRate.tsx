"use client";

import { useProfessionalI18n } from "@/lib/i18n/pro";
import { RADIUS, SHADOW } from "@/lib/design-tokens";

interface AttendanceRateProps {
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    waiting: number;
  };
}

export function AttendanceRate({ stats }: AttendanceRateProps) {
  const { t } = useProfessionalI18n();

  const checked = stats.present + stats.late + stats.absent;
  const rate = checked > 0 ? Math.round(((stats.present + stats.late) / checked) * 100) : 0;

  const barColor =
    rate > 70 ? "bg-green-500" : rate >= 40 ? "bg-orange-500" : "bg-red-500";
  const textColor =
    rate > 70 ? "text-green-400" : rate >= 40 ? "text-orange-400" : "text-red-400";

  const a = t.agenda;

  return (
    <div className={`border border-border/60 px-3 py-2 sm:px-4 sm:py-3 ${RADIUS.card} ${SHADOW.card}`}>
      <div className="flex items-center gap-3">
        <p className="hidden text-sm font-medium sm:block">{a.attendanceRate}</p>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted sm:mt-0">
          <div
            className={`h-full rounded-full ${barColor} transition-all duration-300`}
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className={`shrink-0 text-sm font-bold ${textColor}`}>{rate}%</p>
      </div>
      <p className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
        {stats.present + stats.late} {stats.present + stats.late !== 1 ? a.presentPlural : a.presentSingular} {a.inWord}{" "}
        {checked} {checked !== 1 ? a.pastRDVPlural : a.pastRDVSingular}
        {stats.waiting > 0 && ` (${stats.waiting} ${stats.waiting !== 1 ? a.pendingPlural : a.pendingSingular})`}
      </p>
    </div>
  );
}
