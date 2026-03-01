"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro";

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

  const a = t.agenda;

  return (
    <Card>
      <CardContent>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">{a.attendanceRate}</p>
          <p className="text-sm font-bold">{rate}%</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {stats.present + stats.late} {stats.present + stats.late !== 1 ? a.presentPlural : a.presentSingular} {a.inWord}{" "}
          {checked} {checked !== 1 ? a.pastRDVPlural : a.pastRDVSingular}
          {stats.waiting > 0 && ` (${stats.waiting} ${stats.waiting !== 1 ? a.pendingPlural : a.pendingSingular})`}
        </p>
      </CardContent>
    </Card>
  );
}
