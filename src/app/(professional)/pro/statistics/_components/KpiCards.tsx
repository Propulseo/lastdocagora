"use client";

import {
  CalendarCheck,
  UserCheck,
  UserX,
  XCircle,
  Clock,
  UserPlus,
  CalendarDays,
  Timer,
  Hourglass,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { SmallSampleWarning } from "./SmallSampleWarning";

export interface KpiData {
  totalAppointments: number;
  attendanceRate: number;
  attendanceTotal: number;
  noShowRate: number;
  noShowCount: number;
  cancellationRate: number;
  cancelledCount: number;
  avgLateMinutes: number;
  pctLate: number;
  newPatientsPct: number;
  newPatientsCount: number;
  returningPatientsCount: number;
  totalInRange: number;
  totalWithAttendance: number;
  avgGapMinutes: number;
  billableHours: number;
  occupancyRate: number;
  walkInCount: number;
}

export function KpiCards({ data }: { data: KpiData }) {
  const { t } = useProfessionalI18n();

  const hasAttendance = data.totalWithAttendance > 0;

  const cards = [
    {
      label: t.statistics.kpi.totalAppointments,
      value: String(data.totalAppointments),
      icon: CalendarCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: t.statistics.kpi.attendanceRate,
      value: hasAttendance ? `${data.attendanceRate}%` : "—",
      sub: hasAttendance
        ? `(${data.attendanceTotal - data.noShowCount}/${data.attendanceTotal})`
        : undefined,
      icon: UserCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      needsAttendance: !hasAttendance,
      sampleCount: data.totalWithAttendance,
    },
    {
      label: t.statistics.kpi.noShowRate,
      value: `${data.noShowRate}%`,
      sub: `(${data.noShowCount}/${data.totalAppointments})`,
      icon: UserX,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: t.statistics.kpi.cancellationRate,
      value: `${data.cancellationRate}%`,
      sub: `(${data.cancelledCount}/${data.totalAppointments})`,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: t.statistics.kpi.lateness,
      value: hasAttendance ? `${data.avgLateMinutes} min` : "—",
      sub: hasAttendance
        ? t.statistics.kpi.pctLate.replace(
            "{{value}}",
            String(data.pctLate),
          )
        : undefined,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      needsAttendance: !hasAttendance,
      sampleCount: data.totalWithAttendance,
    },
    {
      label: t.statistics.kpi.newPatients,
      value: `${data.newPatientsPct}%`,
      sub: t.statistics.kpi.newVsReturning
        .replace("{{new}}", String(data.newPatientsCount))
        .replace("{{returning}}", String(data.returningPatientsCount)),
      icon: UserPlus,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: t.statistics.kpi.avgGap ?? "Tempo entre consultas",
      value: `${data.avgGapMinutes} min`,
      sub: t.statistics.kpi.avgGapSub ?? "Tempo médio de intervalo",
      icon: Timer,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
    },
    {
      label: t.statistics.kpi.billableHours ?? "Horas faturáveis",
      value: `${data.billableHours}h`,
      sub: t.statistics.kpi.billableHoursSub ?? "Consultas realizadas",
      icon: Hourglass,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: t.statistics.kpi.occupancyRate ?? "Taxa de ocupação",
      value: `${data.occupancyRate}%`,
      icon: Percent,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      label: (t.statistics.kpi as Record<string, string>).walkInCount ?? "Walk-ins",
      value: String(data.walkInCount),
      sub: (t.statistics.kpi as Record<string, string>).walkInCountSub ?? "No período selecionado",
      icon: UserPlus,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <div className={`rounded-lg p-1.5 ${card.bg}`}>
                <card.icon className={`size-4 ${card.color}`} />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight">
                {card.value}
              </span>
              {card.sub && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {card.sub}
                </span>
              )}
            </div>
            {card.needsAttendance && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" />
                <span>{t.statistics.kpi.noAttendanceData}</span>
              </div>
            )}
            {!card.needsAttendance && card.sampleCount !== undefined && (
              <SmallSampleWarning count={card.sampleCount} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
