"use client";

import { useProfessionalI18n } from "@/lib/i18n/pro";
import { RADIUS, SHADOW } from "@/lib/design-tokens";
import { STAT_COLORS } from "../_lib/agenda-constants";

interface AttendanceStatsProps {
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    waiting: number;
  };
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const { t } = useProfessionalI18n();

  const items = [
    { key: "total" as const, label: t.agenda.totalRDV },
    { key: "present" as const, label: t.agenda.present },
    { key: "late" as const, label: t.agenda.attendance.late },
    { key: "absent" as const, label: t.agenda.absent },
    { key: "waiting" as const, label: t.agenda.pendingLabel },
  ];

  return (
    <div className={`flex items-center overflow-x-auto border border-border/60 divide-x divide-border/60 ${RADIUS.card} ${SHADOW.card}`}>
      {items.map((item) => (
        <div key={item.key} className="flex flex-col items-center px-3 py-2 whitespace-nowrap sm:flex-row sm:gap-2 sm:px-4">
          <span className={`text-base font-bold tabular-nums sm:text-lg ${STAT_COLORS[item.key]}`}>
            {stats[item.key]}
          </span>
          <span className="text-[10px] text-muted-foreground sm:text-[11px]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
