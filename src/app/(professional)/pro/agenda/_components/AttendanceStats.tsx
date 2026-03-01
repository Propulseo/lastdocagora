"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Clock, UserCheck, UserMinus, UserX } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";

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

  const statCards = [
    {
      key: "total" as const,
      label: t.agenda.totalRDV,
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      key: "present" as const,
      label: t.agenda.present,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      key: "late" as const,
      label: t.agenda.attendance.late,
      icon: UserMinus,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      key: "absent" as const,
      label: t.agenda.absent,
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      key: "waiting" as const,
      label: t.agenda.pendingLabel,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        {t.agenda.attendanceOfDay}
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats[card.key]}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
