"use client";

import { useProfessionalI18n } from "@/lib/i18n/pro";
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
    <div className="flex items-center overflow-x-auto rounded-lg border border-border/60 divide-x divide-border/60">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2 px-4 py-2 whitespace-nowrap">
          <span className={`text-lg font-bold tabular-nums ${STAT_COLORS[item.key]}`}>
            {stats[item.key]}
          </span>
          <span className="text-[11px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
